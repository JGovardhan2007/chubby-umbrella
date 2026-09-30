import React, { useEffect, useRef, useState } from 'react';
import { Layers, Wind, Eye, ZoomIn, Navigation, ArrowUpRight, Flame, ShieldAlert, Sparkles } from 'lucide-react';

interface CityPoint {
  name: string;
  lat: number;
  lon: number;
  x: number; // percentage coordinates on India map SVG box [0..100]
  y: number;
  temp: number;
  condition: string;
  convectiveRisk: 'Low' | 'Moderate' | 'High' | 'Severe';
  radarDbz: number;
}

const INDIA_CITIES: CityPoint[] = [
  { name: 'Delhi', lat: 28.6139, lon: 77.2090, x: 40, y: 28, temp: 30.8, condition: 'Clear Sky', convectiveRisk: 'Low', radarDbz: 18 },
  { name: 'Kolkata', lat: 22.5726, lon: 88.3639, x: 74, y: 46, temp: 31.0, condition: 'Severe Thunderstorm', convectiveRisk: 'Severe', radarDbz: 52 },
  { name: 'Mumbai', lat: 19.0760, lon: 72.8777, x: 26, y: 56, temp: 26.0, condition: 'Smoke Fog', convectiveRisk: 'Low', radarDbz: 12 },
  { name: 'Ahmedabad', lat: 23.0225, lon: 72.5714, x: 25, y: 44, temp: 29.0, condition: 'Smoke Fog', convectiveRisk: 'Moderate', radarDbz: 28 },
  { name: 'Pune', lat: 18.5204, lon: 73.8567, x: 30, y: 59, temp: 28.6, condition: 'Cloudy Sky', convectiveRisk: 'Moderate', radarDbz: 32 },
  { name: 'Chennai', lat: 13.0827, lon: 80.2707, x: 50, y: 77, temp: 31.4, condition: 'Developing Convection', convectiveRisk: 'High', radarDbz: 44 },
  { name: 'Bengaluru', lat: 12.9716, lon: 77.5946, x: 42, y: 78, temp: 27.2, condition: 'Scattered Showers', convectiveRisk: 'Moderate', radarDbz: 34 },
  { name: 'Hyderabad', lat: 17.3850, lon: 78.4867, x: 45, y: 62, temp: 29.5, condition: 'Isolated Cells', convectiveRisk: 'High', radarDbz: 41 },
  { name: 'Guwahati', lat: 26.1445, lon: 91.7362, x: 88, y: 35, temp: 26.4, condition: 'Cloudburst Warning', convectiveRisk: 'Severe', radarDbz: 56 },
  { name: 'Jaipur', lat: 26.9124, lon: 75.7873, x: 35, y: 34, temp: 32.1, condition: 'Sunny / Dry', convectiveRisk: 'Low', radarDbz: 10 },
  { name: 'Bhubaneswar', lat: 20.2961, lon: 85.8245, x: 67, y: 53, temp: 30.2, condition: 'Thunderstorm Active', convectiveRisk: 'High', radarDbz: 48 },
];

interface GuidanceMapProps {
  onNavigateToMap: (city?: { name: string; lat: number; lon: number }) => void;
}

