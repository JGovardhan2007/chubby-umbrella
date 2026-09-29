"""Storm Arrival Time (ETA), proximity, heading, and localized hazard assessment."""

from __future__ import annotations
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
import numpy as np

from ..tracking.storm_cell import StormCell, haversine_distance_km
from ..hazards.base import HazardEstimate


@dataclass
class LocationStormArrivalSummary:
    """Localized storm ETA and hazard forecast for a specific GPS coordinate."""
    target_latitude: float
    target_longitude: float
    target_label: str
    current_time: datetime
    nearest_storm_id: Optional[str]
    distance_to_nearest_km: float
    storm_heading_deg: float
    storm_speed_kmh: float
    is_approaching: bool
    estimated_arrival_minutes: Optional[float]
    estimated_arrival_time: Optional[str]
    hazard_risks: Dict[str, float] = field(default_factory=dict)
    confidence: float = 0.0
    status: str = "NO_IMMEDIATE_THREAT"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "target_location": {
                "latitude": round(self.target_latitude, 4),
                "longitude": round(self.target_longitude, 4),
                "label": self.target_label
            },
            "timestamp": self.current_time.isoformat(),
            "nearest_storm_id": self.nearest_storm_id,
            "distance_km": round(self.distance_to_nearest_km, 2),
            "storm_heading_deg": round(self.storm_heading_deg, 1),
            "storm_speed_kmh": round(self.storm_speed_kmh, 1),
            "is_approaching": self.is_approaching,
            "estimated_arrival_minutes": round(self.estimated_arrival_minutes, 1) if self.estimated_arrival_minutes is not None else None,
            "estimated_arrival_time": self.estimated_arrival_time,
            "hazard_risks": {k: round(v, 3) for k, v in self.hazard_risks.items()},
            "confidence": round(self.confidence, 3),
            "status": self.status
        }


def calculate_storm_arrival_for_location(
    target_lat: float,
    target_lon: float,
    storms: List[StormCell],
    hazards_by_storm: Dict[str, List[HazardEstimate]],
    current_time: datetime,
    target_label: str = "Target_Site",
    proximity_threshold_km: float = 50.0
) -> LocationStormArrivalSummary:
    """Evaluate storm distance, approach trajectory, ETA, and hazard exposure for a target site."""
    if not storms:
        return LocationStormArrivalSummary(
            target_latitude=target_lat,
            target_longitude=target_lon,
            target_label=target_label,
            current_time=current_time,
            nearest_storm_id=None,
            distance_to_nearest_km=999.0,
            storm_heading_deg=0.0,
            storm_speed_kmh=0.0,
            is_approaching=False,
            estimated_arrival_minutes=None,
            estimated_arrival_time=None,
            hazard_risks={"lightning": 0.0, "hail": 0.0, "downburst": 0.0, "cloudburst": 0.0},
            confidence=0.0,
            status="CLEAR"
        )

    # Find nearest storm
    distances = [haversine_distance_km(s.centroid_lat, s.centroid_lon, target_lat, target_lon) for s in storms]
    min_idx = int(np.argmin(distances))
    nearest_storm = storms[min_idx]
    min_dist_km = distances[min_idx]

    # Bearing from storm to target
    dlat = target_lat - nearest_storm.centroid_lat
    dlon = target_lon - nearest_storm.centroid_lon
    cos_lat = np.cos(np.radians(nearest_storm.centroid_lat))
    bearing_to_target = float(np.degrees(np.arctan2(dlon * cos_lat, dlat)) % 360.0)

    # Check angular alignment with storm heading
    heading_diff = abs((nearest_storm.heading_deg - bearing_to_target + 180) % 360 - 180)
    # Approaching if moving towards target within a 60-degree cone or very close
    is_approaching = (heading_diff <= 60.0 and nearest_storm.speed_kmh > 5.0) or (min_dist_km <= 10.0)

    # Compute ETA
    if min_dist_km <= 5.0:
        eta_minutes = 0.0
        eta_iso = current_time.isoformat()
        status = "IMPACT_IMMINENT_OR_ONGOING"
    elif is_approaching and nearest_storm.speed_kmh > 5.0:
        # Effective speed component along target line
        eff_speed = nearest_storm.speed_kmh * np.cos(np.radians(heading_diff))
        if eff_speed > 3.0:
            eta_hours = min_dist_km / eff_speed
            eta_minutes = float(eta_hours * 60.0)
            arrival_dt = current_time + timedelta(minutes=eta_minutes)
            eta_iso = arrival_dt.isoformat()
            status = "APPROACHING"
        else:
            eta_minutes = None
            eta_iso = None
            status = "NEARBY_STATIONARY"
    else:
        eta_minutes = None
        eta_iso = None
        status = "MOVING_AWAY" if min_dist_km <= proximity_threshold_km else "CLEAR"

    # Extract hazard probabilities for nearest storm
    hazards = hazards_by_storm.get(nearest_storm.storm_id, [])
    risk_dict = {}
    for h in hazards:
        risk_dict[h.hazard_type] = h.risk_probability

    for h_type in ["lightning", "hail", "downburst", "cloudburst"]:
        if h_type not in risk_dict:
            risk_dict[h_type] = 0.05

    # Proximity attenuation if storm is far
    dist_attenuation = float(np.clip(1.0 - (min_dist_km / 100.0), 0.1, 1.0))
    for k in risk_dict:
        risk_dict[k] = float(np.clip(risk_dict[k] * dist_attenuation, 0.0, 1.0))

    confidence = float(nearest_storm.confidence * (0.9 if is_approaching else 0.7))

    return LocationStormArrivalSummary(
        target_latitude=target_lat,
        target_longitude=target_lon,
        target_label=target_label,
        current_time=current_time,
        nearest_storm_id=nearest_storm.storm_id,
        distance_to_nearest_km=min_dist_km,
        storm_heading_deg=nearest_storm.heading_deg,
        storm_speed_kmh=nearest_storm.speed_kmh,
        is_approaching=is_approaching,
        estimated_arrival_minutes=eta_minutes,
        estimated_arrival_time=eta_iso,
        hazard_risks=risk_dict,
        confidence=confidence,
        status=status
    )
