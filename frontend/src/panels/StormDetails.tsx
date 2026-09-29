import React from 'react';
import { X, Navigation, Zap, Maximize2, ShieldAlert, CheckCircle2, TrendingUp, Compass } from 'lucide-react';
import { StormCell } from '../types/storm';
import { SiteEtaSummary } from '../types/forecast';

interface StormDetailsProps {
  storm: StormCell;
  siteEta: SiteEtaSummary | null;
  onClose: () => void;
}

export const StormDetails: React.FC<StormDetailsProps> = ({
  storm,
  siteEta,
  onClose
}) => {
  const isHighIntensity = storm.intensity >= 48;
  const isLightningActive = (storm.indicators.max_lightning_density || 0) > 0.2;

  return (
    <div className="bg-[#111827] border-b border-[#1F293D] p-3 text-xs select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-[#1F293D]">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="font-mono text-sm font-bold text-slate-100">{storm.storm_id}</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800/60 ml-1">
            {storm.convective_stage}
          </span>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-[#1E293B] transition-colors"
          title="Close details"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Grid of Key Storm Metrics */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-[#0B0F19] p-2 rounded border border-[#1F293D]/80">
          <span className="text-[10px] text-slate-400 font-sans block mb-0.5">Location:</span>
          <span className="font-mono text-xs text-slate-100 font-semibold">
            {storm.centroid_lat.toFixed(2)}° N, {storm.centroid_lon.toFixed(2)}° E
          </span>
        </div>

        <div className="bg-[#0B0F19] p-2 rounded border border-[#1F293D]/80">
          <span className="text-[10px] text-slate-400 font-sans block mb-0.5">Peak Intensity:</span>
          <span className={`font-mono text-xs font-semibold ${isHighIntensity ? 'text-red-400' : 'text-amber-400'}`}>
            {storm.intensity.toFixed(1)} dBZ ({isHighIntensity ? 'Severe' : 'Moderate'})
          </span>
        </div>

        <div className="bg-[#0B0F19] p-2 rounded border border-[#1F293D]/80">
          <span className="text-[10px] text-slate-400 font-sans block mb-0.5">Movement Kinematics:</span>
          <span className="font-mono text-xs text-slate-100 font-semibold flex items-center gap-1">
            <Compass className="w-3 h-3 text-sky-400" />
            {storm.heading_deg.toFixed(0)}° → {storm.speed_kmh.toFixed(1)} km/h
          </span>
        </div>

        <div className="bg-[#0B0F19] p-2 rounded border border-[#1F293D]/80">
          <span className="text-[10px] text-slate-400 font-sans block mb-0.5">Storm Area:</span>
          <span className="font-mono text-xs text-slate-100 font-semibold">
            {storm.area_km2.toFixed(0)} km² ({storm.growth_rate_km2_hr >= 0 ? '+' : ''}{storm.growth_rate_km2_hr.toFixed(0)} km²/h)
          </span>
        </div>

        <div className="bg-[#0B0F19] p-2 rounded border border-[#1F293D]/80">
          <span className="text-[10px] text-slate-400 font-sans block mb-0.5">Lightning Activity:</span>
          <span className="font-mono text-xs font-semibold text-cyan-400 flex items-center gap-1">
            <Zap className="w-3 h-3" />
            {isLightningActive ? 'Increasing' : 'Sporadic'} ({storm.indicators.max_lightning_density?.toFixed(2) || 0} fl/km²)
          </span>
        </div>

        <div className="bg-[#0B0F19] p-2 rounded border border-[#1F293D]/80">
          <span className="text-[10px] text-slate-400 font-sans block mb-0.5">Confidence Score:</span>
          <span className="font-mono text-xs font-semibold text-emerald-400">
            {(storm.confidence * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Localized Arrival Time / Site Impact if available */}
      {siteEta && siteEta.nearest_storm_id === storm.storm_id && (
        <div className="bg-sky-950/40 border border-sky-800/60 rounded p-2 mb-3 text-[11px]">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sky-300 font-semibold">Target ETA ({siteEta.target_location.label}):</span>
            <span className="font-mono text-xs font-bold text-sky-200">
              {siteEta.estimated_arrival_minutes ? `${siteEta.estimated_arrival_minutes.toFixed(0)} min` : 'Stationary'}
            </span>
          </div>
          <div className="text-slate-400 text-[10px]">
            Distance: {siteEta.distance_km.toFixed(1)} km | Status: <span className="text-slate-200 font-semibold">{siteEta.status}</span>
          </div>
        </div>
      )}

      {/* WHY THIS STORM IS BEING FLAGGED (Diagnostic Meteorological Reasons) */}
      <div className="border-t border-[#1F293D] pt-2.5">
        <span className="font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
          WHY THIS STORM IS BEING FLAGGED:
        </span>

        <div className="space-y-1.5 text-[11px]">
          <div className="flex items-center gap-2 text-slate-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Radar core reflectivity exceeding 40–55 dBZ</span>
          </div>

          <div className="flex items-center gap-2 text-slate-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Rapid cloud-top cooling detected (T_B &lt; 230K)</span>
          </div>

          <div className="flex items-center gap-2 text-slate-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Active mixed-phase lightning flashes registered</span>
          </div>

          <div className="flex items-center gap-2 text-slate-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Horizontal storm area expanding at {storm.growth_rate_km2_hr.toFixed(0)} km²/hr</span>
          </div>
        </div>
      </div>
    </div>
  );
};
