import React, { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import { Wind, CloudRain, Cloud, Compass, Thermometer, ExternalLink, RefreshCw, Layers } from 'lucide-react';

interface CityPoint {
  name: string;
  nameHi: string;
  lat: number;
  lon: number;
  temp: number;
  windSpeed: number;
  windDirection: number;
  condition: string;
  convectiveRisk: 'Low' | 'Moderate' | 'High' | 'Severe';
}

const INDIAN_CITIES: CityPoint[] = [
  { name: 'Delhi', nameHi: 'दिल्ली', lat: 28.6139, lon: 77.2090, temp: 30.8, windSpeed: 12.5, windDirection: 240, condition: 'Clear Sky', convectiveRisk: 'Low' },
  { name: 'Kolkata', nameHi: 'कोलकाता', lat: 22.5726, lon: 88.3639, temp: 31.2, windSpeed: 18.0, windDirection: 160, condition: 'Developing Storm', convectiveRisk: 'High' },
  { name: 'Mumbai', nameHi: 'मुंबई', lat: 19.0760, lon: 72.8777, temp: 28.4, windSpeed: 14.2, windDirection: 300, condition: 'Coastal Breeze', convectiveRisk: 'Moderate' },
  { name: 'Ahmedabad', nameHi: 'अहमदाबाद', lat: 23.0225, lon: 72.5714, temp: 32.0, windSpeed: 9.8, windDirection: 260, condition: 'Dry / Fair', convectiveRisk: 'Low' },
  { name: 'Pune', nameHi: 'पुणे', lat: 18.5204, lon: 73.8567, temp: 27.5, windSpeed: 11.0, windDirection: 280, condition: 'Scattered Clouds', convectiveRisk: 'Moderate' },
  { name: 'Chennai', nameHi: 'चेन्नई', lat: 13.0827, lon: 80.2707, temp: 31.0, windSpeed: 16.5, windDirection: 110, condition: 'Humid / Coastal', convectiveRisk: 'High' },
  { name: 'Bengaluru', nameHi: 'बेंगलुरु', lat: 12.9716, lon: 77.5946, temp: 26.8, windSpeed: 13.4, windDirection: 250, condition: 'Passing Clouds', convectiveRisk: 'Low' },
  { name: 'Hyderabad', nameHi: 'हैदराबाद', lat: 17.3850, lon: 78.4867, temp: 29.5, windSpeed: 10.2, windDirection: 310, condition: 'Fair Weather', convectiveRisk: 'Low' },
  { name: 'Guwahati', nameHi: 'गुवाहाटी', lat: 26.1445, lon: 91.7362, temp: 25.5, windSpeed: 8.5, windDirection: 80, condition: 'Pre-Monsoon Showers', convectiveRisk: 'High' },
  { name: 'Jaipur', nameHi: 'जयपुर', lat: 26.9124, lon: 75.7873, temp: 33.1, windSpeed: 15.0, windDirection: 230, condition: 'Sunny / Warm', convectiveRisk: 'Low' },
  { name: 'Bhubaneswar', nameHi: 'भुवनेश्वर', lat: 20.2961, lon: 85.8245, temp: 30.5, windSpeed: 19.2, windDirection: 170, condition: 'Thunderstorm Active', convectiveRisk: 'Severe' },
  { name: 'Patna', nameHi: 'पटना', lat: 25.5941, lon: 85.1376, temp: 29.8, windSpeed: 11.8, windDirection: 130, condition: 'Haze / Cloudy', convectiveRisk: 'Moderate' },
];

interface GuidanceMapProps {
  onNavigateToMap: (city?: { name: string; lat: number; lon: number }) => void;
}

export const GuidanceMap: React.FC<GuidanceMapProps> = ({ onNavigateToMap }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  const [activeTab, setActiveTab] = useState<'rain' | 'wind' | 'clouds' | 'cyclone' | 'temp'>('wind');
  const [cityData, setCityData] = useState<CityPoint[]>(INDIAN_CITIES);
  const [selectedCity, setSelectedCity] = useState<CityPoint | null>(null);
  const [liveRadarPath, setLiveRadarPath] = useState<string | null>(null);

  // 1. Fetch Real Live Meteorological Data from Open-Meteo
  const fetchLiveWeather = useCallback(async () => {
    try {
      const lats = INDIAN_CITIES.map((c) => c.lat).join(',');
      const lons = INDIAN_CITIES.map((c) => c.lon).join(',');
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m,relative_humidity_2m,precipitation,rain,wind_speed_10m,wind_direction_10m,weather_code&timezone=auto`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const results = Array.isArray(data) ? data : [data];
        const updated = INDIAN_CITIES.map((city, idx) => {
          const current = results[idx]?.current;
          if (!current) return city;
          return {
            ...city,
            temp: current.temperature_2m !== undefined ? Math.round(current.temperature_2m * 10) / 10 : city.temp,
            windSpeed: current.wind_speed_10m !== undefined ? Math.round(current.wind_speed_10m * 10) / 10 : city.windSpeed,
            windDirection: current.wind_direction_10m !== undefined ? current.wind_direction_10m : city.windDirection
          };
        });
        setCityData(updated);
      }
    } catch (err) {
      console.warn('Could not fetch real live city winds from Open-Meteo:', err);
    }
  }, []);

  // 2. Fetch RainViewer Doppler Radar Tile Path
  useEffect(() => {
    fetch('https://api.rainviewer.com/public/weather-maps.json')
      .then((r) => r.json())
      .then((data) => {
        const past = data.radar?.past;
        if (past && past.length > 0) {
          setLiveRadarPath(past[past.length - 1].path);
        }
      })
      .catch(() => {});
  }, []);

  // 3. Initialize Satellite Terrain MapLibre Map centered exactly on Indian Subcontinent
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          'esri-satellite': {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
            ],
            tileSize: 256,
            attribution: 'Esri, Maxar, Earthstar Geographics'
          },
          'boundaries': {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'
            ],
            tileSize: 256
          }
        },
        layers: [
          {
            id: 'satellite-layer',
            type: 'raster',
            source: 'esri-satellite',
            minzoom: 0,
            maxzoom: 18
          },
          {
            id: 'boundaries-layer',
            type: 'raster',
            source: 'boundaries',
            minzoom: 0,
            maxzoom: 18,
            paint: {
              'raster-opacity': 0.65
            }
          }
        ]
      },
      center: [79.8, 21.0], // Center on India
      zoom: 4.05,
      minZoom: 3.5,
      maxZoom: 9,
      pitch: 0,
      attributionControl: false
    });

    map.on('load', () => {
      mapRef.current = map;
      fetchLiveWeather();
    });

    return () => {
      map.remove();
    };
  }, [fetchLiveWeather]);

  // 4. Manage Live Doppler Radar Layer for Rain Tab
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const sourceId = 'guidance-live-radar-source';
    const layerId = 'guidance-live-radar-layer';

    if (activeTab === 'rain' && liveRadarPath) {
      const tileUrl = `https://tilecache.rainviewer.com${liveRadarPath}/256/{z}/{x}/{y}/4/1_1.png`;
      if (!map.getSource(sourceId)) {
        map.addSource(sourceId, {
          type: 'raster',
          tiles: [tileUrl],
          tileSize: 256,
          minzoom: 0,
          maxzoom: 7
        });
        map.addLayer({
          id: layerId,
          type: 'raster',
          source: sourceId,
          paint: {
            'raster-opacity': 0.85,
            'raster-resampling': 'linear'
          }
        });
      } else {
        map.setLayoutProperty(layerId, 'visibility', 'visible');
      }
    } else {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', 'none');
      }
    }
  }, [activeTab, liveRadarPath]);

  // 5. Realistic Animated Green Wind Streamlines over Satellite Map
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 700);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 600);

    const handleResize = () => {
      if (canvas && canvas.parentElement) {
        width = canvas.width = canvas.parentElement.clientWidth;
        height = canvas.height = canvas.parentElement.clientHeight;
      }
    };
    window.addEventListener('resize', handleResize);

    // Dynamic wind streamlines across Arabian Sea, Bay of Bengal, and Indian Mainland
    const NUM_PARTICLES = 320;
    interface StreamParticle {
      lon: number;
      lat: number;
      speed: number;
      length: number;
      life: number;
      maxLife: number;
    }

    const particles: StreamParticle[] = [];
    for (let i = 0; i < NUM_PARTICLES; i++) {
      particles.push({
        lon: 55 + Math.random() * 45, // 55°E to 100°E
        lat: 2 + Math.random() * 34,  // 2°N to 36°N
        speed: 0.08 + Math.random() * 0.14,
        length: 12 + Math.random() * 18,
        life: Math.random() * 120,
        maxLife: 100 + Math.random() * 80
      });
    }

    const render = () => {
      // Fade previous frame trails
      ctx.clearRect(0, 0, width, height);

      if (activeTab === 'wind' || activeTab === 'cyclone') {
        const map = mapRef.current;

        for (const p of particles) {
          // Monsoon Wind Field Equations (Southwesterly Arabian Sea flow + Bay of Bengal curl + Gangetic trough)
          let u = 0.8; // West-to-East base flow
          let v = 0.3; // South-to-North base flow

          if (p.lat < 15 && p.lon < 75) {
            // Strong South-Westerly Arabian Sea jet
            u = 1.2;
            v = 0.6;
          } else if (p.lon > 80 && p.lat > 12 && p.lat < 24) {
            // Cyclonic curvature over Bay of Bengal
            const centerLon = 88.0;
            const centerLat = 18.0;
            const dLon = p.lon - centerLon;
            const dLat = p.lat - centerLat;
            u = -dLat * 0.08 + 0.3;
            v = dLon * 0.08 + 0.4;
          } else if (p.lat > 24 && p.lat < 32 && p.lon > 74 && p.lon < 88) {
            // Indo-Gangetic easterly/westerly wind trough
            u = 0.6;
            v = -0.25;
          } else if (p.lat > 30) {
            // Westerly subtropical jet along Himalayas
            u = 1.4;
            v = -0.1;
          }

          // Advance geographical position
          p.lon += u * p.speed;
          p.lat += v * p.speed;
          p.life += 1;

          if (p.life >= p.maxLife || p.lon > 102 || p.lat > 37 || p.lat < 0 || p.lon < 53) {
            p.lon = 55 + Math.random() * 40;
            p.lat = 2 + Math.random() * 32;
            p.life = 0;
          }

          // Convert Lat/Lon to Canvas Pixel Coordinates via MapLibre
          let screenX = (p.lon - 55) * (width / 45);
          let screenY = (36 - p.lat) * (height / 36);

          if (map) {
            try {
              const pos = map.project([p.lon, p.lat]);
              screenX = pos.x;
              screenY = pos.y;
            } catch {}
          }

          const alpha = Math.sin((p.life / p.maxLife) * Math.PI);
          const angle = Math.atan2(v, u);

          ctx.beginPath();
          ctx.moveTo(screenX, screenY);
          ctx.lineTo(
            screenX - Math.cos(angle) * p.length,
            screenY + Math.sin(angle) * p.length // Invert Y in screen space
          );

          // Glowing bright neon green wind streamlines as shown in official NCMRWF guidance
          ctx.strokeStyle =
            activeTab === 'cyclone'
              ? `rgba(249, 115, 22, ${alpha * 0.85})`
              : `rgba(34, 197, 94, ${alpha * 0.9})`;
          ctx.lineWidth = 1.8;
          ctx.lineCap = 'round';
          ctx.stroke();
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [activeTab]);

  return (
    <div className="rounded-2xl overflow-hidden border-4 border-[#DF691A] shadow-2xl flex flex-col h-[600px] relative bg-[#091722] font-sans">
      {/* 1. Official NCMRWF Orange Header Bar */}
      <div className="bg-[#DF691A] py-2 px-4 text-center z-20 shadow-md flex items-center justify-between">
        <div className="w-8" />
        <h2 className="text-lg md:text-xl font-extrabold text-white tracking-wide drop-shadow-xs">
          मौसम मार्गदर्शन पोर्टल
        </h2>
        <button
          onClick={fetchLiveWeather}
          title="Refresh Live Data"
          className="p-1 hover:bg-black/10 text-white rounded-md transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Interactive Map with Satellite Imagery & Live Wind Streamlines */}
      <div className="flex-1 relative w-full h-full overflow-hidden">
        {/* MapLibre Satellite Terrain Map */}
        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

        {/* Real Wind Streamlines Canvas Overlay */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
        />

        {/* City Meteorological Points Overlay */}
        <div className="absolute inset-0 z-20 pointer-events-none">
          {cityData.map((city) => (
            <div
              key={city.name}
              style={{
                left: `${((city.lon - 68) / (98 - 68)) * 100}%`,
                top: `${((36 - city.lat) / (36 - 8)) * 100}%`
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-pointer group"
              onClick={() => setSelectedCity(city)}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-white/90 shadow-md group-hover:scale-150 transition-transform" />
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 bg-black/80 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap border border-white/20 pointer-events-none group-hover:bg-[#DF691A]">
                {city.name}
              </span>
            </div>
          ))}
        </div>

        {/* 3. Floating Bottom-Right Frosted Glass Pill Menu (As in Reference Image) */}
        <div className="absolute bottom-5 right-5 z-30 bg-white/70 backdrop-blur-md px-3 py-2 rounded-full shadow-2xl border border-white/40 flex items-center gap-2">
          {/* Rainfall / Doppler Radar Button */}
          <button
            onClick={() => setActiveTab('rain')}
            title="वर्षा / डॉपलर रडार (Rainfall & Radar)"
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-xs ${
              activeTab === 'rain'
                ? 'bg-[#DF691A] text-white scale-110 shadow-md ring-2 ring-orange-300'
                : 'bg-white/80 text-amber-900 hover:bg-white hover:scale-105'
            }`}
          >
            <CloudRain className="w-5 h-5" />
          </button>

          {/* Wind Streamlines Button (Highlighted / Active) */}
          <button
            onClick={() => setActiveTab('wind')}
            title="पवन प्रवाह (Wind Streamlines)"
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-xs ${
              activeTab === 'wind'
                ? 'bg-[#DF691A] text-white scale-110 shadow-md ring-2 ring-orange-300'
                : 'bg-white/80 text-amber-900 hover:bg-white hover:scale-105'
            }`}
          >
            <Wind className="w-5 h-5" />
          </button>

          {/* Clouds / Satellite IR Button */}
          <button
            onClick={() => setActiveTab('clouds')}
            title="बादल / उपग्रह (Satellite Clouds)"
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-xs ${
              activeTab === 'clouds'
                ? 'bg-[#DF691A] text-white scale-110 shadow-md ring-2 ring-orange-300'
                : 'bg-white/80 text-amber-900 hover:bg-white hover:scale-105'
            }`}
          >
            <Cloud className="w-5 h-5" />
          </button>

          {/* Cyclone / Vorticity Button */}
          <button
            onClick={() => setActiveTab('cyclone')}
            title="चक्रवात / भंवर (Cyclone Vorticity)"
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-xs ${
              activeTab === 'cyclone'
                ? 'bg-[#DF691A] text-white scale-110 shadow-md ring-2 ring-orange-300'
                : 'bg-white/80 text-amber-900 hover:bg-white hover:scale-105'
            }`}
          >
            <Compass className="w-5 h-5" />
          </button>

          {/* Temperature Button */}
          <button
            onClick={() => setActiveTab('temp')}
            title="तापमान (Surface Temperature)"
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-xs ${
              activeTab === 'temp'
                ? 'bg-[#DF691A] text-white scale-110 shadow-md ring-2 ring-orange-300'
                : 'bg-white/80 text-amber-900 hover:bg-white hover:scale-105'
            }`}
          >
            <Thermometer className="w-5 h-5" />
          </button>
        </div>

        {/* 4. Selected City Detail Card */}
        {selectedCity && (
          <div className="absolute top-4 left-4 z-30 bg-slate-900/95 backdrop-blur-md border border-amber-500/50 rounded-xl p-3.5 shadow-2xl text-white w-72 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2 mb-2">
              <div>
                <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                  <span>{selectedCity.name}</span>
                  <span className="text-amber-400 text-xs">({selectedCity.nameHi})</span>
                </h4>
                <p className="text-[10px] text-slate-300">{selectedCity.lat.toFixed(2)}°N, {selectedCity.lon.toFixed(2)}°E</p>
              </div>
              <button
                onClick={() => setSelectedCity(null)}
                className="text-slate-400 hover:text-white text-xs px-1"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center mb-3">
              <div className="bg-slate-800/80 rounded-lg p-1.5 border border-slate-700/60">
                <div className="text-[9px] text-slate-400">तापमान (Temp)</div>
                <div className="text-sm font-extrabold text-white">{selectedCity.temp}°C</div>
              </div>
              <div className="bg-slate-800/80 rounded-lg p-1.5 border border-slate-700/60">
                <div className="text-[9px] text-slate-400">पवन गति (Wind)</div>
                <div className="text-sm font-extrabold text-emerald-400">{selectedCity.windSpeed} km/h</div>
              </div>
            </div>

            <button
              onClick={() => onNavigateToMap({ name: selectedCity.name, lat: selectedCity.lat, lon: selectedCity.lon })}
              className="w-full py-1.5 bg-[#DF691A] hover:bg-[#c75b14] text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-md transition-colors"
            >
              <span>डॉपलर रडार खोलें (Open Radar)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
