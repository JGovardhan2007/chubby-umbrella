import React, { useState } from 'react';
import { PrecipitationChart } from './PrecipitationChart';
import { ThermodynamicChart } from './ThermodynamicChart';
import { HailVerificationChart } from './HailVerificationChart';
import { SoundingTable } from './SoundingTable';
import { RegionOption } from './types';
import { BarChart3, CloudRain, Flame, Activity, ShieldCheck, Download, RefreshCw } from 'lucide-react';

export const AnalysisPage: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState<RegionOption>('All India');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const regions: RegionOption[] = [
    'All India',
    'Gangetic Plains',
    'North-West / NCR',
    'North-East',
    'Central Deccan',
    'South Peninsula'
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-[#F4EFEA] text-slate-800 flex flex-col font-sans select-none">
      <div className="max-w-7xl mx-auto w-full px-4 md:px-6 py-6 space-y-6">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-[#1E293B] via-[#0F172A] to-[#1E293B] rounded-2xl p-6 text-white border border-slate-700/60 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
              <BarChart3 className="w-4 h-4" />
              <span>Numerical Weather Prediction & Convective Analytics • NCMRWF</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              Meteorological Diagnostic & Verification Portal
            </h1>
            <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-2xl">
              Quantitative diagnostic time-series, thermodynamic sounding instability profiles, cloudburst rainfall rates, and multi-model forecast verification.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-600 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh Analytics</span>
            </button>
          </div>
        </div>

        {/* Region Filter Bar */}
        <div className="flex items-center justify-between flex-wrap gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            <span className="text-xs font-bold text-slate-500 mr-2 uppercase tracking-wider text-[10px]">
              Region:
            </span>
            {regions.map((reg) => (
              <button
                key={reg}
                onClick={() => setSelectedRegion(reg)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedRegion === reg
                    ? 'bg-[#DF691A] text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {reg}
              </button>
            ))}
          </div>

          <span className="text-[11px] text-slate-500 font-mono">
            Cycle: 00Z / 12Z Global Data Assimilation
          </span>
        </div>

        {/* Key Diagnostic KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <CloudRain className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Peak Rain Rate
              </span>
              <span className="text-lg font-extrabold text-slate-900 block mt-0.5">
                68.5 mm/hr
              </span>
              <span className="text-[10px] text-red-600 font-semibold">Cloudburst Warning Active</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Peak Instability CAPE
              </span>
              <span className="text-lg font-extrabold text-amber-600 block mt-0.5">
                3,450 J/kg
              </span>
              <span className="text-[10px] text-amber-700 font-semibold">Extreme Convection Potential</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Peak Hail Size (MESH)
              </span>
              <span className="text-lg font-extrabold text-purple-700 block mt-0.5">
                3.8 cm (POSH 85%)
              </span>
              <span className="text-[10px] text-purple-600 font-semibold">Severe Cell in Vidarbha</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Core Forecast CSI Skill
              </span>
              <span className="text-lg font-extrabold text-emerald-700 block mt-0.5">
                0.82 (POD: 89%)
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold">+1h Nowcast Lead Time</span>
            </div>
          </div>
        </div>

        {/* Charts Row 1: Rain Rate Time-Series & CAPE/CIN Thermodynamic Profile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PrecipitationChart />
          <ThermodynamicChart />
        </div>

        {/* Charts Row 2: Model Verification Skill Score & Hail Distribution */}
        <HailVerificationChart />

        {/* Sounding Station Diagnostics Table */}
        <SoundingTable />
      </div>
    </div>
  );
};
