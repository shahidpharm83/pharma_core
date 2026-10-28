export interface GlossaryItem {
  id: string;
  term: string;
  shortName: string;
  category: 'Nanotechnology' | 'Amorphous Solid Dispersion' | 'Inhalation Aerosols' | 'PK/PD & Biopharmaceutics' | 'Pre-Formulation & QbD';
  measurementMethod: string;
  targetCriteria: string;
  definitionEn: string;
  definitionBn: string; // Stored as English technical summary
  labSignificanceBn: string; // Stored as English lab & R&D significance
  formula?: string;
}

export const SCIENTIFIC_GLOSSARY: Record<string, GlossaryItem> = {
  epr_effect: {
    id: 'epr_effect',
    term: 'Enhanced Permeability and Retention (EPR) Effect',
    shortName: 'EPR Effect',
    category: 'Nanotechnology',
    measurementMethod: 'In-vivo fluorescence bioimaging (IVIS) / Radiolabeled biodistribution',
    targetCriteria: 'Tumor-to-normal tissue accumulation ratio > 3.0',
    definitionEn: 'A physiological phenomenon where nanocarriers (typically 40–150 nm) selectively accumulate in tumor tissues due to hyperpermeable tumor vasculature (fenestrated capillaries) and defective lymphatic drainage.',
    definitionBn: 'Tumor neovasculature exhibits hyperpermeable fenestrations and defective lymphatic drainage. Consequently, nanoscale carriers (70–120 nm) extravasate into tumor interstitium and remain sequestered for extended periods.',
    labSignificanceBn: 'Keeping nanocarrier size within 70–120 nm prevents rapid renal clearance while enabling preferential tumor accumulation via the EPR effect.'
  },
  dls: {
    id: 'dls',
    term: 'Dynamic Light Scattering (DLS)',
    shortName: 'DLS (Particle Size)',
    category: 'Nanotechnology',
    measurementMethod: 'Malvern Zetasizer / Photocorrelation Spectroscopy at 25°C & 173° backscatter',
    targetCriteria: 'Hydrodynamic diameter (Dh): 60 – 120 nm (LNPs/Liposomes)',
    definitionEn: 'An analytical technique that measures the Brownian motion of nanoparticles in suspension to calculate their hydrodynamic diameter (Dh) via the Stokes-Einstein equation.',
    definitionBn: 'Laser light is scattered by colloidal nanoparticles undergoing Brownian motion. Intensity fluctuation analysis yields the hydrodynamic diameter distribution.',
    labSignificanceBn: 'Particle sizes >200 nm risk complement activation and rapid blood clearance, whereas sizes <10 nm undergo fast renal filtration. Precise DLS sizing is critical.',
    formula: 'Dh = (k_B · T) / (3 · π · η · D)'
  },
  pdi: {
    id: 'pdi',
    term: 'Polydispersity Index (PDI)',
    shortName: 'PDI',
    category: 'Nanotechnology',
    measurementMethod: 'Cumulants analysis from Dynamic Light Scattering (ISO 22412)',
    targetCriteria: 'PDI < 0.20 (Monodisperse pharmaceutical standard for lipid nanoparticles)',
    definitionEn: 'A dimensionless parameter describing the width of a molecular or particle size distribution. Values below 0.2 indicate a narrow, monodisperse population suitable for pharmaceutical injection.',
    definitionBn: 'A measure of particle size uniformity within colloidal dispersion. A PDI below 0.2 confirms a monodisperse, uniform population ideal for intravenous or subcutaneous injection.',
    labSignificanceBn: 'A PDI >0.25 indicates broad polydispersity that can cause unpredictable burst release profiles and capillary embolism risks.'
  },
  zeta_potential: {
    id: 'zeta_potential',
    term: 'Zeta Potential (Electrokinetic Potential, ζ)',
    shortName: 'Zeta Potential (ζ)',
    category: 'Nanotechnology',
    measurementMethod: 'Laser Doppler Electrophoresis (Phase Analysis Light Scattering - M3-PALS)',
    targetCriteria: '|ζ| > ±30 mV for electrostatic stability, or -5 to +5 mV for PEGylated stealth corona',
    definitionEn: 'The electrical potential at the slipping plane of a colloidal particle moving under an electric field. Indicates physical colloidal stability against flocculation or aggregation.',
    definitionBn: 'The net electrostatic charge at the shear plane of suspended nanoparticles. High magnitude charges (|ζ| > 30 mV) prevent particle flocculation via interparticulate electrostatic repulsion.',
    labSignificanceBn: 'PEGylated stealth liposomes utilize steric shielding yielding near-neutral zeta potential (-5 to +5 mV) to evade opsonization by plasma proteins.'
  },
  encapsulation_efficiency: {
    id: 'encapsulation_efficiency',
    term: 'Encapsulation Efficiency (%EE)',
    shortName: '%EE',
    category: 'Nanotechnology',
    measurementMethod: 'Centrifugal Ultrafiltration (Amicon 100 kDa) followed by RP-HPLC / UV assay',
    targetCriteria: '%EE ≥ 85.0% for small molecules, ≥ 90.0% for mRNA/siRNA LNPs',
    definitionEn: 'The percentage of active drug successfully entrapped within the nanocarrier matrix relative to the total initial drug added.',
    definitionBn: 'The proportion of active payload successfully entrapped inside the nanocarrier core relative to total drug input during formulation assembly.',
    labSignificanceBn: 'Low encapsulation efficiency results in high unencapsulated free drug leading to acute systemic toxicity. High %EE ensures robust drug delivery.',
    formula: '%EE = [(Total Drug - Free Unencapsulated Drug) / Total Drug] × 100'
  },
  gordon_taylor: {
    id: 'gordon_taylor',
    term: 'Gordon-Taylor Equation (ASD Glass Transition)',
    shortName: 'Gordon-Taylor (Tg)',
    category: 'Amorphous Solid Dispersion',
    measurementMethod: 'Modulated Differential Scanning Calorimetry (mDSC) at 2°C/min',
    targetCriteria: 'Stability Margin (Tg,blend - T_storage) ≥ 50°C (prevents 2-year recrystallization)',
    definitionEn: 'A semi-empirical thermodynamic equation used to predict the glass transition temperature (Tg) of binary amorphous mixtures (drug and polymer) based on weight fractions and pure component Tg values.',
    definitionBn: 'A thermodynamic equation predicting the glass transition temperature (Tg) of binary drug-polymer amorphous blends based on respective weight fractions and pure component glass transitions.',
    labSignificanceBn: 'Maintaining a blend Tg at least 50°C above storage temperature ensures molecular mobility remains frozen, preventing recrystallization over shelf-life.',
    formula: 'Tg,blend = (w1·Tg1 + K·w2·Tg2) / (w1 + K·w2)'
  },
  spring_and_parachute: {
    id: 'spring_and_parachute',
    term: 'Spring and Parachute Dissolution Phenomenon',
    shortName: 'Spring & Parachute',
    category: 'Amorphous Solid Dispersion',
    measurementMethod: 'USP Apparatus II (Paddle) at 37°C in FaSSIF/FeSSIF biorelevant media with in-situ UV probe',
    targetCriteria: 'Supersaturation maintenance for ≥ 120 minutes without precipitation',
    definitionEn: 'A classical model for amorphous solubility: the amorphous state rapidly dissolves into a high-energy supersaturated solution ("spring"), while the stabilizing polymer inhibits crystal nucleation and growth, maintaining solubility ("parachute").',
    definitionBn: 'Amorphous APIs generate a high-energy supersaturated solution ("spring"), while hydrophilic polymers (HPMC-AS, Copovidone) inhibit crystal nucleation and maintain supersaturation ("parachute").',
    labSignificanceBn: 'The parachute effect prevents premature precipitation in the gastrointestinal tract, ensuring high mucosal concentration and absorption.'
  },
  bcs_classification: {
    id: 'bcs_classification',
    term: 'Biopharmaceutics Classification System (BCS)',
    shortName: 'BCS Class',
    category: 'PK/PD & Biopharmaceutics',
    measurementMethod: 'USP Equilibrium Solubility (shake-flask) & Caco-2 / PAMPA cellular permeability assay',
    targetCriteria: 'BCS Class I (High Sol, High Perm), Class II (Low Sol, High Perm), Class III (High Sol, Low Perm), Class IV (Low Sol, Low Perm)',
    definitionEn: 'A scientific framework for classifying drug substances based on their aqueous solubility across pH 1.2–6.8 and intestinal mucosal permeability.',
    definitionBn: 'A regulatory classification system categorizing drugs based on aqueous solubility and intestinal permeability across physiological pH ranges.',
    labSignificanceBn: 'BCS Class II and IV drugs require advanced formulation technologies (nanoparticles, amorphous dispersions) to overcome solubility-limited absorption.'
  },
  mmad: {
    id: 'mmad',
    term: 'Mass Median Aerodynamic Diameter (MMAD)',
    shortName: 'MMAD (Aerosols)',
    category: 'Inhalation Aerosols',
    measurementMethod: 'Next Generation Impactor (NGI) / Andersen Cascade Impactor (USP <601>)',
    targetCriteria: '1.0 µm ≤ MMAD ≤ 5.0 µm (optimum 2.0 – 3.0 µm for deep pulmonary bronchioles)',
    definitionEn: 'The diameter of a sphere of unit density (1 g/cm³) that has the same settling velocity in air as the aerosol particle in question; 50% of the aerosol mass is contained in particles with a diameter smaller than the MMAD.',
    definitionBn: 'The aerodynamic diameter at which 50% of the aerosol mass is carried in larger particles and 50% in smaller particles. Essential for evaluating inhalation deposition.',
    labSignificanceBn: 'MMAD >5 µm causes upper respiratory impaction in the throat, while MMAD <1 µm is exhaled without deposition. Optimum pulmonary delivery requires 1–5 µm.'
  },
  fpf: {
    id: 'fpf',
    term: 'Fine Particle Fraction (FPF < 5 µm)',
    shortName: 'FPF (< 5 µm)',
    category: 'Inhalation Aerosols',
    measurementMethod: 'Cumulative mass recovery on NGI stages with cut-offs < 5.0 µm at calibrated flow rate',
    targetCriteria: 'FPF ≥ 50.0% of nominal emitted dose for high-efficiency DPI/pMDI',
    definitionEn: 'The fraction of the emitted aerosol dose consisting of particles with aerodynamic diameters smaller than 5.0 µm, which represents the respirable fraction capable of lung penetration.',
    definitionBn: 'The percentage of emitted aerosol mass contained in particles <5 µm capable of reaching deep lower airways.',
    labSignificanceBn: 'High FPF (≥50%) ensures efficient lung delivery and therapeutic efficacy at lower metered doses.'
  },
  mtc_mec: {
    id: 'mtc_mec',
    term: 'Minimum Toxic Concentration (MTC) & Minimum Effective Concentration (MEC)',
    shortName: 'Therapeutic Window (MTC/MEC)',
    category: 'PK/PD & Biopharmaceutics',
    measurementMethod: 'LC-MS/MS bioanalytical quantification of clinical/preclinical plasma samples',
    targetCriteria: 'Plasma concentration maintained strictly between MEC and MTC (Therapeutic Index TI > 2.0)',
    definitionEn: 'The therapeutic window bounded at the lower limit by the Minimum Effective Concentration (MEC) needed for clinical cure, and at the upper limit by the Minimum Toxic Concentration (MTC) above which adverse drug reactions occur.',
    definitionBn: 'The safety and efficacy boundaries in plasma pharmacokinetic profiles. Drug concentrations must stay above MEC for therapeutic action and below MTC to prevent toxicity.',
    labSignificanceBn: 'Advanced drug delivery systems maintain plasma drug levels within this therapeutic window for prolonged durations, reducing dosing frequency.'
  },
  cqa_cpp: {
    id: 'cqa_cpp',
    term: 'Critical Quality Attributes (CQA) & Critical Process Parameters (CPP)',
    shortName: 'QbD (CQA / CPP)',
    category: 'Pre-Formulation & QbD',
    measurementMethod: 'Design of Experiments (DoE) & Risk Assessment Matrix (ICH Q8 R2)',
    targetCriteria: 'Process capability index Cpk > 1.33 for all CQAs across GMP manufacturing batches',
    definitionEn: 'A Quality by Design (QbD) regulatory principle: CQAs are physical, chemical, or biological properties that must remain within defined limits to ensure product quality; CPPs are process variables whose variability impacts CQAs.',
    definitionBn: 'Quality by Design (QbD) framework connecting critical product quality attributes (CQAs) to manufacturing process parameters (CPPs).',
    labSignificanceBn: 'Adhering to QbD principles ensures robust manufacturing reproducibility and accelerates regulatory agency approval.'
  },
  gsd: {
    id: 'gsd',
    term: 'Geometric Standard Deviation (GSD)',
    shortName: 'GSD (Polydispersity of Aerosols)',
    category: 'Inhalation Aerosols',
    measurementMethod: 'Cascade impactor log-probability linear regression analysis (USP <601>)',
    targetCriteria: '1.2 ≤ GSD ≤ 2.0 (GSD < 1.2 is considered monodisperse aerosol)',
    definitionEn: 'A measure of the spread or dispersion of an aerosol particle size distribution, calculated as the square root of the ratio of particle diameter at 84.13% cumulative mass to that at 15.87% (or d50/d16).',
    definitionBn: 'A dimensionless metric quantifying the aerosol particle size distribution spread. Values between 1.2 and 2.0 indicate acceptable monodisperse aerosol behavior.',
    labSignificanceBn: 'A controlled GSD ensures uniform regional deposition across bronchial and alveolar airways.',
    formula: 'GSD = (d_84.13% / d_15.87%)^0.5 = d_50% / d_15.87%'
  },
  fpd_rdf: {
    id: 'fpd_rdf',
    term: 'Fine Particle Dose (FPD) & Respirable Dose Fraction (RDF)',
    shortName: 'FPD & RDF',
    category: 'Inhalation Aerosols',
    measurementMethod: 'Sum of mass collected on NGI stages with cut-off aerodynamic diameter < 5.0 µm',
    targetCriteria: 'FPD ≥ 40% of nominal label claim dose, RDF ≥ 60% of emitted dose',
    definitionEn: 'FPD is the mass of drug (in µg) emitted from the inhaler contained in particles < 5.0 µm aerodynamic diameter. RDF is the respirable fraction delivered to pulmonary airways relative to nominal metered dose.',
    definitionBn: 'Fine Particle Dose (FPD) is the absolute mass of respirable particles (<5 µm), while Respirable Dose Fraction (RDF) is its ratio relative to emitted dose.',
    labSignificanceBn: 'High FPD ensures rapid local bronchodilation or pulmonary drug absorption.'
  },
  hsp: {
    id: 'hsp',
    term: 'Hansen Solubility Parameters (HSP: δD, δP, δH)',
    shortName: 'HSP (Miscibility)',
    category: 'Amorphous Solid Dispersion',
    measurementMethod: 'Inverse Gas Chromatography (IGC) / Hansen sphere group contribution modeling',
    targetCriteria: 'Hansen 3D distance Ra < 7.0 MPa^0.5 indicating favorable thermodynamic drug-polymer miscibility',
    definitionEn: 'A 3-dimensional solubility parameter system decomposing cohesive energy density into dispersion (δD), dipolar intermolecular forces (δP), and hydrogen bonding (δH) components.',
    definitionBn: 'Thermodynamic parameters breaking intermolecular forces into dispersion (δD), polarity (δP), and hydrogen bonding (δH) vectors to predict drug-polymer miscibility.',
    labSignificanceBn: 'Hansen parameter matching guides the selection of optimal polymeric carriers to prevent phase separation and recrystallization.',
    formula: 'Ra = [4·(δD1 - δD2)² + (δP1 - δP2)² + (δH1 - δH2)²]^0.5'
  },
  red_index: {
    id: 'red_index',
    term: 'Relative Energy Difference (RED Index)',
    shortName: 'RED Index',
    category: 'Amorphous Solid Dispersion',
    measurementMethod: 'Ratio of Hansen distance Ra to polymer interaction sphere radius R0',
    targetCriteria: 'RED < 1.0 (Thermodynamic miscibility), 1.0 ≤ RED ≤ 1.8 (Boundary/Metastable), RED > 1.8 (Immiscible)',
    definitionEn: 'Dimensionless index assessing drug-polymer miscibility. RED < 1.0 indicates the drug lies inside the polymer solubility sphere (miscible solid solution); RED > 1 indicates immiscibility.',
    definitionBn: 'A ratio of Hansen distance Ra to polymer interaction radius R0. RED < 1.0 guarantees true thermodynamic solid solution miscibility.',
    labSignificanceBn: 'Screening RED values in pre-formulation eliminates incompatible polymers before costly wet granulation or extrusion trials.'
  },
  henry_equation: {
    id: 'henry_equation',
    term: "Henry's Equation & Electrophoretic Mobility",
    shortName: "Henry's Eq (Zeta)",
    category: 'Nanotechnology',
    measurementMethod: 'Laser Doppler Electrophoresis / Phase Analysis Light Scattering (PALS)',
    targetCriteria: 'Smoluchowski f(κa) = 1.5 in aqueous buffers; Hückel f(κa) = 1.0 in apolar media',
    definitionEn: "Relates the electrophoretic mobility (UE) of a colloidal particle under an electric field to its surface Zeta Potential (ζ) through medium dielectric constant, viscosity, and Henry's function f(κa).",
    definitionBn: 'Mathematical correlation linking electrophoretic mobility under an applied electric field to surface zeta potential using Henry function f(κa).',
    labSignificanceBn: 'Enables accurate quantification of nanoparticle surface charge across diverse aqueous buffer ionic strengths.',
    formula: 'UE = (2 · ε · ζ · f(κa)) / (3 · η)'
  },
  drug_loading: {
    id: 'drug_loading',
    term: 'Drug Loading Capacity (%DL)',
    shortName: '%DL',
    category: 'Nanotechnology',
    measurementMethod: 'Lyophilized nanoparticle mass quantification via RP-HPLC against standard curve',
    targetCriteria: '%DL ≥ 5.0% for polymeric nanoparticles, ≥ 10.0% for lipid nanoparticles',
    definitionEn: 'The mass percentage of active pharmaceutical ingredient contained within the total mass of the recovered dried nanoparticles (drug mass + excipient matrix mass).',
    definitionBn: 'The mass percentage of active drug encapsulated relative to total nanoparticle weight (drug + excipient matrix).',
    labSignificanceBn: 'High drug loading reduces the total excipient burden administered to patients during clinical dosing.',
    formula: '%DL = [Mass of Entrapped Drug / Total Nanoparticle Mass] × 100'
  },
  hancock_zografi: {
    id: 'hancock_zografi',
    term: 'Hancock-Zografi 50°C Physical Stability Rule',
    shortName: '50°C Stability Rule',
    category: 'Amorphous Solid Dispersion',
    measurementMethod: 'Modulated DSC (Tg determination) and WLF / Adam-Gibbs molecular relaxation kinetics',
    targetCriteria: 'Tg,blend - T_storage ≥ 50°C for >2 years shelf-life at room temperature',
    definitionEn: 'The Hancock-Zografi guideline dictates that an amorphous pharmaceutical glass must be stored at least 50°C below its glass transition temperature (Tg - T_storage ≥ 50°C) to maintain molecular mobility relaxation time τ > 10^7 seconds and prevent recrystallization.',
    definitionBn: 'Pharmaceutical guideline requiring amorphous glass transition temperature (Tg) to exceed storage temperature by at least 50°C to prevent physical aging.',
    labSignificanceBn: 'Ensures long-term amorphous stability and prevents premature recrystallization during extended room temperature storage.',
    formula: 'ΔT = Tg,wet - T_storage ≥ 50°C'
  },
  fda_iid: {
    id: 'fda_iid',
    term: 'FDA Inactive Ingredient Database (IID) Limits',
    shortName: 'FDA IID Limits',
    category: 'Pre-Formulation & QbD',
    measurementMethod: 'Quarterly FDA Inactive Ingredient Search & Potency per Unit Dose Validation',
    targetCriteria: 'Proposed formulation excipient level ≤ Maximum Potency listed in FDA IID for the specific route and dosage form',
    definitionEn: 'The FDA Inactive Ingredient Database (IID) provides information on excipients present in FDA-approved drug products, establishing the maximum potency per unit dose considered safe without requiring new non-clinical toxicology studies.',
    definitionBn: 'FDA repository of approved excipient maximum potency limits by administration route and dosage form.',
    labSignificanceBn: 'Formulations within FDA IID limits avoid costly preclinical toxicology re-testing during Abbreviated New Drug Application (ANDA) filings.'
  },
  ich_q1a: {
    id: 'ich_q1a',
    term: 'ICH Q1A(R2) Stability Testing of New Drug Substances and Products',
    shortName: 'ICH Q1A(R2)',
    category: 'Pre-Formulation & QbD',
    measurementMethod: 'Validated stability-indicating HPLC assay under climatic chambers (25°C/60% RH, 30°C/65% RH, 40°C/75% RH)',
    targetCriteria: 'No "Significant Change" at 6 months accelerated (40°C/75% RH) with Assay ≥ 95.0% and total degradants ≤ 2.0%',
    definitionEn: 'The international harmonized guideline defining stability testing requirements to establish a drug product shelf life and recommended storage conditions across global climatic zones (Long-term: 25°C/60% RH, Intermediate: 30°C/65% RH, Accelerated: 40°C/75% RH).',
    definitionBn: 'International regulatory guideline defining climatic chamber testing protocols to establish product shelf-life and recommended storage conditions.',
    labSignificanceBn: 'Meeting ICH Q1A accelerated stability criteria (6 months at 40°C/75% RH) supports real-time room temperature shelf-life claims.'
  }
};
