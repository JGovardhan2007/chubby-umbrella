export type HazardType = 'lightning' | 'hail' | 'downburst' | 'cloudburst';
export type SeverityLevel = 'NONE' | 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH' | 'EXTREME';

export interface HazardEstimate {
  hazard: HazardType;
  risk: number; // 0.0 to 1.0
  confidence: number;
  severity_level: SeverityLevel;
  valid_time: string;
  latitude: number;
  longitude: number;
  storm_id?: string;
  hazard_indicators?: Record<string, number>;
  disclaimer?: string;
}

export interface HazardSummaryData {
  lightning: number; // percentage 0-100
  hail: number;
  downburst: number;
  cloudburst: number;
}
