import { HorizonForecast, HorizonMinutes } from '../types/forecast';
import { apiService, StepDataResponse } from '../services/api';

export interface IForecastProvider {
  providerId: string;
  providerName: string;
  phase: 'PHASE_1' | 'PHASE_2' | 'PHASE_3';
  getForecast(horizonMin: HorizonMinutes, stepIndex: number): Promise<StepDataResponse>;
}

export class Phase1NowcastProvider implements IForecastProvider {
  providerId = 'phase1_nowcast';
  providerName = 'Phase 1: Convective Extrapolation (0-6 hr)';
  phase: 'PHASE_1' = 'PHASE_1';

  async getForecast(horizonMin: HorizonMinutes, stepIndex: number): Promise<StepDataResponse> {
    return await apiService.getReplayStep(stepIndex, horizonMin);
  }
}

export class Phase2AnomalyForecastProvider implements IForecastProvider {
  providerId = 'phase2_anomaly';
  providerName = 'Phase 2: Extreme Anomaly Tracking (SIH 26078)';
  phase: 'PHASE_2' = 'PHASE_2';

  async getForecast(horizonMin: HorizonMinutes, stepIndex: number): Promise<StepDataResponse> {
    const base = await apiService.getReplayStep(stepIndex, horizonMin);
    return {
      ...base,
      qcReport: { ...base.qcReport, anomalyTrackingEnabled: true }
    };
  }
}

export class Phase3BlendedForecastProvider implements IForecastProvider {
  providerId = 'phase3_blended';
  providerName = 'Phase 3: Hybrid AI-NWP Model Blend (SIH 26081)';
  phase: 'PHASE_3' = 'PHASE_3';

  async getForecast(horizonMin: HorizonMinutes, stepIndex: number): Promise<StepDataResponse> {
    const base = await apiService.getReplayStep(stepIndex, horizonMin);
    return {
      ...base,
      qcReport: { ...base.qcReport, modelBlendingEnabled: true }
    };
  }
}

export const defaultForecastProvider = new Phase1NowcastProvider();
