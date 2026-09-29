"""Meteorological feature extraction for convective initiation and storm diagnosis."""

from __future__ import annotations
from typing import Dict, Optional, Tuple
import numpy as np
from scipy.ndimage import sobel, gaussian_filter

from ..fusion.spatiotemporal import FusedFrame


def compute_spatial_gradients(grid_data: np.ndarray) -> np.ndarray:
    """Compute 2D spatial gradient magnitude using Sobel operators."""
    dx = sobel(grid_data, axis=1)
    dy = sobel(grid_data, axis=0)
    mag = np.hypot(dx, dy)
    return mag.astype(np.float32)


def extract_convective_features(frame: FusedFrame) -> Dict[str, np.ndarray]:
    """Extract interpretable meteorological diagnostic features from a FusedFrame."""
    features: Dict[str, np.ndarray] = {}
    h, w, _ = frame.tensor.shape

    # 1. Radar Reflectivity & Gradient
    dbz = frame.get_feature("radar_reflectivity_dbz")
    if dbz is not None:
        features["dbz"] = dbz
        features["dbz_smoothed"] = gaussian_filter(dbz, sigma=1.0)
        features["dbz_grad"] = compute_spatial_gradients(features["dbz_smoothed"])
    else:
        features["dbz"] = np.zeros((h, w), dtype=np.float32)
        features["dbz_smoothed"] = np.zeros((h, w), dtype=np.float32)
        features["dbz_grad"] = np.zeros((h, w), dtype=np.float32)

    # 2. Satellite Brightness Temperature & Gradient
    bt = frame.get_feature("satellite_bt_k")
    if bt is not None:
        features["bt_k"] = bt
        features["bt_grad"] = compute_spatial_gradients(bt)
    else:
        features["bt_k"] = np.full((h, w), 300.0, dtype=np.float32)
        features["bt_grad"] = np.zeros((h, w), dtype=np.float32)

    # 3. Cooling Rate (dT/dt)
    cooling_rate = frame.get_feature("satellite_cooling_rate_k_per_15min")
    if cooling_rate is not None:
        features["cooling_rate"] = cooling_rate
    else:
        features["cooling_rate"] = np.zeros((h, w), dtype=np.float32)

    # 4. Reflectivity Growth Rate (dZ/dt)
    growth_rate = frame.get_feature("radar_reflectivity_growth_dbz_per_15min")
    if growth_rate is not None:
        features["growth_rate"] = growth_rate
    else:
        features["growth_rate"] = np.zeros((h, w), dtype=np.float32)

    # 5. Lightning Density
    ltg = frame.get_feature("lightning_density_flashes_km2")
    if ltg is not None:
        features["lightning_density"] = ltg
    else:
        features["lightning_density"] = np.zeros((h, w), dtype=np.float32)

    # 6. Radar Velocity / Shear proxy
    vel = frame.get_feature("radar_velocity_ms")
    if vel is not None:
        features["velocity_shear"] = compute_spatial_gradients(vel)
    else:
        features["velocity_shear"] = np.zeros((h, w), dtype=np.float32)

    return features
