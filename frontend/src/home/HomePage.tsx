import React from 'react';
import { GovHeader } from './GovHeader';
import { AlertTicker } from './AlertTicker';
import { GuidanceMap } from './GuidanceMap';
import { MajorCitiesWeather } from './MajorCitiesWeather';
import { ShieldCheck, CloudRain, Radio, Layers, Activity, ArrowRight } from 'lucide-react';

interface HomePageProps {
  onNavigateToMap: (city?: { name: string; lat: number; lon: number }) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigateToMap }) => {
  return (
    <div className="flex-1 overflow-y-auto bg-[#F4EFEA] text-slate-900 flex flex-col font-sans select-none">
      {/* 1. Emergency Alert Ticker */}
      <AlertTicker
        onAlertClick={(alertText) => {
          onNavigateToMap();
        }}
      />

      {/* 2. Main 2-Column Split Content Area */}
      <div className="max-w-7xl mx-auto w-full px-4 md:px-6 py-6 flex-1 flex flex-col gap-6">
        {/* Top Briefing Banner */}
        <div className="bg-white rounded-2xl p-4 border border-amber-900/10 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-sm">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm md:text-base font-bold text-amber-950 font-serif">
                राष्ट्रीय संवहनीय मौसम पूर्वचेतावनी एवं विश्लेषण प्रणाली
              </h2>
              <p className="text-xs text-slate-600">
                0–6 Hour Probabilistic Nowcasting for Severe Thunderstorms, Hail, Downbursts & Cloudbursts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigateToMap()}
              className="px-4 py-2 bg-[#DF691A] hover:bg-orange-600 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
            >
              <span>मौसम मानचित्र खोलें (Launch Radar GIS)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2-Columns Grid: Left = NCMRWF Guidance Map, Right = IMD Major Cities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* LEFT: "मौसम मार्गदर्शन पोर्टल" Guidance Map with Animated Wind Streamlines */}
          <section className="flex flex-col">
            <GuidanceMap onNavigateToMap={onNavigateToMap} />
          </section>

          {/* RIGHT: "CURRENT WEATHER ACROSS MAJOR CITIES" IMD Blue Weather Cards */}
          <section className="flex flex-col">
            <MajorCitiesWeather onOpenMapForCity={onNavigateToMap} />
          </section>
        </div>

        {/* 3. Operational Scientific Capabilities & Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
          <div className="bg-white p-4 rounded-xl border border-amber-900/10 shadow-2xs">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase mb-1">
              <Radio className="w-4 h-4 text-amber-600" />
              <span>DWR Doppler Radar</span>
            </div>
            <p className="text-xs text-slate-600">
              Reflectivity (dBZ) & radial velocity shear monitoring at 15-minute sweep intervals.
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-amber-900/10 shadow-2xs">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase mb-1">
              <Layers className="w-4 h-4 text-amber-600" />
              <span>INSAT-3D / 3DR Geostationary</span>
            </div>
            <p className="text-xs text-slate-600">
              TIR1, TIR2 & Water Vapor brightness temperature cloud-top cooling diagnostics.
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-amber-900/10 shadow-2xs">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase mb-1">
              <CloudRain className="w-4 h-4 text-amber-600" />
              <span>Hail POSH & Cloudburst</span>
            </div>
            <p className="text-xs text-slate-600">
              Marshall-Palmer extreme rain rate & mixed-phase reflectivity severe hail estimators.
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-amber-900/10 shadow-2xs">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase mb-1">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>Hungarian Centroid Tracker</span>
            </div>
            <p className="text-xs text-slate-600">
              Kinematic storm motion vectors, speed, heading, and lead-time decay confidence.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Official Footer */}
      <footer className="bg-[#2E1F14] text-[#E8DCCD] py-5 px-6 border-t border-amber-900/20 text-xs mt-auto select-none">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
          <div className="flex flex-col">
            <span className="font-bold text-white">
              राष्ट्रीय मध्यम अवधि मौसम पूर्वानुमान केंद्र (NCMRWF) • भारत मौसम विज्ञान विभाग (IMD)
            </span>
            <span className="text-[11px] text-amber-200/70">
              पृथ्वी विज्ञान मंत्रालय, भारत सरकार (Ministry of Earth Sciences, Govt. of India)
            </span>
          </div>

          <div className="text-[11px] text-amber-200/70">
            Smart India Hackathon 2024 / 2026 (Problem Statement 26084) • Convective Nowcasting System
          </div>
        </div>
      </footer>
    </div>
  );
};