export const GuidanceMap: React.FC<GuidanceMapProps> = ({ onNavigateToMap }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeLayer, setActiveLayer] = useState<'wind' | 'radar'>('wind');
  const [selectedCity, setSelectedCity] = useState<CityPoint | null>(null);

  // Animated wind streamlines simulation on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const width = (canvas.width = canvas.parentElement?.clientWidth || 600);
    const height = (canvas.height = canvas.parentElement?.clientHeight || 520);

    // Particle pool for realistic wind streamlines across Indian subcontinent
    const NUM_PARTICLES = 160;
    interface Particle {
      x: number;
      y: number;
      speed: number;
      length: number;
      life: number;
      maxLife: number;
    }

    const particles: Particle[] = [];
    for (let i = 0; i < NUM_PARTICLES; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        speed: 1.2 + Math.random() * 2.0,
        length: 8 + Math.random() * 14,
        life: Math.random() * 100,
        maxLife: 80 + Math.random() * 60,
      });
    }

    const render = () => {
      // Semi-transparent fade for motion trail
      ctx.fillStyle = 'rgba(8, 28, 44, 0.18)';
      ctx.fillRect(0, 0, width, height);

      // Draw wind stream particles with Monsoon / Bay of Bengal cyclonic curved flow
      for (const p of particles) {
        const normalizedX = p.x / width;
        const normalizedY = p.y / height;

        // Flow field vector calculations: southwesterly drift turning cyclonic over east
        const dx = 1.0;
        let dy = -0.35 + Math.sin(normalizedX * Math.PI) * 0.45;
        if (normalizedX > 0.6 && normalizedY > 0.35 && normalizedY < 0.75) {
          // Cyclonic rotation over Bay of Bengal
          const cx = width * 0.72;
          const cy = height * 0.55;
          const angleToCenter = Math.atan2(p.y - cy, p.x - cx);
          dy += Math.cos(angleToCenter) * 0.8;
        }

        const angle = Math.atan2(dy, dx);
        p.x += Math.cos(angle) * p.speed;
        p.y += Math.sin(angle) * p.speed;
        p.life += 1;

        if (p.life >= p.maxLife || p.x > width + 20 || p.y < -20 || p.y > height + 20) {
          p.x = Math.random() * width * 0.6 - 30;
          p.y = height * 0.3 + Math.random() * (height * 0.7);
          p.life = 0;
        }

        // Draw glowing wind vector tail
        const alpha = Math.sin((p.life / p.maxLife) * Math.PI);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - Math.cos(angle) * p.length, p.y - Math.sin(angle) * p.length);
        ctx.strokeStyle =
          activeLayer === 'radar'
            ? `rgba(234, 88, 12, ${alpha * 0.75})`
            : `rgba(52, 211, 153, ${alpha * 0.85})`; // Bright emerald wind stream as in NCMRWF
        ctx.lineWidth = 1.6;
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [activeLayer]);

  return (
    <div className="bg-[#122B3E] rounded-2xl overflow-hidden border border-slate-700/60 shadow-xl flex flex-col h-[560px] relative text-white">
      {/* 1. Header Bar: NCMRWF Weather Guidance Portal */}
      <div className="bg-gradient-to-r from-[#DF691A] to-[#B85210] px-4 py-2.5 flex items-center justify-between z-20 shadow-md">
        <div className="flex items-center gap-2">
          <Wind className="w-5 h-5 text-white" />
          <div>
            <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
              <span>Weather Guidance Portal</span>
              <span className="text-xs font-normal text-amber-100 hidden sm:inline">
                | Convective Weather Forecast
              </span>
            </h3>
            <p className="text-[10px] text-amber-100 font-medium">
              Convective Weather Forecast & Flow Informatics
            </p>
          </div>
        </div>

        {/* Layer Controls */}
        <div className="flex items-center gap-1 bg-black/25 p-1 rounded-lg border border-white/10 text-xs">
          <button
            onClick={() => setActiveLayer('wind')}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all flex items-center gap-1 ${
              activeLayer === 'wind'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-amber-100 hover:text-white'
            }`}
          >
            <Wind className="w-3 h-3" />
            <span>Wind Flow</span>
          </button>
          <button
            onClick={() => setActiveLayer('radar')}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all flex items-center gap-1 ${
              activeLayer === 'radar'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-amber-100 hover:text-white'
            }`}
          >
            <Flame className="w-3 h-3" />
            <span>Reflectivity (Radar)</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive Map Container with Canvas Streamlines & SVG Coastline */}
      <div className="flex-1 relative overflow-hidden bg-[#0A1A27]">
        {/* Canvas for animated particle flow */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-10" />

        {/* Map Subcontinent Base Graphic & Convective Hotspot Polygons */}
        <div className="absolute inset-0 z-5 pointer-events-none opacity-85">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Topographic Land Mass Representation (India / South Asia outline) */}
            <path
              d="M 35 15 L 45 14 L 55 18 L 60 22 L 72 26 L 85 28 L 92 36 L 85 45 L 75 42 L 70 50 L 68 56 L 55 75 L 50 88 L 47 80 L 38 72 L 28 65 L 24 55 L 20 48 L 22 38 L 30 30 Z"
              fill="#1B384D"
              stroke="#2E5A7B"
              strokeWidth="0.8"
            />
            {/* Sri Lanka */}
            <ellipse cx="54" cy="92" rx="2" ry="3.5" fill="#1B384D" stroke="#2E5A7B" strokeWidth="0.6" />

            {/* Radar Severe Echo Blob Over Bengal / Odisha */}
            {activeLayer === 'radar' && (
              <g className="animate-pulse">
                <circle cx="72" cy="48" r="8" fill="rgba(239, 68, 68, 0.45)" />
                <circle cx="72" cy="48" r="5" fill="rgba(220, 38, 38, 0.7)" />
                <circle cx="72" cy="48" r="2.5" fill="rgba(254, 240, 138, 0.9)" />
                <circle cx="48" cy="74" r="6" fill="rgba(245, 158, 11, 0.4)" />
                <circle cx="86" cy="36" r="7" fill="rgba(220, 38, 38, 0.5)" />
              </g>
            )}

            {/* Graticule grid lines */}
            <line x1="10" y1="30" x2="90" y2="30" stroke="rgba(255,255,255,0.06)" strokeDasharray="1,2" />
            <line x1="10" y1="60" x2="90" y2="60" stroke="rgba(255,255,255,0.06)" strokeDasharray="1,2" />
            <line x1="40" y1="10" x2="40" y2="90" stroke="rgba(255,255,255,0.06)" strokeDasharray="1,2" />
            <line x1="70" y1="10" x2="70" y2="90" stroke="rgba(255,255,255,0.06)" strokeDasharray="1,2" />
          </svg>
        </div>

        {/* 3. Interactive City Pins */}
        <div className="absolute inset-0 z-20">
          {INDIA_CITIES.map((city) => {
            const isHighRisk = city.convectiveRisk === 'Severe' || city.convectiveRisk === 'High';
            return (
              <div
                key={city.name}
                style={{ left: `${city.x}%`, top: `${city.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                onClick={() => setSelectedCity(city)}
              >
                {/* Ping animation for active storms */}
                {isHighRisk && (
                  <span className="absolute -inset-1.5 rounded-full bg-red-500/50 animate-ping" />
                )}
                {/* Pin Dot */}
                <div
                  className={`w-3.5 h-3.5 rounded-full border-2 border-white shadow-lg flex items-center justify-center transition-transform group-hover:scale-125 ${
                    city.convectiveRisk === 'Severe'
                      ? 'bg-red-600 ring-2 ring-red-400'
                      : city.convectiveRisk === 'High'
                      ? 'bg-amber-500 ring-2 ring-amber-300'
                      : 'bg-emerald-500'
                  }`}
                />

                {/* City Label Badge */}
                <div className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/75 backdrop-blur-xs px-1.5 py-0.5 rounded text-[10px] font-bold text-white whitespace-nowrap border border-white/10 group-hover:bg-amber-600 transition-colors pointer-events-none">
                  {city.name}
                  {isHighRisk && <span className="text-red-400 ml-1">⚡</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* 4. Active Selected City Card Popover */}
        {selectedCity && (
          <div className="absolute bottom-4 left-4 right-4 md:right-auto md:w-80 bg-[#0F2231]/95 backdrop-blur-md border border-amber-500/40 rounded-xl p-3.5 shadow-2xl z-30 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2 mb-2">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>{selectedCity.name}</span>
                </h4>
                <div className="text-[10px] text-slate-400">
                  {selectedCity.lat.toFixed(2)}°N, {selectedCity.lon.toFixed(2)}°E • Synoptic Station
                </div>
              </div>
              <button
                onClick={() => setSelectedCity(null)}
                className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded hover:bg-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
              <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700">
                <div className="text-[10px] text-slate-400">Current Temp</div>
                <div className="text-base font-bold text-amber-400">{selectedCity.temp}°C</div>
                <div className="text-[10px] text-slate-300 truncate">{selectedCity.condition}</div>
              </div>
              <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700">
                <div className="text-[10px] text-slate-400">Radar & Convective Risk</div>
                <div
                  className={`text-xs font-bold mt-0.5 ${
                    selectedCity.convectiveRisk === 'Severe'
                      ? 'text-red-400'
                      : selectedCity.convectiveRisk === 'High'
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {selectedCity.convectiveRisk} ({selectedCity.radarDbz} dBZ)
                </div>
                <div className="text-[10px] text-slate-400">0–6h Nowcast Ready</div>
              </div>
            </div>

            <button
              onClick={() => onNavigateToMap({ name: selectedCity.name, lat: selectedCity.lat, lon: selectedCity.lon })}
              className="w-full py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 shadow-md transition-all"
            >
              <span>View 0–6h Nowcast on Live GIS Map</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* 3. Bottom Footer Bar: Quick Switch to Map */}
      <div className="bg-[#0A1A27] px-4 py-2.5 border-t border-slate-700/60 flex items-center justify-between text-xs z-20">
        <div className="flex items-center gap-2 text-[11px] text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Live Convective Winds & Radar Reflectivity Stream</span>
        </div>

        <button
          onClick={() => onNavigateToMap()}
          className="flex items-center gap-1 px-3 py-1 bg-[#DF691A] hover:bg-orange-600 text-white font-bold rounded-lg transition-all text-xs shadow-xs"
        >
          <span>Open Nowcast Map</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
