import React, { useState, useMemo } from 'react';
import {
  Wind,
  Gauge,
  Activity,
  AlertTriangle,
  Layers,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Info,
  Sliders,
  Target,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { CompoundProperties, InhalationState } from '../types/pharmadds';

interface FlowRateDepositionChartProps {
  currentDrug: CompoundProperties;
  inhalationState: InhalationState;
  onOpenGlossary?: (termId?: string) => void;
}

export const FlowRateDepositionChart: React.FC<FlowRateDepositionChartProps> = ({
  currentDrug,
  inhalationState,
  onOpenGlossary,
}) => {
  // Patient Inhalation Flow Rate (L/min) - typical range 30 to 120 L/min
  const [inhalationFlowRateLmin, setInhalationFlowRateLmin] = useState<number>(60);
  const [deviceResistanceKpa, setDeviceResistanceKpa] = useState<number>(0.035); // kPa^0.5 min / L (Medium resistance like Turbuhaler)
  const [patientProfile, setPatientProfile] = useState<'healthy_adult' | 'copd' | 'asthma_child' | 'elderly'>('healthy_adult');

  // Compute pressure drop across DPI: DeltaP = (Q / R)^2 in kPa
  const pressureDropKpa = useMemo(() => {
    const q = inhalationFlowRateLmin;
    // R is resistance factor
    const r = deviceResistanceKpa * 100;
    return parseFloat((Math.pow(q / r, 2)).toFixed(2));
  }, [inhalationFlowRateLmin, deviceResistanceKpa]);

  // Generate curve data across flow rates from 30 to 120 L/min
  const depositionCurveData = useMemo(() => {
    const data: Array<{
      flowRate: number;
      extrathoracicPct: number;
      bronchialPct: number;
      alveolarPct: number;
      totalSystemicPct: number;
    }> = [];

    const mmad = inhalationState.mmad_um || 2.4;

    for (let q = 30; q <= 120; q += 5) {
      // Impaction parameter inertial index ~ q * mmad^2
      const inertialFactor = q * Math.pow(mmad, 1.8) * 0.085;

      // 1. Extrathoracic (Mouth-Throat) Deposition: increases steeply at high flow rates due to inertial impaction
      const extra = Math.min(75, Math.max(12, 12 + inertialFactor * 0.9 + (q > 80 ? (q - 80) * 0.4 : 0)));

      // 2. Bronchial (Tracheobronchial) Deposition: moderate dependence on velocity
      const bronchial = Math.min(35, Math.max(10, 18 + (q * 0.06) + (mmad > 3 ? 5 : -2)));

      // 3. Alveolar (Deep Lung) Deposition: peaks around 45-65 L/min; drops at high Q due to throat loss and low Q due to settling loss
      const optimalQ = 52;
      const alveolarUnscaled = Math.max(5, 62 - Math.pow(q - optimalQ, 1.6) * 0.038 - Math.pow(mmad - 2.2, 2) * 8.0);
      const alveolar = Math.min(70, Math.max(8, alveolarUnscaled));

      // Normalize sum to 100% of emitted dose
      const sum = extra + bronchial + alveolar;
      const normExtra = parseFloat(((extra / sum) * 100).toFixed(1));
      const normBronchial = parseFloat(((bronchial / sum) * 100).toFixed(1));
      const normAlveolar = parseFloat(((alveolar / sum) * 100).toFixed(1));
      const totalSystemic = parseFloat((normBronchial + normAlveolar).toFixed(1));

      data.push({
        flowRate: q,
        extrathoracicPct: normExtra,
        bronchialPct: normBronchial,
        alveolarPct: normAlveolar,
        totalSystemicPct: totalSystemic,
      });
    }

    return data;
  }, [inhalationState.mmad_um]);

  // Current active data point based on slider inhalationFlowRateLmin
  const currentActiveDeposition = useMemo(() => {
    // Find closest flow rate in curve data
    const exact = depositionCurveData.find((d) => d.flowRate === inhalationFlowRateLmin) || {
      flowRate: inhalationFlowRateLmin,
      extrathoracicPct: 32.0,
      bronchialPct: 22.0,
      alveolarPct: 46.0,
      totalSystemicPct: 68.0,
    };
    return exact;
  }, [depositionCurveData, inhalationFlowRateLmin]);

  // Clinical evaluation of current flow rate
  const flowRateClinicalStatus = useMemo(() => {
    if (inhalationFlowRateLmin < 45) {
      return {
        status: 'SUB-OPTIMAL (LOW EFFORT)',
        badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
        message: 'Inspiratory flow <45 L/min is insufficient for effective agglomerate dispersion in medium-to-high resistance DPIs. High risk of incomplete de-aggregation and excessive throat deposition.',
      };
    } else if (inhalationFlowRateLmin >= 45 && inhFlowRateOptimal(inhalationFlowRateLmin)) {
      return {
        status: 'OPTIMAL THERAPEUTIC WINDOW',
        badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
        message: 'Flow rate within optimal 50–75 L/min window. Maximizes deep lung alveolar penetration while minimizing oral cavity impaction.',
      };
    } else {
      return {
        status: 'HIGH VELOCITY TURBULENCE',
        badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
        message: 'High inspiratory flow (>75 L/min) increases turbulence and inertial impaction in the upper extrathoracic airway. Acceptable for low-resistance devices, but may trigger cough reflexes.',
      };
    }

    function inhFlowRateOptimal(q: number) {
      return q >= 45 && q <= 75;
    }
  }, [inhalationFlowRateLmin]);

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-cyan-950 via-slate-900 to-slate-900 text-white rounded-lg p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded bg-cyan-500/30 text-cyan-200 border border-cyan-400/30">
                <Wind className="w-5 h-5 text-cyan-300" />
              </span>
              <span className="text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded bg-cyan-500/40 text-cyan-200 border border-cyan-400/40 font-semibold">
                USP & EP Inhalation Aerodynamics
              </span>
            </div>
            <h3 className="text-xl font-bold tracking-tight text-white">
              Dynamic Flow-Rate-to-Deposition Chart (DPI Inhalation Effort)
            </h3>
            <p className="text-xs text-cyan-100/90 max-w-3xl leading-relaxed">
              Visualizes the physiological relationship between patient inspiratory flow rate ($Q$ in L/min) and regional lung deposition (Extrathoracic vs. Bronchial vs. Alveolar) for <strong>{currentDrug.name}</strong>.
            </p>
          </div>

          <div className="bg-white/10 rounded-lg p-3 border border-white/15 backdrop-blur-xs flex items-center gap-4 text-xs">
            <div>
              <span className="text-[10px] text-cyan-300 block uppercase font-semibold">Current Flow Q</span>
              <span className="font-mono font-bold text-white text-base">{inhalationFlowRateLmin} L/min</span>
            </div>
            <div className="border-l border-white/20 pl-3">
              <span className="text-[10px] text-cyan-300 block uppercase font-semibold">Pressure Drop ΔP</span>
              <span className="font-mono font-bold text-emerald-300 text-base">{pressureDropKpa} kPa</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls Bar: Flow Rate Slider & Patient Profile Preset */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="p-1 rounded bg-cyan-100 text-cyan-800">
                <Sliders className="w-4 h-4" />
              </span>
              <span>Inspiratory Flow Rate & Patient Effort Controls</span>
            </h4>
            <p className="text-xs text-slate-500">
              Simulate diverse patient inhalation profiles from compromised COPD patients to healthy adults.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setPatientProfile('copd');
                setInhalationFlowRateLmin(38);
              }}
              className={`px-2.5 py-1 rounded font-semibold transition-all ${
                patientProfile === 'copd' ? 'bg-amber-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-700'
              }`}
            >
              Severe COPD (38 L/min)
            </button>
            <button
              type="button"
              onClick={() => {
                setPatientProfile('asthma_child');
                setInhalationFlowRateLmin(48);
              }}
              className={`px-2.5 py-1 rounded font-semibold transition-all ${
                patientProfile === 'asthma_child' ? 'bg-blue-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-700'
              }`}
            >
              Pediatric Asthma (48 L/min)
            </button>
            <button
              type="button"
              onClick={() => {
                setPatientProfile('healthy_adult');
                setInhalationFlowRateLmin(65);
              }}
              className={`px-2.5 py-1 rounded font-semibold transition-all ${
                patientProfile === 'healthy_adult' ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-700'
              }`}
            >
              Healthy Adult (65 L/min)
            </button>
          </div>
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          {/* Flow Rate Slider */}
          <div className="space-y-2 p-3.5 bg-slate-50/70 rounded-lg border border-slate-200">
            <div className="flex justify-between items-baseline">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-cyan-600" />
                <span>Inspiratory Flow Rate (Q)</span>
              </label>
              <span className="font-mono font-bold text-cyan-700 text-sm">
                {inhalationFlowRateLmin} L/min
              </span>
            </div>

            <input
              type="range"
              min={30}
              max={120}
              step={2}
              value={inhalationFlowRateLmin}
              onChange={(e) => {
                setInhalationFlowRateLmin(Number(e.target.value));
                setPatientProfile('healthy_adult');
              }}
              className="w-full accent-cyan-600"
            />

            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>30 L/min (Weak Effort)</span>
              <span>60 L/min (Standard USP)</span>
              <span>120 L/min (Max Effort)</span>
            </div>
          </div>

          {/* DPI Device Resistance */}
          <div className="space-y-2 p-3.5 bg-slate-50/70 rounded-lg border border-slate-200">
            <div className="flex justify-between items-baseline">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-indigo-600" />
                <span>DPI Device Flow Resistance (R)</span>
              </label>
              <span className="font-mono font-bold text-indigo-700 text-sm">
                {deviceResistanceKpa} kPa^0.5 min/L
              </span>
            </div>

            <select
              value={deviceResistanceKpa}
              onChange={(e) => setDeviceResistanceKpa(Number(e.target.value))}
              className="w-full px-2.5 py-2 text-xs rounded border border-slate-300 bg-white font-medium text-slate-800"
            >
              <option value={0.022}>Low Resistance (e.g. Handihaler / Breezhaler): 0.022</option>
              <option value={0.035}>Medium Resistance (e.g. Turbuhaler / Clickhaler): 0.035</option>
              <option value={0.048}>High Resistance (e.g. Ellipta / Diskus): 0.048</option>
            </select>

            <div className="text-[10px] text-slate-500 pt-0.5">
              Calculated Pressure Drop ΔP: <strong className="font-mono text-slate-800">{pressureDropKpa} kPa</strong> ({pressureDropKpa >= 4.0 ? 'High Energy Dispersion' : 'Gentle Dispersion'})
            </div>
          </div>
        </div>
      </div>

      {/* Active Flow Rate Regional Deposition Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-1">
          <span className="text-[10px] text-slate-500 font-bold uppercase block">Extrathoracic (Mouth-Throat)</span>
          <span className="text-2xl font-mono font-bold text-rose-600 block">
            {currentActiveDeposition.extrathoracicPct}%
          </span>
          <span className="text-[11px] text-slate-600 block">
            Inertial impaction loss in oral cavity
          </span>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-1">
          <span className="text-[10px] text-slate-500 font-bold uppercase block">Bronchial (Tracheobronchial)</span>
          <span className="text-2xl font-mono font-bold text-blue-600 block">
            {currentActiveDeposition.bronchialPct}%
          </span>
          <span className="text-[11px] text-slate-600 block">
            Upper airway & bronchial deposition
          </span>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-1">
          <span className="text-[10px] text-slate-500 font-bold uppercase block">Alveolar (Deep Lung)</span>
          <span className="text-2xl font-mono font-bold text-emerald-600 block">
            {currentActiveDeposition.alveolarPct}%
          </span>
          <span className="text-[11px] text-slate-600 block">
            Therapeutic parenchymal target
          </span>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-1">
          <span className="text-[10px] text-slate-500 font-bold uppercase block">Total Systemic Bioavailable</span>
          <span className="text-2xl font-mono font-bold text-indigo-700 block">
            {currentActiveDeposition.totalSystemicPct}%
          </span>
          <span className="text-[11px] text-slate-600 block">
            Bronchial + Alveolar combined
          </span>
        </div>
      </div>

      {/* Clinical Status Notice */}
      <div className={`p-3.5 rounded-lg border text-xs flex items-center justify-between shadow-xs ${flowRateClinicalStatus.badgeColor}`}>
        <div className="flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <div>
            <span className="font-bold block">{flowRateClinicalStatus.status}</span>
            <p className="text-[11px] mt-0.5">{flowRateClinicalStatus.message}</p>
          </div>
        </div>
        <span className="font-mono text-[11px] font-bold shrink-0 ml-4 px-2.5 py-1 rounded bg-white shadow-2xs">
          MMAD: {inhalationState.mmad_um || 2.4} µm
        </span>
      </div>

      {/* Dynamic Recharts Flow-Rate-to-Deposition Area/Line Chart */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="p-1 rounded bg-cyan-100 text-cyan-800">
                <TrendingUp className="w-4 h-4" />
              </span>
              <span>Regional Lung Deposition Profile vs. Inspiratory Flow Rate (Q)</span>
            </h4>
            <p className="text-xs text-slate-500">
              Area curves depict regional percentage distribution as patient inhalation effort increases from 30 to 120 L/min.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-cyan-800 bg-cyan-50 px-2.5 py-1 rounded border border-cyan-200">
            Active Marker at {inhalationFlowRateLmin} L/min
          </span>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={depositionCurveData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="flowRate"
                label={{ value: 'Inspiratory Flow Rate Q (L/min)', position: 'insideBottom', offset: -10, fontSize: 11 }}
                tick={{ fontSize: 11 }}
                domain={[30, 120]}
                type="number"
              />
              <YAxis
                label={{ value: 'Regional Deposition Fraction (%)', angle: -90, position: 'insideLeft', offset: 12, fontSize: 11 }}
                domain={[0, 100]}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-900 text-white p-3 rounded-lg shadow-lg text-xs space-y-1 font-mono border border-slate-700">
                      <div className="font-bold text-cyan-300 pb-1 border-b border-slate-700 font-sans">
                        Inspiratory Flow Rate: {label} L/min
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-rose-400">Extrathoracic (Mouth-Throat):</span>
                        <span className="font-bold text-white">{data.extrathoracicPct}%</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-blue-400">Bronchial (Tracheobronchial):</span>
                        <span className="font-bold text-white">{data.bronchialPct}%</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-emerald-400">Alveolar (Deep Lung):</span>
                        <span className="font-bold text-white">{data.alveolarPct}%</span>
                      </div>
                      <div className="flex justify-between gap-4 pt-1 border-t border-slate-700 font-bold">
                        <span className="text-indigo-300">Total Systemic (Lung):</span>
                        <span className="text-emerald-300">{data.totalSystemicPct}%</span>
                      </div>
                    </div>
                  );
                }}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 11 }} />

              <ReferenceLine
                x={inhalationFlowRateLmin}
                stroke="#0891b2"
                strokeWidth={2}
                strokeDasharray="4 4"
                label={{ value: `Q = ${inhalationFlowRateLmin} L/min`, fill: '#0891b2', fontSize: 10, position: 'insideTopRight' }}
              />

              <Area
                type="monotone"
                dataKey="extrathoracicPct"
                name="Extrathoracic (Mouth-Throat)"
                stackId="1"
                fill="#fda4af"
                stroke="#e11d48"
                fillOpacity={0.8}
              />
              <Area
                type="monotone"
                dataKey="bronchialPct"
                name="Bronchial (Tracheobronchial)"
                stackId="1"
                fill="#93c5fd"
                stroke="#2563eb"
                fillOpacity={0.8}
              />
              <Area
                type="monotone"
                dataKey="alveolarPct"
                name="Alveolar (Deep Lung)"
                stackId="1"
                fill="#6ee7b7"
                stroke="#059669"
                fillOpacity={0.85}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Scientific Takeaway Callout */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
          <div className="font-bold text-slate-900 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-cyan-600" />
            <span>Inhalation Aerodynamics Insight for {currentDrug.name}:</span>
          </div>
          <p className="text-slate-600 leading-relaxed text-[11px]">
            At <strong>{inhalationFlowRateLmin} L/min</strong>, the aerodynamic deposition yields <strong>{currentActiveDeposition.alveolarPct}% alveolar penetration</strong> and <strong>{currentActiveDeposition.extrathoracicPct}% oropharyngeal loss</strong>. Patients with impaired lung function (&le; 40 L/min) may experience severe sub-therapeutic delivery unless switched to low-resistance DPIs or pressurized MDI devices.
          </p>
        </div>
      </div>
    </div>
  );
};
