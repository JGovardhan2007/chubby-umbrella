import React from 'react';

export const MapLegend: React.FC = () => {
  return (
    <div className="absolute bottom-4 right-4 bg-[#111827]/95 backdrop-blur-sm border border-[#1F293D] rounded-md p-3 text-[11px] font-sans text-slate-300 shadow-xl z-10 w-64 select-none">
      <div className="font-mono text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 border-b border-[#1F293D] pb-1 flex justify-between items-center">
        <span>MAP INTENSITY LEGEND</span>
        <span className="text-[9px] text-sky-400 font-normal">SIH 26084</span>
      </div>

      {/* Radar Reflectivity Scale */}
      <div className="mb-2.5">
        <div className="text-[10px] text-slate-400 mb-1 flex justify-between">
          <span>Radar Reflectivity (dBZ)</span>
          <span className="font-mono text-[9px]">20 → 65+</span>
        </div>
        <div className="h-2 rounded-sm w-full bg-gradient-to-r from-sky-400 via-green-500 via-yellow-400 via-red-500 to-purple-600 mb-1" />
        <div className="flex justify-between text-[9px] font-mono text-slate-400">
          <span>20</span>
          <span>35</span>
          <span>45</span>
          <span>55</span>
          <span>65+</span>
        </div>
      </div>

      {/* Grid of Symbol Keys */}
      <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[10px] pt-1.5 border-t border-[#1F293D]/80">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block shadow-sm" />
          <span>Lightning Flash</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-white inline-block" />
          <span>Observed Track</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full border border-red-500 bg-red-500/30 inline-block" />
          <span>Storm Core</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 border-b border-dashed border-sky-400 inline-block" />
          <span>Predicted Track</span>
        </div>

        <div className="flex items-center gap-1.5 col-span-2">
          <span className="w-2.5 h-2.5 bg-amber-500/30 border border-amber-500/60 rounded-sm inline-block" />
          <span>Uncertainty Cone (&plusmn;6 km/hr dispersion)</span>
        </div>
      </div>
    </div>
  );
};
