"""Geospatial reprojection, grid interpolation, and point-to-grid density mapping."""

from __future__ import annotations
from typing import Optional, Tuple
import numpy as np
from scipy.interpolate import RegularGridInterpolator
from scipy.ndimage import gaussian_filter


def resample_grid_to_target(
    data: np.ndarray,
    src_lats: np.ndarray,
    src_lons: np.ndarray,
    target_lats: np.ndarray,
    target_lons: np.ndarray,
    fill_value: float = 0.0,
    method: str = "linear"
) -> np.ndarray:
    """Resample 2D grid data onto target regular latitude/longitude coordinates."""
    # Ensure source 1D arrays are sorted
    if src_lats[0] > src_lats[-1]:
        src_lats = src_lats[::-1]
        data = data[::-1, :]
    if src_lons[0] > src_lons[-1]:
        src_lons = src_lons[::-1]
        data = data[:, ::-1]

    # Handle shape matching
    if data.shape != (len(src_lats), len(src_lons)):
        if data.shape == (len(src_lons), len(src_lats)):
            data = data.T
        else:
            # Fallback direct resize if coordinate dimensions mismatch
            import cv2
            return cv2.resize(data, (len(target_lons), len(target_lats)), interpolation=cv2.INTER_LINEAR).astype(np.float32)

    interp = RegularGridInterpolator(
        (src_lats, src_lons),
        data,
        method=method,
        bounds_error=False,
        fill_value=fill_value
    )

    t_lat_mesh, t_lon_mesh = np.meshgrid(target_lats, target_lons, indexing="ij")
    pts = np.stack([t_lat_mesh.ravel(), t_lon_mesh.ravel()], axis=-1)
    resampled = interp(pts).reshape(t_lat_mesh.shape)
    return resampled.astype(np.float32)


def point_observations_to_grid(
    lats: np.ndarray,
    lons: np.ndarray,
    target_lats: np.ndarray,
    target_lons: np.ndarray,
    values: Optional[np.ndarray] = None,
    sigma: float = 1.0,
    cell_size_km: float = 2.0
) -> np.ndarray:
    """Aggregate point occurrences (e.g. lightning flashes) into a 2D density grid (count/km² or sum)."""
    n_lat = len(target_lats)
    n_lon = len(target_lons)

    if len(lats) == 0:
        return np.zeros((n_lat, n_lon), dtype=np.float32)

    lat_min, lat_max = target_lats.min(), target_lats.max()
    lon_min, lon_max = target_lons.min(), target_lons.max()

    # 2D histogram bin edges
    lat_edges = np.linspace(lat_min, lat_max, n_lat + 1)
    lon_edges = np.linspace(lon_min, lon_max, n_lon + 1)

    weights = values if values is not None else None
    hist, _, _ = np.histogram2d(lats, lons, bins=[lat_edges, lon_edges], weights=weights)

    # Smooth with Gaussian filter to represent spatial influence zone
    if sigma > 0:
        hist = gaussian_filter(hist.astype(np.float32), sigma=sigma)

    # Convert to density (per km²)
    pixel_area_km2 = cell_size_km * cell_size_km
    density = hist / pixel_area_km2
    return density.astype(np.float32)
