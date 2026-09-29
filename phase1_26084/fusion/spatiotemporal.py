"""Multi-source Spatio-Temporal Data Fusion Engine.
Aligns Radar, Satellite, Lightning, and Weather observations into a unified feature representation.
"""

from __future__ import annotations
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple, Union
import numpy as np

from ..ingestion.base import ObservationGrid, PointObservations, ObservationMetadata
from ..preprocessing.reproject import resample_grid_to_target, point_observations_to_grid
from ..preprocessing.qc import DataQualityController, DataQualityReport
from .grid import CommonGrid


@dataclass
class FusedFrame:
    """Multi-variable aligned feature tensor for a single time slice."""
    timestamp: datetime
    grid: CommonGrid
    feature_names: List[str]
    tensor: np.ndarray  # Shape: (height, width, num_features)
    metadata: Dict[str, Any] = field(default_factory=dict)
    qc_report: Optional[DataQualityReport] = None

    def get_feature(self, feature_name: str) -> Optional[np.ndarray]:
        if feature_name in self.feature_names:
            idx = self.feature_names.index(feature_name)
            return self.tensor[:, :, idx]
        return None

    def has_feature(self, feature_name: str) -> bool:
        return feature_name in self.feature_names

    @property
    def shape(self) -> Tuple[int, int, int]:
        return self.tensor.shape


@dataclass
class SpatioTemporalDataCube:
    """Unified 4D Data Cube (time × lat × lon × features)."""
    timestamps: List[datetime]
    grid: CommonGrid
    feature_names: List[str]
    tensor: np.ndarray  # Shape: (time, height, width, num_features)
    frames: List[FusedFrame]

    @property
    def shape(self) -> Tuple[int, int, int, int]:
        return self.tensor.shape

    def get_latest_frame(self) -> FusedFrame:
        return self.frames[-1]


