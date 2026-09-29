import React from 'react';
import { Radio, RefreshCw, Layers, ShieldCheck, Activity } from 'lucide-react';
import { SystemStatusData } from '../types/weather';

interface TopBarProps {
  systemStatus: SystemStatusData | null;
  mode: 'replay' | 'live' | 'demo';
  onModeChange: (mode: 'replay' | 'live' | 'demo') => void;
  currentTimeLabel: string;
  isBackendConnected: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  systemStatus,
  mode,
  onModeChange,
  currentTimeLabel,
  isBackendConnected
}) => {
  return (
    <header className="h-14 bg-[#111827] border-b border-[#1F293D] px-4 flex items-center justify-between z-30 select-none">
      {/* Left: Branding & Core Identity */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-sky-500/10 border border-sky-500/30 flex items-center justify-center">
            <Activity className="w-4 h-4 text-sky-400" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-base font-bold tracking-wider text-slate-100">FUSE</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-sky-950 text-sky-400 border border-sky-800/60 rounded">
                SIH 26084
              </span>
            </div>
            <span className="text-[10px] font-sans text-slate-400 -mt-0.5 tracking-tight">
              Convective Weather Intelligence (0–6 hr)
            </span>
          </div>
        </div>
      </div>

      {/* Center: Live Sensor Data Feeds Status */}
      <div className="hidden md:flex items-center gap-4 bg-[#0B0F19] px-3.5 py-1.5 rounded border border-[#1F293D] text-xs font-mono">
        <span className="text-slate-400 text-[11px] font-sans uppercase">Data Status:</span>
        
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-slate-200">Radar</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-slate-200">Satellite</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-slate-200">Lightning</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-slate-200">AWS</span>
        </div>
      </div>

      {/* Right: Operational Mode Selector & Clock */}
      <div className="flex items-center gap-3">
        {/* Backend Connectivity Badge */}
        <div className={`hidden lg:flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-mono border ${
          isBackendConnected
            ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-400'
            : 'bg-amber-950/40 border-amber-800/50 text-amber-400'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isBackendConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          <span>{isBackendConnected ? 'BACKEND 8000 OK' : 'OFFLINE DEMO'}</span>
        </div>

        {/* Operational Mode Toggle */}
        <div className="flex items-center bg-[#0B0F19] border border-[#1F293D] rounded p-0.5 text-xs font-mono">
          <button
            onClick={() => onModeChange('replay')}
            className={`px-2.5 py-1 rounded transition-colors ${
              mode === 'replay'
                ? 'bg-[#1E293B] text-sky-400 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            HISTORICAL REPLAY
          </button>
          <button
            onClick={() => onModeChange('live')}
            className={`px-2.5 py-1 rounded transition-colors ${
              mode === 'live'
                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-700/60 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            LIVE OPERATIONAL
          </button>
        </div>

        {/* Timestamp */}
        <div className="bg-[#0B0F19] border border-[#1F293D] px-2.5 py-1 rounded text-xs font-mono font-semibold text-slate-200">
          {currentTimeLabel}
        </div>
      </div>
    </header>
  );
};
