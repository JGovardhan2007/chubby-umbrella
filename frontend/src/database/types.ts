export type HistoricalLayerType = 
  | 'radar'
  | 'satellite'
  | 'rain'
  | 'thunderstorm'
  | 'hail'
  | 'wind';

export interface HistoricalDayRecord {
  date: string; // '2026-09-30'
  displayDate: string; // '30 Sep 2026'
  dayRelative: string; // 'Today', 'Yesterday', '2 Days Ago', etc.
  synopticSummary: string;
  maxDbz: number;
  totalLightningFlashes: number;
  maxRainRate: number; // mm/hr
  hailReported: boolean;
  activeCellCount: number;
  dominantSeverity: 'Severe' | 'High' | 'Moderate' | 'Low';
}

export interface DiurnalHourFrame {
  hourIndex: number; // 0 to 23
  timeLabel: string; // '00:00 UTC', '01:00 UTC', ... '23:00 UTC'
  timeIst: string; // '05:30 IST', etc.
  clusterIntensity: number; // dBZ
  flashCount: number;
  activeCells: {
    lat: number;
    lon: number;
    dbz: number;
    hazard: string;
  }[];
}
