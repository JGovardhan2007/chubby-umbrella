import React from 'react';
import { Database, Radio, CheckCircle, AlertTriangle } from 'lucide-react';
import { SystemStatusData } from '../types/weather';

interface DataSourcePanelProps {
  systemStatus: SystemStatusData | null;
  mode: 'replay' | 'live' | 'demo';
}

export const DataSourcePanel: React.FC<DataSourcePanelProps> = ({
  systemStatus,
  mode
}) => {
  const isLive = mode === 'live';

  return (
    <div className="bg-[#111827] border-b border-[#1F293D] p-3 text-xs select-none">
      {/* Header & Source Mode Badge */}
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-sky-400" />
          DATA SOURCES
        </span>
        
        {/* Explicit Mandatory Label: REPLAY DATA vs LIVE */}
        <span className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
          isLive
            ? 'bg-emerald-950/80 border-emerald-700/80 text-emerald-400'
            : 'bg-amber-950/80 border-amber-700/80 text-amber-400'
        }`}>
          {isLive ? 'LIVE OPERATIONAL' : 'REPLAY DATA'}
        </span>
      </div>

      {/* Sources List */}
      <div className="space-y-1.5 text-[11px]">
        <div className="flex items-center justify-between bg-[#0B0F19] px-2 py-1.5 rounded border border-[#1F293D]/60">
          <span className="text-slate-300 font-medium">Radar (DWR)</span>
          <span className="flex items-center gap-1 text-emerald-400 font-mono text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Available
          </span>
        </div>

        <div className="flex items-center justify-between bg-[#0B0F19] px-2 py-1.5 rounded border border-[#1F293D]/60">
          <span className="text-slate-300 font-medium">Satellite (INSAT-3D)</span>
          <span className="flex items-center gap-1 text-emerald-400 font-mono text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Available
          </span>
        </div>

        <div className="flex items-center justify-between bg-[#0B0F19] px-2 py-1.5 rounded border border-[#1F293D]/60">
          <span className="text-slate-300 font-medium">Lightning (LLN)</span>
          <span className="flex items-center gap-1 text-emerald-400 font-mono text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Available
          </span>
        </div>

        <div className="flex items-center justify-between bg-[#0B0F19] px-2 py-1.5 rounded border border-[#1F293D]/60">
          <span className="text-slate-300 font-medium">Surface AWS</span>
          <span className="flex items-center gap-1 text-emerald-400 font-mono text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Available
          </span>
        </div>
      </div>
    </div>
  );
};
