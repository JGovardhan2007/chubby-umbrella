import React from 'react';
import { DraggableWidget } from '../panels/DraggableWidget';

export const MapLegend: React.FC = () => {
  return (
    <DraggableWidget
      id="map-legend"
      title="Radar & Intensity Scale"
      defaultPosition={{ x: 290, y: 55 }}
      defaultWidth={250}
      minWidth={220}
      maxWidth={420}
      collapsible={true}
      isCollapsedDefault={false}
    >
      <div className="text-[11px] font-sans text-slate-700 select-none">
        {/* Radar Reflectivity Scale */}
        <div className="mb-2.5">
          <div className="text-[10px] text-slate-500 mb-1 flex justify-between">
            <span>Reflectivity (dBZ)</span>
            <span className="font-mono text-[9px] font-semibold text-slate-700">20 → 65+</span>
          </div>
          <div className="h-2 rounded-full w-full bg-gradient-to-r from-sky-400 via-green-500 via-yellow-400 via-red-500 to-purple-600 mb-1" />
          <div className="flex justify-between text-[9px] font-mono text-slate-400 font-medium">
            <span>20</span>
            <span>35</span>
            <span>45</span>
            <span>55</span>
            <span>65+</span>
          </div>
        </div>

        {/* Grid of Symbol Keys */}
        <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[10px] pt-1.5 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block shadow-xs" />
            <span className="text-slate-600 truncate">Lightning Flash</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-slate-700 inline-block" />
            <span className="text-slate-600 truncate">Observed Track</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border border-red-500 bg-red-100 inline-block" />
            <span className="text-slate-600 truncate">Storm Core</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-b-2 border-dashed border-amber-500 inline-block" />
            <span className="text-slate-600 truncate">Predicted ETA</span>
          </div>
        </div>
      </div>
    </DraggableWidget>
  );
};
