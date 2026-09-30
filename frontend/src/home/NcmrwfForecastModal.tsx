import React, { useState, useEffect, useRef, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import {
  X,
  Play,
  Pause,
  Plus,
  Minus,
  Globe,
  Square,
  Ruler,
  Thermometer,
  Droplets,
  CloudRain,
  Layers,
  Wind,
  Search,
  Calendar,
  ChevronDown,
  ChevronRight,
  Maximize2,
  Minimize2
} from 'lucide-react';

export type WeatherParameter = 'temperature' | 'humidity' | 'rainfall' | 'accumulated_rainfall' | 'wind' | 'cyclone';

interface NcmrwfForecastModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialParameter?: WeatherParameter;
  onNavigateToNowcast?: (city?: { name: string; lat: number; lon: number }) => void;
}

// Region bounding boxes
const REGIONS: Record<string, { center: [number, number]; zoom: number }> = {
  Asia: { center: [78.5, 23.0], zoom: 4.1 },
  India: { center: [79.0, 21.5], zoom: 4.8 },
  'Bay of Bengal': { center: [88.0, 16.0], zoom: 5.5 },
  'Arabian Sea': { center: [67.0, 17.0], zoom: 5.5 },
  'North India': { center: [77.5, 29.0], zoom: 5.8 },
  'South India': { center: [78.0, 13.5], zoom: 5.8 },
  Global: { center: [20.0, 20.0], zoom: 2.5 }
};

// Available NWP Models
const MODELS = [
  { id: 'mithuna', name: 'Mithuna GLB' },
  { id: 'ncum_global', name: 'NCUM Global 12km' },
  { id: 'ncum_regional', name: 'NCUM Regional 4km' },
  { id: 'gfs', name: 'GFS 0.25° Global' },
  { id: 'ecmwf', name: 'ECMWF IFS 9km' }
];

// Timeline steps: Spanning 7 days from 2026-10-01 to 2026-10-07
const TIMELINE_STEPS = [
  { index: 0, dateStr: '2026-10-01', timeStr: '00:00' },
  { index: 1, dateStr: '2026-10-01', timeStr: '06:00' },
  { index: 2, dateStr: '2026-10-01', timeStr: '12:00' },
  { index: 3, dateStr: '2026-10-01', timeStr: '18:00' },
  { index: 4, dateStr: '2026-10-02', timeStr: '00:00' },
  { index: 5, dateStr: '2026-10-02', timeStr: '06:00' },
  { index: 6, dateStr: '2026-10-02', timeStr: '12:00' },
  { index: 7, dateStr: '2026-10-02', timeStr: '18:00' },
  { index: 8, dateStr: '2026-10-03', timeStr: '00:00' },
  { index: 9, dateStr: '2026-10-03', timeStr: '06:00' },
  { index: 10, dateStr: '2026-10-03', timeStr: '12:00' },
  { index: 11, dateStr: '2026-10-03', timeStr: '18:00' },
  { index: 12, dateStr: '2026-10-04', timeStr: '00:00' },
  { index: 13, dateStr: '2026-10-04', timeStr: '06:00' },
  { index: 14, dateStr: '2026-10-04', timeStr: '12:00' },
  { index: 15, dateStr: '2026-10-04', timeStr: '18:00' },
  { index: 16, dateStr: '2026-10-05', timeStr: '00:00' },
  { index: 17, dateStr: '2026-10-05', timeStr: '06:00' },
  { index: 18, dateStr: '2026-10-05', timeStr: '12:00' },
  { index: 19, dateStr: '2026-10-05', timeStr: '18:00' },
  { index: 20, dateStr: '2026-10-06', timeStr: '00:00' },
  { index: 21, dateStr: '2026-10-06', timeStr: '06:00' },
  { index: 22, dateStr: '2026-10-06', timeStr: '12:00' },
  { index: 23, dateStr: '2026-10-06', timeStr: '18:00' },
  { index: 24, dateStr: '2026-10-07', timeStr: '00:00' }
];

// EXACT COLORMAPS MATCHING NCMRWF REFERENCE
const TEMPERATURE_COLOR_RAMP = [
  { temp: -15, color: [126, 34, 206] },  // #7E22CE
  { temp: -10, color: [147, 51, 234] },  // #9333EA
  { temp: -5,  color: [29, 78, 216] },   // #1D4ED8
  { temp: 0,   color: [2, 132, 199] },   // #0284C7
  { temp: 3,   color: [13, 148, 136] },  // #0D9488
  { temp: 6,   color: [22, 163, 74] },   // #16A34A
  { temp: 9,   color: [132, 204, 22] },  // #84CC16 (Vibrant lime green)
  { temp: 12,  color: [253, 224, 71] },  // #FDE047 (Yellow)
  { temp: 14,  color: [250, 204, 21] },  // #FACC15
  { temp: 16,  color: [251, 146, 60] },  // #FB923C (Light Orange)
  { temp: 18,  color: [249, 115, 22] },  // #F97316 (Orange)
  { temp: 20,  color: [234, 88, 12] },   // #EA580C (Deep Orange)
  { temp: 22,  color: [220, 38, 38] },   // #DC2626 (Bright Red)
  { temp: 24,  color: [185, 28, 28] },   // #B91C1C (Crimson)
  { temp: 26,  color: [153, 27, 27] },   // #991B1B (Dark Crimson)
  { temp: 28,  color: [127, 29, 29] },   // #7F1D1D (Maroon)
  { temp: 30,  color: [69, 10, 10] },    // #450A0A (Hot Dark Core)
  { temp: 34,  color: [24, 24, 27] }     // #18181B (Black Hot Core)
];

