import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import { RainfallTimeSeriesPoint } from './types';

export const SAMPLE_RAINFALL_DATA: RainfallTimeSeriesPoint[] = [
  { time: '00:00', predictedRate: 4.2, observedRate: 3.8, accumulated: 4.2, upperBound: 6.0, lowerBound: 2.5 },
  { time: '03:00', predictedRate: 8.5, observedRate: 7.9, accumulated: 12.7, upperBound: 11.2, lowerBound: 5.8 },
  { time: '06:00', predictedRate: 18.0, observedRate: 16.4, accumulated: 30.7, upperBound: 22.5, lowerBound: 13.0 },
  { time: '09:00', predictedRate: 38.4, observedRate: 36.1, accumulated: 69.1, upperBound: 45.0, lowerBound: 29.5 },
  { time: '12:00', predictedRate: 68.5, observedRate: 64.2, accumulated: 137.6, upperBound: 80.0, lowerBound: 52.0 }, // Cloudburst surge
  { time: '15:00', predictedRate: 54.0, observedRate: 51.8, accumulated: 191.6, upperBound: 65.0, lowerBound: 40.0 },
  { time: '18:00', predictedRate: 26.2, observedRate: 24.5, accumulated: 217.8, upperBound: 34.0, lowerBound: 19.0 },
  { time: '21:00', predictedRate: 12.0, observedRate: 13.1, accumulated: 229.8, upperBound: 18.0, lowerBound: 8.0 },
  { time: '+24h', predictedRate: 6.5, observedRate: 7.0, accumulated: 236.3, upperBound: 10.0, lowerBound: 4.0 },
  { time: '+36h', predictedRate: 15.2, observedRate: 14.0, accumulated: 251.5, upperBound: 21.0, lowerBound: 10.0 },
  { time: '+48h', predictedRate: 28.0, observedRate: 25.5, accumulated: 279.5, upperBound: 36.0, lowerBound: 20.0 },
  { time: '+72h', predictedRate: 9.4, observedRate: 8.5, accumulated: 288.9, upperBound: 14.0, lowerBound: 6.0 },
];

export const PrecipitationChart: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Precipitation & Cloudburst Rate Time-Series</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold">
              Marshall-Palmer Z-R
            </span>
          </h3>
          <p className="text-xs text-slate-500">
            Hourly rain rate (mm/hr) and cumulative water volume vs. radar-observed surface ground truth
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-600" />
            <span className="text-slate-600 text-[11px]">Predicted Rate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-slate-600 text-[11px]">AWS Observed</span>
          </div>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={SAMPLE_RAINFALL_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="rainGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="observedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis dataKey="time" stroke="#94A3B8" fontSize={11} tickLine={false} />
            <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} unit=" mm" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0F172A',
                borderColor: '#334155',
                borderRadius: '0.75rem',
                color: '#FFFFFF',
                fontSize: '11px',
              }}
            />
            {/* Cloudburst 50 mm/hr Extreme Warning Line */}
            <ReferenceLine
              y={50}
              stroke="#EF4444"
              strokeDasharray="4 4"
              label={{ value: 'Cloudburst Threshold (50 mm/h)', fill: '#EF4444', fontSize: 10, position: 'top' }}
            />
            <Area
              type="monotone"
              dataKey="predictedRate"
              stroke="#2563EB"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#rainGradient)"
              name="Predicted Rain Rate (mm/h)"
            />
            <Area
              type="monotone"
              dataKey="observedRate"
              stroke="#10B981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#observedGradient)"
              name="AWS Observed Rate (mm/h)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
