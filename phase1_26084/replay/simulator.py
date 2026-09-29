"""Realistic Synthetic Storm Event Generator for testing and historical replay demonstration.
All outputs are clearly labelled as SIMULATED/SAMPLE.
"""

from __future__ import annotations
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Tuple
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

from ..ingestion.base import ObservationGrid, PointObservations, ObservationMetadata
from ..fusion.grid import CommonGrid


def generate_synthetic_storm_sequence(
    output_dir: str | Path,
    num_frames: int = 6,
    time_step_minutes: int = 10,
    start_time: Optional[datetime] = None,
    grid: Optional[CommonGrid] = None
) -> List[Dict[str, str]]:
    """Generate a realistic developing convective storm sequence across multiple formats."""
    out_path = Path(output_dir)
    out_path.mkdir(parents=True, exist_ok=True)

    if start_time is None:
        start_time = datetime(2026, 6, 15, 14, 0, 0)

    if grid is None:
        grid = CommonGrid(min_lat=12.0, max_lat=14.5, min_lon=79.0, max_lon=81.5, resolution_km=2.0)

    h, w = grid.shape
    frame_manifests = []

    # Initial storm parameters
    storm_lat = 13.0
    storm_lon = 79.5
    vel_lat_deg_hr = 0.15  # moving North-East
    vel_lon_deg_hr = 0.25

    for frame_idx in range(num_frames):
        ts = start_time + timedelta(minutes=frame_idx * time_step_minutes)
        dt_hr = (frame_idx * time_step_minutes) / 60.0

        # Current storm center
        curr_lat = storm_lat + vel_lat_deg_hr * dt_hr
        curr_lon = storm_lon + vel_lon_deg_hr * dt_hr

        # Storm intensity grows from 32 dBZ to 55 dBZ, then stabilizes
        intensity_factor = min(1.0, 0.4 + 0.6 * (frame_idx / max(1, num_frames - 2)))
        peak_dbz = float(30.0 + 26.0 * intensity_factor)
        min_sat_bt = float(285.0 - 75.0 * intensity_factor)  # cools to ~210K

        # 2D Gaussian storm core
        lat_dist = (grid.lat_mesh - curr_lat) * 111.0
        lon_dist = (grid.lon_mesh - curr_lon) * (111.0 * np.cos(np.radians(curr_lat)))
        dist_sq = (lat_dist**2 + lon_dist**2)

        sigma_km = 12.0 + 3.0 * intensity_factor
        core = np.exp(-dist_sq / (2.0 * sigma_km**2))

        # 1. Radar Reflectivity Field
        dbz_field = -10.0 + (peak_dbz + 10.0) * core + np.random.normal(0, 1.0, (h, w))
        dbz_field = np.clip(dbz_field, -10.0, 75.0).astype(np.float32)

        # 2. Radar Radial Velocity Field (divergence signature in storm core)
        vel_field = (lat_dist / (sigma_km + 1.0)) * 15.0 * core + np.random.normal(0, 0.5, (h, w))
        vel_field = np.clip(vel_field, -60.0, 60.0).astype(np.float32)

        # 3. Satellite Brightness Temp Field (cold cloud top over storm)
        sat_field = 298.0 - (298.0 - min_sat_bt) * np.exp(-dist_sq / (2.0 * (sigma_km * 1.5)**2))
        sat_field = np.clip(sat_field, 180.0, 320.0).astype(np.float32)

        # 4. Lightning Flashes
        num_flashes = int(intensity_factor * 40)
        flash_records = []
        if num_flashes > 0:
            fl_lats = np.random.normal(curr_lat, 0.08, num_flashes)
            fl_lons = np.random.normal(curr_lon, 0.08, num_flashes)
            currents = np.random.normal(-25.0, 15.0, num_flashes)
            for i in range(num_flashes):
                flash_records.append({
                    "timestamp": (ts + timedelta(seconds=int(i * 10))).isoformat(),
                    "lat": float(fl_lats[i]),
                    "lon": float(fl_lons[i]),
                    "peak_current_ka": float(currents[i]),
                    "flash_type": "CG" if i % 3 == 0 else "IC"
                })

        # Save Frame Artifacts
        ts_tag = ts.strftime("%Y%m%d_%H%M%S")
        radar_nc_path = out_path / f"simulated_radar_{ts_tag}.nc"
        sat_nc_path = out_path / f"simulated_satellite_{ts_tag}.nc"
        ltg_csv_path = out_path / f"simulated_lightning_{ts_tag}.csv"
        weather_json_path = out_path / f"simulated_weather_{ts_tag}.json"

        # Write Radar NetCDF
        if nc is not None:
            _write_radar_netcdf(radar_nc_path, dbz_field, vel_field, grid.lats, grid.lons, ts)
        else:
            # Fallback to JSON
            radar_nc_path = out_path / f"simulated_radar_{ts_tag}.json"
            _write_radar_json(radar_nc_path, dbz_field, grid.lats, grid.lons, ts)

        # Write Satellite NetCDF
        if nc is not None:
            _write_sat_netcdf(sat_nc_path, sat_field, grid.lats, grid.lons, ts)
        else:
            sat_nc_path = out_path / f"simulated_satellite_{ts_tag}.json"
            _write_sat_json(sat_nc_path, sat_field, grid.lats, grid.lons, ts)

        # Write Lightning CSV
        pd.DataFrame(flash_records).to_csv(ltg_csv_path, index=False)

        # Write Surface Weather JSON
        weather_payload = {
            "timestamp": ts.isoformat(),
            "stations": [
                {"lat": 13.0, "lon": 80.2, "temp_c": 32.5, "rh_pct": 78.0, "wind_speed_ms": 12.0, "rain_rate_mm_hr": float(intensity_factor * 45.0)},
                {"lat": 13.5, "lon": 79.8, "temp_c": 28.0, "rh_pct": 88.0, "wind_speed_ms": 18.5, "rain_rate_mm_hr": float(intensity_factor * 80.0)}
            ]
        }
        with open(weather_json_path, "w", encoding="utf-8") as f:
            json.dump(weather_payload, f, indent=2)

        frame_manifests.append({
            "timestamp": ts.isoformat(),
            "radar_path": str(radar_nc_path),
            "satellite_path": str(sat_nc_path),
            "lightning_path": str(ltg_csv_path),
            "weather_path": str(weather_json_path)
        })

    # Save sequence manifest
    manifest_file = out_path / "replay_sequence_manifest.json"
    with open(manifest_file, "w", encoding="utf-8") as f:
        json.dump({"manifest": frame_manifests, "is_simulated": True}, f, indent=2)

    return frame_manifests


