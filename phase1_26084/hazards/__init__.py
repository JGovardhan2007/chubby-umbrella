"""Hazards package for multi-hazard probabilistic nowcasting."""

from .base import BaseHazardEstimator, HazardEstimate
from .lightning_hazard import LightningHazardEstimator
from .hail_hazard import HailHazardEstimator
from .wind_hazard import DownburstHazardEstimator
from .cloudburst_hazard import CloudburstHazardEstimator, radar_dbz_to_rain_rate
from .ml_models import BaseMLHazardModel, InterpretablePhysicsBaseline, ModularSklearnHazardClassifier

__all__ = [
    "BaseHazardEstimator",
    "HazardEstimate",
    "LightningHazardEstimator",
    "HailHazardEstimator",
    "DownburstHazardEstimator",
    "CloudburstHazardEstimator",
    "radar_dbz_to_rain_rate",
    "BaseMLHazardModel",
    "InterpretablePhysicsBaseline",
    "ModularSklearnHazardClassifier"
]
