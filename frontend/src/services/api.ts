import { SystemStatusData, DataSourceStatus } from '../types/weather';
import { StormCell } from '../types/storm';
import { HorizonForecast, SiteEtaSummary, HorizonMinutes } from '../types/forecast';
import { HazardSummaryData } from '../types/hazard';
import { DEMO_REPLAY_FRAMES } from '../data/demo/demoData';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

export interface StepDataResponse {
  stepIndex: number;
  timestamp: string;
  horizonMinutes: number;
  activeStormCount: number;
  highRiskRegions: number;
  hazardSummary: HazardSummaryData;
  storms: StormCell[];
  horizonForecast: HorizonForecast | null;
  siteEta: SiteEtaSummary | null;
  geojsonStorms?: any;
  geojsonTracks?: any;
  geojsonSiteEta?: any;
  qcReport?: any;
  radarPoints?: { lat: number; lon: number; dbz: number }[];
  lightningFlashes?: { lat: number; lon: number; ka: number; type: string }[];
}

export class WeatherApiService {
  private mode: 'demo' | 'api' = 'api';

  setMode(mode: 'demo' | 'api') {
    this.mode = mode;
  }

  getMode() {
    return this.mode;
  }

  async getSystemStatus(): Promise<SystemStatusData> {
    if (this.mode === 'api') {
      try {
        const res = await fetch(`${API_BASE_URL}/status`, { signal: AbortSignal.timeout(3000) });
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {
        console.warn('Backend offline, using fallback system status:', err);
      }
    }

    // Demo status
    return {
      status: 'OPERATIONAL',
      data_sources: {
        radar: { name: 'Doppler Weather Radar (DWR)', status: 'AVAILABLE', mode: 'REPLAY', type: 'Reflectivity & Velocity' },
        satellite: { name: 'INSAT-3D / INSAT-3DR', status: 'AVAILABLE', mode: 'REPLAY', type: 'TIR1 / TIR2 / WV' },
        lightning: { name: 'Ground Lightning Network (LLN)', status: 'AVAILABLE', mode: 'REPLAY', type: 'Flash Coords & Polarity' },
        weather: { name: 'Surface AWS Network', status: 'AVAILABLE', mode: 'REPLAY', type: 'T / RH / Wind / Rain' }
      },
      system_time: new Date().toISOString(),
      phase: 'PHASE_1_CORE_NOWCASTING'
    };
  }

  async getReplayStep(stepIndex: number, horizonMin: HorizonMinutes = 0): Promise<StepDataResponse> {
    if (this.mode === 'api') {
      try {
        const res = await fetch(`${API_BASE_URL}/replay/step/${stepIndex}?horizon_min=${horizonMin}`, { signal: AbortSignal.timeout(3000) });
        if (res.ok) {
          const data = await res.json();
          return {
            stepIndex: data.step_index,
            timestamp: data.timestamp,
            horizonMinutes: data.horizon_minutes,
            activeStormCount: data.active_storm_count,
            highRiskRegions: data.high_risk_regions,
            hazardSummary: data.hazard_summary,
            storms: data.storms,
            horizonForecast: data.horizon_forecast,
            siteEta: data.site_eta,
            geojsonStorms: data.geojson_storms,
            geojsonTracks: data.geojson_tracks,
            geojsonSiteEta: data.geojson_site_eta,
            qcReport: data.qc_report
          };
        }
      } catch (err) {
        console.warn(`Backend step query failed for step ${stepIndex}, falling back to demo:`, err);
      }
    }

    // Fallback to local demo frames
    const safeIdx = Math.min(stepIndex, DEMO_REPLAY_FRAMES.length - 1);
    const frame = DEMO_REPLAY_FRAMES[safeIdx];

    return {
      stepIndex: frame.stepIndex,
      timestamp: frame.timestampIso,
      horizonMinutes: horizonMin,
      activeStormCount: frame.storms.length,
      highRiskRegions: frame.storms.filter(s => s.intensity >= 48).length,
      hazardSummary: frame.hazardSummary,
      storms: frame.storms,
      horizonForecast: null,
      siteEta: frame.siteEta,
      radarPoints: frame.radarPoints,
      lightningFlashes: frame.lightningFlashes
    };
  }

  async getLiveNowcast(lat: number, lon: number, siteName: string = 'Live_Station'): Promise<StepDataResponse> {
    try {
      const res = await fetch(`${API_BASE_URL}/live/nowcast?lat=${lat}&lon=${lon}&site_name=${encodeURIComponent(siteName)}`, {
        signal: AbortSignal.timeout(10000)
      });
      if (res.ok) {
        const data = await res.json();
        const firstStorm = data.storms?.[0];
        const hazSummary: HazardSummaryData = {
          lightning: Math.round((data.site_eta?.hazard_risks?.lightning || 0) * 100),
          hail: Math.round((data.site_eta?.hazard_risks?.hail || 0) * 100),
          downburst: Math.round((data.site_eta?.hazard_risks?.downburst || 0) * 100),
          cloudburst: Math.round((data.site_eta?.hazard_risks?.cloudburst || 0) * 100),
        };

        return {
          stepIndex: 0,
          timestamp: data.timestamp,
          horizonMinutes: 0,
          activeStormCount: data.active_storm_count,
          highRiskRegions: data.storms.filter((s: any) => s.intensity >= 48).length,
          hazardSummary: hazSummary,
          storms: data.storms,
          horizonForecast: null,
          siteEta: data.site_eta,
          geojsonStorms: data.geojson_storms,
          geojsonTracks: data.geojson_tracks,
          geojsonSiteEta: data.geojson_site_eta
        };
      }
    } catch (err) {
      console.error('Live API fetch error:', err);
    }

    return this.getReplayStep(2, 0);
  }
}

export const apiService = new WeatherApiService();
