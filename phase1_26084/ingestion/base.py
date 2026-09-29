"""Base data structures and abstract loader for meteorological ingestion."""

from __future__ import annotations
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple, Union
import numpy as np
import pandas as pd


@dataclass
class ObservationMetadata:
    """Metadata container preserving scientific provenance and quality info."""
    source_name: str
    variable: str
    units: str
    timestamp: datetime
    spatial_resolution_km: Optional[float] = None
    crs: str = "EPSG:4326"
    valid_range: Optional[Tuple[float, float]] = None
    missing_value: Optional[float] = -9999.0
    quality_flags: Dict[str, Any] = field(default_factory=dict)
    raw_attributes: Dict[str, Any] = field(default_factory=dict)
    is_simulated: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return {
            "source_name": self.source_name,
            "variable": self.variable,
            "units": self.units,
            "timestamp": self.timestamp.isoformat() if isinstance(self.timestamp, datetime) else str(self.timestamp),
            "spatial_resolution_km": self.spatial_resolution_km,
            "crs": self.crs,
            "valid_range": self.valid_range,
            "missing_value": self.missing_value,
            "quality_flags": self.quality_flags,
            "raw_attributes": self.raw_attributes,
            "is_simulated": self.is_simulated
        }


@dataclass
class ObservationGrid:
    """Gridded spatial observation (e.g. Radar PPI/CAPPI, Satellite BT)."""
    data: np.ndarray  # Shape: (height, width) or (levels, height, width)
    lats: np.ndarray  # 1D or 2D array of latitudes
    lons: np.ndarray  # 1D or 2D array of longitudes
    metadata: ObservationMetadata

    @property
    def shape(self) -> Tuple[int, ...]:
        return self.data.shape

    @property
    def timestamp(self) -> datetime:
        return self.metadata.timestamp

    @property
    def variable(self) -> str:
        return self.metadata.variable

    def copy(self) -> ObservationGrid:
        return ObservationGrid(
            data=self.data.copy(),
            lats=self.lats.copy(),
            lons=self.lons.copy(),
            metadata=ObservationMetadata(**self.metadata.to_dict())
        )


@dataclass
class PointObservations:
    """Vector/Point observations (e.g. Lightning flashes, AWS stations)."""
    df: pd.DataFrame  # Columns: timestamp, lat, lon, value/variable_cols...
    metadata: ObservationMetadata

    @property
    def count(self) -> int:
        return len(self.df)

    @property
    def timestamp(self) -> datetime:
        return self.metadata.timestamp


class BaseLoader(ABC):
    """Abstract Base Class for multi-format scientific data ingestion."""

    @abstractmethod
    def load(self, file_path: str, **kwargs) -> Union[ObservationGrid, PointObservations, List[Union[ObservationGrid, PointObservations]]]:
        """Load scientific dataset from file path preserving metadata."""
        pass
