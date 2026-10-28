import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  ScatterChart,
  LineChart,
  Line,
  Area,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ReferenceArea,
  Cell,
} from 'recharts';
import {
  Layers,
  Thermometer,
  ShieldCheck,
  AlertTriangle,
  Info,
  Maximize2,
  Sparkles,
  Compass,
  Activity,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { CompoundProperties } from '../types/pharmadds';

export interface PolymerCandidate {
  id: string;
  name: string;
  tradeName: string;
  deltaD: number; // MPa^0.5
  deltaP: number; // MPa^0.5
  deltaH: number; // MPa^0.5
  radiusR0: number; // MPa^0.5
  tg_C: number;
  density: number; // g/cm^3
  mwRepeatUnit?: number; // g/mol
  category: string;
  color?: string;
}

interface HspMiscibilityPhaseDiagramProps {
  currentDrug: CompoundProperties;
  drugHsp: {
    deltaD: number;
    deltaP: number;
    deltaH: number;
    molarVolume: number; // cm3/mol
    tg_C: number;
  };
  selectedPolymer: PolymerCandidate;
  allPolymers: PolymerCandidate[];
  onSelectPolymer?: (polymerId: string) => void;
  drugWeightFraction: number; // 0.05 to 0.60
  storageTemp_C: number; // e.g. 25
  onUpdateDrugWeightFraction?: (val: number) => void;
  onUpdateStorageTemp?: (val: number) => void;
  onOpenGlossary?: (termId?: string) => void;
}

export const HspMiscibilityPhaseDiagram: React.FC<HspMiscibilityPhaseDiagramProps> = ({
  currentDrug,
  drugHsp,
  selectedPolymer,
  allPolymers,
  onSelectPolymer,
  drugWeightFraction,
  storageTemp_C,
  onUpdateDrugWeightFraction,
  onUpdateStorageTemp,
  onOpenGlossary,
}) => {
  const [activeTab, setActiveTab] = useState<'phase_diagram' | 'bagley_space' | 'chi_curve'>('phase_diagram');
  const [showSpinodal, setShowSpinodal] = useState<boolean>(true);
  const [showTgCurve, setShowTgCurve] = useState<boolean>(true);

  // 1. Calculate Hansen 3D distance Ra
  const hansenRa = useMemo(() => {
    const dD = drugHsp.deltaD - selectedPolymer.deltaD;
    const dP = drugHsp.deltaP - selectedPolymer.deltaP;
    const dH = drugHsp.deltaH - selectedPolymer.deltaH;
    return Math.sqrt(4 * dD * dD + dP * dP + dH * dH);
  }, [drugHsp, selectedPolymer]);

  const redIndex = useMemo(() => {
    return hansenRa / Math.max(0.1, selectedPolymer.radiusR0);
  }, [hansenRa, selectedPolymer.radiusR0]);

  // Polymer degree of polymerization approx (N = M_poly / M_drug)
  const N_poly = useMemo(() => {
    // Typical ASD polymers have MW ~ 15,000 - 40,000 g/mol, drug MW ~ 300 - 500
    const polyMw = 25000;
    const drugMw = Math.max(100, currentDrug.molecularWeight || 350);
    return Math.max(15, Math.round(polyMw / drugMw));
  }, [currentDrug.molecularWeight]);

  // Critical Flory-Huggins parameter chi_c
  const chi_c = useMemo(() => {
    // For drug (N1 = 1) and polymer (N2 = N): chi_c = 0.5 * (1 + 1/sqrt(N))^2
    return 0.5 * Math.pow(1 + 1 / Math.sqrt(N_poly), 2);
  }, [N_poly]);

  // Flory-Huggins chi at reference room temp (298.15 K = 25 C)
  // chi = (V_m / (R * T)) * (Ra^2 / 4)
  const getChiAtTempK = (tempK: number) => {
    const R = 8.314; // J/(mol*K)
    // V_m in cm3/mol = 10^-6 m3/mol. Ra in MPa^0.5 = 10^3 Pa^0.5 => Ra^2 is MPa = 10^6 Pa = J/m3.
    // Hence (V_m * 10^-6 m3/mol) * (Ra^2 * 10^6 J/m3) / 4 = (V_m * Ra^2) / 4 in J/mol
    // Dividing by (R * tempK) gives dimensionless chi.
    const Vm = drugHsp.molarVolume;
    return (Vm * hansenRa * hansenRa) / (4 * R * tempK);
  };

  const currentChi25C = useMemo(() => {
    return getChiAtTempK(298.15);
  }, [drugHsp.molarVolume, hansenRa]);

  // Upper Critical Solution Temperature (UCST) estimate where chi(T_c) = chi_c
  // T_c = (Vm * Ra^2) / (4 * R * chi_c)
  const criticalTempC = useMemo(() => {
    const R = 8.314;
    const TcK = (drugHsp.molarVolume * hansenRa * hansenRa) / (4 * R * chi_c);
    return TcK - 273.15;
  }, [drugHsp.molarVolume, hansenRa, chi_c]);

  // Gordon-Taylor K parameter: K = (density_drug * Tg_drug) / (density_poly * Tg_poly)
  const gordonTaylorK = useMemo(() => {
    const rhoDrug = 1.25;
    const rhoPoly = selectedPolymer.density || 1.22;
    const tgD = drugHsp.tg_C + 273.15;
    const tgP = selectedPolymer.tg_C + 273.15;
    return (rhoDrug * tgD) / (rhoPoly * tgP);
  }, [drugHsp.tg_C, selectedPolymer]);

  // Current blend Tg
  const currentTgBlend_C = useMemo(() => {
    const w = drugWeightFraction;
    const tgD = drugHsp.tg_C + 273.15;
    const tgP = selectedPolymer.tg_C + 273.15;
    const blendK = (w * tgD + gordonTaylorK * (1 - w) * tgP) / (w + gordonTaylorK * (1 - w));
    return blendK - 273.15;
  }, [drugWeightFraction, drugHsp.tg_C, selectedPolymer.tg_C, gordonTaylorK]);

  // Stability margin: Tg,blend - T_storage
  const stabilityMargin = currentTgBlend_C - storageTemp_C;

  // -------------------------------------------------------------
  // Data Generation: Phase Diagram (T vs Drug Fraction w)
  // -------------------------------------------------------------
  const phaseDiagramData = useMemo(() => {
    const rows = [];
    // w ranges from 0.02 to 0.98 in steps of 0.02
    for (let i = 2; i <= 98; i += 2) {
      const phi2 = i / 100; // drug volume/weight fraction
      const phi1 = 1 - phi2; // polymer fraction

      // 1. Gordon-Taylor Tg(w)
      const tgD = drugHsp.tg_C + 273.15;
      const tgP = selectedPolymer.tg_C + 273.15;
      const tgBlendK = (phi2 * tgD + gordonTaylorK * phi1 * tgP) / (phi2 + gordonTaylorK * phi1);
      const tgBlendC = parseFloat((tgBlendK - 273.15).toFixed(1));

      // 2. Spinodal condition: d^2(G/RT)/dphi2^2 = 0
      // 1/(N1*phi1) + 1/(N2*phi2) - 2*chi_s = 0 => chi_s = 0.5 * (1/phi1 + 1/(N_poly * phi2))
      const chi_spinodal = 0.5 * (1 / phi1 + 1 / (N_poly * phi2));
      // T_spinodal = (Vm * Ra^2) / (4 * R * chi_spinodal) - 273.15
      const R = 8.314;
      const T_spinK = (drugHsp.molarVolume * hansenRa * hansenRa) / (4 * R * chi_spinodal);
      const tSpinodalC = parseFloat((T_spinK - 273.15).toFixed(1));

      // 3. Binodal (Coexistence) curve approximation
      // In polymer-small molecule systems, the binodal sits slightly above the spinodal,
      // converging at the critical point phi_c = 1 / (1 + sqrt(N_poly)).
      const phi_c = 1 / (1 + Math.sqrt(N_poly));
      const distFromCrit = Math.abs(phi2 - phi_c);
      // Binodal excess temperature over spinodal increases away from critical point
      const binodalOffset = 18 * Math.pow(distFromCrit, 0.7);
      const tBinodalC = parseFloat((tSpinodalC + binodalOffset).toFixed(1));

      // Bound between -20 and 220 for nice chart scaling
      const clampedSpinodal = Math.min(230, Math.max(-20, tSpinodalC));
      const clampedBinodal = Math.min(240, Math.max(-20, tBinodalC));

      // For area fill: Spinodal region fill from 0 to clampedSpinodal
      // Glassy region is below Tg
      rows.push({
        wDrugPercent: i,
        wDrug: phi2,
        tgBlendC,
        tSpinodalC: clampedSpinodal,
        tBinodalC: clampedBinodal,
        // The two-phase spinodal decomposition zone
        spinodalZone: clampedSpinodal > -10 ? clampedSpinodal : null,
        // Metastable binodal envelope
        metastableGap: Math.max(0, clampedBinodal - clampedSpinodal),
      });
    }
    return rows;
  }, [drugHsp, selectedPolymer, gordonTaylorK, N_poly, hansenRa]);

  // Current Formulation Operating Dot
  const currentOperatingPoint = useMemo(() => {
    return [
      {
        wDrugPercent: Math.round(drugWeightFraction * 100),
        tempC: storageTemp_C,
        label: `${(drugWeightFraction * 100).toFixed(0)}% w/w @ ${storageTemp_C}°C`,
      },
    ];
  }, [drugWeightFraction, storageTemp_C]);

  // -------------------------------------------------------------
  // Data Generation: Multi-Polymer Bagley Projection (deltaV vs deltaH)
  // -------------------------------------------------------------
  const bagleyData = useMemo(() => {
    // deltaV = sqrt(4*deltaD^2 + deltaP^2)
    const drugDeltaV = Math.sqrt(4 * drugHsp.deltaD * drugHsp.deltaD + drugHsp.deltaP * drugHsp.deltaP);

    const polymersPoints = allPolymers.map((p) => {
      const deltaV = Math.sqrt(4 * p.deltaD * p.deltaD + p.deltaP * p.deltaP);
      const dD = drugHsp.deltaD - p.deltaD;
      const dP = drugHsp.deltaP - p.deltaP;
      const dH = drugHsp.deltaH - p.deltaH;
      const distRa = Math.sqrt(4 * dD * dD + dP * dP + dH * dH);
      const red = distRa / p.radiusR0;
      const isSelected = p.id === selectedPolymer.id;

      return {
        id: p.id,
        name: p.name,
        tradeName: p.tradeName,
        deltaH: parseFloat(p.deltaH.toFixed(1)),
        deltaV: parseFloat(deltaV.toFixed(1)),
        radiusR0: p.radiusR0,
        ra: parseFloat(distRa.toFixed(1)),
        red: parseFloat(red.toFixed(2)),
        miscible: red < 1.0,
        isSelected,
        category: p.category,
      };
    });

    return {
      drugPoint: [
        {
          name: `${currentDrug.name} (Candidate)`,
          deltaH: parseFloat(drugHsp.deltaH.toFixed(1)),
          deltaV: parseFloat(drugDeltaV.toFixed(1)),
          ra: 0,
          red: 0,
        },
      ],
      polymersPoints,
    };
  }, [allPolymers, drugHsp, selectedPolymer, currentDrug.name]);

  // Approximate circle perimeter points for active polymer's interaction boundary in Bagley space
  const polymerBoundaryPoints = useMemo(() => {
    const centerH = selectedPolymer.deltaH;
    const centerV = Math.sqrt(
      4 * selectedPolymer.deltaD * selectedPolymer.deltaD + selectedPolymer.deltaP * selectedPolymer.deltaP
    );
    const R0 = selectedPolymer.radiusR0;

    const points = [];
    const steps = 36;
    for (let i = 0; i <= steps; i++) {
      const angle = (i * 2 * Math.PI) / steps;
      points.push({
        deltaH: parseFloat((centerH + R0 * Math.cos(angle)).toFixed(2)),
        deltaV: parseFloat((centerV + R0 * Math.sin(angle)).toFixed(2)),
      });
    }
    return points;
  }, [selectedPolymer]);

  // -------------------------------------------------------------
  // Data Generation: Flory-Huggins chi vs Temperature (20°C - 180°C)
  // -------------------------------------------------------------
  const chiVsTempData = useMemo(() => {
    const list = [];
    for (let temp = 20; temp <= 180; temp += 5) {
      const chiVal = getChiAtTempK(temp + 273.15);
      list.push({
        tempC: temp,
        chi: parseFloat(chiVal.toFixed(3)),
        chi_c: parseFloat(chi_c.toFixed(3)),
        miscibleMelt: chiVal <= chi_c,
      });
    }
    return list;
  }, [getChiAtTempK, chi_c]);

  // Diagnostic Phase Determination for current state
  const currentThermodynamicState = useMemo(() => {
    const currentWPercent = Math.round(drugWeightFraction * 100);
    const row = phaseDiagramData.find((r) => r.wDrugPercent === currentWPercent) || phaseDiagramData[10];

    const isBelowTg = storageTemp_C <= currentTgBlend_C;
    const isAboveBinodal = storageTemp_C >= (row.tBinodalC || 150);
    const isInsideSpinodal = storageTemp_C < (row.tSpinodalC || 0);

    if (isBelowTg) {
      return {
        zone: 'Glassy Solution (Frozen Metastable ASD)',
        color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
        badge: 'Kinetically Stable Solid Dispersion',
        description: `Operating at ${storageTemp_C}°C, which is ${stabilityMargin.toFixed(1)}°C below the predicted glass transition Tg (${currentTgBlend_C.toFixed(1)}°C). Molecular mobility is frozen (viscosity > 10¹² Pa·s), inhibiting phase separation.`,
        icon: CheckCircle2,
      };
    } else if (isAboveBinodal) {
      return {
        zone: 'One-Phase Homogeneous Melt',
        color: 'text-blue-700 bg-blue-50 border-blue-200',
        badge: 'Thermodynamically Miscible Liquid',
        description: `Temperature is above the binodal boundary (${row.tBinodalC}°C). Single miscible phase suitable for Hot-Melt Extrusion processing without solvent.`,
        icon: CheckCircle2,
      };
    } else if (isInsideSpinodal) {
      return {
        zone: 'Two-Phase Spinodal Decomposition',
        color: 'text-rose-700 bg-rose-50 border-rose-200',
        badge: 'High Recrystallization Risk',
        description: `Formulation is above Tg and inside the spinodal boundary (${row.tSpinodalC}°C). Spontaneous, barrier-less phase separation into drug-rich amorphous droplets will occur rapidly.`,
        icon: XCircle,
      };
    } else {
      return {
        zone: 'Metastable Liquid (Nucleation & Growth)',
        color: 'text-amber-700 bg-amber-50 border-amber-200',
        badge: 'Nucleation Boundary',
        description: `Above Tg but between binodal and spinodal. Thermodynamically driven recrystallization can proceed via classical nucleation and growth over time.`,
        icon: AlertTriangle,
      };
    }
  }, [drugWeightFraction, storageTemp_C, currentTgBlend_C, stabilityMargin, phaseDiagramData]);

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-5">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-blue-100 text-blue-700">
              <Compass className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Polymer Miscibility Phase Diagram & Hansen Space (Recharts)
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
              Flory-Huggins & Bagley
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Publication-grade visual thermodynamic modeling of binodal coexistence, spinodal decomposition, and Gordon-Taylor glass boundary.
          </p>
        </div>

        {/* Tab Toggle Buttons */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('phase_diagram')}
            className={`px-3 py-1 font-medium rounded-md transition-all ${
              activeTab === 'phase_diagram'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            T - φ Phase Diagram
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bagley_space')}
            className={`px-3 py-1 font-medium rounded-md transition-all ${
              activeTab === 'bagley_space'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Bagley Hansen Plot
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('chi_curve')}
            className={`px-3 py-1 font-medium rounded-md transition-all ${
              activeTab === 'chi_curve'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            χ(T) Melt Miscibility
          </button>
        </div>
      </div>

      {/* Main Visual Data Card */}
      <div className="space-y-4">
        {/* Active Tab 1: Temperature vs Drug Composition Phase Diagram */}
        {activeTab === 'phase_diagram' && (
          <div className="space-y-3">
            {/* Control Bar & Legend Summary */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
              <div className="flex items-center gap-4">
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showTgCurve}
                    onChange={(e) => setShowTgCurve(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-slate-700 font-medium">Gordon-Taylor Glass Tg</span>
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showSpinodal}
                    onChange={(e) => setShowSpinodal(e.target.checked)}
                    className="rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span className="text-slate-700 font-medium">Spinodal Decomposition Zone</span>
                </label>
              </div>

              <div className="flex items-center gap-3 text-[11px] font-mono">
                <span className="flex items-center gap-1 text-purple-700 font-medium">
                  <span className="w-3 h-0.5 bg-purple-600 inline-block"></span> Tg: {currentTgBlend_C.toFixed(1)}°C
                </span>
                <span className="flex items-center gap-1 text-blue-700 font-medium">
                  <span className="w-3 h-0.5 bg-blue-600 inline-block"></span> Binodal UCST
                </span>
                <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block"></span> Operating Point: {(drugWeightFraction * 100).toFixed(0)}% w/w
                </span>
              </div>
            </div>

            {/* Recharts Container for Phase Diagram */}
            <div className="h-80 w-full bg-white rounded-lg border border-slate-200 p-2 relative">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={phaseDiagramData}
                  margin={{ top: 20, right: 30, left: 10, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis
                    dataKey="wDrugPercent"
                    type="number"
                    domain={[0, 100]}
                    ticks={[0, 20, 40, 60, 80, 100]}
                    stroke="#94A3B8"
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    label={{
                      value: 'Drug Loading Weight Fraction (% w/w) →',
                      position: 'insideBottom',
                      offset: -15,
                      fontSize: 11,
                      fill: '#475569',
                      fontWeight: 600,
                    }}
                  />
                  <YAxis
                    domain={[-10, 200]}
                    ticks={[0, 25, 50, 75, 100, 125, 150, 175, 200]}
                    stroke="#94A3B8"
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    label={{
                      value: 'Temperature (°C)',
                      angle: -90,
                      position: 'insideLeft',
                      offset: 5,
                      fontSize: 11,
                      fill: '#475569',
                      fontWeight: 600,
                    }}
                  />

                  {/* Reference line for storage temperature */}
                  <ReferenceLine
                    y={storageTemp_C}
                    stroke="#EF4444"
                    strokeDasharray="4 4"
                    label={{
                      value: `Storage Temp (${storageTemp_C}°C)`,
                      position: 'insideTopLeft',
                      fill: '#DC2626',
                      fontSize: 10,
                      fontWeight: 'bold',
                    }}
                  />

                  {/* Reference line for HME hot melt extrusion operating temp (e.g. 140°C) */}
                  <ReferenceLine
                    y={140}
                    stroke="#F59E0B"
                    strokeDasharray="2 3"
                    label={{
                      value: 'HME Process Melt Zone (~140°C)',
                      position: 'insideTopRight',
                      fill: '#B45309',
                      fontSize: 10,
                    }}
                  />

                  {/* Spinodal two-phase separation area fill */}
                  {showSpinodal && (
                    <Area
                      type="monotone"
                      dataKey="spinodalZone"
                      name="Spinodal 2-Phase Immiscible"
                      fill="#FEE2E2"
                      stroke="#F43F5E"
                      strokeWidth={1.5}
                      strokeDasharray="3 3"
                      fillOpacity={0.65}
                    />
                  )}

                  {/* Binodal Coexistence curve */}
                  <Line
                    type="monotone"
                    dataKey="tBinodalC"
                    name="Binodal Curve (Coexistence)"
                    stroke="#2563EB"
                    strokeWidth={2}
                    dot={false}
                  />

                  {/* Gordon-Taylor Glass transition line */}
                  {showTgCurve && (
                    <Line
                      type="monotone"
                      dataKey="tgBlendC"
                      name="Gordon-Taylor Tg Boundary"
                      stroke="#8B5CF6"
                      strokeWidth={2.5}
                      dot={false}
                    />
                  )}

                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900/95 text-white p-3 rounded-lg shadow-xl text-xs space-y-1.5 border border-slate-700 min-w-[210px]">
                          <div className="font-bold border-b border-slate-700 pb-1 text-slate-200 flex justify-between">
                            <span>Drug Loading: {data.wDrugPercent}% w/w</span>
                            <span className="text-amber-400 font-mono">φ={data.wDrug.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-purple-300">
                            <span>Gordon-Taylor Tg:</span>
                            <span className="font-mono font-bold">{data.tgBlendC}°C</span>
                          </div>
                          <div className="flex justify-between text-blue-300">
                            <span>Binodal Temp (UCST):</span>
                            <span className="font-mono font-bold">{data.tBinodalC}°C</span>
                          </div>
                          <div className="flex justify-between text-rose-300">
                            <span>Spinodal Boundary:</span>
                            <span className="font-mono font-bold">{data.tSpinodalC}°C</span>
                          </div>
                          <div className="pt-1 text-[10px] text-slate-400 border-t border-slate-800">
                            Below {data.tgBlendC}°C: Vitrified solid glass
                          </div>
                        </div>
                      );
                    }}
                  />

                  {/* Operating Point Scatter */}
                  <Scatter
                    data={currentOperatingPoint}
                    dataKey="tempC"
                    fill="#10B981"
                    stroke="#FFFFFF"
                    strokeWidth={2}
                    name="Current Formulation"
                    shape="circle"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Quick interactive sliders for the phase diagram */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Drug Loading (w_drug):</span>
                  <span className="font-mono text-blue-600 font-bold">
                    {(drugWeightFraction * 100).toFixed(0)} wt%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.60"
                  step="0.05"
                  value={drugWeightFraction}
                  onChange={(e) => onUpdateDrugWeightFraction?.(parseFloat(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-200 rounded"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Standard ASD formulations operate at 10% - 30% payload to avoid crystallization
                </span>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Storage Environment Temperature:</span>
                  <span className="font-mono text-rose-600 font-bold">{storageTemp_C}°C</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="45"
                  step="1"
                  value={storageTemp_C}
                  onChange={(e) => onUpdateStorageTemp?.(parseInt(e.target.value, 10))}
                  className="w-full accent-rose-600 cursor-pointer h-1.5 bg-slate-200 rounded"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                  <span>4°C (Cold Chain)</span>
                  <span>25°C (ICH Room)</span>
                  <span>40°C (Accelerated)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active Tab 2: Bagley 2D Projection Space (deltaV vs deltaH) */}
        {activeTab === 'bagley_space' && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
              <span className="text-slate-600">
                <strong>Bagley Projection:</strong> δ<sub>V</sub> = √(4δ<sub>D</sub>² + δ<sub>P</sub>²) vs δ<sub>H</sub>.
                Polymers inside or enclosing the candidate drug point satisfy <strong>RED &lt; 1.0</strong>.
              </span>
              <span className="text-[11px] font-mono text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Active: {selectedPolymer.name} (RED: {redIndex.toFixed(2)})
              </span>
            </div>

            {/* Recharts Scatter for Bagley Space */}
            <div className="h-80 w-full bg-white rounded-lg border border-slate-200 p-2">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 30, left: 10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis
                    dataKey="deltaH"
                    type="number"
                    domain={[6, 20]}
                    ticks={[6, 8, 10, 12, 14, 16, 18, 20]}
                    stroke="#94A3B8"
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    label={{
                      value: 'Hydrogen Bonding δH (MPa^0.5) →',
                      position: 'insideBottom',
                      offset: -15,
                      fontSize: 11,
                      fill: '#475569',
                      fontWeight: 600,
                    }}
                  />
                  <YAxis
                    dataKey="deltaV"
                    type="number"
                    domain={[30, 48]}
                    ticks={[30, 33, 36, 39, 42, 45, 48]}
                    stroke="#94A3B8"
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    label={{
                      value: 'Volume Polarity δV = √(4δD² + δP²) (MPa^0.5)',
                      angle: -90,
                      position: 'insideLeft',
                      offset: 5,
                      fontSize: 11,
                      fill: '#475569',
                      fontWeight: 600,
                    }}
                  />

                  {/* Active Polymer Interaction Boundary (Line approximation) */}
                  <Line
                    data={polymerBoundaryPoints}
                    dataKey="deltaV"
                    stroke="#F59E0B"
                    strokeWidth={1.5}
                    strokeDasharray="4 2"
                    dot={false}
                    name={`${selectedPolymer.name} Interaction Sphere`}
                  />

                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const pt = payload[0].payload;
                      const isDrug = pt.name.includes('(Candidate)');
                      return (
                        <div className="bg-slate-900/95 text-white p-3 rounded-lg shadow-xl text-xs space-y-1 border border-slate-700 min-w-[200px]">
                          <div className="font-bold border-b border-slate-700 pb-1 text-slate-100">
                            {pt.name}
                          </div>
                          {pt.tradeName && (
                            <div className="text-[11px] text-slate-400 italic">{pt.tradeName}</div>
                          )}
                          <div className="flex justify-between text-slate-300 pt-1">
                            <span>δH (H-Bond):</span>
                            <span className="font-mono font-bold text-amber-300">{pt.deltaH} MPa<sup>0.5</sup></span>
                          </div>
                          <div className="flex justify-between text-slate-300">
                            <span>δV (Volume Polarity):</span>
                            <span className="font-mono font-bold text-blue-300">{pt.deltaV} MPa<sup>0.5</sup></span>
                          </div>
                          {!isDrug && (
                            <>
                              <div className="flex justify-between text-slate-300">
                                <span>Hansen Distance Ra:</span>
                                <span className="font-mono font-bold">{pt.ra} MPa<sup>0.5</sup></span>
                              </div>
                              <div className="flex justify-between pt-1 border-t border-slate-800">
                                <span>RED Index:</span>
                                <span className={`font-mono font-bold ${pt.red < 1.0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {pt.red} ({pt.red < 1.0 ? 'Miscible' : 'Immiscible'})
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    }}
                  />

                  {/* All Polymers in the library */}
                  <Scatter
                    name="Polymer Matrices"
                    data={bagleyData.polymersPoints}
                    onClick={(entry: any) => {
                      const polyId = entry?.payload?.id || entry?.id;
                      if (polyId) onSelectPolymer?.(polyId);
                    }}
                    cursor="pointer"
                  >
                    {bagleyData.polymersPoints.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.isSelected ? '#F59E0B' : entry.miscible ? '#10B981' : '#94A3B8'}
                        stroke={entry.isSelected ? '#78350F' : '#FFFFFF'}
                        strokeWidth={entry.isSelected ? 2.5 : 1.5}
                        r={entry.isSelected ? 7 : 5}
                      />
                    ))}
                  </Scatter>

                  {/* Drug Candidate Point */}
                  <Scatter
                    name="Active Drug"
                    data={bagleyData.drugPoint}
                    fill="#3B82F6"
                    stroke="#FFFFFF"
                    strokeWidth={2}
                    shape="diamond"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            {/* Polymer Quick-Click Chips */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-600 block">
                Click any polymer to test miscibility with {currentDrug.name}:
              </span>
              <div className="flex flex-wrap gap-2">
                {bagleyData.polymersPoints.map((poly) => {
                  const isSelected = poly.id === selectedPolymer.id;
                  return (
                    <button
                      key={poly.id}
                      type="button"
                      onClick={() => onSelectPolymer?.(poly.id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs border transition-all ${
                        isSelected
                          ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold shadow-xs'
                          : poly.miscible
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isSelected ? 'bg-amber-600' : poly.miscible ? 'bg-emerald-500' : 'bg-slate-400'
                        }`}
                      />
                      <span>{poly.name}</span>
                      <span className="font-mono text-[10px] text-slate-400">RED:{poly.red}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Active Tab 3: Flory-Huggins chi vs Temperature */}
        {activeTab === 'chi_curve' && (
          <div className="space-y-3">
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex justify-between items-center">
              <span>
                <strong>Flory-Huggins χ(T) Temperature Dependence:</strong> Miscibility requires{' '}
                <span className="font-mono font-bold text-indigo-700">χ(T) &lt; χ<sub>c</sub> ({chi_c.toFixed(3)})</span>.
              </span>
              <span className="font-mono text-xs font-bold text-slate-800">
                χ(25°C) = {currentChi25C.toFixed(2)}
              </span>
            </div>

            {/* Recharts Line for Chi vs Temp */}
            <div className="h-80 w-full bg-white rounded-lg border border-slate-200 p-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chiVsTempData} margin={{ top: 20, right: 30, left: 10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis
                    dataKey="tempC"
                    stroke="#94A3B8"
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    label={{
                      value: 'Temperature (°C) →',
                      position: 'insideBottom',
                      offset: -15,
                      fontSize: 11,
                      fill: '#475569',
                      fontWeight: 600,
                    }}
                  />
                  <YAxis
                    stroke="#94A3B8"
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    label={{
                      value: 'Flory-Huggins Parameter χ',
                      angle: -90,
                      position: 'insideLeft',
                      offset: 5,
                      fontSize: 11,
                      fill: '#475569',
                      fontWeight: 600,
                    }}
                  />

                  {/* Critical Chi threshold line */}
                  <ReferenceLine
                    y={chi_c}
                    stroke="#DC2626"
                    strokeWidth={1.5}
                    strokeDasharray="4 3"
                    label={{
                      value: `Critical χc = ${chi_c.toFixed(3)} (Phase Separation Threshold)`,
                      position: 'insideTopLeft',
                      fill: '#DC2626',
                      fontSize: 10,
                      fontWeight: 'bold',
                    }}
                  />

                  {/* Room temp reference line */}
                  <ReferenceLine
                    x={25}
                    stroke="#94A3B8"
                    strokeDasharray="3 3"
                    label={{
                      value: '25°C',
                      position: 'insideBottomLeft',
                      fill: '#64748B',
                      fontSize: 10,
                    }}
                  />

                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const pt = payload[0].payload;
                      return (
                        <div className="bg-slate-900/95 text-white p-3 rounded-lg shadow-xl text-xs space-y-1 border border-slate-700 min-w-[180px]">
                          <div className="font-bold border-b border-slate-700 pb-1 text-slate-200">
                            Temperature: {pt.tempC}°C ({pt.tempC + 273.15} K)
                          </div>
                          <div className="flex justify-between text-indigo-300">
                            <span>Flory-Huggins χ:</span>
                            <span className="font-mono font-bold">{pt.chi}</span>
                          </div>
                          <div className="flex justify-between text-rose-300">
                            <span>Critical χc:</span>
                            <span className="font-mono font-bold">{pt.chi_c}</span>
                          </div>
                          <div className="pt-1 text-[11px] font-semibold border-t border-slate-800">
                            {pt.miscibleMelt ? (
                              <span className="text-emerald-400">✓ Thermodynamically Miscible Melt</span>
                            ) : (
                              <span className="text-amber-400">⚠ Enthalpically Unfavored Mixing</span>
                            )}
                          </div>
                        </div>
                      );
                    }}
                  />

                  <Line
                    type="monotone"
                    dataKey="chi"
                    name="Flory-Huggins χ(T)"
                    stroke="#4F46E5"
                    strokeWidth={2.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-200">
              {criticalTempC > 200 ? (
                <span>
                  The predicted Upper Critical Solution Temperature (UCST) is &gt; 200°C. Pure thermal melt miscibility is difficult without degradation; use high-shear hot-melt extrusion or solvent spray-drying with kinetic quenching.
                </span>
              ) : criticalTempC <= 25 ? (
                <span className="text-emerald-800 font-medium">
                  ✓ Excellent thermodynamic miscibility! The blend has χ &lt; χ<sub>c</sub> at room temperature, indicating spontaneous dissolution without phase separation risk.
                </span>
              ) : (
                <span>
                  UCST is estimated at ~<strong>{criticalTempC.toFixed(0)}°C</strong>. Above this temperature, the drug and polymer form a single homogenous molten phase for extrusion. Upon cooling below Tg ({currentTgBlend_C.toFixed(0)}°C), rapid vitrification freezes the dispersion.
                </span>
              )}
            </div>
          </div>
        )}

        {/* Real-time Formulation Audit Banner */}
        <div className={`p-4 rounded-lg border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${currentThermodynamicState.color}`}>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <currentThermodynamicState.icon className="w-4 h-4 shrink-0" />
              <span className="font-bold text-xs uppercase tracking-wide">
                Thermodynamic State: {currentThermodynamicState.zone}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/80 border border-current">
                {currentThermodynamicState.badge}
              </span>
            </div>
            <p className="text-xs leading-relaxed opacity-90 max-w-3xl">
              {currentThermodynamicState.description}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-stretch sm:self-auto justify-between sm:justify-start pt-2 sm:pt-0 border-t sm:border-t-0 border-current/20">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold opacity-75 block">Stability Margin</span>
              <span className="text-base font-mono font-bold">
                {stabilityMargin >= 0 ? `+${stabilityMargin.toFixed(1)}°C` : `${stabilityMargin.toFixed(1)}°C`}
              </span>
            </div>
            {onOpenGlossary && (
              <button
                type="button"
                onClick={() => onOpenGlossary('gordon_taylor')}
                className="px-2.5 py-1 text-xs font-semibold rounded bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 transition-colors shadow-2xs"
              >
                Learn More
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
