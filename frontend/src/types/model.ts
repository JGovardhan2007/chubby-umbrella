/**
 * Phase 3 Architecture Type Definitions: SIH 26081
 * Hybrid AI–NWP multi-model forecast blending
 */

export interface ModelForecastGrid {
  model_id: 'NWP_WRF' | 'NWP_GFS' | 'AI_DEEP_CONV' | 'BLENDED_FUSED';
  model_name: string;
  lead_time_hours: number;
  variable: string;
  forecast_grid_url?: string;
  weight_in_blend?: number;
}

export interface ModelComparisonMetrics {
  lead_time_hours: number;
  observed_value: number;
  model_a_prediction: number;
  model_b_prediction: number;
  blended_prediction: number;
}
