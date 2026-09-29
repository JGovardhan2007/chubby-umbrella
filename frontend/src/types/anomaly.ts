/**
 * Phase 2 Architecture Type Definitions: SIH 26078
 * Spatio-temporal tracking of extreme weather anomalies
 */

export interface WeatherAnomaly {
  anomaly_id: string;
  variable_name: 'PRECIPITATION_ANOMALY' | 'TEMPERATURE_EXTREME' | 'VORTICITY_SURGE' | 'PRESSURE_DROP';
  severity_zscore: number; // e.g. +3.5 sigma
  bounding_polygon: [number, number][];
  centroid: [number, number];
  persistence_hours: number;
  anomaly_confidence: number;
}

export interface AnomalyForecastTrack {
  anomaly_id: string;
  past_trajectory: [number, number][];
  predicted_trajectory: [number, number][];
  dispersion_radius_km: number;
}
