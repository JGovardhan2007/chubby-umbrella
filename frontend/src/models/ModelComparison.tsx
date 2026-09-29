import React from 'react';
import { Cpu } from 'lucide-react';

/**
 * Phase 3 Component Architecture Placeholder: SIH 26081
 * Ready for AI-NWP multi-model forecast comparison & adaptive blending.
 */
export const ModelComparison: React.FC = () => {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600">
      <div className="flex items-center gap-1.5 font-semibold text-slate-800 mb-1.5">
        <Cpu className="w-3.5 h-3.5 text-amber-500" />
        <span>Hybrid AI–NWP Forecast Blend</span>
      </div>
      <p className="text-[11px] text-slate-500 leading-relaxed">
        Multi-model ensemble blending physics-based NWP (WRF/GFS) with convective neural nowcasting models.
      </p>
    </div>
  );
};
