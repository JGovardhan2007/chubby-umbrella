"""StormCell representation with morphological, physical, and dynamical properties."""

from __future__ import annotations
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
import numpy as np


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate great-circle distance between two coordinates in kilometers."""
    r_earth = 6371.0
    phi1, phi2 = np.radians(lat1), np.radians(lat2)
    dphi = np.radians(lat2 - lat1)
    dlambda = np.radians(lon2 - lon1)

    a = np.sin(dphi / 2.0)**2 + np.cos(phi1) * np.cos(phi2) * np.sin(dlambda / 2.0)**2
    c = 2.0 * np.arctan2(np.sqrt(a), np.sqrt(1.0 - a))
    return float(r_earth * c)


@dataclass
class StormHistoryPoint:
    """Historical timestamp and position snapshot for a tracked storm cell."""
    timestamp: datetime
    centroid_lat: float
    centroid_lon: float
    max_dbz: float
    area_km2: float


@dataclass
class StormCell:
    """Standardized Storm Cell Object."""
    storm_id: str
    timestamp: datetime
    centroid_lat: float
    centroid_lon: float
    area_km2: float
    intensity: float  # Max dBZ or composite severity index
    confidence: float
    polygon_coords: List[List[float]] = field(default_factory=list)

    # Kinematic & Trend features
    growth_rate_km2_hr: float = 0.0
    intensity_trend_dbz_hr: float = 0.0
    velocity_u_kmh: float = 0.0  # Eastward movement (km/h)
    velocity_v_kmh: float = 0.0  # Northward movement (km/h)
    speed_kmh: float = 0.0
    heading_deg: float = 0.0  # Meteorological heading (0=North, 90=East)
    lightning_trend: float = 0.0  # flash/hr trend
    convective_stage: str = "DEVELOPING"
    indicators: Dict[str, float] = field(default_factory=dict)
    history: List[StormHistoryPoint] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "storm_id": self.storm_id,
            "timestamp": self.timestamp.isoformat(),
            "centroid_lat": round(self.centroid_lat, 4),
            "centroid_lon": round(self.centroid_lon, 4),
            "area_km2": round(self.area_km2, 2),
            "intensity": round(self.intensity, 2),
            "confidence": round(self.confidence, 3),
            "speed_kmh": round(self.speed_kmh, 2),
            "heading_deg": round(self.heading_deg, 1),
            "velocity_u_kmh": round(self.velocity_u_kmh, 2),
            "velocity_v_kmh": round(self.velocity_v_kmh, 2),
            "growth_rate_km2_hr": round(self.growth_rate_km2_hr, 2),
            "intensity_trend_dbz_hr": round(self.intensity_trend_dbz_hr, 2),
            "lightning_trend": round(self.lightning_trend, 2),
            "convective_stage": self.convective_stage,
            "indicators": {k: round(v, 2) for k, v in self.indicators.items()},
            "history_points": len(self.history)
        }
