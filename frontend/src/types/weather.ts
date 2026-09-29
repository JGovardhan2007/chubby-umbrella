export interface DataSourceStatus {
  name: string;
  status: 'AVAILABLE' | 'DEGRADED' | 'UNAVAILABLE';
  mode: 'REPLAY' | 'LIVE' | 'DEMO';
  type: string;
  latency_min?: number;
}

export interface SystemStatusData {
  status: string;
  data_sources: {
    radar: DataSourceStatus;
    satellite: DataSourceStatus;
    lightning: DataSourceStatus;
    weather: DataSourceStatus;
  };
  system_time: string;
  phase: string;
}

export interface LayerToggleState {
  radarReflectivity: boolean;
  satelliteIR: boolean;
  lightningFlashes: boolean;
  stormCells: boolean;
  stormTracks: boolean;
  hazardZones: boolean;
  
  // Future Phase 2 Placeholders (SIH 26078)
  extremeAnomalies: boolean;
  anomalyTracks: boolean;
  anomalyUncertainty: boolean;
  
  // Future Phase 3 Placeholders (SIH 26081)
  modelForecastA: boolean;
  modelForecastB: boolean;
  blendedForecast: boolean;
}
