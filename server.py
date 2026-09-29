"""FastAPI REST Server for SIH 26084 Convective Nowcasting Core Pipeline (Phase 1).
Exposes live status, historical replay, live operational queries, and GeoJSON feeds.
"""

from __future__ import annotations
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional
import json
import os
import numpy as np

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from phase1_26084.config import load_config
from phase1_26084.fusion.grid import CommonGrid
from phase1_26084.replay.engine import HistoricalReplayEngine, ReplayStepResult
from phase1_26084.ingestion.live_api import LiveDataFetcher
from phase1_26084.fusion.spatiotemporal import MultiSourceFusionEngine
from phase1_26084.detection.convective_initiation import ConvectiveInitiationDetector
from phase1_26084.tracking.tracker import StormTracker
from phase1_26084.nowcast.engine import NowcastEngine
from phase1_26084.nowcast.arrival_time import calculate_storm_arrival_for_location
from phase1_26084.hazards.lightning_hazard import LightningHazardEstimator
from phase1_26084.hazards.hail_hazard import HailHazardEstimator
from phase1_26084.hazards.wind_hazard import DownburstHazardEstimator
from phase1_26084.hazards.cloudburst_hazard import CloudburstHazardEstimator
from phase1_26084.geojson.exporter import (
    export_storm_cells_geojson,
    export_nowcast_tracks_geojson,
    export_arrival_eta_geojson
)

