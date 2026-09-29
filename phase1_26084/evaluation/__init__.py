"""Evaluation package for meteorological verification metrics and temporal validation."""

from .metrics import (
    ContingencyTable,
    compute_contingency_from_arrays,
    compute_spatial_iou,
    compute_distance_error_km,
    compute_brier_score
)
from .validator import (
    HorizonEvaluationMetrics,
    SystemEvaluationReport,
    ConvectiveNowcastValidator
)

__all__ = [
    "ContingencyTable",
    "compute_contingency_from_arrays",
    "compute_spatial_iou",
    "compute_distance_error_km",
    "compute_brier_score",
    "HorizonEvaluationMetrics",
    "SystemEvaluationReport",
    "ConvectiveNowcastValidator"
]
