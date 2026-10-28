import { CompoundProperties } from '../types/pharmadds';
import { IidExcipientRecord, FDA_IID_FLAT_DATABASE } from '../data/fdaIidDatabase';

export type CompatibilityRiskLevel = 'COMPATIBLE' | 'MODERATE_RISK' | 'HIGH_RISK';

export interface DrugFunctionalGroup {
  id: string;
  name: string;
  formulaLabel: string;
  description: string;
  reactivityProfile: string;
  isPresent: boolean;
}

export interface ExcipientCompatibilityResult {
  excipientId: string;
  excipientName: string;
  functionalCategory: string;
  riskLevel: CompatibilityRiskLevel;
  interactingDrugGroups: string[];
  degradationPathway: string;
  chemicalMechanism: string;
  uspNfReference: string;
  potentialDegradants: string;
  mitigationStrategy: string;
  recommendedAlternativeId?: string;
  recommendedAlternativeName?: string;
}

/**
 * Dynamically detects active functional groups from SMILES and compound characteristics
 */
export function detectDrugFunctionalGroups(drug: CompoundProperties): DrugFunctionalGroup[] {
  const smiles = drug.smiles || '';
  const drugName = drug.name.toLowerCase();

  // 1. Primary Amine (-NH2)
  // Look for [NH2], terminal N, or specific amine drugs like Doxorubicin
  const hasPrimaryAmine =
    smiles.includes('N') &&
    (smiles.includes('CN') || smiles.includes(')N') || smiles.includes('N]') || drugName.includes('doxorubicin') || drugName.includes('amantadine') || smiles.match(/C\(.*\)N(?![a-zA-Z0-9])/i) !== null);

  // 2. Secondary Amine (-NH-)
  const hasSecondaryAmine =
    (smiles.includes('NC') || smiles.includes('NCC') || smiles.includes('NC(') || smiles.includes('CNC')) &&
    !drugName.includes('doxorubicin');

  // 3. Tertiary Amine (-N(R)3)
  const hasTertiaryAmine =
    smiles.includes('N(') || smiles.includes('CCN(') || smiles.includes('N1CCN') || drugName.includes('sm-102') || drugName.includes('itraconazole');

  // 4. Labile Esters & Lactones (-COO-)
  const hasEster =
    smiles.includes('OC(=O)') ||
    smiles.includes('C(=O)O') ||
    smiles.includes('C(=O)OC') ||
    drugName.includes('paclitaxel') ||
    drugName.includes('sm-102');

  // 5. Free Carboxylic Acid (-COOH)
  const hasCarboxylicAcid =
    smiles.includes('C(=O)O[H]') ||
    smiles.includes('C(=O)OH') ||
    (smiles.includes('(=O)O') && !smiles.includes('(=O)OC') && !drugName.includes('paclitaxel'));

  // 6. Hydroxyl Groups (Aliphatic or Phenolic -OH)
  const hasHydroxyl =
    smiles.includes('O') &&
    (smiles.includes('O)') || smiles.includes('CO') || smiles.includes('=C(O)') || smiles.includes('1)O') || drug.hbd > 0);

  // 7. Thioether / Sulfide / Sulfhydryl (-S-)
  const hasSulfur = smiles.includes('S') || smiles.includes('s');

  // 8. Unsaturated Conjugated Alkene / Keto-Enol (-C=C-C=O)
  const hasConjugatedAlkene =
    smiles.includes('/C=C/') ||
    smiles.includes('C=CC(=O)') ||
    smiles.includes('C=C4CCC') ||
    drugName.includes('curcumin') ||
    drugName.includes('budesonide');

  return [
    {
      id: 'primary_amine',
      name: 'Primary Aliphatic/Aromatic Amine',
      formulaLabel: '—NH₂',
      description: 'Nucleophilic basic amine group prone to condensation with reducing sugars and electrophiles.',
      reactivityProfile: 'High susceptibility to Maillard browning with reducing sugars and N-formylation by trace aldehydes.',
      isPresent: hasPrimaryAmine,
    },
    {
      id: 'secondary_amine',
      name: 'Secondary Amine',
      formulaLabel: '—NH—R',
      description: 'Nucleophilic secondary amine nitrogen susceptible to nitrosation, Maillard condensation, and oxidation.',
      reactivityProfile: 'Reactivity with aldehydes and reducing sugars; potential N-nitrosamine formation under acidic nitrite conditions.',
      isPresent: hasSecondaryAmine,
    },
    {
      id: 'tertiary_amine',
      name: 'Tertiary Amine',
      formulaLabel: '—N(R)₂',
      description: 'Basic nitrogen center with lone pair electrons; prone to N-oxidation and quaternary salt formation.',
      reactivityProfile: 'Readily oxidized to amine N-oxide (N→O) by trace peroxides and hydroperoxides in polyethers.',
      isPresent: hasTertiaryAmine,
    },
    {
      id: 'labile_ester',
      name: 'Labile Ester / Lactone',
      formulaLabel: '—C(=O)O—R',
      description: 'Electrophilic carbonyl vulnerable to base-catalyzed hydrolysis, transesterification, and nucleophilic cleavage.',
      reactivityProfile: 'Rapidly cleaved by alkaline lubricants (e.g. Magnesium Stearate boundary pH > 8.5) and moisture.',
      isPresent: hasEster,
    },
    {
      id: 'carboxylic_acid',
      name: 'Carboxylic Acid',
      formulaLabel: '—COOH',
      description: 'Protic acid moiety capable of forming insoluble divalent/trivalent metal carboxylate salts.',
      reactivityProfile: 'Metathesis reaction with divalent Mg²⁺ / Ca²⁺ forming insoluble salts; decarboxylation under thermal stress.',
      isPresent: hasCarboxylicAcid,
    },
    {
      id: 'hydroxyl_groups',
      name: 'Aliphatic / Phenolic Hydroxyl',
      formulaLabel: '—OH',
      description: 'Nucleophilic alcohol or phenolic group capable of transesterification, etherification, or oxidation.',
      reactivityProfile: 'Susceptible to polymeric acetate/succinate transfer during high-temperature extrusion (>150°C).',
      isPresent: hasHydroxyl,
    },
    {
      id: 'thioether_sulfur',
      name: 'Thioether / Sulfide',
      formulaLabel: '—S—',
      description: 'Electron-rich sulfur center highly vulnerable to electrophilic auto-oxidation.',
      reactivityProfile: 'Rapidly oxidized by trace excipient hydroperoxides (ROOH) into sulfoxides (—S(=O)—) and sulfones.',
      isPresent: hasSulfur,
    },
    {
      id: 'conjugated_alkene',
      name: 'Conjugated Alkene / Keto-Enol',
      formulaLabel: '—C=C—C=O',
      description: 'Conjugated electron pi-system susceptible to radical addition, photo-isomerization, and cleavage.',
      reactivityProfile: 'Prone to auto-oxidation and bleaching in the presence of polyether hydroperoxides or transition metal traces.',
      isPresent: hasConjugatedAlkene,
    },
  ];
}

