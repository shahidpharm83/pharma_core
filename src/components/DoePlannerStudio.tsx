import React, { useState, useMemo } from 'react';
import {
  Sliders,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  FlaskConical,
  ShieldCheck,
  Activity,
  Info,
  ArrowRight,
  Zap,
  Check,
  Layers,
  Thermometer,
  Clock,
  Target,
  Maximize2,
  ChevronRight,
  BarChart3,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { CompoundProperties } from '../types/pharmadds';
import {
  DOE_POLYMER_CATALOG,
  DOE_SURFACTANT_CATALOG,
  DoePolymerOption,
  DoeSurfactantOption,
  DoeGridPoint,
  DoeOptimizationResult,
  runDoeGridSearchOptimization,
} from '../services/doeOptimizationEngine';
import { FDA_IID_FLAT_DATABASE, IidExcipientRecord } from '../data/fdaIidDatabase';

interface DoePlannerStudioProps {
  currentDrug: CompoundProperties;
  currentDrugDoseMg: number;
  onApplyFormulation: (params: {
    targetDrugDoseMg: number;
    polymerExcipient: IidExcipientRecord;
    polymerMg: number;
    surfactantExcipient: IidExcipientRecord;
    surfactantMg: number;
    doeCandidateTitle: string;
  }) => void;
  onOpenGlossary?: (termId?: string) => void;
}

export const DoePlannerStudio: React.FC<DoePlannerStudioProps> = ({
  currentDrug,
  currentDrugDoseMg,
  onApplyFormulation,
  onOpenGlossary,
}) => {
  // DOE User Control State
  const [selectedPolymerId, setSelectedPolymerId] = useState<string>('hpmc_as');
  const [selectedSurfactantId, setSelectedSurfactantId] = useState<string>('vitamin_e_tpgs');
  const [targetDoseMg, setTargetDoseMg] = useState<number>(currentDrugDoseMg || 50);
  const [granularity, setGranularity] = useState<'standard' | 'fine'>('standard');
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [appliedFeedbackTitle, setAppliedFeedbackTitle] = useState<string | null>(null);
  const [viewFilter, setViewFilter] = useState<'ALL' | 'OPTIMAL_ONLY' | 'BORDERLINE' | 'HIGH_RISK'>('ALL');

  // Look up chosen polymer & surfactant objects
  const chosenPolymer = useMemo<DoePolymerOption>(() => {
    return (
      DOE_POLYMER_CATALOG.find((p) => p.id === selectedPolymerId) ||
      DOE_POLYMER_CATALOG[0]
    );
  }, [selectedPolymerId]);

  const chosenSurfactant = useMemo<DoeSurfactantOption>(() => {
    return (
      DOE_SURFACTANT_CATALOG.find((s) => s.id === selectedSurfactantId) ||
      DOE_SURFACTANT_CATALOG[0]
    );
  }, [selectedSurfactantId]);

  // Run the grid search optimization engine
  const doeResult: DoeOptimizationResult = useMemo(() => {
    return runDoeGridSearchOptimization(
      currentDrug,
      chosenPolymer,
      chosenSurfactant,
      targetDoseMg,
      granularity
    );
  }, [currentDrug, chosenPolymer, chosenSurfactant, targetDoseMg, granularity]);

  // Currently inspected point (defaults to optimal point)
  const activeInspectedPoint: DoeGridPoint = useMemo(() => {
    if (selectedPointId) {
      const found = doeResult.gridPoints.find((p) => p.id === selectedPointId);
      if (found) return found;
    }
    return doeResult.optimalPoint;
  }, [selectedPointId, doeResult]);

  // Unique list of polymer weight percentages in the grid for row-grouping
  const polymerLevels = useMemo(() => {
    const set = new Set<number>();
    doeResult.gridPoints.forEach((p) => set.add(p.polymerWtPct));
    return Array.from(set).sort((a, b) => b - a); // Higher polymer on top
  }, [doeResult.gridPoints]);

  const surfactantLevels = useMemo(() => {
    const set = new Set<number>();
    doeResult.gridPoints.forEach((p) => set.add(p.surfactantWtPct));
    return Array.from(set).sort((a, b) => a - b);
  }, [doeResult.gridPoints]);

  // Fast lookup map: `${pWt}_${sWt}` -> DoeGridPoint
  const gridPointMap = useMemo(() => {
    const map = new Map<string, DoeGridPoint>();
    doeResult.gridPoints.forEach((pt) => {
      map.set(`${pt.polymerWtPct.toFixed(1)}_${pt.surfactantWtPct.toFixed(1)}`, pt);
    });
    return map;
  }, [doeResult.gridPoints]);

  // Response Surface Trade-off Chart Data
  // Fixed at 60% polymer level (or closest) to illustrate effect of surfactant plasticization vs dissolution boost
  const chartCurveData = useMemo(() => {
    // Pick polymer level closest to optimal point's polymer %
    const targetPolymer = doeResult.optimalPoint.polymerWtPct;
    const slice = doeResult.gridPoints
      .filter((p) => Math.abs(p.polymerWtPct - targetPolymer) < 0.01)
      .sort((a, b) => a.surfactantWtPct - b.surfactantWtPct);

    return slice.map((pt) => ({
      surfactantPct: `${pt.surfactantWtPct}%`,
      surfactantVal: pt.surfactantWtPct,
      desirabilityScore: pt.desirabilityScore,
      tgMargin_C: pt.stabilityMargin_C,
      tgBlend_C: pt.tgBlend_C,
      parachuteMin: pt.fassifParachuteTimeMin,
      dissolutionEfficiencyPct: pt.dissolutionEfficiencyPct,
      chemicalStabilityIndexPct: pt.chemicalStabilityIndexPct,
      zone: pt.stabilityZone,
    }));
  }, [doeResult]);

  // Handler to apply a formulation candidate into the active recipe
  const handleApplyCandidate = (
    candidateTitle: string,
    point: DoeGridPoint,
    batchAmounts: { drugMg: number; polymerMg: number; surfactantMg: number; totalUnitMassMg: number }
  ) => {
    const polyExcipient =
      FDA_IID_FLAT_DATABASE.find((e) => e.id === chosenPolymer.excipientDbId) ||
      FDA_IID_FLAT_DATABASE[0];
    const surfExcipient =
      FDA_IID_FLAT_DATABASE.find((e) => e.id === chosenSurfactant.excipientDbId) ||
      FDA_IID_FLAT_DATABASE[3];

    onApplyFormulation({
      targetDrugDoseMg: batchAmounts.drugMg,
      polymerExcipient: polyExcipient,
      polymerMg: batchAmounts.polymerMg,
      surfactantExcipient: surfExcipient,
      surfactantMg: batchAmounts.surfactantMg,
      doeCandidateTitle: candidateTitle,
    });

    setAppliedFeedbackTitle(candidateTitle);
    setTimeout(() => {
      setAppliedFeedbackTitle(null);
    }, 4000);
  };

  return (
    <div className="space-y-6">
      {/* Success Notification Banner */}
      {appliedFeedbackTitle && (
        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between animate-fade-in shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-full bg-emerald-200 text-emerald-800">
              <Check className="w-4 h-4" />
            </span>
            <div>
              <span className="font-bold text-xs">Formulation Successfully Transferred to Recipe!</span>
              <p className="text-[11px] text-emerald-800">
                Loaded <strong>{appliedFeedbackTitle}</strong> ({chosenPolymer.name} + {chosenSurfactant.name}) into the Active Formulation Table.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded">
            Recipe Updated
          </span>
        </div>
      )}

      {/* Top Banner: QbD Philosophy & Target API Parameters */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-lg p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                <Sliders className="w-5 h-5 text-indigo-300" />
              </span>
              <span className="text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded bg-indigo-500/40 text-indigo-200 border border-indigo-400/40 font-semibold">
                ICH Q8(R2) Quality by Design (QbD)
              </span>
            </div>
            <h3 className="text-xl font-bold tracking-tight text-white">
              Design of Experiments (DOE) Optimization Engine
            </h3>
            <p className="text-xs text-indigo-200/90 max-w-3xl leading-relaxed">
              Systematic grid-search optimization across ternary polymer and surfactant ratios for <strong>{currentDrug.name}</strong>.
              Predicts Gordon-Taylor glass transition (<span className="font-mono">T_g,blend</span>), Hancock-Zografi 50°C physical stability margin, FaSSIF dissolution parachute maintenance, and peroxide degradation limits.
            </p>
          </div>

          {/* Drug Physicochemical Context Pill */}
          <div className="bg-white/10 rounded-lg p-3 border border-white/15 backdrop-blur-xs flex flex-wrap items-center gap-4 text-xs">
            <div>
              <span className="text-[10px] text-indigo-300 block uppercase font-semibold">Target API</span>
              <span className="font-bold text-white text-sm">{currentDrug.name}</span>
            </div>
            <div className="border-l border-white/20 pl-3">
              <span className="text-[10px] text-indigo-300 block uppercase font-semibold">BCS Class</span>
              <span className="font-mono font-bold text-amber-300">{currentDrug.bcsClass}</span>
            </div>
            <div className="border-l border-white/20 pl-3">
              <span className="text-[10px] text-indigo-300 block uppercase font-semibold">LogP / MW</span>
              <span className="font-mono text-white">{currentDrug.xLogP} / {currentDrug.molecularWeight}</span>
            </div>
            <div className="border-l border-white/20 pl-3">
              <span className="text-[10px] text-indigo-300 block uppercase font-semibold">Est. API T_g</span>
              <span className="font-mono font-bold text-emerald-300">
                {Math.round(Math.max(35, Math.min(110, (currentDrug.molecularWeight / 10) + (currentDrug.xLogP * 4))))}°C
              </span>
            </div>
          </div>
        </div>

        {/* Global Design Space KPI Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 mt-4 pt-4 border-t border-white/15 text-xs">
          <div className="bg-white/5 rounded p-2 border border-white/10">
            <span className="text-[10px] text-slate-300 block font-medium">Evaluated Grid Points</span>
            <span className="font-mono font-bold text-white text-base">
              {doeResult.designSpaceStatistics.totalGridPointsEvaluated}
            </span>
            <span className="text-[9px] text-slate-400 block">Full ternary space</span>
          </div>

          <div className="bg-emerald-500/10 rounded p-2 border border-emerald-400/20">
            <span className="text-[10px] text-emerald-200 block font-medium">Optimal QbD Space</span>
            <span className="font-mono font-bold text-emerald-400 text-base">
              {doeResult.designSpaceStatistics.optimalDesignSpacePointsCount}
            </span>
            <span className="text-[9px] text-emerald-300/80 block">
              {((doeResult.designSpaceStatistics.optimalDesignSpacePointsCount / doeResult.designSpaceStatistics.totalGridPointsEvaluated) * 100).toFixed(0)}% robust
            </span>
          </div>

          <div className="bg-amber-500/10 rounded p-2 border border-amber-400/20">
            <span className="text-[10px] text-amber-200 block font-medium">Acceptable Borderline</span>
            <span className="font-mono font-bold text-amber-300 text-base">
              {doeResult.designSpaceStatistics.acceptablePointsCount}
            </span>
            <span className="text-[9px] text-amber-300/80 block">Requires humidity control</span>
          </div>

          <div className="bg-rose-500/10 rounded p-2 border border-rose-400/20">
            <span className="text-[10px] text-rose-200 block font-medium">High Risk Unstable</span>
            <span className="font-mono font-bold text-rose-300 text-base">
              {doeResult.designSpaceStatistics.unstablePointsCount}
            </span>
            <span className="text-[9px] text-rose-300/80 block">Recrystallization risk</span>
          </div>

          <div className="bg-white/5 rounded p-2 border border-white/10">
            <span className="text-[10px] text-slate-300 block font-medium">Max Desirability (D)</span>
            <span className="font-mono font-bold text-indigo-300 text-base">
              {doeResult.designSpaceStatistics.maxDesirabilityScore.toFixed(1)}%
            </span>
            <span className="text-[9px] text-slate-400 block">Derringer composite</span>
          </div>

          <div className="bg-white/5 rounded p-2 border border-white/10">
            <span className="text-[10px] text-slate-300 block font-medium">Optimal T_g Margin</span>
            <span className="font-mono font-bold text-cyan-300 text-base">
              +{doeResult.designSpaceStatistics.optimalTgMargin_C.toFixed(1)}°C
            </span>
            <span className="text-[9px] text-cyan-200/80 block">ΔT &gt; 50°C rule met</span>
          </div>

          <div className="bg-white/5 rounded p-2 border border-white/10">
            <span className="text-[10px] text-slate-300 block font-medium">FaSSIF Parachute</span>
            <span className="font-mono font-bold text-purple-300 text-base">
              {doeResult.designSpaceStatistics.optimalParachuteMin} min
            </span>
            <span className="text-[9px] text-purple-200/80 block">Extended supersaturation</span>
          </div>
        </div>
      </div>

      {/* Grid-Search Factor Selectors & Controls */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="p-1 rounded bg-indigo-100 text-indigo-700">
                <Sliders className="w-4 h-4" />
              </span>
              <span>1. Select DOE Factors & Granularity Settings</span>
            </h4>
            <p className="text-xs text-slate-500">
              Select polymeric carrier, surfactant wetting agent, and target unit API payload to run the multi-objective response surface.
            </p>
          </div>

          {/* Granularity & Filter Toggles */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center rounded-md border border-slate-200 bg-slate-50 p-0.5">
              <button
                type="button"
                onClick={() => setGranularity('standard')}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                  granularity === 'standard'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Standard (5% step)
              </button>
              <button
                type="button"
                onClick={() => setGranularity('fine')}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                  granularity === 'fine'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Fine Resolution (2.5% step)
              </button>
            </div>
          </div>
        </div>

        {/* 3-Column Factor Selector */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Factor A: Polymeric Matrix */}
          <div className="space-y-2 p-3.5 bg-slate-50/70 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>Factor A: Polymeric Carrier</span>
              </label>
              <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                T_g = {chosenPolymer.tg_C}°C
              </span>
            </div>

            <select
              value={selectedPolymerId}
              onChange={(e) => {
                setSelectedPolymerId(e.target.value);
                setSelectedPointId(null);
              }}
              className="w-full px-2.5 py-2 text-xs rounded border border-slate-300 bg-white font-medium text-slate-800 focus:ring-1 focus:ring-indigo-500"
            >
              {DOE_POLYMER_CATALOG.map((poly) => (
                <option key={poly.id} value={poly.id}>
                  {poly.name} ({poly.tradeName})
                </option>
              ))}
            </select>

            <div className="text-[11px] text-slate-600 space-y-1 pt-1">
              <div className="flex justify-between">
                <span>Gordon-Taylor K:</span>
                <span className="font-mono font-bold">{chosenPolymer.kGordonTaylor}</span>
              </div>
              <div className="flex justify-between">
                <span>Precipitation Inhibition:</span>
                <span className="font-mono font-bold text-emerald-700">
                  {chosenPolymer.precipitationInhibitionFactor}x multiplier
                </span>
              </div>
              <div className="flex justify-between">
                <span>Hygroscopicity:</span>
                <span className="font-medium">{chosenPolymer.hygroscopicity}</span>
              </div>
            </div>
          </div>

          {/* Factor B: Surfactant / Solubilizer */}
          <div className="space-y-2 p-3.5 bg-slate-50/70 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                <span>Factor B: Surfactant / Solubilizer</span>
              </label>
              <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                HLB = {chosenSurfactant.hlb}
              </span>
            </div>

            <select
              value={selectedSurfactantId}
              onChange={(e) => {
                setSelectedSurfactantId(e.target.value);
                setSelectedPointId(null);
              }}
              className="w-full px-2.5 py-2 text-xs rounded border border-slate-300 bg-white font-medium text-slate-800 focus:ring-1 focus:ring-amber-500"
            >
              {DOE_SURFACTANT_CATALOG.map((surf) => (
                <option key={surf.id} value={surf.id}>
                  {surf.name} ({surf.tradeName})
                </option>
              ))}
            </select>

            <div className="text-[11px] text-slate-600 space-y-1 pt-1">
              <div className="flex justify-between">
                <span>Plasticization Intensity:</span>
                <span className="font-mono font-bold text-rose-700">
                  {chosenSurfactant.plasticizationIntensity} (Tg: {chosenSurfactant.tg_C}°C)
                </span>
              </div>
              <div className="flex justify-between">
                <span>Micellar Solubilization:</span>
                <span className="font-mono font-bold text-emerald-700">
                  {chosenSurfactant.solubilizationCapacity}x boost
                </span>
              </div>
              <div className="flex justify-between">
                <span>Peroxide Oxidation Risk:</span>
                <span
                  className={`font-semibold ${
                    chosenSurfactant.peroxideRisk === 'Low' ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  {chosenSurfactant.peroxideRisk}
                </span>
              </div>
            </div>
          </div>

          {/* Target API Dose (mg) & Constraints */}
          <div className="space-y-2 p-3.5 bg-slate-50/70 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-blue-600" />
                <span>Target API Dose Payload</span>
              </label>
              <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                {targetDoseMg} mg / unit
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="range"
                min={10}
                max={200}
                step={5}
                value={targetDoseMg}
                onChange={(e) => setTargetDoseMg(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <input
                type="number"
                min={5}
                max={500}
                value={targetDoseMg}
                onChange={(e) => setTargetDoseMg(Math.max(1, Number(e.target.value)))}
                className="w-16 px-2 py-1 text-xs border border-slate-300 rounded font-mono font-bold text-right text-slate-900"
              />
            </div>

            <div className="text-[11px] text-slate-600 space-y-1 pt-1">
              <div className="flex justify-between">
                <span>Optimum Unit Mass:</span>
                <span className="font-mono font-bold text-slate-900">
                  {doeResult.optimalBatchAmounts.totalUnitMassMg.toFixed(1)} mg
                </span>
              </div>
              <div className="flex justify-between">
                <span>Optimal Drug Loading:</span>
                <span className="font-mono font-bold text-indigo-700">
                  {doeResult.optimalPoint.drugWtPct.toFixed(1)} wt%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Recommended Tablet Size:</span>
                <span className="font-medium text-slate-700">
                  {doeResult.optimalBatchAmounts.totalUnitMassMg <= 250
                    ? 'Standard 8mm Round'
                    : doeResult.optimalBatchAmounts.totalUnitMassMg <= 450
                    ? '10mm Round / Oval'
                    : '12mm Caplet (High Mass)'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top 3 Formulation Candidates (QbD Recommended Recipes) */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="p-1 rounded bg-emerald-100 text-emerald-800">
                <Sparkles className="w-4 h-4" />
              </span>
              <span>2. Top 3 Recommended Formulation Profiles (QbD Grid-Search Optimums)</span>
            </h4>
            <p className="text-xs text-slate-500">
              Pre-calculated formulations balancing glass stability, dissolution velocity, and minimal tablet mass for {currentDrug.name}.
            </p>
          </div>
          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            1-Click Load into Active Recipe
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {doeResult.topFormulationCandidates.map((cand, idx) => {
            const isGlobalOptimum = idx === 0;
            return (
              <div
                key={idx}
                className={`rounded-lg border p-4 space-y-3.5 transition-all flex flex-col justify-between ${
                  isGlobalOptimum
                    ? 'bg-gradient-to-b from-indigo-50/50 to-white border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded uppercase ${
                        isGlobalOptimum
                          ? 'bg-indigo-600 text-white'
                          : idx === 1
                          ? 'bg-teal-700 text-white'
                          : 'bg-purple-700 text-white'
                      }`}
                    >
                      {isGlobalOptimum ? 'Option 1: Recommended' : `Option ${idx + 1}`}
                    </span>
                    <span className="text-xs font-mono font-bold text-indigo-700">
                      D = {cand.point.desirabilityScore.toFixed(1)}%
                    </span>
                  </div>

                  <h5 className="text-sm font-bold text-slate-900">{cand.title}</h5>
                  <p className="text-xs text-slate-600 leading-relaxed min-h-[36px]">
                    {cand.description}
                  </p>

                  {/* Weight Ratio & Component Breakdown */}
                  <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200 text-xs space-y-1.5">
                    <div className="flex justify-between font-mono text-[11px] pb-1 border-b border-slate-200">
                      <span className="text-slate-500">Ratio (Drug:Poly:Surf):</span>
                      <span className="font-bold text-slate-900">{cand.point.polymerRatioLabel}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 pt-1 text-center font-mono">
                      <div className="bg-white p-1.5 rounded border border-slate-100">
                        <span className="text-[9px] text-slate-400 block uppercase">API ({cand.point.drugWtPct}%)</span>
                        <span className="font-bold text-slate-900 text-xs">{cand.batchAmounts.drugMg} mg</span>
                      </div>
                      <div className="bg-white p-1.5 rounded border border-slate-100">
                        <span className="text-[9px] text-indigo-500 block uppercase">Poly ({cand.point.polymerWtPct}%)</span>
                        <span className="font-bold text-indigo-700 text-xs">{cand.batchAmounts.polymerMg} mg</span>
                      </div>
                      <div className="bg-white p-1.5 rounded border border-slate-100">
                        <span className="text-[9px] text-amber-500 block uppercase">Surf ({cand.point.surfactantWtPct}%)</span>
                        <span className="font-bold text-amber-700 text-xs">{cand.batchAmounts.surfactantMg} mg</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-1 text-[11px]">
                      <span className="text-slate-500">Total Unit Weight:</span>
                      <span className="font-bold font-mono text-slate-900">
                        {cand.batchAmounts.totalUnitMassMg.toFixed(1)} mg
                      </span>
                    </div>
                  </div>

                  {/* Scientific Metrics Grid */}
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-500 block">T_g,blend (Glass Temp)</span>
                      <span className="font-mono font-bold text-slate-900">{cand.point.tgBlend_C}°C</span>
                    </div>
                    <div className="p-2 rounded bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-500 block">Hancock-Zografi Margin</span>
                      <span
                        className={`font-mono font-bold ${
                          cand.point.stabilityMargin_C >= 50
                            ? 'text-emerald-700'
                            : cand.point.stabilityMargin_C >= 30
                            ? 'text-amber-700'
                            : 'text-rose-700'
                        }`}
                      >
                        +{cand.point.stabilityMargin_C}°C
                      </span>
                    </div>
                    <div className="p-2 rounded bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-500 block">FaSSIF Parachute</span>
                      <span className="font-mono font-bold text-purple-700">
                        {cand.point.fassifParachuteTimeMin} min
                      </span>
                    </div>
                    <div className="p-2 rounded bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-500 block">Chemical Stability</span>
                      <span className="font-mono font-bold text-slate-900">
                        {cand.point.chemicalStabilityIndexPct}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* 1-Click Action Button */}
                <button
                  type="button"
                  onClick={() => handleApplyCandidate(cand.title, cand.point, cand.batchAmounts)}
                  className={`w-full py-2 px-3 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                    isGlobalOptimum
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Apply to Active Recipe</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive 2D Heatmap Grid of the Design Space */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="p-1 rounded bg-purple-100 text-purple-700">
                <BarChart3 className="w-4 h-4" />
              </span>
              <span>3. 2D Design Space Contour Grid ({chosenPolymer.tradeName} vs {chosenSurfactant.tradeName})</span>
            </h4>
            <p className="text-xs text-slate-500">
              Click any cell in the grid to inspect its Gordon-Taylor glass transition, stability margin, and FaSSIF parachute duration.
            </p>
          </div>

          {/* Color Legend & View Filter */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-emerald-500 border border-emerald-600"></span>
                <span className="text-[11px] text-slate-600 font-medium">Optimal QbD (D ≥ 82%)</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-amber-400 border border-amber-500"></span>
                <span className="text-[11px] text-slate-600 font-medium">Borderline (68-81%)</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-rose-400 border border-rose-500"></span>
                <span className="text-[11px] text-slate-600 font-medium">Unstable / High Risk</span>
              </span>
            </div>

            <select
              value={viewFilter}
              onChange={(e) => setViewFilter(e.target.value as any)}
              className="px-2 py-1 text-xs border border-slate-300 rounded bg-white text-slate-700"
            >
              <option value="ALL">Show All Zones</option>
              <option value="OPTIMAL_ONLY">Optimal Design Space Only</option>
              <option value="BORDERLINE">Borderline Only</option>
              <option value="HIGH_RISK">High Risk Only</option>
            </select>
          </div>
        </div>

        {/* Heatmap Matrix with Row/Column Labels */}
        <div className="space-y-2 overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Header X-axis (Surfactant Wt%) */}
            <div className="flex items-center">
              <div className="w-28 shrink-0 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right pr-3">
                Polymer ↓ \ Surf →
              </div>
              <div className="flex gap-1.5">
                {surfactantLevels.map((sWt) => (
                  <div
                    key={sWt}
                    className="w-16 text-center font-mono text-[11px] font-bold text-slate-700 shrink-0"
                  >
                    {sWt.toFixed(1)}%
                  </div>
                ))}
              </div>
            </div>

            {/* Rows (Polymer Wt%) */}
            <div className="space-y-1.5 mt-1.5">
              {polymerLevels.map((pWt) => (
                <div key={pWt} className="flex items-center">
                  <div className="w-28 shrink-0 text-right pr-3 font-mono text-xs font-bold text-slate-700">
                    {pWt.toFixed(1)}% Poly
                  </div>
                  <div className="flex gap-1.5">
                    {surfactantLevels.map((sWt) => {
                      const point = gridPointMap.get(`${pWt.toFixed(1)}_${sWt.toFixed(1)}`);
                      if (!point) {
                        return (
                          <div
                            key={sWt}
                            className="w-16 h-12 rounded bg-slate-100 border border-slate-200/50 shrink-0 flex items-center justify-center text-[10px] text-slate-300"
                          >
                            N/A
                          </div>
                        );
                      }

                      // Check filter
                      let isDimmed = false;
                      if (viewFilter === 'OPTIMAL_ONLY' && point.stabilityZone !== 'OPTIMAL_DESIGN_SPACE') {
                        isDimmed = true;
                      } else if (viewFilter === 'BORDERLINE' && point.stabilityZone !== 'ACCEPTABLE_BORDERLINE') {
                        isDimmed = true;
                      } else if (viewFilter === 'HIGH_RISK' && point.stabilityZone !== 'UNSTABLE_RISK') {
                        isDimmed = true;
                      }

                      const isSelected = activeInspectedPoint.id === point.id;
                      const isGlobalOptimal = doeResult.optimalPoint.id === point.id;

                      let cellBg = 'bg-rose-100 text-rose-900 border-rose-300 hover:bg-rose-200';
                      if (point.stabilityZone === 'OPTIMAL_DESIGN_SPACE') {
                        cellBg = 'bg-emerald-100 text-emerald-950 border-emerald-400 hover:bg-emerald-200';
                      } else if (point.stabilityZone === 'ACCEPTABLE_BORDERLINE') {
                        cellBg = 'bg-amber-100 text-amber-950 border-amber-300 hover:bg-amber-200';
                      }

                      return (
                        <button
                          key={sWt}
                          type="button"
                          onClick={() => setSelectedPointId(point.id)}
                          className={`w-16 h-12 rounded border text-center p-1 shrink-0 transition-all cursor-pointer relative flex flex-col justify-between items-center ${cellBg} ${
                            isDimmed ? 'opacity-25 grayscale' : ''
                          } ${
                            isSelected
                              ? 'ring-2 ring-indigo-600 scale-105 z-10 shadow-md font-bold'
                              : ''
                          }`}
                          title={`Polymer: ${point.polymerWtPct}%, Surfactant: ${point.surfactantWtPct}%, API: ${point.drugWtPct}% | Desirability: ${point.desirabilityScore}%`}
                        >
                          {isGlobalOptimal && (
                            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[9px] font-bold shadow-xs">
                              ★
                            </span>
                          )}
                          <span className="font-mono text-[11px] font-bold leading-none">
                            {point.desirabilityScore.toFixed(0)}%
                          </span>
                          <span className="text-[9px] font-mono leading-none opacity-80">
                            +{point.stabilityMargin_C}°C
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Cell Deep Dive Inspector Card */}
        <div className="bg-slate-900 text-white rounded-lg p-4 mt-4 border border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
                <Activity className="w-4 h-4" />
              </span>
              <div>
                <span className="text-sm font-bold text-white">
                  Inspected Formulation Point: {activeInspectedPoint.polymerWtPct}% {chosenPolymer.tradeName} + {activeInspectedPoint.surfactantWtPct}% {chosenSurfactant.tradeName}
                </span>
                <span className="text-xs text-slate-400 block">
                  Normalized Ratio: <strong>{activeInspectedPoint.polymerRatioLabel}</strong> (Drug : Polymer : Surfactant)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full ${
                  activeInspectedPoint.stabilityZone === 'OPTIMAL_DESIGN_SPACE'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                    : activeInspectedPoint.stabilityZone === 'ACCEPTABLE_BORDERLINE'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                }`}
              >
                {activeInspectedPoint.stabilityZone === 'OPTIMAL_DESIGN_SPACE'
                  ? 'QbD Optimal Design Space'
                  : activeInspectedPoint.stabilityZone === 'ACCEPTABLE_BORDERLINE'
                  ? 'Acceptable Borderline'
                  : 'Unstable / High Risk'}
              </span>

              <button
                type="button"
                onClick={() => {
                  const totalMass = targetDoseMg / (activeInspectedPoint.drugWtPct / 100);
                  const polyMg = Math.round((totalMass * (activeInspectedPoint.polymerWtPct / 100)) * 10) / 10;
                  const surfMg = Math.round((totalMass * (activeInspectedPoint.surfactantWtPct / 100)) * 10) / 10;

                  handleApplyCandidate(
                    `Custom DOE Point (${activeInspectedPoint.polymerRatioLabel})`,
                    activeInspectedPoint,
                    {
                      drugMg: targetDoseMg,
                      polymerMg: polyMg,
                      surfactantMg: surfMg,
                      totalUnitMassMg: Math.round(totalMass * 10) / 10,
                    }
                  );
                }}
                className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Load This Point into Recipe</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
            <div className="bg-white/5 rounded p-2.5 border border-white/10">
              <span className="text-[10px] text-slate-400 block uppercase">Desirability (D)</span>
              <span className="text-lg font-mono font-bold text-white">
                {activeInspectedPoint.desirabilityScore.toFixed(1)}%
              </span>
              <span className="text-[10px] text-slate-400 block">Overall QbD Index</span>
            </div>

            <div className="bg-white/5 rounded p-2.5 border border-white/10">
              <span className="text-[10px] text-slate-400 block uppercase">T_g,blend (Glass Temp)</span>
              <span className="text-lg font-mono font-bold text-cyan-300">
                {activeInspectedPoint.tgBlend_C}°C
              </span>
              <span className="text-[10px] text-slate-400 block">Gordon-Taylor ternary</span>
            </div>

            <div className="bg-white/5 rounded p-2.5 border border-white/10">
              <span className="text-[10px] text-slate-400 block uppercase">Hancock-Zografi ΔT</span>
              <span
                className={`text-lg font-mono font-bold ${
                  activeInspectedPoint.stabilityMargin_C >= 50
                    ? 'text-emerald-400'
                    : activeInspectedPoint.stabilityMargin_C >= 30
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                +{activeInspectedPoint.stabilityMargin_C}°C
              </span>
              <span className="text-[10px] text-slate-400 block">
                {activeInspectedPoint.stabilityMargin_C >= 50 ? '≥50°C 2-yr stable' : '<50°C fragile'}
              </span>
            </div>

            <div className="bg-white/5 rounded p-2.5 border border-white/10">
              <span className="text-[10px] text-slate-400 block uppercase">FaSSIF Parachute</span>
              <span className="text-lg font-mono font-bold text-purple-300">
                {activeInspectedPoint.fassifParachuteTimeMin} min
              </span>
              <span className="text-[10px] text-slate-400 block">Supersaturation hold</span>
            </div>

            <div className="bg-white/5 rounded p-2.5 border border-white/10">
              <span className="text-[10px] text-slate-400 block uppercase">Unit Dose Weight</span>
              <span className="text-lg font-mono font-bold text-white">
                {(targetDoseMg / (activeInspectedPoint.drugWtPct / 100)).toFixed(1)} mg
              </span>
              <span className="text-[10px] text-slate-400 block">
                {targetDoseMg}mg API + {((targetDoseMg / (activeInspectedPoint.drugWtPct / 100)) * (activeInspectedPoint.polymerWtPct / 100)).toFixed(1)}mg Poly + {((targetDoseMg / (activeInspectedPoint.drugWtPct / 100)) * (activeInspectedPoint.surfactantWtPct / 100)).toFixed(1)}mg Surf
              </span>
            </div>

            <div className="bg-white/5 rounded p-2.5 border border-white/10">
              <span className="text-[10px] text-slate-400 block uppercase">Chemical Stability</span>
              <span className="text-lg font-mono font-bold text-emerald-400">
                {activeInspectedPoint.chemicalStabilityIndexPct}%
              </span>
              <span className="text-[10px] text-slate-400 block">Peroxide risk index</span>
            </div>
          </div>

          {activeInspectedPoint.criticalRiskNote && (
            <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>{activeInspectedPoint.criticalRiskNote}</span>
            </div>
          )}
        </div>
      </div>

      {/* Response Surface Trade-off Chart (Recharts) */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="p-1 rounded bg-teal-100 text-teal-800">
                <TrendingUp className="w-4 h-4" />
              </span>
              <span>4. Response Surface Trade-Off: Plasticization vs Solubilization Boost</span>
            </h4>
            <p className="text-xs text-slate-500">
              Shows the delicate QbD balance: Surfactant wetting extends FaSSIF parachute time, but excessive loading depressess Gordon-Taylor glass transition (<span className="font-mono">T_g,blend</span>).
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded border border-teal-200">
            Polymer Fixed at ~{doeResult.optimalPoint.polymerWtPct}% Wt
          </span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartCurveData} margin={{ top: 10, right: 25, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="surfactantPct"
                label={{ value: `Surfactant Wt% (${chosenSurfactant.tradeName})`, position: 'insideBottom', offset: -10, fontSize: 11 }}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                yAxisId="left"
                label={{ value: 'Desirability (%) / Stability Margin (°C)', angle: -90, position: 'insideLeft', offset: 12, fontSize: 11 }}
                domain={[0, 100]}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                label={{ value: 'FaSSIF Parachute Time (min)', angle: 90, position: 'insideRight', offset: 15, fontSize: 11 }}
                domain={[0, 360]}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-900 text-white p-3 rounded-lg shadow-lg text-xs space-y-1 font-mono border border-slate-700">
                      <div className="font-bold text-indigo-300 pb-1 border-b border-slate-700 font-sans">
                        Surfactant Wt%: {data.surfactantPct}
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-400">QbD Desirability:</span>
                        <span className="font-bold text-white">{data.desirabilityScore.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-400">Hancock-Zografi Margin:</span>
                        <span className="font-bold text-cyan-300">+{data.tgMargin_C}°C</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-400">Blend Glass Temp (Tg):</span>
                        <span className="font-bold text-slate-300">{data.tgBlend_C}°C</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-400">FaSSIF Parachute Duration:</span>
                        <span className="font-bold text-purple-300">{data.parachuteMin} min</span>
                      </div>
                    </div>
                  );
                }}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 11 }} />

              <ReferenceLine
                yAxisId="left"
                y={50}
                stroke="#10b981"
                strokeDasharray="4 4"
                label={{ value: 'Hancock-Zografi 50°C Rule', fill: '#10b981', fontSize: 10, position: 'insideTopRight' }}
              />

              <Bar
                yAxisId="right"
                dataKey="parachuteMin"
                name="FaSSIF Parachute (min)"
                fill="#c084fc"
                opacity={0.35}
                radius={[4, 4, 0, 0]}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="desirabilityScore"
                name="QbD Desirability D (%)"
                stroke="#4f46e5"
                strokeWidth={3}
                dot={{ r: 4, fill: '#4f46e5' }}
                activeDot={{ r: 6 }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="tgMargin_C"
                name="Stability Margin ΔT (°C)"
                stroke="#0891b2"
                strokeWidth={2}
                dot={{ r: 3, fill: '#0891b2' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Scientific Takeaway Callout */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
          <div className="font-bold text-slate-900 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-indigo-600" />
            <span>Formulation Optimization Insight for {currentDrug.name}:</span>
          </div>
          <p className="text-slate-600 leading-relaxed text-[11px]">
            Peak desirability is achieved at <strong>{doeResult.optimalPoint.polymerRatioLabel}</strong> (Drug:Polymer:Surfactant).
            Increasing surfactant beyond {doeResult.chosenSurfactant.recommendedMaxWtPct * 100}% triggers excessive glass transition depression (plasticization), breaching the Hancock-Zografi 50°C margin and increasing trace peroxide oxidation risk.
          </p>
        </div>
      </div>
    </div>
  );
};
