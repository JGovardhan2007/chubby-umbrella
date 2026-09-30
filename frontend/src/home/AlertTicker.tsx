import React, { useState } from 'react';
import { AlertTriangle, Pause, Play, ChevronRight, ShieldAlert } from 'lucide-react';

interface AlertTickerProps {
  onAlertClick?: (alertText: string) => void;
}

export const AlertTicker: React.FC<AlertTickerProps> = ({ onAlertClick }) => {
  const [isPaused, setIsPaused] = useState(false);

  const alerts = [
    {
      id: 1,
      severity: 'SEVERE',
      type: 'THUNDERSTORM & HAIL',
      region: 'Gangetic West Bengal, Odisha & Jharkhand',
      validity: 'Valid: 14:00 UTC - 20:00 UTC (Next 0-6 hrs)',
      details: 'Convective storm cells with reflectivity > 52 dBZ, potential severe hail (POSH 85%) & gusty winds up to 65 km/h.',
    },
    {
      id: 2,
      severity: 'HIGH',
      type: 'CLOUDBURST RISK',
      region: 'Sub-Himalayan West Bengal & Uttarakhand Foothills',
      validity: 'Valid: 15:30 UTC - 21:00 UTC',
      details: 'Intense localized precipitation rate exceeding 60 mm/hr detected via radar-satellite mixed-phase cooling.',
    },
    {
      id: 3,
      severity: 'WARNING',
      type: 'DOWNBURST / SQUALL',
      region: 'Coastal Andhra Pradesh & North Tamil Nadu',
      validity: 'Valid: 16:00 UTC - 22:00 UTC',
      details: 'Radial velocity shear ΔV > 21 m/s indicates sudden severe downburst winds near coastal clusters.',
    },
  ];

  return (
    <div className="bg-gradient-to-r from-red-700 via-rose-700 to-amber-700 text-white shadow-md border-y border-red-800/40 select-none">
      <div className="flex items-center px-4 py-2">
        {/* Live Alert Badge */}
        <div className="flex items-center gap-2 pr-3 border-r border-red-400/40 shrink-0 z-10 bg-red-700">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400"></span>
          </span>
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-200">
              Emergency Warning
            </span>
          </div>
        </div>

        {/* Scrolling Ticker Text */}
        <div
          className="flex-1 overflow-hidden relative mx-3 cursor-pointer"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div
            className={`flex items-center gap-10 whitespace-nowrap text-xs font-medium transition-all ${
              isPaused ? '' : 'animate-marquee'
            }`}
          >
            {/* Duplicated for seamless infinite ticker looping */}
            {[...alerts, ...alerts].map((alert, idx) => (
              <div
                key={`${alert.id}-${idx}`}
                onClick={() => onAlertClick && onAlertClick(alert.details)}
                className="inline-flex items-center gap-2 hover:text-amber-200 transition-colors"
              >
                <span className="px-1.5 py-0.5 rounded bg-black/30 border border-white/20 text-[10px] font-bold text-amber-300 tracking-wide">
                  [{alert.severity}: {alert.type}]
                </span>
                <span className="font-semibold text-white">{alert.region}</span>
                <span className="text-amber-200/90 text-[11px]">({alert.validity}):</span>
                <span className="text-red-100">{alert.details}</span>
                <span className="text-amber-400 font-bold ml-3">•</span>
              </div>
            ))}
          </div>
        </div>

        {/* Ticker Controls */}
        <div className="flex items-center gap-1 pl-2 border-l border-red-400/40 shrink-0 z-10 bg-amber-700">
          <button
            onClick={() => setIsPaused(!isPaused)}
            title={isPaused ? 'Resume Ticker' : 'Pause Ticker'}
            className="p-1 hover:bg-black/20 rounded transition-colors text-amber-200"
          >
            {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
          </button>
        </div>
      </div>
    </div>
  );
};
