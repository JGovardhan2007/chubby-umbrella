"""Historical Event Replay Engine.
Replays a multi-sensor storm event sequentially as if observations arrive in real-time.
"""

from __future__ import annotations
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional
import json
import time

from ..config import load_config
from ..fusion.grid import CommonGrid
from ..fusion.spatiotemporal import MultiSourceFusionEngine, FusedFrame
from ..ingestion.radar import RadarLoader
from ..ingestion.satellite import SatelliteLoader
from ..ingestion.lightning import LightningLoader
from ..ingestion.weather import WeatherLoader
from ..detection.convective_initiation import ConvectiveInitiationDetector, CandidateCell
from ..tracking.tracker import StormTracker
from ..tracking.storm_cell import StormCell
from ..nowcast.engine import NowcastEngine, NowcastHorizonForecast
from ..nowcast.arrival_time import calculate_storm_arrival_for_location, LocationStormArrivalSummary
from ..hazards.lightning_hazard import LightningHazardEstimator
from ..hazards.hail_hazard import HailHazardEstimator
from ..hazards.wind_hazard import DownburstHazardEstimator
from ..hazards.cloudburst_hazard import CloudburstHazardEstimator
from ..geojson.exporter import (
    export_storm_cells_geojson,
    export_nowcast_tracks_geojson,
    export_arrival_eta_geojson
)


@dataclass
class ReplayStepResult:
    """Consolidated state output for a single historical replay time step."""
    step_index: int
    timestamp: datetime
    detected_candidates: List[CandidateCell]
    tracked_storms: List[StormCell]
    nowcasts: Dict[int, NowcastHorizonForecast]
    site_eta: Optional[LocationStormArrivalSummary]
    geojson_storms: Dict[str, Any]
    geojson_forecast_tracks: Dict[str, Any]
    geojson_site_eta: Optional[Dict[str, Any]]
    qc_summary: Dict[str, Any]


