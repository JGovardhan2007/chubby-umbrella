import React from 'react';
import { Layers, Eye, Sparkles, Cpu, AlertCircle } from 'lucide-react';
import { LayerToggleState } from '../types/weather';

interface LayerControlProps {
  layers: LayerToggleState;
  onToggleLayer: (layerKey: keyof LayerToggleState) => void;
}

export const LayerControl: React.FC<LayerControlProps> = ({
  layers,
  onToggleLayer
}) => {
  return (
    <div className="bg-[#111827] flex-1 overflow-y-auto p-3 text-xs select-none space-y-4">
      {/* SECTION 1: PHASE 1 CORE CONVECTIVE NOWCASTING LAYERS (SIH 26084) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            MAP LAYERS (PHASE 1)
          </span>
          <span className="text-[9px] font-mono text-sky-400 bg-sky-950 px-1 rounded border border-sky-800/60">
            26084
          </span>
        </div>

        <div className="space-y-1">
          <LayerToggleItem
            label="Radar Reflectivity"
            checked={layers.radarReflectivity}
            onChange={() => onToggleLayer('radarReflectivity')}
            colorBadge="#22C55E"
          />
          <LayerToggleItem
            label="Satellite Infrared (BT)"
            checked={layers.satelliteIR}
            onChange={() => onToggleLayer('satelliteIR')}
            colorBadge="#6366F1"
          />
          <LayerToggleItem
            label="Lightning Flashes"
            checked={layers.lightningFlashes}
            onChange={() => onToggleLayer('lightningFlashes')}
            colorBadge="#06B6D4"
          />
          <LayerToggleItem
            label="Storm Cells & Centroids"
            checked={layers.stormCells}
            onChange={() => onToggleLayer('stormCells')}
            colorBadge="#EF4444"
          />
          <LayerToggleItem
            label="Storm Tracks & ETA"
            checked={layers.stormTracks}
            onChange={() => onToggleLayer('stormTracks')}
            colorBadge="#F59E0B"
          />
          <LayerToggleItem
            label="Hazard Risk Zones"
            checked={layers.hazardZones}
            onChange={() => onToggleLayer('hazardZones')}
            colorBadge="#EC4899"
          />
        </div>
      </div>

      {/* SECTION 2: FUTURE PHASE 2 EXTENSION PLACEHOLDER (SIH 26078) */}
      <div className="border-t border-[#1F293D] pt-3">
        <div className="flex items-center justify-between mb-2 opacity-75">
          <span className="font-mono text-[11px] font-bold text-amber-400/90 uppercase tracking-wider flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            EXTREME ANOMALIES (PHASE 2)
          </span>
          <span className="text-[9px] font-mono text-amber-400 bg-amber-950 px-1 rounded border border-amber-800/60">
            26078
          </span>
        </div>

        <div className="space-y-1">
          <LayerToggleItem
            label="Extreme Weather Anomalies"
            checked={layers.extremeAnomalies}
            onChange={() => onToggleLayer('extremeAnomalies')}
            colorBadge="#F59E0B"
            isFuturePhase={true}
          />
          <LayerToggleItem
            label="Anomaly Spatio-Temporal Tracks"
            checked={layers.anomalyTracks}
            onChange={() => onToggleLayer('anomalyTracks')}
            colorBadge="#F59E0B"
            isFuturePhase={true}
          />
          <LayerToggleItem
            label="Anomaly Uncertainty Dispersion"
            checked={layers.anomalyUncertainty}
            onChange={() => onToggleLayer('anomalyUncertainty')}
            colorBadge="#F59E0B"
            isFuturePhase={true}
          />
        </div>
      </div>

      {/* SECTION 3: FUTURE PHASE 3 EXTENSION PLACEHOLDER (SIH 26081) */}
      <div className="border-t border-[#1F293D] pt-3">
        <div className="flex items-center justify-between mb-2 opacity-75">
          <span className="font-mono text-[11px] font-bold text-purple-400/90 uppercase tracking-wider flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            FORECAST MODELS (PHASE 3)
          </span>
          <span className="text-[9px] font-mono text-purple-400 bg-purple-950 px-1 rounded border border-purple-800/60">
            26081
          </span>
        </div>

        <div className="space-y-1">
          <LayerToggleItem
            label="NWP Physics Model (WRF)"
            checked={layers.modelForecastA}
            onChange={() => onToggleLayer('modelForecastA')}
            colorBadge="#A855F7"
            isFuturePhase={true}
          />
          <LayerToggleItem
            label="AI Spatio-Temporal Model"
            checked={layers.modelForecastB}
            onChange={() => onToggleLayer('modelForecastB')}
            colorBadge="#A855F7"
            isFuturePhase={true}
          />
          <LayerToggleItem
            label="Adaptive Blended Prediction"
            checked={layers.blendedForecast}
            onChange={() => onToggleLayer('blendedForecast')}
            colorBadge="#C084FC"
            isFuturePhase={true}
          />
        </div>
      </div>
    </div>
  );
};

interface LayerToggleItemProps {
  label: string;
  checked: boolean;
  onChange: () => void;
  colorBadge?: string;
  isFuturePhase?: boolean;
}

const LayerToggleItem: React.FC<LayerToggleItemProps> = ({
  label,
  checked,
  onChange,
  colorBadge,
  isFuturePhase
}) => {
  return (
    <label className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-colors border ${
      checked
        ? 'bg-[#1E293B]/70 border-[#334155] text-slate-100'
        : 'bg-[#0B0F19]/60 border-[#1F293D]/40 text-slate-400 hover:text-slate-200'
    }`}>
      <div className="flex items-center gap-2">
        {colorBadge && (
          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: colorBadge }} />
        )}
        <span className="font-sans text-[11px] leading-tight">{label}</span>
      </div>

      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
      />
    </label>
  );
};
