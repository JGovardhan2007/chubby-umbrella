import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Play, Pause, ChevronLeft, ChevronRight, Layers, Sliders, MapPin, Eye, Sparkles, AlertTriangle, ShieldCheck, Flame, Wind, CloudRain } from 'lucide-react';
import maplibregl from 'maplibre-gl';
import { ForecastCategory } from './types';
import { FORECAST_MODELS_DATA } from './ForecastCardGrid';

interface ForecastMapViewerProps {
  category: ForecastCategory;
  onBack: () => void;
}

// 3-Day Forecast Time Steps (3-hourly intervals from 0h to 72h)
const THREE_DAY_TIMESTEPS = [
  { step: 0, day: 'Day 0 (Today)', hour: 0, label: '00:00 UTC', offset: '+0h' },
  { step: 1, day: 'Day 0 (Today)', hour: 3, label: '03:00 UTC', offset: '+3h' },
  { step: 2, day: 'Day 0 (Today)', hour: 6, label: '06:00 UTC', offset: '+6h' },
  { step: 3, day: 'Day 0 (Today)', hour: 9, label: '09:00 UTC', offset: '+9h' },
  { step: 4, day: 'Day 0 (Today)', hour: 12, label: '12:00 UTC', offset: '+12h' },
  { step: 5, day: 'Day 0 (Today)', hour: 15, label: '15:00 UTC', offset: '+15h' },
  { step: 6, day: 'Day 0 (Today)', hour: 18, label: '18:00 UTC', offset: '+18h' },
  { step: 7, day: 'Day 0 (Today)', hour: 21, label: '21:00 UTC', offset: '+21h' },
  { step: 8, day: 'Day +1 (Tomorrow)', hour: 24, label: '00:00 UTC', offset: '+24h' },
  { step: 9, day: 'Day +1 (Tomorrow)', hour: 27, label: '03:00 UTC', offset: '+27h' },
  { step: 10, day: 'Day +1 (Tomorrow)', hour: 30, label: '06:00 UTC', offset: '+30h' },
  { step: 11, day: 'Day +1 (Tomorrow)', hour: 33, label: '09:00 UTC', offset: '+33h' },
  { step: 12, day: 'Day +1 (Tomorrow)', hour: 36, label: '12:00 UTC', offset: '+36h' },
  { step: 13, day: 'Day +1 (Tomorrow)', hour: 42, label: '18:00 UTC', offset: '+42h' },
  { step: 14, day: 'Day +2', hour: 48, label: '00:00 UTC', offset: '+48h' },
  { step: 15, day: 'Day +2', hour: 54, label: '06:00 UTC', offset: '+54h' },
  { step: 16, day: 'Day +2', hour: 60, label: '12:00 UTC', offset: '+60h' },
  { step: 17, day: 'Day +2', hour: 66, label: '18:00 UTC', offset: '+66h' },
  { step: 18, day: 'Day +3', hour: 72, label: '00:00 UTC', offset: '+72h' },
];

