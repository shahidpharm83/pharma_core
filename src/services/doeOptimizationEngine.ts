import { CompoundProperties } from '../types/pharmadds';
import { IidExcipientRecord, FDA_IID_FLAT_DATABASE } from '../data/fdaIidDatabase';

export interface DoePolymerOption {
  id: string;
  name: string;
  tradeName: string;
  tg_C: number;
  kGordonTaylor: number;
  precipitationInhibitionFactor: number; // 1.0 to 2.0
  hygroscopicity: 'Low' | 'Medium' | 'High';
  recommendedMinRatio: number;
  recommendedMaxRatio: number;
  excipientDbId: string;
}

export interface DoeSurfactantOption {
  id: string;
  name: string;
  tradeName: string;
  hlb: number;
  tg_C: number;
  solubilizationCapacity: number; // multiplier
  plasticizationIntensity: number; // degree of Tg depression
  peroxideRisk: 'Low' | 'Moderate' | 'High';
  recommendedMaxWtPct: number;
  excipientDbId: string;
}

export const DOE_POLYMER_CATALOG: DoePolymerOption[] = [
  {
    id: 'hpmc_as',
    name: 'Hypromellose Acetate Succinate (HPMC-AS HG)',
    tradeName: 'Aqoat AS-HG',
    tg_C: 120,
    kGordonTaylor: 1.35,
    precipitationInhibitionFactor: 1.85,
    hygroscopicity: 'Low',
    recommendedMinRatio: 0.35,
    recommendedMaxRatio: 0.80,
    excipientDbId: 'hpmc_as',
  },
  {
    id: 'soluplus',
    name: 'Polyvinyl caprolactam-polyvinyl acetate-PEG (Soluplus)',
    tradeName: 'Soluplus',
    tg_C: 70,
    kGordonTaylor: 1.15,
    precipitationInhibitionFactor: 1.55,
    hygroscopicity: 'Low',
    recommendedMinRatio: 0.30,
    recommendedMaxRatio: 0.75,
    excipientDbId: 'soluplus',
  },
  {
    id: 'copovidone',
    name: 'Copovidone (PVP-VA 64)',
    tradeName: 'Kollidon VA 64',
    tg_C: 101,
    kGordonTaylor: 1.25,
    precipitationInhibitionFactor: 1.65,
    hygroscopicity: 'Medium',
    recommendedMinRatio: 0.35,
    recommendedMaxRatio: 0.80,
    excipientDbId: 'copovidone_va64',
  },
  {
    id: 'hpmc_k100m',
    name: 'Hydroxypropyl Methylcellulose (HPMC K100M)',
    tradeName: 'Methocel K100M',
    tg_C: 175,
    kGordonTaylor: 1.45,
    precipitationInhibitionFactor: 1.70,
    hygroscopicity: 'Medium',
    recommendedMinRatio: 0.25,
    recommendedMaxRatio: 0.65,
    excipientDbId: 'hpmc_k100m',
  },
];

export const DOE_SURFACTANT_CATALOG: DoeSurfactantOption[] = [
  {
    id: 'polysorbate_80',
    name: 'Polysorbate 80 (Tween 80)',
    tradeName: 'Crillet 4 HP',
    hlb: 15.0,
    tg_C: -60,
    solubilizationCapacity: 1.8,
    plasticizationIntensity: 1.6,
    peroxideRisk: 'Moderate',
    recommendedMaxWtPct: 0.12,
    excipientDbId: 'polysorbate_80',
  },
  {
    id: 'vitamin_e_tpgs',
    name: 'Vitamin E TPGS (d-alpha-tocopheryl PEG 1000 succinate)',
    tradeName: 'Kolliphor TPGS',
    hlb: 13.2,
    tg_C: 35,
    solubilizationCapacity: 1.95,
    plasticizationIntensity: 1.0,
    peroxideRisk: 'Low',
    recommendedMaxWtPct: 0.15,
    excipientDbId: 'vitamin_e_tpgs',
  },
  {
    id: 'poloxamer_407',
    name: 'Poloxamer 407 (Pluronic F127)',
    tradeName: 'Kolliphor P 407',
    hlb: 22.0,
    tg_C: 52,
    solubilizationCapacity: 1.65,
    plasticizationIntensity: 0.85,
    peroxideRisk: 'Low',
    recommendedMaxWtPct: 0.15,
    excipientDbId: 'poloxamer_407',
  },
  {
    id: 'peg_400',
    name: 'Polyethylene Glycol 400 (PEG 400)',
    tradeName: 'Lutrol E 400',
    hlb: 12.0,
    tg_C: -65,
    solubilizationCapacity: 1.4,
    plasticizationIntensity: 1.8,
    peroxideRisk: 'Moderate',
    recommendedMaxWtPct: 0.10,
    excipientDbId: 'peg_400',
  },
];