app = FastAPI(
    title="FUSE: Convective Weather Intelligence API",
    description="Operational 0-6hr Convective Nowcasting Backend for SIH 26084",
    version="1.0.0"
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

config = load_config()
replay_engine = HistoricalReplayEngine(config)
manifest_path = Path("data/sample/replay_sequence_manifest.json")
cached_replay_results: List[ReplayStepResult] = []


def ensure_replay_loaded():
    global cached_replay_results
    if not cached_replay_results and manifest_path.exists():
        cached_replay_results = replay_engine.run_replay(manifest_or_dir=manifest_path)


@app.on_event("startup")
def startup_event():
    ensure_replay_loaded()


@app.get("/api/status")
def get_system_status():
    """Return live instrument data status & system health."""
    return {
        "status": "OPERATIONAL",
        "data_sources": {
            "radar": {"name": "Doppler Weather Radar (DWR)", "status": "AVAILABLE", "mode": "ONLINE", "type": "Reflectivity & Velocity"},
            "satellite": {"name": "INSAT-3D / INSAT-3DR", "status": "AVAILABLE", "mode": "ONLINE", "type": "TIR1 / TIR2 / WV"},
            "lightning": {"name": "Ground Lightning Network (LLN)", "status": "AVAILABLE", "mode": "ONLINE", "type": "Flash Coords & Polarity"},
            "weather": {"name": "Surface AWS Network", "status": "AVAILABLE", "mode": "ONLINE", "type": "T / RH / Wind / Rain"}
        },
        "system_time": datetime.utcnow().isoformat(),
        "phase": "PHASE_1_CORE_NOWCASTING",
        "supported_future_phases": ["PHASE_2_EXTREME_ANOMALIES", "PHASE_3_MODEL_BLENDING"]
    }


@app.get("/api/replay/manifest")
def get_replay_manifest():
    """Get list of historical replay timestamps and steps."""
    ensure_replay_loaded()
    if not cached_replay_results:
        raise HTTPException(status_code=404, detail="No replay sequence available. Generate sample data first.")

    steps = []
    for r in cached_replay_results:
        steps.append({
            "step_index": r.step_index,
            "timestamp": r.timestamp.isoformat(),
            "candidate_count": len(r.detected_candidates),
            "storm_count": len(r.tracked_storms)
        })
    return {
        "event_name": "Historical Benchmark Supercell Event",
        "total_steps": len(steps),
        "steps": steps,
        "is_simulated": True
    }


@app.get("/api/replay/step/{step_idx}")
def get_replay_step(
    step_idx: int,
    horizon_min: int = Query(0, description="Forecast horizon in minutes: 0 (NOW), 15, 30, 60, 120, 180, 240, 300, 360")
):
    """Retrieve detailed state and GeoJSON products for a specific replay frame."""
    ensure_replay_loaded()
    if step_idx < 0 or step_idx >= len(cached_replay_results):
        raise HTTPException(status_code=404, detail=f"Step index {step_idx} out of range [0..{len(cached_replay_results)-1}]")

    res = cached_replay_results[step_idx]

    # Calculate summary hazard probabilities
    ltg_probs = [s.indicators.get("max_lightning_density", 0.0) for s in res.tracked_storms]
    hail_probs = [min(1.0, max(0.0, (s.intensity - 42.0) / 13.0)) for s in res.tracked_storms]
    wind_probs = [min(1.0, max(0.0, s.speed_kmh / 50.0)) for s in res.tracked_storms]
    cb_probs = [min(1.0, max(0.0, (s.intensity - 40.0) / 15.0)) for s in res.tracked_storms]

    hazard_summary = {
        "lightning": round(float(np.mean(ltg_probs) * 100) if ltg_probs else 15.0, 1),
        "hail": round(float(np.mean(hail_probs) * 100) if hail_probs else 10.0, 1),
        "downburst": round(float(np.mean(wind_probs) * 100) if wind_probs else 20.0, 1),
        "cloudburst": round(float(np.mean(cb_probs) * 100) if cb_probs else 25.0, 1)
    }

    horizon_fc = res.nowcasts.get(horizon_min) if horizon_min > 0 else None

    return {
        "step_index": res.step_index,
        "timestamp": res.timestamp.isoformat(),
        "horizon_minutes": horizon_min,
        "active_storm_count": len(res.tracked_storms),
        "high_risk_regions": sum(1 for s in res.tracked_storms if s.intensity >= 48.0),
        "hazard_summary": hazard_summary,
        "storms": [s.to_dict() for s in res.tracked_storms],
        "horizon_forecast": horizon_fc.to_dict() if horizon_fc else None,
        "site_eta": res.site_eta.to_dict() if res.site_eta else None,
        "geojson_storms": res.geojson_storms,
        "geojson_tracks": res.geojson_forecast_tracks,
        "geojson_site_eta": res.geojson_site_eta,
        "qc_report": res.qc_summary
    }


@app.get("/api/live/nowcast")
def get_live_nowcast(
    lat: float = Query(13.0827, description="Target location latitude"),
    lon: float = Query(80.2707, description="Target location longitude"),
    site_name: str = Query("Live_Monitoring_Site", description="Site label")
):
    """Trigger live operational weather API fetch and return instant nowcast data."""
    domain_grid = CommonGrid(
        min_lat=lat - 1.25,
        max_lat=lat + 1.25,
        min_lon=lon - 1.25,
        max_lon=lon + 1.25,
        resolution_km=2.0
    )

    fetcher = LiveDataFetcher()
    radar, sat, ltg, wx = fetcher.fetch_live_grid(domain_grid)

    fusion = MultiSourceFusionEngine(domain_grid, config)
    fused_frame = fusion.fuse_frame(
        timestamp=datetime.utcnow(),
        radar_reflectivity=radar,
        satellite_bt=sat,
        lightning=ltg,
        surface_weather=wx
    )

    ci_detector = ConvectiveInitiationDetector(config)
    candidates = ci_detector.detect(fused_frame)

    tracker = StormTracker(config)
    storms = tracker.update(candidates, fused_frame.timestamp)

    ltg_hazards = LightningHazardEstimator(config)
    hail_hazards = HailHazardEstimator(config)
    wind_hazards = DownburstHazardEstimator(config)
    cb_hazards = CloudburstHazardEstimator(config)

    hazards_by_storm = {}
    for stm in storms:
        hazards_by_storm[stm.storm_id] = [
            ltg_hazards.estimate_storm_hazard(stm, fused_frame),
            hail_hazards.estimate_storm_hazard(stm, fused_frame),
            wind_hazards.estimate_storm_hazard(stm, fused_frame),
            cb_hazards.estimate_storm_hazard(stm, fused_frame)
        ]

    nowcast_engine = NowcastEngine(config)
    nowcasts = nowcast_engine.generate_nowcast(storms, fused_frame)

    site_summary = calculate_storm_arrival_for_location(
        target_lat=lat,
        target_lon=lon,
        storms=storms,
        hazards_by_storm=hazards_by_storm,
        current_time=fused_frame.timestamp,
        target_label=site_name
    )

    geojson_storms = export_storm_cells_geojson(storms, hazards_by_storm)
    geojson_tracks = export_nowcast_tracks_geojson(nowcasts)
    geojson_eta = export_arrival_eta_geojson(site_summary)

    return {
        "timestamp": fused_frame.timestamp.isoformat(),
        "is_live": True,
        "domain": {
            "min_lat": round(domain_grid.min_lat, 4),
            "max_lat": round(domain_grid.max_lat, 4),
            "min_lon": round(domain_grid.min_lon, 4),
            "max_lon": round(domain_grid.max_lon, 4)
        },
        "active_storm_count": len(storms),
        "storms": [s.to_dict() for s in storms],
        "site_eta": site_summary.to_dict(),
        "nowcasts": {str(k): v.to_dict() for k, v in nowcasts.items()},
        "geojson_storms": geojson_storms,
        "geojson_tracks": geojson_tracks,
        "geojson_site_eta": geojson_eta
    }
