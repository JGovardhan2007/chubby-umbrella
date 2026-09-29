"""Data Quality Control (QC) and validation engine for multi-source meteorological observations."""

from __future__ import annotations
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple, Union
import numpy as np
import pandas as pd

from ..ingestion.base import ObservationGrid, PointObservations, ObservationMetadata


@dataclass
class QCAnomaly:
    """Individual QC anomaly log entry."""
    source: str
    variable: str
    issue_type: str
    description: str
    count_affected: int
    severity: str  # 'WARNING', 'ERROR', 'CRITICAL'


@dataclass
class DataQualityReport:
    """Comprehensive Data Quality Report."""
    timestamp: datetime
    overall_status: str  # 'PASSED', 'PASSED_WITH_WARNINGS', 'FAILED'
    total_sources_evaluated: int
    valid_fraction: float
    anomalies: List[QCAnomaly] = field(default_factory=list)
    source_summaries: Dict[str, Dict[str, Any]] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "timestamp": self.timestamp.isoformat(),
            "overall_status": self.overall_status,
            "total_sources_evaluated": self.total_sources_evaluated,
            "valid_fraction": round(self.valid_fraction, 4),
            "anomalies": [
                {
                    "source": a.source,
                    "variable": a.variable,
                    "issue_type": a.issue_type,
                    "description": a.description,
                    "count_affected": a.count_affected,
                    "severity": a.severity
                }
                for a in self.anomalies
            ],
            "source_summaries": self.source_summaries
        }


