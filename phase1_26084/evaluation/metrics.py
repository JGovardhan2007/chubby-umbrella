"""Meteorological verification metrics for convective detection, storm tracking, and hazard nowcasting."""

from __future__ import annotations
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple
import numpy as np


@dataclass
class ContingencyTable:
    """2x2 Contingency Table for binary meteorological event verification.
    Hits (H), False Alarms (F), Misses (M), Correct Negatives (CN).
    """
    hits: int = 0
    false_alarms: int = 0
    misses: int = 0
    correct_negatives: int = 0

    @property
    def total(self) -> int:
        return self.hits + self.false_alarms + self.misses + self.correct_negatives

    @property
    def pod(self) -> float:
        """Probability of Detection (POD / Recall / Hit Rate): H / (H + M)."""
        denom = self.hits + self.misses
        return float(self.hits / denom) if denom > 0 else 0.0

    @property
    def far(self) -> float:
        """False Alarm Ratio (FAR): F / (H + F)."""
        denom = self.hits + self.false_alarms
        return float(self.false_alarms / denom) if denom > 0 else 0.0

    @property
    def precision(self) -> float:
        """Precision (Success Ratio): H / (H + F) = 1 - FAR."""
        return 1.0 - self.far

    @property
    def csi(self) -> float:
        """Critical Success Index (CSI / Threat Score TS): H / (H + M + F)."""
        denom = self.hits + self.misses + self.false_alarms
        return float(self.hits / denom) if denom > 0 else 0.0

    @property
    def f1_score(self) -> float:
        """Harmonic mean of Precision and Recall."""
        p, r = self.precision, self.pod
        denom = p + r
        return float(2.0 * (p * r) / denom) if denom > 0 else 0.0

    @property
    def hss(self) -> float:
        """Heidke Skill Score (HSS)."""
        n = self.total
        if n == 0:
            return 0.0
        expected = ((self.hits + self.misses) * (self.hits + self.false_alarms) +
                    (self.correct_negatives + self.misses) * (self.correct_negatives + self.false_alarms)) / n
        denom = n - expected
        return float((self.hits + self.correct_negatives - expected) / denom) if denom != 0 else 0.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "hits": self.hits,
            "false_alarms": self.false_alarms,
            "misses": self.misses,
            "correct_negatives": self.correct_negatives,
            "pod": round(self.pod, 4),
            "far": round(self.far, 4),
            "precision": round(self.precision, 4),
            "csi_threat_score": round(self.csi, 4),
            "f1_score": round(self.f1_score, 4),
            "hss": round(self.hss, 4)
        }


def compute_contingency_from_arrays(
    pred_binary: np.ndarray,
    obs_binary: np.ndarray
) -> ContingencyTable:
    """Compute contingency table from binary 2D boolean masks."""
    p = pred_binary.astype(bool)
    o = obs_binary.astype(bool)

    hits = int(np.sum(p & o))
    false_alarms = int(np.sum(p & (~o)))
    misses = int(np.sum((~p) & o))
    correct_negatives = int(np.sum((~p) & (~o)))

    return ContingencyTable(hits, false_alarms, misses, correct_negatives)


def compute_spatial_iou(mask1: np.ndarray, mask2: np.ndarray) -> float:
    """Compute spatial Intersection over Union (IoU) between two storm masks."""
    m1 = mask1.astype(bool)
    m2 = mask2.astype(bool)
    intersection = np.sum(m1 & m2)
    union = np.sum(m1 | m2)
    return float(intersection / union) if union > 0 else 0.0


def compute_distance_error_km(
    pred_coords: List[Tuple[float, float]],
    obs_coords: List[Tuple[float, float]]
) -> Dict[str, float]:
    """Compute centroid distance errors in km between predicted and observed storm locations."""
    if not pred_coords or not obs_coords:
        return {"mae_km": 0.0, "rmse_km": 0.0, "max_km": 0.0, "count": 0}

    # Haversine distance for each pair
    errors = []
    for (p_lat, p_lon), (o_lat, o_lon) in zip(pred_coords, obs_coords):
        from ..tracking.storm_cell import haversine_distance_km
        d = haversine_distance_km(p_lat, p_lon, o_lat, o_lon)
        errors.append(d)

    arr = np.array(errors)
    return {
        "mae_km": float(np.mean(arr)),
        "rmse_km": float(np.sqrt(np.mean(arr**2))),
        "max_km": float(np.max(arr)),
        "count": len(errors)
    }


def compute_brier_score(forecast_probs: np.ndarray, actual_outcomes: np.ndarray) -> float:
    """Compute Brier Score for probabilistic hazard calibration (lower is better, 0 is perfect)."""
    if len(forecast_probs) == 0:
        return 0.0
    return float(np.mean((forecast_probs - actual_outcomes) ** 2))