class HistoricalReplayEngine:
    """Orchestrates end-to-end convective nowcasting replay for hackathon demonstrations and evaluation."""

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or load_config()
        self.grid = CommonGrid.from_config(self.config)

        # Initialize core components
        self.fusion_engine = MultiSourceFusionEngine(self.grid, self.config)
        self.radar_loader = RadarLoader()
        self.sat_loader = SatelliteLoader()
        self.ltg_loader = LightningLoader()
        self.weather_loader = WeatherLoader()

        self.ci_detector = ConvectiveInitiationDetector(self.config)
        self.tracker = StormTracker(self.config)
        self.nowcast_engine = NowcastEngine(self.config)

        self.ltg_hazards = LightningHazardEstimator(self.config)
        self.hail_hazards = HailHazardEstimator(self.config)
        self.wind_hazards = DownburstHazardEstimator(self.config)
        self.cb_hazards = CloudburstHazardEstimator(self.config)

        self.previous_frame: Optional[FusedFrame] = None

    def run_replay(
        self,
        manifest_or_dir: str | Path,
        target_site: Optional[Tuple[float, float, str]] = (13.0827, 80.2707, "Chennai_City"),
        output_geojson_dir: Optional[str | Path] = None,
        step_callback: Optional[Callable[[ReplayStepResult], None]] = None,
        delay_seconds: float = 0.0
    ) -> List[ReplayStepResult]:
        """Execute historical replay sequentially step-by-step."""
        path = Path(manifest_or_dir)
        if path.is_file() and path.suffix == ".json":
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
                frames = data.get("manifest", data)
        elif path.is_dir():
            # Look for replay_sequence_manifest.json or sort files
            manifest_file = path / "replay_sequence_manifest.json"
            if manifest_file.exists():
                with open(manifest_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    frames = data.get("manifest", data)
            else:
                raise FileNotFoundError(f"No manifest found in directory: {path}")
        else:
            raise FileNotFoundError(f"Invalid replay source path: {path}")

        results: List[ReplayStepResult] = []
        if output_geojson_dir:
            out_geojson_path = Path(output_geojson_dir)
            out_geojson_path.mkdir(parents=True, exist_ok=True)

        for step_idx, frame_meta in enumerate(frames):
            ts = datetime.fromisoformat(frame_meta["timestamp"])

            # 1. Ingestion
            radar_grid = None
            if "radar_path" in frame_meta and Path(frame_meta["radar_path"]).exists():
                radar_grid = self.radar_loader.load(frame_meta["radar_path"])

            sat_grid = None
            if "satellite_path" in frame_meta and Path(frame_meta["satellite_path"]).exists():
                sat_grid = self.sat_loader.load(frame_meta["satellite_path"])

            ltg_points = None
            if "lightning_path" in frame_meta and Path(frame_meta["lightning_path"]).exists():
                ltg_points = self.ltg_loader.load(frame_meta["lightning_path"])

            weather_points = None
            if "weather_path" in frame_meta and Path(frame_meta["weather_path"]).exists():
                weather_points = self.weather_loader.load(frame_meta["weather_path"])

            # 2. Multi-source Spatio-Temporal Fusion
            fused_frame = self.fusion_engine.fuse_frame(
                timestamp=ts,
                radar_reflectivity=radar_grid,
                satellite_bt=sat_grid,
                lightning=ltg_points,
                surface_weather=weather_points,
                previous_frame=self.previous_frame,
                time_delta_minutes=10.0
            )

            # 3. Convective Initiation Detection
            candidates = self.ci_detector.detect(fused_frame)

            # 4. Storm Cell Identification and Kinematic Tracking
            active_storms = self.tracker.update(candidates, ts)

            # 5. Pre-compute hazards for each storm
            hazards_by_storm = {}
            for stm in active_storms:
                hazards_by_storm[stm.storm_id] = [
                    self.ltg_hazards.estimate_storm_hazard(stm, fused_frame),
                    self.hail_hazards.estimate_storm_hazard(stm, fused_frame),
                    self.wind_hazards.estimate_storm_hazard(stm, fused_frame),
                    self.cb_hazards.estimate_storm_hazard(stm, fused_frame)
                ]

            # 6. 0–6 Hour Nowcast Prediction
            nowcasts = self.nowcast_engine.generate_nowcast(active_storms, fused_frame)

            # 7. Storm Arrival Time / Site Hazard ETA
            site_summary = None
            if target_site:
                site_summary = calculate_storm_arrival_for_location(
                    target_lat=target_site[0],
                    target_lon=target_site[1],
                    storms=active_storms,
                    hazards_by_storm=hazards_by_storm,
                    current_time=ts,
                    target_label=target_site[2]
                )

            # 8. GeoJSON Generation
            geojson_storms = export_storm_cells_geojson(active_storms, hazards_by_storm)
            geojson_tracks = export_nowcast_tracks_geojson(nowcasts)
            geojson_eta = export_arrival_eta_geojson(site_summary) if site_summary else None

            if output_geojson_dir:
                tag = ts.strftime("%Y%m%d_%H%M%S")
                with open(out_geojson_path / f"storms_{tag}.geojson", "w", encoding="utf-8") as f:
                    json.dump(geojson_storms, f, indent=2)
                with open(out_geojson_path / f"nowcast_{tag}.geojson", "w", encoding="utf-8") as f:
                    json.dump(geojson_tracks, f, indent=2)
                if geojson_eta:
                    with open(out_geojson_path / f"site_eta_{tag}.geojson", "w", encoding="utf-8") as f:
                        json.dump(geojson_eta, f, indent=2)

            qc_summary = fused_frame.qc_report.to_dict() if fused_frame.qc_report else {}

            step_res = ReplayStepResult(
                step_index=step_idx,
                timestamp=ts,
                detected_candidates=candidates,
                tracked_storms=active_storms,
                nowcasts=nowcasts,
                site_eta=site_summary,
                geojson_storms=geojson_storms,
                geojson_forecast_tracks=geojson_tracks,
                geojson_site_eta=geojson_eta,
                qc_summary=qc_summary
            )
            results.append(step_res)

            # Update previous frame for next iteration's temporal features
            self.previous_frame = fused_frame

            if step_callback:
                step_callback(step_res)

            if delay_seconds > 0:
                time.sleep(delay_seconds)

        return results
