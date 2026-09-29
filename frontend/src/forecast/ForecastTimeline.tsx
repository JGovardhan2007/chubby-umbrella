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
    <div className="bg-[#111827] border-t border-[#1F293D] px-4 py-2.5 flex items-center justify-between gap-4 select-none z-20">
      {/* Playback Controls */}
      <div className="flex items-center gap-2 border-r border-[#1F293D] pr-4">
        <button
          onClick={onRestart}
          title="Restart Replay"
          className="p-1.5 rounded text-slate-400 hover:text-slate-100 hover:bg-[#1E293B] transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={onTogglePlay}
          disabled={isLiveMode}
          title={isPlaying ? "Pause Replay" : "Play Replay"}
          className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold tracking-wider transition-colors ${
            isLiveMode
              ? 'bg-[#1E293B] text-slate-500 cursor-not-allowed'
              : isPlaying
              ? 'bg-amber-600/80 hover:bg-amber-600 text-white'
              : 'bg-sky-600 hover:bg-sky-500 text-white'
          }`}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          {isPlaying ? 'PAUSE' : 'PLAY'}
        </button>

        {/* Speed Selector */}
        <div className="flex items-center bg-[#0B0F19] border border-[#1F293D] rounded p-0.5 ml-1">
          {[1, 2, 5].map((spd) => (
            <button
              key={spd}
              onClick={() => onSpeedChange(spd)}
              className={`px-2 py-0.5 text-[11px] font-mono rounded ${
                replaySpeed === spd
                  ? 'bg-[#1E293B] text-sky-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>

        {/* Current Replay Timestamp */}
        <div className="flex items-center gap-1.5 ml-3 font-mono text-xs text-slate-300">
          <Clock className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-slate-400 text-[11px]">T_VALID:</span>
          <span className="font-semibold text-slate-100 bg-[#0B0F19] px-2 py-0.5 rounded border border-[#1F293D]">
            {currentTimeLabel}
          </span>
        </div>
      </div>

      {/* Forecast Horizons Timeline Bar */}
      <div className="flex-1 flex items-center justify-between gap-1 overflow-x-auto">
        <div className="text-[11px] font-mono uppercase text-slate-400 tracking-wider mr-2 shrink-0">
          LEAD TIME HORIZONS:
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
                className={`flex-1 py-1 px-2 rounded flex flex-col items-center justify-center transition-all border ${
                  isSelected
                    ? 'bg-sky-950/80 border-sky-500 text-sky-300 shadow-sm'
                    : 'bg-[#0B0F19] border-[#1F293D] text-slate-400 hover:border-slate-600 hover:text-slate-200'
                }`}
              >
                <span className={`font-mono text-xs font-bold ${isSelected ? 'text-sky-300' : 'text-slate-200'}`}>
                  {h.label}
                </span>
                <span className={`text-[9px] uppercase tracking-tighter ${
                  isObserved ? 'text-emerald-400' : isUncertain ? 'text-amber-400' : 'text-slate-400'
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
