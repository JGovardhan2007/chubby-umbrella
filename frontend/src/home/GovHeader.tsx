import React from 'react';
import { Shield, Radio, Activity } from 'lucide-react';

export const GovHeader: React.FC = () => {
  return (
    <div className="bg-[#FAF5EE] border-b border-amber-900/10 px-4 md:px-8 py-2.5 flex items-center justify-between select-none">
      {/* 1. Left: National Emblem & Ministry / Centre Title */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* Ashoka Lion Capital (State Emblem of India) Vector */}
        <div className="flex flex-col items-center justify-center shrink-0">
          <svg
            className="w-9 h-11 text-amber-900"
            viewBox="0 0 100 120"
            fill="currentColor"
            aria-label="State Emblem of India"
          >
            {/* Stylized National Emblem */}
            <path d="M50 5 C45 5 40 10 40 16 C40 22 45 27 50 27 C55 27 60 22 60 16 C60 10 55 5 50 5 Z" />
            <path d="M30 18 C26 18 22 22 22 28 C22 34 26 38 30 38 C34 38 38 34 38 28 C38 22 34 18 30 18 Z" opacity="0.8" />
            <path d="M70 18 C66 18 62 22 62 28 C62 34 66 38 70 38 C74 38 78 34 78 28 C78 22 74 18 70 18 Z" opacity="0.8" />
            <rect x="25" y="44" width="50" height="14" rx="3" />
            {/* Ashoka Chakra */}
            <circle cx="50" cy="51" r="5" fill="#FAF5EE" />
            {/* Base Pedestal */}
            <path d="M20 62 L80 62 L74 74 L26 74 Z" />
            <rect x="22" y="76" width="56" height="5" rx="1" />
            <text x="50" y="93" textAnchor="middle" fontSize="9" fontWeight="bold" fontFamily="serif">GOVERNMENT OF INDIA</text>
          </svg>
        </div>

        {/* Titles in Pure English */}
        <div className="flex flex-col">
          <h1 className="text-sm md:text-base font-bold text-amber-950 font-serif leading-tight tracking-tight">
            Convective Weather Early Warning Portal
          </h1>
          <div className="flex items-center gap-1.5 text-xs text-amber-900/80 font-medium">
            <span>Ministry of Earth Sciences</span>
            <span>•</span>
            <span className="text-slate-600">Government of India</span>
          </div>
        </div>
      </div>

      {/* 2. Right: Official Weather Informatics + IMD Badges */}
      <div className="hidden lg:flex items-center gap-4">
        {/* Weather Informatics Logo Emblem */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/80 rounded-xl border border-amber-900/10 shadow-2xs">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 to-orange-400 flex items-center justify-center text-white font-bold text-xs shadow-inner">
            ⚡
          </div>
          <div className="text-left">
            <div className="text-[11px] font-bold text-amber-950 tracking-wider">EARTH SCIENCES</div>
            <div className="text-[9px] text-slate-500 font-medium">Weather Informatics</div>
          </div>
        </div>

        {/* IMD Collaboration Partner */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50/80 rounded-xl border border-blue-200/80 shadow-2xs">
          <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-white font-bold text-xs shadow-inner">
            🌧️
          </div>
          <div>
            <div className="text-[11px] font-bold text-blue-950">IMD Mausam</div>
            <div className="text-[9px] text-blue-700">Convective Intelligence</div>
          </div>
        </div>

        {/* Live Operational Status */}
        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Operational Portal</span>
        </div>
      </div>
    </div>
  );
};
