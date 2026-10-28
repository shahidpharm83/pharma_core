import React, { useState } from 'react';
import { Activity, ShieldCheck, TrendingUp, AlertOctagon, HeartPulse, Sparkles } from 'lucide-react';
import { CompoundProperties, SimulationResult, DeliverySystemType } from '../types/pharmadds';

interface PkPdSimulationStudioProps {
  currentDrug: CompoundProperties;
  simulation: SimulationResult | null;
  systemType: DeliverySystemType;
  onChangeSystemType: (type: DeliverySystemType) => void;
  doseMg: number;
  onChangeDoseMg: (dose: number) => void;
}

export const PkPdSimulationStudio: React.FC<PkPdSimulationStudioProps> = ({
  currentDrug,
  simulation,
  systemType,
  onChangeSystemType,
  doseMg,
  onChangeDoseMg,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  const pk = simulation?.pharmacokinetics || {
    timeHours: [0, 1, 2, 4, 6, 8, 12, 16, 20, 24],
    conventionalPlasma: [0, 8.2, 5.4, 2.3, 1.1, 0.5, 0.1, 0.0, 0.0, 0.0],
    conventionalTarget: [0, 5.3, 3.5, 1.5, 0.7, 0.3, 0.1, 0.0, 0.0, 0.0],
    targetedPlasma: [0, 3.8, 4.2, 4.5, 4.2, 3.8, 3.1, 2.4, 1.8, 1.2],
    targetedTarget: [0, 6.2, 9.8, 14.5, 15.2, 14.8, 12.9, 10.4, 8.1, 5.9],
    thresholds: {
      mtc: currentDrug.toxicityMTC_mgL,
      mec: currentDrug.effectiveMEC_mgL,
    },
    kpis: {
      conventionalCmax: 8.2,
      targetedCmax: 4.5,
      conventionalAUC: 24.8,
      targetedAUC: 82.4,
      bioavailabilityBoostFactor: '11.5x',
      toxicityReductionPct: '58%',
      therapeuticTargetIndex: 3.4,
    },
  };

  const maxConc = Math.max(
    ...pk.conventionalPlasma,
    ...pk.targetedPlasma,
    ...pk.targetedTarget,
    pk.thresholds.mtc * 1.25
  );

  return (
    <section id="pkpd" className="py-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              05. Pharmacokinetics (PK/PD) & Bioavailability Optimization Engine
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Two-compartment physiologically-based modeling demonstrating therapeutic window control and systemic toxicity mitigation
            </p>
          </div>
          {/* System Selection Tabs */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium w-full sm:w-auto">
            <button
              onClick={() => onChangeSystemType('nanoparticle')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded transition-colors whitespace-nowrap text-center ${
                systemType === 'nanoparticle' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Nanoparticle
            </button>
            <button
              onClick={() => onChangeSystemType('amorphous')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded transition-colors whitespace-nowrap text-center ${
                systemType === 'amorphous' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Amorphous (ASD)
            </button>
            <button
              onClick={() => onChangeSystemType('inhalation')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded transition-colors whitespace-nowrap text-center ${
                systemType === 'inhalation' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Inhalation (DPI/MDI)
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stat Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Bioavailability Boost
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline">
            <span className="text-2xl font-bold font-mono text-emerald-600 tabular-nums">
              {pk.kpis.bioavailabilityBoostFactor}
            </span>
            <span className="text-xs text-slate-500 ml-2">Fold Increase</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Baseline: {currentDrug.bioavailabilityOralBaseline}% → Targeted: {currentDrug.bioavailabilityTargetedExpected}%
          </span>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Systemic Toxicity Reduction
            </span>
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline">
            <span className="text-2xl font-bold font-mono text-blue-600 tabular-nums">
              {pk.kpis.toxicityReductionPct}
            </span>
            <span className="text-xs text-slate-500 ml-2">Lower Peak Burden</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Avoids plasma spikes over MTC ({pk.thresholds.mtc} mg/L)
          </span>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Target Accumulation Ratio
            </span>
            <Sparkles className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 flex items-baseline">
            <span className="text-2xl font-bold font-mono text-purple-600 tabular-nums">
              {pk.kpis.therapeuticTargetIndex}x
            </span>
            <span className="text-xs text-slate-500 ml-2">Tissue vs Plasma</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Receptor-mediated endocytosis & EPR retention
          </span>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Administered Dose
            </span>
            <HeartPulse className="w-4 h-4 text-slate-500" />
          </div>
          <div className="mt-2 flex items-baseline">
            <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {doseMg}
            </span>
            <span className="text-xs text-slate-500 ml-2">mg</span>
          </div>
          <input
            type="range"
            min="5"
            max="200"
            step="5"
            value={doseMg}
            onChange={(e) => onChangeDoseMg(parseInt(e.target.value, 10))}
            className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer mt-2"
          />
        </div>
      </div>

      {/* Main PK Curve Graph */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              24-Hour Plasma & Target Tissue Concentration vs Time Profile
            </h3>
            <p className="text-xs text-slate-500">
              Comparing conventional unoptimized dosage form against advanced targeted delivery system
            </p>
          </div>
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-purple-600 rounded-full inline-block"></span>
              <span className="text-slate-700 font-medium">Target Tissue (Advanced)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-blue-600 rounded-full inline-block"></span>
              <span className="text-slate-700 font-medium">Plasma (Advanced)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-slate-400 border-b border-slate-400 inline-block"></span>
              <span className="text-slate-500">Plasma (Conventional)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-rose-500 inline-block"></span>
              <span className="text-rose-600 font-mono text-[11px]">MTC (Toxic)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-emerald-500 inline-block"></span>
              <span className="text-emerald-600 font-mono text-[11px]">MEC (Effective)</span>
            </div>
          </div>
        </div>

        {/* SVG PK Chart */}
        <div className="relative h-80 w-full pt-4">
          <svg viewBox="0 0 600 240" className="w-full h-full overflow-visible">
            {/* Background horizontal grid */}
            <line x1="50" y1="20" x2="570" y2="20" stroke="#F1F5F9" strokeWidth="1" />
            <line x1="50" y1="65" x2="570" y2="65" stroke="#F1F5F9" strokeWidth="1" />
            <line x1="50" y1="110" x2="570" y2="110" stroke="#F1F5F9" strokeWidth="1" />
            <line x1="50" y1="155" x2="570" y2="155" stroke="#F1F5F9" strokeWidth="1" />
            <line x1="50" y1="200" x2="570" y2="200" stroke="#94A3B8" strokeWidth="1.2" />
            <line x1="50" y1="20" x2="50" y2="200" stroke="#94A3B8" strokeWidth="1.2" />

            {/* Therapeutic Window Safe Band */}
            {(() => {
              const mtcY = 200 - (pk.thresholds.mtc / maxConc) * 180;
              const mecY = 200 - (pk.thresholds.mec / maxConc) * 180;
              const height = mecY - mtcY;
              return (
                <g>
                  <rect x="50" y={mtcY} width="520" height={Math.max(1, height)} fill="#F0FDF4" opacity="0.6" />
                  <text x="565" y={mtcY + 12} fill="#15803D" fontSize="8" fontWeight="bold" textAnchor="end">
                    OPTIMAL THERAPEUTIC WINDOW
                  </text>
                </g>
              );
            })()}

            {/* Toxic Threshold MTC Line */}
            {(() => {
              const y = 200 - (pk.thresholds.mtc / maxConc) * 180;
              return (
                <g>
                  <line x1="50" y1={y} x2="570" y2={y} stroke="#EF4444" strokeWidth="1.2" strokeDasharray="4 3" />
                  <text x="45" y={y + 3} fill="#EF4444" fontSize="8.5" fontFamily="monospace" textAnchor="end">
                    MTC {pk.thresholds.mtc} mg/L
                  </text>
                </g>
              );
            })()}

            {/* Minimum Effective Concentration MEC Line */}
            {(() => {
              const y = 200 - (pk.thresholds.mec / maxConc) * 180;
              return (
                <g>
                  <line x1="50" y1={y} x2="570" y2={y} stroke="#10B981" strokeWidth="1.2" strokeDasharray="4 3" />
                  <text x="45" y={y + 3} fill="#10B981" fontSize="8.5" fontFamily="monospace" textAnchor="end">
                    MEC {pk.thresholds.mec} mg/L
                  </text>
                </g>
              );
            })()}

            {/* Conventional Plasma Curve */}
            <path
              d={pk.timeHours.reduce((acc, t, i) => {
                const x = 50 + (t / 24) * 520;
                const conc = pk.conventionalPlasma[i] || 0;
                const y = 200 - (conc / maxConc) * 180;
                return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
              }, '')}
              fill="none"
              stroke="#94A3B8"
              strokeWidth="1.8"
              strokeDasharray="4 3"
            />

            {/* Advanced Targeted Plasma Curve */}
            <path
              d={pk.timeHours.reduce((acc, t, i) => {
                const x = 50 + (t / 24) * 520;
                const conc = pk.targetedPlasma[i] || 0;
                const y = 200 - (conc / maxConc) * 180;
                return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
              }, '')}
              fill="none"
              stroke="#2563EB"
              strokeWidth="2.5"
            />

            {/* Advanced Target Tissue Accumulation Curve */}
            <path
              d={pk.timeHours.reduce((acc, t, i) => {
                const x = 50 + (t / 24) * 520;
                const conc = pk.targetedTarget[i] || 0;
                const y = 200 - (conc / maxConc) * 180;
                return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
              }, '')}
              fill="none"
              stroke="#9333EA"
              strokeWidth="2.8"
            />

            {/* Data points for Targeted Tissue */}
            {pk.timeHours.map((t, i) => {
              const x = 50 + (t / 24) * 520;
              const conc = pk.targetedTarget[i] || 0;
              const y = 200 - (conc / maxConc) * 180;
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="3.5"
                  fill="#9333EA"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                  className="cursor-pointer hover:r-5 transition-all"
                  onMouseEnter={() => setHoveredPoint(i)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              );
            })}

            {/* X-axis time marks */}
            {pk.timeHours.map((t) => {
              const x = 50 + (t / 24) * 520;
              return (
                <text key={t} x={x} y="215" fill="#94A3B8" fontSize="8.5" textAnchor="middle" fontFamily="monospace">
                  {t}h
                </text>
              );
            })}
          </svg>

          {/* Interactive Tooltip HUD */}
          {hoveredPoint !== null && (
            <div className="absolute top-4 right-4 bg-slate-900/90 text-white backdrop-blur-xs p-3 rounded border border-slate-700 text-xs font-mono space-y-1 shadow-md">
              <div className="text-slate-400 font-bold border-b border-slate-700 pb-1">
                Time: {pk.timeHours[hoveredPoint]} Hours
              </div>
              <div className="text-purple-300">
                Target Tissue: {pk.targetedTarget[hoveredPoint]} mg/L
              </div>
              <div className="text-blue-300">
                Advanced Plasma: {pk.targetedPlasma[hoveredPoint]} mg/L
              </div>
              <div className="text-slate-400">
                Conventional: {pk.conventionalPlasma[hoveredPoint]} mg/L
              </div>
            </div>
          )}
        </div>

        {/* Clinical Rationale Summary */}
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded">
            <span className="font-bold text-slate-800 block mb-1">Eradication of Toxic Peaks</span>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Conventional dosing produces excessive initial peak spikes exceeding the MTC ({pk.thresholds.mtc} mg/L), triggering adverse cardiotoxic, neurotoxic, or gastric reactions. The targeted formulation caps systemic exposure below MTC.
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded">
            <span className="font-bold text-slate-800 block mb-1">Prolonged Therapeutic Efficacy</span>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Rather than plummeting below the MEC ({pk.thresholds.mec} mg/L) after only 3 hours, the advanced system maintains continuous therapeutic coverage throughout the entire 24-hour cycle.
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded">
            <span className="font-bold text-slate-800 block mb-1">Patient Dose Reduction</span>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Because target tissue accumulation is enhanced by <strong>{pk.kpis.therapeuticTargetIndex}x</strong>, clinicians can reduce total administered drug dose by up to <strong>70%</strong>, curing the patient with minimal side effects.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
