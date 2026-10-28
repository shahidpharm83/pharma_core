import React, { useState } from 'react';
import { Wind, Gauge, Activity, AlertTriangle, Layers, Crosshair, TrendingUp, Sliders } from 'lucide-react';
import { CompoundProperties, InhalationState, SimulationResult } from '../types/pharmadds';
import { AdvancedAerodynamicCalculator } from './AdvancedAerodynamicCalculator';
import { FlowRateDepositionChart } from './FlowRateDepositionChart';

interface InhalationStudioProps {
  currentDrug: CompoundProperties;
  inhalationState: InhalationState;
  onUpdateInhalationState: (state: Partial<InhalationState>) => void;
  simulation: SimulationResult | null;
  onOpenGlossary?: (termId?: string) => void;
}

export const InhalationStudio: React.FC<InhalationStudioProps> = ({
  currentDrug,
  inhalationState,
  onUpdateInhalationState,
  simulation,
  onOpenGlossary,
}) => {
  const [activeTab, setActiveTab] = useState<'ngi_cascade' | 'flow_rate_chart'>('ngi_cascade');
  const inhMetrics = simulation?.inhalationMetrics || {
    deviceType: inhalationState.deviceType,
    propellant: inhalationState.propellantType,
    mmad_um: inhalationState.mmad_um,
    gsd: inhalationState.gsd,
    fpf_pct: 64.2,
    throatDeposition_pct: 23.5,
    deepLungDeposition_pct: 50.1,
    ngiStages: [
      { stage: 'Throat Port', cutOff_um: '> 10.0', fraction_pct: 23.5 },
      { stage: 'Pre-separator', cutOff_um: '10.0', fraction_pct: 9.4 },
      { stage: 'Stage 1', cutOff_um: '8.06', fraction_pct: 6.2 },
      { stage: 'Stage 2', cutOff_um: '4.46', fraction_pct: 18.0 },
      { stage: 'Stage 3', cutOff_um: '2.82', fraction_pct: 22.5 },
      { stage: 'Stage 4', cutOff_um: '1.66', fraction_pct: 14.1 },
      { stage: 'Stage 5', cutOff_um: '0.94', fraction_pct: 6.4 },
      { stage: 'Stage 6', cutOff_um: '0.55', fraction_pct: 3.1 },
      { stage: 'Stage 7 + MOC', cutOff_um: '< 0.34', fraction_pct: 1.8 },
    ],
  };

  return (
    <section id="inhalation" className="py-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              04. Inhalation Science (DPI & pMDI) & Aerodynamic Deposition
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Next Generation Impactor (NGI) aerodynamic particle sizing, carrier detachment, and pulmonary alveolar targeting
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">API:</span>
            <span className="font-semibold text-slate-800">{currentDrug.name}</span>
          </div>
        </div>

        {/* Sub-navigation tabs */}
        <div className="flex flex-wrap items-center gap-1.5 mt-4 pt-4 border-t border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('ngi_cascade')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'ngi_cascade'
                ? 'bg-cyan-700 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            <span>NGI Impactor & Aerodynamic Calculator</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('flow_rate_chart')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'flow_rate_chart'
                ? 'bg-gradient-to-r from-cyan-700 to-blue-700 text-white shadow-2xs'
                : 'text-cyan-800 bg-cyan-50/90 hover:bg-cyan-100 border border-cyan-200/60'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Dynamic Flow-Rate-to-Deposition Chart (DPI Effort)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-cyan-200 text-cyan-950">
              Flow vs Deposition
            </span>
          </button>
        </div>
      </div>

      {/* Tab 2: Dynamic Flow-Rate-to-Deposition Chart */}
      {activeTab === 'flow_rate_chart' && (
        <FlowRateDepositionChart
          currentDrug={currentDrug}
          inhalationState={inhalationState}
          onOpenGlossary={onOpenGlossary}
        />
      )}

      {/* Tab 1: NGI Cascade Impactor & Aerodynamic Calculator */}
      {activeTab === 'ngi_cascade' && (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Parameter Panel (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-5">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Wind className="w-4 h-4 text-cyan-600" />
              <span>Aerosol Engineering Variables</span>
            </h3>

            {/* Inhalation Device Type */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Delivery Device Platform
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onUpdateInhalationState({ deviceType: 'DPI' })}
                  className={`py-1.5 text-xs font-medium rounded transition-colors ${
                    inhalationState.deviceType === 'DPI'
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Dry Powder (DPI)
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateInhalationState({ deviceType: 'MDI' })}
                  className={`py-1.5 text-xs font-medium rounded transition-colors ${
                    inhalationState.deviceType === 'MDI'
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Metered Dose (pMDI)
                </button>
              </div>
            </div>

            {/* Carrier Blend vs Engineered Particle */}
            {inhalationState.deviceType === 'DPI' ? (
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  DPI Particle Architecture
                </label>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-xs text-slate-600">Fine Lactose Ternary Ratio</span>
                      <span className="text-xs font-mono font-bold text-blue-600 tabular-nums">
                        {(inhalationState.fineLactoseRatio * 100).toFixed(0)} wt%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.01"
                      max="0.12"
                      step="0.01"
                      value={inhalationState.fineLactoseRatio}
                      onChange={(e) => onUpdateInhalationState({ fineLactoseRatio: parseFloat(e.target.value) })}
                      className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                    />
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Saturates high-energy active binding sites on coarse lactose (63-90 µm)
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  pMDI Propellant System
                </label>
                <select
                  value={inhalationState.propellantType}
                  onChange={(e) => onUpdateInhalationState({ propellantType: e.target.value })}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded text-slate-800 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                >
                  <option value="HFO-1234ze (Ultra-Low GWP)">HFO-1234ze (Ultra-Low GWP &lt;1, Green Pharma)</option>
                  <option value="HFA-134a (Norflurane)">HFA-134a (Standard Pharma Norflurane)</option>
                  <option value="HFA-227ea (Apaflurane)">HFA-227ea (Higher density for suspension stability)</option>
                </select>
              </div>
            )}

            {/* MMAD Slider */}
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs font-semibold text-slate-700">Mass Median Aerodynamic Diameter (MMAD)</span>
                <span className="text-xs font-mono font-bold text-cyan-600 tabular-nums">
                  {inhalationState.mmad_um.toFixed(1)} µm
                </span>
              </div>
              <input
                type="range"
                min="1.0"
                max="6.0"
                step="0.1"
                value={inhalationState.mmad_um}
                onChange={(e) => onUpdateInhalationState({ mmad_um: parseFloat(e.target.value) })}
                className="w-full accent-cyan-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Target 1.5 – 3.5 µm for deep bronchus & alveolar deposition
              </span>
            </div>

            {/* Inhalation Flow Rate */}
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs font-semibold text-slate-700">Patient Peak Inspiratory Flow (PIF)</span>
                <span className="text-xs font-mono font-bold text-slate-800 tabular-nums">
                  {inhalationState.flowRate_Lmin} L/min
                </span>
              </div>
              <input
                type="range"
                min="28"
                max="90"
                step="2"
                value={inhalationState.flowRate_Lmin}
                onChange={(e) => onUpdateInhalationState({ flowRate_Lmin: parseInt(e.target.value, 10) })}
                className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Aerodynamic Deposition Metrics */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
            <span className="text-xs font-bold text-slate-900 block">Pharmacopoeial Aerodynamic Indices</span>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                <span className="text-slate-600">Fine Particle Fraction (FPF &lt; 5µm)</span>
                <span className="font-mono font-bold text-cyan-700 tabular-nums">
                  {inhMetrics.fpf_pct}%
                </span>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                <span className="text-slate-600">Oropharyngeal Throat Loss</span>
                <span className={`font-mono font-bold tabular-nums ${inhMetrics.throatDeposition_pct > 30 ? 'text-rose-600' : 'text-slate-800'}`}>
                  {inhMetrics.throatDeposition_pct}%
                </span>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                <span className="text-slate-600">Deep Alveolar Penetration</span>
                <span className="font-mono font-bold text-emerald-600 tabular-nums">
                  {inhMetrics.deepLungDeposition_pct}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Stage: NGI Stage Distribution & Laboratory Setup (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* NGI 8-Stage Deposition Profile */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Next Generation Impactor (NGI) Stage Deposition Profile
                </h3>
                <p className="text-xs text-slate-500">
                  Aerodynamic mass fraction quantified across induction throat and stages 1–7 + MOC (Ph. Eur. 2.9.18 / USP &lt;601&gt;)
                </p>
              </div>
              <span className="text-xs font-mono text-cyan-600 font-bold">
                FPF: {inhMetrics.fpf_pct}%
              </span>
            </div>

            {/* Bar Chart Representation of NGI Stages */}
            <div className="h-64 w-full pt-4">
              <svg viewBox="0 0 500 200" className="w-full h-full overflow-visible">
                {/* Horizontal grid lines */}
                <line x1="45" y1="20" x2="480" y2="20" stroke="#E2E8F0" strokeWidth="1" />
                <line x1="45" y1="70" x2="480" y2="70" stroke="#E2E8F0" strokeWidth="1" />
                <line x1="45" y1="120" x2="480" y2="120" stroke="#E2E8F0" strokeWidth="1" />
                <line x1="45" y1="170" x2="480" y2="170" stroke="#94A3B8" strokeWidth="1.2" />
                <line x1="45" y1="20" x2="45" y2="170" stroke="#94A3B8" strokeWidth="1.2" />

                {/* Shaded Respirable Zone for Stages 2 to 5 */}
                <rect x="175" y="20" width="200" height="150" fill="#E0F2FE" opacity="0.4" />
                <text x="275" y="32" fill="#0284C7" fontSize="9" fontWeight="bold" textAnchor="middle">
                  RESPIRABLE LUNG TARGETING REGION (1.0 - 5.0 µm)
                </text>

                {/* Bars */}
                {inhMetrics.ngiStages.map((stage, idx) => {
                  const barWidth = 34;
                  const x = 58 + idx * 46;
                  // Max fraction around 35%
                  const barHeight = (stage.fraction_pct / 35) * 145;
                  const y = 170 - barHeight;
                  const isRespirable = idx >= 3 && idx <= 6;

                  return (
                    <g key={stage.stage}>
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={barHeight}
                        fill={isRespirable ? '#06B6D4' : idx < 2 ? '#94A3B8' : '#3B82F6'}
                        rx="2"
                      />
                      {/* Fraction value above bar */}
                      <text
                        x={x + barWidth / 2}
                        y={y - 4}
                        fill="#334155"
                        fontSize="8.5"
                        fontWeight="bold"
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        {stage.fraction_pct}%
                      </text>
                      {/* Stage Name below */}
                      <text
                        x={x + barWidth / 2}
                        y="183"
                        fill="#64748B"
                        fontSize="7.5"
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        {stage.stage.replace('Stage ', 'S')}
                      </text>
                      {/* Cutoff below */}
                      <text
                        x={x + barWidth / 2}
                        y="193"
                        fill="#94A3B8"
                        fontSize="7"
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        {stage.cutOff_um}
                      </text>
                    </g>
                  );
                })}

                {/* Y Axis labels */}
                <text x="38" y="24" fill="#94A3B8" fontSize="8" textAnchor="end" fontFamily="monospace">35%</text>
                <text x="38" y="74" fill="#94A3B8" fontSize="8" textAnchor="end" fontFamily="monospace">24%</text>
                <text x="38" y="124" fill="#94A3B8" fontSize="8" textAnchor="end" fontFamily="monospace">12%</text>
                <text x="38" y="174" fill="#94A3B8" fontSize="8" textAnchor="end" fontFamily="monospace">0%</text>
              </svg>
            </div>
          </div>

          {/* Real Laboratory NGI Image & Pulmonary Targeting Note */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Real Lab Image */}
            <div className="md:col-span-5 bg-white rounded-lg border border-slate-200 p-4">
              <span className="text-xs font-bold text-slate-800 block mb-2">
                NGI Cascade Impactor Apparatus
              </span>
              <div className="rounded overflow-hidden border border-slate-200 bg-slate-900">
                <img
                  src="/src/assets/images/inhalation_cascade_lab_1792773735057.jpg"
                  alt="Next Generation Impactor in Inhalation R&D Lab"
                  referrerPolicy="no-referrer"
                  className="w-full h-40 object-cover"
                />
              </div>
              <div className="mt-2 text-[11px] text-slate-500 leading-tight">
                Calibrated aerodynamic deposition testing using stainless steel cup trays and induction port.
              </div>
            </div>

            {/* Targeted Delivery Bioavailability Note */}
            <div className="md:col-span-7 bg-white rounded-lg border border-slate-200 p-4 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 block mb-2">
                  Clinical Advantages of Targeted Inhalation
                </span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  By engineering particles into the respirable aerodynamic window ({inhalationState.mmad_um.toFixed(1)} µm), the drug reaches the lower respiratory tract in seconds.
                </p>
                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 shrink-0"></span>
                    <span>Direct localized action eliminates extensive oral hepatic first-pass metabolism.</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 shrink-0"></span>
                    <span>Requires only <strong>10% to 20%</strong> of the conventional oral dose for equivalent or superior therapeutic outcome.</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 shrink-0"></span>
                    <span>Systemic adverse reactions (tremor, cardiotoxicity, adrenal suppression) are reduced by <strong>&gt;70%</strong>.</span>
                  </div>
                </div>
              </div>

              <div className="p-2.5 bg-cyan-50 border border-cyan-100 rounded text-[11px] text-cyan-900 mt-3 font-mono">
                Aerodynamic Mass Ratio: {(inhMetrics.deepLungDeposition_pct / Math.max(1, inhMetrics.throatDeposition_pct)).toFixed(2)}x (Lung to Oropharynx)
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Advanced Inhalation & Aerodynamic Particle Calculator (MMAD, GSD, FPD, RDF) */}
      {activeTab === 'ngi_cascade' && (
        <div id="aerodynamic-calculator" className="pt-2">
          <AdvancedAerodynamicCalculator
            currentDrug={currentDrug}
            onOpenGlossary={onOpenGlossary}
          />
        </div>
      )}
    </section>
  );
};
