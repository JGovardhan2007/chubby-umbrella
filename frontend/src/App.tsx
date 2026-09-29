import React, { useState, useEffect, useCallback } from 'react';
import { TopBar } from './panels/TopBar';
import { DataSourcePanel } from './panels/DataSourcePanel';
import { LayerControl } from './panels/LayerControl';
import { StormDetails } from './panels/StormDetails';
import { HazardSummary } from './panels/HazardSummary';
import { ModelComparison } from './models/ModelComparison';
import { MapView } from './map/MapView';
import { ConvectiveCards } from './panels/ConvectiveCards';
import { ForecastTimeline } from './forecast/ForecastTimeline';
import { LayerToggleState, SystemStatusData } from './types/weather';
import { StormCell } from './types/storm';
import { HorizonMinutes, SiteEtaSummary } from './types/forecast';
import { apiService, StepDataResponse } from './services/api';
import { DEMO_REPLAY_FRAMES } from './data/demo/demoData';

export const App: React.FC = () => {
  // Operational state
  const [mode, setMode] = useState<'replay' | 'live' | 'demo'>('replay');
  const [selectedHorizon, setSelectedHorizon] = useState<HorizonMinutes>(0);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [replaySpeed, setReplaySpeed] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Data state
  const [systemStatus, setSystemStatus] = useState<SystemStatusData | null>(null);
  const [stepData, setStepData] = useState<StepDataResponse | null>(null);
  const [selectedStorm, setSelectedStorm] = useState<StormCell | null>(null);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);

  // Active layer toggles
  const [layers, setLayers] = useState<LayerToggleState>({
    radarReflectivity: true,
    satelliteIR: true,
    lightningFlashes: true,
    stormCells: true,
    stormTracks: true,
    hazardZones: true,

    // Phase 2 placeholders
    extremeAnomalies: false,
    anomalyTracks: false,
    anomalyUncertainty: false,

    // Phase 3 placeholders
    modelForecastA: false,
    modelForecastB: false,
    blendedForecast: false,
  });

  // Load initial system status and check backend health
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await apiService.getSystemStatus();
        setSystemStatus(status);
        setIsBackendConnected(true);
      } catch {
        setIsBackendConnected(false);
      }
    };
    checkStatus();
  }, []);

  const [currentCity, setCurrentCity] = useState<{ name: string; lat: number; lon: number }>({
    name: 'Chennai',
    lat: 13.0827,
    lon: 80.2707
  });

  const handleUseGPS = useCallback(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = Number(pos.coords.latitude.toFixed(4));
          const lon = Number(pos.coords.longitude.toFixed(4));
          setCurrentCity({
            name: 'My Current Location',
            lat,
            lon
          });
          setMode('live');
          apiService.setMode('api');
        },
        (err) => {
          console.warn('Geolocation query failed or denied:', err);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  }, []);

  // Auto-detect system GPS coordinates on initial app load
  useEffect(() => {
    handleUseGPS();
  }, [handleUseGPS]);

  // Helper to dynamically project storm cells, radar contours, and lightning to the active location
  const transformFrameToLocation = useCallback((res: StepDataResponse, city: { name: string; lat: number; lon: number }): StepDataResponse => {
    const dLat = city.lat - 13.0827;
    const dLon = city.lon - 80.2707;

    if (Math.abs(dLat) < 0.0001 && Math.abs(dLon) < 0.0001) {
      return res;
    }

    const updatedStorms = (res.storms || []).map((storm) => ({
      ...storm,
      centroid_lat: Number((storm.centroid_lat + dLat).toFixed(4)),
      centroid_lon: Number((storm.centroid_lon + dLon).toFixed(4)),
      polygon_coords: (storm.polygon_coords || []).map(([lon, lat]) => [
        Number((lon + dLon).toFixed(4)),
        Number((lat + dLat).toFixed(4))
      ] as [number, number]),
      history: (storm.history || []).map((h) => ({
        ...h,
        centroid_lat: Number((h.centroid_lat + dLat).toFixed(4)),
        centroid_lon: Number((h.centroid_lon + dLon).toFixed(4))
      }))
    }));

    const updatedRadarPoints = (res.radarPoints || []).map((p) => ({
      ...p,
      lat: Number((p.lat + dLat).toFixed(4)),
      lon: Number((p.lon + dLon).toFixed(4))
    }));

    const updatedLightningFlashes = (res.lightningFlashes || []).map((f) => ({
      ...f,
      lat: Number((f.lat + dLat).toFixed(4)),
      lon: Number((f.lon + dLon).toFixed(4))
    }));

    const updatedSiteEta = res.siteEta
      ? {
          ...res.siteEta,
          target_location: {
            latitude: city.lat,
            longitude: city.lon,
            label: city.name
          }
        }
      : null;

    return {
      ...res,
      storms: updatedStorms,
      radarPoints: updatedRadarPoints,
      lightningFlashes: updatedLightningFlashes,
      siteEta: updatedSiteEta
    };
  }, []);

  // Fetch frame data whenever step or horizon changes
  const loadData = useCallback(async () => {
    if (mode === 'live') {
      const liveRes = await apiService.getLiveNowcast(currentCity.lat, currentCity.lon, currentCity.name);
      setStepData(liveRes);
      if (liveRes.storms && liveRes.storms.length > 0) {
        setSelectedStorm((prev) => (prev ? liveRes.storms.find((s) => s.storm_id === prev.storm_id) || liveRes.storms[0] : liveRes.storms[0]));
      } else {
        setSelectedStorm(null);
      }
    } else {
      const res = await apiService.getReplayStep(currentStepIndex, selectedHorizon);
      const transformed = transformFrameToLocation(res, currentCity);
      setStepData(transformed);
      if (transformed.storms && transformed.storms.length > 0) {
        setSelectedStorm((prev) => (prev ? transformed.storms.find((s) => s.storm_id === prev.storm_id) || transformed.storms[0] : null));
      }
    }
  }, [mode, currentStepIndex, selectedHorizon, currentCity, transformFrameToLocation]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Replay playback timer loop
  useEffect(() => {
    if (!isPlaying || mode === 'live') return;

    const intervalMs = 2500 / replaySpeed;
    const timer = setInterval(() => {
      setCurrentStepIndex((prev) => {
        const maxSteps = DEMO_REPLAY_FRAMES.length;
        const next = prev + 1;
        if (next >= maxSteps) {
          setIsPlaying(false);
          return maxSteps - 1;
        }
        return next;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, replaySpeed, mode]);

  const handleToggleLayer = (key: keyof LayerToggleState) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleModeChange = (newMode: 'replay' | 'live' | 'demo') => {
    setMode(newMode);
    apiService.setMode(newMode === 'live' ? 'api' : 'demo');
    setIsPlaying(false);
    if (newMode === 'replay') {
      setCurrentStepIndex(1);
    }
  };

  const handleRestart = () => {
    setCurrentStepIndex(0);
    setIsPlaying(true);
  };

  const handleSelectCity = async (loc: { name: string; lat: number; lon: number }) => {
    setCurrentCity(loc);
    setMode('live');
    apiService.setMode('api');
    setIsPlaying(false);
    try {
      const liveRes = await apiService.getLiveNowcast(loc.lat, loc.lon, loc.name);
      setStepData(liveRes);
      if (liveRes.storms && liveRes.storms.length > 0) {
        setSelectedStorm(liveRes.storms[0]);
      }
    } catch {
      // Fallback
    }
  };

  const timeLabel = stepData?.timestamp
    ? new Date(stepData.timestamp).toLocaleTimeString('en-IN', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit' }) + ' UTC'
    : '14:30 IST';

  return (
    <div className="flex flex-col h-screen w-screen bg-[#F8FAFC] text-slate-800 overflow-hidden font-sans">
      {/* 1. TOP BAR */}
      <TopBar
        systemStatus={systemStatus}
        mode={mode}
        onModeChange={handleModeChange}
        currentTimeLabel={timeLabel}
        isBackendConnected={isBackendConnected}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSelectCity={handleSelectCity}
        onUseGPS={handleUseGPS}
        currentLocationName={currentCity.name}
      />

      {/* 2. MAIN CONTENT AREA (Left Sidebar + Large Map + Right Info Panel) */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        {/* LEFT SIDEBAR: Detail Filters, Search & Categories (280px) */}
        <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shrink-0 z-10 shadow-xs">
          <DataSourcePanel
            systemStatus={systemStatus}
            mode={mode}
          />
          <LayerControl
            layers={layers}
            onToggleLayer={handleToggleLayer}
          />
        </aside>

        {/* CENTER: MAIN GIS MAP + BOTTOM CONVECTIVE CARDS */}
        <main className="flex-1 relative flex flex-col h-full overflow-hidden bg-[#F1F5F9]">
          <div className="flex-1 relative overflow-hidden">
            <MapView
              layers={layers}
              onToggleLayer={handleToggleLayer}
              storms={stepData?.storms || []}
              selectedStorm={selectedStorm}
              onSelectStorm={setSelectedStorm}
              selectedHorizon={selectedHorizon}
              siteEta={stepData?.siteEta || null}
              radarPoints={stepData?.radarPoints}
              lightningFlashes={stepData?.lightningFlashes}
              onLocateMe={handleUseGPS}
              onSelectCity={handleSelectCity}
              onMapClickLocation={(lat, lon) => {
                if (mode === 'live') {
                  apiService.getLiveNowcast(lat, lon, currentCity.name).then(setStepData);
                }
              }}
            />
          </div>

          {/* BOTTOM CONVECTIVE CARDS */}
          <ConvectiveCards
            storms={stepData?.storms || []}
            selectedStorm={selectedStorm}
            onSelectStorm={setSelectedStorm}
            cityName={currentCity.name}
          />
        </main>

        {/* RIGHT INFORMATION PANEL (320px) */}
        <aside className="w-80 bg-white border-l border-slate-200 flex flex-col shrink-0 z-10 shadow-xs">
          {selectedStorm ? (
            <StormDetails
              storm={selectedStorm}
              siteEta={stepData?.siteEta || null}
              onClose={() => setSelectedStorm(null)}
            />
          ) : null}

          <HazardSummary
            hazardSummary={stepData?.hazardSummary || { lightning: 0, hail: 0, downburst: 0, cloudburst: 0 }}
            activeStormCount={stepData?.activeStormCount || 0}
            highRiskRegions={stepData?.highRiskRegions || 0}
            siteEta={stepData?.siteEta || null}
            mode={mode}
          />

          <div className="p-3 border-t border-slate-100 bg-white">
            <ModelComparison />
          </div>
        </aside>
      </div>

      {/* 3. BOTTOM FORECAST TIMELINE */}
      <ForecastTimeline
        selectedHorizon={selectedHorizon}
        onHorizonChange={setSelectedHorizon}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        onRestart={handleRestart}
        replaySpeed={replaySpeed}
        onSpeedChange={setReplaySpeed}
        currentTimeLabel={timeLabel}
        isLiveMode={mode === 'live'}
      />
    </div>
  );
};

export default App;

