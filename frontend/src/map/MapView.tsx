import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { Sun, Zap, RotateCcw, Plus, Minus, Layers, CloudRain, ChevronDown, ChevronUp, ExternalLink, Crosshair } from 'lucide-react';
import { LayerToggleState } from '../types/weather';
import { StormCell } from '../types/storm';
import { HorizonMinutes, SiteEtaSummary } from '../types/forecast';
import { DraggableWidget } from '../panels/DraggableWidget';
import { RadarLayer } from './RadarLayer';
import { SatelliteLayer } from './SatelliteLayer';
import { LightningLayer } from './LightningLayer';
import { StormLayer } from './StormLayer';
import { TrackLayer } from './TrackLayer';
import { HazardLayer } from './HazardLayer';
import { AnomalyLayer } from '../anomaly/AnomalyLayer';
import { RadarStationLayer } from './RadarStationLayer';
import { MapLegend } from './MapLegend';
import { LocationOption } from '../panels/TopBar';

import { MapDetailsDrawer } from './MapDetailsDrawer';

import { formatStormName, formatLocationName } from '../utils/formatters';

interface MapViewProps {
  layers: LayerToggleState;
  onToggleLayer?: (key: keyof LayerToggleState) => void;
  storms: StormCell[];
  selectedStorm: StormCell | null;
  onSelectStorm: (storm: StormCell | null) => void;
  selectedHorizon: HorizonMinutes;
  siteEta: SiteEtaSummary | null;
  radarPoints?: { lat: number; lon: number; dbz: number }[];
  lightningFlashes?: { lat: number; lon: number; ka: number; type: string }[];
  onLocateMe?: () => void;
  onSelectCity?: (loc: LocationOption) => void;
  onMapClickLocation?: (lat: number, lon: number) => void;
}

