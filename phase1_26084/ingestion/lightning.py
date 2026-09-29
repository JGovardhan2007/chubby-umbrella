"""Ground-based Lightning network observations loader.
Supports CSV, JSON, and NetCDF formats.
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


class LightningLoader(BaseLoader):
    """Loads ground-based lightning flash observations."""

    def load(
        self,
        file_path: str,
        is_simulated: bool = False,
        **kwargs
    ) -> PointObservations:
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"Lightning file not found: {file_path}")

        suffix = path.suffix.lower()
        if suffix in [".csv"]:
            return self._load_csv(path, is_simulated, **kwargs)
        elif suffix in [".json", ".geojson"]:
            return self._load_json(path, is_simulated, **kwargs)
        elif suffix in [".nc", ".nc4", ".netcdf"]:
            return self._load_netcdf(path, is_simulated, **kwargs)
        else:
            raise ValueError(f"Unsupported lightning file extension: {suffix}")

    def _load_csv(
        self,
        path: Path,
        is_simulated: bool,
        **kwargs
    ) -> PointObservations:
        df = pd.read_csv(path)
        # Standardize column names
        rename_map = {
            "latitude": "lat",
            "lat": "lat",
            "longitude": "lon",
            "lon": "lon",
            "time": "timestamp",
            "datetime": "timestamp",
            "current": "peak_current_ka",
            "peak_current": "peak_current_ka",
            "amplitude": "peak_current_ka",
            "type": "flash_type"
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

        if "peak_current_ka" not in df.columns:
            df["peak_current_ka"] = 25.0
        if "flash_type" not in df.columns:
            df["flash_type"] = "CG"

        metadata = ObservationMetadata(
            source_name="Ground_Lightning_Network",
            variable="lightning_flash",
            units="flash_count",
            timestamp=ref_ts if isinstance(ref_ts, datetime) else ref_ts.to_pydatetime(),
            valid_range=(-300.0, 300.0),
            is_simulated=is_simulated
        )
        return PointObservations(df=df[["timestamp", "lat", "lon", "peak_current_ka", "flash_type"]], metadata=metadata)

    def _load_json(
        self,
        path: Path,
        is_simulated: bool,
        **kwargs
    ) -> PointObservations:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        records = []
        if isinstance(data, dict) and "features" in data:  # GeoJSON
            for feat in data["features"]:
                coords = feat["geometry"]["coordinates"]
                props = feat.get("properties", {})
                records.append({
                    "lon": coords[0],
                    "lat": coords[1],
                    "timestamp": props.get("timestamp", datetime.utcnow().isoformat()),
                    "peak_current_ka": props.get("peak_current_ka", 20.0),
                    "flash_type": props.get("flash_type", "CG")
                })
        elif isinstance(data, list):
            records = data
        elif isinstance(data, dict) and "flashes" in data:
            records = data["flashes"]
        else:
            raise ValueError(f"Unrecognized lightning JSON structure in {path}")

        df = pd.DataFrame(records)
        if not df.empty and "timestamp" in df.columns:
            df["timestamp"] = pd.to_datetime(df["timestamp"])
            ref_ts = df["timestamp"].min().to_pydatetime()
        else:
            ref_ts = datetime.utcnow()

        metadata = ObservationMetadata(
            source_name="Ground_Lightning_Network_JSON",
            variable="lightning_flash",
            units="flash_count",
            timestamp=ref_ts,
            valid_range=(-300.0, 300.0),
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
            current = np.array(ds.variables["current"][:] if "current" in ds.variables else np.full_like(lat, 25.0))
            ts_var = ds.variables.get("time") or ds.variables.get("timestamp")

            if ts_var is not None:
                timestamps = [datetime.utcfromtimestamp(t) for t in ts_var[:]]
            else:
                timestamps = [datetime.utcnow()] * len(lat)

            df = pd.DataFrame({
                "timestamp": timestamps,
                "lat": lat,
                "lon": lon,
                "peak_current_ka": current,
                "flash_type": ["CG"] * len(lat)
            })

            metadata = ObservationMetadata(
                source_name="Ground_Lightning_NetCDF",
                variable="lightning_flash",
                units="flash_count",
                timestamp=timestamps[0] if timestamps else datetime.utcnow(),
                is_simulated=is_simulated
            )
            return PointObservations(df=df, metadata=metadata)
