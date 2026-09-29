"""Detection module for convective initiation and candidate cell extraction."""

from .features import extract_convective_features, compute_spatial_gradients
from .convective_initiation import CandidateCell, ConvectiveInitiationDetector

__all__ = [
    "extract_convective_features",
    "compute_spatial_gradients",
    "CandidateCell",
    "ConvectiveInitiationDetector"
]
