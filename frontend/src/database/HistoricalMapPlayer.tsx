import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Play, Pause, ChevronLeft, ChevronRight, RotateCcw, Layers, Search, Clock, Flame, Wind, CloudRain, Zap, ShieldAlert, Film, Sparkles, Sliders } from 'lucide-react';
import maplibregl from 'maplibre-gl';
import { HistoricalDayRecord, HistoricalLayerType, DiurnalHourFrame } from './types';

interface HistoricalMapPlayerProps {
  dayRecord: HistoricalDayRecord;
  onBack: () => void;
}

// 24 Hourly Diurnal Frames for the selected day (00:00 to 23:00 UTC)
const HOURLY_FRAMES: DiurnalHourFrame[] = Array.from({ length: 24 }, (_, i) => {
  const utcHour = String(i).padStart(2, '0') + ':00 UTC';
  const istHour = String((i + 5) % 24).padStart(2, '0') + ':30 IST';
  // Diurnal afternoon peak between 10:00 UTC and 16:00 UTC
  const diurnalFactor = Math.sin(((i - 4) / 20) * Math.PI);
  const peakIntensity = Math.max(22, Math.round(24 + Math.max(0, diurnalFactor) * 30));
  const flashCount = Math.max(10, Math.round(Math.max(0, diurnalFactor) * 1400));

  return {
    hourIndex: i,
    timeLabel: utcHour,
    timeIst: istHour,
    clusterIntensity: peakIntensity,
    flashCount,
    activeCells: [
      { lat: 22.5 + Math.sin(i * 0.3) * 0.6, lon: 88.3 + (i * 0.15), dbz: peakIntensity, hazard: 'Hail & Squall' },
      { lat: 20.3 + Math.cos(i * 0.25) * 0.5, lon: 85.8 + (i * 0.12), dbz: peakIntensity - 4, hazard: 'Downburst' },
      { lat: 26.1 + Math.sin(i * 0.2) * 0.4, lon: 91.7 + (i * 0.08), dbz: peakIntensity - 2, hazard: 'Cloudburst' },
    ]
  };
});

