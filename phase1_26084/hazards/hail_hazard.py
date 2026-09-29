"""Probabilistic Hail hazard estimator (POSH / MESH physical proxies)."""

from __future__ import annotations
from datetime import datetime
from typing import Any, Dict, Optional
import numpy as np
from scipy.ndimage import gaussian_filter

from .base import BaseHazardEstimator, HazardEstimate
from ..tracking.storm_cell import StormCell
from ..fusion.spatiotemporal import FusedFrame


class HailHazardEstimator(BaseHazardEstimator):
    """Estimates hail risk and severe hail probability using radar reflectivity and satellite cloud tops."""

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        hail_cfg = self.config.get("hazards", {}).get("hail", {})
        self.posh_dbz = hail_cfg.get("posh_dbz_threshold", 48.0)
        self.mesh_dbz = hail_cfg.get("mesh_dbz_threshold", 55.0)
        self.cold_bt_thresh = hail_cfg.get("bt_temp_threshold_k", 220.0)

    def estimate_storm_hazard(self, storm: StormCell, frame: FusedFrame) -> HazardEstimate:
        max_dbz = storm.indicators.get("max_dbz", storm.intensity)
        min_bt = storm.indicators.get("min_bt_k", 250.0)
        cooling_rate = storm.indicators.get("max_cooling_k_15min", 0.0)

        # Meteorological proxy:
        # Hail requires strong updraft supporting large hydrometeors (high dBZ core >= 48 dBZ, cold cloud tops < 225K)
        p_dbz = np.clip((max_dbz - 42.0) / (self.mesh_dbz - 42.0), 0.0, 1.0)
        p_bt = np.clip((240.0 - min_bt) / (240.0 - self.cold_bt_thresh), 0.0, 1.0)
        p_updraft = np.clip(-cooling_rate / 6.0, 0.0, 0.3)

        risk = float(0.55 * p_dbz + 0.35 * p_bt + 0.10 * p_updraft)
        risk = float(np.clip(risk, 0.02, 0.95))

        # Estimated hail diameter proxy (mm)
        est_diameter_mm = float(np.clip((max_dbz - 40.0) * 1.5, 0.0, 60.0))

        if risk >= 0.70 and est_diameter_mm >= 25.0:
            severity = "EXTREME"
        elif risk >= 0.50:
            severity = "HIGH"
        elif risk >= 0.25:
            severity = "MODERATE"
        elif risk >= 0.10:
            severity = "LOW"
        else:
            severity = "NONE"

        confidence = float(np.clip(storm.confidence * 0.85 + (0.1 if frame.has_feature("radar_reflectivity_dbz") else 0.0), 0.2, 0.92))

        return HazardEstimate(
            hazard_type="hail",
            risk_probability=risk,
            confidence=confidence,
            severity_level=severity,
            valid_time=storm.timestamp,
            latitude=storm.centroid_lat,
            longitude=storm.centroid_lon,
            storm_id=storm.storm_id,
            hazard_indicators={
                "estimated_max_diameter_mm": est_diameter_mm,
                "posh_index": float(p_dbz),
                "core_reflectivity_dbz": max_dbz,
                "min_brightness_temp_k": min_bt
            }
        )

    def estimate_spatial_hazard(self, frame: FusedFrame) -> np.ndarray:
        dbz = frame.get_feature("radar_reflectivity_dbz")
        bt = frame.get_feature("satellite_bt_k")
        h, w = frame.grid.shape

        p_dbz = np.clip((dbz - 42.0) / (self.mesh_dbz - 42.0), 0.0, 1.0) if dbz is not None else np.zeros((h, w), dtype=np.float32)
        p_bt = np.clip((240.0 - bt) / (240.0 - self.cold_bt_thresh), 0.0, 1.0) if bt is not None else np.zeros((h, w), dtype=np.float32)

        risk_map = 0.60 * p_dbz + 0.40 * p_bt
        return gaussian_filter(np.clip(risk_map, 0.0, 1.0).astype(np.float32), sigma=1.0)