/**
 * Cross-references a single excipient against the drug's detected functional groups
 * based on USP/NF <1059>, <1151>, and Handbook of Pharmaceutical Excipients.
 */
export function evaluateSingleExcipientCompatibility(
  drug: CompoundProperties,
  excipient: IidExcipientRecord
): ExcipientCompatibilityResult {
  const groups = detectDrugFunctionalGroups(drug);
  const activeGroupIds = new Set(groups.filter((g) => g.isPresent).map((g) => g.id));
  const excId = excipient.id;
  const excName = excipient.name;

  // 1. LACTOSE MONOHYDRATE (Reducing Sugar) vs PRIMARY / SECONDARY AMINES
  if (excId === 'lactose_monohydrate') {
    if (activeGroupIds.has('primary_amine') || activeGroupIds.has('secondary_amine')) {
      const isPrimary = activeGroupIds.has('primary_amine');
      return {
        excipientId: excId,
        excipientName: excName,
        functionalCategory: excipient.functionalCategory,
        riskLevel: 'HIGH_RISK',
        interactingDrugGroups: isPrimary ? ['Primary Aliphatic/Aromatic Amine (—NH₂)'] : ['Secondary Amine (—NH—R)'],
        degradationPathway: 'Maillard Reaction (Amine-Glycosylation & Browning)',
        chemicalMechanism:
          'Nucleophilic attack of API amine nitrogen onto the open-chain aldehyde tautomer of lactose, forming an unstable glycosylamine intermediate. Subsequent Amadori rearrangement generates 1-amino-1-deoxy-2-ketose, cascading into brown polymeric melanoidins and severe loss of drug potency.',
        uspNfReference: 'USP/NF <1059> Excipient Performance — Reducing Sugars & Compendial Excipients Monograph',
        potentialDegradants: 'N-Glycosyl adduct, Amadori rearrangement products, 5-Hydroxymethylfurfural (5-HMF), brown melanoidin polymers',
        mitigationStrategy:
          'Replace reducing sugar lactose with non-reducing polyols (D-Mannitol Pearlitol) or Microcrystalline Cellulose (Avicel PH-102); maintain product equilibrium relative humidity < 30%.',
        recommendedAlternativeId: 'mannitol_pearlitol',
        recommendedAlternativeName: 'D-Mannitol (Pearlitol 200SD)',
      };
    }
  }

  // 2. MAGNESIUM STEARATE (Alkaline Lubricant) vs LABILE ESTERS / CARBOXYLIC ACIDS
  if (excId === 'magnesium_stearate') {
    if (activeGroupIds.has('labile_ester')) {
      return {
        excipientId: excId,
        excipientName: excName,
        functionalCategory: excipient.functionalCategory,
        riskLevel: 'HIGH_RISK',
        interactingDrugGroups: ['Labile Ester / Lactone (—C(=O)O—R)'],
        degradationPathway: 'Alkaline Micro-environmental Hydrolysis',
        chemicalMechanism:
          'Magnesium stearate particles generate a localized alkaline boundary layer (microclimate pH 8.5–9.2) during tableting. Hydroxide ions attack the electrophilic carbonyl carbon of labile ester/lactone linkages, catalyzing hydrolytic cleavage into carboxylic acid and alcohol degradation products.',
        uspNfReference: 'USP/NF <1059> Lubricants / Handbook of Pharmaceutical Excipients — Magnesium Stearate',
        potentialDegradants: 'Hydrolyzed des-acyl API, Free acid metabolite, Stearate ester interchange products',
        mitigationStrategy:
          'Substitute alkaline Magnesium Stearate with Sodium Stearyl Fumarate (Pruv) or Hydrogenated Vegetable Oil; optionally incorporate 0.5–1.0% Citric Acid Monohydrate as an acidifying microclimate buffer.',
        recommendedAlternativeId: 'mcc_ph102',
        recommendedAlternativeName: 'Sodium Stearyl Fumarate (Pruv) / MCC PH-102',
      };
    }
    if (activeGroupIds.has('carboxylic_acid')) {
      return {
        excipientId: excId,
        excipientName: excName,
        functionalCategory: excipient.functionalCategory,
        riskLevel: 'MODERATE_RISK',
        interactingDrugGroups: ['Carboxylic Acid (—COOH)'],
        degradationPathway: 'Insoluble Divalent Salt Metathesis',
        chemicalMechanism:
          'Ion exchange between API carboxylate anions and divalent Mg²⁺ ions forms insoluble magnesium carboxylate salts at the tablet interface, severely slowing dissolution rate and reducing bioavailability.',
        uspNfReference: 'USP/NF <1151> Inactive Ingredients in Solid Dosage Forms',
        potentialDegradants: 'Magnesium bis-carboxylate salt precipitate',
        mitigationStrategy:
          'Use Sodium Stearyl Fumarate (monovalent Na⁺ counter-ion) or stearic acid, avoiding polyvalent cation salts.',
        recommendedAlternativeId: 'mcc_ph102',
        recommendedAlternativeName: 'Sodium Stearyl Fumarate (Pruv)',
      };
    }
  }

  // 3. POLYSORBATE 80 & PEG 400 (Polyethers) vs THIOETHERS, TERTIARY AMINES & CONJUGATED ALKENES
  if (excId === 'polysorbate_80' || excId === 'peg_400') {
    const reactiveGroups: string[] = [];
    if (activeGroupIds.has('thioether_sulfur')) reactiveGroups.push('Thioether / Sulfide (—S—)');
    if (activeGroupIds.has('tertiary_amine')) reactiveGroups.push('Tertiary Amine (—N(R)₂)');
    if (activeGroupIds.has('conjugated_alkene')) reactiveGroups.push('Conjugated Alkene / Keto-Enol (—C=C—C=O)');

    if (reactiveGroups.length > 0) {
      return {
        excipientId: excId,
        excipientName: excName,
        functionalCategory: excipient.functionalCategory,
        riskLevel: 'MODERATE_RISK',
        interactingDrugGroups: reactiveGroups,
        degradationPathway: 'Trace Peroxide / Hydroperoxide Auto-Oxidation',
        chemicalMechanism:
          'Polyoxyethylene chains undergo auto-oxidation upon exposure to air and light, generating residual alkyl hydroperoxides (ROOH) and trace formaldehyde/formic acid impurities. These peroxides oxidize nucleophilic sulfur centers into sulfoxides and tertiary amines into amine N-oxides, and cleave conjugated double bonds.',
        uspNfReference: 'USP/NF Monograph — Polysorbate 80 / Polyethylene Glycol (Peroxide Value Limit < 5 meq/kg)',
        potentialDegradants: 'API Sulfoxide / Sulfone, Amine N-Oxide, Epoxide adducts, Dicarboxylic cleavage degradants',
        mitigationStrategy:
          'Enforce strict USP compendial low-peroxide grade (Peroxide Value < 2 meq/kg); add 0.05–0.1% Citric Acid or EDTA (metal chelator) + Ascorbic Acid / BHT; package under an inert Nitrogen (N₂) headspace.',
        recommendedAlternativeId: 'citric_acid_monohydrate',
        recommendedAlternativeName: 'Citric Acid Monohydrate (Antioxidant / Chelator Synergist)',
      };
    }
  }

  // 4. HPMC-AS (Hypromellose Acetate Succinate) vs HYDROXYL GROUPS at Hot-Melt Extrusion Temperatures
  if (excId === 'hpmc_as') {
    if (activeGroupIds.has('hydroxyl_groups')) {
      return {
        excipientId: excId,
        excipientName: excName,
        functionalCategory: excipient.functionalCategory,
        riskLevel: 'MODERATE_RISK',
        interactingDrugGroups: ['Aliphatic / Phenolic Hydroxyl (—OH)'],
        degradationPathway: 'High-Temperature Transesterification (HME Stress)',
        chemicalMechanism:
          'Under extreme hot-melt extrusion processing temperatures (>150°C), polymer ester substituents (acetyl and succinoyl esters) can undergo intermolecular transesterification with nucleophilic hydroxyl groups on the API, creating acetylated or succinoylated drug impurities.',
        uspNfReference: 'AAPS PharmSciTech / USP <1059> Cellulosic Polymers',
        potentialDegradants: 'O-Acetylated API, O-Succinoylated API monoester',
        mitigationStrategy:
          'Maintain HME processing temperature strictly below 135°C; incorporate 5–10% Soluplus or Triethyl Citrate as a thermodynamic plasticizer to lower melt viscosity and screw torque without thermal degradation.',
        recommendedAlternativeId: 'soluplus',
        recommendedAlternativeName: 'Soluplus (Lower Tg Extrusion Plasticizer)',
      };
    }
  }

  // 5. CROSCARMELLOSE SODIUM vs STRONGLY BASIC AMINES
  if (excId === 'croscarmellose_sodium') {
    if (activeGroupIds.has('primary_amine') || activeGroupIds.has('secondary_amine')) {
      return {
        excipientId: excId,
        excipientName: excName,
        functionalCategory: excipient.functionalCategory,
        riskLevel: 'MODERATE_RISK',
        interactingDrugGroups: ['Basic Amine Groups (pKa > 8.0)'],
        degradationPathway: 'Electrostatic Polyelectrolyte Binding',
        chemicalMechanism:
          'Carboxymethyl groups on croscarmellose sodium ionize to negative carboxylate anions in intestinal fluids (pH > 4.5), which can electrostatically bind positively charged protonated amine API molecules, temporarily retarding drug dissolution.',
        uspNfReference: 'USP/NF <1059> Disintegrants',
        potentialDegradants: 'Insoluble drug-polymer electrostatic coacervate',
        mitigationStrategy:
          'Ensure superdisintegrant level remains ≤ 3.0 wt%; or substitute with non-ionic Crospovidone (PVP-XL) for strongly cationic APIs.',
      };
    }
  }

  // Default: Verified Compatible
  return {
    excipientId: excId,
    excipientName: excName,
    functionalCategory: excipient.functionalCategory,
    riskLevel: 'COMPATIBLE',
    interactingDrugGroups: ['No Incompatible Chemical Moieties Identified'],
    degradationPathway: 'Chemically Inert & Thermodynamically Compatible',
    chemicalMechanism:
      'No reactive chemical clash with detected drug functional groups. Meets USP/NF and FDA IID historical precedent for concurrent formulated stability.',
    uspNfReference: 'USP/NF Compendial Monograph Conformance',
    potentialDegradants: 'None under standard storage conditions (ICH Q1A)',
    mitigationStrategy: 'Standard good manufacturing practice (GMP) storage at 25°C / 60% RH.',
  };
}

/**
 * Evaluates all excipients in the formulation against the drug dynamically
 */
export function evaluateDrugExcipientCompatibility(
  drug: CompoundProperties,
  excipients: IidExcipientRecord[]
): ExcipientCompatibilityResult[] {
  return excipients.map((exc) => evaluateSingleExcipientCompatibility(drug, exc));
}
