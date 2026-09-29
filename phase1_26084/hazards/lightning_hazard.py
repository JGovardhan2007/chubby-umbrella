"""Probabilistic Lightning hazard estimator based on mixed-phase radar echo and cold cloud tops."""

from __future__ import annotations
from datetime import datetime
from typing import Any, Dict, Optional
import numpy as np
from scipy.ndimage import gaussian_filter

from .base import BaseHazardEstimator, HazardEstimate
from ..tracking.storm_cell import StormCell
from ..fusion.spatiotemporal import FusedFrame


class LightningHazardEstimator(BaseHazardEstimator):
    """Estimates lightning activity probability and flash density."""

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}

    def estimate_storm_hazard(self, storm: StormCell, frame: FusedFrame) -> HazardEstimate:
        max_dbz = storm.indicators.get("max_dbz", storm.intensity)
        min_bt = storm.indicators.get("min_bt_k", 250.0)
        curr_ltg_density = storm.indicators.get("max_lightning_density", 0.0)
        ltg_trend = storm.lightning_trend

        # Meteorological proxy:
        # Strong electrification occurs when mixed-phase radar reflectivity > 35-40 dBZ and cloud top < -20C (253K) or < 235K
        p_dbz = np.clip((max_dbz - 30.0) / 25.0, 0.0, 1.0)
        p_bt = np.clip((260.0 - min_bt) / 45.0, 0.0, 1.0)
        p_obs = np.clip(curr_ltg_density / 0.3, 0.0, 1.0)
        p_trend = np.clip(ltg_trend / 2.0, 0.0, 0.3)

        risk = float(0.35 * p_dbz + 0.30 * p_bt + 0.25 * p_obs + 0.10 * p_trend)
        risk = float(np.clip(risk, 0.05, 0.98))

        if risk >= 0.75:
            severity = "HIGH"
        elif risk >= 0.50:
            severity = "MODERATE"
        elif risk >= 0.25:
            severity = "LOW"
        else:
            severity = "NONE"

        confidence = float(np.clip(storm.confidence * 0.9 + 0.05, 0.2, 0.95))

        return HazardEstimate(
            hazard_type="lightning",
            risk_probability=risk,
            confidence=confidence,
            severity_level=severity,
            valid_time=storm.timestamp,
            latitude=storm.centroid_lat,
            longitude=storm.centroid_lon,
            storm_id=storm.storm_id,
            hazard_indicators={
                "predicted_flash_density": float(curr_ltg_density * (1.0 + risk)),
                "max_reflectivity_dbz": max_dbz,
                "min_brightness_temp_k": min_bt,
                "lightning_trend": ltg_trend
            }
        )

    def estimate_spatial_hazard(self, frame: FusedFrame) -> np.ndarray:
        dbz = frame.get_feature("radar_reflectivity_dbz")
        bt = frame.get_feature("satellite_bt_k")
        ltg = frame.get_feature("lightning_density_flashes_km2")

        h, w = frame.grid.shape
        p_dbz = np.clip((dbz - 30.0) / 25.0, 0.0, 1.0) if dbz is not None else np.zeros((h, w), dtype=np.float32)
        p_bt = np.clip((260.0 - bt) / 45.0, 0.0, 1.0) if bt is not None else np.zeros((h, w), dtype=np.float32)
        p_ltg = np.clip(ltg / 0.3, 0.0, 1.0) if ltg is not None else np.zeros((h, w), dtype=np.float32)

        risk_map = 0.40 * p_dbz + 0.35 * p_bt + 0.25 * p_ltg
        return gaussian_filter(np.clip(risk_map, 0.0, 1.0).astype(np.float32), sigma=1.0)
