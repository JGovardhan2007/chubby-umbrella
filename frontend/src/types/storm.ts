export interface StormHistoryPoint {
  timestamp: string;
  centroid_lat: number;
  centroid_lon: number;
  max_dbz: number;
  area_km2: number;
}

export interface StormCell {
  storm_id: string;
  timestamp: string;
  centroid_lat: number;
  centroid_lon: number;
  area_km2: number;
  intensity: number;
  confidence: number;
  speed_kmh: number;
  heading_deg: number;
  velocity_u_kmh: number;
  velocity_v_kmh: number;
  growth_rate_km2_hr: number;
  intensity_trend_dbz_hr: number;
  lightning_trend: number;
  convective_stage: 'INITIATING' | 'DEVELOPING' | 'MATURE' | 'INTENSIFYING' | 'DECAYING';
  indicators: {
    max_dbz?: number;
    mean_dbz?: number;
    min_bt_k?: number;
    max_cooling_k_15min?: number;
    max_growth_dbz_15min?: number;
    max_lightning_density?: number;
  };
  polygon_coords?: [number, number][];
  history?: StormHistoryPoint[];
}
