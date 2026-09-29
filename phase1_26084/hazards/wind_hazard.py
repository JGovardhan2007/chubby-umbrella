"""Probabilistic Downburst and severe convective wind hazard estimator."""

from __future__ import annotations
from datetime import datetime
from typing import Any, Dict, Optional
import numpy as np
from scipy.ndimage import gaussian_filter

from .base import BaseHazardEstimator, HazardEstimate
from ..tracking.storm_cell import StormCell
from ..fusion.spatiotemporal import FusedFrame


class DownburstHazardEstimator(BaseHazardEstimator):
    """Estimates downburst, microburst, and convective gale-force wind gust risks."""

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        wind_cfg = self.config.get("hazards", {}).get("downburst", {})
        self.vel_diff_thresh = wind_cfg.get("velocity_diff_threshold_ms", 18.0)
        self.core_dbz_thresh = wind_cfg.get("reflectivity_core_dbz", 50.0)

    def estimate_storm_hazard(self, storm: StormCell, frame: FusedFrame) -> HazardEstimate:
        max_dbz = storm.indicators.get("max_dbz", storm.intensity)
        intensity_trend = storm.intensity_trend_dbz_hr
        speed_kmh = storm.speed_kmh

        # Velocity feature if available
        vel_layer = frame.get_feature("radar_velocity_ms")
        if vel_layer is not None:
            # Local velocity range around storm
            r, c = frame.grid.latlon_to_pixel(storm.centroid_lat, storm.centroid_lon)
            r_min, r_max = max(0, r - 5), min(frame.grid.shape[0], r + 6)
            c_min, c_max = max(0, c - 5), min(frame.grid.shape[1], c + 6)
            sub_vel = vel_layer[r_min:r_max, c_min:c_max]
            delta_v = float(np.max(sub_vel) - np.min(sub_vel)) if sub_vel.size > 0 else 0.0
        else:
            delta_v = 0.0

        # Physical proxy:
        # Downbursts occur when heavy precipitation core collapses or strong divergence / radial velocity shear is observed
        p_vel = np.clip(delta_v / self.vel_diff_thresh, 0.0, 1.0) if delta_v > 0 else 0.0
        p_core = np.clip((max_dbz - 40.0) / (self.core_dbz_thresh - 40.0), 0.0, 1.0)
        p_motion = np.clip(speed_kmh / 60.0, 0.0, 0.5)  # Fast moving storms have enhanced surface gusts

        # Core collapse proxy (negative intensity trend after high peak)
        collapse_bonus = 0.15 if (max_dbz >= 48.0 and intensity_trend < -5.0) else 0.0

        if vel_layer is not None:
            risk = float(0.45 * p_vel + 0.35 * p_core + 0.10 * p_motion + collapse_bonus)
        else:
            # Reflectivity and dynamics proxy
            risk = float(0.65 * p_core + 0.20 * p_motion + collapse_bonus)

        risk = float(np.clip(risk, 0.05, 0.96))

        # Estimated peak gust speed (km/h) proxy
        est_gust_kmh = float(np.clip(30.0 + risk * 60.0 + speed_kmh * 0.4, 20.0, 140.0))

        if est_gust_kmh >= 80.0 or risk >= 0.70:
            severity = "EXTREME"
        elif est_gust_kmh >= 60.0 or risk >= 0.50:
            severity = "HIGH"
        elif risk >= 0.25:
            severity = "MODERATE"
        else:
            severity = "LOW"

        confidence = float(np.clip(storm.confidence * 0.82 + (0.15 if vel_layer is not None else 0.0), 0.2, 0.90))

        return HazardEstimate(
            hazard_type="downburst",
            risk_probability=risk,
            confidence=confidence,
            severity_level=severity,
            valid_time=storm.timestamp,
            latitude=storm.centroid_lat,
            longitude=storm.centroid_lon,
            storm_id=storm.storm_id,
            hazard_indicators={
                "estimated_peak_gust_kmh": est_gust_kmh,
                "velocity_differential_ms": delta_v,
                "storm_speed_kmh": speed_kmh,
                "core_dbz": max_dbz
            }
        )

    def estimate_spatial_hazard(self, frame: FusedFrame) -> np.ndarray:
        dbz = frame.get_feature("radar_reflectivity_dbz")
        vel = frame.get_feature("radar_velocity_ms")
        h, w = frame.grid.shape

        p_dbz = np.clip((dbz - 40.0) / (self.core_dbz_thresh - 40.0), 0.0, 1.0) if dbz is not None else np.zeros((h, w), dtype=np.float32)

        if vel is not None:
            # compute velocity gradient
            import scipy.ndimage as ndi
            gx = ndi.sobel(vel, axis=1)
            gy = ndi.sobel(vel, axis=0)
            p_shear = np.clip(np.hypot(gx, gy) / self.vel_diff_thresh, 0.0, 1.0)
            risk_map = 0.50 * p_dbz + 0.50 * p_shear
        else:
            risk_map = p_dbz

        return gaussian_filter(np.clip(risk_map, 0.0, 1.0).astype(np.float32), sigma=1.0)
