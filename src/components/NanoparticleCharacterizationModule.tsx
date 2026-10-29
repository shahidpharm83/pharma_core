import React, { useState, useMemo } from 'react';
import {
  Sliders,
  Activity,
  ShieldCheck,
  AlertTriangle,
  Zap,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRight,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import { CompoundProperties } from '../types/pharmadds';

interface NanoparticleCharacterizationModuleProps {
  currentDrug: CompoundProperties;
  onOpenGlossary?: (termId?: string) => void;
}

export const NanoparticleCharacterizationModule: React.FC<NanoparticleCharacterizationModuleProps> = ({
  currentDrug,
  onOpenGlossary,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'dls_pdi' | 'zeta_potential' | 'ee_dl'>('dls_pdi');

  // --- 1. DLS & PDI States ---
  const [zAvg_nm, setZAvg_nm] = useState<number>(85.0);
  const [pdi, setPdi] = useState<number>(0.095);
  const [measurementTemp_C, setMeasurementTemp_C] = useState<number>(25.0);

  // --- 2. Zeta Potential States ---
  // Electrophoretic mobility in 10^-8 m^2/(V*s)
  const [mobility_UE, setMobility_UE] = useState<number>(-2.8);
  const [henryModel, setHenryModel] = useState<'smoluchowski' | 'hueckel'>('smoluchowski');
  const [viscosity_cP, setViscosity_cP] = useState<number>(0.8872); // water at 25°C
  const [dielectricConst, setDielectricConst] = useState<number>(78.5); // water
  const [pegGraftingDensity_pct, setPegGraftingDensity_pct] = useState<number>(1.5);

  // --- 3. EE% and DL% States ---
  const [totalDrugAdded_mg, setTotalDrugAdded_mg] = useState<number>(10.0);
  const [freeDrugConcentration_ugml, setFreeDrugConcentration_ugml] = useState<number>(16.0);
  const [filtrateVolume_ml, setFiltrateVolume_ml] = useState<number>(25.0);
  const [carrierLipidMass_mg, setCarrierLipidMass_mg] = useState<number>(90.0);

  // Preset loaders
  const loadPreset = (preset: 'doxil_liposome' | 'sm102_lnp' | 'plga_polymeric') => {
    if (preset === 'doxil_liposome') {
      setZAvg_nm(88.0);
      setPdi(0.065);
      setMobility_UE(-0.4); // slightly negative due to PEG corona
      setPegGraftingDensity_pct(5.0);
      setTotalDrugAdded_mg(10.0);
      setFreeDrugConcentration_ugml(8.0);
      setFiltrateVolume_ml(20.0);
      setCarrierLipidMass_mg(85.0);
    } else if (preset === 'sm102_lnp') {
      setZAvg_nm(75.0);
      setPdi(0.092);
      setMobility_UE(-1.8);
      setPegGraftingDensity_pct(1.5);
      setTotalDrugAdded_mg(5.0);
      setFreeDrugConcentration_ugml(12.0);
      setFiltrateVolume_ml(20.0);
      setCarrierLipidMass_mg(50.0);
    } else {
      setZAvg_nm(145.0);
      setPdi(0.165);
      setMobility_UE(-3.5);
      setPegGraftingDensity_pct(0.0);
      setTotalDrugAdded_mg(20.0);
      setFreeDrugConcentration_ugml(120.0);
      setFiltrateVolume_ml(25.0);
      setCarrierLipidMass_mg(100.0);
    }
  };

  // --- Calculations for DLS Size Distribution ---
  const dlsMetrics = useMemo(() => {
    // Generate log-normal Gaussian points
    // sigma approx sqrt(ln(1 + PDI))
    const sigma = Math.sqrt(Math.log(1 + Math.max(0.01, pdi)));
    const mu = Math.log(zAvg_nm);

    // Percentiles
    const d10 = Math.exp(mu - 1.282 * sigma);
    const d50 = zAvg_nm;
    const d90 = Math.exp(mu + 1.282 * sigma);
    const span = (d90 - d10) / d50;

    // Quality check per ISO 22412
    let quality = 'Narrow Monodisperse (IV Injectable Standard)';
    let badge = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (pdi < 0.08) {
      quality = 'Exceptional Monodispersity (Gold Standard)';
      badge = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    } else if (pdi <= 0.20) {
      quality = 'Acceptable Pharmaceutical Monodisperse (LNP/Liposome)';
      badge = 'bg-blue-100 text-blue-800 border-blue-300';
    } else if (pdi <= 0.35) {
      quality = 'Moderate Polydispersity (Oral / Topical Acceptable)';
      badge = 'bg-amber-100 text-amber-800 border-amber-300';
    } else {
      quality = 'Broad Polydispersity (High Aggregation / Instability Risk)';
      badge = 'bg-rose-100 text-rose-800 border-rose-300';
    }

    // Distribution curve points (from 20 to 500 nm)
    const curvePoints: Array<{ x: number; y: number }> = [];
    for (let x = 10; x <= Math.max(300, zAvg_nm * 3); x += Math.max(2, zAvg_nm / 40)) {
      const lnX = Math.log(x);
      const exponent = -Math.pow(lnX - mu, 2) / (2 * sigma * sigma);
      const intensity = (1 / (x * sigma * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
      curvePoints.push({ x, y: intensity });
    }

    return {
      d10,
      d50,
      d90,
      span,
      quality,
      badge,
      curvePoints,
      sigma,
    };
  }, [zAvg_nm, pdi]);

  // --- Calculations for Zeta Potential (Henry's Equation) ---
  // Henry Eq: UE = 2 * epsilon0 * epsilon_r * zeta * f(kappa*a) / (3 * eta)
  // => zeta (V) = (3 * eta * UE) / (2 * epsilon0 * epsilon_r * f(kappa*a))
  const zetaMetrics = useMemo(() => {
    const fKa = henryModel === 'smoluchowski' ? 1.5 : 1.0;
    const eps0 = 8.854e-12; // F/m = C^2 / (N m^2)
    const epsR = dielectricConst;
    const eta_SI = viscosity_cP * 1e-3; // Pa*s = kg/(m*s)
    const ue_SI = mobility_UE * 1e-8; // m^2 / (V*s)

    // zeta in Volts
    const zeta_Volts = (3 * eta_SI * ue_SI) / (2 * eps0 * epsR * fKa);
    const zeta_mV = zeta_Volts * 1e3;

    // Colloidal stability assessment
    const absZeta = Math.abs(zeta_mV);
    let stability = 'Rapid Flocculation / Coagulation Risk';
    let badge = 'bg-rose-100 text-rose-800 border-rose-300';

    if (pegGraftingDensity_pct >= 2.0 && absZeta < 15) {
      stability = 'Sterically Stabilized (Stealth PEG Corona Shielding)';
      badge = 'bg-blue-100 text-blue-800 border-blue-300';
    } else if (absZeta >= 30) {
      stability = 'High Electrostatic Stability (Colloidal Repulsion)';
      badge = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    } else if (absZeta >= 20) {
      stability = 'Moderate Electrostatic Stability';
      badge = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    } else if (absZeta >= 10) {
      stability = 'Incipient Instability / Weak Repulsion';
      badge = 'bg-amber-100 text-amber-800 border-amber-300';
    }

    return {
      zeta_mV,
      absZeta,
      stability,
      badge,
      fKa,
    };
  }, [mobility_UE, henryModel, viscosity_cP, dielectricConst, pegGraftingDensity_pct]);

  // --- Calculations for Encapsulation Efficiency (EE%) & Drug Loading (DL%) ---
  const eeMetrics = useMemo(() => {
    // Free drug mass in filtrate (mg) = C_free (ug/mL) * V (mL) / 1000
    const freeDrug_mg = (freeDrugConcentration_ugml * filtrateVolume_ml) / 1000;
    const entrappedDrug_mg = Math.max(0, totalDrugAdded_mg - freeDrug_mg);

    const ee_pct = totalDrugAdded_mg > 0 ? (entrappedDrug_mg / totalDrugAdded_mg) * 100 : 0;
    const totalCarrierPlusDrug_mg = entrappedDrug_mg + carrierLipidMass_mg;
    const dl_pct = totalCarrierPlusDrug_mg > 0 ? (entrappedDrug_mg / totalCarrierPlusDrug_mg) * 100 : 0;

    let eeStatus = 'Low Encapsulation';
    let eeBadge = 'bg-rose-100 text-rose-800';
    if (ee_pct >= 90) {
      eeStatus = '✓ Excellent Encapsulation (Commercial Quality)';
      eeBadge = 'bg-emerald-100 text-emerald-800';
    } else if (ee_pct >= 75) {
      eeStatus = '✓ Good Encapsulation';
      eeBadge = 'bg-blue-100 text-blue-800';
    } else if (ee_pct >= 50) {
      eeStatus = '⚠ Moderate (Optimization needed)';
      eeBadge = 'bg-amber-100 text-amber-800';
    }

    return {
      freeDrug_mg,
      entrappedDrug_mg,
      ee_pct: Math.min(100, Math.max(0, ee_pct)),
      dl_pct: Math.min(100, Math.max(0, dl_pct)),
      eeStatus,
      eeBadge,
    };
  }, [totalDrugAdded_mg, freeDrugConcentration_ugml, filtrateVolume_ml, carrierLipidMass_mg]);

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded bg-blue-100 text-blue-800">
              <Sliders className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Nanoparticle Characterization & DLS Physicochemical Studio
            </h3>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-semibold">
              ISO 22412 / ISO 13099
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Multi-modal evaluation of Polydispersity Index (PDI), Henry&apos;s equation Zeta Potential (ζ), and Encapsulation Efficiency (EE% / DL%).
          </p>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 hidden sm:inline">Clinical Presets:</span>
          <button
            onClick={() => loadPreset('doxil_liposome')}
            className="px-2.5 py-1 text-xs font-medium rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            Doxil Liposome
          </button>
          <button
            onClick={() => loadPreset('sm102_lnp')}
            className="px-2.5 py-1 text-xs font-medium rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            SM-102 LNP
          </button>
          <button
            onClick={() => loadPreset('plga_polymeric')}
            className="px-2.5 py-1 text-xs font-medium rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            PLGA Nanoparticle
          </button>
        </div>
      </div>

      {/* Top Level Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* PDI */}
        <div className="p-3.5 rounded-lg bg-blue-50/70 border border-blue-200">
          <div className="flex items-center justify-between text-blue-900">
            <span className="text-[11px] font-bold uppercase tracking-wider">Polydispersity (PDI)</span>
            {onOpenGlossary && (
              <button
                onClick={() => onOpenGlossary('pdi')}
                className="text-[10px] text-blue-600 hover:underline"
              >
                ?
              </button>
            )}
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-mono font-bold text-blue-900 tabular-nums">
              {pdi.toFixed(3)}
            </span>
          </div>
          <p className="text-[10px] text-blue-800/80 mt-1 font-semibold truncate">
            {dlsMetrics.quality}
          </p>
        </div>

        {/* Zeta Potential */}
        <div className="p-3.5 rounded-lg bg-indigo-50/70 border border-indigo-200">
          <div className="flex items-center justify-between text-indigo-900">
            <span className="text-[11px] font-bold uppercase tracking-wider">Zeta Potential (ζ)</span>
            {onOpenGlossary && (
              <button
                onClick={() => onOpenGlossary('zeta_potential')}
                className="text-[10px] text-indigo-600 hover:underline"
              >
                ?
              </button>
            )}
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-mono font-bold text-indigo-900 tabular-nums">
              {zetaMetrics.zeta_mV.toFixed(1)}
            </span>
            <span className="text-xs text-indigo-700">mV</span>
          </div>
          <p className="text-[10px] text-indigo-800/80 mt-1 font-semibold truncate">
            {zetaMetrics.stability}
          </p>
        </div>

        {/* Encapsulation Efficiency (EE%) */}
        <div className="p-3.5 rounded-lg bg-emerald-50/70 border border-emerald-200">
          <div className="flex items-center justify-between text-emerald-900">
            <span className="text-[11px] font-bold uppercase tracking-wider">Encapsulation (EE%)</span>
            {onOpenGlossary && (
              <button
                onClick={() => onOpenGlossary('encapsulation_efficiency')}
                className="text-[10px] text-emerald-600 hover:underline"
              >
                ?
              </button>
            )}
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-mono font-bold text-emerald-900 tabular-nums">
              {eeMetrics.ee_pct.toFixed(1)}%
            </span>
          </div>
          <p className="text-[10px] text-emerald-800/80 mt-1 font-semibold">
            {eeMetrics.entrappedDrug_mg.toFixed(2)} mg trapped
          </p>
        </div>

        {/* Drug Loading (DL%) */}
        <div className="p-3.5 rounded-lg bg-purple-50/70 border border-purple-200">
          <div className="flex items-center justify-between text-purple-900">
            <span className="text-[11px] font-bold uppercase tracking-wider">Drug Loading (%DL)</span>
            {onOpenGlossary && (
              <button
                onClick={() => onOpenGlossary('drug_loading')}
                className="text-[10px] text-purple-600 hover:underline"
              >
                ?
              </button>
            )}
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-mono font-bold text-purple-900 tabular-nums">
              {eeMetrics.dl_pct.toFixed(2)}%
            </span>
            <span className="text-xs text-purple-700">w/w</span>
          </div>
          <p className="text-[10px] text-purple-800/80 mt-1">
            Payload per total mass
          </p>
        </div>
      </div>

      {/* Interactive Tabs */}
      <div className="border-b border-slate-200 flex items-center gap-4 text-xs font-medium">
        <button
          onClick={() => setActiveSubTab('dls_pdi')}
          className={`pb-2 transition-colors border-b-2 ${
            activeSubTab === 'dls_pdi'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          1. DLS Size Distribution & Polydispersity (PDI)
        </button>
        <button
          onClick={() => setActiveSubTab('zeta_potential')}
          className={`pb-2 transition-colors border-b-2 ${
            activeSubTab === 'zeta_potential'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          2. Zeta Potential (Henry&apos;s Eq & Mobility)
        </button>
        <button
          onClick={() => setActiveSubTab('ee_dl')}
          className={`pb-2 transition-colors border-b-2 ${
            activeSubTab === 'ee_dl'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          3. Encapsulation Efficiency (EE%) & Drug Loading (%DL)
        </button>
      </div>

      {/* Tab 1: DLS & PDI */}
      {activeSubTab === 'dls_pdi' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls */}
          <div className="lg:col-span-5 space-y-4">
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-3">
              <span className="text-xs font-bold text-slate-900 block">
                Cumulants Analysis Input (Dynamic Light Scattering)
              </span>

              {/* Z-Average */}
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                  <span>Hydrodynamic Diameter (Z-Average):</span>
                  <span className="font-mono font-bold text-blue-700">{zAvg_nm} nm</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="300"
                  step="1"
                  value={zAvg_nm}
                  onChange={(e) => setZAvg_nm(parseFloat(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {/* PDI Slider */}
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                  <span>Polydispersity Index (PDI):</span>
                  <span className="font-mono font-bold text-indigo-700">{pdi.toFixed(3)}</span>
                </div>
                <input
                  type="range"
                  min="0.02"
                  max="0.50"
                  step="0.005"
                  value={pdi}
                  onChange={(e) => setPdi(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-0.5 font-mono">
                  <span>0.02 (Monodisperse)</span>
                  <span>0.20 (Threshold)</span>
                  <span>0.50 (Polydisperse)</span>
                </div>
              </div>

              {/* Temperature */}
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Cell Temperature (°C)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={measurementTemp_C}
                  onChange={(e) => setMeasurementTemp_C(parseFloat(e.target.value) || 25)}
                  className="w-full py-1.5 px-2 bg-white border border-slate-200 rounded text-xs font-mono font-medium text-slate-900"
                />
              </div>
            </div>

            {/* Percentile Stats */}
            <div className="border border-slate-200 rounded-lg p-3.5 bg-white space-y-2 text-xs">
              <span className="font-bold text-slate-900 block">DLS Size Distribution Percentiles:</span>
              <div className="grid grid-cols-3 gap-2 font-mono text-center">
                <div className="p-2 rounded bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">D10 (10%)</span>
                  <span className="font-bold text-slate-900">{dlsMetrics.d10.toFixed(1)} nm</span>
                </div>
                <div className="p-2 rounded bg-blue-50 border border-blue-200">
                  <span className="text-[10px] text-blue-600 block">D50 (Median)</span>
                  <span className="font-bold text-blue-900">{dlsMetrics.d50.toFixed(1)} nm</span>
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">D90 (90%)</span>
                  <span className="font-bold text-slate-900">{dlsMetrics.d90.toFixed(1)} nm</span>
                </div>
              </div>
              <div className="flex justify-between text-[11px] text-slate-600 pt-1">
                <span>Distribution SPAN:</span>
                <span className="font-mono font-bold text-slate-800">{dlsMetrics.span.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* DLS Curve SVG */}
          <div className="lg:col-span-7 space-y-3">
            <div className="border border-slate-200 rounded-lg p-4 bg-white space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">
                  Intensity-Weighted DLS Size Distribution Curve
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  Z_avg: {zAvg_nm} nm · PDI: {pdi.toFixed(3)}
                </span>
              </div>

              {/* Plot */}
              <div className="relative w-full h-56 bg-slate-50 border border-slate-200 rounded-lg p-2">
                <svg viewBox="0 0 360 180" className="w-full h-full">
                  {(() => {
                    const maxX = Math.max(300, zAvg_nm * 2.8);
                    const mapX = (x: number) => 35 + (x / maxX) * 310;

                    // Find max Y for scaling
                    const maxYVal = Math.max(...dlsMetrics.curvePoints.map((p) => p.y), 0.0001);
                    const mapY = (y: number) => 150 - (y / maxYVal) * 125;

                    const pathData = dlsMetrics.curvePoints
                      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${mapX(p.x)} ${mapY(p.y)}`)
                      .join(' ');

                    const zAvgX = mapX(zAvg_nm);
                    const d10X = mapX(dlsMetrics.d10);
                    const d90X = mapX(dlsMetrics.d90);

                    return (
                      <>
                        {/* Shaded Area between D10 and D90 */}
                        <line x1={d10X} y1="20" x2={d10X} y2="150" stroke="#CBD5E1" strokeDasharray="2,2" />
                        <line x1={d90X} y1="20" x2={d90X} y2="150" stroke="#CBD5E1" strokeDasharray="2,2" />

                        {/* Peak Line */}
                        <line x1={zAvgX} y1="20" x2={zAvgX} y2="150" stroke="#2563EB" strokeWidth="1.5" strokeDasharray="3,2" />
                        <text x={zAvgX} y="15" fontSize="8" fontWeight="bold" textAnchor="middle" fill="#1D4ED8">
                          Z_avg ({zAvg_nm} nm)
                        </text>

                        {/* Curve Path */}
                        <path d={pathData} fill="none" stroke="#2563EB" strokeWidth="2.5" />

                        {/* Axis */}
                        <line x1="35" y1="150" x2="350" y2="150" stroke="#94A3B8" />
                        <line x1="35" y1="20" x2="35" y2="150" stroke="#94A3B8" />

                        {/* Ticks */}
                        {[50, 100, 150, 200, 250].filter((t) => t < maxX).map((t) => (
                          <g key={t}>
                            <line x1={mapX(t)} y1="150" x2={mapX(t)} y2="154" stroke="#64748B" />
                            <text x={mapX(t)} y="165" fontSize="8" textAnchor="middle" fill="#64748B">
                              {t}
                            </text>
                          </g>
                        ))}

                        <text x="350" y="165" fontSize="8" textAnchor="end" fill="#64748B">
                          Hydrodynamic Diameter (nm) →
                        </text>
                      </>
                    );
                  })()}
                </svg>
              </div>

              <p className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200 leading-relaxed">
                <strong>Scientific R&D Note (Polydispersity Index - PDI):</strong> A PDI value below 0.2 indicates a monodisperse nanoparticle system where particles are uniform in size. This ensures stable circulation in the blood stream, avoids immediate RES clearance by the liver and spleen, and maximizes tumor accumulation via the EPR effect.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Zeta Potential */}
      {activeSubTab === 'zeta_potential' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-4">
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-4">
              <span className="text-xs font-bold text-slate-900 block">
                Laser Doppler Electrophoresis Parameters (Henry&apos;s Equation)
              </span>

              {/* Henry Model Selector */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Henry&apos;s Function f(κa) Approximation:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setHenryModel('smoluchowski')}
                    className={`py-1.5 px-3 rounded text-xs font-medium transition-colors ${
                      henryModel === 'smoluchowski'
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Smoluchowski: f(κa) = 1.5 (Aqueous)
                  </button>
                  <button
                    type="button"
                    onClick={() => setHenryModel('hueckel')}
                    className={`py-1.5 px-3 rounded text-xs font-medium transition-colors ${
                      henryModel === 'hueckel'
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Hückel: f(κa) = 1.0 (Non-polar)
                  </button>
                </div>
              </div>

              {/* Mobility UE */}
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                  <span>Electrophoretic Mobility (U_E):</span>
                  <span className="font-mono font-bold text-indigo-700">
                    {mobility_UE} × 10⁻⁸ m²/(V·s)
                  </span>
                </div>
                <input
                  type="range"
                  min="-6.0"
                  max="6.0"
                  step="0.1"
                  value={mobility_UE}
                  onChange={(e) => setMobility_UE(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-0.5 font-mono">
                  <span>-6.0 (Anionic)</span>
                  <span>0.0 (Neutral)</span>
                  <span>+6.0 (Cationic)</span>
                </div>
              </div>

              {/* Solvent Properties */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Viscosity η (cP)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={viscosity_cP}
                    onChange={(e) => setViscosity_cP(parseFloat(e.target.value) || 0.8872)}
                    className="w-full py-1.5 px-2 bg-white border border-slate-200 rounded text-xs font-mono font-medium text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Dielectric Constant (ε_r)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={dielectricConst}
                    onChange={(e) => setDielectricConst(parseFloat(e.target.value) || 78.5)}
                    className="w-full py-1.5 px-2 bg-white border border-slate-200 rounded text-xs font-mono font-medium text-slate-900"
                  />
                </div>
              </div>

              {/* PEG Grafting Density */}
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                  <span>PEG Corona Density (Steric Shielding):</span>
                  <span className="font-mono font-bold text-blue-700">{pegGraftingDensity_pct}% mol</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={pegGraftingDensity_pct}
                  onChange={(e) => setPegGraftingDensity_pct(parseFloat(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Colloidal Stability Barometer */}
          <div className="lg:col-span-6 space-y-4">
            <div className="border border-slate-200 rounded-lg p-4 bg-white space-y-4">
              <span className="text-xs font-bold text-slate-900 block">
                Colloidal Stability & Surface Charge Barometer
              </span>

              {/* Barometer visual */}
              <div className="relative w-full h-10 rounded-lg overflow-hidden flex text-[10px] font-bold text-white text-center leading-10">
                <div className="w-1/4 bg-emerald-600" title="High Negative Stability (&lt; -30 mV)">
                  &lt; -30 mV
                </div>
                <div className="w-1/4 bg-amber-500" title="Moderate (-30 to -10 mV)">
                  -30 to -10
                </div>
                <div className="w-1/4 bg-rose-500" title="Unstable Flocculation (-10 to +10 mV)">
                  Neutral
                </div>
                <div className="w-1/4 bg-emerald-600" title="High Positive Stability (&gt; +30 mV)">
                  &gt; +30 mV
                </div>
              </div>

              {/* Active Marker Indicator */}
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">Calculated Electrokinetic Potential:</span>
                  <span className="text-lg font-mono font-bold text-indigo-700">
                    {zetaMetrics.zeta_mV.toFixed(1)} mV
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded text-xs font-bold border ${zetaMetrics.badge}`}>
                    {zetaMetrics.stability}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200 leading-relaxed">
                <strong>Scientific Principle & Colloidal Stability:</strong> Zeta potential magnitude exceeding ±30 mV generates robust electrostatic repulsion between suspended nanocarriers, preventing Ostwald ripening and agglomeration. For PEGylated liposomes or stealth LNPs, near-neutral surface potentials (-5 to +5 mV) remain colloidally stable via steric hydration repulsion exerted by dense outer PEG brush layers.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: EE% and DL% */}
      {activeSubTab === 'ee_dl' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-4">
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-3">
              <span className="text-xs font-bold text-slate-900 block">
                Centrifugal Ultrafiltration Assay Parameters
              </span>

              {/* Total Drug Added */}
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Total Initial Drug Input (W_total, mg):
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={totalDrugAdded_mg}
                  onChange={(e) => setTotalDrugAdded_mg(Math.max(0.1, parseFloat(e.target.value) || 0))}
                  className="w-full py-1.5 px-2 bg-white border border-slate-200 rounded text-xs font-mono font-medium text-slate-900"
                />
              </div>

              {/* Free Drug Concentration in Filtrate */}
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Free Unentrapped Drug in Filtrate (C_free, µg/mL):
                </label>
                <input
                  type="number"
                  step="1"
                  value={freeDrugConcentration_ugml}
                  onChange={(e) => setFreeDrugConcentration_ugml(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full py-1.5 px-2 bg-white border border-slate-200 rounded text-xs font-mono font-medium text-slate-900"
                />
              </div>

              {/* Total Filtrate Volume */}
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Total Filtrate Volume Collected (V_filtrate, mL):
                </label>
                <input
                  type="number"
                  step="1"
                  value={filtrateVolume_ml}
                  onChange={(e) => setFiltrateVolume_ml(Math.max(1, parseFloat(e.target.value) || 0))}
                  className="w-full py-1.5 px-2 bg-white border border-slate-200 rounded text-xs font-mono font-medium text-slate-900"
                />
              </div>

              {/* Excipient Lipid/Polymer Mass */}
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Total Excipient Carrier Mass (Lipid / Polymer, mg):
                </label>
                <input
                  type="number"
                  step="5"
                  value={carrierLipidMass_mg}
                  onChange={(e) => setCarrierLipidMass_mg(Math.max(1, parseFloat(e.target.value) || 0))}
                  className="w-full py-1.5 px-2 bg-white border border-slate-200 rounded text-xs font-mono font-medium text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Mass Balance & Titration Breakdown */}
          <div className="lg:col-span-6 space-y-4">
            <div className="border border-slate-200 rounded-lg p-4 bg-white space-y-4">
              <span className="text-xs font-bold text-slate-900 block">
                Nanoparticle Mass Balance & Titration Metrics
              </span>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs p-2.5 rounded bg-slate-50 border border-slate-200">
                  <span className="text-slate-600">Free Unentrapped Drug (Lost in Waste):</span>
                  <span className="font-mono font-bold text-rose-700">
                    {eeMetrics.freeDrug_mg.toFixed(3)} mg ({((eeMetrics.freeDrug_mg / totalDrugAdded_mg) * 100).toFixed(1)}%)
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs p-2.5 rounded bg-emerald-50 border border-emerald-200">
                  <span className="text-emerald-800 font-medium">Successfully Entrapped Drug:</span>
                  <span className="font-mono font-bold text-emerald-900">
                    {eeMetrics.entrappedDrug_mg.toFixed(3)} mg ({eeMetrics.ee_pct.toFixed(1)}%)
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs p-2.5 rounded bg-purple-50 border border-purple-200">
                  <span className="text-purple-800 font-medium">Effective Drug Loading (%DL w/w):</span>
                  <span className="font-mono font-bold text-purple-900">
                    {eeMetrics.dl_pct.toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* Status Badge */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <span className="font-bold text-slate-800 block mb-1">Pharmacopeial Quality Evaluation:</span>
                <span className={`inline-block px-2.5 py-1 rounded text-xs font-bold ${eeMetrics.eeBadge}`}>
                  {eeMetrics.eeStatus}
                </span>
                <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                  <strong>R&D Laboratory Insight:</strong> If encapsulation efficiency (%EE) remains below 90%, unentrapped free drug in systemic circulation risks off-target cytotoxicity and rapid clearance. Optimize %EE by increasing the lipid-to-drug (L/D) molar ratio or modulating the microfluidic flow rate ratio (FRR) and organic-to-aqueous phase mixing velocity.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
