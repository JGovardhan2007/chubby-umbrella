import React, { useState } from 'react';
import { Cloud, CloudLightning, Flame, Wind, CloudRain, Zap, ArrowRight, ShieldAlert, Sparkles, Filter, Layers } from 'lucide-react';
import { ForecastCategory, ForecastModelInfo } from './types';

export const FORECAST_MODELS_DATA: ForecastModelInfo[] = [
  {
    id: 'clouds',
    title: 'Cloud Cover & Satellite IR',
    subtitle: 'INSAT-3D/3DR Brightness Temperature (TIR1/WV)',
    description: 'Diagnoses cloud-top cooling rates (dT/dt <= -4 K/15min) and deep convective overshooting tops below 220 K.',
    riskLevel: 'Moderate',
    unit: 'Brightness Temp (K)',
    peakValue: '214 K',
    sourceModel: 'INSAT-3D / NCMRWF Unified Model (NCUM)',
    forecastRange: 'Day 0 to Day +3 (72 hrs)',
    colorScheme: 'from-blue-600 to-indigo-800',
    affectedRegions: ['Sub-Himalayan Bengal', 'Assam & Meghalaya', 'Odisha Coast']
  },
  {
    id: 'thunderstorms',
    title: 'Severe Thunderstorms & CI',
    subtitle: 'Convective Initiation & Multi-Cell Tracking',
    description: 'Tracks deep convective cores (Z >= 35 dBZ) and rapid vertical development using Hungarian centroid tracking.',
    riskLevel: 'Severe',
    unit: 'Radar Reflectivity (dBZ)',
    peakValue: '54.5 dBZ',
    sourceModel: 'DWR Radar Network + NCMRWF-IMD Blended',
    forecastRange: 'Day 0 to Day +3 (72 hrs)',
    colorScheme: 'from-amber-500 to-red-700',
    affectedRegions: ['Gangetic West Bengal', 'Jharkhand', 'Coastal Andhra Pradesh']
  },
  {
    id: 'hailstorms',
    title: 'Hailstorm Risk (MESH / POSH)',
    subtitle: 'Maximum Expected Size of Hail Proxies',
    description: 'Calculates Probability of Severe Hail (POSH) and MESH diameter from severe mixed-phase reflectivity cores exceeding 48 dBZ.',
    riskLevel: 'High',
    unit: 'Probability / Diameter (cm)',
    peakValue: '85% / 3.8 cm',
    sourceModel: 'Doppler Radar Physics Baseline + ML POSH',
    forecastRange: 'Day 0 to Day +3 (72 hrs)',
    colorScheme: 'from-cyan-600 to-blue-800',
    affectedRegions: ['Vidarbha', 'Marathwada', 'Northern Telangana']
  },
  {
    id: 'downbursts',
    title: 'Downbursts & Severe Wind Gusts',
    subtitle: 'Radial Velocity Shear & Updraft Collapse',
    description: 'Estimates sudden microburst and squall wind acceleration driven by precipitation loading and downdraft velocity divergence.',
    riskLevel: 'High',
    unit: 'Shear Velocity (m/s)',
    peakValue: '23.4 m/s (84 km/h)',
    sourceModel: 'DWR Velocity Dealiasing + High-Res NWP',
    forecastRange: 'Day 0 to Day +3 (72 hrs)',
    colorScheme: 'from-teal-600 to-emerald-800',
    affectedRegions: ['Coastal Odisha', 'Rayalaseema', 'North Tamil Nadu']
  },
  {
    id: 'cloudbursts',
    title: 'Cloudburst & Extreme Rainfall',
    subtitle: 'Marshall-Palmer Z-R Localized Flooding',
    description: 'Identifies localized extreme rainfall (> 50-100 mm/hr) within slow-propagating convective clusters in hilly and urban catchments.',
    riskLevel: 'Severe',
    unit: 'Rain Rate (mm/hr)',
    peakValue: '78.2 mm/hr',
    sourceModel: 'Marshall-Palmer Z-R Diagnostic + AWS',
    forecastRange: 'Day 0 to Day +3 (72 hrs)',
    colorScheme: 'from-violet-600 to-purple-900',
    affectedRegions: ['Uttarakhand Foothills', 'Himachal Valley', 'Darjeeling']
  },
  {
    id: 'lightning',
    title: 'Lightning Flash Density',
    subtitle: 'Ground LLN Network & Mixed-Phase Charge',
    description: 'Probabilistic total lightning onset derived from -10°C to -20°C mixed-phase graupel-ice collision dynamics.',
    riskLevel: 'Moderate',
    unit: 'Flash Density (fl/km²)',
    peakValue: '0.14 fl/km²',
    sourceModel: 'Ground Lightning Network (LLN) + Satellite',
    forecastRange: 'Day 0 to Day +3 (72 hrs)',
    colorScheme: 'from-amber-600 to-orange-700',
    affectedRegions: ['Chhota Nagpur Plateau', 'East MP', 'Kerala Coast']
  }
];

