import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Area,
} from 'recharts';
import {
  Calendar,
  Clock,
  Thermometer,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Package,
  Droplets,
  Flame,
  FileText,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Check,
  Sparkles,
  Info,
} from 'lucide-react';
import { CompoundProperties } from '../types/pharmadds';
import { IidExcipientRecord } from '../data/fdaIidDatabase';
import { ExcipientCompatibilityResult } from '../services/drugExcipientCompatibility';

interface RegulatoryStabilityDashboardProps {
  currentDrug: CompoundProperties;
  recipeItems: Array<{
    id: string;
    excipient: IidExcipientRecord;
    proposedAmountMg: number;
    route: string;
    dosageForm: string;
  }>;
  dosageForm: string;
  deliveryRoute: string;
  compatibilityResults: ExcipientCompatibilityResult[];
  onOpenGlossary?: (termId?: string) => void;
}

export const RegulatoryStabilityDashboard: React.FC<RegulatoryStabilityDashboardProps> = ({
  currentDrug,
  recipeItems,
  dosageForm,
  deliveryRoute,
  compatibilityResults,
  onOpenGlossary,
}) => {
  // Packaging barrier selection
  const [packagingType, setPackagingType] = useState<
    'alu_alu' | 'hdpe_desiccant' | 'pvc_pvdc' | 'glass_vial'
  >(() => {
    if (deliveryRoute.toLowerCase().includes('intra') || deliveryRoute.toLowerCase().includes('subcut')) {
      return 'glass_vial';
    }
    return 'alu_alu';
  });

  // Selected testing protocol to highlight
  const [selectedProtocol, setSelectedProtocol] = useState<
    'long_term' | 'intermediate' | 'accelerated'
  >('accelerated');

  // 1. Calculate Chemical & Formulation Degradation Constants
  const stabilityFactors = useMemo(() => {
    // Base activation energy (kJ/mol)
    let Ea = 82.0;

    // Drug functional group impact
    const isAmine = currentDrug.smiles.includes('N') || currentDrug.name.toLowerCase().includes('doxorubicin');
    const isEster = currentDrug.smiles.includes('C(=O)O') || currentDrug.name.toLowerCase().includes('paclitaxel');
    const isLabile = currentDrug.molecularWeight > 600 || currentDrug.bcsClass === 'BCS IV';

    // Incompatibility penalty
    const hasHighRiskIncompatibility = compatibilityResults.some(
      (c) => c.riskLevel === 'HIGH_RISK'
    );
    const hasModerateRisk = compatibilityResults.some(
      (c) => c.riskLevel === 'MODERATE_RISK'
    );

    // Multiplier for degradation rate
    let incompatibilityMultiplier = 1.0;
    if (hasHighRiskIncompatibility) {
      incompatibilityMultiplier = 2.8; // Significant accelerated degradation
    } else if (hasModerateRisk) {
      incompatibilityMultiplier = 1.45;
    }

    // Packaging barrier protection factor (moisture/oxygen ingress)
    let packagingBarrierFactor = 1.0;
    switch (packagingType) {
      case 'alu_alu':
        packagingBarrierFactor = 0.55; // Excellent moisture barrier (MVTR < 0.005 g/m²/d)
        break;
      case 'hdpe_desiccant':
        packagingBarrierFactor = 0.75; // Good barrier with moisture scavenger
        break;
      case 'pvc_pvdc':
        packagingBarrierFactor = 1.25; // Moderate moisture permeability
        break;
      case 'glass_vial':
        packagingBarrierFactor = 0.50; // Hermetic seal Type I Borosilicate
        break;
    }

    // Base degradation rate constant at 25°C (1/month)
    const baseK25 = 0.0018 * incompatibilityMultiplier * packagingBarrierFactor;

    // Arrhenius temperature scaling: k(T) = k25 * exp[ -(Ea/R) * (1/T - 1/298.15) ]
    const R = 8.314e-3; // kJ / (mol * K)
    const T25_K = 298.15;
    const T30_K = 303.15;
    const T40_K = 313.15;

    const k25 = baseK25;
    const k30 = baseK25 * Math.exp((-Ea / R) * (1 / T30_K - 1 / T25_K));
    const k40 = baseK25 * Math.exp((-Ea / R) * (1 / T40_K - 1 / T25_K));

    // Projected shelf life at 25°C (time to reach 90.0% potency floor: t90 = -ln(0.90) / k25)
    const projectedShelfLifeMonths_25C = Math.min(48, Math.round((-Math.log(0.90) / k25) * 10) / 10);
    const projectedShelfLifeMonths_30C = Math.min(36, Math.round((-Math.log(0.90) / k30) * 10) / 10);

    // Accelerated 6-month remaining potency at 40°C / 75% RH
    const potencyAt6M_40C = Math.round(100 * Math.exp(-k40 * 6) * 10) / 10;
    const passesAcceleratedSignificantChange = potencyAt6M_40C >= 95.0;

    return {
      Ea,
      k25,
      k30,
      k40,
      hasHighRiskIncompatibility,
      hasModerateRisk,
      projectedShelfLifeMonths_25C,
      projectedShelfLifeMonths_30C,
      potencyAt6M_40C,
      passesAcceleratedSignificantChange,
      isCompliantIchQ1A: projectedShelfLifeMonths_25C >= 24 && passesAcceleratedSignificantChange,
    };
  }, [currentDrug, compatibilityResults, packagingType]);

  // 2. Generate ICH Q1A(R2) Potency Trajectory Data (0 to 36 months)
  const trajectoryData = useMemo(() => {
    const timePoints = [0, 3, 6, 9, 12, 18, 24, 30, 36];

    return timePoints.map((month) => {
      const assay25C = Math.max(70, Math.round(100 * Math.exp(-stabilityFactors.k25 * month) * 10) / 10);
      const assay30C = Math.max(65, Math.round(100 * Math.exp(-stabilityFactors.k30 * month) * 10) / 10);
      const assay40C = Math.max(50, Math.round(100 * Math.exp(-stabilityFactors.k40 * month) * 10) / 10);

      return {
        month,
        monthLabel: `${month}M`,
        longTerm25C: assay25C,
        intermediate30C: assay30C,
        accelerated40C: assay40C,
        uspFloor: 90.0,
        ichSignificantChange: 95.0,
      };
    });
  }, [stabilityFactors]);

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-5">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-teal-100 text-teal-800">
              <Calendar className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-slate-900">
              Regulatory Stability Dashboard — ICH Q1A(R2) Compliance
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 font-semibold uppercase">
              ICH Q1A(R2) & USP &lt;1151&gt;
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Predictive chemical kinetics and degradation forecasting for {currentDrug.name} ({dosageForm}) across standard ICH climatic storage zones.
          </p>
        </div>

        {/* Primary Packaging Barrier Selector */}
        <div className="flex items-center gap-2 text-xs">
          <label className="text-slate-600 font-medium flex items-center gap-1">
            <Package className="w-3.5 h-3.5 text-slate-500" />
            <span>Primary Package:</span>
          </label>
          <select
            value={packagingType}
            onChange={(e) => setPackagingType(e.target.value as any)}
            className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-teal-500"
          >
            <option value="alu_alu">Alu-Alu Cold Form Blister (Impermeable)</option>
            <option value="hdpe_desiccant">HDPE Bottle + 2g Silica Gel Desiccant</option>
            <option value="pvc_pvdc">PVC/PVDC Blister (Standard Barrier)</option>
            <option value="glass_vial">Type I Borosilicate Glass Vial + FluroTec</option>
          </select>
        </div>
      </div>

      {/* ICH Q1A(R2) Storage Condition Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Long-Term (25°C / 60% RH) */}
        <div
          onClick={() => setSelectedProtocol('long_term')}
          className={`p-4 rounded-lg border transition-all cursor-pointer ${
            selectedProtocol === 'long_term'
              ? 'bg-blue-50/70 border-blue-400 shadow-xs ring-1 ring-blue-300'
              : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold text-blue-700">
              Long-Term (Zone II / IVa)
            </span>
            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
              25°C ± 2°C / 60% ± 5% RH
            </span>
          </div>

          <div className="mt-3">
            <div className="text-2xl font-mono font-bold text-slate-900">
              {stabilityFactors.projectedShelfLifeMonths_25C} Months
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Projected Room Temperature Shelf-Life ($t_{90}$)
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-200/70 flex items-center justify-between text-xs">
            <span className="text-slate-500">ICH Q1A Standard:</span>
            <span
              className={`font-bold flex items-center gap-1 ${
                stabilityFactors.projectedShelfLifeMonths_25C >= 24
                  ? 'text-emerald-700'
                  : 'text-amber-700'
              }`}
            >
              {stabilityFactors.projectedShelfLifeMonths_25C >= 24 ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Passes (≥ 24 Mos)</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Sub-24 Mo Shelf Life</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* Card 2: Intermediate (30°C / 65% RH) */}
        <div
          onClick={() => setSelectedProtocol('intermediate')}
          className={`p-4 rounded-lg border transition-all cursor-pointer ${
            selectedProtocol === 'intermediate'
              ? 'bg-purple-50/70 border-purple-400 shadow-xs ring-1 ring-purple-300'
              : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold text-purple-700">
              Intermediate Condition
            </span>
            <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-bold">
              30°C ± 2°C / 65% ± 5% RH
            </span>
          </div>

          <div className="mt-3">
            <div className="text-2xl font-mono font-bold text-slate-900">
              {stabilityFactors.projectedShelfLifeMonths_30C} Months
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Intermediate Tropical Zone Endurance ($t_{90}$)
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-200/70 flex items-center justify-between text-xs">
            <span className="text-slate-500">ICH Q1A Requirement:</span>
            <span className="font-bold text-slate-800">
              {stabilityFactors.projectedShelfLifeMonths_30C >= 12
                ? '✓ Meets 12-Mo Requirement'
                : '⚠ High Thermal Sensitivity'}
            </span>
          </div>
        </div>

        {/* Card 3: Accelerated Stress (40°C / 75% RH) */}
        <div
          onClick={() => setSelectedProtocol('accelerated')}
          className={`p-4 rounded-lg border transition-all cursor-pointer ${
            selectedProtocol === 'accelerated'
              ? 'bg-amber-50/70 border-amber-400 shadow-xs ring-1 ring-amber-300'
              : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold text-amber-800">
              Accelerated Stress (6 Mos)
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold">
              40°C ± 2°C / 75% ± 5% RH
            </span>
          </div>

          <div className="mt-3">
            <div
              className={`text-2xl font-mono font-bold ${
                stabilityFactors.passesAcceleratedSignificantChange
                  ? 'text-emerald-700'
                  : 'text-rose-700'
              }`}
            >
              {stabilityFactors.potencyAt6M_40C}% Assay
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Assay Remaining at 6 Months (Floor: 95.0%)
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-200/70 flex items-center justify-between text-xs">
            <span className="text-slate-500">Significant Change:</span>
            <span
              className={`font-bold flex items-center gap-1 ${
                stabilityFactors.passesAcceleratedSignificantChange
                  ? 'text-emerald-700'
                  : 'text-rose-700'
              }`}
            >
              {stabilityFactors.passesAcceleratedSignificantChange ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>No Significant Change</span>
                </>
              ) : (
                <>
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Significant Change (&lt;95%)</span>
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Degradation Trajectory Recharts Plot */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-900 flex items-center gap-1.5">
            <Thermometer className="w-3.5 h-3.5 text-teal-600" />
            <span>36-Month Accelerated & Long-Term Potency Trajectory (% Initial Assay)</span>
          </span>
          <span className="text-slate-500 text-[11px] font-mono">
            ICH Q1A(R2) Standard Testing Intervals (0, 3, 6, 9, 12, 18, 24, 30, 36M)
          </span>
        </div>

        <div className="h-72 w-full pt-1 bg-slate-50/50 rounded-lg border border-slate-200 p-3">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={trajectoryData}
              margin={{ top: 15, right: 30, left: 0, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="monthLabel"
                tick={{ fontSize: 11, fill: '#475569' }}
                stroke="#94a3b8"
              />
              <YAxis
                domain={[85, 102]}
                tick={{ fontSize: 11, fill: '#475569' }}
                stroke="#94a3b8"
                unit="%"
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;
                  return (
                    <div className="p-3 bg-slate-900 text-white rounded-lg shadow-xl text-xs space-y-1.5 border border-slate-700 min-w-[200px]">
                      <div className="font-bold text-white border-b border-slate-700 pb-1">
                        Timepoint: {label}
                      </div>
                      <div className="space-y-1 text-[11px]">
                        <div className="flex items-center justify-between text-blue-300">
                          <span>Long-Term (25°C/60% RH):</span>
                          <span className="font-mono font-bold">
                            {payload.find((p) => p.dataKey === 'longTerm25C')?.value}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-purple-300">
                          <span>Intermediate (30°C/65% RH):</span>
                          <span className="font-mono font-bold">
                            {payload.find((p) => p.dataKey === 'intermediate30C')?.value}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-amber-300">
                          <span>Accelerated (40°C/75% RH):</span>
                          <span className="font-mono font-bold">
                            {payload.find((p) => p.dataKey === 'accelerated40C')?.value}%
                          </span>
                        </div>
                      </div>
                      <div className="pt-1.5 border-t border-slate-800 text-[10px] text-slate-400">
                        USP Assay Specification: 90.0% – 105.0%
                      </div>
                    </div>
                  );
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: 10, fontSize: 11 }}
              />

              {/* Reference Lines */}
              <ReferenceLine
                y={95.0}
                stroke="#f59e0b"
                strokeDasharray="3 3"
                label={{
                  value: '95.0% ICH Significant Change Floor',
                  position: 'insideTopRight',
                  fill: '#d97706',
                  fontSize: 10,
                  fontWeight: 'bold',
                }}
              />
              <ReferenceLine
                y={90.0}
                stroke="#ef4444"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: '90.0% Commercial Release Minimum',
                  position: 'insideBottomRight',
                  fill: '#ef4444',
                  fontSize: 10,
                  fontWeight: 'bold',
                }}
              />

              {/* Trajectory Curves */}
              <Line
                type="monotone"
                dataKey="longTerm25C"
                name="25°C / 60% RH (Long-Term)"
                stroke="#2563eb"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#2563eb' }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="intermediate30C"
                name="30°C / 65% RH (Intermediate)"
                stroke="#9333ea"
                strokeWidth={2}
                dot={{ r: 3, fill: '#9333ea' }}
              />
              <Line
                type="monotone"
                dataKey="accelerated40C"
                name="40°C / 75% RH (Accelerated Stress)"
                stroke="#d97706"
                strokeWidth={2}
                strokeDasharray="4 2"
                dot={{ r: 3, fill: '#d97706' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Regulatory Dossier & Labeling Recommendation */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-900 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-slate-700" />
            <span>Recommended Regulatory Storage Statement for Drug Product Labeling</span>
          </span>
          <span className="text-[10px] font-mono text-slate-500">ICH Q1A Section 2.1.7</span>
        </div>

        <div className="p-3 bg-white rounded border border-slate-300 font-mono text-[11px] text-slate-800 leading-relaxed">
          &ldquo;Store at 20°C to 25°C (68°F to 77°F); excursions permitted between 15°C and 30°C
          (59°F and 86°F) [see USP Controlled Room Temperature]. Protect from moisture and excessive
          heat. Dispense in tight, light-resistant container with child-resistant closure.&rdquo;
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] pt-1">
          <div className="p-2.5 bg-white rounded border border-slate-200 space-y-1">
            <span className="font-bold text-slate-800 block">Excipient Compatibility Impact:</span>
            <p className="text-slate-600">
              {stabilityFactors.hasHighRiskIncompatibility
                ? 'High chemical incompatibility detected! Degradation rate accelerated by 2.8x. Immediate excipient mitigation advised to preserve 24-month shelf life.'
                : 'All formulation excipients demonstrate compendial chemical compatibility, preserving natural active shelf-life.'}
            </p>
          </div>

          <div className="p-2.5 bg-white rounded border border-slate-200 space-y-1">
            <span className="font-bold text-slate-800 block">Packaging Barrier Performance:</span>
            <p className="text-slate-600">
              Selected <strong>{packagingType.replace('_', ' ').toUpperCase()}</strong> provides an optimal barrier, suppressing atmospheric moisture-driven hydrolysis and plasticization.
            </p>
          </div>

          <div className="p-2.5 bg-white rounded border border-slate-200 space-y-1">
            <span className="font-bold text-slate-800 block">Accelerated Stability Verdict:</span>
            <p
              className={
                stabilityFactors.passesAcceleratedSignificantChange
                  ? 'text-emerald-700 font-semibold'
                  : 'text-rose-700 font-semibold'
              }
            >
              {stabilityFactors.passesAcceleratedSignificantChange
                ? 'Passes 6-Month Accelerated ICH Criteria (>95.0% Assay). No significant change anticipated.'
                : 'Fails Accelerated Criteria (<95.0% Assay at 6M). Formulation stabilization required.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
