import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  TrendingDown,
  ShieldAlert,
  Thermometer,
  Droplets,
  Calendar,
  Info,
  Sliders,
  RotateCcw,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Activity
} from 'lucide-react';

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
  
  // Baseline storage humidity
  const [relativeHumidity_pct, setRelativeHumidity_pct] = useState<number>(60); // 60% RH default
  
  // Sensitivity variation slider: +/- 10%
  const [humidityDelta_pct, setHumidityDelta_pct] = useState<number>(5); // default +5% variation to immediately show contrast
  
  const [hoveredData, setHoveredData] = useState<{
    month: number;
    basePotency: number;
    pertPotency: number;
    deltaPotency: number;
  } | null>(null);

  // Effective perturbed humidity (clamped between 5% and 95%)
  const effectiveHumidity_pct = useMemo(() => {
    return Math.min(95, Math.max(5, relativeHumidity_pct + humidityDelta_pct));
  }, [relativeHumidity_pct, humidityDelta_pct]);

  // Sensitivity extremes for confidence band (-10% and +10%)
  const lowBoundHumidity_pct = useMemo(() => {
    return Math.min(95, Math.max(5, relativeHumidity_pct - 10));
  }, [relativeHumidity_pct]);

  const highBoundHumidity_pct = useMemo(() => {
    return Math.min(95, Math.max(5, relativeHumidity_pct + 10));
  }, [relativeHumidity_pct]);

  // Gordon-Taylor & Degradation Kinetics Calculation Function
  const calculateKinetics = (rh: number) => {
    // Moisture sorption fraction (GAB / empirical isotherm approximation for ASD polymers)
    const waterWeightFraction = (rh / 100) * 0.12; // up to ~12% moisture at high humidity
    
    // Dry binary blend Tg (Gordon-Taylor K ~ 0.85)
    const drugTg_K = drugTg_C + 273.15;
    const polyTg_K = polymerTg_C + 273.15;
    const dryBlendTg_K =
      (drugWeightFraction * drugTg_K + 0.85 * (1 - drugWeightFraction) * polyTg_K) /
      (drugWeightFraction + 0.85 * (1 - drugWeightFraction));

    // Ternary Gordon-Taylor Tg with water plasticization (water Tg ~ -135°C / 138.15 K)
    const wetBlendTg_C = dryBlendTg_K - waterWeightFraction * 80 - 273.15;
    const stabilityMargin = wetBlendTg_C - storageTemp_C;

    // Arrhenius temperature factor + exponential moisture plasticization penalty
    const tempFactor = Math.exp((storageTemp_C - 25) / 10);
    const rhFactor = Math.pow(rh / 60, 1.8);
    const mobilityPenalty = stabilityMargin < 20 ? Math.pow(20 / Math.max(1, stabilityMargin), 1.5) : 1.0;

    const degradationRate = 0.003 * tempFactor * rhFactor * mobilityPenalty;

    const months = [0, 3, 6, 9, 12, 18, 24, 30, 36];
    const curve = months.map((month) => {
      const potency = Math.max(0, 100 * Math.exp(-degradationRate * month));
      return {
        month,
        potency: parseFloat(potency.toFixed(2)),
        degradation: parseFloat((100 - potency).toFixed(2)),
      };
    });

    const failureIndex = curve.findIndex((pt) => pt.potency < 90);
    const shelfLifeMonths = failureIndex === -1 ? 36 : curve[failureIndex].month;

    return {
      rh,
      wetBlendTg_C: parseFloat(wetBlendTg_C.toFixed(1)),
      stabilityMargin: parseFloat(stabilityMargin.toFixed(1)),
      degradationRate: parseFloat((degradationRate * 100).toFixed(3)), // % per month
      shelfLifeMonths,
      shelfLifeDisplay: failureIndex === -1 ? '> 36 Months' : `~${shelfLifeMonths} Months`,
      curve,
    };
  };

  const baseline = useMemo(() => calculateKinetics(relativeHumidity_pct), [
    relativeHumidity_pct,
    storageTemp_C,
    polymerTg_C,
    drugTg_C,
    drugWeightFraction,
  ]);

  const perturbed = useMemo(() => calculateKinetics(effectiveHumidity_pct), [
    effectiveHumidity_pct,
    storageTemp_C,
    polymerTg_C,
    drugTg_C,
    drugWeightFraction,
  ]);

  const lowBound = useMemo(() => calculateKinetics(lowBoundHumidity_pct), [
    lowBoundHumidity_pct,
    storageTemp_C,
    polymerTg_C,
    drugTg_C,
    drugWeightFraction,
  ]);

  const highBound = useMemo(() => calculateKinetics(highBoundHumidity_pct), [
    highBoundHumidity_pct,
    storageTemp_C,
    polymerTg_C,
    drugTg_C,
    drugWeightFraction,
  ]);

  // Sensitivity Differences
  const deltaTg = parseFloat((perturbed.wetBlendTg_C - baseline.wetBlendTg_C).toFixed(1));
  const deltaDegradationPct = parseFloat(
    (((perturbed.degradationRate - baseline.degradationRate) / Math.max(0.001, baseline.degradationRate)) * 100).toFixed(1)
  );
  const degradationFold = parseFloat((perturbed.degradationRate / Math.max(0.0001, baseline.degradationRate)).toFixed(2));

  // D3 Rendering with Baseline, Perturbation, and Confidence Band
  useEffect(() => {
    if (!chartRef.current) return;

    // Clear previous SVG
    d3.select(chartRef.current).selectAll('*').remove();

    const margin = { top: 25, right: 35, bottom: 45, left: 55 };
    const width = 640 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const svg = d3
      .select(chartRef.current)
      .append('svg')
      .attr('viewBox', `0 0 640 300`)
      .attr('class', 'w-full h-auto overflow-visible select-none')
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const x = d3.scaleLinear().domain([0, 36]).range([0, width]);
    const y = d3.scaleLinear().domain([65, 100]).range([height, 0]);

    // X Axis
    svg
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(9).tickFormat((d) => `${d}M`))
      .selectAll('text')
      .style('font-size', '10px')
      .style('font-family', 'monospace')
      .style('fill', '#64748B');

    // Y Axis
    svg
      .append('g')
      .call(d3.axisLeft(y).ticks(7).tickFormat((d) => `${d}%`))
      .selectAll('text')
      .style('font-size', '10px')
      .style('font-family', 'monospace')
      .style('fill', '#64748B');

    // Horizontal Gridlines
    svg
      .append('g')
      .attr('class', 'grid')
      .attr('opacity', 0.12)
      .call(d3.axisLeft(y).ticks(7).tickSize(-width).tickFormat(() => ''));

    // Sensitivity Uncertainty Band (Area between lowBound and highBound)
    const bandArea = d3
      .area<{ month: number }>()
      .x((d) => x(d.month))
      .y0((d) => y(lowBound.curve.find((p) => p.month === d.month)?.potency || 100))
      .y1((d) => y(highBound.curve.find((p) => p.month === d.month)?.potency || 70))
      .curve(d3.curveMonotoneX);

    svg
      .append('path')
      .datum(baseline.curve)
      .attr('fill', 'rgba(245, 158, 11, 0.12)')
      .attr('d', bandArea);

    // ICH Specification Limit Line (90% Potency Lower Limit)
    svg
      .append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', y(90))
      .attr('y2', y(90))
      .attr('stroke', '#EF4444')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4 4');

    svg
      .append('text')
      .attr('x', width)
      .attr('y', y(90) - 6)
      .attr('fill', '#EF4444')
      .attr('font-size', '9px')
      .attr('font-weight', 'bold')
      .attr('font-family', 'monospace')
      .attr('text-anchor', 'end')
      .text('ICH Q1A Specification Cut-off (90.0% Potency)');

    // Line Generator for Baseline
    const baselineLine = d3
      .line<{ month: number; potency: number }>()
      .x((d) => x(d.month))
      .y((d) => y(d.potency))
      .curve(d3.curveMonotoneX);

    svg
      .append('path')
      .datum(baseline.curve)
      .attr('fill', 'none')
      .attr('stroke', '#2563EB')
      .attr('stroke-width', 3)
      .attr('d', baselineLine);

    // Line Generator for Perturbed Sensitivity Curve
    const perturbedLine = d3
      .line<{ month: number; potency: number }>()
      .x((d) => x(d.month))
      .y((d) => y(d.potency))
      .curve(d3.curveMonotoneX);

    svg
      .append('path')
      .datum(perturbed.curve)
      .attr('fill', 'none')
      .attr('stroke', humidityDelta_pct >= 0 ? '#D97706' : '#059669')
      .attr('stroke-width', 2.5)
      .attr('stroke-dasharray', humidityDelta_pct === 0 ? 'none' : '5 3')
      .attr('d', perturbedLine);

    // Data points & interactive hit targets
    baseline.curve.forEach((basePt) => {
      const pertPt = perturbed.curve.find((p) => p.month === basePt.month) || basePt;
      
      // Perturbed dot
      svg
        .append('circle')
        .attr('cx', x(pertPt.month))
        .attr('cy', y(pertPt.potency))
        .attr('r', 4.5)
        .attr('fill', humidityDelta_pct >= 0 ? '#D97706' : '#059669')
        .attr('stroke', '#FFFFFF')
        .attr('stroke-width', 1.5)
        .style('cursor', 'pointer')
        .on('mouseenter', () => {
          setHoveredData({
            month: basePt.month,
            basePotency: basePt.potency,
            pertPotency: pertPt.potency,
            deltaPotency: parseFloat((pertPt.potency - basePt.potency).toFixed(2)),
          });
        })
        .on('mouseleave', () => setHoveredData(null));

      // Baseline dot
      svg
        .append('circle')
        .attr('cx', x(basePt.month))
        .attr('cy', y(basePt.potency))
        .attr('r', 4)
        .attr('fill', '#2563EB')
        .attr('stroke', '#FFFFFF')
        .attr('stroke-width', 1.5)
        .style('cursor', 'pointer')
        .on('mouseenter', () => {
          setHoveredData({
            month: basePt.month,
            basePotency: basePt.potency,
            pertPotency: pertPt.potency,
            deltaPotency: parseFloat((pertPt.potency - basePt.potency).toFixed(2)),
          });
        })
        .on('mouseleave', () => setHoveredData(null));
    });

    // Axis Titles
    svg
      .append('text')
      .attr('transform', `translate(${width / 2}, ${height + 38})`)
      .style('text-anchor', 'middle')
      .style('font-size', '10px')
      .style('fill', '#64748B')
      .text('ICH Storage Duration (Months)');

    svg
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -42)
      .attr('x', -height / 2)
      .style('text-anchor', 'middle')
      .style('font-size', '10px')
      .style('fill', '#64748B')
      .text('Potency Retention (%)');

  }, [baseline, perturbed, lowBound, highBound, humidityDelta_pct]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
              <TrendingDown className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-slate-900">
              Real-Time D3.js Shelf-Life Degradation & Humidity Sensitivity Simulator
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              Gordon-Taylor Plasticization
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Simulate real-time molecular relaxation and chemical degradation kinetics for <strong>{polymerName}</strong> ASD with active <span className="font-semibold text-slate-700">±10% storage humidity perturbations</span>.
          </p>
        </div>

        {/* Quick status badge */}
        <div className="flex items-center gap-3 text-xs font-mono bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 shrink-0">
          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Base Shelf-Life:</span>
            <span className="font-bold text-blue-700">{baseline.shelfLifeDisplay}</span>
          </div>
          <div className="border-l border-slate-300 pl-3">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Perturbed (±10%):</span>
            <span className={`font-bold ${perturbed.shelfLifeMonths < baseline.shelfLifeMonths ? 'text-amber-600' : 'text-emerald-700'}`}>
              {perturbed.shelfLifeDisplay}
            </span>
          </div>
        </div>
      </div>

      {/* Dual Sliders: Baseline RH and +/- 10% Sensitivity Variation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
        {/* Baseline Storage Humidity Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-baseline">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-blue-600" />
              <span>Baseline Storage Relative Humidity (RH):</span>
            </span>
            <span className="font-mono font-bold text-blue-700 tabular-nums text-sm">
              {relativeHumidity_pct}% RH
            </span>
          </div>
          <input
            type="range"
            min="20"
            max="80"
            step="5"
            value={relativeHumidity_pct}
            onChange={(e) => setRelativeHumidity_pct(parseInt(e.target.value, 10))}
            className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>20% (Dry Desiccated)</span>
            <span>60% (ICH Q1A Standard)</span>
            <span>80% (Tropical Climatic Zone IV)</span>
          </div>
        </div>

        {/* Humidity Sensitivity Slider: +/- 10% Variation */}
        <div className="space-y-1.5 p-3 bg-amber-50/60 rounded-lg border border-amber-200/80">
          <div className="flex justify-between items-baseline">
            <span className="font-bold text-amber-950 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-amber-600" />
              <span>Humidity Sensitivity Slider (ΔRH: ±10%):</span>
            </span>
            <span className="font-mono font-bold tabular-nums text-sm px-2 py-0.5 rounded bg-white border border-amber-300 text-amber-900">
              {humidityDelta_pct > 0 ? `+${humidityDelta_pct}%` : `${humidityDelta_pct}%`} RH
              <span className="text-[10px] font-normal text-slate-500 ml-1">
                (Effective: {effectiveHumidity_pct}% RH)
              </span>
            </span>
          </div>
          <input
            type="range"
            min="-10"
            max="10"
            step="1"
            value={humidityDelta_pct}
            onChange={(e) => setHumidityDelta_pct(parseInt(e.target.value, 10))}
            className="w-full accent-amber-600 h-1.5 bg-amber-200 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between items-center text-[10px] text-amber-800 pt-0.5">
            <button
              type="button"
              onClick={() => setHumidityDelta_pct(-10)}
              className="hover:underline font-semibold cursor-pointer"
            >
              -10% (Desiccant Protection)
            </button>
            <button
              type="button"
              onClick={() => setHumidityDelta_pct(0)}
              className="px-2 py-0.5 bg-white border border-amber-200 rounded text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer"
            >
              0% (Reset Baseline)
            </button>
            <button
              type="button"
              onClick={() => setHumidityDelta_pct(10)}
              className="hover:underline font-semibold cursor-pointer"
            >
              +10% (Moisture Ingress Stress)
            </button>
          </div>
        </div>
      </div>

      {/* Sensitivity Impact Metrics Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        {/* Tg Impact */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
          <span className="text-[10px] text-slate-500 uppercase font-bold block">Glass Transition (Tg):</span>
          <div className="text-base font-bold font-mono text-slate-900">
            {perturbed.wetBlendTg_C}°C
          </div>
          <div className={`text-[11px] font-semibold flex items-center gap-0.5 ${deltaTg < 0 ? 'text-rose-600' : deltaTg > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
            <span>{deltaTg > 0 ? `+${deltaTg}°C` : `${deltaTg}°C`}</span>
            <span className="text-[10px] text-slate-400 font-normal">vs base ({baseline.wetBlendTg_C}°C)</span>
          </div>
        </div>

        {/* Degradation Rate Impact */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
          <span className="text-[10px] text-slate-500 uppercase font-bold block">Degradation Rate (k):</span>
          <div className="text-base font-bold font-mono text-slate-900">
            {perturbed.degradationRate}% / mo
          </div>
          <div className={`text-[11px] font-semibold flex items-center gap-0.5 ${deltaDegradationPct > 0 ? 'text-amber-600' : deltaDegradationPct < 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
            <span>{deltaDegradationPct > 0 ? `+${deltaDegradationPct}%` : `${deltaDegradationPct}%`}</span>
            <span className="text-[10px] text-slate-400 font-normal">({degradationFold}x fold)</span>
          </div>
        </div>

        {/* Stability Margin (Tg - T_storage) */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
          <span className="text-[10px] text-slate-500 uppercase font-bold block">Stability Margin (Tg - T):</span>
          <div className={`text-base font-bold font-mono ${perturbed.stabilityMargin >= 50 ? 'text-emerald-600' : perturbed.stabilityMargin >= 25 ? 'text-blue-600' : 'text-rose-600'}`}>
            +{perturbed.stabilityMargin}°C
          </div>
          <div className="text-[10px] text-slate-400">
            {perturbed.stabilityMargin >= 50 ? 'Compliant (>50°C rule)' : 'Reduced molecular margin'}
          </div>
        </div>

        {/* Shelf-Life Forecast */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
          <span className="text-[10px] text-slate-500 uppercase font-bold block">Estimated Shelf-Life:</span>
          <div className="text-base font-bold font-mono text-indigo-700">
            {perturbed.shelfLifeDisplay}
          </div>
          <div className="text-[10px] text-slate-500">
            {perturbed.shelfLifeMonths < baseline.shelfLifeMonths ? '⚠️ Accelerated by humidity' : 'Maintains ICH spec window'}
          </div>
        </div>
      </div>

      {/* D3 Real-Time Chart Stage */}
      <div className="relative pt-2">
        <div ref={chartRef} className="w-full"></div>

        {/* Interactive Tooltip Callout */}
        {hoveredData && (
          <div className="absolute top-8 right-4 bg-slate-900/95 text-white p-3 rounded-xl shadow-2xl text-xs space-y-1 border border-slate-700 pointer-events-none backdrop-blur-xs min-w-[200px]">
            <div className="font-bold text-amber-300 border-b border-slate-800 pb-1">
              Month {hoveredData.month} Degradation Inspection
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Baseline ({relativeHumidity_pct}% RH):</span>
              <span className="font-mono font-bold text-blue-400">{hoveredData.basePotency}%</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Perturbed ({effectiveHumidity_pct}% RH):</span>
              <span className={`font-mono font-bold ${humidityDelta_pct >= 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {hoveredData.pertPotency}%
              </span>
            </div>
            <div className="flex justify-between gap-4 pt-1 border-t border-slate-800 text-[11px]">
              <span className="text-slate-400">Potency Shift:</span>
              <span className={`font-mono font-bold ${hoveredData.deltaPotency < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {hoveredData.deltaPotency > 0 ? `+${hoveredData.deltaPotency}%` : `${hoveredData.deltaPotency}%`}
              </span>
            </div>
          </div>
        )}

        {/* Chart Legend */}
        <div className="flex flex-wrap items-center justify-center gap-5 pt-3 text-xs text-slate-600 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1 bg-blue-600 rounded"></span>
            <span>Baseline Profile ({relativeHumidity_pct}% RH)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1 bg-amber-600 rounded border-dashed border border-amber-700"></span>
            <span>Perturbed State ({effectiveHumidity_pct}% RH, Δ = {humidityDelta_pct > 0 ? `+${humidityDelta_pct}%` : `${humidityDelta_pct}%`})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-2 bg-amber-200/50 rounded border border-amber-300"></span>
            <span>±10% Climatic Fluctuation Envelope</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-0.5 bg-red-500 border-dashed"></span>
            <span className="text-red-600 font-medium">90% Specification Limit</span>
          </div>
        </div>
      </div>

      {/* Scientific R&D Explanation Banner */}
      <div className="p-4 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200/80 rounded-xl text-xs space-y-1.5">
        <div className="flex items-center gap-2 font-bold text-blue-950">
          <Info className="w-4 h-4 text-blue-700" />
          <span>Moisture Plasticization & Sensitivity Mechanics (Gordon-Taylor & Arrhenius Kinetics)</span>
        </div>
        <p className="text-slate-700 leading-relaxed text-[11px]">
          Amorphous pharmaceutical solid dispersions are highly hygroscopic. Absorbed atmospheric water acts as a strong thermodynamic plasticizer (Tg,water = -135°C / 138.15 K). A <strong>+10% RH variation</strong> causes an estimated <strong>{Math.abs(deltaTg)}°C depression in glass transition temperature</strong>, reducing the molecular relaxation time (tau) via the Adam-Gibbs equation and accelerating chemical hydrolysis and recrystallization rates by <strong>{degradationFold}x ({Math.abs(deltaDegradationPct)}%)</strong>. Maintaining desiccated secondary packaging (e.g., Alu-Alu blister foils with silica gel) prevents moisture ingress and preserves the &gt;50°C Hancock-Zografi physical stability margin.
        </p>
      </div>
    </div>
  );
};
