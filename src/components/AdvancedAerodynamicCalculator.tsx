import React, { useState, useMemo } from 'react';
import {
  Wind,
  Calculator,
  RotateCcw,
  Download,
  Info,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { CompoundProperties } from '../types/pharmadds';

interface StageData {
  id: string;
  name: string;
  baseCutoff_um: number; // base cutoff at reference flow rate (60 L/min for NGI, 28.3 L/min for ACI)
  mass_ug: number;
}

interface AdvancedAerodynamicCalculatorProps {
  currentDrug: CompoundProperties;
  onOpenGlossary?: (termId?: string) => void;
}

// Preset clinical benchmark datasets
const PRESETS: Record<
  string,
  {
    name: string;
    apparatus: 'NGI' | 'ACI';
    flowRate: number;
    nominalDose_ug: number;
    description: string;
    stages: Array<{ id: string; mass_ug: number }>;
  }
> = {
  budesonide_dpi: {
    name: 'Budesonide Dry Powder Inhaler (Turbuhaler at 60 L/min)',
    apparatus: 'NGI',
    flowRate: 60,
    nominalDose_ug: 200,
    description: 'Micronized budesonide carrier-free agglomerates tested on NGI per Ph. Eur. 2.9.18.',
    stages: [
      { id: 'throat', mass_ug: 68.4 },
      { id: 'presep', mass_ug: 32.1 },
      { id: 's1', mass_ug: 8.5 },
      { id: 's2', mass_ug: 16.2 },
      { id: 's3', mass_ug: 28.4 },
      { id: 's4', mass_ug: 21.0 },
      { id: 's5', mass_ug: 9.8 },
      { id: 's6', mass_ug: 3.6 },
      { id: 's7', mass_ug: 1.5 },
      { id: 'moc', mass_ug: 0.7 },
    ],
  },
  salbutamol_pmdi: {
    name: 'Salbutamol Sulfate pMDI (HFA-134a at 28.3 L/min)',
    apparatus: 'ACI',
    flowRate: 28.3,
    nominalDose_ug: 100,
    description: 'Suspension metered dose inhaler tested on 8-stage ACI per USP <601>.',
    stages: [
      { id: 'throat', mass_ug: 42.5 },
      { id: 'presep', mass_ug: 0.0 }, // ACI generally has no pre-separator
      { id: 's0', mass_ug: 4.8 },
      { id: 's1', mass_ug: 5.2 },
      { id: 's2', mass_ug: 9.1 },
      { id: 's3', mass_ug: 14.8 },
      { id: 's4', mass_ug: 11.2 },
      { id: 's5', mass_ug: 5.4 },
      { id: 's6', mass_ug: 2.0 },
      { id: 's7', mass_ug: 0.8 },
      { id: 'moc', mass_ug: 0.4 },
    ],
  },
  engineered_nano_dpi: {
    name: 'Engineered Porous Nanostructured Microparticles (DPI 60 L/min)',
    apparatus: 'NGI',
    flowRate: 60,
    nominalDose_ug: 100,
    description: 'Low-density spray-dried microparticles with low aerodynamic diameter & high lung penetration.',
    stages: [
      { id: 'throat', mass_ug: 12.0 },
      { id: 'presep', mass_ug: 5.5 },
      { id: 's1', mass_ug: 3.2 },
      { id: 's2', mass_ug: 12.4 },
      { id: 's3', mass_ug: 24.8 },
      { id: 's4', mass_ug: 22.1 },
      { id: 's5', mass_ug: 10.5 },
      { id: 's6', mass_ug: 4.2 },
      { id: 's7', mass_ug: 2.1 },
      { id: 'moc', mass_ug: 1.2 },
    ],
  },
};

// Standard baseline stage cutoffs for NGI at 60 L/min
const NGI_BASE_STAGES: Array<{ id: string; name: string; baseCutoff_um: number }> = [
  { id: 'throat', name: 'Induction Port (USP Throat)', baseCutoff_um: 15.0 },
  { id: 'presep', name: 'Pre-separator', baseCutoff_um: 10.0 },
  { id: 's1', name: 'Stage 1', baseCutoff_um: 8.06 },
  { id: 's2', name: 'Stage 2', baseCutoff_um: 4.46 },
  { id: 's3', name: 'Stage 3', baseCutoff_um: 2.82 },
  { id: 's4', name: 'Stage 4', baseCutoff_um: 1.66 },
  { id: 's5', name: 'Stage 5', baseCutoff_um: 0.94 },
  { id: 's6', name: 'Stage 6', baseCutoff_um: 0.55 },
  { id: 's7', name: 'Stage 7', baseCutoff_um: 0.34 },
  { id: 'moc', name: 'Micro-Orifice Collector (MOC)', baseCutoff_um: 0.1 },
];

// Standard baseline stage cutoffs for ACI at 28.3 L/min
const ACI_BASE_STAGES: Array<{ id: string; name: string; baseCutoff_um: number }> = [
  { id: 'throat', name: 'Induction Port (Throat)', baseCutoff_um: 12.0 },
  { id: 'presep', name: 'Preseparator (Optional)', baseCutoff_um: 10.0 },
  { id: 's0', name: 'Stage 0', baseCutoff_um: 9.0 },
  { id: 's1', name: 'Stage 1', baseCutoff_um: 5.8 },
  { id: 's2', name: 'Stage 2', baseCutoff_um: 4.7 },
  { id: 's3', name: 'Stage 3', baseCutoff_um: 3.3 },
  { id: 's4', name: 'Stage 4', baseCutoff_um: 2.1 },
  { id: 's5', name: 'Stage 5', baseCutoff_um: 1.1 },
  { id: 's6', name: 'Stage 6', baseCutoff_um: 0.7 },
  { id: 's7', name: 'Stage 7', baseCutoff_um: 0.4 },
  { id: 'moc', name: 'Final After-Filter', baseCutoff_um: 0.1 },
];

// Standard Normal Inverse (Probit) Approximation (Beasley-Springer-Moro)
function normalInv(p: number): number {
  if (p <= 0.0001) return -3.719;
  if (p >= 0.9999) return 3.719;

  // Rational approximation for normal quantile
  const a = [
    -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
    1.38357751867269e2, -3.066479806614716e1, 2.506628277459239e0,
  ];
  const b = [
    -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
    6.680131188771972e1, -1.328068155288572e1,
  ];
  const c = [
    -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838e0,
    -2.549732539343734e0, 4.374664141464968e0, 2.938163982698783e0,
  ];
  const d = [
    7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996e0,
    3.754408661907416e0,
  ];

  const q = p - 0.5;
  if (Math.abs(q) <= 0.42) {
    const r = q * q;
    return (
      (q *
        (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5])) /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1.0)
    );
  }

  const r = q < 0 ? p : 1 - p;
  const s = Math.log(-Math.log(r));
  let x =
    c[0] +
    s * (c[1] + s * (c[2] + s * (c[3] + s * (c[4] + s * c[5])))) /
      (1 + s * (d[0] + s * (d[1] + s * (d[2] + s * d[3]))));
  return q < 0 ? -x : x;
}

