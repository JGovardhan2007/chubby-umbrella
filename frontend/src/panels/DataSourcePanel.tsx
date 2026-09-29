import React from 'react';
import { SlidersHorizontal, Radio, Database, CheckCircle2 } from 'lucide-react';
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
    <div className="p-4 bg-white border-b border-slate-100 select-none">
      {/* Detail Filters Button (Exact replica from the reference UI) */}
      <button
        className="w-full py-2.5 px-4 rounded-xl border-2 border-amber-500/80 bg-amber-50/50 hover:bg-amber-100/70 text-amber-700 font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.99]"
      >
        <SlidersHorizontal className="w-4 h-4 text-amber-600" />
        <span>Detail Filters</span>
      </button>

      {/* Sensor Ingestion Health Status */}
      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 border border-slate-200/80 rounded-lg px-2.5 py-1.5 font-sans">
        <div className="flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-amber-500" />
          <span className="font-medium text-slate-700">Live Ingestion:</span>
        </div>
        <span className={`font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full ${
          isLive ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
        }`}>
          {isLive ? 'ACTIVE LIVE' : 'SYNTHETIC REPLAY'}
        </span>
      </div>
    </div>
  );
};
