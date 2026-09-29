"""Unit tests for Convective Initiation detection and Candidate Cell generation."""

from datetime import datetime
import numpy as np
import pytest

from phase1_26084.fusion.grid import CommonGrid
from phase1_26084.fusion.spatiotemporal import FusedFrame
from phase1_26084.detection.convective_initiation import ConvectiveInitiationDetector


def test_convective_initiation_detection():
    grid = CommonGrid(min_lat=12.0, max_lat=14.0, min_lon=79.0, max_lon=81.0, resolution_km=2.0)
    h, w = grid.shape

    # Create synthetic storm hotspot
    dbz = np.full((h, w), 10.0, dtype=np.float32)
    dbz[20:35, 20:35] = 48.0  # Intense radar core

    bt = np.full((h, w), 295.0, dtype=np.float32)
    bt[20:35, 20:35] = 215.0  # Deep convective cold top

    tensor = np.stack([dbz, bt], axis=-1)
    frame = FusedFrame(
        timestamp=datetime.utcnow(),
        grid=grid,
        feature_names=["radar_reflectivity_dbz", "satellite_bt_k"],
        tensor=tensor
    )

    detector = ConvectiveInitiationDetector()
    candidates = detector.detect(frame)

    assert len(candidates) >= 1
    cell = candidates[0]
    assert cell.area_km2 > 10.0
    assert cell.intensity_indicators["max_dbz"] >= 45.0
    assert cell.confidence_score > 0.5
    assert len(cell.polygon_coords) >= 3
