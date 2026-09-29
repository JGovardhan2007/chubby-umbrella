import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bookmark,
  ExternalLink,
  Compass,
  Globe,
  ArrowRight,
  Zap,
  CloudRain,
  GripHorizontal,
  ChevronUp,
  ChevronDown,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { StormCell } from '../types/storm';

import { formatStormName, formatStormType } from '../utils/formatters';

interface ConvectiveCardsProps {
  storms: StormCell[];
  selectedStorm: StormCell | null;
  onSelectStorm: (storm: StormCell) => void;
}

export const ConvectiveCards: React.FC<ConvectiveCardsProps> = ({
  storms,
  selectedStorm,
  onSelectStorm
}) => {
  // Height state for panel resizing (min: 44px collapsed, default: 210px, max: 480px)
  const [panelHeight, setPanelHeight] = useState<number>(210);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const dragStartYRef = useRef<number>(0);
  const dragStartHeightRef = useRef<number>(210);

  // Handle Drag Start
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartYRef.current = e.clientY;
    dragStartHeightRef.current = isCollapsed ? 44 : panelHeight;
  }, [panelHeight, isCollapsed]);

  // Handle Global Mouse Move and Mouse Up
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaY = dragStartYRef.current - e.clientY;
      const newHeight = Math.min(480, Math.max(44, dragStartHeightRef.current + deltaY));

      if (newHeight <= 60) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
        setPanelHeight(newHeight);
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging]);

  const toggleCollapse = () => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setPanelHeight(Math.max(180, panelHeight));
    } else {
      setIsCollapsed(true);
    }
  };

  const displayStorms = storms.length > 0 ? storms.slice(0, 3) : [
    {
      storm_id: 'Cell #01 (Supercell)',
      intensity: 54.2,
      centroid_lat: 13.12,
      centroid_lon: 80.18,
      speed_kmh: 38.5,
      heading_deg: 72,
      area_km2: 420,
      growth_rate_km2_hr: 45,
      convective_stage: 'Mature' as const,
      confidence: 0.94,
      indicators: { max_lightning_density: 0.85, min_bt_k: 215, composite_hazard_index: 0.88 }
    },
    {
      storm_id: 'Cell #02 (Multicell)',
      intensity: 46.8,
      centroid_lat: 12.98,
      centroid_lon: 79.85,
      speed_kmh: 29.0,
      heading_deg: 65,
      area_km2: 260,
      growth_rate_km2_hr: 20,
      convective_stage: 'Developing' as const,
      confidence: 0.88,
      indicators: { max_lightning_density: 0.42, min_bt_k: 228, composite_hazard_index: 0.65 }
    },
    {
      storm_id: 'Cell #03 (Squall Line)',
      intensity: 51.0,
      centroid_lat: 13.45,
      centroid_lon: 80.05,
      speed_kmh: 44.0,
      heading_deg: 85,
      area_km2: 380,
      growth_rate_km2_hr: -10,
      convective_stage: 'Mature' as const,
      confidence: 0.91,
      indicators: { max_lightning_density: 0.68, min_bt_k: 220, composite_hazard_index: 0.79 }
    }
  ];

  const crestColors = [
    { bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-600', icon: '⚡' },
    { bg: 'bg-teal-100', border: 'border-teal-300', text: 'text-teal-600', icon: '🌀' },
    { bg: 'bg-indigo-100', border: 'border-indigo-300', text: 'text-indigo-600', icon: '⛈️' }
  ];

  const locationLabels = [
    'Ennore Port & North Chennai Sector',
    'Sriperumbudur & Kanchipuram Belt',
    'Tirupati Corridor & Sriharikota'
  ];

  return (
    <div
      style={{ height: isCollapsed ? 44 : `${panelHeight}px` }}
      className={`relative bg-white/95 backdrop-blur-md border-t border-slate-200 select-none z-20 flex flex-col transition-all duration-150 ease-out shadow-lg shrink-0 ${
        isDragging ? 'transition-none ring-2 ring-amber-400/50' : ''
      }`}
    >
      {/* 1. INTERACTIVE PANEL RESIZER BAR (Top Drag Handle) */}
      <div
        onMouseDown={handleMouseDown}
        onDoubleClick={toggleCollapse}
        title="Drag up or down to resize panel • Double-click to collapse/expand"
        className="w-full h-3 -top-1.5 absolute left-0 right-0 cursor-row-resize flex items-center justify-center group z-30"
      >
        <div className="w-16 h-1 rounded-full bg-slate-300 group-hover:bg-amber-500 group-hover:h-1.5 transition-all shadow-xs flex items-center justify-center">
          <div className="w-2.5 h-0.5 bg-white/70 rounded-full" />
        </div>
      </div>

      {/* 2. HEADER ROW WITH COLLAPSE / EXPAND TOGGLES */}
      <div className="px-6 py-2 flex items-center justify-between border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-bold text-slate-900 font-sans tracking-tight">
            Active Convective Cells
          </span>
          <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
            {storms.length || 3} Active
          </span>
          <span className="text-[10px] text-slate-400 hidden sm:inline">
            (Drag divider to pull up/down)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleCollapse}
            title={isCollapsed ? "Expand panel" : "Pull down / collapse panel"}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors flex items-center gap-1 text-xs font-semibold"
          >
            {isCollapsed ? (
              <>
                <ChevronUp className="w-4 h-4 text-amber-600" />
                <span className="text-[11px] text-amber-700 font-bold">Pull Up</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 text-slate-500" />
                <span className="text-[11px] text-slate-600">Pull Down</span>
              </>
            )}
          </button>

          <button className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors ml-1">
            <span>See more</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3. SCROLLABLE CARDS CONTENT AREA */}
      {!isCollapsed && (
        <div className="px-6 py-2.5 overflow-y-auto flex-1 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {displayStorms.map((storm, idx) => {
              const isSelected = selectedStorm?.storm_id === storm.storm_id;
              const crest = crestColors[idx % crestColors.length];
              const location = locationLabels[idx % locationLabels.length];

              return (
                <div
                  key={storm.storm_id}
                  onClick={() => onSelectStorm(storm as StormCell)}
                  className={`rounded-xl bg-white border p-3 shadow-xs hover:shadow-md transition-all cursor-pointer ${
                    isSelected
                      ? 'border-amber-500 ring-2 ring-amber-500/20'
                      : 'border-slate-200/90 hover:border-slate-300'
                  }`}
                >
                  {/* Card Top: Crest Badge, Title, Bookmark/External icons */}
                  <div className="flex items-start justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full ${crest.bg} border ${crest.border} flex items-center justify-center text-xs shadow-xs shrink-0`}>
                        {crest.icon}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 leading-tight">
                          {formatStormName(storm.storm_id, idx)}
                          <span className="text-[11px] font-normal text-slate-500 ml-1.5">
                            ({formatStormType(storm.intensity, storm.convective_stage)})
                          </span>
                        </h4>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          📍 {location}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5 text-slate-400">
                      <button className="p-1 hover:text-slate-600 rounded">
                        <Bookmark className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1 hover:text-slate-600 rounded">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Card Middle: Stats & Metrics */}
                  <div className="flex items-center gap-3 text-[10px] text-slate-500 my-1.5 font-sans">
                    <div className="flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-500" />
                      <span>{Math.round((storm.indicators.max_lightning_density || 0.5) * 600)} strikes/min</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CloudRain className="w-3 h-3 text-blue-500" />
                      <span>{storm.intensity.toFixed(0)} dBZ Core</span>
                    </div>
                  </div>

                  {/* Card Bottom: Action Buttons with Orange Icons */}
                  <div className="flex items-center gap-4 pt-1.5 border-t border-slate-100 text-[11px] font-semibold text-slate-700">
                    <div className="flex items-center gap-1 text-amber-600 hover:text-amber-700">
                      <Compass className="w-3.5 h-3.5 text-amber-500" />
                      <span>Direction</span>
                    </div>
                    <div className="flex items-center gap-1 text-amber-600 hover:text-amber-700">
                      <Globe className="w-3.5 h-3.5 text-amber-500" />
                      <span>Radar Feed</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
