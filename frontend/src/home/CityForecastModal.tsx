import React from 'react';
import { X, CloudRain, Wind, Droplets, Thermometer, ShieldAlert, ArrowRight, Sun, CloudLightning } from 'lucide-react';

export interface CityWeatherRecord {
  city: string;
  cityHi: string;
  condition: string;
  temp: string;
  windDirection: string;
  windSpeed: string;
  humidity: string;
  pressure?: string;
  forecastSummary?: string;
  lat: number;
  lon: number;
}

interface CityForecastModalProps {
  city: CityWeatherRecord | null;
  onClose: () => void;
  onOpenMap: (city: CityWeatherRecord) => void;
}

export const CityForecastModal: React.FC<CityForecastModalProps> = ({
  city,
  onClose,
  onOpenMap,
}) => {
  if (!city) return null;

  const hourlyForecast = [
    { time: 'Now', temp: city.temp, condition: city.condition, rainProb: '35%' },
    { time: '+1h', temp: '30.2 °C', condition: 'Thunderstorm', rainProb: '80%' },
    { time: '+2h', temp: '28.5 °C', condition: 'Heavy Rain', rainProb: '90%' },
    { time: '+3h', temp: '27.4 °C', condition: 'Scattered Rain', rainProb: '65%' },
    { time: '+4h', temp: '26.8 °C', condition: 'Cloudy', rainProb: '40%' },
    { time: '+5h', temp: '26.5 °C', condition: 'Partly Cloudy', rainProb: '20%' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none animate-in fade-in">
      <div className="bg-[#0D253A] border border-cyan-500/30 text-white rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-[#081B2B] px-6 py-4 flex items-center justify-between border-b border-cyan-800/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-cyan-300">
              <CloudLightning className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                <span>{city.city} ({city.cityHi})</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-900/60 text-cyan-300 border border-cyan-700/50">
                  IMD Official Guidance
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Lat: {city.lat.toFixed(2)}°N, Lon: {city.lon.toFixed(2)}°E • Synoptic Station
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Metrics Overview */}
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#0B1E30] p-3 rounded-xl border border-slate-700/60">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                <span>Temperature</span>
              </div>
              <div className="text-xl font-extrabold text-white mt-1">{city.temp}</div>
              <div className="text-[11px] text-amber-300">{city.condition}</div>
            </div>

            <div className="bg-[#0B1E30] p-3 rounded-xl border border-slate-700/60">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Wind className="w-3.5 h-3.5 text-cyan-400" />
                <span>Wind</span>
              </div>
              <div className="text-base font-bold text-white mt-1">{city.windSpeed}</div>
              <div className="text-[11px] text-cyan-300">{city.windDirection}</div>
            </div>

            <div className="bg-[#0B1E30] p-3 rounded-xl border border-slate-700/60">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Droplets className="w-3.5 h-3.5 text-blue-400" />
                <span>Humidity</span>
              </div>
              <div className="text-xl font-extrabold text-white mt-1">{city.humidity}</div>
              <div className="text-[11px] text-blue-300">Relative (RH)</div>
            </div>

            <div className="bg-[#0B1E30] p-3 rounded-xl border border-slate-700/60">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>Convective Alert</span>
              </div>
              <div className="text-sm font-bold text-rose-300 mt-1">Thunderstorm</div>
              <div className="text-[11px] text-slate-400">POSH: 70%</div>
            </div>
          </div>

          {/* 6-Hour Nowcast Outlook */}
          <div>
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center justify-between">
              <span>0–6 Hour Probabilistic Nowcast Outlook</span>
              <span className="text-[10px] text-cyan-400">Doppler Radar & Satellite Blended</span>
            </div>

            <div className="grid grid-cols-6 gap-2">
              {hourlyForecast.map((step, idx) => (
                <div
                  key={idx}
                  className="bg-[#0A1A28] border border-slate-800 p-2 rounded-xl text-center flex flex-col items-center justify-between"
                >
                  <span className="text-[10px] font-semibold text-slate-400">{step.time}</span>
                  <div className="my-1">
                    <CloudRain className="w-4 h-4 text-cyan-400 mx-auto" />
                  </div>
                  <span className="text-xs font-bold text-white">{step.temp}</span>
                  <span className="text-[9px] font-semibold text-blue-300 mt-0.5">{step.rainProb}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Button: Jump to Live Map */}
          <div className="pt-2">
            <button
              onClick={() => {
                onOpenMap(city);
                onClose();
              }}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-extrabold text-xs md:text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              <span>Launch Live Convective Doppler Radar for {city.city}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
