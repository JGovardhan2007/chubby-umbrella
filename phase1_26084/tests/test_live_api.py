"""Unit tests for Live API Ingestion module."""

import pytest
from unittest.mock import patch, MagicMock
import numpy as np

from phase1_26084.fusion.grid import CommonGrid
from phase1_26084.ingestion.live_api import LiveDataFetcher


def test_live_data_fetcher_mock():
    grid = CommonGrid(12.0, 14.0, 79.0, 81.0, 2.0)
    fetcher = LiveDataFetcher()

    mock_resp = MagicMock()
    mock_resp.json.return_value = [
        {
            "current": {
                "temperature_2m": 31.5,
                "relative_humidity_2m": 82.0,
                "precipitation": 15.0,
                "rain": 12.0,
                "wind_speed_10m": 25.0,
                "wind_gusts_10m": 45.0,
                "cloud_cover": 90.0
            },
            "hourly": {
                "lightning_potential": [0.8]
            }
        }
    ]
    mock_resp.raise_for_status = MagicMock()

    with patch("requests.get", return_value=mock_resp):
        radar, sat, ltg, wx = fetcher.fetch_live_grid(grid)
        assert radar.metadata.is_simulated is False
        assert sat.metadata.is_simulated is False
        assert ltg.metadata.is_simulated is False
        assert radar.shape == grid.shape
