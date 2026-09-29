import React from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import { CapeCinPoint } from './types';

export const SAMPLE_THERMODYNAMIC_DATA: CapeCinPoint[] = [
  { hour: '00Z', cape: 450, cin: 160, shear: 8.5 },
  { hour: '03Z', cape: 620, cin: 140, shear: 9.0 },
  { hour: '06Z', cape: 1250, cin: 90, shear: 12.0 },
  { hour: '09Z', cape: 2150, cin: 40, shear: 16.5 },
  { hour: '12Z', cape: 3450, cin: 10, shear: 21.0 }, // Peak severe convective instability
  { hour: '15Z', cape: 2890, cin: 25, shear: 19.5 },
  { hour: '18Z', cape: 1780, cin: 70, shear: 14.0 },
  { hour: '21Z', cape: 920, cin: 120, shear: 10.5 },
];

export const ThermodynamicChart: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Atmospheric Instability & Convective Energy (CAPE / CIN)</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-semibold">
              Diurnal Convection Cycle
            </span>
          </h3>
          <p className="text-xs text-slate-500">
            Convective Available Potential Energy (CAPE) vs. CIN inhibition barrier & 0-6 km deep layer shear
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-slate-600 text-[11px]">CAPE (J/kg)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500" />
            <span className="text-slate-600 text-[11px]">CIN (J/kg)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-indigo-600" />
            <span className="text-slate-600 text-[11px]">Shear (m/s)</span>
          </div>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={SAMPLE_THERMODYNAMIC_DATA} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis dataKey="hour" stroke="#94A3B8" fontSize={11} tickLine={false} />
            <YAxis
              yAxisId="energy"
              stroke="#94A3B8"
              fontSize={11}
              tickLine={false}
              unit=" J"
              domain={[0, 4000]}
            />
            <YAxis
              yAxisId="shear"
              orientation="right"
              stroke="#6366F1"
              fontSize={11}
              tickLine={false}
              unit=" m/s"
              domain={[0, 30]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0F172A',
                borderColor: '#334155',
                borderRadius: '0.75rem',
                color: '#FFFFFF',
                fontSize: '11px',
              }}
            />
            {/* Severe Thunderstorm CAPE Warning threshold (2500 J/kg) */}
            <ReferenceLine
              yAxisId="energy"
              y={2500}
              stroke="#D97706"
              strokeDasharray="4 4"
              label={{ value: 'Extreme Convective Risk (2500 J/kg)', fill: '#D97706', fontSize: 10, position: 'top' }}
            />
            <Bar
              yAxisId="energy"
              dataKey="cape"
              fill="#F59E0B"
              radius={[6, 6, 0, 0]}
              name="CAPE (J/kg)"
            />
            <Line
              yAxisId="energy"
              type="monotone"
              dataKey="cin"
              stroke="#EF4444"
              strokeWidth={2}
              dot={{ r: 3 }}
              name="CIN (J/kg)"
            />
            <Line
              yAxisId="shear"
              type="monotone"
              dataKey="shear"
              stroke="#6366F1"
              strokeWidth={2.5}
              dot={{ r: 4 }}
              name="0-6km Wind Shear (m/s)"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
