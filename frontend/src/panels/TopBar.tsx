import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Navigation, ChevronDown, Crosshair } from 'lucide-react';
import { SystemStatusData } from '../types/weather';
import { ALL_INDIAN_LOCATIONS, LocationOption, MAJOR_RADAR_CITIES } from '../data/locations/indianLocations';

export type { LocationOption };
export { MAJOR_RADAR_CITIES, ALL_INDIAN_LOCATIONS };

interface TopBarProps {
  systemStatus: SystemStatusData | null;
  mode: 'replay' | 'live' | 'demo';
  onModeChange: (mode: 'replay' | 'live' | 'demo') => void;
  currentTimeLabel: string;
  isBackendConnected: boolean;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  onSelectCity?: (loc: LocationOption) => void;
  onUseGPS?: () => void;
  currentLocationName?: string;
  onReturnHome?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  systemStatus,
  mode,
  onModeChange,
  currentTimeLabel,
  isBackendConnected,
  searchQuery = '',
  onSearchChange,
  onSelectCity,
  onUseGPS,
  currentLocationName = 'Chennai',
  onReturnHome
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCities = ALL_INDIAN_LOCATIONS.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.radarStation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCityClick = (city: LocationOption) => {
    if (onSelectCity) {
      onSelectCity(city);
    }
    if (onSearchChange) {
      onSearchChange('');
    }
    setIsDropdownOpen(false);
  };

  const handleGPSClick = () => {
    if (onUseGPS) {
      onUseGPS();
    }
    if (onSearchChange) {
      onSearchChange('');
    }
    setIsDropdownOpen(false);
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-30 select-none shadow-xs">
      {/* 1. Left: Weather Intelligence Header */}
      <div className="flex items-center gap-3">
        {onReturnHome && (
          <button
            onClick={onReturnHome}
            title="Return to NCMRWF & IMD Portal Home"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition-colors"
          >
            <span>← Portal Home</span>
          </button>
        )}
        <div
          onClick={onReturnHome}
          className={`flex items-center gap-3 ${onReturnHome ? 'cursor-pointer group' : ''}`}
        >
          <div className="w-9 h-9 rounded-xl overflow-hidden border border-slate-200 shadow-sm flex items-center justify-center shrink-0 bg-slate-900 group-hover:ring-2 group-hover:ring-amber-500 transition-all">
            <img
              src="/favicon.png"
              alt="Convective Nowcast Logo"
              className="w-full h-full object-cover scale-105"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-slate-900 font-sans leading-none group-hover:text-amber-700 transition-colors">
              Convective Nowcast
            </span>
            <span className="text-[11px] font-medium text-slate-500 mt-0.5">
              Severe Storm, Hail & Cloudburst Intelligence
            </span>
          </div>
        </div>
      </div>

      {/* 2. Center: Search Bar & City Selector Dropdown & Live GPS */}
      <div className="flex-1 max-w-xl mx-6 relative" ref={dropdownRef}>
        <div className="relative flex items-center w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
          <input
            type="text"
            placeholder="Search city, radar station, or use GPS..."
            value={searchQuery}
            onFocus={() => setIsDropdownOpen(true)}
            onChange={(e) => {
              if (onSearchChange) onSearchChange(e.target.value);
              setIsDropdownOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && filteredCities.length > 0) {
                handleCityClick(filteredCities[0]);
              }
            }}
            className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-full pl-11 pr-32 py-2 text-xs text-slate-700 placeholder-slate-400 transition-all shadow-xs outline-none"
          />

          {/* Current selected city badge / GPS trigger */}
          <div className="absolute right-2 flex items-center gap-1">
            <button
              type="button"
              onClick={handleGPSClick}
              title="Locate Me (Live GPS)"
              className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-full transition-colors"
            >
              <Crosshair className="w-3.5 h-3.5" />
            </button>
            <div
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-full flex items-center gap-1 cursor-pointer text-[11px] font-semibold text-amber-800 hover:bg-amber-100 transition-colors"
            >
              <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
              <span className="truncate max-w-[85px]">{currentLocationName}</span>
              <ChevronDown className="w-3 h-3 text-amber-600 shrink-0" />
            </div>
          </div>
        </div>

        {/* City Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute top-12 left-0 right-0 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 max-h-80 overflow-y-auto animate-in fade-in duration-150">
            {/* GPS Locate Item */}
            <div
              onClick={handleGPSClick}
              className="px-3 py-2.5 mb-1 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 hover:border-amber-300 cursor-pointer flex items-center justify-between group transition-all"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
                  <Navigation className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    <span>Use My Current Location</span>
                    <span className="text-[10px] bg-amber-200/80 text-amber-900 px-1.5 py-0.2 rounded font-semibold">Live GPS</span>
                  </div>
                  <div className="text-[10px] text-amber-700/80">
                    Auto-detect system coordinates & trigger live nowcast
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-amber-700 group-hover:translate-x-0.5 transition-transform">
                Detect →
              </span>
            </div>

            <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Radar Domains & Target Locations ({filteredCities.length})
            </div>
            {filteredCities.map((city) => (
              <div
                key={city.name}
                onClick={() => handleCityClick(city)}
                className="px-3 py-2 rounded-xl hover:bg-slate-50 cursor-pointer flex items-center justify-between group transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-amber-100 flex items-center justify-center text-slate-600 group-hover:text-amber-700 transition-colors">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 group-hover:text-amber-900">
                      {city.name}, <span className="font-normal text-slate-500">{city.state}</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {city.radarStation} • {city.lat.toFixed(2)}°N, {city.lon.toFixed(2)}°E
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-medium text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  Jump to location →
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Right: Functional Controls & Live Mode */}
      <div className="flex items-center gap-3">
        {/* Backend Status Indicator */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border ${
          isBackendConnected
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : 'bg-amber-50 border-amber-200 text-amber-700'
        }`}>
          <span className={`w-2 h-2 rounded-full ${isBackendConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          <span>{isBackendConnected ? 'System Online' : 'Local Replay'}</span>
        </div>

        {/* Replay vs Live Mode Switcher */}
        <div className="flex items-center bg-slate-100 border border-slate-200 rounded-full p-0.5 text-xs font-sans">
          <button
            onClick={() => onModeChange('replay')}
            className={`px-3 py-1 rounded-full transition-all text-xs font-medium ${
              mode === 'replay'
                ? 'bg-white text-slate-900 font-semibold shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Replay
          </button>
          <button
            onClick={() => onModeChange('live')}
            className={`px-3 py-1 rounded-full transition-all text-xs font-medium flex items-center gap-1 ${
              mode === 'live'
                ? 'bg-amber-500 text-white font-semibold shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
            Live Feed
          </button>
        </div>

        {/* Valid Time */}
        <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full text-xs font-mono font-semibold text-slate-700">
          {currentTimeLabel}
        </div>
      </div>
    </header>
  );
};
