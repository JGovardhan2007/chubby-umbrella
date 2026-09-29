"""Unit tests for Multi-Source Fusion and Data Cube assembly."""

from datetime import datetime
import numpy as np
import pytest

from phase1_26084.fusion.grid import CommonGrid
from phase1_26084.fusion.spatiotemporal import MultiSourceFusionEngine
from phase1_26084.ingestion.base import ObservationGrid, ObservationMetadata


def test_multisource_fusion_frame():
    grid = CommonGrid(min_lat=12.0, max_lat=13.0, min_lon=80.0, max_lon=81.0, resolution_km=2.0)
    engine = MultiSourceFusionEngine(grid)

    ts = datetime.utcnow()
    radar_meta = ObservationMetadata("Radar", "reflectivity", "dBZ", ts)
    sat_meta = ObservationMetadata("Sat", "TIR1_BT", "Kelvin", ts)

    radar_grid = ObservationGrid(
        data=np.full((10, 10), 40.0, dtype=np.float32),
        lats=np.linspace(12.0, 13.0, 10),
        lons=np.linspace(80.0, 81.0, 10),
        metadata=radar_meta
    )
    sat_grid = ObservationGrid(
        data=np.full((10, 10), 220.0, dtype=np.float32),
        lats=np.linspace(12.0, 13.0, 10),
        lons=np.linspace(80.0, 81.0, 10),
        metadata=sat_meta
    )

    frame = engine.fuse_frame(timestamp=ts, radar_reflectivity=radar_grid, satellite_bt=sat_grid)

    assert frame.has_feature("radar_reflectivity_dbz")
    assert frame.has_feature("satellite_bt_k")
    assert frame.shape[:2] == grid.shape
    assert frame.get_feature("radar_reflectivity_dbz")[0, 0] == pytest.approx(40.0, abs=0.5)
