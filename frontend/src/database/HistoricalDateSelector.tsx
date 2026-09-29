import React, { useState } from 'react';
import { Database, Calendar, Flame, CloudRain, Zap, ShieldAlert, ArrowRight, Play, Search, Clock, Film } from 'lucide-react';
import { HistoricalDayRecord } from './types';

export const HISTORICAL_10_DAYS: HistoricalDayRecord[] = [
  {
    date: '2026-09-30',
    displayDate: '30 Sep 2026',
    dayRelative: 'Today',
    synopticSummary: 'Severe multi-cell supercell outbreak along Odisha coast and Gangetic West Bengal with deep mixed-phase hail cores.',
    maxDbz: 54.5,
    totalLightningFlashes: 14280,
    maxRainRate: 78.4,
    hailReported: true,
    activeCellCount: 38,
    dominantSeverity: 'Severe'
  },
  {
    date: '2026-09-29',
    displayDate: '29 Sep 2026',
    dayRelative: 'Yesterday',
    synopticSummary: 'Bay of Bengal cyclonic circulation inducing squall lines and downburst winds (> 22 m/s) across North Andhra Pradesh.',
    maxDbz: 52.0,
    totalLightningFlashes: 11400,
    maxRainRate: 64.0,
    hailReported: true,
    activeCellCount: 31,
    dominantSeverity: 'Severe'
  },
  {
    date: '2026-09-28',
    displayDate: '28 Sep 2026',
    dayRelative: '2 Days Ago',
    synopticSummary: 'Scattered afternoon thunderstorms across Vidarbha and Chhota Nagpur Plateau with localized cloudburst rates.',
    maxDbz: 48.0,
    totalLightningFlashes: 8900,
    maxRainRate: 52.5,
    hailReported: false,
    activeCellCount: 24,
    dominantSeverity: 'High'
  },
  {
    date: '2026-09-27',
    displayDate: '27 Sep 2026',
    dayRelative: '3 Days Ago',
    synopticSummary: 'Intense orographic lifting and sub-Himalayan cloudburst events recorded in Darjeeling and northern foothill valleys.',
    maxDbz: 51.2,
    totalLightningFlashes: 7600,
    maxRainRate: 85.0,
    hailReported: false,
    activeCellCount: 22,
    dominantSeverity: 'Severe'
  },
  {
    date: '2026-09-26',
    displayDate: '26 Sep 2026',
    dayRelative: '4 Days Ago',
    synopticSummary: 'Western disturbance interaction over North-West plains triggering isolated hail and gusty squalls in Punjab and Haryana.',
    maxDbz: 46.5,
    totalLightningFlashes: 6300,
    maxRainRate: 42.0,
    hailReported: true,
    activeCellCount: 19,
    dominantSeverity: 'High'
  },
  {
    date: '2026-09-25',
    displayDate: '25 Sep 2026',
    dayRelative: '5 Days Ago',
    synopticSummary: 'Moderate monsoon trough activity across Central India with steady stratiform rain and embedded convective pulses.',
    maxDbz: 41.0,
    totalLightningFlashes: 4800,
    maxRainRate: 31.0,
    hailReported: false,
    activeCellCount: 16,
    dominantSeverity: 'Moderate'
  },
  {
    date: '2026-09-24',
    displayDate: '24 Sep 2026',
    dayRelative: '6 Days Ago',
    synopticSummary: 'Peninsular sea-breeze convergence triggering evening thunderstorm clusters in Bengaluru and interior Tamil Nadu.',
    maxDbz: 45.0,
    totalLightningFlashes: 7100,
    maxRainRate: 45.0,
    hailReported: false,
    activeCellCount: 21,
    dominantSeverity: 'High'
  },
  {
    date: '2026-09-23',
    displayDate: '23 Sep 2026',
    dayRelative: '7 Days Ago',
    synopticSummary: 'Widespread convective initiation along Western Ghats with deep cloud-top cooling detected via INSAT-3DR.',
    maxDbz: 43.5,
    totalLightningFlashes: 5200,
    maxRainRate: 38.0,
    hailReported: false,
    activeCellCount: 18,
    dominantSeverity: 'Moderate'
  },
  {
    date: '2026-09-22',
    displayDate: '22 Sep 2026',
    dayRelative: '8 Days Ago',
    synopticSummary: 'Isolated convective cells across Gujarat and western MP with localized dry microbursts and wind gusts up to 60 km/h.',
    maxDbz: 39.0,
    totalLightningFlashes: 3400,
    maxRainRate: 24.0,
    hailReported: false,
    activeCellCount: 12,
    dominantSeverity: 'Moderate'
  },
  {
    date: '2026-09-21',
    displayDate: '21 Sep 2026',
    dayRelative: '9 Days Ago',
    synopticSummary: 'Low-shear stratiform rain pattern across eastern coastal belt with isolated lightning strikes and low hail probability.',
    maxDbz: 36.0,
    totalLightningFlashes: 2800,
    maxRainRate: 18.0,
    hailReported: false,
    activeCellCount: 9,
    dominantSeverity: 'Low'
  }
];

