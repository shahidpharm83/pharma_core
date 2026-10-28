import React, { useState } from 'react';
import { Sliders, Sparkles, Shield, Cpu, Layers, RotateCw, Activity, ArrowRight, CheckCircle2, Barcode, DollarSign } from 'lucide-react';
import { CompoundProperties, NanoparticleState, SimulationResult } from '../types/pharmadds';
import { NanoparticleCharacterizationModule } from './NanoparticleCharacterizationModule';
import { LnpSynthesisWorkflow } from './LnpSynthesisWorkflow';
import { NanoparticleLimsModule } from './NanoparticleLimsModule';

interface NanoparticleStudioProps {
  currentDrug: CompoundProperties;
  nanoState: NanoparticleState;
  onUpdateNanoState: (state: Partial<NanoparticleState>) => void;
  simulation: SimulationResult | null;
  onOpenGlossary?: (termId?: string) => void;
}

export const NanoparticleStudio: React.FC<NanoparticleStudioProps> = ({
  currentDrug,
  nanoState,
  onUpdateNanoState,
  simulation,
  onOpenGlossary,
}) => {
  const [activeSection, setActiveSection] = useState<'formulation_designer' | 'synthesis_workflow' | 'characterization' | 'lims_cost'>('formulation_designer');
  const [releaseKineticsModel, setReleaseKineticsModel] = useState<'higuchi' | 'peppas' | 'zeroOrder'>('higuchi');

  const nanoMetrics = simulation?.nanoparticleMetrics || {
    diameter_nm: nanoState.particleDiameter_nm,
    pdi: 0.092,
    zetaPotential_mV: -4.2,
    encapsulationEfficiency_pct: 92.4,
    colloidalState: 'Sterically Stabilized by PEG Corona',
  };

  // Compute release curve data points (0 - 48 hours)
  const hours = [0, 2, 4, 8, 12, 18, 24, 36, 48];
  const releaseData = hours.map((t) => {
    let released = 0;
    if (releaseKineticsModel === 'zeroOrder') {
      released = Math.min(100, t * 2.1);
    } else if (releaseKineticsModel === 'higuchi') {
      released = Math.min(100, Math.sqrt(t) * 14.5);
    } else {
      // Korsmeyer-Peppas (Fickian diffusion n=0.45)
      released = Math.min(100, Math.pow(t, 0.45) * 18.2);
    }
    return { t, released: parseFloat(released.toFixed(1)) };
  });

  return (
    <section id="nanoparticles" className="py-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              02. Targeted Nanotechnology & Nanocarrier Engineering
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Formulation of Lipid Nanoparticles (LNPs), Stealth Liposomes, and Ligand-Functionalized Core-Shell Carriers
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Active API:</span>
            <span className="font-semibold text-slate-800">{currentDrug.name}</span>
          </div>
        </div>

        {/* Sub-navigation tabs */}
        <div className="flex flex-wrap items-center gap-1.5 mt-4 pt-4 border-t border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => setActiveSection('formulation_designer')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
              activeSection === 'formulation_designer'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Colloidal Formulation & Cross-Section</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('synthesis_workflow')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
              activeSection === 'synthesis_workflow'
                ? 'bg-gradient-to-r from-blue-700 to-indigo-700 text-white shadow-2xs'
                : 'text-blue-800 bg-blue-50/90 hover:bg-blue-100 border border-blue-200/60'
            }`}
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>LNP Synthesis Process Workflow (Microfluidics vs Thin-Film)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-blue-200 text-blue-900">
              Visual Synthesis
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('characterization')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
              activeSection === 'characterization'
                ? 'bg-purple-700 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>DLS & Physicochemical Characterization</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('lims_cost')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
              activeSection === 'lims_cost'
                ? 'bg-gradient-to-r from-emerald-700 to-teal-700 text-white shadow-2xs'
                : 'text-emerald-800 bg-emerald-50/90 hover:bg-emerald-100 border border-emerald-200/60'
            }`}
          >
            <Barcode className="w-3.5 h-3.5" />
            <span>LIMS Audit Trail & Cost Estimation</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-200 text-emerald-900">
              21 CFR Part 11
            </span>
          </button>
        </div>
      </div>

      {/* 1. LNP Synthesis Process Workflow Component */}
      {activeSection === 'synthesis_workflow' && (
        <LnpSynthesisWorkflow
          currentDrug={currentDrug}
          nanoState={nanoState}
          onApplyParameters={(params) => {
            onUpdateNanoState({
              particleDiameter_nm: params.particleDiameter_nm,
              pegFraction_pct: params.pegFraction_pct,
              coreMaterial: params.coreMaterial,
            });
          }}
          onOpenGlossary={onOpenGlossary}
        />
      )}

      {/* 2. LIMS Audit Trail & Cost Estimation Module */}
      {activeSection === 'lims_cost' && (
        <NanoparticleLimsModule
          currentDrug={currentDrug}
          nanoState={nanoState}
          onOpenGlossary={onOpenGlossary}
        />
      )}

      {/* 2. Formulation Designer Grid */}
      {activeSection === 'formulation_designer' && (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Parameter Panel (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-5">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              <span>Colloidal Formulation Variables</span>
            </h3>

            {/* Carrier System Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Nanocarrier Architecture
              </label>
              <select
                value={nanoState.coreMaterial}
                onChange={(e) => onUpdateNanoState({ coreMaterial: e.target.value })}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded text-slate-800 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              >
                <option value="Ionizable LNP (SM-102 / MC3)">Ionizable Lipid Nanoparticle (SM-102 / MC3)</option>
                <option value="PEGylated Stealth Liposome (HSPC/Chol/mPEG2000)">PEGylated Stealth Liposome (HSPC/Chol/mPEG2000)</option>
                <option value="Biodegradable Polymer (PLGA-b-PEG)">Biodegradable Copolymer (PLGA-b-PEG 50:50)</option>
                <option value="Polymeric Micelle (Soluplus / Pluronic F127)">Polymeric Micelle (Soluplus / Pluronic F127)</option>
              </select>
            </div>

            {/* Targeting Ligand Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Active Targeting Surface Ligand
              </label>
              <select
                value={nanoState.targetingLigand}
                onChange={(e) => onUpdateNanoState({ targetingLigand: e.target.value })}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded text-slate-800 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              >
                <option value="None (Passive EPR Targeting Only)">None (Passive EPR Targeting Only)</option>
                <option value="Folate Receptor Ligand (FR-alpha)">Folate Receptor Ligand (FR-alpha Overexpressed)</option>
                <option value="Transferrin Receptor Monoclonal (TfR1)">Transferrin Receptor Monoclonal (TfR1 BBB & Tumor)</option>
                <option value="Anti-HER2 Fab Antibody Fragment">Anti-HER2 Fab Antibody Fragment (Trastuzumab mimetic)</option>
                <option value="cRGD Peptide (alpha-v-beta-3 Integrin)">cRGD Peptide (alpha-v-beta-3 Angiogenesis)</option>
              </select>
            </div>

            {/* Particle Diameter Slider */}
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs font-semibold text-slate-700">Target Particle Diameter</span>
                <span className="text-xs font-mono font-bold text-blue-600 tabular-nums">
                  {nanoState.particleDiameter_nm} nm
                </span>
              </div>
              <input
                type="range"
                min="40"
                max="220"
                step="5"
                value={nanoState.particleDiameter_nm}
                onChange={(e) => onUpdateNanoState({ particleDiameter_nm: parseInt(e.target.value, 10) })}
                className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Optimal EPR accumulation window: 70 – 120 nm (avoids renal filtration & spleen clearance)
              </span>
            </div>

            {/* PEG Fraction Slider */}
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs font-semibold text-slate-700">PEG-Lipid Anchor Fraction</span>
                <span className="text-xs font-mono font-bold text-blue-600 tabular-nums">
                  {nanoState.pegFraction_pct.toFixed(1)} mol%
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="5.0"
                step="0.1"
                value={nanoState.pegFraction_pct}
                onChange={(e) => onUpdateNanoState({ pegFraction_pct: parseFloat(e.target.value) })}
                className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Governs steric brush density and stealth half-life in blood circulation
              </span>
            </div>

            {/* Ligand Density Slider */}
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs font-semibold text-slate-700">Surface Ligand Density</span>
                <span className="text-xs font-mono font-bold text-blue-600 tabular-nums">
                  {nanoState.ligandTargetDensity} ligands/NP
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="500"
                step="25"
                value={nanoState.ligandTargetDensity}
                onChange={(e) => onUpdateNanoState({ ligandTargetDensity: parseInt(e.target.value, 10) })}
                className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Controls multivalent avidity binding to target cancer cell receptors
              </span>
            </div>
          </div>

          {/* DLS & Zeta Scientific Status Card */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
            <span className="text-xs font-bold text-slate-900 block">Colloidal Quality Metrics</span>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                <span className="text-slate-600">Polydispersity Index (PDI)</span>
                <span className="font-mono font-bold text-emerald-600 tabular-nums">
                  {nanoMetrics.pdi} (Monodisperse)
                </span>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                <span className="text-slate-600">Zeta Potential (ζ)</span>
                <span className="font-mono font-bold text-slate-800 tabular-nums">
                  {nanoMetrics.zetaPotential_mV} mV
                </span>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                <span className="text-slate-600">Encapsulation Efficiency</span>
                <span className="font-mono font-bold text-blue-600 tabular-nums">
                  {nanoMetrics.encapsulationEfficiency_pct}%
                </span>
              </div>
              <div className="p-2 bg-blue-50/70 rounded text-[11px] text-blue-900">
                <span className="font-semibold">Steric State:</span> {nanoMetrics.colloidalState}
              </div>
            </div>
          </div>

          {/* Quick Jump to LNP Synthesis Workflow */}
          <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg text-xs space-y-1.5 shadow-2xs">
            <div className="flex items-center gap-1.5 font-bold text-blue-950">
              <RotateCw className="w-3.5 h-3.5 text-blue-700" />
              <span>Simulate LNP Synthesis Workflow</span>
            </div>
            <p className="text-[11px] text-blue-800 leading-snug">
              Toggle between Microfluidic Mixing (FRR, TFR) vs Thin-Film Hydration (Extrusion, Remote Loading).
            </p>
            <button
              type="button"
              onClick={() => setActiveSection('synthesis_workflow')}
              className="w-full mt-1 py-1.5 px-2.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] flex items-center justify-center gap-1 transition-colors shadow-2xs"
            >
              <span>Open Synthesis Workflow</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Right Stage: Interactive SVG Morphology & Cryo-TEM Gallery (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Interactive Nanoparticle Morphology Visualizer */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Targeted Nanocarrier Cross-Section Simulation
                </h3>
                <p className="text-xs text-slate-500">
                  Hydrodynamic radius representation with surface PEG brush and ligand distribution
                </p>
              </div>
              <span className="text-xs font-mono text-slate-500">
                Scale: ~{nanoState.particleDiameter_nm} nm
              </span>
            </div>

            {/* SVG Nanoparticle Stage */}
            <div className="relative w-full h-80 bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center mt-4">
              <svg viewBox="0 0 400 300" className="w-full h-full">
                {/* Background Grid */}
                <defs>
                  <pattern id="nanoGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <line x1="0" y1="0" x2="20" y2="0" stroke="#1E293B" strokeWidth="0.5" />
                    <line x1="0" y1="0" x2="0" y2="20" stroke="#1E293B" strokeWidth="0.5" />
                  </pattern>
                  <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.8" />
                    <stop offset="70%" stopColor="#0284C7" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#0369A1" stopOpacity="0.1" />
                  </radialGradient>
                  <radialGradient id="payloadGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity="1" />
                    <stop offset="100%" stopColor="#D97706" stopOpacity="0.8" />
                  </radialGradient>
                </defs>

                <rect width="400" height="300" fill="url(#nanoGrid)" />

                {/* Outer Hydrodynamic Cloud (Steric PEG Layer) */}
                <circle
                  cx="200"
                  cy="150"
                  r={85 + nanoState.pegFraction_pct * 8}
                  fill="none"
                  stroke="#38BDF8"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                  opacity="0.6"
                />

                {/* Lipid Bilayer Outer Headgroups */}
                <circle
                  cx="200"
                  cy="150"
                  r="85"
                  fill="url(#coreGlow)"
                  stroke="#0EA5E9"
                  strokeWidth="6"
                  opacity="0.9"
                />

                {/* Lipid Bilayer Inner Shell */}
                <circle
                  cx="200"
                  cy="150"
                  r="72"
                  fill="none"
                  stroke="#0284C7"
                  strokeWidth="4"
                  opacity="0.8"
                />

                {/* Hydrophobic Lipid Tails Texture in Bilayer */}
                {Array.from({ length: 48 }).map((_, i) => {
                  const angle = (i / 48) * Math.PI * 2;
                  const r1 = 73;
                  const r2 = 82;
                  const x1 = 200 + Math.cos(angle) * r1;
                  const y1 = 150 + Math.sin(angle) * r1;
                  const x2 = 200 + Math.cos(angle) * r2;
                  const y2 = 150 + Math.sin(angle) * r2;
                  return (
                    <line
                      key={i}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="#0369A1"
                      strokeWidth="1.5"
                      opacity="0.7"
                    />
                  );
                })}

                {/* Encapsulated Drug Payload / mRNA Core Molecules */}
                {Array.from({ length: 18 }).map((_, i) => {
                  const rad = 15 + (i * 3.2) % 45;
                  const angle = i * 1.35;
                  const cx = 200 + Math.cos(angle) * rad;
                  const cy = 150 + Math.sin(angle) * rad;
                  return (
                    <g key={i}>
                      <circle cx={cx} cy={cy} r="4.5" fill="url(#payloadGlow)" />
                      <circle cx={cx} cy={cy} r="2" fill="#FEF3C7" />
                    </g>
                  );
                })}

                {/* PEG Polymer Bristles Extending Outward */}
                {Array.from({ length: 32 }).map((_, i) => {
                  const angle = (i / 32) * Math.PI * 2;
                  const baseR = 85;
                  const tipR = 85 + nanoState.pegFraction_pct * 7.5;
                  const bx = 200 + Math.cos(angle) * baseR;
                  const by = 150 + Math.sin(angle) * baseR;
                  const midX = 200 + Math.cos(angle + 0.05) * (baseR + 8);
                  const midY = 150 + Math.sin(angle + 0.05) * (baseR + 8);
                  const tx = 200 + Math.cos(angle) * tipR;
                  const ty = 150 + Math.sin(angle) * tipR;

                  return (
                    <path
                      key={i}
                      d={`M ${bx} ${by} Q ${midX} ${midY} ${tx} ${ty}`}
                      fill="none"
                      stroke="#7DD3FC"
                      strokeWidth="1.2"
                      opacity="0.85"
                    />
                  );
                })}

                {/* Active Targeting Ligands at PEG Tips */}
                {nanoState.targetingLigand !== 'None (Passive EPR Targeting Only)' &&
                  Array.from({ length: Math.min(16, Math.max(4, Math.round(nanoState.ligandTargetDensity / 25))) }).map((_, i) => {
                    const angle = (i / 16) * Math.PI * 2 + 0.1;
                    const tipR = 88 + nanoState.pegFraction_pct * 7.5;
                    const lx = 200 + Math.cos(angle) * tipR;
                    const ly = 150 + Math.sin(angle) * tipR;

                    return (
                      <g key={i}>
                        <polygon
                          points={`${lx},${ly - 4} ${lx + 4},${ly + 4} ${lx - 4},${ly + 4}`}
                          fill="#F43F5E"
                          stroke="#FFFFFF"
                          strokeWidth="0.8"
                        />
                      </g>
                    );
                  })}

                {/* Annotations */}
                <text x="20" y="30" fill="#94A3B8" fontSize="11" fontFamily="monospace">
                  Hydrodynamic Dh: {nanoState.particleDiameter_nm} nm
                </text>
                <text x="20" y="46" fill="#38BDF8" fontSize="10" fontFamily="monospace">
                  PEG Corona: {nanoState.pegFraction_pct}% mol
                </text>
                <text x="20" y="62" fill="#F43F5E" fontSize="10" fontFamily="monospace">
                  Ligand: {nanoState.targetingLigand.split(' ')[0]}
                </text>

                {/* Payload Label */}
                <text x="200" y="153" fill="#FFFFFF" fontSize="11" fontWeight="bold" textAnchor="middle">
                  {currentDrug.name} Core
                </text>
              </svg>
            </div>
          </div>

          {/* Cryo-TEM Micrograph & In-Vitro Release Kinetics */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Real Cryo-TEM generated asset */}
            <div className="md:col-span-5 bg-white rounded-lg border border-slate-200 p-4">
              <span className="text-xs font-bold text-slate-800 block mb-2">
                Cryo-TEM Micrograph & Morphometry
              </span>
              <div className="rounded overflow-hidden border border-slate-200 bg-slate-900">
                <img
                  src="/src/assets/images/nano_carrier_microscopy_1792773734967.jpg"
                  alt="Cryo-TEM Nanoparticle Ultrastructure"
                  referrerPolicy="no-referrer"
                  className="w-full h-40 object-cover"
                />
              </div>
              <div className="mt-2 text-[11px] text-slate-500 leading-tight">
                Vitreous ice cryo-TEM confirms spherical lamellar unilamellarity without precipitation.
              </div>
            </div>

            {/* In-Vitro Dissolution & Release Kinetics Chart */}
            <div className="md:col-span-7 bg-white rounded-lg border border-slate-200 p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800">In-Vitro Release Kinetics</span>
                  <div className="flex items-center gap-1 text-[11px]">
                    <button
                      onClick={() => setReleaseKineticsModel('higuchi')}
                      className={`px-2 py-0.5 rounded transition-colors ${
                        releaseKineticsModel === 'higuchi' ? 'bg-blue-600 text-white font-medium' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      Higuchi
                    </button>
                    <button
                      onClick={() => setReleaseKineticsModel('peppas')}
                      className={`px-2 py-0.5 rounded transition-colors ${
                        releaseKineticsModel === 'peppas' ? 'bg-blue-600 text-white font-medium' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      Peppas
                    </button>
                    <button
                      onClick={() => setReleaseKineticsModel('zeroOrder')}
                      className={`px-2 py-0.5 rounded transition-colors ${
                        releaseKineticsModel === 'zeroOrder' ? 'bg-blue-600 text-white font-medium' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      Zero-Order
                    </button>
                  </div>
                </div>

                {/* SVG Release Curve */}
                <div className="h-36 w-full pt-2">
                  <svg viewBox="0 0 280 120" className="w-full h-full overflow-visible">
                    {/* Grid lines */}
                    <line x1="30" y1="10" x2="270" y2="10" stroke="#E2E8F0" strokeWidth="1" />
                    <line x1="30" y1="55" x2="270" y2="55" stroke="#E2E8F0" strokeWidth="1" />
                    <line x1="30" y1="100" x2="270" y2="100" stroke="#94A3B8" strokeWidth="1.2" />
                    <line x1="30" y1="10" x2="30" y2="100" stroke="#94A3B8" strokeWidth="1.2" />

                    {/* Y-axis labels */}
                    <text x="25" y="14" fill="#94A3B8" fontSize="8" textAnchor="end" fontFamily="monospace">100%</text>
                    <text x="25" y="58" fill="#94A3B8" fontSize="8" textAnchor="end" fontFamily="monospace">50%</text>
                    <text x="25" y="103" fill="#94A3B8" fontSize="8" textAnchor="end" fontFamily="monospace">0%</text>

                    {/* Curve line */}
                    <path
                      d={releaseData.reduce((acc, d, i) => {
                        const x = 30 + (d.t / 48) * 240;
                        const y = 100 - (d.released / 100) * 90;
                        return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
                      }, '')}
                      fill="none"
                      stroke="#2563EB"
                      strokeWidth="2.2"
                    />

                    {/* Dots */}
                    {releaseData.map((d, i) => {
                      const x = 30 + (d.t / 48) * 240;
                      const y = 100 - (d.released / 100) * 90;
                      return <circle key={i} cx={x} cy={y} r="2.5" fill="#1D4ED8" stroke="#FFFFFF" strokeWidth="1" />;
                    })}

                    {/* X-axis labels */}
                    <text x="30" y="114" fill="#94A3B8" fontSize="8" textAnchor="middle" fontFamily="monospace">0h</text>
                    <text x="150" y="114" fill="#94A3B8" fontSize="8" textAnchor="middle" fontFamily="monospace">24h</text>
                    <text x="270" y="114" fill="#94A3B8" fontSize="8" textAnchor="middle" fontFamily="monospace">48h</text>
                  </svg>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 font-mono mt-1 flex justify-between">
                <span>Model: {releaseKineticsModel === 'higuchi' ? 'Q = K_H · t^(1/2)' : releaseKineticsModel === 'peppas' ? 'Mt/M∞ = K · t^n' : 'Mt = K0 · t'}</span>
                <span>Cumulative 48h: {releaseData[releaseData.length - 1].released}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* 3. Advanced Nanoparticle Physicochemical Characterization Tool (DLS, Zeta Potential, EE%/DL%) */}
      {(activeSection === 'characterization' || activeSection === 'formulation_designer') && (
        <div id="nanoparticle-characterization" className="pt-2">
          <NanoparticleCharacterizationModule
            currentDrug={currentDrug}
            onOpenGlossary={onOpenGlossary}
          />
        </div>
      )}
    </section>
  );
};