export const ForecastMapViewer: React.FC<ForecastMapViewerProps> = ({ category, onBack }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  const [currentStepIndex, setCurrentStepIndex] = useState(4); // Default 12:00 UTC today
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [opacity, setOpacity] = useState(75);

  // Layer switches
  const [showContours, setShowContours] = useState(true);
  const [showSeverePolygons, setShowSeverePolygons] = useState(true);
  const [showWindVectors, setShowWindVectors] = useState(true);
  const [showStations, setShowStations] = useState(true);

  const modelInfo = FORECAST_MODELS_DATA.find((m) => m.id === category) || FORECAST_MODELS_DATA[1];
  const currentTimeStep = THREE_DAY_TIMESTEPS[currentStepIndex];

  // Initialize MapLibre GL map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
          },
        },
        layers: [
          {
            id: 'osm-layer',
            type: 'raster',
            source: 'osm',
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: [80.5, 21.0], // Centered over India
      zoom: 4.8,
      minZoom: 3.5,
      maxZoom: 12,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-left');

    mapRef.current = map;

    return () => {
      map.remove();
    };
  }, []);

  // Auto-play interval loop for 3-Day Forecast
  useEffect(() => {
    if (!isPlaying) return;

    const intervalMs = 2000 / playbackSpeed;
    const timer = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev >= THREE_DAY_TIMESTEPS.length - 1) {
          setIsPlaying(false);
          return 0; // Loop or stop
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed]);

  const handleStepPrev = () => {
    setCurrentStepIndex((prev) => Math.max(0, prev - 1));
  };

  const handleStepNext = () => {
    setCurrentStepIndex((prev) => Math.min(THREE_DAY_TIMESTEPS.length - 1, prev + 1));
  };

  const handleRegionJump = (coords: [number, number], zoom: number) => {
    if (mapRef.current) {
      mapRef.current.flyTo({ center: coords, zoom, essential: true });
    }
  };

  // Color legend scale depending on category
  const renderLegendScale = () => {
    switch (category) {
      case 'thunderstorms':
        return (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-slate-300">
              <span>20 dBZ (Light)</span>
              <span>35 dBZ (CI Core)</span>
              <span>55+ dBZ (Severe)</span>
            </div>
            <div className="h-3 rounded-md bg-gradient-to-r from-cyan-400 via-emerald-400 via-yellow-400 via-orange-500 to-red-600 shadow-inner" />
          </div>
        );
      case 'hailstorms':
        return (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-slate-300">
              <span>POSH 20% (Low)</span>
              <span>50% (Moderate)</span>
              <span>85%+ (Severe Hail)</span>
            </div>
            <div className="h-3 rounded-md bg-gradient-to-r from-blue-300 via-indigo-500 via-purple-600 to-rose-700 shadow-inner" />
          </div>
        );
      case 'cloudbursts':
        return (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-slate-300">
              <span>10 mm/h</span>
              <span>50 mm/h (Heavy)</span>
              <span>100+ mm/h (Cloudburst)</span>
            </div>
            <div className="h-3 rounded-md bg-gradient-to-r from-cyan-300 via-blue-500 via-violet-600 to-fuchsia-700 shadow-inner" />
          </div>
        );
      case 'downbursts':
        return (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-slate-300">
              <span>8 m/s (Breeze)</span>
              <span>18 m/s (Shear Warning)</span>
              <span>28+ m/s (Squall)</span>
            </div>
            <div className="h-3 rounded-md bg-gradient-to-r from-emerald-300 via-teal-500 via-amber-500 to-red-600 shadow-inner" />
          </div>
        );
      default:
        return (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-slate-300">
              <span>270 K (Warm)</span>
              <span>235 K (Cold Cloud)</span>
              <span>205 K (Overshoot)</span>
            </div>
            <div className="h-3 rounded-md bg-gradient-to-r from-slate-400 via-blue-400 via-amber-400 to-red-600 shadow-inner" />
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#0A1A28] text-white select-none relative overflow-hidden">
      {/* 1. Top Header Bar */}
      <div className="h-14 bg-[#102A43] border-b border-blue-400/20 px-4 md:px-6 flex items-center justify-between z-20 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-900/60 hover:bg-blue-800 text-cyan-200 border border-blue-400/30 text-xs font-bold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Map Gallery</span>
          </button>

          <div className="h-5 w-px bg-blue-400/20" />

          <div>
            <h2 className="text-sm md:text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>{modelInfo.title}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {modelInfo.forecastRange}
              </span>
            </h2>
            <p className="text-[11px] text-cyan-200/80 font-medium">
              Source: {modelInfo.sourceModel}
            </p>
          </div>
        </div>

        {/* Current Forecast Horizon Status Badge */}
        <div className="flex items-center gap-3">
          <div className="bg-[#0A1A28] border border-blue-400/30 px-3 py-1 rounded-xl text-right">
            <div className="text-[10px] text-cyan-300 uppercase font-semibold">Forecast Horizon</div>
            <div className="text-xs font-bold text-amber-300 font-mono">
              {currentTimeStep.day} • {currentTimeStep.label} ({currentTimeStep.offset})
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Map Canvas Area + Floating Controls */}
      <div className="flex-1 relative overflow-hidden">
        {/* Map Container */}
        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

        {/* Simulated Dynamic Atmospheric Visualizer Overlay */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{ opacity: opacity / 100 }}
        >
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Severe Threat Contour Heat Area for current time step */}
            {showSeverePolygons && (
              <g className="animate-pulse">
                {/* Cluster over Eastern India */}
                <ellipse
                  cx={70 + Math.sin(currentStepIndex * 0.4) * 4}
                  cy={48 + Math.cos(currentStepIndex * 0.3) * 3}
                  rx={8 + (currentStepIndex % 3)}
                  ry={6 + (currentStepIndex % 4)}
                  fill="rgba(239, 68, 68, 0.35)"
                  stroke="#EF4444"
                  strokeWidth="0.5"
                />
                <circle
                  cx={70 + Math.sin(currentStepIndex * 0.4) * 4}
                  cy={48 + Math.cos(currentStepIndex * 0.3) * 3}
                  r="3.5"
                  fill="rgba(254, 240, 138, 0.7)"
                />

                {/* Secondary Cluster over Foothills or Deccan */}
                <ellipse
                  cx={45 + Math.cos(currentStepIndex * 0.2) * 5}
                  cy={65 + Math.sin(currentStepIndex * 0.3) * 3}
                  rx="7"
                  ry="5"
                  fill="rgba(245, 158, 11, 0.3)"
                  stroke="#F59E0B"
                  strokeWidth="0.5"
                />
              </g>
            )}
          </svg>
        </div>

        {/* Floating Right Control Drawer */}
        <div className="absolute top-4 right-4 w-72 bg-[#0D253A]/90 backdrop-blur-md border border-blue-400/30 rounded-2xl p-4 shadow-2xl z-10 space-y-4">
          <div className="flex items-center justify-between border-b border-blue-400/20 pb-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Layer Controls</span>
            </h4>
            <span className="text-[10px] text-cyan-300 font-mono">3-Day NWP</span>
          </div>

          {/* Layer Checkboxes */}
          <div className="space-y-2 text-xs">
            <label className="flex items-center justify-between cursor-pointer hover:text-cyan-200">
              <span>Severe Risk Contours</span>
              <input
                type="checkbox"
                checked={showSeverePolygons}
                onChange={(e) => setShowSeverePolygons(e.target.checked)}
                className="rounded accent-amber-500"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer hover:text-cyan-200">
              <span>Model Isopleths</span>
              <input
                type="checkbox"
                checked={showContours}
                onChange={(e) => setShowContours(e.target.checked)}
                className="rounded accent-amber-500"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer hover:text-cyan-200">
              <span>Wind Flow Vectors</span>
              <input
                type="checkbox"
                checked={showWindVectors}
                onChange={(e) => setShowWindVectors(e.target.checked)}
                className="rounded accent-amber-500"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer hover:text-cyan-200">
              <span>Synoptic AWS Stations</span>
              <input
                type="checkbox"
                checked={showStations}
                onChange={(e) => setShowStations(e.target.checked)}
                className="rounded accent-amber-500"
              />
            </label>
          </div>

          {/* Opacity Slider */}
          <div className="pt-2 border-t border-blue-400/20">
            <div className="flex items-center justify-between text-xs mb-1 text-slate-300">
              <span>Layer Opacity</span>
              <span className="font-mono text-cyan-300">{opacity}%</span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Legend Bar */}
          <div className="pt-2 border-t border-blue-400/20">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              {modelInfo.unit} Scale
            </span>
            {renderLegendScale()}
          </div>

          {/* Regional Quick Jump */}
          <div className="pt-2 border-t border-blue-400/20">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Regional Focus
            </span>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <button
                onClick={() => handleRegionJump([88.36, 22.57], 6.5)}
                className="px-2 py-1 bg-blue-900/40 hover:bg-blue-800 rounded border border-blue-400/20 text-left truncate"
              >
                Gangetic Plains
              </button>
              <button
                onClick={() => handleRegionJump([77.20, 28.61], 6.5)}
                className="px-2 py-1 bg-blue-900/40 hover:bg-blue-800 rounded border border-blue-400/20 text-left truncate"
              >
                North-West / NCR
              </button>
              <button
                onClick={() => handleRegionJump([80.27, 13.08], 6.5)}
                className="px-2 py-1 bg-blue-900/40 hover:bg-blue-800 rounded border border-blue-400/20 text-left truncate"
              >
                South Peninsula
              </button>
              <button
                onClick={() => handleRegionJump([91.73, 26.14], 6.5)}
                className="px-2 py-1 bg-blue-900/40 hover:bg-blue-800 rounded border border-blue-400/20 text-left truncate"
              >
                North-East
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom 3-Day Forecast Timeline Slider */}
      <div className="bg-[#0B1E30] border-t border-blue-400/20 p-3 md:p-4 z-20 shadow-xl flex flex-col gap-2">
        {/* Playback Controls & Info */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-8 h-8 rounded-lg bg-amber-500 hover:bg-orange-600 text-slate-950 flex items-center justify-center font-bold shadow-md transition-all"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>

            <button
              onClick={handleStepPrev}
              title="Step Backward"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={handleStepNext}
              title="Step Forward"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="ml-2 font-mono text-xs">
              <span className="text-amber-400 font-bold">{currentTimeStep.day}</span>
              <span className="text-slate-400 mx-1.5">•</span>
              <span className="text-white font-bold">{currentTimeStep.label}</span>
              <span className="text-cyan-300 ml-1.5 font-semibold">({currentTimeStep.offset})</span>
            </div>
          </div>

          {/* Speed Selector */}
          <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-lg border border-slate-700">
            <span className="text-[10px] text-slate-400 px-1">Speed:</span>
            {[1, 2, 4].map((spd) => (
              <button
                key={spd}
                onClick={() => setPlaybackSpeed(spd)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  playbackSpeed === spd ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>

        {/* 3-Day Steps Scrubber Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {THREE_DAY_TIMESTEPS.map((step, idx) => {
            const isSelected = idx === currentStepIndex;
            const isDayStart = step.hour === 0;
            return (
              <button
                key={step.step}
                onClick={() => {
                  setCurrentStepIndex(idx);
                  setIsPlaying(false);
                }}
                className={`flex-1 min-w-[50px] py-1.5 px-1 rounded-lg text-center transition-all ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md scale-105'
                    : isDayStart
                    ? 'bg-blue-900/70 border border-cyan-400/50 text-cyan-200 hover:bg-blue-800'
                    : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="text-[9px] uppercase tracking-tighter truncate">
                  {isDayStart ? step.day.replace('Tomorrow ', '').replace('Today ', '') : step.offset}
                </div>
                <div className="text-[10px] font-mono font-bold mt-0.5">{step.label.replace(' UTC', '')}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
