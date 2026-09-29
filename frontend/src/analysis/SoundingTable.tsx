import React from 'react';
import { StationSoundingData } from './types';
import { Radio, ArrowUpRight, ShieldAlert } from 'lucide-react';

export const STATION_SOUNDING_RECORDS: StationSoundingData[] = [
  {
    station: 'Kolkata (Dum Dum)',
    state: 'West Bengal',
    cape: 3420,
    cin: 15,
    liftedIndex: -7.2,
    precipitableWater: 58.4,
    maxDbz: 54.0,
    severeRisk: 'Severe',
    timestamp: '12:00 UTC'
  },
  {
    station: 'Bhubaneswar',
    state: 'Odisha',
    cape: 2980,
    cin: 25,
    liftedIndex: -5.8,
    precipitableWater: 54.1,
    maxDbz: 49.5,
    severeRisk: 'High',
    timestamp: '12:00 UTC'
  },
  {
    station: 'Guwahati (Borjhar)',
    state: 'Assam',
    cape: 3120,
    cin: 20,
    liftedIndex: -6.5,
    precipitableWater: 62.0,
    maxDbz: 52.8,
    severeRisk: 'Severe',
    timestamp: '12:00 UTC'
  },
  {
    station: 'Delhi (Safdarjung)',
    state: 'Delhi NCR',
    cape: 840,
    cin: 110,
    liftedIndex: -1.2,
    precipitableWater: 32.5,
    maxDbz: 18.0,
    severeRisk: 'Low',
    timestamp: '12:00 UTC'
  },
  {
    station: 'Chennai (Meenambakkam)',
    state: 'Tamil Nadu',
    cape: 2450,
    cin: 40,
    liftedIndex: -4.5,
    precipitableWater: 49.2,
    maxDbz: 44.0,
    severeRisk: 'High',
    timestamp: '12:00 UTC'
  },
  {
    station: 'Pune (Pashan)',
    state: 'Maharashtra',
    cape: 1850,
    cin: 60,
    liftedIndex: -3.8,
    precipitableWater: 42.0,
    maxDbz: 36.5,
    severeRisk: 'Moderate',
    timestamp: '12:00 UTC'
  },
  {
    station: 'Ahmedabad',
    state: 'Gujarat',
    cape: 1420,
    cin: 85,
    liftedIndex: -2.4,
    precipitableWater: 38.6,
    maxDbz: 28.0,
    severeRisk: 'Moderate',
    timestamp: '12:00 UTC'
  },
  {
    station: 'Hyderabad (Begumpet)',
    state: 'Telangana',
    cape: 2280,
    cin: 35,
    liftedIndex: -4.1,
    precipitableWater: 46.5,
    maxDbz: 41.0,
    severeRisk: 'High',
    timestamp: '12:00 UTC'
  }
];

interface SoundingTableProps {
  onSelectStation?: (station: string) => void;
}

export const SoundingTable: React.FC<SoundingTableProps> = ({ onSelectStation }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Synoptic Radiosonde & Radar Sounding Station Diagnostics</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
              00Z / 12Z Observation Cycle
            </span>
          </h3>
          <p className="text-xs text-slate-500">
            Real-time atmospheric soundings showing CAPE, CIN, Lifted Index, and Radar Peak Reflectivity
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
          <span>8 Primary Synoptic Stations Synced</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
            <tr>
              <th className="py-3 px-4">Station & State</th>
              <th className="py-3 px-3">CAPE (J/kg)</th>
              <th className="py-3 px-3">CIN (J/kg)</th>
              <th className="py-3 px-3">Lifted Index</th>
              <th className="py-3 px-3">Precip Water (PW)</th>
              <th className="py-3 px-3">Radar Core (dBZ)</th>
              <th className="py-3 px-3">Convective Risk</th>
              <th className="py-3 px-4 text-right">Observation Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {STATION_SOUNDING_RECORDS.map((row) => (
              <tr key={row.station} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-4 font-bold text-slate-900">
                  {row.station}
                  <span className="block text-[11px] font-normal text-slate-500">{row.state}</span>
                </td>
                <td className="py-3 px-3 font-mono font-bold text-amber-600">
                  {row.cape}
                </td>
                <td className="py-3 px-3 font-mono text-slate-600">
                  {row.cin}
                </td>
                <td className="py-3 px-3 font-mono font-bold text-slate-700">
                  {row.liftedIndex}
                </td>
                <td className="py-3 px-3 font-mono text-slate-600">
                  {row.precipitableWater} mm
                </td>
                <td className="py-3 px-3 font-mono font-extrabold text-blue-700">
                  {row.maxDbz} dBZ
                </td>
                <td className="py-3 px-3">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      row.severeRisk === 'Severe'
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : row.severeRisk === 'High'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : row.severeRisk === 'Moderate'
                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}
                  >
                    {row.severeRisk}
                  </span>
                </td>
                <td className="py-3 px-4 text-right text-slate-500 font-mono">
                  {row.timestamp}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
