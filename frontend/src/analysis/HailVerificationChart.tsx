import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { ModelVerificationPoint } from './types';

export const SAMPLE_VERIFICATION_DATA: ModelVerificationPoint[] = [
  { leadTime: '+15m', nowcastPipelineCSI: 0.88, ncmrwfModelCSI: 0.62, imdModelCSI: 0.65, pod: 0.94, far: 0.08 },
  { leadTime: '+1h', nowcastPipelineCSI: 0.82, ncmrwfModelCSI: 0.64, imdModelCSI: 0.66, pod: 0.89, far: 0.12 },
  { leadTime: '+3h', nowcastPipelineCSI: 0.74, ncmrwfModelCSI: 0.65, imdModelCSI: 0.67, pod: 0.81, far: 0.18 },
  { leadTime: '+6h', nowcastPipelineCSI: 0.68, ncmrwfModelCSI: 0.66, imdModelCSI: 0.66, pod: 0.75, far: 0.22 },
  { leadTime: '+24h', nowcastPipelineCSI: 0.62, ncmrwfModelCSI: 0.64, imdModelCSI: 0.63, pod: 0.70, far: 0.28 },
  { leadTime: '+48h', nowcastPipelineCSI: 0.56, ncmrwfModelCSI: 0.59, imdModelCSI: 0.58, pod: 0.65, far: 0.34 },
  { leadTime: '+72h', nowcastPipelineCSI: 0.49, ncmrwfModelCSI: 0.53, imdModelCSI: 0.51, pod: 0.58, far: 0.39 },
];

export const HAIL_DISTRIBUTION_DATA = [
  { size: '< 1 cm (Graupel)', count: 42, poshProb: 15 },
  { size: '1 - 2 cm (Small)', count: 28, poshProb: 40 },
  { size: '2 - 3.5 cm (Severe)', count: 18, poshProb: 75 },
  { size: '3.5 - 5 cm (Very Severe)', count: 8, poshProb: 90 },
  { size: '> 5 cm (Giant Supercell)', count: 3, poshProb: 95 },
];

export const HailVerificationChart: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Model Verification CSI Skill Scores */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Model Skill Verification (CSI Score vs. Lead Time)</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                Critical Success Index
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Convective Nowcast Pipeline vs. Global NWP and IMD WRF numerical guidance
            </p>
          </div>
        </div>

        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={SAMPLE_VERIFICATION_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="leadTime" stroke="#94A3B8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} domain={[0.4, 1.0]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F172A',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  color: '#FFFFFF',
                  fontSize: '11px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Line
                type="monotone"
                dataKey="nowcastPipelineCSI"
                stroke="#DF691A"
                strokeWidth={3}
                dot={{ r: 4 }}
                name="Our Convective Core (CSI)"
              />
              <Line
                type="monotone"
                dataKey="ncmrwfModelCSI"
                stroke="#2563EB"
                strokeWidth={2}
                strokeDasharray="4 4"
                name="Global NWP Unified (CSI)"
              />
              <Line
                type="monotone"
                dataKey="imdModelCSI"
                stroke="#10B981"
                strokeWidth={2}
                strokeDasharray="4 4"
                name="IMD WRF 3km (CSI)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Hailstone Size MESH Distribution */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Hail Size (MESH) & Probability Distribution</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-semibold">
                MESH / POSH Proxy
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Histogram of predicted storm cell cores producing hail diameter (cm) and probability
            </p>
          </div>
        </div>

        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={HAIL_DISTRIBUTION_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="size" stroke="#94A3B8" fontSize={10} tickLine={false} />
              <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} unit=" cells" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F172A',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  color: '#FFFFFF',
                  fontSize: '11px',
                }}
              />
              <Bar dataKey="count" fill="#8B5CF6" radius={[6, 6, 0, 0]} name="Storm Cells Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
