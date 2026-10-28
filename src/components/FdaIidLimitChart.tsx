import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell,
} from 'recharts';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Sliders,
  BarChart2,
  Info,
  Maximize2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { IidExcipientRecord } from '../data/fdaIidDatabase';

export interface ExcipientChartItem {
  id: string;
  name: string;
  category: string;
  route: string;
  proposedUnitDoseMg: number;
  fdaIidUnitMaxMg: number;
  unit: string;
  proposedDailyIntakeMg: number;
  fdaIidDailyMaxMg: number;
  unitUtilizationPct: number;
  dailyUtilizationPct: number;
  safetyStatus: 'PASS' | 'WARNING' | 'FLAG_EXCEEDED';
}

interface FdaIidLimitChartProps {
  items: ExcipientChartItem[];
  deliveryRoute: string;
  dosageForm: string;
  dosingFrequency: string;
  dosesPerDay: number;
}

export const FdaIidLimitChart: React.FC<FdaIidLimitChartProps> = ({
  items,
  deliveryRoute,
  dosageForm,
  dosingFrequency,
  dosesPerDay,
}) => {
  // Chart metric toggle: unit potency, daily intake, or % utilization
  const [metricMode, setMetricMode] = useState<'unit' | 'daily' | 'percent'>('unit');
  // Sort order
  const [sortBy, setSortBy] = useState<'name' | 'utilization' | 'proposed'>('utilization');

  const chartData = useMemo(() => {
    const list = items.map((item) => {
      // Short name for clean X-axis labeling
      const shortName =
        item.name.length > 18
          ? item.name.split('(')[0].trim().slice(0, 16) + '...'
          : item.name;

      const primaryUtilization =
        metricMode === 'daily' ? item.dailyUtilizationPct : item.unitUtilizationPct;

      return {
        ...item,
        shortName,
        primaryUtilization,
        // Bar values based on selected metric mode
        proposedValue:
          metricMode === 'unit'
            ? item.proposedUnitDoseMg
            : metricMode === 'daily'
            ? item.proposedDailyIntakeMg
            : item.unitUtilizationPct,
        limitValue:
          metricMode === 'unit'
            ? item.fdaIidUnitMaxMg
            : metricMode === 'daily'
            ? item.fdaIidDailyMaxMg
            : 100, // 100% threshold
      };
    });

    if (sortBy === 'utilization') {
      return [...list].sort((a, b) => b.primaryUtilization - a.primaryUtilization);
    } else if (sortBy === 'proposed') {
      return [...list].sort((a, b) => b.proposedValue - a.proposedValue);
    }
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [items, metricMode, sortBy]);

  // Color generator based on FDA IID utilization
  const getBarColor = (utilization: number) => {
    if (utilization > 100) return '#f43f5e'; // Rose - Exceeds
    if (utilization >= 80) return '#f59e0b'; // Amber - Warning / Approaching
    return '#10b981'; // Emerald - Safe
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-indigo-100 text-indigo-700">
              <BarChart2 className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-slate-900">
              FDA IID Maximum Allowable Potency vs Proposed Concentration
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Interactive Recharts comparative analysis for {deliveryRoute} delivery ({dosageForm}) across {items.length} chosen excipients.
          </p>
        </div>

        {/* View Mode & Sorting Toggles */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Metric Selector */}
          <div className="flex items-center rounded-md bg-slate-100 p-0.5 border border-slate-200">
            <button
              type="button"
              onClick={() => setMetricMode('unit')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                metricMode === 'unit'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Unit Potency (mg)
            </button>
            <button
              type="button"
              onClick={() => setMetricMode('daily')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                metricMode === 'daily'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Daily Intake ({dosesPerDay}x/d)
            </button>
            <button
              type="button"
              onClick={() => setMetricMode('percent')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                metricMode === 'percent'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              % FDA IID Limit
            </button>
          </div>

          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-white border border-slate-300 rounded px-2.5 py-1 text-xs font-medium text-slate-700"
          >
            <option value="utilization">Sort by % Utilization</option>
            <option value="proposed">Sort by Amount</option>
            <option value="name">Sort by Name</option>
          </select>
        </div>
      </div>

      {/* Legend & Summary Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs p-2.5 bg-slate-50 rounded-lg border border-slate-200">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-emerald-500"></span>
            <span className="text-slate-600 font-medium">&lt; 80% FDA Precedent (Safe)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-amber-500"></span>
            <span className="text-slate-600 font-medium">80% – 100% (Caution)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-rose-500"></span>
            <span className="text-slate-600 font-medium">&gt; 100% Exceeds Limit</span>
          </div>
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
            <span className="w-3 h-0.5 bg-indigo-600 inline-block"></span>
            <span className="text-slate-600 font-medium">FDA IID Historical Limit</span>
          </div>
        </div>

        <div className="font-mono text-[11px] text-slate-500">
          Target Route: <strong className="text-slate-900">{deliveryRoute}</strong> • Frequency:{' '}
          <strong className="text-slate-900">{dosingFrequency}</strong>
        </div>
      </div>

      {/* Recharts Container */}
      <div className="h-80 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 10, bottom: 65 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis
              dataKey="shortName"
              interval={0}
              angle={-35}
              textAnchor="end"
              tick={{ fontSize: 11, fill: '#475569' }}
              stroke="#94a3b8"
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#475569' }}
              stroke="#94a3b8"
              unit={metricMode === 'percent' ? '%' : ' mg'}
              domain={[0, 'auto']}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const data = payload[0].payload as (typeof chartData)[0];
                const util =
                  metricMode === 'daily'
                    ? data.dailyUtilizationPct
                    : data.unitUtilizationPct;

                return (
                  <div className="p-3 bg-slate-900 text-white rounded-lg shadow-xl text-xs space-y-1.5 max-w-xs border border-slate-700">
                    <div className="font-bold text-white border-b border-slate-700 pb-1">
                      {data.name}
                    </div>
                    <div className="text-[11px] text-slate-300">
                      Category: <span className="text-indigo-300">{data.category}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-800">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Proposed Unit:</span>
                        <span className="font-mono font-bold text-white">
                          {data.proposedUnitDoseMg} {data.unit}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">FDA IID Unit Max:</span>
                        <span className="font-mono font-bold text-purple-300">
                          {data.fdaIidUnitMaxMg} {data.unit}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Daily Intake:</span>
                        <span className="font-mono font-bold text-white">
                          {data.proposedDailyIntakeMg} mg/day
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">FDA Daily MDI:</span>
                        <span className="font-mono font-bold text-purple-300">
                          {data.fdaIidDailyMaxMg} mg/day
                        </span>
                      </div>
                    </div>

                    <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">FDA Limit Utilization:</span>
                      <span
                        className={`font-mono font-bold ${
                          util > 100
                            ? 'text-rose-400'
                            : util >= 80
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {util.toFixed(1)}%
                      </span>
                    </div>

                    <div className="text-[10px] italic text-slate-400 pt-0.5">
                      {util > 100
                        ? '⚠ Exceeds FDA IID precedent. Requires toxicology qualification.'
                        : util >= 80
                        ? 'Approaching historical precedent limit.'
                        : '✓ Fully within approved historical limits.'}
                    </div>
                  </div>
                );
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: 10, fontSize: 11 }}
            />

            {/* Threshold Reference Lines */}
            {metricMode === 'percent' && (
              <>
                <ReferenceLine
                  y={100}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  label={{
                    value: '100% FDA Precedent Ceiling',
                    position: 'top',
                    fill: '#ef4444',
                    fontSize: 10,
                    fontWeight: 'bold',
                  }}
                />
                <ReferenceLine
                  y={80}
                  stroke="#f59e0b"
                  strokeDasharray="2 2"
                  strokeWidth={1}
                  label={{
                    value: '80% Caution Line',
                    position: 'top',
                    fill: '#f59e0b',
                    fontSize: 10,
                  }}
                />
              </>
            )}

            {/* Proposed Dose / Utilization Bar */}
            <Bar
              dataKey="proposedValue"
              name={
                metricMode === 'unit'
                  ? 'Proposed Unit Dose (mg)'
                  : metricMode === 'daily'
                  ? 'Proposed Daily Intake (mg/day)'
                  : '% FDA Limit Utilization'
              }
              radius={[4, 4, 0, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getBarColor(entry.primaryUtilization)}
                />
              ))}
            </Bar>

            {/* FDA IID Limit Bar (shown when in Unit or Daily mode) */}
            {metricMode !== 'percent' && (
              <Bar
                dataKey="limitValue"
                name={
                  metricMode === 'unit'
                    ? 'FDA IID Unit Limit (mg)'
                    : 'FDA IID Daily MDI Limit (mg/day)'
                }
                fill="#cbd5e1"
                radius={[4, 4, 0, 0]}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Metric Breakdown Table */}
      <div className="pt-3 border-t border-slate-200">
        <h4 className="text-xs font-bold text-slate-800 mb-2">
          Excipient Potency Headroom Summary:
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
          {items.map((it) => {
            const headroomMg = it.fdaIidUnitMaxMg - it.proposedUnitDoseMg;
            const util =
              metricMode === 'daily' ? it.dailyUtilizationPct : it.unitUtilizationPct;

            return (
              <div
                key={it.id}
                className="p-2.5 rounded border border-slate-200 bg-slate-50 flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-slate-900 truncate max-w-[140px]">
                    {it.name}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {it.proposedUnitDoseMg} / {it.fdaIidUnitMaxMg} {it.unit}
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`font-mono font-bold ${
                      util > 100
                        ? 'text-rose-700'
                        : util >= 80
                        ? 'text-amber-700'
                        : 'text-emerald-700'
                    }`}
                  >
                    {util.toFixed(0)}%
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {headroomMg >= 0 ? `+${headroomMg.toFixed(1)} mg margin` : `${headroomMg.toFixed(1)} mg over`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
