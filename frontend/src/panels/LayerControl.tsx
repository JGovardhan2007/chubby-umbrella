import React, { useState } from 'react';
import { Search, ChevronDown, Check, Layers, AlertTriangle, Cpu } from 'lucide-react';
import { LayerToggleState } from '../types/weather';

interface LayerControlProps {
  layers: LayerToggleState;
  onToggleLayer: (layerKey: keyof LayerToggleState) => void;
}

export const LayerControl: React.FC<LayerControlProps> = ({
  layers,
  onToggleLayer
}) => {
  const [typeSearch, setTypeSearch] = useState('');
  const [stationSearch, setStationSearch] = useState('');
  const [citySearch, setCitySearch] = useState('');

  const [showMoreType, setShowMoreType] = useState(false);
  const [showMoreStation, setShowMoreStation] = useState(false);
  const [showMoreCity, setShowMoreCity] = useState(false);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 bg-white text-slate-800 select-none space-y-5">
      {/* GROUP 1: Hazard Type / Convective Phenom */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-800 font-sans tracking-tight">Type</span>
        </div>

        {/* Search Input */}
        <div className="relative mb-2.5">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search .."
            value={typeSearch}
            onChange={(e) => setTypeSearch(e.target.value)}
            className="w-full bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 focus:border-amber-500 rounded-full pl-8 pr-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 outline-none transition-all"
          />
        </div>

        {/* Checkbox options (matching mockup style with warm amber checks) */}
        <div className="space-y-1.5">
          <FilterCheckbox
            label="Severe Thunderstorm"
            checked={layers.stormCells}
            onChange={() => onToggleLayer('stormCells')}
          />
          <FilterCheckbox
            label="Lightning Flashes"
            checked={layers.lightningFlashes}
            onChange={() => onToggleLayer('lightningFlashes')}
          />
          <FilterCheckbox
            label="Radar Reflectivity (dBZ)"
            checked={layers.radarReflectivity}
            onChange={() => onToggleLayer('radarReflectivity')}
          />
          <FilterCheckbox
            label="Severe Hail Risk (>2cm)"
            checked={layers.hazardZones}
            onChange={() => onToggleLayer('hazardZones')}
          />

          {showMoreType && (
            <>
              <FilterCheckbox
                label="Satellite Infrared (BT)"
                checked={layers.satelliteIR}
                onChange={() => onToggleLayer('satelliteIR')}
              />
              <FilterCheckbox
                label="Kinematic Storm Tracks"
                checked={layers.stormTracks}
                onChange={() => onToggleLayer('stormTracks')}
              />
            </>
          )}

          <button
            onClick={() => setShowMoreType(!showMoreType)}
            className="text-xs font-semibold text-amber-600 hover:text-amber-700 pt-1 flex items-center gap-1 transition-colors"
          >
            {showMoreType ? '- See less' : '+ See more'}
          </button>
        </div>
      </div>

      {/* GROUP 2: Province / Radar Stations */}
      <div className="border-t border-slate-100 pt-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-800 font-sans tracking-tight">Province / Station</span>
        </div>

        {/* Search Input */}
        <div className="relative mb-2.5">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search .."
            value={stationSearch}
            onChange={(e) => setStationSearch(e.target.value)}
            className="w-full bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 focus:border-amber-500 rounded-full pl-8 pr-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 outline-none transition-all"
          />
        </div>

        {/* Checkbox options */}
        <div className="space-y-1.5">
          <FilterCheckbox
            label="Chennai Doppler (DWR)"
            checked={true}
            onChange={() => {}}
          />
          <FilterCheckbox
            label="Sriharikota Radar"
            checked={true}
            onChange={() => {}}
          />
          <FilterCheckbox
            label="Bangalore Doppler"
            checked={false}
            onChange={() => {}}
          />
          <FilterCheckbox
            label="Machilipatnam DWR"
            checked={false}
            onChange={() => {}}
          />

          {showMoreStation && (
            <>
              <FilterCheckbox
                label="Hyderabad Radar"
                checked={false}
                onChange={() => {}}
              />
              <FilterCheckbox
                label="Kochi Doppler"
                checked={false}
                onChange={() => {}}
              />
            </>
          )}

          <button
            onClick={() => setShowMoreStation(!showMoreStation)}
            className="text-xs font-semibold text-amber-600 hover:text-amber-700 pt-1 flex items-center gap-1 transition-colors"
          >
            {showMoreStation ? '- See less' : '+ See more'}
          </button>
        </div>
      </div>

      {/* GROUP 3: City / Advanced AI & NWP Models (Phase 2 & Phase 3) */}
      <div className="border-t border-slate-100 pt-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-800 font-sans tracking-tight">City & Model Layers</span>
        </div>

        {/* Search Input */}
        <div className="relative mb-2.5">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search .."
            value={citySearch}
            onChange={(e) => setCitySearch(e.target.value)}
            className="w-full bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 focus:border-amber-500 rounded-full pl-8 pr-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 outline-none transition-all"
          />
        </div>

        {/* Checkbox options */}
        <div className="space-y-1.5">
          <FilterCheckbox
            label="Chennai Metro Site"
            checked={false}
            onChange={() => {}}
          />
          <FilterCheckbox
            label="Ennore Coastal Port"
            checked={false}
            onChange={() => {}}
          />
          <FilterCheckbox
            label="Spatio-Temporal Extreme Anomalies"
            checked={layers.extremeAnomalies}
            onChange={() => onToggleLayer('extremeAnomalies')}
          />
          <FilterCheckbox
            label="Hybrid AI–NWP Ensemble Blend"
            checked={layers.blendedForecast}
            onChange={() => onToggleLayer('blendedForecast')}
          />

          {showMoreCity && (
            <>
              <FilterCheckbox
                label="Anomaly Uncertainty Dispersion"
                checked={layers.anomalyUncertainty}
                onChange={() => onToggleLayer('anomalyUncertainty')}
              />
              <FilterCheckbox
                label="Physics NWP (WRF Core)"
                checked={layers.modelForecastA}
                onChange={() => onToggleLayer('modelForecastA')}
              />
            </>
          )}

          <button
            onClick={() => setShowMoreCity(!showMoreCity)}
            className="text-xs font-semibold text-amber-600 hover:text-amber-700 pt-1 flex items-center gap-1 transition-colors"
          >
            {showMoreCity ? '- See less' : '+ See more'}
          </button>
        </div>
      </div>
    </div>
  );
};

interface FilterCheckboxProps {
  label: string;
  checked: boolean;
  onChange: () => void;
}

const FilterCheckbox: React.FC<FilterCheckboxProps> = ({
  label,
  checked,
  onChange
}) => {
  return (
    <label className="flex items-center gap-2.5 py-1 px-1 rounded-md hover:bg-slate-50 cursor-pointer text-xs text-slate-700 transition-colors">
      <div
        onClick={onChange}
        className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
          checked
            ? 'bg-amber-500 border-amber-500 text-white shadow-xs'
            : 'border-slate-300 bg-white hover:border-slate-400'
        }`}
      >
        {checked && <Check className="w-3 h-3 stroke-[3]" />}
      </div>
      <span className={`text-[12px] leading-tight select-none ${checked ? 'text-slate-900 font-medium' : 'text-slate-600'}`}>
        {label}
      </span>
    </label>
  );
};
