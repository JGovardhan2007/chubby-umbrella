"""Unit tests for Storm Identification and Hungarian Kinematic Tracking."""

from datetime import datetime, timedelta
import numpy as np
import pytest

from phase1_26084.detection.convective_initiation import CandidateCell
from phase1_26084.tracking.tracker import StormTracker, haversine_distance_km


def test_storm_tracker_continuation():
    tracker = StormTracker()
    t0 = datetime(2026, 6, 15, 14, 0, 0)
    t1 = t0 + timedelta(minutes=10)

    # Frame 0 candidate
    c0 = CandidateCell(
        cell_id="CELL_1",
        timestamp=t0,
        centroid_lat=13.0,
        centroid_lon=80.0,
        area_km2=50.0,
        pixel_count=25,
        bbox_latlon=(12.9, 79.9, 13.1, 80.1),
        intensity_indicators={"max_dbz": 45.0},
        confidence_score=0.8,
        stage="DEVELOPING",
        mask=np.zeros((10, 10), dtype=bool)
    )

    storms0 = tracker.update([c0], t0)
    assert len(storms0) == 1
    sid = storms0[0].storm_id

    # Frame 1 candidate (storm moved East-North-East)
    c1 = CandidateCell(
        cell_id="CELL_2",
        timestamp=t1,
        centroid_lat=13.03,
        centroid_lon=80.05,
        area_km2=65.0,
        pixel_count=32,
        bbox_latlon=(12.93, 79.95, 13.13, 80.15),
        intensity_indicators={"max_dbz": 50.0},
        confidence_score=0.85,
        stage="INTENSIFYING",
        mask=np.zeros((10, 10), dtype=bool)
    )

    storms1 = tracker.update([c1], t1)
    assert len(storms1) == 1
    assert storms1[0].storm_id == sid  # Persistent ID
    assert storms1[0].speed_kmh > 0.0
    assert storms1[0].growth_rate_km2_hr > 0.0
    assert len(storms1[0].history) == 2
