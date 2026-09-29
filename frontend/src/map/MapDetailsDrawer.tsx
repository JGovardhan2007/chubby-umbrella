import React from 'react';
import { X, Check } from 'lucide-react';
import { LayerToggleState } from '../types/weather';

export interface MapDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBasemap: 'positron' | 'satellite' | 'voyager' | 'dark';
  onSelectBasemap: (id: 'positron' | 'satellite' | 'voyager' | 'dark') => void;
  layers?: LayerToggleState;
  onToggleLayer?: (key: keyof LayerToggleState) => void;
}

export const MapDetailsDrawer: React.FC<MapDetailsDrawerProps> = ({
  isOpen,
  onClose,
  selectedBasemap,
  onSelectBasemap,
  layers,
  onToggleLayer
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute right-14 top-0 z-40 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 select-none animate-in fade-in slide-in-from-right-3 duration-200 font-sans max-h-[82vh] flex flex-col overflow-hidden">
      {/* 1. FIXED HEADER (Never scrolls or gets clipped by scrollbars) */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0 bg-white z-10">
        <h3 className="text-base font-semibold text-slate-900 tracking-tight">
          Map details
        </h3>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          title="Close map details"
        >
          <X className="w-4.5 h-4.5 stroke-[2.2]" />
        </button>
      </div>

      {/* 2. SCROLLABLE INNER BODY */}
      <div className="p-4 pt-3 overflow-y-auto overflow-x-hidden flex-1 space-y-4">
        {/* SECTION 1: MAP TYPE (Top Priority - Google Maps Style Basemaps) */}
        <div>
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
            Map type
          </h4>
          <div className="grid grid-cols-2 gap-2.5">
            {/* Default / Streets */}
            <MapTypeCard
              label="Default"
              description="Clean streets"
              isSelected={selectedBasemap === 'positron'}
              onClick={() => onSelectBasemap('positron')}
              graphic={
                <svg className="w-full h-full" viewBox="0 0 100 64" fill="none">
                  <rect width="100" height="64" fill="#E8F4F8" />
                  <path d="M0 35 Q 35 15 70 30 T 100 20 L 100 64 L 0 64 Z" fill="#F8FAFC" />
                  <path d="M20 0 L 40 64" stroke="#CBD5E1" strokeWidth="6" />
                  <path d="M0 25 L 100 45" stroke="#94A3B8" strokeWidth="4" />
                  <path d="M50 0 Q 60 30 100 35" stroke="#38BDF8" strokeWidth="3.5" />
                  <circle cx="55" cy="30" r="3.5" fill="#EF4444" />
                </svg>
              }
            />

            {/* Satellite */}
            <MapTypeCard
              label="Satellite"
              description="Earth imagery"
              isSelected={selectedBasemap === 'satellite'}
              onClick={() => onSelectBasemap('satellite')}
              graphic={
                <svg className="w-full h-full" viewBox="0 0 100 64" fill="none">
                  <rect width="100" height="64" fill="#1B2E24" />
                  <path d="M0 20 Q 30 5 60 25 T 100 15 L 100 64 L 0 64 Z" fill="#2E4A38" />
                  <path d="M15 0 Q 30 35 45 64" stroke="#475569" strokeWidth="5" />
                  <path d="M0 35 Q 50 20 100 45" stroke="#64748B" strokeWidth="3" strokeDasharray="4 2" />
                  <circle cx="75" cy="25" r="14" fill="#0D3B2E" />
                  <path d="M70 45 Q 85 55 100 50" stroke="#94A3B8" strokeWidth="2" />
                </svg>
              }
            />

            {/* Terrain */}
            <MapTypeCard
              label="Terrain"
              description="Topography & relief"
              isSelected={selectedBasemap === 'voyager'}
              onClick={() => onSelectBasemap('voyager')}
              graphic={
                <svg className="w-full h-full" viewBox="0 0 100 64" fill="none">
                  <rect width="100" height="64" fill="#F1F5F9" />
                  <path d="M0 50 Q 25 20 50 35 T 100 20 L 100 64 L 0 64 Z" fill="#E2E8F0" />
                  <path d="M10 55 Q 30 30 55 45 T 95 30" stroke="#94A3B8" strokeWidth="2.5" fill="none" />
                  <path d="M25 60 Q 45 40 70 52" stroke="#64748B" strokeWidth="2" fill="none" />
                  <path d="M0 30 Q 30 45 70 20 T 100 40" stroke="#0284C7" strokeWidth="2.5" fill="none" />
                </svg>
              }
            />

            {/* Dark Mode */}
            <MapTypeCard
              label="Dark"
              description="High contrast"
              isSelected={selectedBasemap === 'dark'}
              onClick={() => onSelectBasemap('dark')}
              graphic={
                <svg className="w-full h-full" viewBox="0 0 100 64" fill="none">
                  <rect width="100" height="64" fill="#0B0F19" />
                  <path d="M0 30 Q 35 15 70 30 T 100 20 L 100 64 L 0 64 Z" fill="#1E293B" />
                  <path d="M15 0 L 40 64" stroke="#334155" strokeWidth="4" />
                  <path d="M0 35 L 100 45" stroke="#475569" strokeWidth="3" />
                  <path d="M50 0 Q 60 30 100 35" stroke="#38BDF8" strokeWidth="2" />
                  <circle cx="55" cy="30" r="3" fill="#38BDF8" />
                </svg>
              }
            />
          </div>
        </div>

        {/* SECTION 2: MAP DETAILS & OVERLAYS (Weather & Radar GIS Layers) */}
        <div className="pt-3 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
            Map details
          </h4>
          <div className="grid grid-cols-3 gap-2 text-center">
            {/* 1. Doppler Radar */}
            <LayerItem
              label="Radar"
              subLabel="Doppler"
              active={layers?.radarReflectivity ?? true}
              onClick={() => onToggleLayer && onToggleLayer('radarReflectivity')}
              icon={
                <svg className="w-10 h-10" viewBox="0 0 48 48" fill="none">
                  <rect width="48" height="48" rx="12" fill="#E0F2FE" />
                  <path d="M0 24h48" stroke="#0284C7" strokeWidth="3" />
                  <path d="M0 32h48" stroke="#6366F1" strokeWidth="2" />
                  <circle cx="24" cy="24" r="8" fill="#0284C7" />
                  <circle cx="24" cy="24" r="4" fill="#FFFFFF" />
                  <circle cx="12" cy="16" r="3" fill="#38BDF8" />
                </svg>
              }
            />

            {/* 2. Lightning Strikes */}
            <LayerItem
              label="Lightning"
              subLabel="Flashes"
              active={layers?.lightningFlashes ?? true}
              onClick={() => onToggleLayer && onToggleLayer('lightningFlashes')}
              icon={
                <svg className="w-10 h-10" viewBox="0 0 48 48" fill="none">
                  <rect width="48" height="48" rx="12" fill="#FEF3C7" />
                  <circle cx="24" cy="24" r="16" stroke="#F59E0B" strokeWidth="3" strokeDasharray="3 3" />
                  <path d="M26 10l-9 16h8l-4 12 13-18h-8l5-10z" fill="#D97706" />
                </svg>
              }
            />

            {/* 3. Storm Tracks */}
            <LayerItem
              label="Tracks"
              subLabel="Vectors"
              active={layers?.stormTracks ?? true}
              onClick={() => onToggleLayer && onToggleLayer('stormTracks')}
              icon={
                <svg className="w-10 h-10" viewBox="0 0 48 48" fill="none">
                  <rect width="48" height="48" rx="12" fill="#DCFCE7" />
                  <circle cx="24" cy="24" r="12" stroke="#16A34A" strokeWidth="2.5" fill="#BBF7D0" />
                  <path d="M14 34c5-10 14-10 20-20" stroke="#15803D" strokeWidth="3" strokeLinecap="round" />
                  <circle cx="34" cy="14" r="3" fill="#15803D" />
                </svg>
              }
            />

            {/* 4. Storm Cells */}
            <LayerItem
              label="Storm Cells"
              subLabel="Centroids"
              active={layers?.stormCells ?? true}
              onClick={() => onToggleLayer && onToggleLayer('stormCells')}
              icon={
                <svg className="w-10 h-10" viewBox="0 0 48 48" fill="none">
                  <rect width="48" height="48" rx="12" fill="#FFEDD5" />
                  <circle cx="24" cy="24" r="12" fill="#EA580C" />
                  <circle cx="24" cy="24" r="5" fill="#FFFFFF" />
                </svg>
              }
            />

            {/* 5. Hazard Risk Zones */}
            <LayerItem
              label="Hazards"
              subLabel="Hail/Wind"
              active={layers?.hazardZones ?? true}
              onClick={() => onToggleLayer && onToggleLayer('hazardZones')}
              icon={
                <svg className="w-10 h-10" viewBox="0 0 48 48" fill="none">
                  <rect width="48" height="48" rx="12" fill="#FEE2E2" />
                  <circle cx="24" cy="24" r="12" fill="#DC2626" />
                  <path d="M24 15c2 4 4 6 4 9 0 2.5-1.8 4.5-4 4.5s-4-2-4-4.5c0-3 2-5 4-9z" fill="#FFFFFF" />
                </svg>
              }
            />

            {/* 6. Cloud IR (Thermal Top) */}
            <LayerItem
              label="Cloud IR"
              subLabel="Top Temp"
              active={layers?.satelliteIR ?? true}
              onClick={() => onToggleLayer && onToggleLayer('satelliteIR')}
              icon={
                <svg className="w-10 h-10" viewBox="0 0 48 48" fill="none">
                  <rect width="48" height="48" rx="12" fill="#E0E7FF" />
                  <circle cx="24" cy="24" r="12" fill="#4F46E5" />
                  <path d="M16 23c2-2 4-2 6 0s4 2 6 0M16 28c2-2 4-2 6 0s4 2 6 0" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              }
            />
          </div>
        </div>

        {/* SECTION 3: MAP TOOLS */}
        <div className="pt-3 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
            Map tools
          </h4>
          <div className="grid grid-cols-2 gap-2 text-center pb-1">
            {/* Travel time / Isochrone */}
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 transition-colors cursor-pointer group">
              <div className="w-9 h-9 rounded-lg bg-sky-100 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <path d="M12 4c-3.5 0-6 2.5-6 6 0 4.5 6 9.5 6 9.5s6-5 6-9.5c0-3.5-2.5-6-6-6z" stroke="#0284C7" strokeWidth="1.8" strokeDasharray="2 2" fill="#BAE6FD" fillOpacity="0.4" />
                  <circle cx="12" cy="10" r="2" fill="#EF4444" />
                </svg>
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold text-slate-800 leading-tight">Travel time</div>
                <div className="text-[10px] text-slate-500">Isochrone reach</div>
              </div>
            </div>

            {/* Distance Measure */}
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 transition-colors cursor-pointer group">
              <div className="w-9 h-9 rounded-lg bg-sky-100 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <path d="M4 20L20 4" stroke="#0F172A" strokeWidth="2.2" strokeLinecap="round" />
                  <path d="M8 14l2 2M12 10l2 2M16 6l2 2" stroke="#0284C7" strokeWidth="1.8" />
                  <circle cx="4" cy="20" r="2" fill="#0284C7" />
                  <circle cx="20" cy="4" r="2" fill="#0284C7" />
                </svg>
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold text-slate-800 leading-tight">Measure</div>
                <div className="text-[10px] text-slate-500">Distance ruler</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface LayerItemProps {
  label: string;
  subLabel?: string;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}

const LayerItem: React.FC<LayerItemProps> = ({ label, subLabel, active, onClick, icon }) => {
  return (
    <div onClick={onClick} className="flex flex-col items-center cursor-pointer group select-none">
      <div className={`w-13 h-13 rounded-2xl flex items-center justify-center transition-all p-1 border-2 ${
        active
          ? 'border-sky-500 shadow-md ring-2 ring-sky-500/20 bg-sky-50/40 scale-102'
          : 'border-slate-200 opacity-60 group-hover:opacity-100 group-hover:border-slate-300'
      }`}>
        {icon}
      </div>
      <span className={`text-[11px] mt-1 font-semibold leading-tight ${active ? 'text-sky-700 font-bold' : 'text-slate-600'}`}>
        {label}
      </span>
      {subLabel && (
        <span className="text-[9px] text-slate-400 font-medium">
          {subLabel}
        </span>
      )}
    </div>
  );
};

interface MapTypeCardProps {
  label: string;
  description?: string;
  isSelected: boolean;
  onClick: () => void;
  graphic: React.ReactNode;
}

const MapTypeCard: React.FC<MapTypeCardProps> = ({
  label,
  description,
  isSelected,
  onClick,
  graphic
}) => {
  return (
    <div onClick={onClick} className="flex flex-col items-start cursor-pointer group select-none">
      <div className={`relative w-full h-18 rounded-xl overflow-hidden transition-all border-2 shadow-xs ${
        isSelected
          ? 'border-sky-500 ring-2 ring-sky-500/30 shadow-md scale-[1.02]'
          : 'border-slate-200 group-hover:border-slate-300'
      }`}>
        {graphic}
        {isSelected && (
          <div className="absolute top-1.5 right-1.5 w-4.5 h-4.5 bg-sky-500 rounded-full flex items-center justify-center text-white shadow-xs">
            <Check className="w-3 h-3 stroke-[3]" />
          </div>
        )}
      </div>
      <div className="mt-1 text-left">
        <div className={`text-xs font-bold leading-tight ${
          isSelected ? 'text-sky-600' : 'text-slate-800 group-hover:text-slate-900'
        }`}>
          {label}
        </div>
        {description && (
          <div className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">
            {description}
          </div>
        )}
      </div>
    </div>
  );
};