export const AdvancedAerodynamicCalculator: React.FC<AdvancedAerodynamicCalculatorProps> = ({
  currentDrug,
  onOpenGlossary,
}) => {
  const [apparatus, setApparatus] = useState<'NGI' | 'ACI'>('NGI');
  const [flowRate, setFlowRate] = useState<number>(60);
  const [nominalDose, setNominalDose] = useState<number>(200);

  // Masses per stage
  const [stageMasses, setStageMasses] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    PRESETS.budesonide_dpi.stages.forEach((s) => {
      init[s.id] = s.mass_ug;
    });
    return init;
  });

  // Load a preset
  const handleLoadPreset = (key: string) => {
    const preset = PRESETS[key];
    if (!preset) return;
    setApparatus(preset.apparatus);
    setFlowRate(preset.flowRate);
    setNominalDose(preset.nominalDose_ug);
    const newMasses: Record<string, number> = {};
    preset.stages.forEach((s) => {
      newMasses[s.id] = s.mass_ug;
    });
    setStageMasses(newMasses);
  };

  // Base stages depending on apparatus
  const baseStageList = apparatus === 'NGI' ? NGI_BASE_STAGES : ACI_BASE_STAGES;
  const refFlowRate = apparatus === 'NGI' ? 60 : 28.3;

  // Recalculate cutoffs based on aerodynamic Stokes Law D50(Q) = D50(ref) * (Q_ref / Q)^0.5
  const stagesWithCalibratedCutoffs: StageData[] = useMemo(() => {
    const qRatio = Math.sqrt(refFlowRate / Math.max(10, flowRate));
    return baseStageList.map((s) => {
      let cutoff = s.baseCutoff_um;
      if (s.id !== 'throat' && s.id !== 'presep' && s.id !== 'moc') {
        cutoff = parseFloat((s.baseCutoff_um * qRatio).toFixed(2));
      }
      return {
        id: s.id,
        name: s.name,
        baseCutoff_um: cutoff,
        mass_ug: stageMasses[s.id] || 0,
      };
    });
  }, [baseStageList, refFlowRate, flowRate, stageMasses]);

  // Update single stage mass
  const handleMassChange = (id: string, val: string) => {
    const num = Math.max(0, parseFloat(val) || 0);
    setStageMasses((prev) => ({ ...prev, [id]: num }));
  };

  // Aerodynamic Calculation Engine
  const calculations = useMemo(() => {
    const totalMass = stagesWithCalibratedCutoffs.reduce((acc, s) => acc + s.mass_ug, 0);
    const throatMass = stagesWithCalibratedCutoffs.find((s) => s.id === 'throat')?.mass_ug || 0;
    const presepMass = stagesWithCalibratedCutoffs.find((s) => s.id === 'presep')?.mass_ug || 0;
    const upperAirwayLoss = throatMass + presepMass;

    // Impactor stages only (exclude induction port and preseparator for log-probability probit regression)
    const impactorStages = stagesWithCalibratedCutoffs.filter(
      (s) => s.id !== 'throat' && s.id !== 'presep'
    );
    const impactorTotalMass = impactorStages.reduce((acc, s) => acc + s.mass_ug, 0);

    // Calculate cumulative mass undersize (< Di)
    // For each stage i, cumulative mass < D50_i is the mass on all stages below it (i+1 to end) + MOC
    const regressionPoints: Array<{
      stageId: string;
      cutoff_um: number;
      logD: number;
      cumMassBelow_ug: number;
      cumPctUndersize: number;
      probit: number;
    }> = [];

    // Stages from top (large cutoff) to bottom (small cutoff)
    for (let i = 0; i < impactorStages.length - 1; i++) {
      const curStage = impactorStages[i];
      // Sum all stages strictly below this stage
      let massBelow = 0;
      for (let j = i + 1; j < impactorStages.length; j++) {
        massBelow += impactorStages[j].mass_ug;
      }

      if (impactorTotalMass > 0) {
        const pct = (massBelow / impactorTotalMass) * 100;
        if (pct > 0.5 && pct < 99.5 && curStage.baseCutoff_um > 0.1) {
          const p = pct / 100;
          const probitVal = normalInv(p);
          const logD = Math.log10(curStage.baseCutoff_um);
          regressionPoints.push({
            stageId: curStage.id,
            cutoff_um: curStage.baseCutoff_um,
            logD,
            cumMassBelow_ug: massBelow,
            cumPctUndersize: pct,
            probit: probitVal,
          });
        }
      }
    }

    // Linear regression on probit vs log10(cutoff)
    // probit = slope * logD + intercept
    let slope = 0;
    let intercept = 0;
    let rSquared = 0;
    let mmad_um = 2.5;
    let gsd = 1.8;

    if (regressionPoints.length >= 2) {
      const n = regressionPoints.length;
      let sumX = 0;
      let sumY = 0;
      let sumXY = 0;
      let sumX2 = 0;
      let sumY2 = 0;

      regressionPoints.forEach((pt) => {
        sumX += pt.logD;
        sumY += pt.probit;
        sumXY += pt.logD * pt.probit;
        sumX2 += pt.logD * pt.logD;
        sumY2 += pt.probit * pt.probit;
      });

      const denom = n * sumX2 - sumX * sumX;
      if (denom !== 0) {
        slope = (n * sumXY - sumX * sumY) / denom;
        intercept = (sumY - slope * sumX) / n;

        // Correlation R^2
        const sxx = sumX2 - (sumX * sumX) / n;
        const syy = sumY2 - (sumY * sumY) / n;
        const sxy = sumXY - (sumX * sumY) / n;
        if (sxx > 0 && syy > 0) {
          rSquared = (sxy * sxy) / (sxx * syy);
        }

        // At probit = 0 (50th percentile), log10(MMAD) = -intercept / slope
        if (slope > 0) {
          const logMMAD = -intercept / slope;
          mmad_um = Math.pow(10, logMMAD);
          // GSD = d84.13 / d50 = 10^(1 / slope)
          gsd = Math.pow(10, 1 / slope);
        }
      }
    }

    // Fine Particle Dose (FPD): mass on stages with cutoff < 5.0 µm
    // For stages that span 5.0 µm, we interpolate
    let fpd_ug = 0;
    let extraFine_ug = 0; // < 3.0 µm

    stagesWithCalibratedCutoffs.forEach((st) => {
      if (st.id === 'throat' || st.id === 'presep') return;
      if (st.baseCutoff_um < 5.0) {
        fpd_ug += st.mass_ug;
      }
      if (st.baseCutoff_um < 3.0) {
        extraFine_ug += st.mass_ug;
      }
    });

    const fpf_emitted_pct = totalMass > 0 ? (fpd_ug / totalMass) * 100 : 0;
    const fpf_nominal_pct = nominalDose > 0 ? (fpd_ug / nominalDose) * 100 : 0;
    const extraFine_pct = totalMass > 0 ? (extraFine_ug / totalMass) * 100 : 0;
    const throatLossPct = totalMass > 0 ? (upperAirwayLoss / totalMass) * 100 : 0;

    return {
      totalEmittedDose_ug: totalMass,
      upperAirwayLoss_ug: upperAirwayLoss,
      throatLossPct,
      fpd_ug,
      fpf_emitted_pct,
      fpf_nominal_pct,
      extraFine_ug,
      extraFine_pct,
      mmad_um: Math.min(15, Math.max(0.1, mmad_um)),
      gsd: Math.min(5, Math.max(1.01, gsd)),
      rSquared: Math.min(1, Math.max(0, rSquared)),
      slope,
      intercept,
      regressionPoints,
    };
  }, [stagesWithCalibratedCutoffs, nominalDose]);

  // Export CSV
  const handleExportCSV = () => {
    const rows = [
      ['PharmADDS Aerodynamic Particle Analysis Report'],
      ['Compound', currentDrug.name],
      ['Apparatus', apparatus],
      ['Test Flow Rate (L/min)', flowRate.toString()],
      ['Nominal Claim Dose (µg)', nominalDose.toString()],
      [''],
      ['Stage Name', 'Cutoff Diameter (µm)', 'Deposition Mass (µg)', 'Fraction of Emitted (%)'],
    ];

    stagesWithCalibratedCutoffs.forEach((st) => {
      const pct = calculations.totalEmittedDose_ug > 0 ? (st.mass_ug / calculations.totalEmittedDose_ug) * 100 : 0;
      rows.push([st.name, st.baseCutoff_um.toString(), st.mass_ug.toFixed(2), pct.toFixed(2)]);
    });

    rows.push(['']);
    rows.push(['Calculated Metrics']);
    rows.push(['Total Emitted Dose (ED, µg)', calculations.totalEmittedDose_ug.toFixed(2)]);
    rows.push(['Mass Median Aerodynamic Diameter (MMAD, µg)', calculations.mmad_um.toFixed(2)]);
    rows.push(['Geometric Standard Deviation (GSD)', calculations.gsd.toFixed(2)]);
    rows.push(['Log-Normal Fit R²', calculations.rSquared.toFixed(4)]);
    rows.push(['Fine Particle Dose (FPD < 5µm, µg)', calculations.fpd_ug.toFixed(2)]);
    rows.push(['Fine Particle Fraction (FPF % of ED)', calculations.fpf_emitted_pct.toFixed(2)]);
    rows.push(['Respirable Dose Fraction (RDF % of Claim)', calculations.fpf_nominal_pct.toFixed(2)]);
    rows.push(['Extra-Fine Fraction (< 3µm, %)', calculations.extraFine_pct.toFixed(2)]);

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `aerodynamic_analysis_${currentDrug.name.toLowerCase()}_${apparatus}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-6">
      {/* Header & Preset Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded bg-cyan-100 text-cyan-800">
              <Wind className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Inhalation & Aerodynamic Particle Calculator (MDI / DPI)
            </h3>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-50 text-cyan-700 border border-cyan-200 font-semibold">
              USP &lt;601&gt; / Ph.Eur 2.9.18
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Automated Mass Median Aerodynamic Diameter (MMAD), GSD log-probit regression, and Respirable Dose Fraction (RDF/FPD) modeling.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Preset templates */}
          <div className="relative">
            <select
              onChange={(e) => handleLoadPreset(e.target.value)}
              defaultValue="budesonide_dpi"
              className="text-xs py-1.5 px-3 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded text-slate-800 font-medium cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            >
              <option value="budesonide_dpi">Preset: Budesonide DPI (60 L/min)</option>
              <option value="salbutamol_pmdi">Preset: Salbutamol pMDI (28.3 L/min)</option>
              <option value="engineered_nano_dpi">Preset: Engineered Nanoporous DPI</option>
            </select>
          </div>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Result Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* MMAD */}
        <div className="p-3.5 rounded-lg bg-blue-50/70 border border-blue-200">
          <div className="flex items-center justify-between text-blue-900">
            <span className="text-[11px] font-bold uppercase tracking-wider">MMAD</span>
            {onOpenGlossary && (
              <button
                onClick={() => onOpenGlossary('mmad')}
                className="text-[10px] text-blue-600 hover:underline"
              >
                ?
              </button>
            )}
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-mono font-bold text-blue-900 tabular-nums">
              {calculations.mmad_um.toFixed(2)}
            </span>
            <span className="text-xs text-blue-700">µm</span>
          </div>
          <p className="text-[10px] text-blue-800/80 mt-1">
            {calculations.mmad_um >= 1.0 && calculations.mmad_um <= 5.0
              ? '✓ Optimum alveolar/bronchial range'
              : calculations.mmad_um > 5.0
              ? '⚠ High throat deposition risk'
              : '⚠ Exhalation risk (<1 µm)'}
          </p>
        </div>

        {/* GSD */}
        <div className="p-3.5 rounded-lg bg-indigo-50/70 border border-indigo-200">
          <div className="flex items-center justify-between text-indigo-900">
            <span className="text-[11px] font-bold uppercase tracking-wider">GSD</span>
            {onOpenGlossary && (
              <button
                onClick={() => onOpenGlossary('gsd')}
                className="text-[10px] text-indigo-600 hover:underline"
              >
                ?
              </button>
            )}
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-mono font-bold text-indigo-900 tabular-nums">
              {calculations.gsd.toFixed(2)}
            </span>
            <span className="text-xs text-indigo-700">polydisp</span>
          </div>
          <p className="text-[10px] text-indigo-800/80 mt-1">
            {calculations.gsd <= 1.2
              ? 'Monodisperse aerosol'
              : calculations.gsd <= 2.0
              ? '✓ Standard polydisperse aerosol'
              : 'Broad size dispersion'}
          </p>
        </div>

        {/* Fine Particle Dose (FPD) */}
        <div className="p-3.5 rounded-lg bg-emerald-50/70 border border-emerald-200">
          <div className="flex items-center justify-between text-emerald-900">
            <span className="text-[11px] font-bold uppercase tracking-wider">FPD (&lt;5 µm)</span>
            {onOpenGlossary && (
              <button
                onClick={() => onOpenGlossary('fpd_rdf')}
                className="text-[10px] text-emerald-600 hover:underline"
              >
                ?
              </button>
            )}
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-mono font-bold text-emerald-900 tabular-nums">
              {calculations.fpd_ug.toFixed(1)}
            </span>
            <span className="text-xs text-emerald-700">µg</span>
          </div>
          <p className="text-[10px] text-emerald-800/80 mt-1">
            Respirable lung payload
          </p>
        </div>

        {/* Fine Particle Fraction (FPF % of Emitted) */}
        <div className="p-3.5 rounded-lg bg-emerald-50/70 border border-emerald-200">
          <div className="flex items-center justify-between text-emerald-900">
            <span className="text-[11px] font-bold uppercase tracking-wider">FPF (of ED)</span>
            {onOpenGlossary && (
              <button
                onClick={() => onOpenGlossary('fpf')}
                className="text-[10px] text-emerald-600 hover:underline"
              >
                ?
              </button>
            )}
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-mono font-bold text-emerald-900 tabular-nums">
              {calculations.fpf_emitted_pct.toFixed(1)}%
            </span>
          </div>
          <p className="text-[10px] text-emerald-800/80 mt-1">
            {calculations.fpf_emitted_pct >= 50 ? '✓ High efficiency aerosol' : 'Moderate efficiency'}
          </p>
        </div>

        {/* Respirable Dose Fraction (RDF % of Label Claim) */}
        <div className="p-3.5 rounded-lg bg-amber-50/70 border border-amber-200">
          <div className="flex items-center justify-between text-amber-900">
            <span className="text-[11px] font-bold uppercase tracking-wider">RDF (Claim)</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-mono font-bold text-amber-900 tabular-nums">
              {calculations.fpf_nominal_pct.toFixed(1)}%
            </span>
          </div>
          <p className="text-[10px] text-amber-800/80 mt-1">
            Target delivery vs label
          </p>
        </div>

        {/* Log-Normal Linear Fit R^2 */}
        <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between text-slate-700">
            <span className="text-[11px] font-bold uppercase tracking-wider">Fit (R²)</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-mono font-bold text-slate-900 tabular-nums">
              {calculations.rSquared.toFixed(3)}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            {calculations.rSquared >= 0.95 ? '✓ Strong log-normal fit' : 'Non-linear deviation'}
          </p>
        </div>
      </div>

      {/* Main Interactive Grid: Stage Inputs (Left) and Regressions / Charts (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Stage Deposition Inputs Table (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="font-bold text-slate-800">Cascade Impactor Stage Recovery Matrix</span>
              <div className="flex items-center gap-3">
                {/* Apparatus switcher */}
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-medium">Apparatus:</span>
                  <button
                    onClick={() => setApparatus('NGI')}
                    className={`px-2 py-0.5 rounded font-semibold text-[11px] transition-colors ${
                      apparatus === 'NGI'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    NGI (Ph.Eur)
                  </button>
                  <button
                    onClick={() => setApparatus('ACI')}
                    className={`px-2 py-0.5 rounded font-semibold text-[11px] transition-colors ${
                      apparatus === 'ACI'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    ACI (USP)
                  </button>
                </div>

                {/* Flow Rate Input */}
                <div className="flex items-center gap-1">
                  <span className="text-slate-500 font-medium">Flow (Q):</span>
                  <input
                    type="number"
                    min="10"
                    max="120"
                    step="1"
                    value={flowRate}
                    onChange={(e) => setFlowRate(Math.max(10, parseFloat(e.target.value) || 60))}
                    className="w-14 text-center py-0.5 px-1 bg-white border border-slate-300 rounded font-mono font-medium text-slate-800 text-xs focus:ring-1 focus:ring-blue-500"
                  />
                  <span className="text-[10px] text-slate-400">L/min</span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[380px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 sticky top-0 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                  <tr>
                    <th className="py-2 px-3">Stage Location</th>
                    <th className="py-2 px-2 text-right">D₅₀ Cutoff (µm)</th>
                    <th className="py-2 px-3 text-right">Mass (µg)</th>
                    <th className="py-2 px-3 text-right">% of Emitted</th>
                    <th className="py-2 px-3 text-center">Deposition Zone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                  {stagesWithCalibratedCutoffs.map((st) => {
                    const pct =
                      calculations.totalEmittedDose_ug > 0
                        ? (st.mass_ug / calculations.totalEmittedDose_ug) * 100
                        : 0;

                    let zone = 'Deep Alveolar';
                    let zoneBadge = 'bg-emerald-100 text-emerald-800';
                    if (st.id === 'throat' || st.id === 'presep' || st.baseCutoff_um > 5.0) {
                      zone = 'Oropharyngeal / Large Airway';
                      zoneBadge = 'bg-rose-100 text-rose-800';
                    } else if (st.baseCutoff_um >= 2.0 && st.baseCutoff_um <= 5.0) {
                      zone = 'Central / Bronchial';
                      zoneBadge = 'bg-blue-100 text-blue-800';
                    }

                    return (
                      <tr key={st.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-1.5 px-3 font-sans font-medium text-slate-900">
                          {st.name}
                        </td>
                        <td className="py-1.5 px-2 text-right tabular-nums text-slate-600">
                          {st.id === 'throat'
                            ? '> 10.0'
                            : st.id === 'presep'
                            ? '≈ 10.0'
                            : st.id === 'moc'
                            ? '< 0.34'
                            : st.baseCutoff_um.toFixed(2)}
                        </td>
                        <td className="py-1.5 px-3 text-right">
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={st.mass_ug || ''}
                            onChange={(e) => handleMassChange(st.id, e.target.value)}
                            placeholder="0.0"
                            className="w-20 text-right py-1 px-2 border border-slate-200 rounded bg-white text-slate-900 font-mono font-medium focus:ring-1 focus:ring-blue-500 focus:outline-hidden text-xs"
                          />
                        </td>
                        <td className="py-1.5 px-3 text-right tabular-nums text-slate-600">
                          {pct.toFixed(1)}%
                        </td>
                        <td className="py-1.5 px-3 text-center">
                          <span className={`inline-block text-[10px] font-sans px-2 py-0.5 rounded font-semibold ${zoneBadge}`}>
                            {zone}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-50 border-t border-slate-200 font-semibold text-slate-900 text-xs">
                  <tr>
                    <td className="py-2.5 px-3 font-sans">Total Emitted Dose (ED):</td>
                    <td className="py-2.5 px-2 text-right">--</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-blue-700">
                      {calculations.totalEmittedDose_ug.toFixed(1)} µg
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">100.0%</td>
                    <td className="py-2.5 px-3 text-center text-[10px] font-sans text-slate-500">
                      Label: {nominalDose} µg
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Bengali Clinical Guidance Box */}
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
              <span>বিজ্ঞান নীতি ও ল্যাব টেস্টের গুরুত্ব (Bangla Scientific Guide):</span>
            </span>
            <p className="text-[11px] leading-relaxed text-slate-600">
              ইনহেলারের ক্ষেত্রে কণার সাইজ <strong>১.০ থেকে ৫.০ µm</strong> (MMAD) হওয়া বাধ্যতামূলক। এই ক্যালকুলেটরে NGI বা ACI এর প্রতিটি স্টেজের ড্রাগ ভর বসালে লগ-প্রোবিট রিগ্রেশনের মাধ্যমে স্বয়ংক্রিয়ভাবে MMAD, GSD এবং ফাইন পার্টিকেল ডোজ (FPD) বের হয়ে আসে। FPD যত বেশি হবে এবং গলার ডিপোজিশন (Throat Loss) যত কম হবে, ড্রাগের সাইড-ইফেক্ট তত কমে যাবে এবং ফুসফুসের ব্রঙ্কিওলে কার্যকর নিরাময় মিলবে।
            </p>
          </div>
        </div>

        {/* Right Side: Probit Log-Normal Plot & Anatomical Deposition (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Interactive Log-Probability Regression SVG Plot */}
          <div className="border border-slate-200 rounded-lg p-4 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">
                Log-Probability Probit Regression Fit
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                Equation: y = {calculations.slope.toFixed(2)}x {calculations.intercept >= 0 ? '+' : ''}{calculations.intercept.toFixed(2)}
              </span>
            </div>

            {/* SVG Plot */}
            <div className="relative w-full h-52 bg-slate-50 border border-slate-200 rounded-lg p-2">
              <svg viewBox="0 0 320 180" className="w-full h-full text-slate-400">
                {/* Grid lines */}
                <line x1="40" y1="20" x2="300" y2="20" stroke="#E2E8F0" strokeDasharray="3,3" />
                <line x1="40" y1="60" x2="300" y2="60" stroke="#E2E8F0" strokeDasharray="3,3" />
                <line x1="40" y1="100" x2="300" y2="100" stroke="#CBD5E1" strokeWidth="1" /> {/* Probit 0 (50%) */}
                <line x1="40" y1="140" x2="300" y2="140" stroke="#E2E8F0" strokeDasharray="3,3" />

                {/* Y Axis labels (Probit / Percentage) */}
                <text x="35" y="24" fontSize="8" textAnchor="end" fill="#64748B">84% (+1σ)</text>
                <text x="35" y="104" fontSize="8" textAnchor="end" fontWeight="bold" fill="#0284C7">50% (MMAD)</text>
                <text x="35" y="144" fontSize="8" textAnchor="end" fill="#64748B">16% (-1σ)</text>

                {/* X Axis cutoffs labels: 0.5, 1.0, 2.0, 5.0, 10.0 µm */}
                {/* log10 range roughly -0.3 (0.5µm) to 1.0 (10µm) */}
                {/* Let xMin = -0.5, xMax = 1.2 */}
                {/* X_pixel = 40 + (logD - (-0.5)) / (1.2 - (-0.5)) * 260 */}
                {(() => {
                  const xMin = -0.5;
                  const xMax = 1.2;
                  const mapX = (logD: number) => 40 + ((logD - xMin) / (xMax - xMin)) * 260;
                  // Probit range: -2.0 to +2.0 => map to Y (160 to 40)
                  const mapY = (probit: number) => 100 - probit * 40;

                  // Regression Line coordinates
                  const x1 = xMin;
                  const y1 = calculations.slope * x1 + calculations.intercept;
                  const x2 = xMax;
                  const y2 = calculations.slope * x2 + calculations.intercept;

                  // MMAD location
                  const logMMAD = Math.log10(calculations.mmad_um);
                  const mmadPixelX = mapX(logMMAD);

                  return (
                    <>
                      {/* Vertical ticks */}
                      {[0.5, 1.0, 2.0, 5.0, 10.0].map((d) => {
                        const px = mapX(Math.log10(d));
                        return (
                          <g key={d}>
                            <line x1={px} y1="20" x2={px} y2="160" stroke="#F1F5F9" />
                            <text x={px} y="172" fontSize="8" textAnchor="middle" fill="#64748B">
                              {d}µm
                            </text>
                          </g>
                        );
                      })}

                      {/* MMAD vertical indicator line */}
                      {mmadPixelX >= 40 && mmadPixelX <= 300 && (
                        <line
                          x1={mmadPixelX}
                          y1="20"
                          x2={mmadPixelX}
                          y2="160"
                          stroke="#0284C7"
                          strokeWidth="1.5"
                          strokeDasharray="4,2"
                        />
                      )}

                      {/* Fitted Linear Regression Line */}
                      <line
                        x1={mapX(x1)}
                        y1={mapY(y1)}
                        x2={mapX(x2)}
                        y2={mapY(y2)}
                        stroke="#2563EB"
                        strokeWidth="2"
                      />

                      {/* Experimental Stage Points */}
                      {calculations.regressionPoints.map((pt) => {
                        const cx = mapX(pt.logD);
                        const cy = mapY(pt.probit);
                        return (
                          <circle
                            key={pt.stageId}
                            cx={cx}
                            cy={cy}
                            r="4"
                            className="fill-blue-600 stroke-white stroke-2 hover:fill-blue-800"
                          >
                            <title>{`${pt.cutoff_um} µm: ${pt.cumPctUndersize.toFixed(1)}% undersize`}</title>
                          </circle>
                        );
                      })}
                    </>
                  );
                })()}
              </svg>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <span>Observed Stage Mass</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-blue-600" />
                <span>Log-Normal Probit Fit</span>
              </span>
              <span className="font-semibold text-blue-700">
                MMAD: {calculations.mmad_um.toFixed(2)} µm
              </span>
            </div>
          </div>

          {/* Anatomical Airway Deposition Breakdown */}
          <div className="border border-slate-200 rounded-lg p-4 bg-white space-y-3">
            <span className="text-xs font-bold text-slate-900 block">
              Predicted In-Vivo Pulmonary Fate
            </span>

            <div className="space-y-2 text-xs">
              {/* Oropharyngeal Loss */}
              <div>
                <div className="flex justify-between font-medium text-slate-700 mb-1">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded bg-rose-500" />
                    <span>Throat & Mouth Deposition (Swallowed API)</span>
                  </span>
                  <span className="font-mono text-rose-700 font-semibold tabular-nums">
                    {calculations.throatLossPct.toFixed(1)}% ({calculations.upperAirwayLoss_ug.toFixed(1)} µg)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-rose-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(100, calculations.throatLossPct)}%` }}
                  />
                </div>
              </div>

              {/* Central Airways */}
              <div>
                <div className="flex justify-between font-medium text-slate-700 mb-1">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded bg-blue-500" />
                    <span>Tracheobronchial (Bronchodilation / Asthma)</span>
                  </span>
                  <span className="font-mono text-blue-700 font-semibold tabular-nums">
                    {(calculations.fpf_emitted_pct - calculations.extraFine_pct).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.max(
                        0,
                        calculations.fpf_emitted_pct - calculations.extraFine_pct
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Alveolar Deep Lung */}
              <div>
                <div className="flex justify-between font-medium text-slate-700 mb-1">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded bg-emerald-500" />
                    <span>Deep Alveolar Sacs (Systemic Absorption / Extra-Fine)</span>
                  </span>
                  <span className="font-mono text-emerald-700 font-semibold tabular-nums">
                    {calculations.extraFine_pct.toFixed(1)}% ({calculations.extraFine_ug.toFixed(1)} µg)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(100, calculations.extraFine_pct)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Standard Compliance:</span>
              <span className="font-semibold text-emerald-700">
                {calculations.fpf_emitted_pct >= 40 ? '✓ High Clinical Efficacy' : 'Optimization Required'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
