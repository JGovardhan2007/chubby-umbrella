import React from 'react';
import { Cpu } from 'lucide-react';

/**
 * Phase 3 Component Architecture Placeholder: SIH 26081
 * Ready for AI-NWP multi-model forecast comparison & adaptive blending.
 */
export const ModelComparison: React.FC = () => {
  return (
    <div className="bg-[#111827] border border-[#1F293D] rounded p-3 text-xs text-slate-400">
      <div className="flex items-center gap-1.5 font-semibold text-slate-300 mb-2">
        <Cpu className="w-3.5 h-3.5 text-sky-400" />
        <span>Phase 3: Multi-Model Blend (SIH 26081)</span>
      </div>
      <p className="text-[11px] text-slate-400">
        Architecture ready to blend NWP (WRF/GFS) with Deep Convective Neural Models.
      </p>
    </div>
  );
};
