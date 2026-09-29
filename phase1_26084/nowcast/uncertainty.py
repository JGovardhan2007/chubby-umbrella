"""Uncertainty quantification and observation status categorization for nowcast horizons."""

from __future__ import annotations
from enum import Enum
from typing import Tuple
import numpy as np


class ObservationStatus(str, Enum):
    OBSERVED = "OBSERVED"
    DERIVED = "DERIVED"
    PREDICTED = "PREDICTED"
    UNCERTAIN = "UNCERTAIN"


def compute_lead_time_uncertainty(
    initial_confidence: float,
    lead_time_minutes: int,
    decay_rate_per_hour: float = 0.12
) -> Tuple[float, float, ObservationStatus]:
    """Compute confidence decay, spatial uncertainty radius expansion, and status."""
    hours = lead_time_minutes / 60.0

    # Exponential confidence decay
    decayed_conf = initial_confidence * np.exp(-decay_rate_per_hour * hours)
    decayed_conf = float(np.clip(decayed_conf, 0.05, 0.99))

    # Spatial cone dispersion radius (km) expansion
    # Storm track uncertainty expands at ~4-8 km per hour of lead time
    spatial_radius_km = float(5.0 + 6.0 * hours)

    # Status classification
    if lead_time_minutes == 0:
        status = ObservationStatus.OBSERVED
    elif lead_time_minutes <= 60:
        status = ObservationStatus.PREDICTED
    elif lead_time_minutes <= 180:
        status = ObservationStatus.DERIVED
    else:
        status = ObservationStatus.UNCERTAIN

    return decayed_conf, spatial_radius_km, status
