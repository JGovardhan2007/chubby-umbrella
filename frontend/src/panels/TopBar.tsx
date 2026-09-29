import React from 'react';
import { Search, Bell, Bookmark, Compass, Activity, Radio, CloudLightning } from 'lucide-react';
import { SystemStatusData } from '../types/weather';

interface TopBarProps {
  systemStatus: SystemStatusData | null;
  mode: 'replay' | 'live' | 'demo';
  onModeChange: (mode: 'replay' | 'live' | 'demo') => void;
  currentTimeLabel: string;
  isBackendConnected: boolean;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  systemStatus,
  mode,
  onModeChange,
  currentTimeLabel,
  isBackendConnected,
  searchQuery = '',
  onSearchChange
}) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-30 select-none shadow-xs">
      {/* 1. Left: Weather Intelligence Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-300 flex items-center justify-center shadow-xs">
          <CloudLightning className="w-4 h-4 text-amber-500" />
        </div>
        <div className="flex flex-col">
          <span className="text-base font-bold tracking-tight text-slate-900 font-sans leading-none">
            Convective Nowcast
          </span>
          <span className="text-[11px] font-medium text-slate-500 mt-0.5">
            Severe Storm, Hail & Cloudburst Intelligence
          </span>
        </div>
      </div>

      {/* 2. Center: Search Bar */}
      <div className="flex-1 max-w-xl mx-6">
        <div className="relative flex items-center w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
          <input
            type="text"
            placeholder="Search radar station, target site, coordinates, city..."
            value={searchQuery}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-full pl-11 pr-4 py-2 text-xs text-slate-700 placeholder-slate-400 transition-all shadow-xs outline-none"
          />
        </div>
      </div>

      {/* 3. Right: Functional Controls & Live Mode */}
      <div className="flex items-center gap-3">
        {/* Backend Status Indicator */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border ${
          isBackendConnected
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : 'bg-amber-50 border-amber-200 text-amber-700'
        }`}>
          <span className={`w-2 h-2 rounded-full ${isBackendConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          <span>{isBackendConnected ? 'System Online' : 'Local Replay'}</span>
        </div>

        {/* Replay vs Live Mode Switcher */}
        <div className="flex items-center bg-slate-100 border border-slate-200 rounded-full p-0.5 text-xs font-sans">
          <button
            onClick={() => onModeChange('replay')}
            className={`px-3 py-1 rounded-full transition-all text-xs font-medium ${
              mode === 'replay'
                ? 'bg-white text-slate-900 font-semibold shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Replay
          </button>
          <button
            onClick={() => onModeChange('live')}
            className={`px-3 py-1 rounded-full transition-all text-xs font-medium flex items-center gap-1 ${
              mode === 'live'
                ? 'bg-amber-500 text-white font-semibold shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
            Live Feed
          </button>
        </div>

        {/* Valid Time */}
        <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full text-xs font-mono font-semibold text-slate-700">
          {currentTimeLabel}
        </div>
      </div>
    </header>
  );
};
