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
    <div className="bg-[#111827] flex-1 overflow-y-auto p-3 text-xs select-none space-y-4">
      {/* SECTION: CURRENT NOWCAST OVERVIEW */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            CURRENT NOWCAST
          </span>
          <span className="text-[9px] font-mono text-slate-400 bg-[#0B0F19] px-1.5 py-0.5 rounded border border-[#1F293D]">
            0–6 hr Horizon
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="bg-[#0B0F19] p-2 rounded border border-[#1F293D]/80">
            <span className="text-[10px] text-slate-400 font-sans block mb-0.5">Active Storm Cells:</span>
            <span className="font-mono text-sm font-bold text-slate-100">{activeStormCount}</span>
          </div>

          <div className="bg-[#0B0F19] p-2 rounded border border-[#1F293D]/80">
            <span className="text-[10px] text-slate-400 font-sans block mb-0.5">High-Risk Regions:</span>
            <span className={`font-mono text-sm font-bold ${highRiskRegions > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {highRiskRegions}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION: HAZARD RISK SUMMARY GAUGES */}
      <div className="border-t border-[#1F293D] pt-3">
        <div className="flex items-center justify-between mb-2.5">
          <span className="font-mono text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            HAZARD RISK SUMMARY
          </span>
          <span className="text-[9px] font-mono text-slate-400">Probabilistic</span>
        </div>

        <div className="space-y-2.5">
          {/* Lightning Risk */}
          <HazardRiskRow
            icon={<Zap className="w-3.5 h-3.5 text-cyan-400" />}
            label="Lightning Activity"
            value={hazardSummary.lightning}
            colorClass="bg-cyan-500"
          />

          {/* Hail Risk */}
          <HazardRiskRow
            icon={<CloudHail className="w-3.5 h-3.5 text-indigo-400" />}
            label="Severe Hail Potential"
            value={hazardSummary.hail}
            colorClass="bg-indigo-500"
          />

          {/* Downburst / Severe Wind */}
          <HazardRiskRow
            icon={<Wind className="w-3.5 h-3.5 text-amber-400" />}
            label="Downburst Gale Gusts"
            value={hazardSummary.downburst}
            colorClass="bg-amber-500"
          />

          {/* Heavy Rain / Cloudburst */}
          <HazardRiskRow
            icon={<CloudRain className="w-3.5 h-3.5 text-emerald-400" />}
            label="Heavy Rain / Cloudburst"
            value={hazardSummary.cloudburst}
            colorClass="bg-emerald-500"
          />
        </div>
      </div>

      {/* SECTION: TARGET SITE IMPACT SUMMARY */}
      {siteEta && (
        <div className="border-t border-[#1F293D] pt-3">
          <span className="font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
            TARGET SITE STATUS ({siteEta.target_location.label}):
          </span>

          <div className="bg-[#0B0F19] p-2 rounded border border-[#1F293D]/80 text-[11px] space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Nearest Storm:</span>
              <span className="font-mono font-semibold text-slate-200">{siteEta.nearest_storm_id || 'None'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Distance:</span>
              <span className="font-mono text-slate-200">{siteEta.distance_km.toFixed(1)} km</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Estimated Arrival:</span>
              <span className="font-mono font-bold text-sky-400">
                {siteEta.estimated_arrival_minutes ? `${siteEta.estimated_arrival_minutes.toFixed(0)} min` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Threat Status:</span>
              <span className="font-mono font-semibold text-amber-400">{siteEta.status}</span>
            </div>
          </div>
        </div>
      )}

      {/* Legal Disclaimer */}
      <div className="text-[10px] text-slate-500 leading-tight border-t border-[#1F293D]/80 pt-2 font-mono">
        SIH 26084 prototype. Probabilistic diagnostics for decision support; not official IMD warnings.
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
    <div className="bg-[#0B0F19] p-2 rounded border border-[#1F293D]/60">
      <div className="flex items-center justify-between text-[11px] mb-1">
        <div className="flex items-center gap-1.5 font-medium text-slate-200">
          {icon}
          <span>{label}</span>
        </div>
        <div className="flex items-center gap-1 font-mono">
          <span className="text-[10px] text-slate-400">{getSeverityText(value)}</span>
          <span className="font-bold text-slate-100">{value}%</span>
        </div>
      </div>

      <div className="w-full h-1.5 bg-[#1F293D] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
};
