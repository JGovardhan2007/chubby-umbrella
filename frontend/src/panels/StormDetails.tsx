import React from 'react';
import { X, Navigation, Zap, ShieldAlert, CheckCircle2, Compass, AlertTriangle } from 'lucide-react';
import { StormCell } from '../types/storm';
import { SiteEtaSummary } from '../types/forecast';
import { formatStormName } from '../utils/formatters';

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
    <div className="bg-white border-b border-slate-200 p-4 text-xs select-none shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm font-bold text-slate-900 font-sans">{formatStormName(storm.storm_id)}</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold ml-1">
            {storm.convective_stage}
          </span>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title="Close details"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Grid of Key Storm Metrics */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
          <span className="text-[10px] text-slate-500 font-sans block mb-0.5">Centroid:</span>
          <span className="font-mono text-xs text-slate-800 font-semibold">
            {storm.centroid_lat.toFixed(2)}°N, {storm.centroid_lon.toFixed(2)}°E
          </span>
        </div>

        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
          <span className="text-[10px] text-slate-500 font-sans block mb-0.5">Peak Core:</span>
          <span className={`font-mono text-xs font-semibold ${isHighIntensity ? 'text-red-600' : 'text-amber-600'}`}>
            {storm.intensity.toFixed(1)} dBZ ({isHighIntensity ? 'Severe' : 'Moderate'})
          </span>
        </div>

        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
          <span className="text-[10px] text-slate-500 font-sans block mb-0.5">Kinematics:</span>
          <span className="font-mono text-xs text-slate-800 font-semibold flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-amber-500" />
            {storm.heading_deg.toFixed(0)}° → {storm.speed_kmh.toFixed(1)} km/h
          </span>
        </div>

        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
          <span className="text-[10px] text-slate-500 font-sans block mb-0.5">Area & Growth:</span>
          <span className="font-mono text-xs text-slate-800 font-semibold">
            {storm.area_km2.toFixed(0)} km² ({storm.growth_rate_km2_hr >= 0 ? '+' : ''}{storm.growth_rate_km2_hr.toFixed(0)} km²/h)
          </span>
        </div>

        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
          <span className="text-[10px] text-slate-500 font-sans block mb-0.5">Lightning Density:</span>
          <span className="font-mono text-xs font-semibold text-cyan-700 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-cyan-600" />
            {storm.indicators.max_lightning_density?.toFixed(2) || 0} fl/km²
          </span>
        </div>

        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
          <span className="text-[10px] text-slate-500 font-sans block mb-0.5">Confidence Score:</span>
          <span className="font-mono text-xs font-semibold text-emerald-600">
            {(storm.confidence * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Localized Arrival Time / Site Impact if available */}
      {siteEta && siteEta.nearest_storm_id === storm.storm_id && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 mb-3 text-[11px]">
          <div className="flex justify-between items-center mb-1">
            <span className="text-amber-900 font-semibold">Target ETA ({siteEta.target_location.label}):</span>
            <span className="font-mono text-xs font-bold text-amber-700">
              {siteEta.estimated_arrival_minutes ? `${siteEta.estimated_arrival_minutes.toFixed(0)} min` : 'Stationary'}
            </span>
          </div>
          <div className="text-slate-600 text-[10px]">
            Distance: {siteEta.distance_km.toFixed(1)} km | Status: <span className="text-slate-900 font-semibold">{siteEta.status}</span>
          </div>
        </div>
      )}

      {/* WHY THIS STORM IS BEING FLAGGED */}
      <div className="border-t border-slate-100 pt-3">
        <span className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
          WHY THIS STORM IS BEING FLAGGED:
        </span>

        <div className="space-y-1.5 text-[11px]">
          <div className="flex items-center gap-2 text-slate-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Radar core reflectivity exceeding 40–55 dBZ</span>
          </div>

          <div className="flex items-center gap-2 text-slate-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Cloud-top cooling detected (T_B &lt; 230K)</span>
          </div>

          <div className="flex items-center gap-2 text-slate-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Active mixed-phase lightning flashes registered</span>
          </div>
        </div>
      </div>
    </div>
  );
};
