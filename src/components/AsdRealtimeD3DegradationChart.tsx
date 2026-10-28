import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { TrendingDown, ShieldAlert, Thermometer, Droplets, Calendar, Info } from 'lucide-react';

interface AsdRealtimeD3DegradationChartProps {
  storageTemp_C: number;
  polymerTg_C: number;
  drugTg_C: number;
  drugWeightFraction: number;
  polymerName: string;
}

export const AsdRealtimeD3DegradationChart: React.FC<AsdRealtimeD3DegradationChartProps> = ({
  storageTemp_C,
  polymerTg_C,
  drugTg_C,
  drugWeightFraction,
  polymerName,
}) => {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const [relativeHumidity_pct, setRelativeHumidity_pct] = useState<number>(60); // 60% RH default
  const [hoveredPoint, setHoveredPoint] = useState<{ month: number; potency: number; degradation: number } | null>(null);

  // Gordon-Taylor moisture plasticization calculation
  // Water Tg approx -135°C (138.15 K)
  const waterTg_K = 138.15;
  const waterWeightFraction = (relativeHumidity_pct / 100) * 0.12; // max ~12% moisture sorption at 90% RH
  const dryBlendTg_K = ((drugWeightFraction * (drugTg_C + 273.15)) + (0.85 * (1 - drugWeightFraction) * (polymerTg_C + 273.15))) / (drugWeightFraction + 0.85 * (1 - drugWeightFraction));
  
  // Ternary Gordon-Taylor with moisture plasticization
  const wetBlendTg_C = dryBlendTg_K - waterWeightFraction * 80 - 273.15;
  const stabilityMargin = wetBlendTg_C - storageTemp_C;

  // Compute degradation curve (0 to 36 months)
  // Potency % retention over time based on temperature and humidity stress
  const months = [0, 3, 6, 9, 12, 18, 24, 30, 36];
  
  // Rate constant k depends on temperature acceleration and humidity plasticization
  const tempFactor = Math.exp((storageTemp_C - 25) / 10); // Q10 ~ 2 rule approx
  const rhFactor = Math.pow(relativeHumidity_pct / 60, 1.8);
  const mobilityPenalty = stabilityMargin < 20 ? Math.pow(20 / Math.max(1, stabilityMargin), 1.5) : 1.0;
  
  const degradationRate = 0.003 * tempFactor * rhFactor * mobilityPenalty;

  const curveData = months.map((month) => {
    const potency = Math.max(0, 100 * Math.exp(-degradationRate * month));
    const degradation = parseFloat((100 - potency).toFixed(2));
    return {
      month,
      potency: parseFloat(potency.toFixed(2)),
      degradation,
    };
  });

  const projectedShelfLifeMonths = curveData.findIndex((d) => d.potency < 90);
  const effectiveShelfLife = projectedShelfLifeMonths === -1 ? '> 36 Months' : `~${curveData[projectedShelfLifeMonths]?.month} Months`;

  // D3 Rendering Effect
  useEffect(() => {
    if (!chartRef.current) return;

    // Clear previous SVG
    d3.select(chartRef.current).selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const width = 560 - margin.left - margin.right;
    const height = 280 - margin.top - margin.bottom;

    const svg = d3
      .select(chartRef.current)
      .append('svg')
      .attr('viewBox', `0 0 560 280`)
      .attr('class', 'w-full h-auto overflow-visible')
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X and Y Scales
    const x = d3.scaleLinear().domain([0, 36]).range([0, width]);
    const y = d3.scaleLinear().domain([70, 100]).range([height, 0]);

    // X Axis
    svg
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(8).tickFormat((d) => `${d}M`))
      .selectAll('text')
      .style('font-size', '10px')
      .style('fill', '#64748B');

    // Y Axis
    svg
      .append('g')
      .call(d3.axisLeft(y).ticks(6).tickFormat((d) => `${d}%`))
      .selectAll('text')
      .style('font-size', '10px')
      .style('fill', '#64748B');

    // Gridlines
    svg
      .append('g')
      .attr('class', 'grid')
      .attr('opacity', 0.15)
      .call(d3.axisLeft(y).ticks(6).tickSize(-width).tickFormat(() => ''));

    // ICH Specification Limit Line (90% Potency Lower Limit)
    svg
      .append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', y(90))
      .attr('y2', y(90))
      .attr('stroke', '#EF4444')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '5 5');

    svg
      .append('text')
      .attr('x', width - 5)
      .attr('y', y(90) - 6)
      .attr('fill', '#EF4444')
      .attr('font-size', '9px')
      .attr('font-family', 'monospace')
      .attr('text-anchor', 'end')
      .text('ICH Q1A Spec Limit (90% Potency)');

    // Area generator for gradient fill
    const area = d3
      .area<{ month: number; potency: number }>()
      .x((d) => x(d.month))
      .y0(height)
      .y1((d) => y(d.potency))
      .curve(d3.curveMonotoneX);

    svg
      .append('path')
      .datum(curveData)
      .attr('fill', 'rgba(37, 99, 235, 0.12)')
      .attr('d', area);

    // Line generator
    const valueline = d3
      .line<{ month: number; potency: number }>()
      .x((d) => x(d.month))
      .y((d) => y(d.potency))
      .curve(d3.curveMonotoneX);

    svg
      .append('path')
      .datum(curveData)
      .attr('fill', 'none')
      .attr('stroke', '#2563EB')
      .attr('stroke-width', 3)
      .attr('d', valueline);

    // Scatter points with tooltip triggers
    svg
      .selectAll('dot')
      .data(curveData)
      .enter()
      .append('circle')
      .attr('cx', (d) => x(d.month))
      .attr('cy', (d) => y(d.potency))
      .attr('r', 5)
      .attr('fill', '#2563EB')
      .attr('stroke', '#FFFFFF')
      .attr('stroke-width', 2)
      .on('mouseover', (event, d) => {
        setHoveredPoint(d);
      })
      .on('mouseout', () => {
        setHoveredPoint(null);
      });

    // Axis labels
    svg
      .append('text')
      .attr('transform', `translate(${width / 2}, ${height + 35})`)
      .style('text-anchor', 'middle')
      .style('font-size', '10px')
      .style('fill', '#64748B')
      .text('Storage Duration (Months)');

    svg
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -38)
      .attr('x', -height / 2)
      .style('text-anchor', 'middle')
      .style('font-size', '10px')
      .style('fill', '#64748B')
      .text('Active Potency Retention (%)');

  }, [storageTemp_C, relativeHumidity_pct, drugWeightFraction, polymerTg_C, drugTg_C]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-blue-100 text-blue-700">
              <TrendingDown className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-slate-900">
              Real-Time D3.js Shelf-Life Degradation & Moisture Plasticization Curve
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Predicting potency retention under real-time temperature ({storageTemp_C}°C) and humidity ({relativeHumidity_pct}% RH) using Gordon-Taylor water plasticization kinetics.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          <div>
            <span className="text-slate-500 block text-[10px]">Projected Shelf-Life:</span>
            <span className="font-bold text-blue-700">{effectiveShelfLife}</span>
          </div>
          <div className="border-l border-slate-300 pl-3">
            <span className="text-slate-500 block text-[10px]">Moisture-Blended Tg:</span>
            <span className="font-bold text-indigo-700">{wetBlendTg_C.toFixed(1)}°C</span>
          </div>
        </div>
      </div>

      {/* Controls for Temperature & Humidity */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
        <div>
          <div className="flex justify-between items-baseline mb-1">
            <span className="font-semibold text-slate-700 flex items-center gap-1">
              <Thermometer className="w-3.5 h-3.5 text-amber-600" /> Storage Temperature:
            </span>
            <span className="font-mono font-bold text-slate-900">{storageTemp_C}°C</span>
          </div>
          <div className="text-[11px] text-slate-500">Controlled via Amorphous Studio panel above</div>
        </div>

        <div>
          <div className="flex justify-between items-baseline mb-1">
            <span className="font-semibold text-slate-700 flex items-center gap-1">
              <Droplets className="w-3.5 h-3.5 text-blue-600" /> Relative Humidity (RH):
            </span>
            <span className="font-mono font-bold text-blue-600">{relativeHumidity_pct}% RH</span>
          </div>
          <input
            type="range"
            min="15"
            max="85"
            step="5"
            value={relativeHumidity_pct}
            onChange={(e) => setRelativeHumidity_pct(parseInt(e.target.value, 10))}
            className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer mt-1"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
            <span>15% (Dry Storage)</span>
            <span>60% (ICH Long-Term)</span>
            <span>85% (Stress RH)</span>
          </div>
        </div>
      </div>

      {/* D3 Chart Container */}
      <div className="relative pt-2">
        <div ref={chartRef} className="w-full"></div>

        {/* Hover Tooltip Overlay Box */}
        {hoveredPoint && (
          <div className="absolute top-12 right-6 bg-slate-900 text-white px-3 py-2 rounded-lg shadow-xl text-xs space-y-0.5 border border-slate-700 pointer-events-none">
            <div className="font-bold text-indigo-300">Month {hoveredPoint.month} Forecast</div>
            <div>Potency Retention: <span className="font-mono font-bold text-emerald-400">{hoveredPoint.potency}%</span></div>
            <div>Degraded Fraction: <span className="font-mono font-bold text-rose-400">{hoveredPoint.degradation}%</span></div>
          </div>
        )}
      </div>

      {/* Educational Guidance */}
      <div className="flex items-start gap-3 p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-950">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Moisture Plasticization & Accelerated Degradation:</span>
          <p className="text-[11px] text-blue-900 mt-0.5 leading-relaxed">
            Water acts as a potent plasticizer, depressing the glass transition temperature ($T_g$) of the amorphous matrix. When humidity rises to {relativeHumidity_pct}% RH, moisture sorption depresses the blend $T_g$ to {wetBlendTg_C.toFixed(1)}°C, accelerating molecular mobility and chemical degradation rates in accordance with ICH Q1A stability guidelines.
          </p>
        </div>
      </div>
    </div>
  );
};