interface HistoricalDateSelectorProps {
  onSelectDay: (record: HistoricalDayRecord) => void;
}

export const HistoricalDateSelector: React.FC<HistoricalDateSelectorProps> = ({ onSelectDay }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'All' | 'Severe' | 'High' | 'Moderate'>('All');

  const filtered = HISTORICAL_10_DAYS.filter((d) => {
    const matchesQuery = d.displayDate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.synopticSummary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.dayRelative.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = severityFilter === 'All' || d.dominantSeverity === severityFilter;
    return matchesQuery && matchesSeverity;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0A1A28] rounded-2xl p-6 text-white border border-slate-700/60 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Database className="w-4 h-4" />
              <span>Historical Convective Database Archive • Past 10 Days</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              10-Day Synoptic Weather Database & Diurnal Playback
            </h1>
            <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-2xl">
              Access high-resolution hourly historical radar, satellite IR, and lightning archives.
              Click any date to launch the full-page 24-hour video/slideshow player and track storm evolution.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
            <Film className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-slate-200">
              24-Hour Diurnal Slideshow Engine Ready
            </span>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-700/60">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search date, event, or weather phenomenon..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-700 focus:border-cyan-400 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-400 outline-none transition-all shadow-inner"
            />
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
            <span className="text-slate-400 font-medium">Severity:</span>
            {(['All', 'Severe', 'High', 'Moderate'] as const).map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-3 py-1 rounded-lg font-semibold text-xs transition-colors ${
                  severityFilter === sev
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 10-Day Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((day) => (
          <div
            key={day.date}
            onClick={() => onSelectDay(day)}
            className="bg-white rounded-2xl border border-slate-200 hover:border-amber-500/80 shadow-xs hover:shadow-xl transition-all duration-200 p-5 flex flex-col justify-between cursor-pointer group hover:-translate-y-0.5"
          >
            <div>
              {/* Date Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold text-xs">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 group-hover:text-amber-800 transition-colors">
                      {day.displayDate}
                    </h3>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {day.dayRelative} • 24 Hourly Frames (00Z–23Z)
                    </span>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                    day.dominantSeverity === 'Severe'
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : day.dominantSeverity === 'High'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-blue-50 text-blue-800 border-blue-200'
                  }`}
                >
                  {day.dominantSeverity} Convection
                </span>
              </div>

              {/* Synoptic Summary */}
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                {day.synopticSummary}
              </p>

              {/* Meteorological Indicators */}
              <div className="grid grid-cols-3 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block uppercase">Peak Core dBZ</span>
                  <span className="text-sm font-bold text-slate-900 mt-0.5 block flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-amber-600 inline" />
                    <span>{day.maxDbz} dBZ</span>
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block uppercase">Max Rain Rate</span>
                  <span className="text-sm font-bold text-slate-900 mt-0.5 block flex items-center gap-1">
                    <CloudRain className="w-3.5 h-3.5 text-blue-600 inline" />
                    <span>{day.maxRainRate} mm/h</span>
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block uppercase">Lightning Strokes</span>
                  <span className="text-sm font-bold text-slate-900 mt-0.5 block flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-yellow-500 inline" />
                    <span>{day.totalLightningFlashes.toLocaleString()}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{day.activeCellCount} Tracked Cells</span>
              </span>

              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-[#DF691A] text-slate-950 hover:text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Play 24h Diurnal Slideshow</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