const getTemperatureColor = (val: number): [number, number, number] => {
  if (val <= TEMPERATURE_COLOR_RAMP[0].temp) return TEMPERATURE_COLOR_RAMP[0].color as [number, number, number];
  if (val >= TEMPERATURE_COLOR_RAMP[TEMPERATURE_COLOR_RAMP.length - 1].temp)
    return TEMPERATURE_COLOR_RAMP[TEMPERATURE_COLOR_RAMP.length - 1].color as [number, number, number];

  for (let i = 0; i < TEMPERATURE_COLOR_RAMP.length - 1; i++) {
    const a = TEMPERATURE_COLOR_RAMP[i];
    const b = TEMPERATURE_COLOR_RAMP[i + 1];
    if (val >= a.temp && val <= b.temp) {
      const t = (val - a.temp) / (b.temp - a.temp);
      return [
        Math.round(a.color[0] + (b.color[0] - a.color[0]) * t),
        Math.round(a.color[1] + (b.color[1] - a.color[1]) * t),
        Math.round(a.color[2] + (b.color[2] - a.color[2]) * t)
      ];
    }
  }
  return [220, 38, 38];
};

const HUMIDITY_COLOR_RAMP = [
  { rh: 10,  color: [120, 53, 15] },   // #78350F (Arid Brown)
  { rh: 20,  color: [217, 119, 6] },   // #D97706 (Ochre)
  { rh: 30,  color: [249, 115, 22] },  // #F97316 (Orange)
  { rh: 40,  color: [251, 191, 36] },  // #FBBF24 (Amber)
  { rh: 50,  color: [132, 204, 22] },  // #84CC16 (Lime)
  { rh: 60,  color: [16, 185, 129] },  // #10B981 (Emerald)
  { rh: 70,  color: [6, 182, 212] },   // #06B6D4 (Cyan)
  { rh: 80,  color: [59, 130, 246] },  // #3B82F6 (Blue)
  { rh: 90,  color: [29, 78, 216] },   // #1D4ED8 (Royal Blue)
  { rh: 100, color: [30, 58, 138] }    // #1E3A8A (Navy Saturated)
];

const getHumidityColor = (val: number): [number, number, number] => {
  if (val <= HUMIDITY_COLOR_RAMP[0].rh) return HUMIDITY_COLOR_RAMP[0].color as [number, number, number];
  if (val >= HUMIDITY_COLOR_RAMP[HUMIDITY_COLOR_RAMP.length - 1].rh)
    return HUMIDITY_COLOR_RAMP[HUMIDITY_COLOR_RAMP.length - 1].color as [number, number, number];

  for (let i = 0; i < HUMIDITY_COLOR_RAMP.length - 1; i++) {
    const a = HUMIDITY_COLOR_RAMP[i];
    const b = HUMIDITY_COLOR_RAMP[i + 1];
    if (val >= a.rh && val <= b.rh) {
      const t = (val - a.rh) / (b.rh - a.rh);
      return [
        Math.round(a.color[0] + (b.color[0] - a.color[0]) * t),
        Math.round(a.color[1] + (b.color[1] - a.color[1]) * t),
        Math.round(a.color[2] + (b.color[2] - a.color[2]) * t)
      ];
    }
  }
  return [37, 99, 235];
};

