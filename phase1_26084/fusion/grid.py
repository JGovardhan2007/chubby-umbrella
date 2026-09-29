"""Common 1-3 km spatial grid definition for multi-source fusion."""

from __future__ import annotations
from dataclasses import dataclass
from typing import Any, Dict, Tuple
import numpy as np


@dataclass
class CommonGrid:
    """Standardized high-resolution common spatial grid (1-3 km)."""
    min_lat: float
    max_lat: float
    min_lon: float
    max_lon: float
    resolution_km: float = 2.0
    resolution_deg: float = 0.018  # Approximate 2 km in degrees

    def __post_init__(self):
        # Generate 1D coordinate arrays
        self.lats = np.arange(self.min_lat, self.max_lat + self.resolution_deg / 2.0, self.resolution_deg, dtype=np.float32)
        self.lons = np.arange(self.min_lon, self.max_lon + self.resolution_deg / 2.0, self.resolution_deg, dtype=np.float32)
        self.shape = (len(self.lats), len(self.lons))
        self.lat_mesh, self.lon_mesh = np.meshgrid(self.lats, self.lons, indexing="ij")

    @classmethod
    def from_config(cls, config: Dict[str, Any]) -> CommonGrid:
        domain_cfg = config.get("domain", {})
        return cls(
            min_lat=float(domain_cfg.get("min_lat", 12.0)),
            max_lat=float(domain_cfg.get("max_lat", 14.5)),
            min_lon=float(domain_cfg.get("min_lon", 79.0)),
            max_lon=float(domain_cfg.get("max_lon", 81.5)),
            resolution_km=float(domain_cfg.get("spatial_resolution_km", 2.0)),
            resolution_deg=float(domain_cfg.get("spatial_resolution_deg", 0.018))
        )

    def latlon_to_pixel(self, lat: float, lon: float) -> Tuple[int, int]:
        """Convert latitude and longitude to grid (row, col) index."""
        r = int(np.clip(np.round((lat - self.min_lat) / self.resolution_deg), 0, self.shape[0] - 1))
        c = int(np.clip(np.round((lon - self.min_lon) / self.resolution_deg), 0, self.shape[1] - 1))
        return r, c

    def pixel_to_latlon(self, row: int, col: int) -> Tuple[float, float]:
        """Convert grid (row, col) index to latitude and longitude."""
        lat = float(self.lats[np.clip(row, 0, self.shape[0] - 1)])
        lon = float(self.lons[np.clip(col, 0, self.shape[1] - 1)])
        return lat, lon
