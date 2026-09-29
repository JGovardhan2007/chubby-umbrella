import React, { useState, useEffect, useCallback } from 'react';
import { TopBar } from './panels/TopBar';
import { DataSourcePanel } from './panels/DataSourcePanel';
import { LayerControl } from './panels/LayerControl';
import { StormDetails } from './panels/StormDetails';
import { HazardSummary } from './panels/HazardSummary';
import { ModelComparison } from './models/ModelComparison';
import { MapView } from './map/MapView';
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

  // Fetch frame data whenever step or horizon changes
  const loadData = useCallback(async () => {
    if (mode === 'live') {
      const liveRes = await apiService.getLiveNowcast(13.0827, 80.2707, 'Chennai_Live_Site');
      setStepData(liveRes);
      if (liveRes.storms && liveRes.storms.length > 0) {
        setSelectedStorm((prev) => (prev ? liveRes.storms.find((s) => s.storm_id === prev.storm_id) || liveRes.storms[0] : null));
      }
    } else {
      const res = await apiService.getReplayStep(currentStepIndex, selectedHorizon);
      setStepData(res);
      if (res.storms && res.storms.length > 0) {
        setSelectedStorm((prev) => (prev ? res.storms.find((s) => s.storm_id === prev.storm_id) || res.storms[0] : null));
      }
    }
  }, [mode, currentStepIndex, selectedHorizon]);

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

  const timeLabel = stepData?.timestamp
    ? new Date(stepData.timestamp).toLocaleTimeString('en-IN', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit' }) + ' UTC'
    : '14:30 IST';

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0B0F19] text-slate-100 overflow-hidden font-sans">
      {/* 1. TOP BAR */}
      <TopBar
        systemStatus={systemStatus}
        mode={mode}
        onModeChange={handleModeChange}
        currentTimeLabel={timeLabel}
        isBackendConnected={isBackendConnected}
      />

      {/* 2. MAIN CONTENT AREA (Left Sidebar + Large Map + Right Info Panel) */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        {/* LEFT SIDEBAR: Layers & Data Sources (260px) */}
        <aside className="w-64 bg-[#111827] border-r border-[#1F293D] flex flex-col shrink-0 z-10 shadow-lg">
          <DataSourcePanel
            systemStatus={systemStatus}
            mode={mode}
          />
          <LayerControl
            layers={layers}
            onToggleLayer={handleToggleLayer}
          />
        </aside>

        {/* CENTER: MAIN GIS MAP */}
        <main className="flex-1 relative flex flex-col h-full overflow-hidden bg-[#0B0F19]">
          <MapView
            layers={layers}
            storms={stepData?.storms || []}
            selectedStorm={selectedStorm}
            onSelectStorm={setSelectedStorm}
            selectedHorizon={selectedHorizon}
            siteEta={stepData?.siteEta || null}
            radarPoints={stepData?.radarPoints}
            lightningFlashes={stepData?.lightningFlashes}
            onMapClickLocation={(lat, lon) => {
              if (mode === 'live') {
                apiService.getLiveNowcast(lat, lon, 'Custom_Map_Location').then(setStepData);
              }
            }}
          />
        </main>

        {/* RIGHT INFORMATION PANEL (320px) */}
        <aside className="w-80 bg-[#111827] border-l border-[#1F293D] flex flex-col shrink-0 z-10 shadow-lg">
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

          <div className="p-3 border-t border-[#1F293D]">
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
