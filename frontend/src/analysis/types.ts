export type RegionOption = 
  | 'All India' 
  | 'Gangetic Plains' 
  | 'North-West / NCR' 
  | 'North-East' 
  | 'Central Deccan' 
  | 'South Peninsula';

export interface StationSoundingData {
  station: string;
  state: string;
  cape: number; // J/kg
  cin: number; // J/kg
  liftedIndex: number;
  precipitableWater: number; // mm
  maxDbz: number;
  severeRisk: 'Low' | 'Moderate' | 'High' | 'Severe';
  timestamp: string;
}

export interface RainfallTimeSeriesPoint {
  time: string;
  predictedRate: number; // mm/hr
  observedRate: number; // mm/hr
  accumulated: number; // mm
  upperBound: number;
  lowerBound: number;
}

export interface CapeCinPoint {
  hour: string;
  cape: number; // J/kg
  cin: number; // J/kg
  shear: number; // m/s
}

export interface ModelVerificationPoint {
  leadTime: string; // '+1h', '+3h', '+6h', '+12h', '+24h', '+48h', '+72h'
  nowcastPipelineCSI: number;
  ncmrwfModelCSI: number;
  imdModelCSI: number;
  pod: number;
  far: number;
}
