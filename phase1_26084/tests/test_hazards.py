"""Unit tests for Multi-Hazard Prediction and Modular ML interfaces."""

from datetime import datetime
import numpy as np
import pytest

from phase1_26084.tracking.storm_cell import StormCell
from phase1_26084.fusion.grid import CommonGrid
from phase1_26084.fusion.spatiotemporal import FusedFrame
from phase1_26084.hazards.lightning_hazard import LightningHazardEstimator
from phase1_26084.hazards.hail_hazard import HailHazardEstimator
from phase1_26084.hazards.wind_hazard import DownburstHazardEstimator
from phase1_26084.hazards.cloudburst_hazard import CloudburstHazardEstimator, radar_dbz_to_rain_rate
from phase1_26084.hazards.ml_models import InterpretablePhysicsBaseline, ModularSklearnHazardClassifier


def test_hazards_probabilistic_bounds():
    grid = CommonGrid(12.0, 14.0, 79.0, 81.0, 2.0)
    frame = FusedFrame(
        timestamp=datetime.utcnow(),
        grid=grid,
        feature_names=["radar_reflectivity_dbz"],
        tensor=np.full((grid.shape[0], grid.shape[1], 1), 52.0, dtype=np.float32)
    )

    storm = StormCell(
        storm_id="STM_001",
        timestamp=datetime.utcnow(),
        centroid_lat=13.0,
        centroid_lon=80.0,
        area_km2=100.0,
        intensity=55.0,
        confidence=0.88,
        speed_kmh=12.0,
        indicators={"max_dbz": 55.0, "min_bt_k": 210.0, "max_cooling_k_15min": -6.0, "max_lightning_density": 0.4}
    )

    ltg_est = LightningHazardEstimator()
    hail_est = HailHazardEstimator()
    wind_est = DownburstHazardEstimator()
    cb_est = CloudburstHazardEstimator()

    h_ltg = ltg_est.estimate_storm_hazard(storm, frame)
    h_hail = hail_est.estimate_storm_hazard(storm, frame)
    h_wind = wind_est.estimate_storm_hazard(storm, frame)
    h_cb = cb_est.estimate_storm_hazard(storm, frame)

    assert 0.0 <= h_ltg.risk_probability <= 1.0
    assert 0.0 <= h_hail.risk_probability <= 1.0
    assert 0.0 <= h_wind.risk_probability <= 1.0
    assert 0.0 <= h_cb.risk_probability <= 1.0

    assert h_hail.severity_level in ["MODERATE", "HIGH", "EXTREME"]
    assert h_cb.hazard_indicators["estimated_peak_rain_rate_mm_hr"] > 50.0


def test_ml_modular_interfaces():
    # Test physics baseline
    baseline = InterpretablePhysicsBaseline()
    X = np.array([[55.0, 215.0], [20.0, 290.0]])
    probs = baseline.predict_proba(X)
    assert probs.shape == (2, 2)
    assert probs[0, 1] > probs[1, 1]

    # Test Scikit-Learn wrapper
    clf = ModularSklearnHazardClassifier(model_type="random_forest")
    X_train = np.random.uniform(20, 60, (50, 4))
    y_train = (X_train[:, 0] > 40).astype(int)
    clf.fit(X_train, y_train)

    preds = clf.predict(X_train[:5])
    assert len(preds) == 5