interface ForecastCardGridProps {
  onSelectMap: (category: ForecastCategory) => void;
}

export const ForecastCardGrid: React.FC<ForecastCardGridProps> = ({ onSelectMap }) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedRisk, setSelectedRisk] = useState<'All' | 'Severe' | 'High' | 'Moderate'>('All');

  const getIcon = (id: ForecastCategory) => {
    switch (id) {
      case 'clouds': return <Cloud className="w-6 h-6 text-cyan-300" />;
      case 'thunderstorms': return <CloudLightning className="w-6 h-6 text-amber-300" />;
      case 'hailstorms': return <Flame className="w-6 h-6 text-blue-300" />;
      case 'downbursts': return <Wind className="w-6 h-6 text-teal-300" />;
      case 'cloudbursts': return <CloudRain className="w-6 h-6 text-purple-300" />;
      case 'lightning': return <Zap className="w-6 h-6 text-yellow-300" />;
    }
  };

  const filtered = FORECAST_MODELS_DATA.filter((m) => {
    const matchesQuery = m.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
      m.subtitle.toLowerCase().includes(filterQuery.toLowerCase()) ||
      m.affectedRegions.some((r) => r.toLowerCase().includes(filterQuery.toLowerCase()));
    const matchesRisk = selectedRisk === 'All' || m.riskLevel === selectedRisk;
    return matchesQuery && matchesRisk;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#1B365D] via-[#102A43] to-[#0A1A28] rounded-2xl p-6 text-white border border-blue-400/20 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Layers className="w-4 h-4" />
              <span>Multi-Model Convective Forecast Suite • NCMRWF & IMD</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              Meteorological Forecast Maps Gallery
            </h1>
            <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-3xl">
              Select any meteorological layer box below to launch the high-resolution, full-page interactive map.
              Analyze atmospheric parameters from current observation (Day 0) up to +3 Days (72-hour forecast horizons).
            </p>
          </div>

          <div className="flex items-center gap-2 bg-blue-900/40 p-2 rounded-xl border border-blue-400/30">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-cyan-200">
              6 Active Operational Models Online
            </span>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-blue-400/20">
          <input
            type="text"
            placeholder="Search forecast phenomenon, model, or region..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full sm:w-80 bg-slate-900/70 border border-slate-700 focus:border-cyan-400 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-400 outline-none transition-all shadow-inner"
          />

          <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
            <span className="text-slate-400 font-medium">Risk Filter:</span>
            {(['All', 'Severe', 'High', 'Moderate'] as const).map((risk) => (
              <button
                key={risk}
                onClick={() => setSelectedRisk(risk)}
                className={`px-3 py-1 rounded-lg font-semibold text-xs transition-colors ${
                  selectedRisk === risk
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {risk}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Forecast Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((model) => (
          <div
            key={model.id}
            onClick={() => onSelectMap(model.id)}
            className="bg-white rounded-2xl border border-slate-200 hover:border-amber-500/70 shadow-sm hover:shadow-xl transition-all duration-200 flex flex-col overflow-hidden cursor-pointer group hover:-translate-y-1"
          >
            {/* Card Header with Category Gradient Badge */}
            <div className={`p-4 bg-gradient-to-r ${model.colorScheme} text-white flex items-center justify-between relative`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-xs border border-white/20 flex items-center justify-center shadow-xs">
                  {getIcon(model.id)}
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-tight">{model.title}</h3>
                  <p className="text-[11px] text-white/80">{model.subtitle}</p>
                </div>
              </div>

              {/* Threat Badge */}
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                  model.riskLevel === 'Severe'
                    ? 'bg-red-600/90 border-red-300 text-white animate-pulse'
                    : model.riskLevel === 'High'
                    ? 'bg-amber-500/90 border-amber-300 text-slate-950'
                    : 'bg-blue-600/90 border-blue-300 text-white'
                }`}
              >
                {model.riskLevel} Risk
              </span>
            </div>

            {/* Card Body */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                {model.description}
              </p>

              {/* Meteorological Indicators */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block uppercase">Peak Forecast Intensity</span>
                  <span className="text-sm font-bold text-slate-900 mt-0.5 block">{model.peakValue}</span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block uppercase">Forecast Horizon</span>
                  <span className="text-xs font-bold text-slate-900 mt-1 block">{model.forecastRange}</span>
                </div>
              </div>

              {/* Affected Hotspots */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Vulnerable Convective Regions
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {model.affectedRegions.map((region) => (
                    <span
                      key={region}
                      className="px-2 py-0.5 bg-amber-50 border border-amber-200/80 text-amber-900 rounded-md text-[10px] font-medium"
                    >
                      {region}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Button: Open Full-Page Map */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-mono">
                  Model: {model.sourceModel}
                </span>

                <button
                  type="button"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-orange-600 text-slate-950 hover:text-white font-bold text-xs transition-colors shadow-xs group-hover:bg-[#DF691A] group-hover:text-white"
                >
                  <span>Open Full-Page Map</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
