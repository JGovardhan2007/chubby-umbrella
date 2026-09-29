"""GeoJSON Exporter for storm cells, boundaries, hazard zones, forecast tracks, and ETA markers."""

from __future__ import annotations
from datetime import datetime
from typing import Any, Dict, List, Optional
import json
import numpy as np

from ..tracking.storm_cell import StormCell
from ..nowcast.engine import NowcastHorizonForecast, PredictedStormCell
from ..nowcast.arrival_time import LocationStormArrivalSummary
from ..hazards.base import HazardEstimate


def create_geojson_feature(
    geometry: Dict[str, Any],
    properties: Dict[str, Any],
    feature_id: Optional[str] = None
) -> Dict[str, Any]:
    """Create a standardized GeoJSON Feature."""
    feat = {
        "type": "Feature",
        "geometry": geometry,
        "properties": properties
    }
    if feature_id:
        feat["id"] = feature_id
    return feat


def export_storm_cells_geojson(
    storms: List[StormCell],
    hazards_by_storm: Optional[Dict[str, List[HazardEstimate]]] = None
) -> Dict[str, Any]:
    """Export detected storm cells (both centroid points and boundary polygons) to GeoJSON."""
    features = []

    for storm in storms:
        props = storm.to_dict()
        if hazards_by_storm and storm.storm_id in hazards_by_storm:
            props["hazards"] = {h.hazard_type: h.risk_probability for h in hazards_by_storm[storm.storm_id]}

        # Centroid Feature
        point_geom = {
            "type": "Point",
            "coordinates": [round(storm.centroid_lon, 4), round(storm.centroid_lat, 4)]
        }
        point_props = dict(props)
        point_props["feature_type"] = "storm_centroid"
        features.append(create_geojson_feature(point_geom, point_props, f"{storm.storm_id}_centroid"))

        # Polygon Boundary Feature
        if storm.polygon_coords and len(storm.polygon_coords) >= 3:
            poly_geom = {
                "type": "Polygon",
                "coordinates": [storm.polygon_coords]
            }
            poly_props = dict(props)
            poly_props["feature_type"] = "storm_boundary"
            features.append(create_geojson_feature(poly_geom, poly_props, f"{storm.storm_id}_boundary"))

    return {
        "type": "FeatureCollection",
        "crs": {"type": "name", "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}},
        "features": features
    }


def export_nowcast_tracks_geojson(
    nowcasts: Dict[int, NowcastHorizonForecast]
) -> Dict[str, Any]:
    """Export multi-horizon forecast tracks, predicted positions, and uncertainty cones to GeoJSON."""
    features = []

    # Group predicted positions by storm_id to build line tracks
    storm_tracks: Dict[str, List[PredictedStormCell]] = {}
    for horizon, forecast in sorted(nowcasts.items()):
        for pcell in forecast.predicted_storms:
            storm_tracks.setdefault(pcell.storm_id, []).append(pcell)

    for sid, cells in storm_tracks.items():
        # LineString Track
        coords = [[round(c.predicted_lon, 4), round(c.predicted_lat, 4)] for c in cells]
        if len(coords) >= 2:
            track_geom = {"type": "LineString", "coordinates": coords}
            track_props = {
                "storm_id": sid,
                "feature_type": "predicted_storm_track",
                "horizons_minutes": [c.lead_time_minutes for c in cells]
            }
            features.append(create_geojson_feature(track_geom, track_props, f"{sid}_track"))

        # Future position points and dispersion cones
        for c in cells:
            p_geom = {"type": "Point", "coordinates": [round(c.predicted_lon, 4), round(c.predicted_lat, 4)]}
            p_props = c.to_dict()
            p_props["feature_type"] = "predicted_storm_centroid"
            features.append(create_geojson_feature(p_geom, p_props, f"{sid}_{c.lead_time_minutes}m"))

            # Uncertainty Cone Circle approximation
            cone_poly = _create_circle_polygon(c.predicted_lat, c.predicted_lon, c.uncertainty_radius_km)
            cone_geom = {"type": "Polygon", "coordinates": [cone_poly]}
            cone_props = {
                "storm_id": sid,
                "lead_time_minutes": c.lead_time_minutes,
                "uncertainty_radius_km": c.uncertainty_radius_km,
                "confidence": c.confidence,
                "status": c.status.value,
                "feature_type": "uncertainty_cone"
            }
            features.append(create_geojson_feature(cone_geom, cone_props, f"{sid}_{c.lead_time_minutes}m_cone"))

    return {
        "type": "FeatureCollection",
        "crs": {"type": "name", "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}},
        "features": features
    }


def export_arrival_eta_geojson(summary: LocationStormArrivalSummary) -> Dict[str, Any]:
    """Export location ETA summary as GeoJSON Feature."""
    geom = {
        "type": "Point",
        "coordinates": [round(summary.target_longitude, 4), round(summary.target_latitude, 4)]
    }
    props = summary.to_dict()
    props["feature_type"] = "site_eta_marker"
    feat = create_geojson_feature(geom, props, "target_site_eta")
    return {
        "type": "FeatureCollection",
        "features": [feat]
    }


def _create_circle_polygon(center_lat: float, center_lon: float, radius_km: float, num_pts: int = 24) -> List[List[float]]:
    """Approximate a circular uncertainty buffer polygon in [lon, lat] coordinates."""
    angles = np.linspace(0, 2 * np.pi, num_pts + 1)
    cos_lat = np.cos(np.radians(center_lat))
    pts = []
    for a in angles:
        dlat = (radius_km * np.cos(a)) / 111.0
        dlon = (radius_km * np.sin(a)) / (111.0 * max(cos_lat, 0.1))
        pts.append([round(center_lon + dlon, 4), round(center_lat + dlat, 4)])
    return pts
