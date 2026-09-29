"""Interpretable Convective Initiation (CI) detection and candidate cell extraction."""

from __future__ import annotations
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
import numpy as np
from scipy.ndimage import label, find_objects

from ..fusion.spatiotemporal import FusedFrame
from .features import extract_convective_features


@dataclass
class CandidateCell:
    """Detected candidate convective cell before/during tracking."""
    cell_id: str
    timestamp: datetime
    centroid_lat: float
    centroid_lon: float
    area_km2: float
    pixel_count: int
    bbox_latlon: Tuple[float, float, float, float]  # min_lat, min_lon, max_lat, max_lon
    intensity_indicators: Dict[str, float]
    confidence_score: float
    stage: str  # 'INITIATING', 'DEVELOPING', 'MATURE', 'INTENSIFYING'
    mask: np.ndarray  # 2D boolean mask
    polygon_coords: List[List[float]] = field(default_factory=list)  # [[lon, lat], ...]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "cell_id": self.cell_id,
            "timestamp": self.timestamp.isoformat(),
            "centroid_lat": round(self.centroid_lat, 4),
            "centroid_lon": round(self.centroid_lon, 4),
            "area_km2": round(self.area_km2, 2),
            "pixel_count": self.pixel_count,
            "bbox_latlon": [round(x, 4) for x in self.bbox_latlon],
            "intensity_indicators": {k: round(v, 2) for k, v in self.intensity_indicators.items()},
            "confidence_score": round(self.confidence_score, 3),
            "stage": self.stage
        }