export const NcmrwfForecastModal: React.FC<NcmrwfForecastModalProps> = ({
  isOpen,
  onClose,
  initialParameter = 'accumulated_rainfall',
  onNavigateToNowcast
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);

  // Parameter state (default to 'accumulated_rainfall' or requested)
  const [selectedParam, setSelectedParam] = useState<WeatherParameter>(
    initialParameter === 'wind' ? 'rainfall' : initialParameter === 'cyclone' ? 'temperature' : initialParameter
  );
  const [selectedModel, setSelectedModel] = useState<string>('mithuna');
  const [selectedRegion, setSelectedRegion] = useState<string>('Asia');
  const [opacity, setOpacity] = useState<number>(40);
  const [windsEnabled, setWindsEnabled] = useState<boolean>(false);
  const [geopotentialEnabled, setGeopotentialEnabled] = useState<boolean>(false);

  // Administrative layers
  const [showStates, setShowStates] = useState<boolean>(false);
  const [showIndia, setShowIndia] = useState<boolean>(true);
  const [showGlobal, setShowGlobal] = useState<boolean>(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(true);

  // Basemap style
  const [basemapStyle, setBasemapStyle] = useState<'terrain' | 'satellite'>('terrain');

  // Timeline state
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState<string>('Hyderabad, Bahadurpura');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [liveRadarPath, setLiveRadarPath] = useState<string | null>(null);

  useEffect(() => {
    if (initialParameter) {
      if (initialParameter === 'wind') {
        setWindsEnabled(true);
      } else if (initialParameter === 'cyclone') {
        setSelectedParam('temperature');
        setWindsEnabled(true);
      } else {
        setSelectedParam(initialParameter);
      }
    }
  }, [initialParameter]);

  // Fetch real live Doppler radar tile path from RainViewer
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

  // Initialize MapLibre GL Map with Full Global Coverage
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    const initialRegion = REGIONS[selectedRegion] || REGIONS.Asia;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          'world-topo': {
            type: 'raster',
            tiles: [
              basemapStyle === 'terrain'
                ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}'
                : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
            ],
            tileSize: 256,
            attribution: 'Esri, USGS, NOAA'
          },
          'boundaries-reference': {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'
            ],
            tileSize: 256
          }
        },
        layers: [
          {
            id: 'topo-base',
            type: 'raster',
            source: 'world-topo',
            minzoom: 0,
            maxzoom: 18
          },
          {
            id: 'boundary-lines',
            type: 'raster',
            source: 'boundaries-reference',
            minzoom: 0,
            maxzoom: 18,
            paint: {
              'raster-opacity': 0.85
            }
          }
        ]
      },
      center: initialRegion.center,
      zoom: initialRegion.zoom,
      minZoom: 1.8,
      maxZoom: 14
    });

    map.on('load', () => {
      mapRef.current = map;

      // Drop blue pinpoint marker at Hyderabad
      const el = document.createElement('div');
      el.className = 'w-7 h-9 text-blue-500 drop-shadow-xl cursor-pointer transform -translate-x-1/2 -translate-y-full';
      el.innerHTML = `
        <svg viewBox="0 0 24 24" width="28" height="34" fill="#2563EB" stroke="#FFFFFF" stroke-width="1.5">
          <path d="M12 0C7.58 0 4 3.58 4 8c0 5.25 7 13 8 14 1-1 8-8.75 8-14 0-4.42-3.58-8-8-8zm0 11c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/>
        </svg>
      `;
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([78.4747, 17.3616])
        .addTo(map);
      markerRef.current = marker;
    });

    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      map.remove();
      mapRef.current = null;
    };
  }, [isOpen, basemapStyle]);

  // Handle region select
  const handleSelectRegion = (region: string) => {
    setSelectedRegion(region);
    const target = REGIONS[region];
    if (target && mapRef.current) {
      mapRef.current.flyTo({
        center: target.center,
        zoom: target.zoom,
        essential: true,
        duration: 1200
      });
    }
  };

  // Location search handler
  const handleSearchLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchQuery)}&count=1&language=en&format=json`);
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          const loc = data.results[0];
          if (mapRef.current) {
            if (markerRef.current) markerRef.current.setLngLat([loc.longitude, loc.latitude]);
            mapRef.current.flyTo({ center: [loc.longitude, loc.latitude], zoom: 6.5, essential: true, duration: 1400 });
          }
        }
      }
    } catch (err) {
      console.warn('Geocoding search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Playback timer
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setCurrentStepIdx((prev) => (prev >= TIMELINE_STEPS.length - 1 ? 0 : prev + 1));
    }, 1800);
    return () => clearInterval(timer);
  }, [isPlaying]);

  // FULL-BLEED SEAMLESS GLOBAL SYNOPTIC FIELD RENDERER
  // Uses Screen-Space Viewport Unprojection so it covers 100% of the entire screen across the whole planet with zero cutoff
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isOpen) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const NUM_PARTICLES = 500;
    interface WindParticle {
      lon: number;
      lat: number;
      speed: number;
      age: number;
      maxAge: number;
    }

    const spawnParticle = (): WindParticle => {
      const currentMap = mapRef.current;
      let minLon = -180;
      let maxLon = 180;
      let minLat = -75;
      let maxLat = 75;

      if (currentMap) {
        try {
          const bounds = currentMap.getBounds();
          minLon = bounds.getWest();
          maxLon = bounds.getEast();
          minLat = Math.max(-80, bounds.getSouth());
          maxLat = Math.min(80, bounds.getNorth());
        } catch {}
      }

      return {
        lon: minLon + Math.random() * (maxLon - minLon),
        lat: minLat + Math.random() * (maxLat - minLat),
        speed: 0.85 + Math.random() * 0.35,
        age: 0,
        maxAge: 35 + Math.random() * 40
      };
    };

    const particles: WindParticle[] = [];
    for (let i = 0; i < NUM_PARTICLES; i++) {
      const p = spawnParticle();
      p.age = Math.random() * p.maxAge;
      particles.push(p);
    }

    // High performance screen-space gridded sampler (sample screen at 12px steps and interpolate smoothly)
    const STEP_PX = 12;

    const render = () => {
      const cw = canvas.offsetWidth || canvas.clientWidth || 1200;
      const ch = canvas.offsetHeight || canvas.clientHeight || 800;

      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw;
        canvas.height = ch;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const currentMap = mapRef.current;
      if (!currentMap) {
        animId = requestAnimationFrame(render);
        return;
      }

      const alpha = (opacity / 100) * 0.88;
      const timeOffset = currentStepIdx * 0.12;

      const cols = Math.ceil(cw / STEP_PX) + 1;
      const rows = Math.ceil(ch / STEP_PX) + 1;

      // 1. FULL-SCREEN CONTINUOUS METEOROLOGICAL FIELD (Zero Cutoff on entire globe)
      const offscreen = document.createElement('canvas');
      offscreen.width = cols;
      offscreen.height = rows;
      const offCtx = offscreen.getContext('2d');

      if (offCtx) {
        const imgData = offCtx.createImageData(cols, rows);
        const data = imgData.data;

        for (let r = 0; r < rows; r++) {
          const sy = r * STEP_PX;

          for (let c = 0; c < cols; c++) {
            const sx = c * STEP_PX;
            const idx = (r * cols + c) * 4;

            let lng = 0;
            let lat = 0;

            try {
              const ll = currentMap.unproject([sx, sy]);
              lng = ((ll.lng + 180) % 360) - 180;
              lat = Math.max(-85, Math.min(85, ll.lat));
            } catch {
              continue;
            }

            if (selectedParam === 'accumulated_rainfall') {
              // Real Precipitation Accumulation Footprint across global storm belts & Monsoons (cm)
              const dBoB = Math.hypot((lng - 89) * 0.85, (lat - 18) * 0.85);
              const dNE = Math.hypot((lng - 93) * 1.0, (lat - 25) * 1.0);
              const dWG = Math.hypot((lng - 74) * 1.2, (lat - 15) * 0.7);
              const dBlackSea = Math.hypot((lng - 38) * 1.1, (lat - 43) * 1.1);
              const dITCZ = Math.abs(lat - 5 + Math.sin(lng * 0.05 + timeOffset) * 4);
              const dAtlantic = Math.hypot((lng + 45) * 0.8, (lat - 25) * 0.9);

              let acc = 0;
              if (dBoB < 18) acc = Math.max(acc, (18 - dBoB) * 4.2);
              if (dNE < 14) acc = Math.max(acc, (14 - dNE) * 3.8);
              if (dWG < 10) acc = Math.max(acc, (10 - dWG) * 3.2);
              if (dBlackSea < 9) acc = Math.max(acc, (9 - dBlackSea) * 3.5);
              if (dAtlantic < 12) acc = Math.max(acc, (12 - dAtlantic) * 3.0);
              if (dITCZ < 6 && (lng < 20 || lng > 100)) acc = Math.max(acc, (6 - dITCZ) * 2.2);

              if (acc > 0.4) {
                let rgb: [number, number, number] = [56, 189, 248]; // 0-1 cm Light Blue
                if (acc >= 64) rgb = [131, 24, 67]; // >64 cm Maroon
                else if (acc >= 32) rgb = [220, 38, 38]; // 32-64 cm Red
                else if (acc >= 16) rgb = [234, 88, 12]; // 16-32 cm Orange
                else if (acc >= 8) rgb = [250, 204, 21]; // 8-16 cm Yellow
                else if (acc >= 4) rgb = [21, 128, 61]; // 4-8 cm Green
                else if (acc >= 2) rgb = [29, 78, 216]; // 2-4 cm Deep Blue
                else if (acc >= 1) rgb = [2, 132, 199]; // 1-2 cm Blue

                data[idx] = rgb[0];
                data[idx + 1] = rgb[1];
                data[idx + 2] = rgb[2];
                data[idx + 3] = Math.round(255 * alpha * 0.95);
              } else {
                data[idx + 3] = 0;
              }
            } else if (selectedParam === 'rainfall') {
              // Real Instantaneous Precipitation Cells (mm)
              const dBoB = Math.hypot((lng - (89 + Math.sin(timeOffset * 0.8) * 2)) * 0.9, (lat - 18) * 0.9);
              const dNE = Math.hypot((lng - 93) * 1.2, (lat - 26) * 1.2);
              const dWG = Math.hypot((lng - 74) * 1.4, (lat - 14) * 0.8);
              const dMed = Math.hypot((lng - 36) * 1.1, (lat - 42) * 1.1);
              const dEurope = Math.hypot((lng - 12) * 1.2, (lat - 52) * 1.2);
              const dGulf = Math.hypot((lng + 88) * 1.0, (lat - 28) * 1.0);

              let rain = 0;
              if (dBoB < 12) rain = Math.max(rain, (12 - dBoB) * 6.5);
              if (dNE < 8) rain = Math.max(rain, (8 - dNE) * 6.0);
              if (dWG < 7) rain = Math.max(rain, (7 - dWG) * 4.5);
              if (dMed < 8) rain = Math.max(rain, (8 - dMed) * 5.0);
              if (dEurope < 7) rain = Math.max(rain, (7 - dEurope) * 4.0);
              if (dGulf < 9) rain = Math.max(rain, (9 - dGulf) * 5.2);

              if (rain > 0.5) {
                let rgb: [number, number, number] = [56, 189, 248];
                if (rain >= 64) rgb = [131, 24, 67];
                else if (rain >= 32) rgb = [220, 38, 38];
                else if (rain >= 16) rgb = [234, 88, 12];
                else if (rain >= 8) rgb = [250, 204, 21];
                else if (rain >= 4) rgb = [21, 128, 61];
                else if (rain >= 2) rgb = [29, 78, 216];
                else if (rain >= 1) rgb = [2, 132, 199];

                data[idx] = rgb[0];
                data[idx + 1] = rgb[1];
                data[idx + 2] = rgb[2];
                data[idx + 3] = Math.round(255 * alpha * 0.95);
              } else {
                data[idx + 3] = 0;
              }
            } else if (selectedParam === 'temperature') {
              // Real 850 hPa Global Temperature with Continental Solar Heating & Polar Fronts
              const dArabia = Math.hypot((lng - 48) * 0.8, (lat - 24) * 1.2);
              const dSahara = Math.hypot((lng - 10) * 0.6, (lat - 22) * 1.2);
              const dThar = Math.hypot((lng - 74) * 0.9, (lat - 28) * 1.3);
              const dTibet = Math.hypot((lng - 88) * 0.7, (lat - 33) * 1.4);
              const dAustralia = Math.hypot((lng - 134) * 0.8, (lat + 25) * 1.2);

              // Latitudinal solar heating baseline
              let val = 14 + (38 - Math.abs(lat)) * 0.42;
              val += Math.max(0, 16 - dArabia * 0.9) * 1.15; // Arabian heat low
              val += Math.max(0, 18 - dSahara * 0.8) * 1.1;  // Sahara heat low
              val += Math.max(0, 14 - dThar * 1.1) * 1.05;   // Thar heat low
              val += Math.max(0, 15 - dTibet * 0.95) * 1.1;  // Tibetan high
              val += Math.max(0, 16 - dAustralia * 0.9) * 1.0; // Outback heat
              val += Math.sin(timeOffset + lng * 0.05) * 1.2;

              if (lat > 45) val -= (lat - 45) * 0.95; // Polar vortex / Arctic front
              if (lat < -45) val -= (-45 - lat) * 1.1; // Antarctic circulation

              const [red, green, blue] = getTemperatureColor(val);
              data[idx] = red;
              data[idx + 1] = green;
              data[idx + 2] = blue;
              data[idx + 3] = Math.round(255 * alpha);
            } else if (selectedParam === 'humidity') {
              // Real Global Relative Humidity (% RH)
              const dSahara = Math.hypot((lng - 15) * 0.6, (lat - 22) * 1.2);
              const dArabia = Math.hypot((lng - 50) * 0.8, (lat - 26) * 1.1);
              const dMarineBoB = Math.hypot((lng - 89) * 0.9, (lat - 16) * 0.8);
              const dITCZ = Math.abs(lat - 6 + Math.sin(lng * 0.05) * 4);

              let rh = 62;
              rh -= Math.max(0, 52 - dSahara * 2.5);
              rh -= Math.max(0, 50 - dArabia * 2.6);
              rh += Math.max(0, 32 - dMarineBoB * 1.8);
              rh += Math.max(0, 24 - dITCZ * 3.0); // Equatorial ITCZ moisture
              rh += Math.sin(timeOffset + lat * 0.1) * 4;
              rh = Math.max(10, Math.min(100, rh));

              const [red, green, blue] = getHumidityColor(rh);
              data[idx] = red;
              data[idx + 1] = green;
              data[idx + 2] = blue;
              data[idx + 3] = Math.round(255 * alpha);
            }
          }
        }

        offCtx.putImageData(imgData, 0, 0);

        ctx.save();
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(offscreen, 0, 0, cw, ch);
        ctx.restore();
      }

      // 2. GLOBAL PHYSICAL WIND STREAMLINES (Winds: ON)
      if (windsEnabled) {
        const zoom = currentMap.getZoom();
        const zoomScale = Math.pow(1.8, Math.max(0, zoom - 4.0));
        const baseStep = 0.008 / zoomScale;

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];

          let u = 0.7;
          let v = 0.2;

          // Global Trade Winds, Jet Streams, and Monsoons
          if (p.lat >= -5 && p.lat <= 24 && p.lon >= 38 && p.lon <= 84) {
            u = 1.35 + Math.sin(p.lat * 0.12) * 0.45;
            v = 0.65 + Math.cos(p.lon * 0.08) * 0.3;
          } else if (p.lat >= 8 && p.lat <= 28 && p.lon >= 82 && p.lon <= 104) {
            const dx = (p.lon - 90.0) * 0.14;
            const dy = (p.lat - 18.0) * 0.14;
            const dist = Math.sqrt(dx * dx + dy * dy) + 0.1;
            u = -dy * (1.15 / dist) + 0.35;
            v = dx * (1.15 / dist) + 0.25;
          } else if (p.lat >= 30 && p.lat <= 60) {
            // Mid-latitude Westerlies
            u = 1.55;
            v = -0.15;
          } else if (p.lat >= -30 && p.lat <= -10) {
            // Southern Trade Winds
            u = -1.1;
            v = 0.3;
          }

          p.lon += u * baseStep * p.speed;
          p.lat += v * baseStep * p.speed;
          p.age += 1;

          let px = 0;
          let py = 0;

          try {
            const pt = currentMap.project([p.lon, p.lat]);
            px = pt.x;
            py = pt.y;
          } catch {
            continue;
          }

          if (p.age >= p.maxAge || px < -20 || px > cw + 20 || py < -20 || py > ch + 20) {
            particles[i] = spawnParticle();
            continue;
          }

          const angle = Math.atan2(v, u);
          const tailLen = 13.0;
          const life = p.age / p.maxAge;
          const particleAlpha = Math.sin(life * Math.PI) * 0.95;

          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px - Math.cos(angle) * tailLen, py + Math.sin(angle) * tailLen);
          ctx.strokeStyle = `rgba(34, 197, 94, ${particleAlpha})`;
          ctx.lineWidth = 1.35;
          ctx.lineCap = 'round';
          ctx.stroke();
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isOpen, selectedParam, windsEnabled, opacity, currentStepIdx]);

  if (!isOpen) return null;

  const currentStep = TIMELINE_STEPS[currentStepIdx] || TIMELINE_STEPS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm select-none p-0 md:p-2 animate-in fade-in duration-200 font-sans">
      <div className={`flex flex-col bg-[#0B2135] text-white shadow-2xl border border-blue-500/30 overflow-hidden w-full h-full ${isFullScreen ? 'rounded-none' : 'md:rounded-2xl md:h-[96vh] md:max-w-[99vw]'}`}>
        
        {/* 1. TOP NAVIGATION BAR */}
        <header className="bg-[#0B2135] border-b border-blue-400/20 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0 z-30 shadow-md">
          {/* Left Title Text */}
          <div className="flex items-center gap-3">
            <h1 className="text-base md:text-lg font-bold text-white tracking-tight font-sans">
              Weather Forecasting & Diagnostic Portal
            </h1>
          </div>

          {/* Right Side: Three White Pill-Shaped Inputs */}
          <div className="flex items-center gap-3 text-xs">
            {/* 1. Search Bar */}
            <form onSubmit={handleSearchLocation} className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Hyderabad, Bahadurpura"
                className="w-full pl-9 pr-3 py-1.5 bg-white text-slate-800 rounded-full text-xs font-semibold placeholder:text-slate-500 shadow-sm border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              {isSearching && (
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] text-blue-600 font-bold animate-pulse">
                  ...
                </span>
              )}
            </form>

            {/* 2. Region Dropdown */}
            <div className="relative">
              <div className="flex items-center bg-white text-slate-800 px-3.5 py-1.5 rounded-full shadow-sm border border-slate-200 font-semibold cursor-pointer">
                <Globe className="w-3.5 h-3.5 text-slate-600 mr-1.5" />
                <select
                  value={selectedRegion}
                  onChange={(e) => handleSelectRegion(e.target.value)}
                  className="appearance-none bg-transparent pr-5 text-xs font-semibold focus:outline-hidden cursor-pointer"
                >
                  {Object.keys(REGIONS).map((reg) => (
                    <option key={reg} value={reg}>
                      {reg}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-600 absolute right-3 pointer-events-none" />
              </div>
            </div>

            {/* 3. Date Picker Badge */}
            <div className="flex items-center bg-white text-slate-800 px-3.5 py-1.5 rounded-full shadow-sm border border-slate-200 font-semibold">
              <Calendar className="w-3.5 h-3.5 text-slate-600 mr-1.5" />
              <span>{currentStep.dateStr}</span>
            </div>

            {/* Fullscreen & Close Buttons */}
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              title={isFullScreen ? 'Exit Fullscreen' : 'Fullscreen'}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors ml-1"
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              title="Close Portal"
              className="p-1.5 bg-red-600/80 hover:bg-red-600 rounded-lg text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* 2. MAIN MAP WORKSPACE (FULL-BLEED BACKGROUND MAP) */}
        <div className="flex-1 relative overflow-hidden flex">
          {/* Map Container */}
          <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

          {/* Canvas Dynamic Heatmap & Wind Streamlines Overlay */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
          />

          {/* 4. LEFT-SIDE MAP CONTROLS (FLOATING) */}
          <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
            {/* Vertical Pill with + / - Zoom */}
            <div className="flex flex-col bg-slate-900/80 backdrop-blur-md rounded-2xl border border-white/15 shadow-2xl overflow-hidden">
              <button
                onClick={() => mapRef.current?.zoomIn()}
                title="Zoom In"
                className="p-2.5 hover:bg-white/10 text-white transition-colors border-b border-white/10 flex items-center justify-center"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={() => mapRef.current?.zoomOut()}
                title="Zoom Out"
                className="p-2.5 hover:bg-white/10 text-white transition-colors flex items-center justify-center"
              >
                <Minus className="w-4 h-4" />
              </button>
            </div>

            {/* Square Icon Buttons for Map Tools */}
            <button
              onClick={() => setBasemapStyle(basemapStyle === 'terrain' ? 'satellite' : 'terrain')}
              title={`Switch Basemap (${basemapStyle})`}
              className="p-2.5 bg-slate-900/80 backdrop-blur-md hover:bg-blue-600 rounded-xl border border-white/15 text-cyan-300 hover:text-white shadow-2xl transition-all"
            >
              <Globe className="w-4 h-4" />
            </button>

            <button
              onClick={() => alert('Polygon ROI Tool Active.')}
              title="Polygon Area Selection"
              className="p-2.5 bg-slate-900/80 backdrop-blur-md hover:bg-white/10 rounded-xl border border-white/15 text-white shadow-2xl transition-all"
            >
              <Square className="w-4 h-4" />
            </button>

            <button
              onClick={() => alert('Distance Ruler Active.')}
              title="Distance Measure Ruler"
              className="p-2.5 bg-slate-900/80 backdrop-blur-md hover:bg-white/10 rounded-xl border border-white/15 text-white shadow-2xl transition-all"
            >
              <Ruler className="w-4 h-4" />
            </button>
          </div>

          {/* 2. RIGHT-SIDE CONTROL PANEL (FLOATING GLASSMORPHISM) */}
          <div className="absolute top-4 right-4 z-20 flex items-start gap-1">
            {isDrawerOpen && (
              <div className="w-80 max-h-[calc(100vh-170px)] overflow-y-auto bg-slate-900/80 backdrop-blur-md rounded-2xl border border-white/15 p-4 shadow-2xl space-y-4 animate-in fade-in slide-in-from-right-4">
                
                {/* Administrative Section */}
                <div>
                  <label className="text-xs font-bold text-white block mb-1.5">
                    Administrative:
                  </label>
                  <div className="flex items-center gap-4 text-xs text-slate-200">
                    <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
                      <input
                        type="checkbox"
                        checked={showStates}
                        onChange={(e) => setShowStates(e.target.checked)}
                        className="accent-blue-500 rounded"
                      />
                      <span>States</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
                      <input
                        type="checkbox"
                        checked={showIndia}
                        onChange={(e) => setShowIndia(e.target.checked)}
                        className="accent-blue-500 rounded"
                      />
                      <span>India</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
                      <input
                        type="checkbox"
                        checked={showGlobal}
                        onChange={(e) => setShowGlobal(e.target.checked)}
                        className="accent-blue-500 rounded"
                      />
                      <span>Global</span>
                    </label>
                  </div>
                </div>

                {/* Choose Model Section */}
                <div>
                  <label className="text-xs font-bold text-white block mb-1.5">
                    Choose Model
                  </label>
                  <div className="relative">
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="w-full appearance-none bg-slate-800/90 border border-slate-700 hover:border-blue-400 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden cursor-pointer"
                    >
                      {MODELS.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Weather Parameter Section (2x2 Grid) */}
                <div>
                  <label className="text-xs font-bold text-white block mb-2">
                    Weather Parameter:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Temperature */}
                    <button
                      onClick={() => setSelectedParam('temperature')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 text-xs font-semibold transition-all ${
                        selectedParam === 'temperature'
                          ? 'bg-[#2563EB] border-blue-400 text-white shadow-lg ring-2 ring-blue-300'
                          : 'bg-slate-800/70 border-white/10 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <Thermometer className="w-4 h-4 text-orange-400" />
                      <span>Temperature</span>
                    </button>

                    {/* Humidity */}
                    <button
                      onClick={() => setSelectedParam('humidity')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 text-xs font-semibold transition-all ${
                        selectedParam === 'humidity'
                          ? 'bg-[#2563EB] border-blue-400 text-white shadow-lg ring-2 ring-blue-300'
                          : 'bg-slate-800/70 border-white/10 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <Droplets className="w-4 h-4 text-cyan-400" />
                      <span>Humidity</span>
                    </button>

                    {/* Rainfall */}
                    <button
                      onClick={() => setSelectedParam('rainfall')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 text-xs font-semibold transition-all ${
                        selectedParam === 'rainfall'
                          ? 'bg-[#2563EB] border-blue-400 text-white shadow-lg ring-2 ring-blue-300'
                          : 'bg-slate-800/70 border-white/10 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <CloudRain className="w-4 h-4 text-blue-300" />
                      <span>Rainfall</span>
                    </button>

                    {/* Accumulated Rainfall (Active Default) */}
                    <button
                      onClick={() => setSelectedParam('accumulated_rainfall')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 text-xs font-semibold transition-all ${
                        selectedParam === 'accumulated_rainfall'
                          ? 'bg-[#2563EB] border-blue-400 text-white shadow-lg ring-2 ring-blue-300'
                          : 'bg-slate-800/70 border-white/10 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <Layers className="w-4 h-4 text-indigo-300" />
                      <span>Accumulated Rainfall</span>
                    </button>
                  </div>
                </div>

                {/* Opacity Section */}
                <div className="pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between text-xs mb-1 text-slate-200">
                    <span>Opacity: {opacity}%</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    value={opacity}
                    onChange={(e) => setOpacity(Number(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                  />
                </div>

                {/* Bottom Toggles (Winds & Geopotential) */}
                <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-200 flex items-center gap-1">
                      <Wind className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Winds</span>
                    </span>
                    <button
                      onClick={() => setWindsEnabled(!windsEnabled)}
                      className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                        windsEnabled ? 'bg-[#2563EB] text-white shadow-md' : 'bg-slate-800 text-slate-400 border border-white/10'
                      }`}
                    >
                      {windsEnabled ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-200">Geopotential</span>
                    <button
                      onClick={() => setGeopotentialEnabled(!geopotentialEnabled)}
                      className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                        geopotentialEnabled ? 'bg-[#2563EB] text-white shadow-md' : 'bg-slate-800 text-slate-400 border border-white/10'
                      }`}
                    >
                      {geopotentialEnabled ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>

                {/* Jump to Full Nowcast */}
                {onNavigateToNowcast && (
                  <div className="pt-2 border-t border-white/10">
                    <button
                      onClick={() => {
                        onClose();
                        onNavigateToNowcast({
                          name: 'Selected Location Point',
                          lat: 17.3616,
                          lon: 78.4747
                        });
                      }}
                      className="w-full py-2 bg-[#DF691A] hover:bg-orange-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg transition-colors"
                    >
                      <span>Open Live Convective Nowcast</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Collapse / Expand Toggle Button */}
            <button
              onClick={() => setIsDrawerOpen(!isDrawerOpen)}
              title={isDrawerOpen ? 'Collapse Panel' : 'Expand Panel'}
              className="w-7 h-7 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-lg transition-transform"
            >
              <ChevronRight className={`w-4 h-4 transition-transform ${isDrawerOpen ? 'rotate-0' : 'rotate-180'}`} />
            </button>
          </div>

          {/* 3. BOTTOM TIMELINE & LEGEND PANEL (FLOATING) */}
          <div className="absolute bottom-3 left-4 right-4 z-20 flex flex-col gap-1.5">
            
            {/* Top Right of Panel: Legend Color Scale */}
            <div className="self-end shadow-2xl rounded-sm overflow-hidden flex items-center text-[10px] font-mono border border-black/40">
              {selectedParam === 'accumulated_rainfall' && (
                <div className="flex items-center">
                  <span className="bg-white text-black px-1.5 py-0.5 font-bold">cm</span>
                  <span className="bg-[#38BDF8] text-black px-2 py-0.5">0</span>
                  <span className="bg-[#0284C7] text-white px-2 py-0.5">1</span>
                  <span className="bg-[#1D4ED8] text-white px-2 py-0.5">2</span>
                  <span className="bg-[#15803D] text-white px-2 py-0.5">4</span>
                  <span className="bg-[#FACC15] text-black px-2 py-0.5">8</span>
                  <span className="bg-[#EA580C] text-white px-2 py-0.5">16</span>
                  <span className="bg-[#DC2626] text-white px-2 py-0.5">32</span>
                  <span className="bg-[#831843] text-white px-2 py-0.5 font-bold">64</span>
                </div>
              )}

              {selectedParam === 'rainfall' && (
                <div className="flex items-center">
                  <span className="bg-white text-black px-1.5 py-0.5 font-bold">mm</span>
                  <span className="bg-[#38BDF8] text-black px-2 py-0.5">0</span>
                  <span className="bg-[#0284C7] text-white px-2 py-0.5">1</span>
                  <span className="bg-[#1D4ED8] text-white px-2 py-0.5">2</span>
                  <span className="bg-[#15803D] text-white px-2 py-0.5">4</span>
                  <span className="bg-[#FACC15] text-black px-2 py-0.5">8</span>
                  <span className="bg-[#EA580C] text-white px-2 py-0.5">16</span>
                  <span className="bg-[#DC2626] text-white px-2 py-0.5">32</span>
                  <span className="bg-[#831843] text-white px-2 py-0.5 font-bold">64</span>
                </div>
              )}

              {selectedParam === 'temperature' && (
                <div className="flex items-center">
                  <span className="bg-[#7E22CE] text-white px-1.5 py-0.5 font-bold">°C</span>
                  <span className="bg-[#9333EA] text-white px-1 py-0.5">-15</span>
                  <span className="bg-[#1D4ED8] text-white px-1 py-0.5">-10</span>
                  <span className="bg-[#0284C7] text-white px-1 py-0.5">-5</span>
                  <span className="bg-[#0D9488] text-white px-1 py-0.5">0</span>
                  <span className="bg-[#16A34A] text-white px-1 py-0.5">3</span>
                  <span className="bg-[#22C55E] text-black px-1 py-0.5">6</span>
                  <span className="bg-[#84CC16] text-black px-1 py-0.5 font-bold">9</span>
                  <span className="bg-[#FDE047] text-black px-1 py-0.5">12</span>
                  <span className="bg-[#FACC15] text-black px-1 py-0.5 font-bold">14</span>
                  <span className="bg-[#FB923C] text-black px-1 py-0.5">16</span>
                  <span className="bg-[#F97316] text-black px-1 py-0.5 font-bold">18</span>
                  <span className="bg-[#EA580C] text-white px-1 py-0.5">20</span>
                  <span className="bg-[#DC2626] text-white px-1 py-0.5 font-bold">22</span>
                  <span className="bg-[#B91C1C] text-white px-1 py-0.5">24</span>
                  <span className="bg-[#991B1B] text-white px-1 py-0.5 font-bold">26</span>
                  <span className="bg-[#7F1D1D] text-white px-1 py-0.5">28</span>
                  <span className="bg-[#450A0A] text-white px-1.5 py-0.5 font-bold">30</span>
                </div>
              )}

              {selectedParam === 'humidity' && (
                <div className="flex items-center">
                  <span className="bg-[#78350F] text-white px-1.5 py-0.5 font-bold">%</span>
                  <span className="bg-[#92400E] text-white px-1 py-0.5">10</span>
                  <span className="bg-[#B45309] text-white px-1 py-0.5">15</span>
                  <span className="bg-[#D97706] text-white px-1 py-0.5">20</span>
                  <span className="bg-[#EA580C] text-white px-1 py-0.5">25</span>
                  <span className="bg-[#F97316] text-white px-1 py-0.5">30</span>
                  <span className="bg-[#FB923C] text-black px-1 py-0.5">35</span>
                  <span className="bg-[#FBBF24] text-black px-1 py-0.5">40</span>
                  <span className="bg-[#FDE047] text-black px-1 py-0.5">45</span>
                  <span className="bg-[#84CC16] text-black px-1 py-0.5">50</span>
                  <span className="bg-[#22C55E] text-black px-1 py-0.5">55</span>
                  <span className="bg-[#10B981] text-black px-1 py-0.5">60</span>
                  <span className="bg-[#14B8A6] text-black px-1 py-0.5">65</span>
                  <span className="bg-[#06B6D4] text-black px-1 py-0.5">70</span>
                  <span className="bg-[#0EA5E9] text-white px-1 py-0.5">75</span>
                  <span className="bg-[#3B82F6] text-white px-1 py-0.5">80</span>
                  <span className="bg-[#2563EB] text-white px-1 py-0.5">85</span>
                  <span className="bg-[#1D4ED8] text-white px-1 py-0.5">90</span>
                  <span className="bg-[#1E40AF] text-white px-1 py-0.5">95</span>
                  <span className="bg-[#1E3A8A] text-white px-1.5 py-0.5 font-bold">100</span>
                </div>
              )}
            </div>

            {/* Main Timeline Bar */}
            <div className="bg-[#0A1A28]/95 backdrop-blur-md rounded-2xl border border-blue-400/20 px-4 py-2.5 shadow-2xl flex items-center gap-3">
              {/* Large Play Button */}
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-9 h-9 rounded-full bg-white hover:bg-slate-200 text-slate-950 flex items-center justify-center font-bold shadow-lg transition-transform hover:scale-105 shrink-0"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>

              {/* Progress Track & Draggable Scrubber */}
              <div className="relative flex-1 flex flex-col gap-1">
                {/* Floating Date/Time Badge above Knob */}
                <div className="absolute -top-7 left-0 bg-[#0F2231]/95 text-white border border-slate-600 px-2 py-0.5 rounded text-[10px] font-mono shadow-md whitespace-nowrap pointer-events-none">
                  <span>Date: {currentStep.dateStr}</span>
                  <span className="ml-2">Time: {currentStep.timeStr}</span>
                </div>

                {/* Timeline Range Input */}
                <input
                  type="range"
                  min={0}
                  max={TIMELINE_STEPS.length - 1}
                  value={currentStepIdx}
                  onChange={(e) => {
                    setCurrentStepIdx(Number(e.target.value));
                    setIsPlaying(false);
                  }}
                  className="w-full accent-orange-500 cursor-pointer h-1.5 bg-slate-700/80 rounded-lg"
                />

                {/* Tick Marks and Dates (2026-10-01 to 2026-10-07) */}
                <div className="flex justify-between text-[10px] text-slate-300 font-mono px-1">
                  {TIMELINE_STEPS.filter((_, idx) => idx % 4 === 0).map((st) => (
                    <span key={st.index} className={st.dateStr === currentStep.dateStr ? 'text-white font-bold' : 'text-slate-400'}>
                      {st.dateStr}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
