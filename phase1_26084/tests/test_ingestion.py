"""Unit tests for multi-source meteorological data ingestion."""

from datetime import datetime
import json
import numpy as np
import pandas as pd
import pytest
from pathlib import Path

from phase1_26084.ingestion.base import ObservationMetadata, ObservationGrid, PointObservations
from phase1_26084.ingestion.radar import RadarLoader
from phase1_26084.ingestion.satellite import SatelliteLoader
from phase1_26084.ingestion.lightning import LightningLoader
from phase1_26084.ingestion.weather import WeatherLoader


def test_radar_loader_json(tmp_path):
    loader = RadarLoader()
    json_path = tmp_path / "test_radar.json"
    data = np.random.uniform(10, 50, (20, 20)).tolist()
    payload = {
        "source_name": "Test_Radar",
        "variable": "reflectivity",
        "units": "dBZ",
        "timestamp": datetime.utcnow().isoformat(),
        "data": data
    }
    with open(json_path, "w") as f:
        json.dump(payload, f)

    grid = loader.load(str(json_path))
    assert isinstance(grid, ObservationGrid)
    assert grid.shape == (20, 20)
    assert grid.metadata.units == "dBZ"


def test_satellite_loader_json(tmp_path):
    loader = SatelliteLoader()
    json_path = tmp_path / "test_sat.json"
    data = np.random.uniform(200, 290, (15, 15)).tolist()
    payload = {
        "source_name": "Test_INSAT",
        "variable": "TIR1_BT",
        "units": "Kelvin",
        "timestamp": datetime.utcnow().isoformat(),
        "data": data
    }
    with open(json_path, "w") as f:
        json.dump(payload, f)

    grid = loader.load(str(json_path))
    assert isinstance(grid, ObservationGrid)
    assert grid.metadata.variable == "TIR1_BT"


def test_lightning_loader_csv(tmp_path):
    loader = LightningLoader()
    csv_path = tmp_path / "test_ltg.csv"
    df = pd.DataFrame({
        "lat": [13.0, 13.1, 13.2],
        "lon": [80.0, 80.1, 80.2],
        "current": [-25.0, 30.0, -15.0],
        "time": [datetime.utcnow().isoformat()] * 3
    })
    df.to_csv(csv_path, index=False)

    obs = loader.load(str(csv_path))
    assert isinstance(obs, PointObservations)
    assert obs.count == 3
    assert "peak_current_ka" in obs.df.columns


def test_weather_loader_json(tmp_path):
    loader = WeatherLoader()
    json_path = tmp_path / "test_wx.json"
    payload = {
        "stations": [
            {"lat": 13.0, "lon": 80.0, "temp_c": 30.5, "rh_pct": 80.0, "wind_speed_ms": 5.0}
        ]
    }
    with open(json_path, "w") as f:
        json.dump(payload, f)

    obs = loader.load(str(json_path))
    assert isinstance(obs, PointObservations)
    assert obs.count == 1