class ConvectiveInitiationDetector:
    """Interpretable physics-based Convective Initiation detector."""

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        ci_cfg = self.config.get("convective_initiation", {})
        self.min_dbz = ci_cfg.get("min_radar_reflectivity_dbz", 35.0)
        self.severe_dbz = ci_cfg.get("severe_reflectivity_dbz", 45.0)
        self.sat_deep_bt = ci_cfg.get("satellite_bt_deep_convection_k", 235.0)
        self.sat_cooling_threshold = ci_cfg.get("satellite_cooling_rate_k_per_15min", -4.0)
        self.min_cell_area_km2 = ci_cfg.get("min_cell_area_km2", 12.0)
        self.max_cell_area_km2 = ci_cfg.get("max_cell_area_km2", 5000.0)

        weights = ci_cfg.get("confidence_weights", {})
        self.w_radar = weights.get("radar_weight", 0.40)
        self.w_sat = weights.get("satellite_weight", 0.30)
        self.w_ltg = weights.get("lightning_weight", 0.20)
        self.w_trend = weights.get("trend_weight", 0.10)

    def detect(self, frame: FusedFrame) -> List[CandidateCell]:
        """Detect convective initiation areas and extract candidate convective cells."""
        features = extract_convective_features(frame)
        grid = frame.grid
        pixel_area_km2 = grid.resolution_km * grid.resolution_km

        dbz = features["dbz"]
        bt = features["bt_k"]
        cooling_rate = features["cooling_rate"]
        growth_rate = features["growth_rate"]
        ltg_density = features["lightning_density"]

        # Multi-sensor initiation mask
        # 1. Radar signature: moderate reflectivity (>=35 dBZ) or developing echo (>=30 dBZ with positive growth)
        radar_active = (dbz >= self.min_dbz) | ((dbz >= 28.0) & (growth_rate >= 4.0))

        # 2. Satellite signature: cold cloud top (<=235K) or strong rapid cooling (<= -4 K/15min with BT <= 250K)
        sat_active = (bt <= self.sat_deep_bt) | ((cooling_rate <= self.sat_cooling_threshold) & (bt <= 255.0))

        # 3. Lightning signature: any localized lightning activity
        ltg_active = ltg_density > 0.05

        # Combined convective trigger
        convective_mask = radar_active | (sat_active & (dbz >= 25.0)) | (sat_active & ltg_active)

        # Morphological labeling
        labeled_mask, num_features = label(convective_mask)
        candidates: List[CandidateCell] = []

        for obj_idx in range(1, num_features + 1):
            cell_mask = (labeled_mask == obj_idx)
            num_pixels = int(np.sum(cell_mask))
            area_km2 = num_pixels * pixel_area_km2

            if area_km2 < self.min_cell_area_km2 or area_km2 > self.max_cell_area_km2:
                continue

            # Extract cell coordinates
            rows, cols = np.where(cell_mask)
            cell_lats = grid.lats[rows]
            cell_lons = grid.lons[cols]

            centroid_lat = float(np.mean(cell_lats))
            centroid_lon = float(np.mean(cell_lons))
            bbox = (float(np.min(cell_lats)), float(np.min(cell_lons)), float(np.max(cell_lats)), float(np.max(cell_lons)))

            # Feature statistics in the cell
            max_dbz = float(np.max(dbz[cell_mask]))
            mean_dbz = float(np.mean(dbz[cell_mask]))
            min_bt = float(np.min(bt[cell_mask]))
            max_cooling = float(np.min(cooling_rate[cell_mask]))  # most negative cooling
            max_growth = float(np.max(growth_rate[cell_mask]))
            total_ltg_density = float(np.max(ltg_density[cell_mask]))

            # Scientific confidence score calculation (0 to 1)
            # Radar term: normalized [0..1] for 25 to 60 dBZ
            radar_score = np.clip((max_dbz - 25.0) / 35.0, 0.0, 1.0)
            # Satellite term: normalized [0..1] for BT 270K down to 210K
            sat_score = np.clip((270.0 - min_bt) / 60.0, 0.0, 1.0)
            # Lightning term
            ltg_score = np.clip(total_ltg_density / 0.5, 0.0, 1.0)
            # Trend term (cooling + growth)
            trend_score = np.clip((-max_cooling / 10.0) * 0.5 + (max_growth / 10.0) * 0.5, 0.0, 1.0)

            confidence = float(
                self.w_radar * radar_score +
                self.w_sat * sat_score +
                self.w_ltg * ltg_score +
                self.w_trend * trend_score
            )
            confidence = float(np.clip(confidence, 0.10, 0.99))

            # Convective Stage categorization
            if max_dbz >= self.severe_dbz and min_bt <= 220.0:
                stage = "MATURE"
            elif max_growth >= 5.0 or max_cooling <= -5.0 or (max_dbz >= 40.0 and total_ltg_density > 0.1):
                stage = "INTENSIFYING"
            elif max_dbz >= self.min_dbz:
                stage = "DEVELOPING"
            else:
                stage = "INITIATING"

            # Extract boundary polygon contour
            polygon = self._extract_polygon(cell_mask, grid)

            cell = CandidateCell(
                cell_id=f"CELL_{frame.timestamp.strftime('%H%M%S')}_{obj_idx:02d}",
                timestamp=frame.timestamp,
                centroid_lat=centroid_lat,
                centroid_lon=centroid_lon,
                area_km2=area_km2,
                pixel_count=num_pixels,
                bbox_latlon=bbox,
                intensity_indicators={
                    "max_dbz": max_dbz,
                    "mean_dbz": mean_dbz,
                    "min_bt_k": min_bt,
                    "max_cooling_k_15min": max_cooling,
                    "max_growth_dbz_15min": max_growth,
                    "max_lightning_density": total_ltg_density
                },
                confidence_score=confidence,
                stage=stage,
                mask=cell_mask,
                polygon_coords=polygon
            )
            candidates.append(cell)

        return candidates

    def _extract_polygon(self, mask: np.ndarray, grid) -> List[List[float]]:
        """Extract simplified boundary polygon in [lon, lat] coordinates for GeoJSON."""
        import cv2
        uint8_mask = (mask * 255).astype(np.uint8)
        contours, _ = cv2.findContours(uint8_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            return []

        largest = max(contours, key=cv2.contourArea)
        # Approximate polygon to reduce vertex count
        epsilon = 0.02 * cv2.arcLength(largest, True)
        approx = cv2.approxPolyDP(largest, epsilon, True)

        poly_pts = []
        for pt in approx:
            c, r = pt[0][0], pt[0][1]
            lat, lon = grid.pixel_to_latlon(r, c)
            poly_pts.append([round(lon, 4), round(lat, 4)])

        if poly_pts and poly_pts[0] != poly_pts[-1]:
            poly_pts.append(poly_pts[0])  # Close ring

        return poly_pts
