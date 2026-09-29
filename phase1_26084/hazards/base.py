"""Base interface and data schemas for hazard risk nowcasting."""

from __future__ import annotations
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional
import numpy as np

from ..tracking.storm_cell import StormCell
from ..fusion.spatiotemporal import FusedFrame


@dataclass
class HazardEstimate:
    """Standardized Probabilistic Hazard Assessment."""
    hazard_type: str  # 'lightning', 'hail', 'downburst', 'cloudburst'
    risk_probability: float  # [0.0 to 1.0]
    confidence: float  # [0.0 to 1.0]
    severity_level: str  # 'NONE', 'LOW', 'MODERATE', 'HIGH', 'EXTREME'
    valid_time: datetime
    latitude: float
    longitude: float
    storm_id: Optional[str] = None
    hazard_indicators: Dict[str, float] = field(default_factory=dict)
    disclaimer: str = "Research prototype for convective nowcasting (SIH 26084). Not an official meteorological warning."

    def to_dict(self) -> Dict[str, Any]:
        return {
            "hazard": self.hazard_type,
            "risk": round(self.risk_probability, 3),
            "confidence": round(self.confidence, 3),
            "severity_level": self.severity_level,
            "valid_time": self.valid_time.isoformat(),
            "latitude": round(self.latitude, 4),
            "longitude": round(self.longitude, 4),
            "storm_id": self.storm_id,
            "hazard_indicators": {k: round(v, 3) for k, v in self.hazard_indicators.items()},
            "disclaimer": self.disclaimer
        }


class BaseHazardEstimator(ABC):
    """Abstract Base Class for Convective Hazard Estimators."""

    @abstractmethod
    def estimate_storm_hazard(self, storm: StormCell, frame: FusedFrame) -> HazardEstimate:
        """Estimate hazard for a specific tracked storm cell."""
        pass

    @abstractmethod
    def estimate_spatial_hazard(self, frame: FusedFrame) -> np.ndarray:
        """Estimate 2D spatial probability map [H, W] across the domain."""
        pass