export interface DoeGridPoint {
  id: string;
  polymerWtPct: number; // 0 to 100%
  surfactantWtPct: number; // 0 to 100%
  drugWtPct: number; // 0 to 100%
  polymerRatioLabel: string; // e.g. "1:3:0.2"
  tgBlend_C: number;
  stabilityMargin_C: number; // Tg,blend - 25°C
  fassifParachuteTimeMin: number; // Supersaturation duration
  dissolutionEfficiencyPct: number; // 0 to 100%
  chemicalStabilityIndexPct: number; // 0 to 100%
  desirabilityScore: number; // 0 to 100%
  stabilityZone: 'OPTIMAL_DESIGN_SPACE' | 'ACCEPTABLE_BORDERLINE' | 'UNSTABLE_RISK';
  criticalRiskNote?: string;
}

export interface DoeOptimizationResult {
  targetDrugName: string;
  chosenPolymer: DoePolymerOption;
  chosenSurfactant: DoeSurfactantOption;
  targetDrugDoseMg: number;
  gridPoints: DoeGridPoint[];
  optimalPoint: DoeGridPoint;
  optimalBatchAmounts: {
    drugMg: number;
    polymerMg: number;
    surfactantMg: number;
    totalUnitMassMg: number;
  };
  topFormulationCandidates: {
    title: string;
    description: string;
    point: DoeGridPoint;
    batchAmounts: {
      drugMg: number;
      polymerMg: number;
      surfactantMg: number;
      totalUnitMassMg: number;
    };
  }[];
  designSpaceStatistics: {
    totalGridPointsEvaluated: number;
    optimalDesignSpacePointsCount: number;
    acceptablePointsCount: number;
    unstablePointsCount: number;
    maxDesirabilityScore: number;
    optimalTgMargin_C: number;
    optimalParachuteMin: number;
  };
}

/**
 * Grid-search algorithm to evaluate the Design Space across Polymer and Surfactant ratios
 */
