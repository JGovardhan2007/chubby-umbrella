"""Storm Cell Identification and Tracking (SCIT/TITAN-style Hungarian centroid tracking)."""

from __future__ import annotations
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
import numpy as np
from scipy.optimize import linear_sum_assignment

from ..detection.convective_initiation import CandidateCell
from .storm_cell import StormCell, StormHistoryPoint


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate great-circle distance between two coordinates in kilometers."""
    r_earth = 6371.0
    phi1, phi2 = np.radians(lat1), np.radians(lat2)
    dphi = np.radians(lat2 - lat1)
    dlambda = np.radians(lon2 - lon1)

    a = np.sin(dphi / 2.0)**2 + np.cos(phi1) * np.cos(phi2) * np.sin(dlambda / 2.0)**2
    c = 2.0 * np.arctan2(np.sqrt(a), np.sqrt(1.0 - a))
    return float(r_earth * c)


class StormTracker:
    """Tracks convective storm cells across sequential time frames."""

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        trk_cfg = self.config.get("storm_tracking", {})
        self.max_tracking_dist_km = trk_cfg.get("max_tracking_distance_km", 40.0)
        self.max_time_gap_min = trk_cfg.get("max_tracking_time_gap_minutes", 30.0)

        self._active_storms: Dict[str, StormCell] = {}
        self._storm_counter: int = 1

    def update(self, candidates: List[CandidateCell], timestamp: datetime) -> List[StormCell]:
        """Update tracker with candidate cells from current frame."""
        if not candidates:
            # Decay active storms if no candidates present
            return []

        active_ids = list(self._active_storms.keys())
        current_storms: List[StormCell] = []

        if not active_ids:
            # Initialize all candidates as new storms
            for cand in candidates:
                storm_id = f"STM_{timestamp.strftime('%y%m%d')}_{self._storm_counter:03d}"
                self._storm_counter += 1

                new_storm = self._create_storm_from_candidate(storm_id, cand)
                self._active_storms[storm_id] = new_storm
                current_storms.append(new_storm)
            return current_storms

        # Build Cost Matrix for Hungarian matching
        # Rows: active existing storms, Cols: new candidate cells
        cost_matrix = np.zeros((len(active_ids), len(candidates)), dtype=np.float32)

        for i, sid in enumerate(active_ids):
            prev_storm = self._active_storms[sid]
            # Predict position based on previous velocity
            dt_hours = max((timestamp - prev_storm.timestamp).total_seconds() / 3600.0, 0.01)
            pred_lat = prev_storm.centroid_lat + (prev_storm.velocity_v_kmh / 111.0) * dt_hours
            cos_lat = np.cos(np.radians(prev_storm.centroid_lat))
            pred_lon = prev_storm.centroid_lon + (prev_storm.velocity_u_kmh / (111.0 * cos_lat)) * dt_hours

            for j, cand in enumerate(candidates):
                dist = haversine_distance_km(pred_lat, pred_lon, cand.centroid_lat, cand.centroid_lon)
                area_ratio = max(cand.area_km2 / max(prev_storm.area_km2, 1.0), prev_storm.area_km2 / max(cand.area_km2, 1.0))

                # Gating cost: high penalty if distance exceeds threshold
                if dist > self.max_tracking_dist_km:
                    cost_matrix[i, j] = 1e5
                else:
                    cost_matrix[i, j] = dist + min(area_ratio, 5.0) * 2.0

        row_ind, col_ind = linear_sum_assignment(cost_matrix)

        matched_cand_indices = set()
        updated_active: Dict[str, StormCell] = {}

        for r, c in zip(row_ind, col_ind):
            if cost_matrix[r, c] < 1e4:  # Valid match
                sid = active_ids[r]
                prev_storm = self._active_storms[sid]
                cand = candidates[c]
                matched_cand_indices.add(c)

                # Compute motion vector and trends
                dt_hours = max((timestamp - prev_storm.timestamp).total_seconds() / 3600.0, 0.001)

                # Kinematics
                dlat = cand.centroid_lat - prev_storm.centroid_lat
                dlon = cand.centroid_lon - prev_storm.centroid_lon
                mean_lat = (cand.centroid_lat + prev_storm.centroid_lat) / 2.0
                cos_lat = np.cos(np.radians(mean_lat))

                dist_v_km = dlat * 111.0  # Northward
                dist_u_km = dlon * (111.0 * cos_lat)  # Eastward

                inst_v_kmh = dist_v_km / dt_hours
                inst_u_kmh = dist_u_km / dt_hours

                # Smooth velocity with previous velocity (EMA)
                alpha = 0.65
                vel_u = alpha * inst_u_kmh + (1 - alpha) * prev_storm.velocity_u_kmh
                vel_v = alpha * inst_v_kmh + (1 - alpha) * prev_storm.velocity_v_kmh
                speed = float(np.hypot(vel_u, vel_v))

                # Heading in meteorological degrees (0° = North, 90° = East)
                heading = float(np.degrees(np.arctan2(vel_u, vel_v)) % 360.0)

                # Trends
                curr_intensity = cand.intensity_indicators.get("max_dbz", 40.0)
                growth_rate = (cand.area_km2 - prev_storm.area_km2) / dt_hours
                intensity_trend = (curr_intensity - prev_storm.intensity) / dt_hours

                prev_ltg = prev_storm.indicators.get("max_lightning_density", 0.0)
                curr_ltg = cand.intensity_indicators.get("max_lightning_density", 0.0)
                ltg_trend = (curr_ltg - prev_ltg) / dt_hours

                # Update history
                new_hist = list(prev_storm.history)
                new_hist.append(StormHistoryPoint(
                    timestamp=prev_storm.timestamp,
                    centroid_lat=prev_storm.centroid_lat,
                    centroid_lon=prev_storm.centroid_lon,
                    max_dbz=prev_storm.intensity,
                    area_km2=prev_storm.area_km2
                ))
                # Keep last 10 points
                new_hist = new_hist[-10:]

                updated_storm = StormCell(
                    storm_id=sid,
                    timestamp=timestamp,
                    centroid_lat=cand.centroid_lat,
                    centroid_lon=cand.centroid_lon,
                    area_km2=cand.area_km2,
                    intensity=curr_intensity,
                    confidence=cand.confidence_score,
                    polygon_coords=cand.polygon_coords,
                    growth_rate_km2_hr=growth_rate,
                    intensity_trend_dbz_hr=intensity_trend,
                    velocity_u_kmh=vel_u,
                    velocity_v_kmh=vel_v,
                    speed_kmh=speed,
                    heading_deg=heading,
                    lightning_trend=ltg_trend,
                    convective_stage=cand.stage,
                    indicators=cand.intensity_indicators,
                    history=new_hist
                )
                updated_active[sid] = updated_storm
                current_storms.append(updated_storm)

        # Unmatched candidates become new storms
        for c, cand in enumerate(candidates):
            if c not in matched_cand_indices:
                storm_id = f"STM_{timestamp.strftime('%y%m%d')}_{self._storm_counter:03d}"
                self._storm_counter += 1

                new_storm = self._create_storm_from_candidate(storm_id, cand)
                updated_active[storm_id] = new_storm
                current_storms.append(new_storm)

        self._active_storms = updated_active
        return current_storms

    def _create_storm_from_candidate(self, storm_id: str, cand: CandidateCell) -> StormCell:
        return StormCell(
            storm_id=storm_id,
            timestamp=cand.timestamp,
            centroid_lat=cand.centroid_lat,
            centroid_lon=cand.centroid_lon,
            area_km2=cand.area_km2,
            intensity=cand.intensity_indicators.get("max_dbz", 40.0),
            confidence=cand.confidence_score,
            polygon_coords=cand.polygon_coords,
            growth_rate_km2_hr=0.0,
            intensity_trend_dbz_hr=0.0,
            velocity_u_kmh=0.0,
            velocity_v_kmh=0.0,
            speed_kmh=0.0,
            heading_deg=0.0,
            lightning_trend=0.0,
            convective_stage=cand.stage,
            indicators=cand.intensity_indicators,
            history=[StormHistoryPoint(
                timestamp=cand.timestamp,
                centroid_lat=cand.centroid_lat,
                centroid_lon=cand.centroid_lon,
                max_dbz=cand.intensity_indicators.get("max_dbz", 40.0),
                area_km2=cand.area_km2
            )]
        )

    def get_active_storms(self) -> List[StormCell]:
        return list(self._active_storms.values())
