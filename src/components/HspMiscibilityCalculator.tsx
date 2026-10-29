import React, { useState, useMemo } from 'react';
import {
  Layers,
  Thermometer,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Info,
  Droplets,
  RotateCcw,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { CompoundProperties } from '../types/pharmadds';
import { HspMiscibilityPhaseDiagram } from './HspMiscibilityPhaseDiagram';

export interface PolymerHSP {
  id: string;
  name: string;
  tradeName: string;
  deltaD: number; // MPa^0.5
  deltaP: number; // MPa^0.5
  deltaH: number; // MPa^0.5
  radiusR0: number; // Interaction sphere radius
  tg_C: number;
  density: number; // g/cm3
  category: 'Cellulosic' | 'Vinyl' | 'Graft Copolymer' | 'Methacrylic';
  descriptionBn: string;
}

export const POLYMER_DATABASE: PolymerHSP[] = [
  {
    id: 'hpma_as_lf',
    name: 'HPMC-AS (LF Grade)',
    tradeName: 'AquaSolve / Shin-Etsu AQOAT LF',
    deltaD: 16.8,
    deltaP: 11.2,
    deltaH: 12.5,
    radiusR0: 8.0,
    tg_C: 120,
    density: 1.28,
    category: 'Cellulosic',
    descriptionBn: 'Low-acetyl and high-succinoyl cellulose derivative. Dissolves at intestinal pH ≥ 5.5 to sustain supersaturation and prevent lipophilic drug nucleation.',
  },
  {
    id: 'hpma_as_mf',
    name: 'HPMC-AS (MF Grade)',
    tradeName: 'AquaSolve / Shin-Etsu AQOAT MF',
    deltaD: 17.2,
    deltaP: 10.5,
    deltaH: 11.8,
    radiusR0: 7.5,
    tg_C: 122,
    density: 1.28,
    category: 'Cellulosic',
    descriptionBn: 'Medium-acetyl and succinoyl ratio. Dissolves at pH ≥ 6.0, providing targeted delivery and dissolution in the upper duodenum and jejunum.',
  },
  {
    id: 'copovidone',
    name: 'Copovidone (PVP/VA 64)',
    tradeName: 'Kollidon VA 64 / Plasdone S-630',
    deltaD: 17.8,
    deltaP: 12.2,
    deltaH: 11.0,
    radiusR0: 8.5,
    tg_C: 108,
    density: 1.2,
    category: 'Vinyl',
    descriptionBn: 'Gold-standard vinyl copolymer for hot-melt extrusion (HME) and spray drying. Excellent thermoplasticity, high drug miscibility, and physical stabilization.',
  },
  {
    id: 'povidone_k30',
    name: 'Povidone (PVP K30)',
    tradeName: 'Kollidon 30 / Plasdone K-29/32',
    deltaD: 18.2,
    deltaP: 13.0,
    deltaH: 11.6,
    radiusR0: 9.0,
    tg_C: 165,
    density: 1.23,
    category: 'Vinyl',
    descriptionBn: 'Hydrophilic vinyl polymer with high glass transition temperature (165°C). Promotes rapid dissolution and immediate release for amorphous dispersion.',
  },
  {
    id: 'soluplus',
    name: 'Soluplus',
    tradeName: 'BASF Soluplus (PCL-PVAc-PEG)',
    deltaD: 17.0,
    deltaP: 9.8,
    deltaH: 10.5,
    radiusR0: 7.2,
    tg_C: 73,
    density: 1.15,
    category: 'Graft Copolymer',
    descriptionBn: 'Amphiphilic polyvinyl caprolactam-polyvinyl acetate-polyethylene glycol graft copolymer. Enables plasticizer-free extrusion and forms spontaneous in vivo micelles.',
  },
  {
    id: 'eudragit_l100_55',
    name: 'Eudragit L100-55',
    tradeName: 'Evonik Eudragit L100-55 (Methacrylic)',
    deltaD: 17.4,
    deltaP: 8.9,
    deltaH: 10.2,
    radiusR0: 7.0,
    tg_C: 110,
    density: 1.22,
    category: 'Methacrylic',
    descriptionBn: 'Enteric methacrylic acid copolymer insoluble at gastric pH 1.2; rapidly dissolves at pH ≥ 5.5 to maintain intestinal supersaturation.',
  },
  {
    id: 'hpmc_e5',
    name: 'HPMC E5 (Hypromellose)',
    tradeName: 'Methocel E5 Premium LV',
    deltaD: 16.5,
    deltaP: 12.0,
    deltaH: 14.2,
    radiusR0: 7.8,
    tg_C: 145,
    density: 1.3,
    category: 'Cellulosic',
    descriptionBn: 'Low-viscosity hypromellose grade acting as a potent crystallization inhibitor and parachute stabilizer in spray-dried amorphous solid dispersions.',
  },
];

interface HspMiscibilityCalculatorProps {
  currentDrug: CompoundProperties;
  onOpenGlossary?: (termId?: string) => void;
}

export const HspMiscibilityCalculator: React.FC<HspMiscibilityCalculatorProps> = ({
  currentDrug,
  onOpenGlossary,
}) => {
  // Selected polymer
  const [selectedPolyId, setSelectedPolyId] = useState<string>('hpma_as_lf');
  const activePolymer = POLYMER_DATABASE.find((p) => p.id === selectedPolyId) || POLYMER_DATABASE[0];

  // Drug HSP and Physical parameters
  // Derive reasonable initial HSP estimates from drug molecular properties
  const defaultDrugDeltaD = useMemo(() => {
    // Estimating deltaD from MW and rotatable bonds
    return parseFloat((17.5 + Math.min(2.5, currentDrug.molecularWeight / 400)).toFixed(1));
  }, [currentDrug.molecularWeight]);

  const defaultDrugDeltaP = useMemo(() => {
    // Estimating deltaP from TPSA and H-bond count
    return parseFloat(Math.min(16, Math.max(3, currentDrug.tpsa / 12)).toFixed(1));
  }, [currentDrug.tpsa]);

  const defaultDrugDeltaH = useMemo(() => {
    // Estimating deltaH from H-bond donors + acceptors
    return parseFloat(Math.min(18, Math.max(3, (currentDrug.hbd * 2.5 + currentDrug.hba * 1.2))).toFixed(1));
  }, [currentDrug.hbd, currentDrug.hba]);

  const [drugDeltaD, setDrugDeltaD] = useState<number>(defaultDrugDeltaD);
  const [drugDeltaP, setDrugDeltaP] = useState<number>(defaultDrugDeltaP);
  const [drugDeltaH, setDrugDeltaH] = useState<number>(defaultDrugDeltaH);
  const [drugMolarVolume, setDrugMolarVolume] = useState<number>(() => {
    return Math.round(currentDrug.molecularWeight / 1.25);
  });
  const [drugTg_C, setDrugTg_C] = useState<number>(45); // typical drug glass transition
  const [drugDensity, setDrugDensity] = useState<number>(1.25);

  // Formulation variables
  const [drugWeightFraction, setDrugWeightFraction] = useState<number>(0.25); // 25% drug loading in ASD
  const [storageTemp_C, setStorageTemp_C] = useState<number>(25); // Room storage
  const [ambientRH_pct, setAmbientRH_pct] = useState<number>(60); // 60% RH

  // Reset drug values to current active drug estimate
  const handleResetToDrug = () => {
    setDrugDeltaD(defaultDrugDeltaD);
    setDrugDeltaP(defaultDrugDeltaP);
    setDrugDeltaH(defaultDrugDeltaH);
    setDrugMolarVolume(Math.round(currentDrug.molecularWeight / 1.25));
  };

  // 1. Calculate Hansen 3D Distance Ra
  // Ra = sqrt( 4*(dD1 - dD2)^2 + (dP1 - dP2)^2 + (dH1 - dH2)^2 )
  const hansenDistanceRa = useMemo(() => {
    const diffD = drugDeltaD - activePolymer.deltaD;
    const diffP = drugDeltaP - activePolymer.deltaP;
    const diffH = drugDeltaH - activePolymer.deltaH;
    return Math.sqrt(4 * diffD * diffD + diffP * diffP + diffH * diffH);
  }, [drugDeltaD, drugDeltaP, drugDeltaH, activePolymer]);

  // 2. Relative Energy Difference RED = Ra / R0
  const redIndex = useMemo(() => {
    return hansenDistanceRa / activePolymer.radiusR0;
  }, [hansenDistanceRa, activePolymer.radiusR0]);

  // 3. Flory-Huggins Interaction Parameter Chi
  // Chi = (Vm / RT) * [ (dD1 - dD2)^2 + 0.25*(dP1 - dP2)^2 + 0.25*(dH1 - dH2)^2 ]
  const floryHugginsChi = useMemo(() => {
    const R = 8.314; // J/(mol*K)
    const T = storageTemp_C + 273.15; // K
    const diffD = drugDeltaD - activePolymer.deltaD;
    const diffP = drugDeltaP - activePolymer.deltaP;
    const diffH = drugDeltaH - activePolymer.deltaH;
    // convert MPa to J/cm3: 1 MPa = 1 J/cm3
    const sumSq = diffD * diffD + 0.25 * diffP * diffP + 0.25 * diffH * diffH;
    return (drugMolarVolume * sumSq) / (R * T * 1e-3);
  }, [drugDeltaD, drugDeltaP, drugDeltaH, activePolymer, drugMolarVolume, storageTemp_C]);

  // 4. Gordon-Taylor Equation for Glass Transition Temperature (Tg,blend)
  // Tg,blend = (w1*Tg1 + K*w2*Tg2) / (w1 + K*w2)
  // where K approx (rho1 * Tg1) / (rho2 * Tg2) (Simha-Boyer rule)
  const gordonTaylorK = useMemo(() => {
    const tgDrugK = drugTg_C + 273.15;
    const tgPolyK = activePolymer.tg_C + 273.15;
    return (drugDensity * tgDrugK) / (activePolymer.density * tgPolyK);
  }, [drugDensity, drugTg_C, activePolymer]);

  const predictedTgBlend_C = useMemo(() => {
    const wDrug = drugWeightFraction;
    const wPoly = 1 - wDrug;
    const tgDrugK = drugTg_C + 273.15;
    const tgPolyK = activePolymer.tg_C + 273.15;
    const blendK = (wDrug * tgDrugK + gordonTaylorK * wPoly * tgPolyK) / (wDrug + gordonTaylorK * wPoly);
    return blendK - 273.15;
  }, [drugWeightFraction, drugTg_C, activePolymer.tg_C, gordonTaylorK]);

  // 5. Moisture Plasticization (Fox Equation for wet ASD)
  // Water sorption at given RH (e.g., 2-5% water uptake)
  // Tg of water approx 135 K (-138 °C)
  const moistureContent_pct = useMemo(() => {
    // Higher RH and hydrophilic polymers adsorb more moisture
    const polymerMoistureFactor = activePolymer.category === 'Vinyl' ? 0.05 : 0.03;
    return Math.min(8.0, (ambientRH_pct / 100) * polymerMoistureFactor * 100);
  }, [ambientRH_pct, activePolymer.category]);

  const wetTg_C = useMemo(() => {
    const wWater = moistureContent_pct / 100;
    const wASD = 1 - wWater;
    const tgASDK = predictedTgBlend_C + 273.15;
    const tgWaterK = 135; // 135 K
    // 1 / Tg_wet = wASD/TgASD + wWater/TgWater
    const invTg = wASD / tgASDK + wWater / tgWaterK;
    return 1 / invTg - 273.15;
  }, [predictedTgBlend_C, moistureContent_pct]);

  const stabilityMargin_C = wetTg_C - storageTemp_C;

  // Miscibility Risk Assessment
  const miscibilityAssessment = useMemo(() => {
    if (redIndex < 1.0) {
      return {
        level: 'High Miscibility',
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        icon: ShieldCheck,
        text: 'Thermodynamically favored solid solution. Drug dissolves fully in polymer matrix; very low recrystallization propensity.',
      };
    } else if (redIndex <= 1.6) {
      return {
        level: 'Boundary / Moderate Miscibility',
        badge: 'bg-amber-100 text-amber-800 border-amber-300',
        icon: AlertTriangle,
        text: 'Metastable solid dispersion. Kinetic trapping required (e.g. rapid spray drying). Maintain high Tg margin to prevent phase separation.',
      };
    } else {
      return {
        level: 'High Immiscibility Risk',
        badge: 'bg-rose-100 text-rose-800 border-rose-300',
        icon: AlertTriangle,
        text: 'Thermodynamically unfavored. Spontaneous phase separation and drug recrystallization likely during stability testing.',
      };
    }
  }, [redIndex]);

  // Generate Gordon-Taylor Curve Data (w = 0.0 to 1.0)
  const gtCurvePoints = useMemo(() => {
    const pts: Array<{ w: number; tg: number }> = [];
    const tgDrugK = drugTg_C + 273.15;
    const tgPolyK = activePolymer.tg_C + 273.15;
    for (let w = 0; w <= 1.0; w += 0.05) {
      const blendK = (w * tgDrugK + gordonTaylorK * (1 - w) * tgPolyK) / (w + gordonTaylorK * (1 - w));
      pts.push({ w, tg: blendK - 273.15 });
    }
    return pts;
  }, [drugTg_C, activePolymer.tg_C, gordonTaylorK]);

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded bg-amber-100 text-amber-800">
              <Layers className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Amorphous Dispersion & Polymer Miscibility Index (HSP & Gordon-Taylor)
            </h3>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
              Hansen 3D & Tg Prediction
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Hansen Solubility Parameters (HSP: δD, δP, δH), RED distance, Flory-Huggins χ, and moisture-plasticized Gordon-Taylor glass transition.
          </p>
        </div>

        <button
          onClick={handleResetToDrug}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors self-start lg:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
          <span>Sync with {currentDrug.name}</span>
        </button>
      </div>

      {/* Top Level Metric Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        {/* RED Index */}
        <div className="p-3.5 rounded-lg bg-amber-50/70 border border-amber-200">
          <div className="flex items-center justify-between text-amber-900">
            <span className="text-[11px] font-bold uppercase tracking-wider">RED Index</span>
            {onOpenGlossary && (
              <button
                onClick={() => onOpenGlossary('red_index')}
                className="text-[10px] text-amber-700 hover:underline"
              >
                ?
              </button>
            )}
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-mono font-bold text-amber-900 tabular-nums">
              {redIndex.toFixed(2)}
            </span>
            <span className="text-xs text-amber-700 font-mono">Ra/R₀</span>
          </div>
          <span className={`inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded border ${miscibilityAssessment.badge}`}>
            {miscibilityAssessment.level}
          </span>
        </div>

        {/* 3D Hansen Distance Ra */}
        <div className="p-3.5 rounded-lg bg-blue-50/70 border border-blue-200">
          <div className="flex items-center justify-between text-blue-900">
            <span className="text-[11px] font-bold uppercase tracking-wider">Hansen Ra</span>
            {onOpenGlossary && (
              <button
                onClick={() => onOpenGlossary('hsp')}
                className="text-[10px] text-blue-600 hover:underline"
              >
                ?
              </button>
            )}
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-mono font-bold text-blue-900 tabular-nums">
              {hansenDistanceRa.toFixed(1)}
            </span>
            <span className="text-xs text-blue-700">MPa<sup>0.5</sup></span>
          </div>
          <p className="text-[10px] text-blue-800/80 mt-1">
            Polymer R₀: {activePolymer.radiusR0} MPa<sup>0.5</sup>
          </p>
        </div>

        {/* Flory-Huggins Interaction Parameter */}
        <div className="p-3.5 rounded-lg bg-indigo-50/70 border border-indigo-200">
          <div className="flex items-center justify-between text-indigo-900">
            <span className="text-[11px] font-bold uppercase tracking-wider">Flory-Huggins χ</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-mono font-bold text-indigo-900 tabular-nums">
              {floryHugginsChi.toFixed(2)}
            </span>
          </div>
          <p className="text-[10px] text-indigo-800/80 mt-1">
            {floryHugginsChi < 0.5 ? '✓ Low enthalpy barrier' : 'Positive mixing enthalpy'}
          </p>
        </div>

        {/* Predicted Dry Blend Tg */}
        <div className="p-3.5 rounded-lg bg-purple-50/70 border border-purple-200">
          <div className="flex items-center justify-between text-purple-900">
            <span className="text-[11px] font-bold uppercase tracking-wider">Tg (Dry ASD)</span>
            {onOpenGlossary && (
              <button
                onClick={() => onOpenGlossary('gordon_taylor')}
                className="text-[10px] text-purple-600 hover:underline"
              >
                ?
              </button>
            )}
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-mono font-bold text-purple-900 tabular-nums">
              {predictedTgBlend_C.toFixed(1)}
            </span>
            <span className="text-xs text-purple-700">°C</span>
          </div>
          <p className="text-[10px] text-purple-800/80 mt-1 font-mono">
            K_GT: {gordonTaylorK.toFixed(2)}
          </p>
        </div>

        {/* Wet Plasticized Tg & Stability Margin */}
        <div className="p-3.5 rounded-lg bg-emerald-50/70 border border-emerald-200">
          <div className="flex items-center justify-between text-emerald-900">
            <span className="text-[11px] font-bold uppercase tracking-wider">Tg,wet ({ambientRH_pct}% RH)</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-mono font-bold text-emerald-900 tabular-nums">
              {wetTg_C.toFixed(1)}
            </span>
            <span className="text-xs text-emerald-700">°C</span>
          </div>
          <p className="text-[10px] text-emerald-800/80 mt-1 font-semibold">
            Margin: +{stabilityMargin_C.toFixed(1)}°C {stabilityMargin_C >= 40 ? '(✓ Stable)' : '(⚠ Risk)'}
          </p>
        </div>
      </div>

      {/* Main Grid: Parameters & Polymer Selection (Left) vs Plots (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          {/* Polymer Matrix Selector */}
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-3">
            <label className="text-xs font-bold text-slate-800 block">
              1. Select Polymeric Matrix Carrier
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {POLYMER_DATABASE.map((poly) => {
                const isSelected = poly.id === selectedPolyId;
                return (
                  <button
                    key={poly.id}
                    type="button"
                    onClick={() => setSelectedPolyId(poly.id)}
                    className={`p-2.5 rounded-lg text-left border transition-all ${
                      isSelected
                        ? 'bg-white border-amber-500 ring-2 ring-amber-500/20 shadow-xs'
                        : 'bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 truncate">{poly.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        Tg: {poly.tg_C}°C
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 truncate block mt-0.5">
                      {poly.tradeName}
                    </span>
                    <div className="mt-1 text-[10px] font-mono text-slate-400">
                      δD:{poly.deltaD} δP:{poly.deltaP} δH:{poly.deltaH}
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-600 italic bg-amber-50/50 p-2 rounded border border-amber-100">
              {activePolymer.descriptionBn}
            </p>
          </div>

          {/* Hansen Parameters Editor */}
          <div className="border border-slate-200 rounded-lg p-4 bg-white space-y-3">
            <span className="text-xs font-bold text-slate-900 block">
              2. Candidate Drug Hansen Parameters ({currentDrug.name})
            </span>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  δD (Dispersion)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={drugDeltaD}
                    onChange={(e) => setDrugDeltaD(parseFloat(e.target.value) || 0)}
                    className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded text-xs font-mono font-medium text-slate-900 focus:bg-white focus:ring-1 focus:ring-blue-500"
                  />
                  <span className="absolute right-2 top-2 text-[10px] text-slate-400">MPa<sup>0.5</sup></span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  δP (Polar)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={drugDeltaP}
                    onChange={(e) => setDrugDeltaP(parseFloat(e.target.value) || 0)}
                    className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded text-xs font-mono font-medium text-slate-900 focus:bg-white focus:ring-1 focus:ring-blue-500"
                  />
                  <span className="absolute right-2 top-2 text-[10px] text-slate-400">MPa<sup>0.5</sup></span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  δH (H-Bond)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={drugDeltaH}
                    onChange={(e) => setDrugDeltaH(parseFloat(e.target.value) || 0)}
                    className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded text-xs font-mono font-medium text-slate-900 focus:bg-white focus:ring-1 focus:ring-blue-500"
                  />
                  <span className="absolute right-2 top-2 text-[10px] text-slate-400">MPa<sup>0.5</sup></span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Drug Pure Tg (°C)
                </label>
                <input
                  type="number"
                  step="1"
                  value={drugTg_C}
                  onChange={(e) => setDrugTg_C(parseFloat(e.target.value) || 0)}
                  className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded text-xs font-mono font-medium text-slate-900 focus:bg-white focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Molar Volume Vm (cm³/mol)
                </label>
                <input
                  type="number"
                  step="1"
                  value={drugMolarVolume}
                  onChange={(e) => setDrugMolarVolume(parseFloat(e.target.value) || 100)}
                  className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded text-xs font-mono font-medium text-slate-900 focus:bg-white focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Formulation & Accelerated Stress Conditions */}
          <div className="border border-slate-200 rounded-lg p-4 bg-white space-y-3">
            <span className="text-xs font-bold text-slate-900 block">
              3. Formulation Ratio & Accelerated Stability Conditions
            </span>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                  <span>Drug Loading Weight Fraction (w_drug):</span>
                  <span className="font-mono font-bold text-blue-700">
                    {(drugWeightFraction * 100).toFixed(0)}% w/w
                  </span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.60"
                  step="0.05"
                  value={drugWeightFraction}
                  onChange={(e) => setDrugWeightFraction(parseFloat(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                  <span>5% (High Stability)</span>
                  <span>25% (Standard ASD)</span>
                  <span>60% (High Payload)</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Storage Temp (°C)
                  </label>
                  <select
                    value={storageTemp_C}
                    onChange={(e) => setStorageTemp_C(parseInt(e.target.value))}
                    className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-900 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="25">25°C (Long-term ICH)</option>
                    <option value="30">30°C (Intermediate)</option>
                    <option value="40">40°C (Accelerated Stress)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Ambient Humidity (% RH)
                  </label>
                  <select
                    value={ambientRH_pct}
                    onChange={(e) => setAmbientRH_pct(parseInt(e.target.value))}
                    className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-900 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="0">0% RH (Dry Desiccant Foil)</option>
                    <option value="60">60% RH (Standard Room)</option>
                    <option value="75">75% RH (ICH Accelerated Stress)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Visualizations (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          {/* Gordon-Taylor Glass Transition Curve Plot */}
          <div className="border border-slate-200 rounded-lg p-4 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">
                Gordon-Taylor Tg Curve & Anti-Plasticization Effect
              </span>
              <span className="text-[10px] font-mono text-purple-700 font-semibold">
                Operating Tg: {predictedTgBlend_C.toFixed(1)}°C
              </span>
            </div>

            {/* SVG Plot for Gordon-Taylor */}
            <div className="relative w-full h-48 bg-slate-50 border border-slate-200 rounded-lg p-2">
              <svg viewBox="0 0 320 160" className="w-full h-full text-slate-400">
                {/* Reference line for 50°C and Storage Temp */}
                {/* Temp range: 0 to 180°C => map to Y: 140 (0°C) to 20 (180°C) */}
                {(() => {
                  const mapY = (temp: number) => 140 - (temp / 180) * 120;
                  const mapX = (w: number) => 40 + w * 250;

                  const yStorage = mapY(storageTemp_C);
                  const y50C = mapY(storageTemp_C + 50); // 50°C safety margin

                  // Path for GT Curve
                  const pathData = gtCurvePoints
                    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${mapX(pt.w)} ${mapY(pt.tg)}`)
                    .join(' ');

                  // Current operating point
                  const currentX = mapX(drugWeightFraction);
                  const currentY = mapY(predictedTgBlend_C);
                  const wetY = mapY(wetTg_C);

                  return (
                    <>
                      {/* Safety Band: Storage Temp to +50°C */}
                      <rect
                        x="40"
                        y={Math.min(yStorage, y50C)}
                        width="250"
                        height={Math.abs(yStorage - y50C)}
                        fill="#FEF3C7"
                        opacity="0.4"
                      />
                      <line x1="40" y1={y50C} x2="290" y2={y50C} stroke="#F59E0B" strokeDasharray="3,3" />
                      <text x="285" y={y50C - 3} fontSize="8" textAnchor="end" fill="#B45309">
                        +50°C Stability Threshold
                      </text>

                      {/* Storage Temp Line */}
                      <line x1="40" y1={yStorage} x2="290" y2={yStorage} stroke="#EF4444" strokeWidth="1" />
                      <text x="285" y={yStorage + 10} fontSize="8" textAnchor="end" fill="#DC2626">
                        Storage ({storageTemp_C}°C)
                      </text>

                      {/* GT Curve */}
                      <path d={pathData} fill="none" stroke="#7C3AED" strokeWidth="2.5" />

                      {/* Operating Point: Dry Tg */}
                      <circle cx={currentX} cy={currentY} r="5" fill="#7C3AED" stroke="#FFFFFF" strokeWidth="2" />
                      <text x={currentX + 8} y={currentY - 4} fontSize="8" fontWeight="bold" fill="#6D28D9">
                        Dry Tg ({predictedTgBlend_C.toFixed(0)}°C)
                      </text>

                      {/* Wet Plasticized Point */}
                      <circle cx={currentX} cy={wetY} r="4" fill="#059669" stroke="#FFFFFF" strokeWidth="1.5" />
                      <text x={currentX + 8} y={wetY + 8} fontSize="8" fill="#047857">
                        Wet Tg ({wetTg_C.toFixed(0)}°C)
                      </text>

                      {/* Axes */}
                      <line x1="40" y1="140" x2="290" y2="140" stroke="#94A3B8" />
                      <line x1="40" y1="20" x2="40" y2="140" stroke="#94A3B8" />

                      {/* X Labels */}
                      <text x="40" y="152" fontSize="8" textAnchor="middle" fill="#64748B">0% (Pure Poly)</text>
                      <text x="165" y="152" fontSize="8" textAnchor="middle" fill="#64748B">50%</text>
                      <text x="290" y="152" fontSize="8" textAnchor="middle" fill="#64748B">100% (Pure Drug)</text>

                      {/* Y Labels */}
                      <text x="35" y="142" fontSize="8" textAnchor="end" fill="#64748B">0°C</text>
                      <text x="35" y="80" fontSize="8" textAnchor="end" fill="#64748B">90°C</text>
                      <text x="35" y="24" fontSize="8" textAnchor="end" fill="#64748B">180°C</text>
                    </>
                  );
                })()}
              </svg>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                <span>Gordon-Taylor Blend Tg</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <span>Moisture Shift (Fox Eq)</span>
              </span>
              <span className="font-semibold text-slate-700">
                Tg - T_storage = +{stabilityMargin_C.toFixed(1)}°C
              </span>
            </div>
          </div>

          {/* Hansen Miscibility Diagram (Bagley Projection: deltaV vs deltaH) */}
          <div className="border border-slate-200 rounded-lg p-4 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">
                Hansen Interaction Sphere Projection (Bagley Plot)
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                RED: {redIndex.toFixed(2)}
              </span>
            </div>

            {/* SVG Hansen Diagram */}
            <div className="relative w-full h-48 bg-slate-50 border border-slate-200 rounded-lg p-2">
              <svg viewBox="0 0 320 160" className="w-full h-full">
                {(() => {
                  // deltaV = sqrt(4 * deltaD^2 + deltaP^2)
                  const drugDeltaV = Math.sqrt(4 * drugDeltaD * drugDeltaD + drugDeltaP * drugDeltaP);
                  const polyDeltaV = Math.sqrt(4 * activePolymer.deltaD * activePolymer.deltaD + activePolymer.deltaP * activePolymer.deltaP);

                  // Map deltaH (0 to 25) to X (40 to 280)
                  // Map deltaV (25 to 50) to Y (140 to 20)
                  const mapX = (h: number) => 40 + (h / 25) * 240;
                  const mapY = (v: number) => 140 - ((v - 25) / 25) * 120;

                  const polyX = mapX(activePolymer.deltaH);
                  const polyY = mapY(polyDeltaV);

                  const drugX = mapX(drugDeltaH);
                  const drugY = mapY(drugDeltaV);

                  // Radius pixel scaling
                  const rPix = (activePolymer.radiusR0 / 25) * 120;

                  return (
                    <>
                      {/* Grid */}
                      <line x1="40" y1="80" x2="280" y2="80" stroke="#E2E8F0" strokeDasharray="3,3" />
                      <line x1="160" y1="20" x2="160" y2="140" stroke="#E2E8F0" strokeDasharray="3,3" />

                      {/* Polymer Miscibility Interaction Circle (R0) */}
                      <circle
                        cx={polyX}
                        cy={polyY}
                        r={Math.max(10, rPix)}
                        fill="#FEF3C7"
                        fillOpacity="0.45"
                        stroke="#F59E0B"
                        strokeWidth="1.5"
                        strokeDasharray="4,2"
                      />

                      {/* Polymer Center */}
                      <circle cx={polyX} cy={polyY} r="4" fill="#D97706" />
                      <text x={polyX + 6} y={polyY - 4} fontSize="8" fontWeight="bold" fill="#92400E">
                        {activePolymer.name} (Matrix)
                      </text>

                      {/* Candidate Drug Point */}
                      <circle
                        cx={drugX}
                        cy={drugY}
                        r="5"
                        fill={redIndex < 1.0 ? '#059669' : '#DC2626'}
                        stroke="#FFFFFF"
                        strokeWidth="2"
                      />
                      <text
                        x={drugX + 7}
                        y={drugY + 4}
                        fontSize="8"
                        fontWeight="bold"
                        fill={redIndex < 1.0 ? '#065F46' : '#991B1B'}
                      >
                        {currentDrug.name} ({redIndex < 1.0 ? 'Inside Sphere' : 'Outside Sphere'})
                      </text>

                      {/* Distance Line */}
                      <line
                        x1={polyX}
                        y1={polyY}
                        x2={drugX}
                        y2={drugY}
                        stroke="#64748B"
                        strokeWidth="1"
                        strokeDasharray="2,2"
                      />

                      {/* Axes Labels */}
                      <text x="280" y="152" fontSize="8" textAnchor="end" fill="#64748B">
                        δH (Hydrogen Bonding) →
                      </text>
                      <text x="45" y="15" fontSize="8" fill="#64748B">
                        ↑ δV (Volume Polarity)
                      </text>
                    </>
                  );
                })()}
              </svg>
            </div>

            <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-xs">
              <span className="font-bold text-slate-800 block mb-0.5">
                Physical Recrystallization Prediction:
              </span>
              <p className="text-[11px] text-slate-600">
                {redIndex < 1.0
                  ? '✓ The API resides within the polymer Hansen solubility sphere (RED < 1.0). High thermodynamic affinity favors homogenous amorphous solid solution formation with prolonged shelf-life stability.'
                  : redIndex <= 1.6
                  ? '⚠ Boundary miscibility region (1.0 ≤ RED ≤ 1.6). Kinetic trapping via rapid solvent evaporation (spray drying) or flash cooling is required to prevent phase separation.'
                  : '✕ High immiscibility (RED > 1.6). High thermodynamic driving force for phase separation, spinodal decomposition, and rapid recrystallization during storage.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Recharts Miscibility Phase Diagram & Hansen Space */}
      <div className="pt-2">
        <HspMiscibilityPhaseDiagram
          currentDrug={currentDrug}
          drugHsp={{
            deltaD: drugDeltaD,
            deltaP: drugDeltaP,
            deltaH: drugDeltaH,
            molarVolume: drugMolarVolume,
            tg_C: drugTg_C,
          }}
          selectedPolymer={activePolymer}
          allPolymers={POLYMER_DATABASE}
          onSelectPolymer={(polyId) => setSelectedPolyId(polyId)}
          drugWeightFraction={drugWeightFraction}
          storageTemp_C={storageTemp_C}
          onUpdateDrugWeightFraction={(val) => setDrugWeightFraction(val)}
          onUpdateStorageTemp={(val) => setStorageTemp_C(val)}
          onOpenGlossary={onOpenGlossary}
        />
      </div>
    </div>
  );
};
