"""Unit tests for Quality Control and Reprojection."""

from datetime import datetime
import numpy as np
import pandas as pd
import pytest

from phase1_26084.ingestion.base import ObservationMetadata, ObservationGrid, PointObservations
from phase1_26084.preprocessing.qc import DataQualityController
from phase1_26084.preprocessing.reproject import resample_grid_to_target, point_observations_to_grid


def test_qc_grid_validation():
    qc = DataQualityController()
    meta = ObservationMetadata(
        source_name="Test_Radar",
        variable="reflectivity",
        units="dBZ",
        timestamp=datetime.utcnow(),
        missing_value=-9999.0
    )
    data = np.array([[-9999.0, 45.0], [np.nan, 95.0]], dtype=np.float32)
    lats = np.array([13.0, 14.0])
    lons = np.array([80.0, 81.0])

    grid = ObservationGrid(data=data, lats=lats, lons=lons, metadata=meta)
    clean_grid, anomalies, summary = qc.validate_grid(grid)

    assert len(anomalies) >= 1
    assert not np.isnan(clean_grid.data).any()
    assert clean_grid.data[1, 1] <= 80.0  # Clamped within physical limits


def test_resample_grid_to_target():
    src_data = np.array([[10.0, 20.0], [30.0, 40.0]], dtype=np.float32)
    src_lats = np.array([12.0, 14.0])
    src_lons = np.array([79.0, 81.0])

    tgt_lats = np.linspace(12.0, 14.0, 5)
    tgt_lons = np.linspace(79.0, 81.0, 5)

    resampled = resample_grid_to_target(src_data, src_lats, src_lons, tgt_lats, tgt_lons)
    assert resampled.shape == (5, 5)
    assert resampled[0, 0] == pytest.approx(10.0, abs=1e-3)
    assert resampled[-1, -1] == pytest.approx(40.0, abs=1e-3)
