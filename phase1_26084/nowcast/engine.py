"""0–6 Hour Convective-Scale Nowcasting Engine."""

from __future__ import annotations
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
import numpy as np

from ..tracking.storm_cell import StormCell
from ..hazards.base import HazardEstimate
from ..hazards.lightning_hazard import LightningHazardEstimator
from ..hazards.hail_hazard import HailHazardEstimator
from ..hazards.wind_hazard import DownburstHazardEstimator
from ..hazards.cloudburst_hazard import CloudburstHazardEstimator
from ..fusion.spatiotemporal import FusedFrame
from .uncertainty import ObservationStatus, compute_lead_time_uncertainty


@dataclass
class PredictedStormCell:
    """Predicted storm cell state at a specific future lead time."""
    storm_id: str
    lead_time_minutes: int
    valid_time: datetime
    predicted_lat: float
    predicted_lon: float
    predicted_area_km2: float
    predicted_intensity_dbz: float
    confidence: float
    uncertainty_radius_km: float
    status: ObservationStatus
    hazard_probabilities: Dict[str, float]
    predicted_polygon: List[List[float]] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "storm_id": self.storm_id,
            "lead_time_minutes": self.lead_time_minutes,
            "valid_time": self.valid_time.isoformat(),
            "predicted_lat": round(self.predicted_lat, 4),
            "predicted_lon": round(self.predicted_lon, 4),
            "predicted_area_km2": round(self.predicted_area_km2, 2),
            "predicted_intensity_dbz": round(self.predicted_intensity_dbz, 2),
            "confidence": round(self.confidence, 3),
            "uncertainty_radius_km": round(self.uncertainty_radius_km, 2),
            "status": self.status.value,
            "hazard_probabilities": {k: round(v, 3) for k, v in self.hazard_probabilities.items()}
        }


@dataclass
class NowcastHorizonForecast:
    """Consolidated forecast output for a specific lead-time horizon."""
    lead_time_minutes: int
    issue_time: datetime
    valid_time: datetime
    status: ObservationStatus
    mean_confidence: float
    predicted_storms: List[PredictedStormCell] = field(default_factory=list)

    @property
    def storm_count(self) -> int:
        return len(self.predicted_storms)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "lead_time_minutes": self.lead_time_minutes,
            "issue_time": self.issue_time.isoformat(),
            "valid_time": self.valid_time.isoformat(),
            "status": self.status.value,
            "mean_confidence": round(self.mean_confidence, 3),
            "storm_count": self.storm_count,
            "storms": [s.to_dict() for s in self.predicted_storms]
        }


class NowcastEngine:
    """Generates 0–6 hour multi-horizon convective storm and hazard nowcasts."""

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        nc_cfg = self.config.get("nowcast", {})
        self.horizons_minutes = nc_cfg.get("horizons_minutes", [15, 30, 60, 120, 180, 240, 300, 360])
        self.decay_rate = nc_cfg.get("uncertainty_decay_rate_per_hour", 0.12)

        # Hazard modules
        self.lightning_estimator = LightningHazardEstimator(self.config)
        self.hail_estimator = HailHazardEstimator(self.config)
        self.wind_estimator = DownburstHazardEstimator(self.config)
        self.cloudburst_estimator = CloudburstHazardEstimator(self.config)

    def generate_nowcast(
        self,
        current_storms: List[StormCell],
        current_frame: FusedFrame
    ) -> Dict[int, NowcastHorizonForecast]:
        """Generate forecasts across all defined horizons (0 to 6 hours)."""
        nowcasts: Dict[int, NowcastHorizonForecast] = {}
        issue_time = current_frame.timestamp

        # Pre-compute current hazards for each storm
        current_hazards: Dict[str, Dict[str, float]] = {}
        for storm in current_storms:
            h_ltg = self.lightning_estimator.estimate_storm_hazard(storm, current_frame)
            h_hail = self.hail_estimator.estimate_storm_hazard(storm, current_frame)
            h_wind = self.wind_estimator.estimate_storm_hazard(storm, current_frame)
            h_cb = self.cloudburst_estimator.estimate_storm_hazard(storm, current_frame)

            current_hazards[storm.storm_id] = {
                "lightning": h_ltg.risk_probability,
                "hail": h_hail.risk_probability,
                "downburst": h_wind.risk_probability,
                "cloudburst": h_cb.risk_probability
            }

        for horizon in self.horizons_minutes:
            valid_time = issue_time + timedelta(minutes=horizon)
            dt_hours = horizon / 60.0

            predicted_cells: List[PredictedStormCell] = []
            confidences: List[float] = []

            for storm in current_storms:
                # 1. Extrapolate position using kinematic motion vector
                # dlat = (v * dt) / 111.0, dlon = (u * dt) / (111.0 * cos(lat))
                dlat = (storm.velocity_v_kmh * dt_hours) / 111.0
                cos_lat = np.cos(np.radians(storm.centroid_lat))
                dlon = (storm.velocity_u_kmh * dt_hours) / (111.0 * max(cos_lat, 0.1))

                pred_lat = float(storm.centroid_lat + dlat)
                pred_lon = float(storm.centroid_lon + dlon)

                # 2. Area & Intensity evolution with atmospheric damping
                # Convective storm lifecycle: growth saturates, long lead-times decay towards climatology
                decay_factor = float(np.exp(-0.15 * dt_hours))
                pred_area = max(5.0, (storm.area_km2 + storm.growth_rate_km2_hr * dt_hours * 0.5) * decay_factor)
                pred_intensity = max(20.0, (storm.intensity + storm.intensity_trend_dbz_hr * dt_hours * 0.3) * decay_factor)

                # 3. Uncertainty decay & status
                decayed_conf, unc_radius, status = compute_lead_time_uncertainty(
                    initial_confidence=storm.confidence,
                    lead_time_minutes=horizon,
                    decay_rate_per_hour=self.decay_rate
                )
                confidences.append(decayed_conf)

                # 4. Projected Hazard Probabilities (attenuated by horizon confidence)
                base_risks = current_hazards.get(storm.storm_id, {})
                proj_risks = {k: float(np.clip(v * (decayed_conf / max(storm.confidence, 0.1)), 0.02, 0.98)) for k, v in base_risks.items()}

                # 5. Projected boundary polygon (translated)
                proj_polygon = []
                if storm.polygon_coords:
                    for pt in storm.polygon_coords:
                        proj_polygon.append([round(pt[0] + dlon, 4), round(pt[1] + dlat, 4)])

                predicted_cells.append(PredictedStormCell(
                    storm_id=storm.storm_id,
                    lead_time_minutes=horizon,
                    valid_time=valid_time,
                    predicted_lat=pred_lat,
                    predicted_lon=pred_lon,
                    predicted_area_km2=pred_area,
                    predicted_intensity_dbz=pred_intensity,
                    confidence=decayed_conf,
                    uncertainty_radius_km=unc_radius,
                    status=status,
                    hazard_probabilities=proj_risks,
                    predicted_polygon=proj_polygon
                ))

            # Horizon summary status
            _, _, horizon_status = compute_lead_time_uncertainty(1.0, horizon, self.decay_rate)
            mean_conf = float(np.mean(confidences)) if confidences else 0.0

            nowcasts[horizon] = NowcastHorizonForecast(
                lead_time_minutes=horizon,
                issue_time=issue_time,
                valid_time=valid_time,
                status=horizon_status,
                mean_confidence=mean_conf,
                predicted_storms=predicted_cells
            )

        return nowcasts
