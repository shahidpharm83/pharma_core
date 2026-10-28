import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  Clock,
  Thermometer,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Droplets,
  PackageCheck,
  TrendingDown,
  Info,
  Calendar,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { CompoundProperties } from '../types/pharmadds';

interface AsdAcceleratedStabilityForecastProps {
  currentDrug: CompoundProperties;
  storageTemp_C: number;
  polymerTg_C: number;
  drugTg_C: number;
  drugWeightFraction: number; // 0.05 to 0.60
  polymerName: string;
  onOpenGlossary?: (termId?: string) => void;
}

export const AsdAcceleratedStabilityForecast: React.FC<AsdAcceleratedStabilityForecastProps> = ({
  currentDrug,
  storageTemp_C,
  polymerTg_C,
  drugTg_C,
  drugWeightFraction,
  polymerName,
  onOpenGlossary,
}) => {
  // Packaging barrier selection
  const [packagingType, setPackagingType] = useState<'alu_alu' | 'hdpe_desiccant' | 'blister_pvc'>('alu_alu');
  // Selected condition to highlight in details
  const [selectedProtocol, setSelectedProtocol] = useState<'accelerated' | 'intermediate' | 'long_term' | 'current'>('accelerated');

  // 1. Calculate Gordon-Taylor Dry Blend Tg
  const K_gt = 0.85;
  const tgBlendDry_C = useMemo(() => {
    const w = drugWeightFraction;
    const tgD_K = drugTg_C + 273.15;
    const tgP_K = polymerTg_C + 273.15;
    const blendK = (w * tgD_K + K_gt * (1 - w) * tgP_K) / (w + K_gt * (1 - w));
    return parseFloat((blendK - 273.15).toFixed(1));
  }, [drugWeightFraction, drugTg_C, polymerTg_C]);

  // 2. Protocols definition
  const protocols = useMemo(() => {
    return {
      accelerated: {
        id: 'accelerated',
        name: 'ICH Accelerated Stress',
        tempC: 40,
        rhPct: 75,
        badge: '40°C / 75% RH',
        color: '#DC2626', // Red
      },
      intermediate: {
        id: 'intermediate',
        name: 'ICH Intermediate',
        tempC: 30,
        rhPct: 65,
        badge: '30°C / 65% RH',
        color: '#F59E0B', // Amber
      },
      long_term: {
        id: 'long_term',
        name: 'ICH Long-Term Standard',
        tempC: 25,
        rhPct: 60,
        badge: '25°C / 60% RH',
        color: '#10B981', // Emerald
      },
      current: {
        id: 'current',
        name: 'Custom Formulation Storage',
        tempC: storageTemp_C,
        rhPct: packagingType === 'alu_alu' ? 10 : packagingType === 'hdpe_desiccant' ? 30 : 60,
        badge: `${storageTemp_C}°C / ${packagingType === 'alu_alu' ? '10%' : packagingType === 'hdpe_desiccant' ? '30%' : '60%'} RH`,
        color: '#6366F1', // Indigo
      },
    };
  }, [storageTemp_C, packagingType]);

  // Moisture ingress multiplier based on packaging barrier
  const packagingMoistureFactor = useMemo(() => {
    switch (packagingType) {
      case 'alu_alu':
        return 0.15; // Near hermetic, water vapor transmission rate < 0.005 g/m2/day
      case 'hdpe_desiccant':
        return 0.45; // Moderate protection with active silica gel / molecular sieve
      case 'blister_pvc':
      default:
        return 1.0; // High moisture permeation, rapid plasticization
    }
  }, [packagingType]);

  // Helper to compute Tg,wet depressed by moisture (Fox Equation)
  // 1/Tg_wet = w_blend/Tg_blend + w_water/Tg_water, Tg_water ~ 138 K (-135 C)
  const getWetTg = (tempC: number, rhPct: number) => {
    // Equilibrium moisture content estimated from RH and packaging protection
    const moistureContentWw = (rhPct / 100) * 0.05 * packagingMoistureFactor; // 0.2% - 3.75% water
    const tgBlendK = tgBlendDry_C + 273.15;
    const tgWaterK = 138.15;
    const invTg = (1 - moistureContentWw) / tgBlendK + moistureContentWw / tgWaterK;
    const wetK = 1 / invTg;
    return parseFloat((wetK - 273.15).toFixed(1));
  };

  // 3. Compute JMAK 12-Month Kinetic Trajectory
  // alpha(t) = alpha_max * [ 1 - exp( -(k * t)^n ) ]
  // Rate k is exponential in (T - Tg_wet) via WLF relaxation:
  // log10(k) = log10(k0) + (T - (Tg_wet - 50)) / 15
  const calculateTrajectory = (tempC: number, rhPct: number) => {
    const wetTg = getWetTg(tempC, rhPct);
    const deltaT = wetTg - tempC; // Positive means below Tg (glassy)
    
    // Hancock-Zografi 50C margin
    // When deltaT >= 50, k is extremely low (~0.0008 month^-1)
    // When deltaT <= 0 (above Tg), crystallization is ultra rapid (k > 1.2 month^-1)
    let kRate: number;
    if (deltaT >= 50) {
      kRate = 0.0008 + (60 - Math.min(60, deltaT)) * 0.00005;
    } else if (deltaT > 0) {
      // Transition zone: exponential rise
      kRate = 0.001 * Math.exp((50 - deltaT) / 7.5);
    } else {
      // Supercooled liquid above Tg
      kRate = 0.35 * Math.exp(Math.abs(deltaT) / 10);
    }

    // Drug loading factor: higher drug loading (>30%) increases nucleation density
    const loadingFactor = Math.pow(drugWeightFraction / 0.20, 1.8);
    const effectiveK = Math.max(0.0005, kRate * loadingFactor);
    const nAvrami = 1.8; // Diffusion-limited crystal growth
    const alphaMax = 100;

    const timePoints = [0, 1, 2, 3, 6, 9, 12];
    return timePoints.map((month) => {
      let recrystallizedPct = 0;
      if (month > 0) {
        recrystallizedPct = alphaMax * (1 - Math.exp(-Math.pow(effectiveK * month, nAvrami)));
      }
      recrystallizedPct = parseFloat(Math.min(100, Math.max(0, recrystallizedPct)).toFixed(2));
      const amorphousPurityPct = parseFloat((100 - recrystallizedPct).toFixed(2));
      
      // Supersaturation retention decreases as crystals act as seeds
      const parachuteRetentionPct = parseFloat(Math.max(10, 100 - recrystallizedPct * 1.35).toFixed(1));

      // PXRD Status
      let pxrdStatus = 'Amorphous Halo (100% Non-Crystalline)';
      let compliance = 'Pass (ICH Q1A Compliant)';
      if (recrystallizedPct > 5.0) {
        pxrdStatus = 'Sharp Bragg Diffraction Peaks Detected (>5%)';
        compliance = 'Fail (Recrystallization Exceeds Limit)';
      } else if (recrystallizedPct > 2.0) {
        pxrdStatus = 'Incipient Crystal Reflections (2-5% Birefringence)';
        compliance = 'Borderline Warning';
      }

      return {
        month,
        amorphousPurityPct,
        recrystallizedPct,
        parachuteRetentionPct,
        pxrdStatus,
        compliance,
      };
    });
  };

  // Generate 12-month data series for all 4 conditions
  const trajectories = useMemo(() => {
    return {
      accelerated: calculateTrajectory(protocols.accelerated.tempC, protocols.accelerated.rhPct),
      intermediate: calculateTrajectory(protocols.intermediate.tempC, protocols.intermediate.rhPct),
      long_term: calculateTrajectory(protocols.long_term.tempC, protocols.long_term.rhPct),
      current: calculateTrajectory(protocols.current.tempC, protocols.current.rhPct),
    };
  }, [protocols, packagingMoistureFactor, tgBlendDry_C, drugWeightFraction]);

  // Combined chart dataset
  const chartData = useMemo(() => {
    return [0, 1, 2, 3, 6, 9, 12].map((m, idx) => ({
      month: m,
      monthLabel: m === 0 ? 'Initial (0M)' : `${m}M`,
      acceleratedAmorph: trajectories.accelerated[idx].amorphousPurityPct,
      acceleratedCryst: trajectories.accelerated[idx].recrystallizedPct,
      intermediateAmorph: trajectories.intermediate[idx].amorphousPurityPct,
      longTermAmorph: trajectories.long_term[idx].amorphousPurityPct,
      currentAmorph: trajectories.current[idx].amorphousPurityPct,
      currentCryst: trajectories.current[idx].recrystallizedPct,
      currentParachute: trajectories.current[idx].parachuteRetentionPct,
    }));
  }, [trajectories]);

  // Current active protocol details
  const activeData = trajectories[selectedProtocol];
  const activeWetTg = getWetTg(protocols[selectedProtocol].tempC, protocols[selectedProtocol].rhPct);
  const activeDeltaT = activeWetTg - protocols[selectedProtocol].tempC;
  const month6Cryst = activeData[4].recrystallizedPct; // idx 4 = month 6
  const month12Cryst = activeData[6].recrystallizedPct; // idx 6 = month 12

  // Predicted Shelf Life Evaluation
  const shelfLifeEvaluation = useMemo(() => {
    if (trajectories.accelerated[4].recrystallizedPct <= 2.0 && trajectories.long_term[6].recrystallizedPct <= 1.0) {
      return {
        shelfLife: '≥ 24 - 36 Months',
        badge: 'Commercial Gold Standard (ICH Q1A Passed)',
        color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
        icon: CheckCircle2,
        recommendation: 'Exceptional stability! Passes 6-month accelerated stress (40°C/75% RH) with <2% recrystallization. Suitable for commercial room-temperature worldwide distribution (Zone I-IVb).',
      };
    } else if (trajectories.accelerated[4].recrystallizedPct <= 5.0) {
      return {
        shelfLife: '18 - 24 Months (Moisture-Sensitive)',
        badge: 'Metastable Solid Dispersion (Alu-Alu Packaging Required)',
        color: 'text-amber-700 bg-amber-50 border-amber-200',
        icon: AlertTriangle,
        recommendation: 'Borderline stability under 40°C/75% RH. Requires high-barrier primary packaging (cold-form Alu-Alu blister foil or HDPE bottle with 2g molecular sieve desiccant canister).',
      };
    } else {
      return {
        shelfLife: '< 6 - 9 Months (Accelerated Failure)',
        badge: 'High Recrystallization Risk (Formulation Redesign Needed)',
        color: 'text-rose-700 bg-rose-50 border-rose-200',
        icon: XCircle,
        recommendation: `Fails 6-month accelerated testing (>5% recrystallization by Month ${
          trajectories.accelerated.find((t) => t.recrystallizedPct > 5.0)?.month || 6
        }). Recommend reducing drug loading below ${(drugWeightFraction * 100).toFixed(0)} wt%, or switching to a higher Tg polymer matrix (e.g. HPMC-AS or PVP K30).`,
      };
    }
  }, [trajectories, drugWeightFraction]);

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded bg-rose-100 text-rose-700">
              <Calendar className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              12-Month Accelerated Stability Forecast & Physical Recrystallization Kinetics
            </h3>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-semibold">
              ICH Q1A(R2) & Hancock-Zografi 50°C Rule
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Predicts amorphous-to-crystalline phase transformation over 12 months using Avrami kinetics, moisture-plasticized glass transition (Tg,wet), and molecular relaxation times.
          </p>
        </div>

        {/* Packaging Barrier Selector */}
        <div className="flex items-center gap-2 text-xs self-start lg:self-auto bg-slate-50 border border-slate-200 p-1.5 rounded-lg">
          <span className="text-slate-500 font-medium">Primary Packaging:</span>
          <select
            value={packagingType}
            onChange={(e) => setPackagingType(e.target.value as any)}
            className="text-xs font-semibold bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
          >
            <option value="alu_alu">Alu-Alu Cold-Form (Hermetic Barrier)</option>
            <option value="hdpe_desiccant">HDPE Bottle + Molecular Sieve Desiccant</option>
            <option value="blister_pvc">PVC/PVDC Blister (Standard Permeable)</option>
          </select>
        </div>
      </div>

      {/* Top 4 Key Indicator Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Dry Blend Tg */}
        <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Dry Blend Tg</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-mono font-bold text-slate-900">{tgBlendDry_C}°C</span>
            <span className="text-[10px] text-slate-500">Gordon-Taylor</span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            Polymer: {polymerTg_C}°C | Drug: {drugTg_C}°C
          </span>
        </div>

        {/* Moisture Plasticized Tg,wet */}
        <div className="p-3.5 rounded-lg bg-blue-50/70 border border-blue-200">
          <span className="text-[10px] uppercase font-bold text-blue-700 block">Tg,wet ({protocols[selectedProtocol].rhPct}% RH)</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-mono font-bold text-blue-900">{activeWetTg}°C</span>
            <span className="text-[10px] text-blue-600 font-mono">Fox Eq</span>
          </div>
          <span className="text-[10px] text-blue-700/80 block mt-0.5">
            Water Depression: -{(tgBlendDry_C - activeWetTg).toFixed(1)}°C
          </span>
        </div>

        {/* Stability Margin */}
        <div className="p-3.5 rounded-lg bg-purple-50/70 border border-purple-200">
          <span className="text-[10px] uppercase font-bold text-purple-700 block">Stability Margin (Tg - T)</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className={`text-xl font-mono font-bold ${activeDeltaT >= 50 ? 'text-emerald-700' : activeDeltaT >= 25 ? 'text-amber-700' : 'text-rose-700'}`}>
              +{activeDeltaT.toFixed(1)}°C
            </span>
          </div>
          <span className="text-[10px] text-purple-700/80 block mt-0.5 font-medium">
            {activeDeltaT >= 50 ? '✓ Exceeds 50°C Rule' : '⚠ Below 50°C Margin'}
          </span>
        </div>

        {/* Accelerated 6M Crystallinity */}
        <div className="p-3.5 rounded-lg bg-rose-50/70 border border-rose-200">
          <span className="text-[10px] uppercase font-bold text-rose-700 block">6M Accelerated Crystallinity</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className={`text-xl font-mono font-bold ${month6Cryst <= 2.0 ? 'text-emerald-700' : month6Cryst <= 5.0 ? 'text-amber-700' : 'text-rose-700'}`}>
              {trajectories.accelerated[4].recrystallizedPct}%
            </span>
            <span className="text-[10px] text-rose-600 font-mono">w/w</span>
          </div>
          <span className="text-[10px] text-rose-700/80 block mt-0.5 font-semibold">
            {trajectories.accelerated[4].recrystallizedPct <= 5.0 ? '✓ Within ICH <5% Limit' : '✕ Exceeds Spec'}
          </span>
        </div>
      </div>

      {/* Main Visual: 12-Month Trajectory Recharts Component */}
      <div className="space-y-3">
        {/* Protocol Selector Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-600 font-semibold mr-1">Select Protocol:</span>
            {Object.values(protocols).map((prot) => {
              const isSelected = selectedProtocol === prot.id;
              return (
                <button
                  key={prot.id}
                  type="button"
                  onClick={() => setSelectedProtocol(prot.id as any)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-white text-slate-900 border border-slate-300 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: prot.color }}></span>
                  {prot.name} ({prot.badge})
                </button>
              );
            })}
          </div>

          <div className="text-[11px] font-mono text-slate-500">
            Avrami Crystallization Exponent n = 1.8 | Drug Loading: {(drugWeightFraction * 100).toFixed(0)} wt%
          </div>
        </div>

        {/* Recharts 12-Month Area & Line Forecast */}
        <div className="h-80 w-full bg-white rounded-lg border border-slate-200 p-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis
                dataKey="month"
                type="number"
                domain={[0, 12]}
                ticks={[0, 1, 2, 3, 6, 9, 12]}
                tickFormatter={(val) => (val === 0 ? '0M' : `${val}M`)}
                stroke="#94A3B8"
                tick={{ fontSize: 11, fill: '#64748B' }}
                label={{
                  value: 'Stability Time Points (Months) →',
                  position: 'insideBottom',
                  offset: -15,
                  fontSize: 11,
                  fill: '#475569',
                  fontWeight: 600,
                }}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 20, 40, 60, 80, 95, 100]}
                stroke="#94A3B8"
                tick={{ fontSize: 11, fill: '#64748B' }}
                label={{
                  value: 'Amorphous Phase Purity (%)',
                  angle: -90,
                  position: 'insideLeft',
                  offset: 5,
                  fontSize: 11,
                  fill: '#475569',
                  fontWeight: 600,
                }}
              />

              {/* 95% Amorphous Specification Threshold (5% Crystallinity Failure Limit) */}
              <ReferenceLine
                y={95}
                stroke="#DC2626"
                strokeDasharray="4 3"
                label={{
                  value: '95% Purity Threshold (ICH 5% Recrystallization Limit)',
                  position: 'insideBottomRight',
                  fill: '#DC2626',
                  fontSize: 10,
                  fontWeight: 'bold',
                }}
              />

              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const data = payload[0].payload;
                  const mIdx = [0, 1, 2, 3, 6, 9, 12].indexOf(data.month);
                  const selDetails = trajectories[selectedProtocol][mIdx >= 0 ? mIdx : 0];

                  return (
                    <div className="bg-slate-900/95 text-white p-3.5 rounded-lg shadow-xl text-xs space-y-1.5 border border-slate-700 min-w-[240px]">
                      <div className="font-bold border-b border-slate-700 pb-1 text-slate-200 flex justify-between">
                        <span>Timepoint: {data.month === 0 ? 'Initial Release' : `Month ${data.month}`}</span>
                        <span className="text-amber-400 font-mono">{protocols[selectedProtocol].badge}</span>
                      </div>
                      <div className="flex justify-between text-emerald-300">
                        <span>Amorphous Purity:</span>
                        <span className="font-mono font-bold">{selDetails.amorphousPurityPct}%</span>
                      </div>
                      <div className="flex justify-between text-rose-300">
                        <span>Recrystallized Drug:</span>
                        <span className="font-mono font-bold">{selDetails.recrystallizedPct}%</span>
                      </div>
                      <div className="flex justify-between text-blue-300">
                        <span>Supersaturation Retention:</span>
                        <span className="font-mono font-bold">{selDetails.parachuteRetentionPct}%</span>
                      </div>
                      <div className="pt-1.5 text-[10px] text-slate-300 border-t border-slate-800 space-y-0.5">
                        <div className="font-medium text-slate-400">PXRD: {selDetails.pxrdStatus}</div>
                        <div className={`font-bold ${selDetails.recrystallizedPct <= 5.0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {selDetails.compliance}
                        </div>
                      </div>
                    </div>
                  );
                }}
              />

              {/* Shaded Area for Selected Protocol */}
              <Area
                type="monotone"
                dataKey={
                  selectedProtocol === 'accelerated'
                    ? 'acceleratedAmorph'
                    : selectedProtocol === 'intermediate'
                    ? 'intermediateAmorph'
                    : selectedProtocol === 'long_term'
                    ? 'longTermAmorph'
                    : 'currentAmorph'
                }
                name={`${protocols[selectedProtocol].name} Amorphous %`}
                fill={protocols[selectedProtocol].color}
                stroke={protocols[selectedProtocol].color}
                fillOpacity={0.15}
                strokeWidth={2.5}
              />

              {/* Benchmark Multi-Curves for Direct Comparison */}
              <Line
                type="monotone"
                dataKey="acceleratedAmorph"
                name="ICH Accelerated (40°C/75% RH)"
                stroke="#DC2626"
                strokeWidth={selectedProtocol === 'accelerated' ? 3 : 1.5}
                strokeDasharray={selectedProtocol === 'accelerated' ? undefined : '3 3'}
                dot={true}
              />
              <Line
                type="monotone"
                dataKey="intermediateAmorph"
                name="ICH Intermediate (30°C/65% RH)"
                stroke="#F59E0B"
                strokeWidth={selectedProtocol === 'intermediate' ? 3 : 1.5}
                strokeDasharray={selectedProtocol === 'intermediate' ? undefined : '3 3'}
                dot={true}
              />
              <Line
                type="monotone"
                dataKey="longTermAmorph"
                name="ICH Long-Term (25°C/60% RH)"
                stroke="#10B981"
                strokeWidth={selectedProtocol === 'long_term' ? 3 : 1.5}
                strokeDasharray={selectedProtocol === 'long_term' ? undefined : '3 3'}
                dot={true}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Month-by-Month Progress Matrix for Selected Protocol */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-900 block">
          Month-by-Month Physical Testing Matrix — {protocols[selectedProtocol].name} ({protocols[selectedProtocol].badge}):
        </span>
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="min-w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2 px-3">Timepoint</th>
                <th className="py-2 px-3">Amorphous Purity</th>
                <th className="py-2 px-3">Recrystallized %</th>
                <th className="py-2 px-3">Dissolution Parachute</th>
                <th className="py-2 px-3">PXRD & Polarized Light</th>
                <th className="py-2 px-3">ICH Q1A Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {activeData.map((row) => (
                <tr key={row.month} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2 px-3 font-mono font-bold text-slate-900">
                    {row.month === 0 ? 'Month 0 (Release)' : `Month ${row.month}`}
                  </td>
                  <td className="py-2 px-3 font-mono text-emerald-700 font-semibold">
                    {row.amorphousPurityPct}%
                  </td>
                  <td className="py-2 px-3 font-mono text-slate-800">
                    <span className={row.recrystallizedPct > 5.0 ? 'text-rose-600 font-bold' : row.recrystallizedPct > 2.0 ? 'text-amber-600 font-medium' : 'text-slate-600'}>
                      {row.recrystallizedPct}%
                    </span>
                  </td>
                  <td className="py-2 px-3 font-mono text-blue-700">
                    {row.parachuteRetentionPct}% AUC
                  </td>
                  <td className="py-2 px-3 text-[11px] text-slate-500">
                    {row.pxrdStatus}
                  </td>
                  <td className="py-2 px-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        row.recrystallizedPct <= 2.0
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : row.recrystallizedPct <= 5.0
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {row.recrystallizedPct <= 2.0 ? '✓ Pass' : row.recrystallizedPct <= 5.0 ? '⚠ Alert' : '✕ Out of Spec'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Regulatory Shelf-Life Verdict & Packaging Guidance Banner */}
      <div className={`p-4 rounded-lg border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${shelfLifeEvaluation.color}`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <shelfLifeEvaluation.icon className="w-5 h-5 shrink-0" />
            <span className="font-bold text-sm">
              Predicted Commercial Shelf-Life: {shelfLifeEvaluation.shelfLife}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/80 border border-current">
              {shelfLifeEvaluation.badge}
            </span>
          </div>
          <p className="text-xs leading-relaxed opacity-90 max-w-3xl">
            {shelfLifeEvaluation.recommendation}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-stretch sm:self-auto justify-between sm:justify-start pt-2 sm:pt-0 border-t sm:border-t-0 border-current/20">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold opacity-75 block">Active Barrier</span>
            <span className="text-xs font-bold font-mono">
              {packagingType === 'alu_alu' ? 'Alu-Alu Cold Form' : packagingType === 'hdpe_desiccant' ? 'HDPE + Desiccant' : 'PVC Blister'}
            </span>
          </div>
          {onOpenGlossary && (
            <button
              type="button"
              onClick={() => onOpenGlossary('hancock_zografi')}
              className="px-2.5 py-1.5 text-xs font-semibold rounded bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 transition-colors shadow-2xs"
            >
              Stability Guide
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
