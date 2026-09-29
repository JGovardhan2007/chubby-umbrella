import React from 'react';
import { Play, Pause, RotateCcw, Clock, FastForward } from 'lucide-react';
import { HorizonMinutes } from '../types/forecast';

interface ForecastTimelineProps {
  selectedHorizon: HorizonMinutes;
  onHorizonChange: (horizon: HorizonMinutes) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onRestart: () => void;
  replaySpeed: number;
  onSpeedChange: (speed: number) => void;
  currentTimeLabel: string;
  isLiveMode: boolean;
}

const HORIZONS: { label: string; value: HorizonMinutes; desc: string }[] = [
  { label: 'NOW', value: 0, desc: 'Observed' },
  { label: '+15m', value: 15, desc: 'Predicted' },
  { label: '+30m', value: 30, desc: 'Predicted' },
  { label: '+1h', value: 60, desc: 'Predicted' },
  { label: '+2h', value: 120, desc: 'Derived' },
  { label: '+3h', value: 180, desc: 'Derived' },
  { label: '+4h', value: 240, desc: 'Uncertain' },
  { label: '+5h', value: 300, desc: 'Uncertain' },
  { label: '+6h', value: 360, desc: 'Uncertain' },
];

export const ForecastTimeline: React.FC<ForecastTimelineProps> = ({
  selectedHorizon,
  onHorizonChange,
  isPlaying,
  onTogglePlay,
  onRestart,
  replaySpeed,
  onSpeedChange,
  currentTimeLabel,
  isLiveMode
}) => {
  return (
    <div className="bg-white border-t border-slate-200 px-6 py-2.5 flex items-center justify-between gap-4 select-none z-20 shadow-sm">
      {/* Playback Controls */}
      <div className="flex items-center gap-2.5 border-r border-slate-200 pr-5">
        <button
          onClick={onRestart}
          title="Restart Replay"
          className="p-2 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={onTogglePlay}
          disabled={isLiveMode}
          title={isPlaying ? "Pause Replay" : "Play Replay"}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wider transition-all shadow-xs ${
            isLiveMode
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : isPlaying
              ? 'bg-amber-600 hover:bg-amber-700 text-white'
              : 'bg-amber-500 hover:bg-amber-600 text-white'
          }`}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          {isPlaying ? 'PAUSE' : 'PLAY'}
        </button>

        {/* Speed Selector */}
        <div className="flex items-center bg-slate-100 border border-slate-200 rounded-full p-0.5 ml-1">
          {[1, 2, 5].map((spd) => (
            <button
              key={spd}
              onClick={() => onSpeedChange(spd)}
              className={`px-2.5 py-0.5 text-[11px] font-mono rounded-full ${
                replaySpeed === spd
                  ? 'bg-white text-amber-700 font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>

        {/* Current Replay Timestamp */}
        <div className="flex items-center gap-1.5 ml-2 font-mono text-xs text-slate-700">
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-slate-400 text-[11px] font-sans">T_VALID:</span>
          <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
            {currentTimeLabel}
          </span>
        </div>
      </div>

      {/* Forecast Horizons Timeline Bar */}
      <div className="flex-1 flex items-center justify-between gap-1 overflow-x-auto">
        <div className="text-[11px] font-bold text-slate-600 tracking-tight mr-3 shrink-0 font-sans">
          LEAD TIME HORIZON:
        </div>

        <div className="flex items-center gap-1.5 flex-1 justify-around">
          {HORIZONS.map((h) => {
            const isSelected = selectedHorizon === h.value;
            const isObserved = h.value === 0;
            const isUncertain = h.value >= 240;

            return (
              <button
                key={h.value}
                onClick={() => onHorizonChange(h.value)}
                className={`flex-1 py-1 px-2 rounded-lg flex flex-col items-center justify-center transition-all border ${
                  isSelected
                    ? 'bg-amber-50 border-amber-500 text-amber-700 shadow-xs font-semibold'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span className={`font-mono text-xs font-bold ${isSelected ? 'text-amber-700' : 'text-slate-800'}`}>
                  {h.label}
                </span>
                <span className={`text-[9px] uppercase tracking-tight ${
                  isObserved ? 'text-emerald-600 font-semibold' : isUncertain ? 'text-amber-600' : 'text-slate-400'
                }`}>
                  {h.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
