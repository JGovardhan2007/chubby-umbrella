import React from 'react';
import { ShieldAlert, Zap, CloudHail, Wind, CloudRain, Clock, AlertTriangle } from 'lucide-react';
import { HazardSummaryData } from '../types/hazard';
import { SiteEtaSummary } from '../types/forecast';

interface HazardSummaryProps {
  hazardSummary: HazardSummaryData;
  activeStormCount: number;
  highRiskRegions: number;
  siteEta: SiteEtaSummary | null;
  mode: 'replay' | 'live' | 'demo';
}

export const HazardSummary: React.FC<HazardSummaryProps> = ({
  hazardSummary,
  activeStormCount,
  highRiskRegions,
  siteEta,
  mode
}) => {
  return (
    <div className="bg-white flex-1 overflow-y-auto p-4 text-xs select-none space-y-4">
      {/* SECTION: CURRENT NOWCAST OVERVIEW */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <span className="font-mono text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            CURRENT NOWCAST
          </span>
          <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
            0–6 hr Horizon
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
            <span className="text-[10px] text-slate-500 font-sans block mb-0.5">Active Convective Cells:</span>
            <span className="font-mono text-base font-bold text-slate-900">{activeStormCount}</span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
            <span className="text-[10px] text-slate-500 font-sans block mb-0.5">High-Risk Sectors:</span>
            <span className={`font-mono text-base font-bold ${highRiskRegions > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {highRiskRegions}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION: HAZARD RISK SUMMARY GAUGES */}
      <div className="border-t border-slate-100 pt-3">
        <div className="flex items-center justify-between mb-2.5">
          <span className="font-mono text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
            HAZARD RISK SUMMARY
          </span>
          <span className="text-[10px] font-mono text-slate-500">Probabilistic</span>
        </div>

        <div className="space-y-2">
          {/* Lightning Risk */}
          <HazardRiskRow
            icon={<Zap className="w-3.5 h-3.5 text-cyan-600" />}
            label="Lightning Activity"
            value={hazardSummary.lightning}
            colorClass="bg-cyan-500"
          />

          {/* Hail Risk */}
          <HazardRiskRow
            icon={<CloudHail className="w-3.5 h-3.5 text-purple-600" />}
            label="Severe Hail Potential"
            value={hazardSummary.hail}
            colorClass="bg-purple-600"
          />

          {/* Downburst / Severe Wind */}
          <HazardRiskRow
            icon={<Wind className="w-3.5 h-3.5 text-blue-600" />}
            label="Downburst Gale Gusts"
            value={hazardSummary.downburst}
            colorClass="bg-blue-600"
          />

          {/* Heavy Rain / Cloudburst */}
          <HazardRiskRow
            icon={<CloudRain className="w-3.5 h-3.5 text-emerald-600" />}
            label="Heavy Rain / Cloudburst"
            value={hazardSummary.cloudburst}
            colorClass="bg-emerald-600"
          />
        </div>
      </div>

      {/* SECTION: TARGET SITE IMPACT SUMMARY */}
      {siteEta && (
        <div className="border-t border-slate-100 pt-3">
          <span className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
            TARGET SITE STATUS ({siteEta.target_location.label}):
          </span>

          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 text-[11px] space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Nearest Storm:</span>
              <span className="font-mono font-semibold text-slate-800">{siteEta.nearest_storm_id || 'None'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Distance:</span>
              <span className="font-mono text-slate-800">{siteEta.distance_km.toFixed(1)} km</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Estimated Arrival:</span>
              <span className="font-mono font-bold text-amber-600">
                {siteEta.estimated_arrival_minutes ? `${siteEta.estimated_arrival_minutes.toFixed(0)} min` : 'Stationary'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Threat Status:</span>
              <span className="font-mono font-semibold text-amber-700">{siteEta.status}</span>
            </div>
          </div>
        </div>
      )}

      {/* Operational Disclaimer */}
      <div className="text-[10px] text-slate-400 leading-tight border-t border-slate-100 pt-2 font-sans">
        Real-time multi-sensor nowcast diagnostics for automated decision support.
      </div>
    </div>
  );
};

interface HazardRiskRowProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  colorClass: string;
}

const HazardRiskRow: React.FC<HazardRiskRowProps> = ({
  icon,
  label,
  value,
  colorClass
}) => {
  const getSeverityText = (val: number) => {
    if (val >= 70) return 'Very High';
    if (val >= 45) return 'High';
    if (val >= 25) return 'Moderate';
    return 'Low';
  };

  return (
    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200/80">
      <div className="flex items-center justify-between text-[11px] mb-1">
        <div className="flex items-center gap-1.5 font-medium text-slate-800">
          {icon}
          <span>{label}</span>
        </div>
        <div className="flex items-center gap-1 font-mono">
          <span className="text-[10px] text-slate-500 font-sans">{getSeverityText(value)}</span>
          <span className="font-bold text-slate-900">{value}%</span>
        </div>
      </div>

      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
};
