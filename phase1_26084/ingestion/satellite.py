"""Geostationary Satellite loader for INSAT-3D / INSAT-3DR observations.
Supports Thermal Infrared (TIR-1, TIR-2), Water Vapor (WV), and derived Brightness Temperature.
Supports NetCDF4, HDF5, GeoTIFF, CSV, and JSON.
"""

from __future__ import annotations
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Union
import json
import numpy as np
import pandas as pd
import tifffile

try:
    import netCDF4 as nc
except ImportError:
    nc = None

try:
    import h5py
except ImportError:
    h5py = None

from .base import BaseLoader, ObservationGrid, ObservationMetadata


class SatelliteLoader(BaseLoader):
    """Loads INSAT-3D / INSAT-3DR Geostationary satellite imagery (BT in Kelvin)."""

    def load(
        self,
        file_path: str,
        variable_name: Optional[str] = None,
        is_simulated: bool = False,
        **kwargs
    ) -> ObservationGrid:
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"Satellite file not found: {file_path}")

        suffix = path.suffix.lower()
        if suffix in [".nc", ".nc4", ".netcdf"]:
            return self._load_netcdf(path, variable_name, is_simulated, **kwargs)
        elif suffix in [".h5", ".hdf5", ".hdf"]:
            return self._load_hdf5(path, variable_name, is_simulated, **kwargs)
        elif suffix in [".tif", ".tiff", ".geotiff"]:
            return self._load_geotiff(path, variable_name, is_simulated, **kwargs)
        elif suffix in [".json", ".geojson"]:
            return self._load_json(path, variable_name, is_simulated, **kwargs)
        elif suffix in [".csv"]:
            return self._load_csv(path, variable_name, is_simulated, **kwargs)
        else:
            raise ValueError(f"Unsupported satellite file extension: {suffix}")

    def _load_netcdf(
        self,
        path: Path,
        variable_name: Optional[str],
        is_simulated: bool,
        **kwargs
    ) -> ObservationGrid:
        if nc is None:
            raise ImportError("netCDF4 is required for NetCDF reading.")

        with nc.Dataset(str(path), "r") as ds:
            candidate_vars = ["TIR1", "TIR2", "WV", "bt_tir1", "brightness_temperature", "IMG_TIR1", "bt"]
            var_name = variable_name
            if var_name is None or var_name not in ds.variables:
                for candidate in candidate_vars:
                    if candidate in ds.variables:
                        var_name = candidate
                        break
            if var_name is None or var_name not in ds.variables:
                for v in ds.variables:
                    if len(ds.variables[v].shape) >= 2:
                        var_name = v
                        break

            if var_name is None:
                raise ValueError(f"No satellite channel variable found in {path}")

            var = ds.variables[var_name]
            data = np.array(var[:], dtype=np.float32)
            if data.ndim == 3 and data.shape[0] == 1:
                data = data[0]

            lat_var = kwargs.get("lat_var") or ("latitude" if "latitude" in ds.variables else "lat" if "lat" in ds.variables else "y")
            lon_var = kwargs.get("lon_var") or ("longitude" if "longitude" in ds.variables else "lon" if "lon" in ds.variables else "x")

            lats = np.array(ds.variables[lat_var][:]) if lat_var in ds.variables else np.linspace(12.0, 14.5, data.shape[0])
            lons = np.array(ds.variables[lon_var][:]) if lon_var in ds.variables else np.linspace(79.0, 81.5, data.shape[1])

            time_val = getattr(ds, "time_coverage_start", None) or getattr(ds, "timestamp", None)
            if time_val:
                try:
                    ts = datetime.fromisoformat(str(time_val).replace("Z", "+00:00"))
                except Exception:
                    ts = datetime.utcnow()
            else:
                ts = datetime.utcnow()

            units = getattr(var, "units", "Kelvin")
            raw_attrs = {k: str(getattr(ds, k)) for k in ds.ncattrs()}

            metadata = ObservationMetadata(
                source_name=getattr(ds, "satellite_name", "INSAT-3D/3DR"),
                variable=var_name,
                units=units,
                timestamp=ts,
                spatial_resolution_km=kwargs.get("spatial_resolution_km", 4.0),
                valid_range=(150.0, 350.0),
                missing_value=-9999.0,
                raw_attributes=raw_attrs,
                is_simulated=is_simulated or getattr(ds, "simulated", False)
            )

            return ObservationGrid(data=data, lats=lats, lons=lons, metadata=metadata)

    def _load_hdf5(
        self,
        path: Path,
        variable_name: Optional[str],
        is_simulated: bool,
        **kwargs
    ) -> ObservationGrid:
        if h5py is None:
            raise ImportError("h5py is required for HDF5 reading.")

        with h5py.File(str(path), "r") as f:
            dataset_key = variable_name
            if dataset_key is None or dataset_key not in f:
                for key in ["IMG_TIR1", "TIR1", "TIR2", "WV", "bt", "data"]:
                    if key in f:
                        dataset_key = key
                        break
            if dataset_key is None:
                def find_datasets(name, obj):
                    nonlocal dataset_key
                    if dataset_key is None and isinstance(obj, h5py.Dataset) and len(obj.shape) >= 2:
                        dataset_key = name
                f.visititems(find_datasets)

            if dataset_key is None:
                raise ValueError(f"No valid satellite 2D dataset in HDF5 {path}")

            dset = f[dataset_key]
            data = np.array(dset[:], dtype=np.float32)
            if data.ndim == 3 and data.shape[0] == 1:
                data = data[0]

            lats = np.array(f["latitude"][:]) if "latitude" in f else np.linspace(12.0, 14.5, data.shape[0])
            lons = np.array(f["longitude"][:]) if "longitude" in f else np.linspace(79.0, 81.5, data.shape[1])

            ts_str = f.attrs.get("timestamp", None)
            ts = datetime.fromisoformat(str(ts_str)) if ts_str else datetime.utcnow()

            metadata = ObservationMetadata(
                source_name=str(f.attrs.get("satellite_name", "INSAT-3D_HDF5")),
                variable=variable_name or "TIR1_BT",
                units=str(f.attrs.get("units", "Kelvin")),
                timestamp=ts,
                spatial_resolution_km=kwargs.get("spatial_resolution_km", 4.0),
                valid_range=(150.0, 350.0),
                raw_attributes={k: str(v) for k, v in f.attrs.items()},
                is_simulated=is_simulated
            )
            return ObservationGrid(data=data, lats=lats, lons=lons, metadata=metadata)

    def _load_geotiff(
        self,
        path: Path,
        variable_name: Optional[str],
        is_simulated: bool,
        **kwargs
    ) -> ObservationGrid:
        data = tifffile.imread(str(path)).astype(np.float32)
        if data.ndim == 3 and data.shape[0] == 1:
            data = data[0]

        min_lat = kwargs.get("min_lat", 12.0)
        max_lat = kwargs.get("max_lat", 14.5)
        min_lon = kwargs.get("min_lon", 79.0)
        max_lon = kwargs.get("max_lon", 81.5)

        lats = np.linspace(min_lat, max_lat, data.shape[0])
        lons = np.linspace(min_lon, max_lon, data.shape[1])

        metadata = ObservationMetadata(
            source_name="INSAT_GeoTIFF",
            variable=variable_name or "TIR1_BT",
            units=kwargs.get("units", "Kelvin"),
            timestamp=kwargs.get("timestamp", datetime.utcnow()),
            spatial_resolution_km=kwargs.get("spatial_resolution_km", 4.0),
            valid_range=(150.0, 350.0),
            is_simulated=is_simulated
        )
        return ObservationGrid(data=data, lats=lats, lons=lons, metadata=metadata)

    def _load_json(
        self,
        path: Path,
        variable_name: Optional[str],
        is_simulated: bool,
        **kwargs
    ) -> ObservationGrid:
        with open(path, "r", encoding="utf-8") as f:
            payload = json.load(f)

        data = np.array(payload["data"], dtype=np.float32)
        lats = np.array(payload.get("lats", np.linspace(12.0, 14.5, data.shape[0])))
        lons = np.array(payload.get("lons", np.linspace(79.0, 81.5, data.shape[1])))
        ts = datetime.fromisoformat(payload["timestamp"]) if "timestamp" in payload else datetime.utcnow()

        metadata = ObservationMetadata(
            source_name=payload.get("source_name", "INSAT_JSON"),
            variable=payload.get("variable", variable_name or "TIR1_BT"),
            units=payload.get("units", "Kelvin"),
            timestamp=ts,
            spatial_resolution_km=payload.get("spatial_resolution_km", 4.0),
            valid_range=tuple(payload.get("valid_range", [150.0, 350.0])),
            missing_value=payload.get("missing_value", -9999.0),
            raw_attributes=payload.get("raw_attributes", {}),
            is_simulated=payload.get("is_simulated", is_simulated)
        )
        return ObservationGrid(data=data, lats=lats, lons=lons, metadata=metadata)

    def _load_csv(
        self,
        path: Path,
        variable_name: Optional[str],
        is_simulated: bool,
        **kwargs
    ) -> ObservationGrid:
        df = pd.read_csv(path)
        if "lat" in df.columns and "lon" in df.columns and ("bt" in df.columns or "TIR1" in df.columns or "val" in df.columns):
            val_col = "bt" if "bt" in df.columns else ("TIR1" if "TIR1" in df.columns else "val")
            pivot = df.pivot(index="lat", columns="lon", values=val_col)
            data = pivot.values.astype(np.float32)
            lats = np.array(pivot.index)
            lons = np.array(pivot.columns)
        else:
            data = df.values.astype(np.float32)
            lats = np.linspace(12.0, 14.5, data.shape[0])
            lons = np.linspace(79.0, 81.5, data.shape[1])

        metadata = ObservationMetadata(
            source_name="INSAT_CSV",
            variable=variable_name or "TIR1_BT",
            units="Kelvin",
            timestamp=kwargs.get("timestamp", datetime.utcnow()),
            spatial_resolution_km=kwargs.get("spatial_resolution_km", 4.0),
            valid_range=(150.0, 350.0),
            is_simulated=is_simulated
        )
        return ObservationGrid(data=data, lats=lats, lons=lons, metadata=metadata)
