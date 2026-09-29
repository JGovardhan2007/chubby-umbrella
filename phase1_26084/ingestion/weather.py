"""Supplementary surface weather and Automatic Weather Station (AWS) loader.
Supports CSV, JSON, NetCDF formats for temperature, RH, pressure, wind, and rain rate.
"""

from __future__ import annotations
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Union
import json
import numpy as np
import pandas as pd

try:
    import netCDF4 as nc
except ImportError:
    nc = None

from .base import BaseLoader, ObservationMetadata, PointObservations


class WeatherLoader(BaseLoader):
    """Loads AWS and surface meteorological station observations."""

    def load(
        self,
        file_path: str,
        is_simulated: bool = False,
        **kwargs
    ) -> PointObservations:
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"Weather file not found: {file_path}")

        suffix = path.suffix.lower()
        if suffix in [".csv"]:
            return self._load_csv(path, is_simulated, **kwargs)
        elif suffix in [".json", ".geojson"]:
            return self._load_json(path, is_simulated, **kwargs)
        elif suffix in [".nc", ".nc4", ".netcdf"]:
            return self._load_netcdf(path, is_simulated, **kwargs)
        else:
            raise ValueError(f"Unsupported weather file extension: {suffix}")

    def _load_csv(
        self,
        path: Path,
        is_simulated: bool,
        **kwargs
    ) -> PointObservations:
        df = pd.read_csv(path)
        rename_map = {
            "latitude": "lat",
            "longitude": "lon",
            "temperature": "temp_c",
            "temperature_c": "temp_c",
            "relative_humidity": "rh_pct",
            "humidity": "rh_pct",
            "rh": "rh_pct",
            "pressure": "pressure_hpa",
            "wind_speed": "wind_speed_ms",
            "wind_spd": "wind_speed_ms",
            "wind_direction": "wind_dir_deg",
            "rain_rate": "rain_rate_mm_hr",
            "time": "timestamp",
            "datetime": "timestamp"
        }
        for old, new in rename_map.items():
            if old in df.columns and new not in df.columns:
                df[new] = df[old]

        if "timestamp" in df.columns:
            df["timestamp"] = pd.to_datetime(df["timestamp"])
            ref_ts = df["timestamp"].min() if not df.empty else datetime.utcnow()
        else:
            ref_ts = datetime.utcnow()
            df["timestamp"] = ref_ts

        metadata = ObservationMetadata(
            source_name="Surface_AWS_Network",
            variable="surface_meteorology",
            units="composite",
            timestamp=ref_ts if isinstance(ref_ts, datetime) else ref_ts.to_pydatetime(),
            is_simulated=is_simulated
        )
        return PointObservations(df=df, metadata=metadata)

    def _load_json(
        self,
        path: Path,
        is_simulated: bool,
        **kwargs
    ) -> PointObservations:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        records = []
        if isinstance(data, dict) and "stations" in data:
            records = data["stations"]
        elif isinstance(data, list):
            records = data
        elif isinstance(data, dict) and "features" in data:
            for feat in data["features"]:
                coords = feat["geometry"]["coordinates"]
                props = feat.get("properties", {})
                rec = {
                    "lon": coords[0],
                    "lat": coords[1],
                    **props
                }
                records.append(rec)
        else:
            raise ValueError(f"Unrecognized weather JSON schema in {path}")

        df = pd.DataFrame(records)
        if not df.empty and "timestamp" in df.columns:
            df["timestamp"] = pd.to_datetime(df["timestamp"])
            ref_ts = df["timestamp"].min().to_pydatetime()
        else:
            ref_ts = datetime.utcnow()

        metadata = ObservationMetadata(
            source_name="Surface_AWS_JSON",
            variable="surface_meteorology",
            units="composite",
            timestamp=ref_ts,
            is_simulated=is_simulated
        )
        return PointObservations(df=df, metadata=metadata)

    def _load_netcdf(
        self,
        path: Path,
        is_simulated: bool,
        **kwargs
    ) -> PointObservations:
        if nc is None:
            raise ImportError("netCDF4 is required for NetCDF reading.")

        with nc.Dataset(str(path), "r") as ds:
            lat = np.array(ds.variables["lat"][:] if "lat" in ds.variables else ds.variables["latitude"][:])
            lon = np.array(ds.variables["lon"][:] if "lon" in ds.variables else ds.variables["longitude"][:])
            temp = np.array(ds.variables["temperature"][:] if "temperature" in ds.variables else np.full_like(lat, 28.0))

            df = pd.DataFrame({
                "lat": lat,
                "lon": lon,
                "temp_c": temp,
                "timestamp": [datetime.utcnow()] * len(lat)
            })

            metadata = ObservationMetadata(
                source_name="Surface_AWS_NetCDF",
                variable="surface_meteorology",
                units="composite",
                timestamp=datetime.utcnow(),
                is_simulated=is_simulated
            )
            return PointObservations(df=df, metadata=metadata)
