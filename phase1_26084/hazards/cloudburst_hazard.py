"""Probabilistic Cloudburst and Extreme Localized Precipitation hazard estimator."""

from __future__ import annotations
from datetime import datetime
from typing import Any, Dict, Optional
import numpy as np
from scipy.ndimage import gaussian_filter

from .base import BaseHazardEstimator, HazardEstimate
from ..tracking.storm_cell import StormCell
from ..fusion.spatiotemporal import FusedFrame


def radar_dbz_to_rain_rate(dbz: float) -> float:
    """Convert radar reflectivity dBZ to instantaneous rain rate R (mm/hr) using standard Marshall-Palmer relation: Z = 200 * R^1.6 -> R = (10^(dBZ/10) / 200)^(1/1.6)."""
    if dbz < 10.0:
        return 0.0
    z_linear = 10.0 ** (dbz / 10.0)
    r = (z_linear / 200.0) ** (1.0 / 1.6)
    return float(r)


class CloudburstHazardEstimator(BaseHazardEstimator):
    """Estimates extreme localized rainfall (>50-100 mm/hr) and cloudburst potential."""

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        cb_cfg = self.config.get("hazards", {}).get("cloudburst", {})
        self.extreme_rate_thresh = cb_cfg.get("extreme_rain_rate_mm_hr", 50.0)
        self.dbz_thresh = cb_cfg.get("flash_flood_dbz_threshold", 48.0)

    def estimate_storm_hazard(self, storm: StormCell, frame: FusedFrame) -> HazardEstimate:
        max_dbz = storm.indicators.get("max_dbz", storm.intensity)
        speed_kmh = storm.speed_kmh
        area_km2 = storm.area_km2

        inst_rain_rate = radar_dbz_to_rain_rate(max_dbz)

        # Meteorological proxy:
        # Cloudburst requires extreme rain rate combined with slow cell propagation (causing massive localized accumulation)
        p_rate = np.clip(inst_rain_rate / self.extreme_rate_thresh, 0.0, 1.0)
        p_dbz = np.clip((max_dbz - 40.0) / (self.dbz_thresh - 35.0), 0.0, 1.0)

        # Slow-moving factor: cells moving < 15 km/h dump vastly more localized rain over a single catchment
        p_slow = np.clip((25.0 - speed_kmh) / 20.0, 0.0, 1.0)

        risk = float(0.50 * p_rate + 0.30 * p_dbz + 0.20 * p_slow)
        risk = float(np.clip(risk, 0.02, 0.98))

        if inst_rain_rate >= 100.0 or (risk >= 0.75 and inst_rain_rate >= 60.0):
            severity = "EXTREME"
        elif inst_rain_rate >= 50.0 or risk >= 0.50:
            severity = "HIGH"
        elif inst_rain_rate >= 25.0 or risk >= 0.25:
            severity = "MODERATE"
        else:
            severity = "LOW"

        confidence = float(np.clip(storm.confidence * 0.85 + (0.1 if frame.has_feature("radar_reflectivity_dbz") else 0.0), 0.2, 0.93))

        return HazardEstimate(
            hazard_type="cloudburst",
            risk_probability=risk,
            confidence=confidence,
            severity_level=severity,
            valid_time=storm.timestamp,
            latitude=storm.centroid_lat,
            longitude=storm.centroid_lon,
            storm_id=storm.storm_id,
            hazard_indicators={
                "estimated_peak_rain_rate_mm_hr": round(inst_rain_rate, 1),
                "storm_speed_kmh": round(speed_kmh, 1),
                "core_dbz": round(max_dbz, 1),
                "slow_movement_risk_factor": round(float(p_slow), 2)
            }
        )

    def estimate_spatial_hazard(self, frame: FusedFrame) -> np.ndarray:
        dbz = frame.get_feature("radar_reflectivity_dbz")
        h, w = frame.grid.shape
        if dbz is None:
            return np.zeros((h, w), dtype=np.float32)

        # Vectorized rain rate calculation
        z_lin = np.power(10.0, np.clip(dbz, 0.0, 75.0) / 10.0)
        rain_rate = np.power(z_lin / 200.0, 1.0 / 1.6)

        p_rate = np.clip(rain_rate / self.extreme_rate_thresh, 0.0, 1.0)
        return gaussian_filter(p_rate.astype(np.float32), sigma=1.0)
