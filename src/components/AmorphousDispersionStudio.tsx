import React from 'react';
import { Layers, Flame, Clock, Thermometer, TrendingUp, ShieldAlert, Compass } from 'lucide-react';
import { CompoundProperties, AmorphousState, SimulationResult } from '../types/pharmadds';
import { HspMiscibilityCalculator } from './HspMiscibilityCalculator';
import { AsdAcceleratedStabilityForecast } from './AsdAcceleratedStabilityForecast';
import { AsdHumidityTgDegradationCalculator } from './AsdHumidityTgDegradationCalculator';
import { AsdRealtimeD3DegradationChart } from './AsdRealtimeD3DegradationChart';
import { ExperimentalStabilityLog } from './ExperimentalStabilityLog';

interface AmorphousDispersionStudioProps {
  currentDrug: CompoundProperties;
  amorphousState: AmorphousState;
  onUpdateAmorphousState: (state: Partial<AmorphousState>) => void;
  simulation: SimulationResult | null;
  onOpenGlossary?: (termId?: string) => void;
}

export const AmorphousDispersionStudio: React.FC<AmorphousDispersionStudioProps> = ({
  currentDrug,
  amorphousState,
  onUpdateAmorphousState,
  simulation,
  onOpenGlossary,
}) => {
  const amMetrics = simulation?.amorphousMetrics || {
    polymer: amorphousState.polymerType,
    drugWeightFraction: amorphousState.drugWeightFraction,
    tg_drug_C: amorphousState.drugTg_C,
    tg_polymer_C: amorphousState.polymerTg_C,
    predictedTg_blend_C: 98.4,
    stabilityMargin_C: 73.4,
    recrystallizationRisk: 'Low (Stable Amorphous Glass)',
    supersaturationFold: 12.8,
  };

  // Generate Gordon-Taylor Curve data points (w_drug from 0.0 to 1.0)
  const K_gt = 0.85;
  const gtPoints: Array<{ w: number; tg: number }> = [];
  for (let w = 0; w <= 1.0; w += 0.05) {
    const tg_drug_K = amorphousState.drugTg_C + 273.15;
    const tg_poly_K = amorphousState.polymerTg_C + 273.15;
    const tg_K = (w * tg_drug_K + K_gt * (1 - w) * tg_poly_K) / (w + K_gt * (1 - w));
    gtPoints.push({ w, tg: parseFloat((tg_K - 273.15).toFixed(1)) });
  }

  // Supersaturation "Spring & Parachute" Curve points (time 0 - 180 min)
  const timePoints = [0, 15, 30, 45, 60, 90, 120, 150, 180];
  const dissolutionData = timePoints.map((t) => {
    // Crystalline (flat low equilibrium)
    const crystalline = 10;
    // Free amorphous (fast spring, immediate precipitation crash)
    const freeAmorphous = t === 0 ? 0 : t < 30 ? 10 + t * 2.8 : Math.max(12, 94 - (t - 30) * 1.5);
    // Polymeric ASD (Spring & sustained Parachute)
    const asdParachute = t === 0 ? 0 : t < 30 ? 10 + t * 3.8 : Math.max(78, 124 - (t - 30) * 0.18);

    return {
      t,
      crystalline,
      freeAmorphous: parseFloat(freeAmorphous.toFixed(1)),
      asdParachute: parseFloat(asdParachute.toFixed(1)),
    };
  });

  return (
    <section id="amorphous" className="py-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              03. Amorphous Solid Dispersions (ASD) & Glass Solution Modeling
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Overcoming BCS Class II/IV poor aqueous solubility via Gordon-Taylor miscibility & polymeric supersaturation parachutes
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-1 rounded">
              <span className="text-slate-500">Candidate:</span>
              <span className="font-semibold text-slate-800">{currentDrug.name} ({currentDrug.bcsClass})</span>
            </div>
            <a
              href="#hsp-miscibility"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-500 hover:bg-amber-600 text-white font-semibold transition-colors shadow-2xs"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>HSP Phase Diagram ↓</span>
            </a>
            <a
              href="#accelerated-stability"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-semibold transition-colors shadow-2xs"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>12M Stability Forecast ↓</span>
            </a>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Parameter Panel (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-5">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-amber-600" />
              <span>Thermal & Polymer Parameters</span>
            </h3>

            {/* Polymer Selection */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Polymeric Carrier Matrix
              </label>
              <select
                value={amorphousState.polymerType}
                onChange={(e) => {
                  const val = e.target.value;
                  let tg = 120;
                  if (val.includes('Copovidone')) tg = 106;
                  else if (val.includes('Soluplus')) tg = 73;
                  else if (val.includes('Eudragit')) tg = 135;
                  onUpdateAmorphousState({ polymerType: val, polymerTg_C: tg });
                }}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded text-slate-800 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              >
                <option value="HPMC-AS (LF Grade, Tg 120°C)">HPMC-AS (LF Grade - Duodenal & Upper Intestinal Release)</option>
                <option value="Copovidone / PVP-VA 64 (Tg 106°C)">Copovidone / PVP-VA 64 (Broad HME Miscibility)</option>
                <option value="Soluplus (Tg 73°C)">Soluplus (Amphiphilic Solubilizer & Nano-Micelle Former)</option>
                <option value="Eudragit L100-55 (Tg 135°C)">Eudragit L100-55 (Enteric Colon & Distal Delivery)</option>
              </select>
            </div>

            {/* Drug Loading % Slider */}
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs font-semibold text-slate-700">Drug Loading Weight Fraction (w₂)</span>
                <span className="text-xs font-mono font-bold text-blue-600 tabular-nums">
                  {(amorphousState.drugWeightFraction * 100).toFixed(0)} wt%
                </span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.60"
                step="0.05"
                value={amorphousState.drugWeightFraction}
                onChange={(e) => onUpdateAmorphousState({ drugWeightFraction: parseFloat(e.target.value) })}
                className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Loadings &gt;30% increase nucleation risk and recrystallization rate
              </span>
            </div>

            {/* Drug Pure Tg Slider */}
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs font-semibold text-slate-700">Pure Drug Glass Transition (Tg,drug)</span>
                <span className="text-xs font-mono font-bold text-slate-800 tabular-nums">
                  {amorphousState.drugTg_C}°C
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="110"
                step="2"
                value={amorphousState.drugTg_C}
                onChange={(e) => onUpdateAmorphousState({ drugTg_C: parseInt(e.target.value, 10) })}
                className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>

            {/* Storage Temperature */}
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs font-semibold text-slate-700">Storage Environment Temp (T_storage)</span>
                <span className="text-xs font-mono font-bold text-slate-800 tabular-nums">
                  {amorphousState.storageTemp_C}°C
                </span>
              </div>
              <input
                type="range"
                min="4"
                max="40"
                step="1"
                value={amorphousState.storageTemp_C}
                onChange={(e) => onUpdateAmorphousState({ storageTemp_C: parseInt(e.target.value, 10) })}
                className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Thermal Stability Evaluation Card */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
            <span className="text-xs font-bold text-slate-900 block">Gordon-Taylor Stability Audit</span>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                <span className="text-slate-600">Predicted ASD Glass Tg</span>
                <span className="font-mono font-bold text-blue-600 tabular-nums">
                  {amMetrics.predictedTg_blend_C}°C
                </span>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                <span className="text-slate-600">Stability Margin (Tg - T_storage)</span>
                <span className={`font-mono font-bold tabular-nums ${amMetrics.stabilityMargin_C > 50 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  +{amMetrics.stabilityMargin_C}°C
                </span>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                <span className="text-slate-600">Solubility Supersaturation</span>
                <span className="font-mono font-bold text-purple-600 tabular-nums">
                  {amMetrics.supersaturationFold}x Fold Increase
                </span>
              </div>
              <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded text-[11px] text-emerald-900 flex items-start gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Assessment:</strong> {amMetrics.recrystallizationRisk}. Meets ICH Q1A shelf-life criteria.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Stage: Gordon-Taylor Curve & Dissolution "Spring & Parachute" (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Gordon-Taylor Phase Transition Diagram */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Gordon-Taylor Glass Transition (Tg) Miscibility Curve
                </h3>
                <p className="text-xs text-slate-500">
                  Theoretical binary phase glass transition prediction: Tg_blend = (w₁Tg₁ + K·w₂Tg₂) / (w₁ + K·w₂)
                </p>
              </div>
              <span className="text-xs font-mono text-slate-500">
                Operating Point: {(amorphousState.drugWeightFraction * 100).toFixed(0)}% Drug
              </span>
            </div>

            {/* SVG Gordon-Taylor Graph */}
            <div className="h-64 w-full pt-4">
              <svg viewBox="0 0 500 200" className="w-full h-full overflow-visible">
                {/* Horizontal grid lines */}
                <line x1="50" y1="20" x2="480" y2="20" stroke="#E2E8F0" strokeWidth="1" />
                <line x1="50" y1="70" x2="480" y2="70" stroke="#E2E8F0" strokeWidth="1" />
                <line x1="50" y1="120" x2="480" y2="120" stroke="#E2E8F0" strokeWidth="1" />
                <line x1="50" y1="170" x2="480" y2="170" stroke="#94A3B8" strokeWidth="1.2" />
                <line x1="50" y1="20" x2="50" y2="170" stroke="#94A3B8" strokeWidth="1.2" />

                {/* Safe Glassy Region Tint */}
                <rect x="50" y="20" width="430" height="90" fill="#F0FDF4" opacity="0.6" />
                <text x="55" y="32" fill="#15803D" fontSize="9" fontWeight="bold">STABLE GLASSY STATE (Anti-Plasticization)</text>

                {/* Storage Temperature Line */}
                <line x1="50" y1="150" x2="480" y2="150" stroke="#EF4444" strokeWidth="1" strokeDasharray="4 3" />
                <text x="485" y="153" fill="#EF4444" fontSize="9" fontFamily="monospace">Storage 25°C</text>

                {/* Gordon-Taylor Curve */}
                <path
                  d={gtPoints.reduce((acc, pt, i) => {
                    const x = 50 + pt.w * 430;
                    // Scale Tg from 30°C to 140°C
                    const y = 170 - ((pt.tg - 30) / 110) * 150;
                    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
                  }, '')}
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="2.5"
                />

                {/* Active Operating Point Bubble */}
                {(() => {
                  const currentX = 50 + amorphousState.drugWeightFraction * 430;
                  const currentY = 170 - ((amMetrics.predictedTg_blend_C - 30) / 110) * 150;
                  return (
                    <g>
                      <circle cx={currentX} cy={currentY} r="6" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="2" />
                      <text x={currentX + 8} y={currentY - 6} fill="#0F172A" fontSize="10" fontWeight="bold" fontFamily="monospace">
                        Tg = {amMetrics.predictedTg_blend_C}°C
                      </text>
                    </g>
                  );
                })()}

                {/* X Axis labels */}
                <text x="50" y="185" fill="#94A3B8" fontSize="9" textAnchor="middle" fontFamily="monospace">0% (Pure Polymer)</text>
                <text x="265" y="185" fill="#94A3B8" fontSize="9" textAnchor="middle" fontFamily="monospace">50% Loading</text>
                <text x="480" y="185" fill="#94A3B8" fontSize="9" textAnchor="middle" fontFamily="monospace">100% (Pure Drug)</text>

                {/* Y Axis labels */}
                <text x="42" y="24" fill="#94A3B8" fontSize="8" textAnchor="end" fontFamily="monospace">140°C</text>
                <text x="42" y="74" fill="#94A3B8" fontSize="8" textAnchor="end" fontFamily="monospace">100°C</text>
                <text x="42" y="124" fill="#94A3B8" fontSize="8" textAnchor="end" fontFamily="monospace">60°C</text>
                <text x="42" y="174" fill="#94A3B8" fontSize="8" textAnchor="end" fontFamily="monospace">30°C</text>
              </svg>
            </div>
          </div>

          {/* Dissolution "Spring & Parachute" & Hot-Melt Extrusion Photo */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Real Lab Hot-Melt Extrusion Image */}
            <div className="md:col-span-5 bg-white rounded-lg border border-slate-200 p-4">
              <span className="text-xs font-bold text-slate-800 block mb-2">
                Hot-Melt Extrusion & Polarized Light Microscopy
              </span>
              <div className="rounded overflow-hidden border border-slate-200 bg-slate-900">
                <img
                  src="/src/assets/images/amorphous_solid_dispersion_1792773735451.jpg"
                  alt="Hot Melt Extrusion and Polarized Light Microscopy of ASD"
                  referrerPolicy="no-referrer"
                  className="w-full h-40 object-cover"
                />
              </div>
              <div className="mt-2 text-[11px] text-slate-500 leading-tight">
                Polarized light confirms 100% absence of birefringent drug crystals (single amorphous phase).
              </div>
            </div>

            {/* Spring & Parachute Dissolution Curve */}
            <div className="md:col-span-7 bg-white rounded-lg border border-slate-200 p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800">
                    Dissolution: "Spring & Parachute" Effect
                  </span>
                  <div className="flex items-center gap-3 text-[10px] font-medium">
                    <span className="flex items-center gap-1 text-blue-600">
                      <span className="w-2.5 h-0.5 bg-blue-600 inline-block"></span> ASD Parachute
                    </span>
                    <span className="flex items-center gap-1 text-amber-500">
                      <span className="w-2.5 h-0.5 bg-amber-500 inline-block"></span> Unstabilized
                    </span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <span className="w-2.5 h-0.5 bg-slate-400 inline-block"></span> Crystalline
                    </span>
                  </div>
                </div>

                {/* SVG Graph */}
                <div className="h-36 w-full pt-1">
                  <svg viewBox="0 0 280 120" className="w-full h-full overflow-visible">
                    <line x1="30" y1="10" x2="270" y2="10" stroke="#E2E8F0" strokeWidth="1" />
                    <line x1="30" y1="55" x2="270" y2="55" stroke="#E2E8F0" strokeWidth="1" />
                    <line x1="30" y1="100" x2="270" y2="100" stroke="#94A3B8" strokeWidth="1.2" />
                    <line x1="30" y1="10" x2="30" y2="100" stroke="#94A3B8" strokeWidth="1.2" />

                    {/* Crystalline Flat Line */}
                    <path
                      d="M 30 92 L 270 92"
                      fill="none"
                      stroke="#94A3B8"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />

                    {/* Unstabilized Free Amorphous (Spring & Fast Drop) */}
                    <path
                      d={dissolutionData.reduce((acc, d, i) => {
                        const x = 30 + (d.t / 180) * 240;
                        const y = 100 - (d.freeAmorphous / 140) * 90;
                        return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
                      }, '')}
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="1.8"
                    />

                    {/* ASD Parachute (High sustained supersaturation) */}
                    <path
                      d={dissolutionData.reduce((acc, d, i) => {
                        const x = 30 + (d.t / 180) * 240;
                        const y = 100 - (d.asdParachute / 140) * 90;
                        return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
                      }, '')}
                      fill="none"
                      stroke="#2563EB"
                      strokeWidth="2.4"
                    />

                    {/* X labels */}
                    <text x="30" y="113" fill="#94A3B8" fontSize="8" textAnchor="middle" fontFamily="monospace">0m</text>
                    <text x="150" y="113" fill="#94A3B8" fontSize="8" textAnchor="middle" fontFamily="monospace">90m</text>
                    <text x="270" y="113" fill="#94A3B8" fontSize="8" textAnchor="middle" fontFamily="monospace">180m</text>
                  </svg>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 font-mono mt-1 flex justify-between">
                <span>Polymer Crystal Growth Inhibition: <strong>94.2%</strong></span>
                <span>Therapeutic Area Under Curve Boost: <strong>+{amMetrics.supersaturationFold}x</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Amorphous Dispersion & Polymer Miscibility Calculator (HSP, RED, Gordon-Taylor) */}
      <div id="hsp-miscibility" className="pt-2">
        <HspMiscibilityCalculator
          currentDrug={currentDrug}
          onOpenGlossary={onOpenGlossary}
        />
      </div>

      {/* 12-Month Accelerated Physical Stability Forecast (Avrami Kinetics & Hancock-Zografi 50°C Rule) */}
      <div id="accelerated-stability" className="pt-2">
        <AsdAcceleratedStabilityForecast
          currentDrug={currentDrug}
          storageTemp_C={amorphousState.storageTemp_C}
          polymerTg_C={amorphousState.polymerTg_C}
          drugTg_C={amorphousState.drugTg_C}
          drugWeightFraction={amorphousState.drugWeightFraction}
          polymerName={amorphousState.polymerType}
          onOpenGlossary={onOpenGlossary}
        />
      </div>

      {/* Gordon-Taylor Humidity Degradation Calculator & Multi-Role Educational Guide */}
      <div className="pt-2">
        <AsdHumidityTgDegradationCalculator
          currentDrug={currentDrug}
          amorphousState={amorphousState}
          onOpenGlossary={onOpenGlossary}
        />
      </div>

      {/* Real-Time D3.js Shelf-Life Degradation Curve & +/- 10% Humidity Sensitivity Simulator */}
      <div className="pt-2">
        <AsdRealtimeD3DegradationChart
          storageTemp_C={amorphousState.storageTemp_C}
          polymerTg_C={amorphousState.polymerTg_C}
          drugTg_C={amorphousState.drugTg_C}
          drugWeightFraction={amorphousState.drugWeightFraction}
          polymerName={amorphousState.polymerType}
        />
      </div>

      {/* Experimental Stability Log & Chronological Degradation Observation Timeline */}
      <div id="stability-log" className="pt-2">
        <ExperimentalStabilityLog
          currentDrug={currentDrug}
          onOpenGlossary={onOpenGlossary}
        />
      </div>
    </section>
  );
};
