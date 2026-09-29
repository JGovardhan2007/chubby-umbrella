"""Unit tests for Meteorological Evaluation and Verification Metrics."""

import numpy as np
import pytest

from phase1_26084.evaluation.metrics import (
    ContingencyTable,
    compute_contingency_from_arrays,
    compute_distance_error_km,
    compute_brier_score
)


def test_contingency_metrics():
    # Hits=40, False Alarms=10, Misses=10, Correct Negatives=40
    ct = ContingencyTable(hits=40, false_alarms=10, misses=10, correct_negatives=40)
    assert ct.pod == pytest.approx(0.80, abs=1e-3)
    assert ct.far == pytest.approx(0.20, abs=1e-3)
    assert ct.precision == pytest.approx(0.80, abs=1e-3)
    assert ct.csi == pytest.approx(40 / 60.0, abs=1e-3)
    assert ct.f1_score == pytest.approx(0.80, abs=1e-3)


def test_spatial_contingency():
    pred = np.array([[1, 0], [1, 1]], dtype=bool)
    obs = np.array([[1, 0], [0, 1]], dtype=bool)

    ct = compute_contingency_from_arrays(pred, obs)
    assert ct.hits == 2
    assert ct.false_alarms == 1
    assert ct.misses == 0
    assert ct.correct_negatives == 1


def test_distance_error_and_brier():
    p_pts = [(13.0, 80.0), (13.5, 80.5)]
    o_pts = [(13.05, 80.0), (13.55, 80.5)]

    err = compute_distance_error_km(p_pts, o_pts)
    assert 5.0 <= err["mae_km"] <= 6.0

    probs = np.array([0.9, 0.2, 0.8])
    truth = np.array([1, 0, 1])
    brier = compute_brier_score(probs, truth)
    assert brier < 0.10
