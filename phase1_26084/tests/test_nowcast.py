"""Unit tests for 0–6 hour nowcast engine and ETA module."""

from datetime import datetime
import numpy as np
import pytest

from phase1_26084.tracking.storm_cell import StormCell
from phase1_26084.fusion.grid import CommonGrid
from phase1_26084.fusion.spatiotemporal import FusedFrame
from phase1_26084.nowcast.engine import NowcastEngine
from phase1_26084.nowcast.arrival_time import calculate_storm_arrival_for_location


def test_nowcast_horizons():
    grid = CommonGrid(12.0, 14.0, 79.0, 81.0, 2.0)
    frame = FusedFrame(
        timestamp=datetime.utcnow(),
        grid=grid,
        feature_names=["radar_reflectivity_dbz"],
        tensor=np.full((grid.shape[0], grid.shape[1], 1), 40.0, dtype=np.float32)
    )

    storm = StormCell(
        storm_id="STM_TEST",
        timestamp=datetime.utcnow(),
        centroid_lat=13.0,
        centroid_lon=79.5,
        area_km2=80.0,
        intensity=50.0,
        confidence=0.9,
        velocity_u_kmh=20.0,
        velocity_v_kmh=10.0,
        speed_kmh=22.36,
        heading_deg=63.4
    )

    engine = NowcastEngine()
    nowcasts = engine.generate_nowcast([storm], frame)

    expected_horizons = [15, 30, 60, 120, 180, 240, 300, 360]
    for h in expected_horizons:
        assert h in nowcasts
        fc = nowcasts[h]
        assert len(fc.predicted_storms) == 1
        pcell = fc.predicted_storms[0]
        assert pcell.predicted_lon > storm.centroid_lon  # Extrapolated Eastward
        assert pcell.confidence < storm.confidence  # Decayed with lead time


def test_storm_arrival_time():
    t0 = datetime(2026, 6, 15, 14, 0, 0)
    storm = StormCell(
        storm_id="STM_APPROACH",
        timestamp=t0,
        centroid_lat=13.0,
        centroid_lon=80.0,
        area_km2=60.0,
        intensity=50.0,
        confidence=0.85,
        velocity_u_kmh=30.0,  # Moving due East
        velocity_v_kmh=0.0,
        speed_kmh=30.0,
        heading_deg=90.0
    )

    # Target is East of storm at lon 80.2 (~22 km away)
    summary = calculate_storm_arrival_for_location(
        target_lat=13.0,
        target_lon=80.2,
        storms=[storm],
        hazards_by_storm={},
        current_time=t0,
        target_label="East_Observatory"
    )

    assert summary.is_approaching is True
    assert summary.estimated_arrival_minutes is not None
    assert 30.0 <= summary.estimated_arrival_minutes <= 60.0