export const HistoricalMapPlayer: React.FC<HistoricalMapPlayerProps> = ({ dayRecord, onBack }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  const [currentHourIndex, setCurrentHourIndex] = useState(14); // Default 14:00 UTC (afternoon peak)
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(2); // 2x default for snappy video feel
  const [isLooping, setIsLooping] = useState(true);
  const [selectedLayer, setSelectedLayer] = useState<HistoricalLayerType>('radar');
  const [opacity, setOpacity] = useState(80);
  const [layerSearch, setLayerSearch] = useState('');

  const currentFrame = HOURLY_FRAMES[currentHourIndex];

  // Initialize MapLibre GL
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
      center: [82.0, 22.0],
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

  // Video / Slideshow Loop Timer
  useEffect(() => {
    if (!isPlaying) return;

    const intervalMs = 1200 / playbackSpeed;
    const timer = setInterval(() => {
      setCurrentHourIndex((prev) => {
        if (prev >= HOURLY_FRAMES.length - 1) {
          if (isLooping) {
            return 0; // Loop back to 00:00
          } else {
            setIsPlaying(false);
            return prev;
          }
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed, isLooping]);

  const handleStepPrev = () => {
    setCurrentHourIndex((prev) => (prev > 0 ? prev - 1 : HOURLY_FRAMES.length - 1));
  };

  const handleStepNext = () => {
    setCurrentHourIndex((prev) => (prev < HOURLY_FRAMES.length - 1 ? prev + 1 : 0));
  };

  const layersList: { id: HistoricalLayerType; name: string; unit: string; icon: any }[] = [
    { id: 'radar', name: 'Radar Reflectivity (dBZ)', unit: '15-min DWR Mosaic', icon: Flame },
    { id: 'rain', name: 'Precipitation & Rain Rate', unit: 'mm/h Marshall-Palmer', icon: CloudRain },
    { id: 'satellite', name: 'Cloud Cover & Satellite IR', unit: 'INSAT-3DR Brightness Temp', icon: Film },
    { id: 'thunderstorm', name: 'Thunderstorm & Lightning', unit: 'Ground Flash Density', icon: Zap },
    { id: 'hail', name: 'Hail Swaths & POSH', unit: 'MESH Physical Proxy', icon: ShieldAlert },
    { id: 'wind', name: 'Surface Wind Streamlines', unit: 'Radar Radial Velocity Shear', icon: Wind },
  ];

  const filteredLayers = layersList.filter((l) =>
    l.name.toLowerCase().includes(layerSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full w-full bg-[#0A1A28] text-white select-none relative overflow-hidden">
      {/* 1. Header Bar */}
      <div className="h-14 bg-[#0F2231] border-b border-blue-400/20 px-4 md:px-6 flex items-center justify-between z-20 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-900/60 hover:bg-blue-800 text-cyan-200 border border-blue-400/30 text-xs font-bold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to 10-Day Archive</span>
          </button>

          <div className="h-5 w-px bg-blue-400/20" />

          <div>
            <h2 className="text-sm md:text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>{dayRecord.displayDate} ({dayRecord.dayRelative})</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-900/60 text-cyan-300 border border-cyan-700/50">
                24-Hour Diurnal Slideshow
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              {dayRecord.synopticSummary.slice(0, 75)}...
            </p>
          </div>
        </div>

        {/* Current Active Hour Badge */}
        <div className="flex items-center gap-3">
          <div className="bg-[#081520] border border-blue-400/30 px-3 py-1 rounded-xl text-right">
            <div className="text-[10px] text-cyan-300 uppercase font-semibold">Active Snapshot Frame</div>
            <div className="text-xs font-bold text-amber-300 font-mono">
              {currentFrame.timeLabel} • {currentFrame.timeIst} (Frame {currentHourIndex + 1}/24)
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Map Canvas + Right Side Options Drawer */}
      <div className="flex-1 relative overflow-hidden">
        {/* Map Container */}
        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

        {/* Dynamic Storm Clusters & Swaths for the active hour */}
        <div
          className="absolute inset-0 pointer-events-none transition-all duration-300"
          style={{ opacity: opacity / 100 }}
        >
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Primary convective core tracking eastwards with hour progression */}
            <g>
              {/* Eastern convective cell cluster */}
              <ellipse
                cx={68 + (currentHourIndex * 0.4)}
                cy={45 + Math.sin(currentHourIndex * 0.3) * 4}
                rx={5 + Math.min(10, currentFrame.clusterIntensity / 5)}
                ry={4 + Math.min(8, currentFrame.clusterIntensity / 6)}
                fill={selectedLayer === 'rain' ? 'rgba(37, 99, 235, 0.45)' : 'rgba(239, 68, 68, 0.45)'}
                stroke={selectedLayer === 'rain' ? '#3B82F6' : '#EF4444'}
                strokeWidth="0.6"
              />
              <circle
                cx={68 + (currentHourIndex * 0.4)}
                cy={45 + Math.sin(currentHourIndex * 0.3) * 4}
                r="3"
                fill="#FEF08A"
              />

              {/* Secondary cluster over Peninsula */}
              {currentHourIndex >= 8 && currentHourIndex <= 18 && (
                <ellipse
                  cx={48 + (currentHourIndex * 0.2)}
                  cy={72 - Math.cos(currentHourIndex * 0.25) * 3}
                  rx="6"
                  ry="5"
                  fill="rgba(245, 158, 11, 0.4)"
                  stroke="#F59E0B"
                  strokeWidth="0.5"
                />
              )}
            </g>
          </svg>
        </div>

        {/* Right Side Options & Variable Selection Drawer */}
        <div className="absolute top-4 right-4 w-76 bg-[#0D253A]/90 backdrop-blur-md border border-blue-400/30 rounded-2xl p-4 shadow-2xl z-10 space-y-4">
          <div className="flex items-center justify-between border-b border-blue-400/20 pb-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Select Weather Variable</span>
            </h4>
            <span className="text-[10px] text-cyan-300 font-mono">10-Day DB</span>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter wind, rain, hailstorm..."
              value={layerSearch}
              onChange={(e) => setLayerSearch(e.target.value)}
              className="w-full bg-[#081726] border border-slate-700 focus:border-cyan-400 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 outline-none"
            />
          </div>

          {/* Variable Selection Radio List */}
          <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
            {filteredLayers.map((l) => {
              const Icon = l.icon;
              const isSelected = selectedLayer === l.id;
              return (
                <div
                  key={l.id}
                  onClick={() => setSelectedLayer(l.id)}
                  className={`p-2 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-blue-600/30 border-cyan-400 text-white shadow-xs'
                      : 'bg-[#0B1E30]/70 border-slate-700/60 text-slate-300 hover:bg-[#0B1E30]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-cyan-300' : 'text-slate-400'}`} />
                    <div>
                      <div className="text-xs font-bold leading-tight">{l.name}</div>
                      <div className="text-[10px] text-slate-400">{l.unit}</div>
                    </div>
                  </div>
                  {isSelected && <span className="text-cyan-300 text-xs font-bold">✓</span>}
                </div>
              );
            })}
          </div>

          {/* Opacity Control */}
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

          {/* Active Frame Hour Diagnostics */}
          <div className="pt-2 border-t border-blue-400/20 bg-[#081520] p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Hour {currentHourIndex}:00 Diagnostics
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-slate-400">Peak Core:</span>
                <span className="font-bold text-amber-400 ml-1">{currentFrame.clusterIntensity} dBZ</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400">Flashes:</span>
                <span className="font-bold text-yellow-300 ml-1">{currentFrame.flashCount}/hr</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom 24-Hour Diurnal Slideshow & Video Player Bar */}
      <div className="bg-[#0B1E30] border-t border-blue-400/20 p-3 md:p-4 z-20 shadow-2xl flex flex-col gap-2">
        {/* Playback Controls & Frame Info */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-8 h-8 rounded-lg bg-amber-500 hover:bg-orange-600 text-slate-950 flex items-center justify-center font-bold shadow-md transition-all"
              title={isPlaying ? 'Pause Slideshow' : 'Play Video Slideshow'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5 fill-current" />}
            </button>

            <button
              onClick={handleStepPrev}
              title="Previous Hour"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={handleStepNext}
              title="Next Hour"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setCurrentHourIndex(0)}
              title="Reset to 00:00 UTC"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <div className="ml-2 font-mono text-xs">
              <span className="text-amber-400 font-bold">{currentFrame.timeLabel}</span>
              <span className="text-slate-400 mx-1.5">•</span>
              <span className="text-white font-bold">{currentFrame.timeIst}</span>
              <span className="text-cyan-300 ml-2 font-semibold text-[11px]">(Frame {currentHourIndex + 1} of 24)</span>
            </div>
          </div>

          {/* Speed & Loop Toggles */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsLooping(!isLooping)}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                isLooping ? 'bg-cyan-900/60 text-cyan-300 border border-cyan-500/40' : 'text-slate-500 bg-slate-800'
              }`}
            >
              {isLooping ? '🔁 Loop On' : 'Loop Off'}
            </button>

            <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-lg border border-slate-700">
              <span className="text-[10px] text-slate-400 px-1">Speed:</span>
              {[1, 2, 4, 8].map((spd) => (
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
        </div>

        {/* 24-Hour Diurnal Scrubber Bar */}
        <div className="flex items-center gap-1 overflow-x-auto py-1">
          {HOURLY_FRAMES.map((frame, idx) => {
            const isSelected = idx === currentHourIndex;
            const isPeak = idx >= 11 && idx <= 16;
            return (
              <button
                key={frame.hourIndex}
                onClick={() => {
                  setCurrentHourIndex(idx);
                  setIsPlaying(false);
                }}
                className={`flex-1 min-w-[42px] py-1.5 px-0.5 rounded-lg text-center transition-all ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md scale-105'
                    : isPeak
                    ? 'bg-red-950/40 border border-red-500/40 text-red-200 hover:bg-red-900/60'
                    : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="text-[9px] font-mono leading-none">{String(frame.hourIndex).padStart(2, '0')}Z</div>
                <div className="text-[8px] text-slate-500 mt-0.5 leading-none">{frame.timeIst.slice(0, 2)}h</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
