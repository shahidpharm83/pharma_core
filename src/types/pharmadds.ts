export interface SafetyData {
  source: string;
  signalWord: 'Danger' | 'Warning' | 'Caution' | 'Information' | string;
  hazardStatements: string[];
  pictograms: Array<{ code: string; name: string }>;
  firstAidMeasures: {
    inhalation: string;
    skinContact: string;
    eyeContact: string;
    ingestion: string;
  };
  handlingStorage: string;
}

export interface CompoundProperties {
  cid: number;
  name: string;
  category: 'Targeted Nano' | 'Amorphous Solid Dispersion' | 'Inhalation DPI/MDI' | 'Biologic LNP';
  bcsClass: 'BCS I' | 'BCS II' | 'BCS III' | 'BCS IV';
  molecularWeight: number;
  xLogP: number;
  tpsa: number;
  hbd: number;
  hba: number;
  rotatableBonds: number;
  smiles: string;
  indication: string;
  targetReceptor: string;
  defaultSystem: string;
  bioavailabilityOralBaseline: number;
  bioavailabilityTargetedExpected: number;
  toxicityMTC_mgL: number;
  effectiveMEC_mgL: number;
  description: string;
  bengaliSummary: string;
  safetyData?: SafetyData;
}

export interface PubChemDetailResponse {
  properties: {
    CID: number;
    Title: string;
    MolecularFormula: string;
    MolecularWeight: string | number;
    CanonicalSMILES: string;
    InChIKey: string;
    XLogP: number;
    TPSA: number;
    HBondDonorCount: number;
    HBondAcceptorCount: number;
    RotatableBondCount: number;
    Complexity: number;
  };
  bcsClass: 'BCS I' | 'BCS II' | 'BCS III' | 'BCS IV';
  lipinski: {
    violations: number;
    pass: boolean;
    mwPass: boolean;
    logPPass: boolean;
    hbdPass: boolean;
    hbaPass: boolean;
  };
  veber: {
    pass: boolean;
    rotatablePass: boolean;
    tpsaPass: boolean;
  };
  imageUrl: string;
  benchmark: CompoundProperties | null;
  safetyData?: SafetyData;
}

export type DeliverySystemType = 'nanoparticle' | 'amorphous' | 'inhalation';

export interface NanoparticleState {
  lipidType: string;
  particleDiameter_nm: number;
  pegFraction_pct: number;
  ligandTargetDensity: number;
  coreMaterial: string;
  targetingLigand: string;
}

export interface AmorphousState {
  polymerType: string;
  polymerTg_C: number;
  drugTg_C: number;
  drugWeightFraction: number;
  storageTemp_C: number;
}

export interface InhalationState {
  deviceType: 'DPI' | 'MDI';
  flowRate_Lmin: number;
  mmad_um: number;
  gsd: number;
  fineLactoseRatio: number;
  propellantType: string;
}

export interface SimulationResult {
  systemType: DeliverySystemType;
  nanoparticleMetrics: {
    diameter_nm: number;
    pdi: number;
    zetaPotential_mV: number;
    encapsulationEfficiency_pct: number;
    colloidalState: string;
  };
  amorphousMetrics: {
    polymer: string;
    drugWeightFraction: number;
    tg_drug_C: number;
    tg_polymer_C: number;
    predictedTg_blend_C: number;
    stabilityMargin_C: number;
    recrystallizationRisk: string;
    supersaturationFold: number;
  };
  inhalationMetrics: {
    deviceType: string;
    propellant: string;
    mmad_um: number;
    gsd: number;
    fpf_pct: number;
    throatDeposition_pct: number;
    deepLungDeposition_pct: number;
    ngiStages: Array<{
      stage: string;
      cutOff_um: string;
      fraction_pct: number;
    }>;
  };
  pharmacokinetics: {
    timeHours: number[];
    conventionalPlasma: number[];
    conventionalTarget: number[];
    targetedPlasma: number[];
    targetedTarget: number[];
    thresholds: {
      mtc: number;
      mec: number;
    };
    kpis: {
      conventionalCmax: number;
      targetedCmax: number;
      conventionalAUC: number;
      targetedAUC: number;
      bioavailabilityBoostFactor: string;
      toxicityReductionPct: string;
      therapeuticTargetIndex: number;
    };
  };
}