def _write_radar_netcdf(path: Path, dbz: np.ndarray, vel: np.ndarray, lats: np.ndarray, lons: np.ndarray, ts: datetime):
    with nc.Dataset(str(path), "w", format="NETCDF4") as ds:
        ds.title = "SIMULATED Doppler Weather Radar Dataset"
        ds.simulated = 1
        ds.timestamp = ts.isoformat()
        ds.createDimension("lat", len(lats))
        ds.createDimension("lon", len(lons))

        lat_var = ds.createVariable("lat", "f4", ("lat",))
        lon_var = ds.createVariable("lon", "f4", ("lon",))
        dbz_var = ds.createVariable("reflectivity", "f4", ("lat", "lon"))
        vel_var = ds.createVariable("velocity", "f4", ("lat", "lon"))

        lat_var[:] = lats
        lon_var[:] = lons
        dbz_var[:, :] = dbz
        vel_var[:, :] = vel

        dbz_var.units = "dBZ"
        vel_var.units = "m/s"


def _write_sat_netcdf(path: Path, bt: np.ndarray, lats: np.ndarray, lons: np.ndarray, ts: datetime):
    with nc.Dataset(str(path), "w", format="NETCDF4") as ds:
        ds.title = "SIMULATED INSAT-3D Geostationary Satellite Dataset"
        ds.simulated = 1
        ds.satellite_name = "INSAT-3D_SIMULATED"
        ds.timestamp = ts.isoformat()
        ds.createDimension("lat", len(lats))
        ds.createDimension("lon", len(lons))

        lat_var = ds.createVariable("lat", "f4", ("lat",))
        lon_var = ds.createVariable("lon", "f4", ("lon",))
        bt_var = ds.createVariable("TIR1", "f4", ("lat", "lon"))

        lat_var[:] = lats
        lon_var[:] = lons
        bt_var[:, :] = bt
        bt_var.units = "Kelvin"


def _write_radar_json(path: Path, dbz: np.ndarray, lats: np.ndarray, lons: np.ndarray, ts: datetime):
    payload = {
        "source_name": "Doppler_Weather_Radar_SIMULATED",
        "variable": "reflectivity",
        "units": "dBZ",
        "timestamp": ts.isoformat(),
        "is_simulated": True,
        "lats": lats.tolist(),
        "lons": lons.tolist(),
        "data": dbz.tolist()
    }
    with open(path, "w", encoding="utf-8") as f:
        json.dump(payload, f)


def _write_sat_json(path: Path, bt: np.ndarray, lats: np.ndarray, lons: np.ndarray, ts: datetime):
    payload = {
        "source_name": "INSAT-3D_SIMULATED",
        "variable": "TIR1_BT",
        "units": "Kelvin",
        "timestamp": ts.isoformat(),
        "is_simulated": True,
        "lats": lats.tolist(),
        "lons": lons.tolist(),
        "data": bt.tolist()
    }
    with open(path, "w", encoding="utf-8") as f:
        json.dump(payload, f)