export const MapView: React.FC<MapViewProps> = ({
  layers,
  onToggleLayer,
  storms,
  selectedStorm,
  onSelectStorm,
  selectedHorizon,
  siteEta,
  radarPoints,
  lightningFlashes,
  onLocateMe,
  onSelectCity,
  onMapClickLocation
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<maplibregl.Map | null>(null);
  const siteMarkerRef = useRef<maplibregl.Marker | null>(null);

  const [isCellAccordionOpen, setIsCellAccordionOpen] = useState(true);

  // Initialize MapLibre GL Positron (Light) Base Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const mapInstance = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: [80.12, 13.08],
      zoom: 9.0,
      pitch: 0,
      attributionControl: false
    });

    mapInstance.on('load', () => {
      setMap(mapInstance);
    });

    // Map click handler for selecting arbitrary target monitoring site
    mapInstance.on('click', (e) => {
      if (onMapClickLocation) {
        onMapClickLocation(e.lngLat.lat, e.lngLat.lng);
      }
    });

    return () => {
      mapInstance.remove();
    };
  }, []);

  // Update target site marker on map and pan to location
  useEffect(() => {
    if (!map) return;

    if (siteEta) {
      const { latitude, longitude, label } = siteEta.target_location;

      const cleanLabel = formatLocationName(label);
      const markerHtml = `
        <div class="relative flex items-center justify-center cursor-pointer group">
          <div class="absolute w-8 h-8 rounded-full bg-blue-500/25 animate-ping"></div>
          <div class="absolute w-6 h-6 rounded-full bg-blue-500/20"></div>
          <div class="relative w-4.5 h-4.5 rounded-full bg-[#1A73E8] border-[2.5px] border-white shadow-lg flex items-center justify-center">
            <span class="w-1 h-1 rounded-full bg-white"></span>
          </div>
          <div class="absolute -bottom-6 bg-slate-900/90 backdrop-blur-xs text-white text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full shadow-md whitespace-nowrap border border-slate-700/80 flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
            ${cleanLabel}
          </div>
        </div>
      `;

      if (!siteMarkerRef.current) {
        const el = document.createElement('div');
        el.className = 'site-marker-pin';
        el.innerHTML = markerHtml;

        siteMarkerRef.current = new maplibregl.Marker({ element: el })
          .setLngLat([longitude, latitude])
          .addTo(map);
      } else {
        siteMarkerRef.current.getElement().innerHTML = markerHtml;
        siteMarkerRef.current.setLngLat([longitude, latitude]);
      }

      map.flyTo({
        center: [longitude, latitude],
        zoom: 9.0,
        essential: true
      });
    }
  }, [map, siteEta]);

  const handleZoomIn = () => map?.zoomIn();
  const handleZoomOut = () => map?.zoomOut();

  const handleLocateMe = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = Number(pos.coords.latitude.toFixed(4));
          const lon = Number(pos.coords.longitude.toFixed(4));
          if (map) {
            map.flyTo({
              center: [lon, lat],
              zoom: 11.0,
              speed: 1.4,
              curve: 1.42,
              essential: true
            });
          }
          if (onLocateMe) {
            onLocateMe();
          }
        },
        (err) => {
          console.warn('Geolocation query error:', err);
          if (siteEta?.target_location && map) {
            map.flyTo({
              center: [siteEta.target_location.longitude, siteEta.target_location.latitude],
              zoom: 10.5,
              speed: 1.4,
              essential: true
            });
          }
          if (onLocateMe) {
            onLocateMe();
          }
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    } else if (siteEta?.target_location && map) {
      map.flyTo({
        center: [siteEta.target_location.longitude, siteEta.target_location.latitude],
        zoom: 10.5,
        speed: 1.4,
        essential: true
      });
      if (onLocateMe) {
        onLocateMe();
      }
    }
  };

  const handleReset = () => {
    if (siteEta?.target_location) {
      map?.flyTo({ center: [siteEta.target_location.longitude, siteEta.target_location.latitude], zoom: 9.0, essential: true });
    } else {
      map?.flyTo({ center: [80.12, 13.08], zoom: 9.0 });
    }
  };

  const [selectedBasemap, setSelectedBasemap] = useState<'positron' | 'satellite' | 'voyager' | 'dark'>('positron');
  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(false);
  const [styleVersion, setStyleVersion] = useState(0);

  const BASEMAPS = [
    {
      id: 'positron' as const,
      name: 'Default',
      desc: 'Clean vector streets & districts',
      style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json'
    },
    {
      id: 'satellite' as const,
      name: 'Satellite',
      desc: 'High-res earth imagery with labels',
      style: {
        version: 8,
        sources: {
          'esri-imagery': {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
            ],
            tileSize: 256,
            attribution: 'Esri, Maxar'
          },
          'esri-transportation': {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}'
            ],
            tileSize: 256
          },
          'esri-labels': {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'
            ],
            tileSize: 256
          }
        },
        layers: [
          {
            id: 'esri-imagery-layer',
            type: 'raster',
            source: 'esri-imagery',
            minzoom: 0,
            maxzoom: 19
          },
          {
            id: 'esri-transportation-layer',
            type: 'raster',
            source: 'esri-transportation',
            minzoom: 0,
            maxzoom: 19
          },
          {
            id: 'esri-labels-layer',
            type: 'raster',
            source: 'esri-labels',
            minzoom: 0,
            maxzoom: 19
          }
        ]
      }
    },
    {
      id: 'voyager' as const,
      name: 'Terrain',
      desc: 'Topography, relief & boundaries',
      style: {
        version: 8,
        sources: {
          'esri-topo': {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}'
            ],
            tileSize: 256,
            attribution: 'Esri, USGS'
          },
          'esri-topo-labels': {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'
            ],
            tileSize: 256
          }
        },
        layers: [
          {
            id: 'esri-topo-layer',
            type: 'raster',
            source: 'esri-topo',
            minzoom: 0,
            maxzoom: 19
          },
          {
            id: 'esri-topo-labels-layer',
            type: 'raster',
            source: 'esri-topo-labels',
            minzoom: 0,
            maxzoom: 19
          }
        ]
      }
    },
    {
      id: 'dark' as const,
      name: 'Dark Matter',
      desc: 'Nocturnal contrast',
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
    }
  ];

  const handleSelectBasemap = (bm: typeof BASEMAPS[0]) => {
    if (!map) return;
    if (selectedBasemap === bm.id) return;
    setSelectedBasemap(bm.id);

    // Listen for style load to refresh meteorological GeoJSON layers
    const onStyleData = () => {
      if (map.isStyleLoaded()) {
        map.off('styledata', onStyleData);
        setStyleVersion((prev) => prev + 1);
      }
    };
    map.on('styledata', onStyleData);
    map.setStyle(bm.style as any);
  };

  const primaryStorm = selectedStorm || storms[0];

  return (
    <div className="relative w-full h-full bg-[#F1F5F9] overflow-hidden flex-1">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* 1. TOP FLOATING QUICK PILLS (Matching Mockup: Weather, Transportation / Lightning) */}
      <div className="absolute top-4 left-6 z-20 flex items-center gap-2.5">
        <div className="flex items-center gap-2 bg-white/95 backdrop-blur-sm border border-slate-200/90 rounded-full px-3.5 py-1.5 shadow-sm text-xs font-semibold text-slate-700 hover:bg-white cursor-pointer transition-all">
          <Sun className="w-3.5 h-3.5 text-amber-500" />
          <span>Weather Live</span>
        </div>

        <div className="flex items-center gap-2 bg-white/95 backdrop-blur-sm border border-slate-200/90 rounded-full px-3.5 py-1.5 shadow-sm text-xs font-semibold text-slate-700 hover:bg-white cursor-pointer transition-all">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span>Lightning Hub</span>
        </div>
      </div>

      {/* 2. TOP RIGHT FLOATING RESET BUTTON (Matching Mockup: "Reset") */}
      <div className="absolute top-4 right-6 z-20">
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm text-xs font-semibold text-slate-700 hover:bg-white hover:border-slate-300 transition-all active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
          <span>Reset</span>
        </button>
      </div>

      {/* 3. RIGHT FLOATING MAP NAVIGATION CONTROLS & MAP DETAILS DRAWER */}
      <div className="absolute right-6 top-16 z-30 flex items-start gap-3">
        {/* Google Maps Style Map Details Drawer (Opens BESIDE the layer button to the left) */}
        <MapDetailsDrawer
          isOpen={isLayerMenuOpen}
          onClose={() => setIsLayerMenuOpen(false)}
          selectedBasemap={selectedBasemap}
          onSelectBasemap={(bm) => {
            const match = BASEMAPS.find((b) => b.id === bm);
            if (match) handleSelectBasemap(match);
          }}
          layers={layers}
          onToggleLayer={onToggleLayer}
        />

        {/* Navigation Control Bar */}
        <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl shadow-md flex flex-col overflow-hidden">
          <button
            onClick={handleLocateMe}
            title="My Location (Live GPS)"
            className="p-2.5 text-slate-600 hover:bg-amber-50 hover:text-amber-600 border-b border-slate-100 flex items-center justify-center transition-colors"
          >
            <Crosshair className="w-4 h-4 text-amber-600" />
          </button>
          <button
            onClick={() => setIsLayerMenuOpen(!isLayerMenuOpen)}
            title="Map details & layers"
            className={`p-2.5 transition-colors border-b border-slate-100 flex items-center justify-center ${
              isLayerMenuOpen
                ? 'bg-amber-500 text-white shadow-inner'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomIn}
            title="Zoom In"
            className="p-2.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-b border-slate-100 flex items-center justify-center transition-colors"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </button>
          <button
            onClick={handleZoomOut}
            title="Zoom Out"
            className="p-2.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 flex items-center justify-center transition-colors"
          >
            <Minus className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* 4. DRAGGABLE & RESIZABLE CONVECTIVE CELLS CARD */}
      <DraggableWidget
        id="convective-cells-widget"
        title="Convective Cells"
        defaultPosition={{ x: 20, y: 55 }}
        defaultWidth={250}
        minWidth={220}
        maxWidth={460}
        collapsible={true}
        isCollapsedDefault={true}
      >
        <div className="space-y-2 select-none">
          {/* Active Expanded Card */}
          <div className="rounded-lg border-2 border-amber-400/90 bg-white p-2.5 shadow-xs">
            <div className="flex items-center justify-between font-bold text-slate-900 mb-2">
              <span className="truncate">{primaryStorm ? formatStormName(primaryStorm.storm_id) : 'Cell #01 - Supercell'}</span>
              <ChevronUp className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </div>

            {/* Progress bars (Hail risk & Wind gusts) */}
            <div className="space-y-1.5">
              {/* Hail Risk (Magenta) */}
              <div className="flex h-5 w-full rounded bg-slate-100 overflow-hidden font-mono text-[10px] text-white">
                <div
                  className="bg-purple-600 flex items-center justify-center px-1.5 font-bold transition-all duration-500"
                  style={{ width: `${Math.min(100, (primaryStorm?.intensity || 50) * 1.5)}%` }}
                >
                  Hail {Math.round(primaryStorm?.intensity ? primaryStorm.intensity * 1.4 : 65)}%
                </div>
              </div>

              {/* Downburst Wind (Royal Blue) */}
              <div className="flex h-5 w-full rounded bg-slate-100 overflow-hidden font-mono text-[10px] text-white">
                <div
                  className="bg-blue-600 flex items-center justify-center px-1.5 font-bold transition-all duration-500"
                  style={{ width: `${Math.min(100, (primaryStorm?.speed_kmh || 30) * 1.8)}%` }}
                >
                  Wind {Math.round(primaryStorm?.speed_kmh ? primaryStorm.speed_kmh * 1.6 : 55)}%
                </div>
              </div>
            </div>
          </div>

          {/* Colored Buttons for other active storm cells */}
          <div className="space-y-1.5">
            <button
              onClick={() => storms[1] && onSelectStorm(storms[1])}
              className="w-full text-left px-3 py-2 rounded-lg bg-[#1E3A8A] hover:bg-[#1e40af] text-white font-semibold text-[11px] flex items-center justify-between shadow-xs transition-colors"
            >
              <span className="truncate">Cell #02 - North Squall</span>
              <ChevronDown className="w-3.5 h-3.5 text-blue-200 shrink-0" />
            </button>

            <button
              onClick={() => storms[2] && onSelectStorm(storms[2])}
              className="w-full text-left px-3 py-2 rounded-lg bg-[#059669] hover:bg-[#047857] text-white font-semibold text-[11px] flex items-center justify-between shadow-xs transition-colors"
            >
              <span className="truncate">Cell #03 - Coastal Cluster</span>
              <ChevronDown className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
            </button>

            <button
              onClick={() => storms[3] && onSelectStorm(storms[3])}
              className="w-full text-left px-3 py-2 rounded-lg bg-[#DC2626] hover:bg-[#b91c1c] text-white font-semibold text-[11px] flex items-center justify-between shadow-xs transition-colors"
            >
              <span className="truncate">Cell #04 - Hail Core</span>
              <ChevronDown className="w-3.5 h-3.5 text-red-200 shrink-0" />
            </button>

            <button
              onClick={() => storms[4] && onSelectStorm(storms[4])}
              className="w-full text-left px-3 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-semibold text-[11px] flex items-center justify-between shadow-xs transition-colors"
            >
              <span className="truncate">Cell #05 - Developing Cell</span>
              <ChevronDown className="w-3.5 h-3.5 text-blue-200 shrink-0" />
            </button>
          </div>
        </div>
      </DraggableWidget>

      {/* 5. GIS METEOROLOGICAL LAYER MANAGERS (Auto-syncs across Basemap styles) */}
      <React.Fragment key={styleVersion}>
        <RadarLayer
          map={map}
          visible={layers.radarReflectivity}
          radarPoints={radarPoints}
          centerLat={primaryStorm?.centroid_lat}
          centerLon={primaryStorm?.centroid_lon}
          maxDbz={primaryStorm?.intensity}
        />

        <SatelliteLayer
          map={map}
          visible={layers.satelliteIR}
          centerLat={primaryStorm?.centroid_lat}
          centerLon={primaryStorm?.centroid_lon}
          minBtK={primaryStorm?.indicators?.min_bt_k}
        />

        <LightningLayer
          map={map}
          visible={layers.lightningFlashes}
          flashes={lightningFlashes}
        />

        <StormLayer
          map={map}
          visible={layers.stormCells}
          storms={storms}
          selectedStormId={selectedStorm?.storm_id || null}
          onSelectStorm={(s) => onSelectStorm(s)}
        />

        <TrackLayer
          map={map}
          visible={layers.stormTracks}
          storms={storms}
          selectedHorizon={selectedHorizon}
        />

        <HazardLayer
          map={map}
          visible={layers.hazardZones}
          storms={storms}
        />

        <AnomalyLayer
          map={map}
          visible={layers.extremeAnomalies}
        />

        {/* Nationwide Doppler Weather Radar Network & Stations */}
        <RadarStationLayer
          map={map}
          onSelectStation={onSelectCity}
        />
      </React.Fragment>

      {/* Map Legend */}
      <MapLegend />
    </div>
  );
};