class DataQualityController:
    """Performs rigorous quality control on meteorological grids and point data."""

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        qc_cfg = self.config.get("data_quality_control", {})
        self.radar_limits = qc_cfg.get("radar", {"reflectivity_min_dbz": -10.0, "reflectivity_max_dbz": 80.0, "velocity_min_ms": -75.0, "velocity_max_ms": 75.0})
        self.sat_limits = qc_cfg.get("satellite", {"bt_min_k": 160.0, "bt_max_k": 340.0})
        self.weather_limits = qc_cfg.get("surface_weather", {
            "temp_min_c": -30.0, "temp_max_c": 55.0,
            "rh_min_pct": 0.0, "rh_max_pct": 100.0,
            "pressure_min_hpa": 850.0, "pressure_max_hpa": 1050.0,
            "wind_spd_max_ms": 80.0
        })

    def validate_grid(self, grid: ObservationGrid) -> Tuple[ObservationGrid, List[QCAnomaly], Dict[str, Any]]:
        """Validate and clean an ObservationGrid."""
        anomalies: List[QCAnomaly] = []
        clean_grid = grid.copy()
        raw_data = clean_grid.data
        total_pixels = int(raw_data.size)
        var_lower = grid.variable.lower()

        # 1. Check coordinates validity
        lat_invalid = np.any((grid.lats < -90.0) | (grid.lats > 90.0))
        lon_invalid = np.any((grid.lons < -180.0) | (grid.lons > 180.0))
        if lat_invalid or lon_invalid:
            anomalies.append(QCAnomaly(
                source=grid.metadata.source_name,
                variable=grid.variable,
                issue_type="INVALID_COORDINATES",
                description="Coordinates outside valid WGS84 range [-90..90, -180..180]",
                count_affected=1,
                severity="ERROR"
            ))

        # 2. Check missing / NaN / Inf values
        nan_mask = np.isnan(raw_data)
        inf_mask = np.isinf(raw_data)
        missing_val = grid.metadata.missing_value
        fill_mask = (raw_data == missing_val) if missing_val is not None else np.zeros_like(raw_data, dtype=bool)

        invalid_mask = nan_mask | inf_mask | fill_mask
        invalid_count = int(np.sum(invalid_mask))

        if invalid_count > 0:
            anomalies.append(QCAnomaly(
                source=grid.metadata.source_name,
                variable=grid.variable,
                issue_type="MISSING_OR_FILL_VALUES",
                description=f"Found {invalid_count}/{total_pixels} pixels with missing/NaN/fill values",
                count_affected=invalid_count,
                severity="WARNING"
            ))

        # Fill invalid with baseline physical minimums
        if "dbz" in var_lower or "reflectivity" in var_lower:
            default_fill = -10.0
            valid_min = self.radar_limits.get("reflectivity_min_dbz", -10.0)
            valid_max = self.radar_limits.get("reflectivity_max_dbz", 80.0)
        elif "velocity" in var_lower or "vr" in var_lower:
            default_fill = 0.0
            valid_min = self.radar_limits.get("velocity_min_ms", -75.0)
            valid_max = self.radar_limits.get("velocity_max_ms", 75.0)
        elif "tir" in var_lower or "bt" in var_lower or "temperature" in var_lower:
            default_fill = 300.0  # Warm background
            valid_min = self.sat_limits.get("bt_min_k", 160.0)
            valid_max = self.sat_limits.get("bt_max_k", 340.0)
        else:
            default_fill = 0.0
            valid_min = -1e6
            valid_max = 1e6

        clean_data = np.nan_to_num(raw_data, nan=default_fill, posinf=valid_max, neginf=valid_min)
        if missing_val is not None:
            clean_data[clean_data == missing_val] = default_fill

        # 3. Check physical value bounds (clamping / logging impossible values)
        out_of_bounds = (clean_data < valid_min) | (clean_data > valid_max)
        oob_count = int(np.sum(out_of_bounds))
        if oob_count > 0:
            anomalies.append(QCAnomaly(
                source=grid.metadata.source_name,
                variable=grid.variable,
                issue_type="PHYSICAL_BOUNDS_EXCEEDED",
                description=f"Clamped {oob_count} values outside valid physical range [{valid_min}, {valid_max}]",
                count_affected=oob_count,
                severity="WARNING"
            ))
            clean_data = np.clip(clean_data, valid_min, valid_max)

        clean_grid.data = clean_data
        valid_count = total_pixels - invalid_count
        valid_frac = float(valid_count / total_pixels) if total_pixels > 0 else 0.0

        summary = {
            "source": grid.metadata.source_name,
            "variable": grid.variable,
            "shape": list(grid.shape),
            "valid_fraction": valid_frac,
            "min_val": float(np.min(clean_data)),
            "max_val": float(np.max(clean_data)),
            "mean_val": float(np.mean(clean_data))
        }

        return clean_grid, anomalies, summary

    def validate_points(self, points: PointObservations) -> Tuple[PointObservations, List[QCAnomaly], Dict[str, Any]]:
        """Validate and clean PointObservations (Lightning or Weather)."""
        anomalies: List[QCAnomaly] = []
        df = points.df.copy()
        total_records = len(df)

        if total_records == 0:
            return points, anomalies, {"source": points.metadata.source_name, "valid_count": 0, "total_records": 0}

        # 1. Check duplicate records
        dup_count = int(df.duplicated(subset=["lat", "lon", "timestamp"]).sum())
        if dup_count > 0:
            anomalies.append(QCAnomaly(
                source=points.metadata.source_name,
                variable=points.metadata.variable,
                issue_type="DUPLICATE_OBSERVATIONS",
                description=f"Found and dropped {dup_count} duplicate observations",
                count_affected=dup_count,
                severity="WARNING"
            ))
            df = df.drop_duplicates(subset=["lat", "lon", "timestamp"])

        # 2. Coordinate boundary filter
        valid_coord_mask = (
            (df["lat"] >= -90.0) & (df["lat"] <= 90.0) &
            (df["lon"] >= -180.0) & (df["lon"] <= 180.0)
        )
        invalid_coords = int((~valid_coord_mask).sum())
        if invalid_coords > 0:
            anomalies.append(QCAnomaly(
                source=points.metadata.source_name,
                variable=points.metadata.variable,
                issue_type="INVALID_COORDINATES",
                description=f"Removed {invalid_coords} records with invalid coordinates",
                count_affected=invalid_coords,
                severity="ERROR"
            ))
            df = df[valid_coord_mask]

        # 3. Clean NaNs in numerical columns
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        df[numeric_cols] = df[numeric_cols].fillna(0.0)

        cleaned_points = PointObservations(df=df.reset_index(drop=True), metadata=points.metadata)
        summary = {
            "source": points.metadata.source_name,
            "variable": points.metadata.variable,
            "valid_count": len(df),
            "original_count": total_records
        }

        return cleaned_points, anomalies, summary

    def generate_report(self, anomalies: List[QCAnomaly], summaries: Dict[str, Dict[str, Any]]) -> DataQualityReport:
        """Create a summary DataQualityReport from collected anomalies."""
        has_error = any(a.severity in ["ERROR", "CRITICAL"] for a in anomalies)
        has_warning = any(a.severity == "WARNING" for a in anomalies)

        if has_error:
            status = "PASSED_WITH_WARNINGS" if any(s.get("valid_fraction", 1.0) > 0.5 for s in summaries.values()) else "FAILED"
        elif has_warning:
            status = "PASSED_WITH_WARNINGS"
        else:
            status = "PASSED"

        # Overall valid fraction
        valid_fractions = [s.get("valid_fraction", 1.0) for s in summaries.values() if "valid_fraction" in s]
        mean_valid_frac = float(np.mean(valid_fractions)) if valid_fractions else 1.0

        return DataQualityReport(
            timestamp=datetime.utcnow(),
            overall_status=status,
            total_sources_evaluated=len(summaries),
            valid_fraction=mean_valid_frac,
            anomalies=anomalies,
            source_summaries=summaries
        )
