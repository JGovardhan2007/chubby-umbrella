export type ForecastCategory = 
  | 'clouds'
  | 'thunderstorms'
  | 'hailstorms'
  | 'downbursts'
  | 'cloudbursts'
  | 'lightning';

export interface ForecastModelInfo {
  id: ForecastCategory;
  title: string;
  subtitle: string;
  description: string;
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Severe';
  unit: string;
  peakValue: string;
  sourceModel: string;
  forecastRange: string;
  colorScheme: string;
  affectedRegions: string[];
}

export interface ForecastTimeStep {
  stepIndex: number;
  dayLabel: string; // 'Today (Day 0)', 'Tomorrow (Day +1)', 'Day +2', 'Day +3'
  hoursOffset: number; // 0, 3, 6, 9, ... 72
  timeUtc: string; // '00:00 UTC', '03:00 UTC', etc.
  dateString: string;
}