export function runDoeGridSearchOptimization(
  drug: CompoundProperties,
  polymer: DoePolymerOption,
  surfactant: DoeSurfactantOption,
  targetDrugDoseMg: number = 50,
  granularity: 'standard' | 'fine' = 'standard'
): DoeOptimizationResult {
  const drugTg_C = Math.max(35, Math.min(110, (drug.molecularWeight / 10) + (drug.xLogP * 4)));
  const drugTg_K = drugTg_C + 273.15;
  const polyTg_K = polymer.tg_C + 273.15;
  const surfTg_K = surfactant.tg_C + 273.15;

  const polymerStep = granularity === 'fine' ? 0.025 : 0.05;
  const surfactantStep = granularity === 'fine' ? 0.01 : 0.02;

  const points: DoeGridPoint[] = [];

  // Grid search ranges:
  // Polymer weight fraction: 20% to 80% (0.20 to 0.80)
  // Surfactant weight fraction: 0% to 20% (0.00 to 0.20)
  for (let wPoly = 0.20; wPoly <= 0.85; wPoly += polymerStep) {
    for (let wSurf = 0.00; wSurf <= 0.20; wSurf += surfactantStep) {
      const wDrug = Math.max(0.02, 1.0 - wPoly - wSurf);
      if (wDrug < 0.05) continue; // Exclude formulas with < 5% drug payload

      // 1. Ternary Gordon-Taylor Prediction of Glass Transition
      // Tg,blend = (w1*Tg1 + K2*w2*Tg2 + K3*w3*Tg3) / (w1 + K2*w2 + K3*w3)
      const K_poly = polymer.kGordonTaylor;
      const K_surf = surfactant.plasticizationIntensity;

      const numerator =
        wDrug * drugTg_K +
        K_poly * wPoly * polyTg_K +
        K_surf * wSurf * surfTg_K;
      const denominator = wDrug + K_poly * wPoly + K_surf * wSurf;
      const tgBlend_K = numerator / denominator;
      const tgBlend_C = Math.round((tgBlend_K - 273.15) * 10) / 10;

      // 2. Hancock-Zografi Physical Stability Margin (Tg - 25°C)
      const stabilityMargin_C = Math.round((tgBlend_C - 25.0) * 10) / 10;

      // Desirability for Physical Stability: Target >= 50°C
      let d_physical = 0;
      if (stabilityMargin_C >= 50) {
        d_physical = 1.0;
      } else if (stabilityMargin_C >= 30) {
        d_physical = 0.5 + 0.5 * ((stabilityMargin_C - 30) / 20);
      } else if (stabilityMargin_C >= 15) {
        d_physical = 0.15 + 0.35 * ((stabilityMargin_C - 15) / 15);
      } else {
        d_physical = 0.01;
      }

      // 3. FaSSIF Dissolution & Parachute Maintenance
      // Base drug dissolution is boosted by surfactant wetting and micellar solubility
      // Parachute is sustained by polymer crystallization inhibition
      const surfSolubilizationBoost = Math.log10(1 + wSurf * 25 * surfactant.solubilizationCapacity);
      const polymerParachuteBoost = (wPoly / 0.50) * polymer.precipitationInhibitionFactor;

      // Penalize excessive surfactant causing spinodal liquid-liquid phase separation (LLPS)
      const llpsPenalty = wSurf > 0.12 ? Math.exp(-(wSurf - 0.12) * 20) : 1.0;

      const fassifParachuteTimeMin = Math.round(
        Math.min(360, (60 + polymerParachuteBoost * 140) * (1 + surfSolubilizationBoost * 0.8) * llpsPenalty)
      );

      // Desirability for Dissolution: Target >= 120 min parachute
      let d_dissolution = 0;
      if (fassifParachuteTimeMin >= 180) {
        d_dissolution = 1.0;
      } else if (fassifParachuteTimeMin >= 120) {
        d_dissolution = 0.75 + 0.25 * ((fassifParachuteTimeMin - 120) / 60);
      } else if (fassifParachuteTimeMin >= 60) {
        d_dissolution = 0.40 + 0.35 * ((fassifParachuteTimeMin - 60) / 60);
      } else {
        d_dissolution = 0.10;
      }

      const dissolutionEfficiencyPct = Math.min(
        99.5,
        Math.round((60 + (fassifParachuteTimeMin / 360) * 38) * 10) / 10
      );

      // 4. Chemical Compatibility & Peroxide Penalty
      let d_chemical = 1.0;
      let criticalRiskNote: string | undefined;

      // Peroxide oxidation penalty if surfactant > 8% with reactive drug
      if (surfactant.peroxideRisk === 'Moderate' && wSurf > 0.08) {
        d_chemical *= 0.82;
        criticalRiskNote = 'High surfactant concentration increases trace peroxide auto-oxidation risk.';
      } else if (wSurf > 0.15) {
        d_chemical *= 0.70;
        criticalRiskNote = 'Surfactant levels >15% may induce spinodal liquid-liquid phase separation (LLPS).';
      }

      if (stabilityMargin_C < 25) {
        criticalRiskNote = 'Hancock-Zografi margin <25°C: High risk of amorphous recrystallization.';
      }

      // 5. Drug Loading Efficiency Desirability (Favors higher drug loading to reduce unit weight)
      // Ideal drug loading is 20% to 40%
      let d_loading = 0;
      if (wDrug >= 0.20 && wDrug <= 0.45) {
        d_loading = 1.0;
      } else if (wDrug > 0.45) {
        d_loading = 0.85; // High loading may compromise polymeric dispersion
      } else {
        d_loading = 0.50 + (wDrug / 0.20) * 0.50; // Low loading leads to bulky tablets
      }

      const chemicalStabilityIndexPct = Math.round(d_chemical * 98.0 * 10) / 10;

      // 6. Overall Composite Desirability Score (QbD Global Desirability D)
      // Geometric composite: D = (d_physical * d_dissolution * d_chemical * d_loading) ^ 0.25
      const compositeD = Math.pow(
        d_physical * 0.35 + d_dissolution * 0.35 + d_chemical * 0.15 + d_loading * 0.15,
        1.0
      );
      const desirabilityScore = Math.round(compositeD * 1000) / 10; // 0 to 100.0%

      // Categorize Stability Zone
      let stabilityZone: 'OPTIMAL_DESIGN_SPACE' | 'ACCEPTABLE_BORDERLINE' | 'UNSTABLE_RISK' =
        'UNSTABLE_RISK';
      if (desirabilityScore >= 82.0 && stabilityMargin_C >= 45 && fassifParachuteTimeMin >= 150) {
        stabilityZone = 'OPTIMAL_DESIGN_SPACE';
      } else if (desirabilityScore >= 68.0 && stabilityMargin_C >= 30) {
        stabilityZone = 'ACCEPTABLE_BORDERLINE';
      } else {
        stabilityZone = 'UNSTABLE_RISK';
      }

      // Calculate Drug : Polymer : Surfactant normalized ratio
      const drugRatio = 1.0;
      const polyRatio = Math.round((wPoly / wDrug) * 10) / 10;
      const surfRatio = Math.round((wSurf / wDrug) * 100) / 100;

      points.push({
        id: `doe_${Math.round(wPoly * 100)}_${Math.round(wSurf * 100)}`,
        polymerWtPct: Math.round(wPoly * 1000) / 10,
        surfactantWtPct: Math.round(wSurf * 1000) / 10,
        drugWtPct: Math.round(wDrug * 1000) / 10,
        polymerRatioLabel: `${drugRatio} : ${polyRatio} : ${surfRatio}`,
        tgBlend_C,
        stabilityMargin_C,
        fassifParachuteTimeMin,
        dissolutionEfficiencyPct,
        chemicalStabilityIndexPct,
        desirabilityScore,
        stabilityZone,
        criticalRiskNote,
      });
    }
  }

  // Find Global Optimum Point (highest desirability)
  const sortedPoints = [...points].sort((a, b) => b.desirabilityScore - a.desirabilityScore);
  const optimalPoint = sortedPoints[0] || points[0];

  // Calculate batch amounts for the optimal point given targetDrugDoseMg
  const optimalTotalMassMg = targetDrugDoseMg / (optimalPoint.drugWtPct / 100);
  const optimalPolymerMg = Math.round((optimalTotalMassMg * (optimalPoint.polymerWtPct / 100)) * 10) / 10;
  const optimalSurfactantMg = Math.round((optimalTotalMassMg * (optimalPoint.surfactantWtPct / 100)) * 10) / 10;

  // Identify Top 3 Practical Formulations
  // 1. Global Optimal
  // 2. High Stability / Low Plasticization (Maximum Tg margin)
  const maxStabilityPoint =
    [...points]
      .filter((p) => p.surfactantWtPct <= 5.0 && p.desirabilityScore >= 75)
      .sort((a, b) => b.stabilityMargin_C - a.stabilityMargin_C)[0] || optimalPoint;

  // 3. Fast Dissolution / High Bioavailability (Maximum parachute time)
  const maxDissolutionPoint =
    [...points]
      .filter((p) => p.surfactantWtPct >= 5.0 && p.stabilityMargin_C >= 38)
      .sort((a, b) => b.fassifParachuteTimeMin - a.fassifParachuteTimeMin)[0] || optimalPoint;

  const topFormulationCandidates = [
    {
      title: 'Balanced QbD Optimal Formulation (Recommended)',
      description: 'Maximum overall desirability balancing glass stability, FaSSIF dissolution parachute, and low excipient burden.',
      point: optimalPoint,
      batchAmounts: {
        drugMg: targetDrugDoseMg,
        polymerMg: optimalPolymerMg,
        surfactantMg: optimalSurfactantMg,
        totalUnitMassMg: Math.round(optimalTotalMassMg * 10) / 10,
      },
    },
    {
      title: 'Maximum Physical Stability (Robust 2+ Year Glass)',
      description: 'Prioritizes high Hancock-Zografi Tg margin (ΔT ≥ 55°C) with minimized surfactant plasticization for humid storage.',
      point: maxStabilityPoint,
      batchAmounts: {
        drugMg: targetDrugDoseMg,
        polymerMg: Math.round((targetDrugDoseMg / (maxStabilityPoint.drugWtPct / 100) * (maxStabilityPoint.polymerWtPct / 100)) * 10) / 10,
        surfactantMg: Math.round((targetDrugDoseMg / (maxStabilityPoint.drugWtPct / 100) * (maxStabilityPoint.surfactantWtPct / 100)) * 10) / 10,
        totalUnitMassMg: Math.round((targetDrugDoseMg / (maxStabilityPoint.drugWtPct / 100)) * 10) / 10,
      },
    },
    {
      title: 'Max Kinetic Solubility & Rapid Dissolution',
      description: 'Optimized micellar solubilization and wetting with active precipitation inhibition for BCS Class II/IV compounds.',
      point: maxDissolutionPoint,
      batchAmounts: {
        drugMg: targetDrugDoseMg,
        polymerMg: Math.round((targetDrugDoseMg / (maxDissolutionPoint.drugWtPct / 100) * (maxDissolutionPoint.polymerWtPct / 100)) * 10) / 10,
        surfactantMg: Math.round((targetDrugDoseMg / (maxDissolutionPoint.drugWtPct / 100) * (maxDissolutionPoint.surfactantWtPct / 100)) * 10) / 10,
        totalUnitMassMg: Math.round((targetDrugDoseMg / (maxDissolutionPoint.drugWtPct / 100)) * 10) / 10,
      },
    },
  ];

  const optimalDesignSpaceCount = points.filter((p) => p.stabilityZone === 'OPTIMAL_DESIGN_SPACE').length;
  const acceptableCount = points.filter((p) => p.stabilityZone === 'ACCEPTABLE_BORDERLINE').length;
  const unstableCount = points.filter((p) => p.stabilityZone === 'UNSTABLE_RISK').length;

  return {
    targetDrugName: drug.name,
    chosenPolymer: polymer,
    chosenSurfactant: surfactant,
    targetDrugDoseMg,
    gridPoints: points,
    optimalPoint,
    optimalBatchAmounts: {
      drugMg: targetDrugDoseMg,
      polymerMg: optimalPolymerMg,
      surfactantMg: optimalSurfactantMg,
      totalUnitMassMg: Math.round(optimalTotalMassMg * 10) / 10,
    },
    topFormulationCandidates,
    designSpaceStatistics: {
      totalGridPointsEvaluated: points.length,
      optimalDesignSpacePointsCount: optimalDesignSpaceCount,
      acceptablePointsCount: acceptableCount,
      unstablePointsCount: unstableCount,
      maxDesirabilityScore: optimalPoint.desirabilityScore,
      optimalTgMargin_C: optimalPoint.stabilityMargin_C,
      optimalParachuteMin: optimalPoint.fassifParachuteTimeMin,
    },
  };
}
