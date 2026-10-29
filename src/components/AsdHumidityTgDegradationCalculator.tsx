import React, { useState, useMemo } from 'react';
import {
  Thermometer,
  Droplets,
  Clock,
  ShieldAlert,
  Sparkles,
  Info,
  BookOpen,
  HelpCircle,
  Activity,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Zap,
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
import { CompoundProperties, AmorphousState } from '../types/pharmadds';

interface AsdHumidityTgDegradationCalculatorProps {
  currentDrug: CompoundProperties;
  amorphousState: AmorphousState;
  onOpenGlossary?: (termId?: string) => void;
}

export const AsdHumidityTgDegradationCalculator: React.FC<AsdHumidityTgDegradationCalculatorProps> = ({
  currentDrug,
  amorphousState,
  onOpenGlossary,
}) => {
  // User Controls for Humidity & Storage
  const [relativeHumidityPct, setRelativeHumidityPct] = useState<number>(60); // 60% RH
  const [storageTemp_C, setStorageTemp_C] = useState<number>(25); // 25°C
  const [userRoleMode, setUserRoleMode] = useState<'student' | 'researcher' | 'professor'>('researcher');
  const [showLearningGuide, setShowLearningGuide] = useState<boolean>(true);

  // Gordon-Taylor & Water Plasticization Calculations
  const degradationAnalysis = useMemo(() => {
    const rhFraction = relativeHumidityPct / 100;
    const drugTg_K = amorphousState.drugTg_C + 273.15;
    const polyTg_K = amorphousState.polymerTg_C + 273.15;
    const waterTg_K = 138.15; // -135°C for pure amorphous water
    const K_poly = 0.85;
    const K_water = 0.70;

    // GAB Isotherm approximation for moisture sorption M_w (%) in ASD matrix
    // C ~ 12, K ~ 0.72
    const gabC = 12.0;
    const gabK = 0.72;
    const mwPct = Math.min(
      25.0,
      Math.max(
        0.5,
        (100 * (gabC * gabK * rhFraction)) /
          ((1 - gabK * rhFraction) * (1 - gabK * rhFraction + gabC * gabK * rhFraction))
      )
    );

    const w_water = mwPct / 100;
    const w_drug = Math.max(0.05, amorphousState.drugWeightFraction * (1 - w_water));
    const w_poly = Math.max(0.05, (1 - amorphousState.drugWeightFraction) * (1 - w_water));

    // Ternary Gordon-Taylor Tg equation:
    // Tg_blend = (w_drug*Tg_drug + K_poly*w_poly*Tg_poly + K_water*w_water*Tg_water) / (w_drug + K_poly*w_poly + K_water*w_water)
    const numerator =
      w_drug * drugTg_K +
      K_poly * w_poly * polyTg_K +
      K_water * w_water * waterTg_K;
    const denominator = w_drug + K_poly * w_poly + K_water * w_water;
    const tgBlend_K = numerator / denominator;
    const tgBlend_C = tgBlend_K - 273.15;

    // Physical stability margin (Tg - T_storage)
    const stabilityMargin_C = tgBlend_C - storageTemp_C;

    // Projected shelf-life (Months) based on WLF / Adam-Gibbs free volume mobility
    // When Tg - T >= 50°C -> >24 months
    // When Tg - T <= 0°C -> <1 week (rapid recrystallization in rubbery state)
    let projectedShelfLifeMonths = 24;
    let physicalState = 'Glassy (Physically Stable)';

    if (stabilityMargin_C >= 50) {
      projectedShelfLifeMonths = 36;
      physicalState = 'Glassy (Robust Long-Term Stability)';
    } else if (stabilityMargin_C >= 30) {
      projectedShelfLifeMonths = 24;
      physicalState = 'Glassy (Acceptable Shelf-Life)';
    } else if (stabilityMargin_C >= 15) {
      projectedShelfLifeMonths = 12;
      physicalState = 'Borderline Glassy (Requires Desiccant / Alu-Alu Blister)';
    } else if (stabilityMargin_C >= 5) {
      projectedShelfLifeMonths = 3;
      physicalState = 'Plasticized Glass (High Recrystallization Risk)';
    } else {
      projectedShelfLifeMonths = 0.25; // ~1 week
      physicalState = 'Rubbery State (Rapid Phase Separation & Crystallization)';
    }

    return {
      moistureSorptionPct: parseFloat(mwPct.toFixed(2)),
      tgBlend_C: parseFloat(tgBlend_C.toFixed(1)),
      stabilityMargin_C: parseFloat(stabilityMargin_C.toFixed(1)),
      projectedShelfLifeMonths,
      physicalState,
    };
  }, [relativeHumidityPct, storageTemp_C, amorphousState]);

  // Curve data across RH 10% to 90% for Recharts
  const humidityCurveData = useMemo(() => {
    const data: Array<{
      rh: number;
      moisturePct: number;
      tgBlend_C: number;
      stabilityMargin_C: number;
      shelfLifeMonths: number;
    }> = [];

    const drugTg_K = amorphousState.drugTg_C + 273.15;
    const polyTg_K = amorphousState.polymerTg_C + 273.15;
    const waterTg_K = 138.15;
    const K_poly = 0.85;
    const K_water = 0.70;

    for (let rh = 10; rh <= 90; rh += 5) {
      const rhFrac = rh / 100;
      const mw = Math.min(25.0, Math.max(0.5, (100 * (12 * 0.72 * rhFrac)) / ((1 - 0.72 * rhFrac) * (1 - 0.72 * rhFrac + 12 * 0.72 * rhFrac))));
      const w_wat = mw / 100;
      const w_drg = Math.max(0.05, amorphousState.drugWeightFraction * (1 - w_wat));
      const w_ply = Math.max(0.05, (1 - amorphousState.drugWeightFraction) * (1 - w_wat));

      const num = w_drg * drugTg_K + K_poly * w_ply * polyTg_K + K_water * w_wat * waterTg_K;
      const den = w_drg + K_poly * w_ply + K_water * w_wat;
      const tg_C = num / den - 273.15;
      const margin = tg_C - storageTemp_C;

      let months = 36;
      if (margin >= 50) months = 36;
      else if (margin >= 30) months = 24;
      else if (margin >= 15) months = 12;
      else if (margin >= 5) months = 3;
      else months = 0.5;

      data.push({
        rh,
        moisturePct: parseFloat(mw.toFixed(1)),
        tgBlend_C: parseFloat(tg_C.toFixed(1)),
        stabilityMargin_C: parseFloat(margin.toFixed(1)),
        shelfLifeMonths: months,
      });
    }

    return data;
  }, [storageTemp_C, amorphousState]);

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-6">
      {/* Header Banner with Role Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded bg-rose-100 text-rose-700">
              <Droplets className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold tracking-tight text-slate-900">
              Predictive Tg Water Plasticization & Humidity Shelf-Life Degradation Model
            </h3>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-semibold">
              Gordon-Taylor Moisture Kinetics
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Simulate how atmospheric humidity (RH %) plasticizes amorphous solid dispersions, depressing $T_g$ and causing recrystallization during storage.
          </p>
        </div>

        {/* Learner/Professor/Researcher Mode Selector */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">View Mode:</span>
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setUserRoleMode('student')}
              className={`px-2.5 py-1 rounded font-semibold transition-all ${
                userRoleMode === 'student' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              🎓 Student / Learner
            </button>
            <button
              type="button"
              onClick={() => setUserRoleMode('researcher')}
              className={`px-2.5 py-1 rounded font-semibold transition-all ${
                userRoleMode === 'researcher' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              🔬 R&D Scientist
            </button>
            <button
              type="button"
              onClick={() => setUserRoleMode('professor')}
              className={`px-2.5 py-1 rounded font-semibold transition-all ${
                userRoleMode === 'professor' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              📚 Professor / Expert
            </button>
          </div>
        </div>
      </div>

      {/* Guided Learning & Educational Primer (Toggled) */}
      {showLearningGuide && (
        <div className="bg-gradient-to-r from-rose-50/90 to-amber-50/90 border border-rose-200/80 rounded-lg p-4 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-rose-950 flex items-center gap-2 text-sm">
              <BookOpen className="w-4 h-4 text-rose-700" />
              <span>
                {userRoleMode === 'student'
                  ? '💡 Quick Concept Guide: Why does humidity ruin amorphous solid dispersions?'
                  : userRoleMode === 'researcher'
                  ? '🔬 R&D Moisture-Induced Phase Separation & WLF Kinetics'
                  : '📚 Advanced Thermodynamic Principles: Water as a High-Mobility Plasticizer'}
              </span>
            </span>
            <button
              type="button"
              onClick={() => setShowLearningGuide(false)}
              className="text-rose-800 hover:text-rose-950 font-bold text-xs underline"
            >
              Hide Guide
            </button>
          </div>

          <p className="text-slate-700 leading-relaxed text-[11px]">
            {userRoleMode === 'student'
              ? 'Unlike stable crystalline drugs (like sugar grains), amorphous drugs are high-energy glasses. When exposed to room humidity, moisture acts like a liquid softener (plasticizer). Because water has a very low glass transition temperature (Tg = -135°C), absorbing even 2% moisture makes the mixture soft, causing the drug molecules to clump together and crystallize, losing all solubility benefits!'
              : userRoleMode === 'researcher'
              ? 'Water sorption follows GAB isotherm kinetics. In ternary Gordon-Taylor modeling, water acts as a strong plasticizer (K_water = 0.70). When Tg_blend drops below storage temperature (Tg < T), molecular mobility increases by several orders of magnitude (WLF equation), leading to physical aging and recrystallization.'
              : 'The ternary Gordon-Taylor equation models the glass transition temperature of the drug-polymer-water system. Plasticization kinetics follow free-volume theory. Shelf-life optimization requires maintaining ΔT = Tg - T ≥ 50°C under accelerated ICH Q1A storage conditions (40°C / 75% RH).'}
          </p>
        </div>
      )}

      {/* Interactive Sliders for RH % and Storage Temp */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* RH % Slider */}
        <div className="p-4 bg-slate-50/80 rounded-lg border border-slate-200 space-y-3 text-xs">
          <div className="flex justify-between items-baseline">
            <label className="font-bold text-slate-800 flex items-center gap-1.5">
              <Droplets className="w-4 h-4 text-blue-600" />
              <span>Relative Humidity (RH %)</span>
            </label>
            <span className="font-mono font-bold text-blue-700 text-sm">
              {relativeHumidityPct}% RH
            </span>
          </div>

          <input
            type="range"
            min={10}
            max={90}
            step={5}
            value={relativeHumidityPct}
            onChange={(e) => setRelativeHumidityPct(Number(e.target.value))}
            className="w-full accent-blue-600"
          />

          <div className="flex justify-between text-[10px] text-slate-500">
            <span>10% (Dry Desiccant)</span>
            <span>40% (Ambient Room)</span>
            <span>75% (ICH Accelerated)</span>
            <span>90% (Tropical Stress)</span>
          </div>
        </div>

        {/* Storage Temperature Slider */}
        <div className="p-4 bg-slate-50/80 rounded-lg border border-slate-200 space-y-3 text-xs">
          <div className="flex justify-between items-baseline">
            <label className="font-bold text-slate-800 flex items-center gap-1.5">
              <Thermometer className="w-4 h-4 text-rose-600" />
              <span>Storage Temperature (°C)</span>
            </label>
            <span className="font-mono font-bold text-rose-700 text-sm">
              {storageTemp_C}°C
            </span>
          </div>

          <input
            type="range"
            min={15}
            max={45}
            step={5}
            value={storageTemp_C}
            onChange={(e) => setStorageTemp_C(Number(e.target.value))}
            className="w-full accent-rose-600"
          />

          <div className="flex justify-between text-[10px] text-slate-500">
            <span>15°C (Cold Storage)</span>
            <span>25°C (Room Temp)</span>
            <span>40°C (ICH Accelerated Stress)</span>
          </div>
        </div>
      </div>

      {/* Active Degradation Analysis KPI Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 text-white rounded-lg p-4 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Equilibrium Moisture</span>
          <span className="text-2xl font-mono font-bold text-cyan-300 block">
            {degradationAnalysis.moistureSorptionPct}%
          </span>
          <span className="text-[11px] text-slate-400 block">Sorption in ASD matrix</span>
        </div>

        <div className="bg-slate-900 text-white rounded-lg p-4 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Plasticized Tg (Blend)</span>
          <span className="text-2xl font-mono font-bold text-amber-300 block">
            {degradationAnalysis.tgBlend_C}°C
          </span>
          <span className="text-[11px] text-slate-400 block">Gordon-Taylor ternary Tg</span>
        </div>

        <div className="bg-slate-900 text-white rounded-lg p-4 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Stability Margin (Tg - T)</span>
          <span
            className={`text-2xl font-mono font-bold block ${
              degradationAnalysis.stabilityMargin_C >= 50
                ? 'text-emerald-400'
                : degradationAnalysis.stabilityMargin_C >= 20
                ? 'text-amber-400'
                : 'text-rose-400'
            }`}
          >
            +{degradationAnalysis.stabilityMargin_C}°C
          </span>
          <span className="text-[11px] text-slate-400 block">
            {degradationAnalysis.stabilityMargin_C >= 50 ? '>=50°C 2-yr stable' : 'High recrystallization risk'}
          </span>
        </div>

        <div className="bg-slate-900 text-white rounded-lg p-4 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Projected Shelf-Life</span>
          <span className="text-2xl font-mono font-bold text-emerald-400 block">
            {degradationAnalysis.projectedShelfLifeMonths >= 36 ? '36+ Months' : `${degradationAnalysis.projectedShelfLifeMonths} Months`}
          </span>
          <span className="text-[11px] text-slate-400 block">{degradationAnalysis.physicalState}</span>
        </div>
      </div>

      {/* Recharts Shelf-Life & Tg vs Humidity Chart */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="p-1 rounded bg-rose-100 text-rose-700">
                <Activity className="w-4 h-4" />
              </span>
              <span>Predicted Glass Transition (Tg,blend) & Shelf-Life vs. Relative Humidity</span>
            </h4>
            <p className="text-xs text-slate-500">
              Shows how increasing relative humidity depresses Tg until it intersects storage temperature (25°C), initiating rapid crystallization.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-rose-800 bg-rose-50 px-2.5 py-1 rounded border border-rose-200">
            Active RH: {relativeHumidityPct}%
          </span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={humidityCurveData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="rh"
                label={{ value: 'Relative Humidity (RH %)', position: 'insideBottom', offset: -10, fontSize: 11 }}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                yAxisId="left"
                label={{ value: 'Glass Transition Tg (°C)', angle: -90, position: 'insideLeft', offset: 12, fontSize: 11 }}
                domain={[-20, 140]}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                label={{ value: 'Projected Shelf-Life (Months)', angle: 90, position: 'insideRight', offset: 15, fontSize: 11 }}
                domain={[0, 40]}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-900 text-white p-3 rounded-lg shadow-lg text-xs space-y-1 font-mono border border-slate-700">
                      <div className="font-bold text-rose-300 pb-1 border-b border-slate-700 font-sans">
                        Relative Humidity: {label}% RH
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-400">Moisture Content:</span>
                        <span className="font-bold text-cyan-300">{data.moisturePct}%</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-400">Plasticized Tg (Blend):</span>
                        <span className="font-bold text-amber-300">{data.tgBlend_C}°C</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-400">Stability Margin (Tg - T):</span>
                        <span className="font-bold text-emerald-300">+{data.stabilityMargin_C}°C</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-400">Projected Shelf-Life:</span>
                        <span className="font-bold text-white">{data.shelfLifeMonths} Months</span>
                      </div>
                    </div>
                  );
                }}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 11 }} />

              <ReferenceLine
                yAxisId="left"
                y={storageTemp_C}
                stroke="#e11d48"
                strokeDasharray="4 4"
                label={{ value: `Storage Temp (${storageTemp_C}°C)`, fill: '#e11d48', fontSize: 10, position: 'insideTopRight' }}
              />
              <ReferenceLine
                x={relativeHumidityPct}
                stroke="#2563eb"
                strokeWidth={2}
                strokeDasharray="3 3"
                label={{ value: `${relativeHumidityPct}% RH`, fill: '#2563eb', fontSize: 10, position: 'insideTopLeft' }}
              />

              <Bar
                yAxisId="right"
                dataKey="shelfLifeMonths"
                name="Projected Shelf-Life (Months)"
                fill="#c084fc"
                opacity={0.35}
                radius={[4, 4, 0, 0]}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="tgBlend_C"
                name="Plasticized Tg (°C)"
                stroke="#d97706"
                strokeWidth={3}
                dot={{ r: 4, fill: '#d97706' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Actionable Packaging Recommendation based on User Mode */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
          <div className="font-bold text-slate-900 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span>
              {userRoleMode === 'student'
                ? '🎓 Student Learning Note on Packaging:'
                : userRoleMode === 'researcher'
                ? '🔬 R&D Packaging & Desiccant Recommendation:'
                : '📚 Regulatory ICH Q1A Packaging Strategy:'}
            </span>
          </div>
          <p className="text-slate-600 leading-relaxed text-[11px]">
            {relativeHumidityPct > 60
              ? `At ${relativeHumidityPct}% RH, moisture plasticization drops Tg to ${degradationAnalysis.tgBlend_C}°C. This formulation requires high-barrier Alu-Alu blisters or HDPE bottles with active silica gel desiccant canisters to prevent amorphous recrystallization.`
              : `At ${relativeHumidityPct}% RH, the amorphous glass is robustly stable (Tg = ${degradationAnalysis.tgBlend_C}°C, margin +${degradationAnalysis.stabilityMargin_C}°C). Standard PVC/PVDC blister packaging is adequate for 24+ month stability.`}
          </p>
        </div>
      </div>
    </div>
  );
};