class MultiSourceFusionEngine:
    """Fuses multi-source meteorological observations onto a standardized common grid."""

    def __init__(self, grid: CommonGrid, config: Optional[Dict[str, Any]] = None):
        self.grid = grid
        self.config = config or {}
        self.qc = DataQualityController(self.config)

    def fuse_frame(
        self,
        timestamp: datetime,
        radar_reflectivity: Optional[ObservationGrid] = None,
        radar_velocity: Optional[ObservationGrid] = None,
        satellite_bt: Optional[ObservationGrid] = None,
        satellite_wv: Optional[ObservationGrid] = None,
        lightning: Optional[PointObservations] = None,
        surface_weather: Optional[PointObservations] = None,
        previous_frame: Optional[FusedFrame] = None,
        time_delta_minutes: float = 10.0
    ) -> FusedFrame:
        """Fuse observations from multiple instruments into a single standardized 3D frame."""
        feature_layers: List[np.ndarray] = []
        feature_names: List[str] = []
        anomalies = []
        summaries = {}
        sources_meta = {}

        # 1. Radar Reflectivity
        if radar_reflectivity is not None:
            clean_radar, q_anom, q_sum = self.qc.validate_grid(radar_reflectivity)
            anomalies.extend(q_anom)
            summaries["radar_reflectivity"] = q_sum

            resampled_dbz = resample_grid_to_target(
                clean_radar.data,
                clean_radar.lats,
                clean_radar.lons,
                self.grid.lats,
                self.grid.lons,
                fill_value=-10.0
            )
            feature_layers.append(resampled_dbz)
            feature_names.append("radar_reflectivity_dbz")
            sources_meta["radar_reflectivity"] = radar_reflectivity.metadata.to_dict()

        # 2. Radar Velocity
        if radar_velocity is not None:
            clean_vel, q_anom, q_sum = self.qc.validate_grid(radar_velocity)
            anomalies.extend(q_anom)
            summaries["radar_velocity"] = q_sum

            resampled_vel = resample_grid_to_target(
                clean_vel.data,
                clean_vel.lats,
                clean_vel.lons,
                self.grid.lats,
                self.grid.lons,
                fill_value=0.0
            )
            feature_layers.append(resampled_vel)
            feature_names.append("radar_velocity_ms")
            sources_meta["radar_velocity"] = radar_velocity.metadata.to_dict()

        # 3. Satellite TIR1 Brightness Temperature
        if satellite_bt is not None:
            clean_sat, q_anom, q_sum = self.qc.validate_grid(satellite_bt)
            anomalies.extend(q_anom)
            summaries["satellite_bt"] = q_sum

            resampled_sat = resample_grid_to_target(
                clean_sat.data,
                clean_sat.lats,
                clean_sat.lons,
                self.grid.lats,
                self.grid.lons,
                fill_value=300.0
            )
            feature_layers.append(resampled_sat)
            feature_names.append("satellite_bt_k")
            sources_meta["satellite_bt"] = satellite_bt.metadata.to_dict()

        # 4. Satellite Water Vapor
        if satellite_wv is not None:
            clean_wv, q_anom, q_sum = self.qc.validate_grid(satellite_wv)
            anomalies.extend(q_anom)
            summaries["satellite_wv"] = q_sum

            resampled_wv = resample_grid_to_target(
                clean_wv.data,
                clean_wv.lats,
                clean_wv.lons,
                self.grid.lats,
                self.grid.lons,
                fill_value=250.0
            )
            feature_layers.append(resampled_wv)
            feature_names.append("satellite_wv_k")
            sources_meta["satellite_wv"] = satellite_wv.metadata.to_dict()

        # 5. Lightning Observations
        if lightning is not None:
            clean_ltg, q_anom, q_sum = self.qc.validate_points(lightning)
            anomalies.extend(q_anom)
            summaries["lightning"] = q_sum

            ltg_density = point_observations_to_grid(
                lats=clean_ltg.df["lat"].values if not clean_ltg.df.empty else np.array([]),
                lons=clean_ltg.df["lon"].values if not clean_ltg.df.empty else np.array([]),
                target_lats=self.grid.lats,
                target_lons=self.grid.lons,
                sigma=1.2,
                cell_size_km=self.grid.resolution_km
            )
            feature_layers.append(ltg_density)
            feature_names.append("lightning_density_flashes_km2")
            sources_meta["lightning"] = lightning.metadata.to_dict()

        # 6. Temporal Trend Features (Cooling rate dT/dt, Reflectivity change dZ/dt)
        if previous_frame is not None and time_delta_minutes > 0:
            if "satellite_bt_k" in feature_names and previous_frame.has_feature("satellite_bt_k"):
                curr_bt = feature_layers[feature_names.index("satellite_bt_k")]
                prev_bt = previous_frame.get_feature("satellite_bt_k")
                # Cooling rate: K / 15-min equivalent
                cooling_rate = (curr_bt - prev_bt) * (15.0 / time_delta_minutes)
                feature_layers.append(cooling_rate)
                feature_names.append("satellite_cooling_rate_k_per_15min")

            if "radar_reflectivity_dbz" in feature_names and previous_frame.has_feature("radar_reflectivity_dbz"):
                curr_dbz = feature_layers[feature_names.index("radar_reflectivity_dbz")]
                prev_dbz = previous_frame.get_feature("radar_reflectivity_dbz")
                growth_rate = (curr_dbz - prev_dbz) * (15.0 / time_delta_minutes)
                feature_layers.append(growth_rate)
                feature_names.append("radar_reflectivity_growth_dbz_per_15min")

        # Fallback if no features were passed
        if not feature_layers:
            dummy = np.zeros(self.grid.shape, dtype=np.float32)
            feature_layers.append(dummy)
            feature_names.append("placeholder")

        tensor = np.stack(feature_layers, axis=-1)
        qc_report = self.qc.generate_report(anomalies, summaries)

        return FusedFrame(
            timestamp=timestamp,
            grid=self.grid,
            feature_names=feature_names,
            tensor=tensor,
            metadata={"sources": sources_meta, "fused_at": datetime.utcnow().isoformat()},
            qc_report=qc_report
        )

    def build_datacube(self, frames: List[FusedFrame]) -> SpatioTemporalDataCube:
        """Combine ordered sequence of FusedFrames into a 4D SpatioTemporalDataCube."""
        if not frames:
            raise ValueError("Cannot build datacube from empty frames list")

        # Harmonize feature set across frames
        common_features = frames[0].feature_names
        timestamps = [f.timestamp for f in frames]

        # Stack into (T, H, W, C)
        cube_tensors = []
        for f in frames:
            aligned_layers = []
            for feat in common_features:
                if f.has_feature(feat):
                    aligned_layers.append(f.get_feature(feat))
                else:
                    aligned_layers.append(np.zeros(self.grid.shape, dtype=np.float32))
            cube_tensors.append(np.stack(aligned_layers, axis=-1))

        stacked_4d = np.stack(cube_tensors, axis=0)

        return SpatioTemporalDataCube(
            timestamps=timestamps,
            grid=self.grid,
            feature_names=common_features,
            tensor=stacked_4d,
            frames=frames
        )
