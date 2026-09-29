import { StormCell } from './storm';

export type HorizonMinutes = 0 | 15 | 30 | 60 | 120 | 180 | 240 | 300 | 360;
export type ForecastStatus = 'OBSERVED' | 'PREDICTED' | 'DERIVED' | 'UNCERTAIN';

export interface PredictedStormCell {
  storm_id: string;
  lead_time_minutes: number;
  valid_time: string;
  predicted_lat: number;
  predicted_lon: number;
  predicted_area_km2: number;
  predicted_intensity_dbz: number;
  confidence: number;
  uncertainty_radius_km: number;
  status: ForecastStatus;
  hazard_probabilities: {
    lightning?: number;
    hail?: number;
    downburst?: number;
    cloudburst?: number;
  };
  predicted_polygon?: [number, number][];
}

export interface HorizonForecast {
  lead_time_minutes: number;
  issue_time: string;
  valid_time: string;
  status: ForecastStatus;
  mean_confidence: number;
  storm_count: number;
  storms: PredictedStormCell[];
}

export interface SiteEtaSummary {
  target_location: {
    latitude: number;
    longitude: number;
    label: string;
  };
  timestamp: string;
  nearest_storm_id: string | null;
  distance_km: number;
  storm_heading_deg: number;
  storm_speed_kmh: number;
  is_approaching: boolean;
  estimated_arrival_minutes: number | null;
  estimated_arrival_time: string | null;
  hazard_risks: {
    lightning?: number;
    hail?: number;
    downburst?: number;
    cloudburst?: number;
  };
  confidence: number;
  status: string;
}
