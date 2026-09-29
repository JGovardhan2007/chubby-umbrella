import { StormCell } from '../../types/storm';
import { SiteEtaSummary } from '../../types/forecast';

export interface ReplayFrameData {
  stepIndex: number;
  timeLabel: string;
  timestampIso: string;
  storms: StormCell[];
  siteEta: SiteEtaSummary;
  hazardSummary: {
    lightning: number;
    hail: number;
    downburst: number;
    cloudburst: number;
  };
  radarPoints: { lat: number; lon: number; dbz: number }[];
  lightningFlashes: { lat: number; lon: number; ka: number; type: string }[];
}

export const DEMO_REPLAY_FRAMES: ReplayFrameData[] = [
  {
    stepIndex: 0,
    timeLabel: '14:00 IST',
    timestampIso: '2026-06-15T14:00:00Z',
    hazardSummary: { lightning: 25, hail: 10, downburst: 15, cloudburst: 20 },
    storms: [
      {
        storm_id: 'STM_A17',
        timestamp: '2026-06-15T14:00:00Z',
        centroid_lat: 13.00,
        centroid_lon: 79.50,
        area_km2: 120.0,
        intensity: 42.0,
        confidence: 0.74,
        speed_kmh: 24.5,
        heading_deg: 55.0,
        velocity_u_kmh: 20.0,
        velocity_v_kmh: 14.0,
        growth_rate_km2_hr: 35.0,
        intensity_trend_dbz_hr: 6.0,
        lightning_trend: 1.2,
        convective_stage: 'INITIATING',
        indicators: {
          max_dbz: 42.0,
          mean_dbz: 32.5,
          min_bt_k: 245.0,
          max_cooling_k_15min: -4.5,
          max_lightning_density: 0.15
        },
        polygon_coords: [
          [79.40, 12.95], [79.60, 12.95], [79.62, 13.08], [79.45, 13.10], [79.40, 12.95]
        ],
        history: [
          { timestamp: '2026-06-15T14:00:00Z', centroid_lat: 13.00, centroid_lon: 79.50, max_dbz: 42.0, area_km2: 120.0 }
        ]
      }
    ],
    siteEta: {
      target_location: { latitude: 13.0827, longitude: 80.2707, label: 'Chennai_City' },
      timestamp: '2026-06-15T14:00:00Z',
      nearest_storm_id: 'STM_A17',
      distance_km: 84.5,
      storm_heading_deg: 55.0,
      storm_speed_kmh: 24.5,
      is_approaching: true,
      estimated_arrival_minutes: 207.0,
      estimated_arrival_time: '2026-06-15T17:27:00Z',
      hazard_risks: { lightning: 0.25, hail: 0.10, downburst: 0.15, cloudburst: 0.20 },
      confidence: 0.68,
      status: 'APPROACHING'
    },
    radarPoints: [
      { lat: 13.00, lon: 79.50, dbz: 42.0 },
      { lat: 13.03, lon: 79.52, dbz: 38.0 },
      { lat: 12.98, lon: 79.48, dbz: 35.0 }
    ],
    lightningFlashes: [
      { lat: 13.01, lon: 79.51, ka: -22.0, type: 'CG' },
      { lat: 12.99, lon: 79.49, ka: 18.5, type: 'IC' }
    ]
  },
  {
    stepIndex: 1,
    timeLabel: '14:20 IST',
    timestampIso: '2026-06-15T14:20:00Z',
    hazardSummary: { lightning: 55, hail: 32, downburst: 40, cloudburst: 48 },
    storms: [
      {
        storm_id: 'STM_A17',
        timestamp: '2026-06-15T14:20:00Z',
        centroid_lat: 13.08,
        centroid_lon: 79.62,
        area_km2: 184.0,
        intensity: 51.5,
        confidence: 0.81,
        speed_kmh: 28.0,
        heading_deg: 58.0,
        velocity_u_kmh: 23.7,
        velocity_v_kmh: 14.8,
        growth_rate_km2_hr: 45.0,
        intensity_trend_dbz_hr: 8.5,
        lightning_trend: 4.8,
        convective_stage: 'DEVELOPING',
        indicators: {
          max_dbz: 51.5,
          mean_dbz: 39.0,
          min_bt_k: 228.0,
          max_cooling_k_15min: -7.0,
          max_lightning_density: 0.42
        },
        polygon_coords: [
          [79.50, 13.00], [79.75, 13.02], [79.78, 13.18], [79.53, 13.20], [79.50, 13.00]
        ],
        history: [
          { timestamp: '2026-06-15T14:00:00Z', centroid_lat: 13.00, centroid_lon: 79.50, max_dbz: 42.0, area_km2: 120.0 },
          { timestamp: '2026-06-15T14:20:00Z', centroid_lat: 13.08, centroid_lon: 79.62, max_dbz: 51.5, area_km2: 184.0 }
        ]
      }
    ],
    siteEta: {
      target_location: { latitude: 13.0827, longitude: 80.2707, label: 'Chennai_City' },
      timestamp: '2026-06-15T14:20:00Z',
      nearest_storm_id: 'STM_A17',
      distance_km: 70.8,
      storm_heading_deg: 58.0,
      storm_speed_kmh: 28.0,
      is_approaching: true,
      estimated_arrival_minutes: 151.0,
      estimated_arrival_time: '2026-06-15T16:51:00Z',
      hazard_risks: { lightning: 0.55, hail: 0.32, downburst: 0.40, cloudburst: 0.48 },
      confidence: 0.81,
      status: 'APPROACHING'
    },
    radarPoints: [
      { lat: 13.08, lon: 79.62, dbz: 51.5 },
      { lat: 13.11, lon: 79.65, dbz: 46.0 },
      { lat: 13.05, lon: 79.58, dbz: 42.0 }
    ],
    lightningFlashes: [
      { lat: 13.09, lon: 79.63, ka: -35.0, type: 'CG' },
      { lat: 13.07, lon: 79.60, ka: -28.0, type: 'CG' },
      { lat: 13.12, lon: 79.66, ka: 15.0, type: 'IC' }
    ]
  },
  {
    stepIndex: 2,
    timeLabel: '14:40 IST',
    timestampIso: '2026-06-15T14:40:00Z',
    hazardSummary: { lightning: 78, hail: 42, downburst: 28, cloudburst: 65 },
    storms: [
      {
        storm_id: 'STM_A17',
        timestamp: '2026-06-15T14:40:00Z',
        centroid_lat: 13.15,
        centroid_lon: 79.76,
        area_km2: 245.0,
        intensity: 57.0,
        confidence: 0.88,
        speed_kmh: 34.0,
        heading_deg: 60.0,
        velocity_u_kmh: 29.4,
        velocity_v_kmh: 17.0,
        growth_rate_km2_hr: 52.0,
        intensity_trend_dbz_hr: 4.2,
        lightning_trend: 6.5,
        convective_stage: 'MATURE',
        indicators: {
          max_dbz: 57.0,
          mean_dbz: 44.5,
          min_bt_k: 212.0,
          max_cooling_k_15min: -8.5,
          max_lightning_density: 0.78
        },
        polygon_coords: [
          [79.60, 13.05], [79.92, 13.08], [79.95, 13.28], [79.63, 13.30], [79.60, 13.05]
        ],
        history: [
          { timestamp: '2026-06-15T14:00:00Z', centroid_lat: 13.00, centroid_lon: 79.50, max_dbz: 42.0, area_km2: 120.0 },
          { timestamp: '2026-06-15T14:20:00Z', centroid_lat: 13.08, centroid_lon: 79.62, max_dbz: 51.5, area_km2: 184.0 },
          { timestamp: '2026-06-15T14:40:00Z', centroid_lat: 13.15, centroid_lon: 79.76, max_dbz: 57.0, area_km2: 245.0 }
        ]
      }
    ],
    siteEta: {
      target_location: { latitude: 13.0827, longitude: 80.2707, label: 'Chennai_City' },
      timestamp: '2026-06-15T14:40:00Z',
      nearest_storm_id: 'STM_A17',
      distance_km: 55.4,
      storm_heading_deg: 60.0,
      storm_speed_kmh: 34.0,
      is_approaching: true,
      estimated_arrival_minutes: 98.0,
      estimated_arrival_time: '2026-06-15T16:18:00Z',
      hazard_risks: { lightning: 0.78, hail: 0.42, downburst: 0.28, cloudburst: 0.65 },
      confidence: 0.88,
      status: 'APPROACHING'
    },
    radarPoints: [
      { lat: 13.15, lon: 79.76, dbz: 57.0 },
      { lat: 13.20, lon: 79.80, dbz: 52.0 },
      { lat: 13.10, lon: 79.70, dbz: 48.0 }
    ],
    lightningFlashes: [
      { lat: 13.16, lon: 79.77, ka: -48.0, type: 'CG' },
      { lat: 13.14, lon: 79.74, ka: -38.0, type: 'CG' },
      { lat: 13.22, lon: 79.82, ka: 25.0, type: 'IC' },
      { lat: 13.18, lon: 79.79, ka: -52.0, type: 'CG' }
    ]
  }
];
