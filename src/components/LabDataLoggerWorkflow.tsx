import React, { useState } from 'react';
import {
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  Beaker,
  Sliders,
  TrendingUp,
  FileCheck,
  FlaskConical,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  Award,
} from 'lucide-react';
import { CompoundProperties, DeliverySystemType } from '../types/pharmadds';
import { GlossaryTerm } from './GlossaryTerm';

interface LabDataLoggerWorkflowProps {
  currentDrug: CompoundProperties;
  systemType: DeliverySystemType;
  onOpenGlossary: (termId: string) => void;
}

export const LabDataLoggerWorkflow: React.FC<LabDataLoggerWorkflowProps> = ({
  currentDrug,
  systemType,
  onOpenGlossary,
}) => {
  const [activeStep, setActiveStep] = useState<number>(1);

  // Step 1: Pre-formulation Lab Inputs
  const [meltingPoint_C, setMeltingPoint_C] = useState<number>(216);
  const [solubility_pH12, setSolubility_pH12] = useState<number>(1.2); // µg/mL
  const [solubility_pH45, setSolubility_pH45] = useState<number>(2.4);
  const [solubility_pH68, setSolubility_pH68] = useState<number>(4.1);
  const [solubility_pH74, setSolubility_pH74] = useState<number>(5.8);
  const [crystallineForm, setCrystallineForm] = useState<string>('Form I (Metastable Anhydrate)');
  const [hygroscopicityDvs, setHygroscopicityDvs] = useState<number>(0.8); // % moisture at 80% RH
  const [pKaValue, setPkaValue] = useState<number>(4.2);

  // Step 3: Experimental Lab Measurements Logger
  const [labMeasuredSize_nm, setLabMeasuredSize_nm] = useState<number>(88.4);
  const [labMeasuredPdi, setLabMeasuredPdi] = useState<number>(0.095);
  const [labMeasuredZeta_mV, setLabMeasuredZeta_mV] = useState<number>(-4.2);
  const [labMeasuredEE_pct, setLabMeasuredEE_pct] = useState<number>(93.2);
  const [labMeasuredTg_C, setLabMeasuredTg_C] = useState<number>(98.5);
  const [labMeasuredFpf_pct, setLabMeasuredFpf_pct] = useState<number>(63.8);

  // Validation criteria
  const isSizePass = labMeasuredSize_nm >= 60 && labMeasuredSize_nm <= 130;
  const isPdiPass = labMeasuredPdi <= 0.20;
  const isZetaPass = Math.abs(labMeasuredZeta_mV) >= 25 || Math.abs(labMeasuredZeta_mV) <= 10;
  const isEePass = labMeasuredEE_pct >= 85.0;
  const isTgPass = labMeasuredTg_C >= 75.0;
  const isFpfPass = labMeasuredFpf_pct >= 50.0;

  // Compute overall readiness score
  const passedCount = [isSizePass, isPdiPass, isZetaPass, isEePass, isTgPass, isFpfPass].filter(Boolean).length;
  const readinessScore = Math.round((passedCount / 6) * 100);

  return (
    <section id="workflow" className="py-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 mb-2">
              <span>ICH Q8 PHARMACEUTICAL DEVELOPMENT (QbD)</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              End-to-End R&D Formulation Workflow & Lab Data Logger
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Step-by-step guidance: from raw API solid-state characterization to targeted nanocarrier design & QC specifications
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Active Compound:</span>
            <span className="text-xs font-semibold px-2 py-1 bg-slate-100 rounded text-slate-800">
              {currentDrug.name} ({currentDrug.bcsClass})
            </span>
          </div>
        </div>

        {/* Step Indicator Wizard Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-5 pt-4 border-t border-slate-100 text-xs">
          <button
            onClick={() => setActiveStep(1)}
            className={`p-2.5 rounded-lg border text-left transition-all ${
              activeStep === 1
                ? 'border-blue-500 bg-blue-50 text-blue-900 font-semibold shadow-xs'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="text-[10px] font-mono block text-slate-400">STEP 01</span>
            <span>Pre-Formulation Lab Data</span>
          </button>

          <button
            onClick={() => setActiveStep(2)}
            className={`p-2.5 rounded-lg border text-left transition-all ${
              activeStep === 2
                ? 'border-blue-500 bg-blue-50 text-blue-900 font-semibold shadow-xs'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="text-[10px] font-mono block text-slate-400">STEP 02</span>
            <span>Delivery System Decision</span>
          </button>

          <button
            onClick={() => setActiveStep(3)}
            className={`p-2.5 rounded-lg border text-left transition-all ${
              activeStep === 3
                ? 'border-blue-500 bg-blue-50 text-blue-900 font-semibold shadow-xs'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="text-[10px] font-mono block text-slate-400">STEP 03</span>
            <span>Lab Test vs Spec Logger</span>
          </button>

          <button
            onClick={() => setActiveStep(4)}
            className={`p-2.5 rounded-lg border text-left transition-all ${
              activeStep === 4
                ? 'border-blue-500 bg-blue-50 text-blue-900 font-semibold shadow-xs'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="text-[10px] font-mono block text-slate-400">STEP 04</span>
            <span>QbD Risk & Dossier Score</span>
          </button>
        </div>
      </div>

      {/* STEP 1: Pre-formulation Lab Inputs */}
      {activeStep === 1 && (
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Step 1: API Physicochemical & Solid-State Characterization Input
              </h3>
              <p className="text-xs text-slate-500">
                Enter experimental pre-formulation measurements from laboratory DSC, XRPD, and shake-flask solubility tests
              </p>
            </div>
            <button
              onClick={() => setActiveStep(2)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700 transition-colors"
            >
              <span>Next: System Selection</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
            {/* Melting point */}
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <span className="font-semibold text-slate-800 block">Melting Point (Tm from DSC)</span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-mono font-bold text-slate-900">{meltingPoint_C}°C</span>
                <span className="text-[11px] text-slate-500 font-mono">Enthalpy ΔHm: 42.1 J/g</span>
              </div>
              <input
                type="range"
                min="100"
                max="320"
                step="2"
                value={meltingPoint_C}
                onChange={(e) => setMeltingPoint_C(parseInt(e.target.value, 10))}
                className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block">
                High Tm (&gt;200°C) indicates strong crystal lattice energy and poor dissolution rate.
              </span>
            </div>

            {/* Solid State Form */}
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <span className="font-semibold text-slate-800 block">Polymorphic State (XRPD Diffractogram)</span>
              <select
                value={crystallineForm}
                onChange={(e) => setCrystallineForm(e.target.value)}
                className="w-full p-2 text-xs bg-white border border-slate-300 rounded text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              >
                <option value="Form I (Metastable Anhydrate)">Form I (Metastable Anhydrate - Higher Solubility)</option>
                <option value="Form II (Thermodynamically Stable)">Form II (Thermodynamically Stable - Low Solubility)</option>
                <option value="Monohydrate Pseudopolymorph">Monohydrate Pseudopolymorph (Slow Dissolution)</option>
                <option value="Amorphous Free Base">Amorphous Free Base (High Free Energy State)</option>
              </select>
              <span className="text-[10px] text-slate-400 block">
                Metastable forms risk conversion to stable form II during storage.
              </span>
            </div>

            {/* DVS Moisture Sorption */}
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <span className="font-semibold text-slate-800 block">Hygroscopicity (DVS at 80% RH)</span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-mono font-bold text-slate-900">{hygroscopicityDvs}% w/w</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                  Non-Hygroscopic
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="10.0"
                step="0.1"
                value={hygroscopicityDvs}
                onChange={(e) => setHygroscopicityDvs(parseFloat(e.target.value))}
                className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block">
                Moisture &gt;2% lowers glass transition Tg and triggers recrystallization.
              </span>
            </div>
          </div>

          {/* pH-Dependent Aqueous Solubility Profile */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">
                Aqueous Solubility vs Gastrointestinal pH Profile (Shake-Flask Equilibrium)
              </span>
              <span className="text-[11px] font-mono text-slate-500">Tested at 37°C in Biorelevant Buffers</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-white rounded border border-slate-200">
                <span className="text-[10px] font-mono text-slate-400 block">Gastric (pH 1.2)</span>
                <div className="mt-1 flex items-baseline">
                  <span className="text-lg font-bold font-mono text-slate-900">{solubility_pH12}</span>
                  <span className="text-[10px] font-mono text-slate-400 ml-1">µg/mL</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="50"
                  step="0.5"
                  value={solubility_pH12}
                  onChange={(e) => setSolubility_pH12(parseFloat(e.target.value))}
                  className="w-full accent-blue-600 h-1 bg-slate-200 rounded cursor-pointer mt-1"
                />
              </div>

              <div className="p-3 bg-white rounded border border-slate-200">
                <span className="text-[10px] font-mono text-slate-400 block">Duodenal (pH 4.5)</span>
                <div className="mt-1 flex items-baseline">
                  <span className="text-lg font-bold font-mono text-slate-900">{solubility_pH45}</span>
                  <span className="text-[10px] font-mono text-slate-400 ml-1">µg/mL</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="50"
                  step="0.5"
                  value={solubility_pH45}
                  onChange={(e) => setSolubility_pH45(parseFloat(e.target.value))}
                  className="w-full accent-blue-600 h-1 bg-slate-200 rounded cursor-pointer mt-1"
                />
              </div>

              <div className="p-3 bg-white rounded border border-slate-200">
                <span className="text-[10px] font-mono text-slate-400 block">Jejunal (pH 6.8)</span>
                <div className="mt-1 flex items-baseline">
                  <span className="text-lg font-bold font-mono text-slate-900">{solubility_pH68}</span>
                  <span className="text-[10px] font-mono text-slate-400 ml-1">µg/mL</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="50"
                  step="0.5"
                  value={solubility_pH68}
                  onChange={(e) => setSolubility_pH68(parseFloat(e.target.value))}
                  className="w-full accent-blue-600 h-1 bg-slate-200 rounded cursor-pointer mt-1"
                />
              </div>

              <div className="p-3 bg-white rounded border border-slate-200">
                <span className="text-[10px] font-mono text-slate-400 block">Ileal/Blood (pH 7.4)</span>
                <div className="mt-1 flex items-baseline">
                  <span className="text-lg font-bold font-mono text-slate-900">{solubility_pH74}</span>
                  <span className="text-[10px] font-mono text-slate-400 ml-1">µg/mL</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="50"
                  step="0.5"
                  value={solubility_pH74}
                  onChange={(e) => setSolubility_pH74(parseFloat(e.target.value))}
                  className="w-full accent-blue-600 h-1 bg-slate-200 rounded cursor-pointer mt-1"
                />
              </div>
            </div>

            <div className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded border border-amber-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Pre-Formulation Assessment:</strong> Solubility is sub-microgram across the entire GI tract (&lt;10 µg/mL). Conventional oral tablets will experience &lt;10% oral bioavailability. Targeted nanocarriers or Amorphous Solid Dispersions (ASD) are strongly recommended.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Delivery System Selection */}
      {activeStep === 2 && (
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Step 2: Rational Delivery Architecture Selection Tree
              </h3>
              <p className="text-xs text-slate-500">
                Algorithmic routing based on LogP, Molecular Weight, Target Site, and BCS classification
              </p>
            </div>
            <button
              onClick={() => setActiveStep(3)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700 transition-colors"
            >
              <span>Next: Log Lab QC Measurements</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Option 1 */}
            <div className="p-4 rounded-lg border border-blue-200 bg-blue-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-blue-900">1. Lipid Nanoparticles (LNPs)</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-600 text-white font-semibold">
                  RECOMMENDED FOR ONCOLOGY
                </span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Utilizes ionizable lipids (SM-102) with 70–120 nm diameter. Bypasses liver first-pass, maximizes tumor accumulation via the{' '}
                <GlossaryTerm id="epr_effect" onOpenGlossary={onOpenGlossary}>
                  EPR Effect
                </GlossaryTerm>
                , and enables ligand-targeted endocytosis.
              </p>
              <div className="text-[11px] font-mono text-blue-800 space-y-1">
                <div>• Expected Bioavailability: 75%–90%</div>
                <div>• Toxicity Reduction: &gt;50% lower Cmax</div>
              </div>
            </div>

            {/* Option 2 */}
            <div className="p-4 rounded-lg border border-amber-200 bg-amber-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-amber-900">2. Amorphous Solid Dispersion</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-600 text-white font-semibold">
                  RECOMMENDED FOR ORAL
                </span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Polymer glass matrix (HPMC-AS / Copovidone) calculated via the{' '}
                <GlossaryTerm id="gordon_taylor" onOpenGlossary={onOpenGlossary}>
                  Gordon-Taylor Equation
                </GlossaryTerm>
                . Sustains a 10-fold{' '}
                <GlossaryTerm id="spring_and_parachute" onOpenGlossary={onOpenGlossary}>
                  Spring & Parachute
                </GlossaryTerm>{' '}
                dissolution supersaturation.
              </p>
              <div className="text-[11px] font-mono text-amber-800 space-y-1">
                <div>• Expected Bioavailability: 65%–75%</div>
                <div>• Storage Stability: &gt;2 Years at 25°C</div>
              </div>
            </div>

            {/* Option 3 */}
            <div className="p-4 rounded-lg border border-cyan-200 bg-cyan-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-cyan-900">3. Pulmonary Inhalation (DPI/MDI)</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-600 text-white font-semibold">
                  RECOMMENDED FOR RESPIRATORY
                </span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Engineered aerodynamic particles with{' '}
                <GlossaryTerm id="mmad" onOpenGlossary={onOpenGlossary}>
                  MMAD
                </GlossaryTerm>{' '}
                between 1.5–3.5 µm and{' '}
                <GlossaryTerm id="fpf" onOpenGlossary={onOpenGlossary}>
                  FPF
                </GlossaryTerm>{' '}
                &gt;60%. Local direct airway delivery requires a fraction of oral dose.
              </p>
              <div className="text-[11px] font-mono text-cyan-800 space-y-1">
                <div>• Onset of Action: &lt; 5 minutes</div>
                <div>• Systemic Adverse Events: Eliminated</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Experimental Lab Measurements Logger */}
      {activeStep === 3 && (
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Step 3: Laboratory Analytical Measurements vs Target Specifications
              </h3>
              <p className="text-xs text-slate-500">
                Log real laboratory QC measurements from DLS, Zeta, HPLC, DSC, and Cascade Impactor testing
              </p>
            </div>
            <button
              onClick={() => setActiveStep(4)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700 transition-colors"
            >
              <span>Next: View QbD Risk & Score</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded">
              <thead className="bg-slate-50 font-mono text-[11px] uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Quality Attribute (CQA)</th>
                  <th className="py-2.5 px-3">Analytical Technique</th>
                  <th className="py-2.5 px-3">Target Specification</th>
                  <th className="py-2.5 px-3">Lab Measured Value</th>
                  <th className="py-2.5 px-3 text-center">QC Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans text-xs">
                {/* 1. Size */}
                <tr>
                  <td className="py-3 px-3 font-semibold text-slate-900">
                    <GlossaryTerm id="dls" onOpenGlossary={onOpenGlossary}>
                      Hydrodynamic Diameter (Dh)
                    </GlossaryTerm>
                  </td>
                  <td className="py-3 px-3 text-slate-500">DLS at 173° Backscatter</td>
                  <td className="py-3 px-3 font-mono text-slate-600">60 – 120 nm</td>
                  <td className="py-3 px-3">
                    <input
                      type="number"
                      step="0.5"
                      value={labMeasuredSize_nm}
                      onChange={(e) => setLabMeasuredSize_nm(parseFloat(e.target.value) || 0)}
                      className="w-24 px-2 py-1 font-mono text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                    <span className="font-mono text-slate-400 ml-1">nm</span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${isSizePass ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                      {isSizePass ? 'PASS' : 'OUT OF SPEC'}
                    </span>
                  </td>
                </tr>

                {/* 2. PDI */}
                <tr>
                  <td className="py-3 px-3 font-semibold text-slate-900">
                    <GlossaryTerm id="pdi" onOpenGlossary={onOpenGlossary}>
                      Polydispersity Index (PDI)
                    </GlossaryTerm>
                  </td>
                  <td className="py-3 px-3 text-slate-500">Cumulants ISO 22412</td>
                  <td className="py-3 px-3 font-mono text-slate-600">≤ 0.200</td>
                  <td className="py-3 px-3">
                    <input
                      type="number"
                      step="0.005"
                      value={labMeasuredPdi}
                      onChange={(e) => setLabMeasuredPdi(parseFloat(e.target.value) || 0)}
                      className="w-24 px-2 py-1 font-mono text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${isPdiPass ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                      {isPdiPass ? 'PASS' : 'POLYDIPERSE'}
                    </span>
                  </td>
                </tr>

                {/* 3. Zeta Potential */}
                <tr>
                  <td className="py-3 px-3 font-semibold text-slate-900">
                    <GlossaryTerm id="zeta_potential" onOpenGlossary={onOpenGlossary}>
                      Zeta Potential (ζ)
                    </GlossaryTerm>
                  </td>
                  <td className="py-3 px-3 text-slate-500">Phase Analysis Light Scatt.</td>
                  <td className="py-3 px-3 font-mono text-slate-600">|ζ| &gt; 25 mV or ±5 mV (PEG)</td>
                  <td className="py-3 px-3">
                    <input
                      type="number"
                      step="0.5"
                      value={labMeasuredZeta_mV}
                      onChange={(e) => setLabMeasuredZeta_mV(parseFloat(e.target.value) || 0)}
                      className="w-24 px-2 py-1 font-mono text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                    <span className="font-mono text-slate-400 ml-1">mV</span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${isZetaPass ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {isZetaPass ? 'PASS' : 'WARNING'}
                    </span>
                  </td>
                </tr>

                {/* 4. Encapsulation Efficiency */}
                <tr>
                  <td className="py-3 px-3 font-semibold text-slate-900">
                    <GlossaryTerm id="encapsulation_efficiency" onOpenGlossary={onOpenGlossary}>
                      Encapsulation Efficiency (%EE)
                    </GlossaryTerm>
                  </td>
                  <td className="py-3 px-3 text-slate-500">Ultrafiltration RP-HPLC</td>
                  <td className="py-3 px-3 font-mono text-slate-600">≥ 85.0%</td>
                  <td className="py-3 px-3">
                    <input
                      type="number"
                      step="0.5"
                      value={labMeasuredEE_pct}
                      onChange={(e) => setLabMeasuredEE_pct(parseFloat(e.target.value) || 0)}
                      className="w-24 px-2 py-1 font-mono text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                    <span className="font-mono text-slate-400 ml-1">%</span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${isEePass ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                      {isEePass ? 'PASS' : 'LOW EE'}
                    </span>
                  </td>
                </tr>

                {/* 5. Glass Transition (ASD) */}
                <tr>
                  <td className="py-3 px-3 font-semibold text-slate-900">
                    <GlossaryTerm id="gordon_taylor" onOpenGlossary={onOpenGlossary}>
                      Glass Transition (Tg,blend)
                    </GlossaryTerm>
                  </td>
                  <td className="py-3 px-3 text-slate-500">Modulated DSC at 2°C/min</td>
                  <td className="py-3 px-3 font-mono text-slate-600">≥ 75.0°C (Margin &gt;50°C)</td>
                  <td className="py-3 px-3">
                    <input
                      type="number"
                      step="0.5"
                      value={labMeasuredTg_C}
                      onChange={(e) => setLabMeasuredTg_C(parseFloat(e.target.value) || 0)}
                      className="w-24 px-2 py-1 font-mono text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                    <span className="font-mono text-slate-400 ml-1">°C</span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${isTgPass ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                      {isTgPass ? 'PASS' : 'UNSTABLE'}
                    </span>
                  </td>
                </tr>

                {/* 6. Inhalation FPF */}
                <tr>
                  <td className="py-3 px-3 font-semibold text-slate-900">
                    <GlossaryTerm id="fpf" onOpenGlossary={onOpenGlossary}>
                      Fine Particle Fraction (FPF &lt; 5µm)
                    </GlossaryTerm>
                  </td>
                  <td className="py-3 px-3 text-slate-500">NGI Cascade Impactor USP &lt;601&gt;</td>
                  <td className="py-3 px-3 font-mono text-slate-600">≥ 50.0%</td>
                  <td className="py-3 px-3">
                    <input
                      type="number"
                      step="0.5"
                      value={labMeasuredFpf_pct}
                      onChange={(e) => setLabMeasuredFpf_pct(parseFloat(e.target.value) || 0)}
                      className="w-24 px-2 py-1 font-mono text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                    <span className="font-mono text-slate-400 ml-1">%</span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${isFpfPass ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                      {isFpfPass ? 'PASS' : 'LOW FPF'}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STEP 4: QbD Risk Matrix & Readiness Score */}
      {activeStep === 4 && (
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Step 4: QbD Risk Assessment Matrix & Regulatory Readiness
              </h3>
              <p className="text-xs text-slate-500">
                ICH Q8 Critical Process Parameters (CPP) mapping against Critical Quality Attributes (CQA)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-600" />
              <div className="text-right">
                <span className="text-[10px] font-mono uppercase text-slate-400 block">Overall Readiness</span>
                <span className="text-sm font-bold text-emerald-600 font-mono">{readinessScore}% (READY FOR IN-VIVO)</span>
              </div>
            </div>
          </div>

          {/* QbD Matrix */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded">
              <thead className="bg-slate-50 font-mono text-[11px] uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Process Parameter (CPP)</th>
                  <th className="py-2.5 px-3">Target CQA Impacted</th>
                  <th className="py-2.5 px-3 text-center">Failure Mode Risk</th>
                  <th className="py-2.5 px-3">Engineering Control Strategy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans text-xs">
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">
                    Microfluidic Flow Rate Ratio (FRR 3:1)
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">Particle Size (Dh) & PDI</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-semibold">
                      MEDIUM RISK
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">
                    Maintain laminar Dean vortex mixing regime; automated pressure feedback pumps.
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">
                    Hot-Melt Extrusion Barrel Temp (145°C)
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">Thermolytic Degradation & Tg</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-semibold">
                      HIGH RISK
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">
                    Keep residence time &lt;90 seconds; inline NIR spectroscopy to detect crystallinity.
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">
                    Air-Jet Milling Micronization Pressure (6.5 bar)
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">MMAD & Electrostatic Charge</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-semibold">
                      MEDIUM RISK
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">
                    Add 0.5% magnesium stearate anti-adherent; control milling chamber RH at 40%.
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">
                    Tangential Flow Diafiltration (TFF)
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">Residual Ethanol & Tonicity</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                      LOW RISK
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">
                    10 diafiltration volumes with 100 kDa PES membrane; residual EtOH &lt;500 ppm.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Success Dossier Certificate Card */}
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-sm text-emerald-950 block">
                  Commercial & Regulatory Formulation Readiness: PASSED
                </span>
                <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                  Candidate formulation for <strong>{currentDrug.name}</strong> satisfies all CQAs according to ICH Q8 R2 guidelines. The formulation is cleared for pre-clinical pharmacokinetic animal trials and GMP scale-up batches.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveStep(1)}
              className="px-4 py-2 bg-emerald-700 text-white rounded font-semibold text-xs hover:bg-emerald-800 transition-colors whitespace-nowrap shrink-0"
            >
              Restart Calibration
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
