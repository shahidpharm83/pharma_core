import React, { useState, useMemo } from 'react';
import {
  Layers,
  Sliders,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Info,
  Droplets,
  RotateCw,
  Gauge,
  Activity,
  Check,
  ChevronRight,
  ShieldCheck,
  Cpu,
  Flame,
  Clock,
  FlaskConical,
} from 'lucide-react';
import { CompoundProperties, NanoparticleState } from '../types/pharmadds';

export type SynthesisMethodType = 'microfluidic_mixing' | 'thin_film_hydration' | 'ethanol_injection';

interface LnpSynthesisWorkflowProps {
  currentDrug: CompoundProperties;
  nanoState: NanoparticleState;
  onApplyParameters: (updatedParams: {
    particleDiameter_nm: number;
    pegFraction_pct: number;
    coreMaterial: string;
    notes?: string;
  }) => void;
  onOpenGlossary?: (termId?: string) => void;
}

interface WorkflowStep {
  id: string;
  stepNumber: number;
  title: string;
  subtitle: string;
  duration: string;
  temperature: string;
  cpps: { name: string; value: string; impact: string }[];
  cqas: { name: string; target: string }[];
  description: string;
  pitfalls: string[];
}

export const LnpSynthesisWorkflow: React.FC<LnpSynthesisWorkflowProps> = ({
  currentDrug,
  nanoState,
  onApplyParameters,
  onOpenGlossary,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<SynthesisMethodType>('microfluidic_mixing');
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [appliedNotice, setAppliedNotice] = useState<string | null>(null);

  // Microfluidic Process Parameters
  const [flowRateRatio, setFlowRateRatio] = useState<number>(3.0); // 3:1 (Aqueous : Ethanol)
  const [totalFlowRate, setTotalFlowRate] = useState<number>(12.0); // mL/min
  const [mixerGeometry, setMixerGeometry] = useState<'shm' | 'bifurcated' | 'toroidal'>('shm');
  const [lipidStockConcMgMl, setLipidStockConcMgMl] = useState<number>(10.0); // mg/mL in ethanol

  // Thin-Film Hydration Process Parameters
  const [hydrationTemp_C, setHydrationTemp_C] = useState<number>(60); // °C (Above Tm of HSPC/DPPC)
  const [extrusionPoreSizeNm, setExtrusionPoreSizeNm] = useState<number>(100); // nm
  const [extrusionPasses, setExtrusionPasses] = useState<number>(15); // cycles
  const [transmembraneGradientMm, setTransmembraneGradientMm] = useState<number>(250); // 250 mM Ammonium Sulfate

  // Mathematical Prediction Calculations for Microfluidics
  const microfluidicPrediction = useMemo(() => {
    // Hydrodynamic diameter decreases with higher Flow Rate Ratio (FRR) and higher Total Flow Rate (TFR)
    // Formula: D_h ~ D_base * (1 + 1/FRR)^0.55 * (10 / TFR)^0.18
    const baseDiameter = 68.0;
    const geometryFactor = mixerGeometry === 'shm' ? 0.95 : mixerGeometry === 'toroidal' ? 1.02 : 1.10;
    const predictedDiameter = Math.round(
      baseDiameter * Math.pow(1 + 1 / flowRateRatio, 0.55) * Math.pow(12 / totalFlowRate, 0.18) * geometryFactor
    );

    // PDI: Staggered Herringbone Mixer yields ultra-narrow PDI < 0.10
    const predictedPdi = parseFloat(
      (0.065 + (0.04 / flowRateRatio) + (totalFlowRate < 6 ? 0.04 : 0.01)).toFixed(3)
    );

    // Encapsulation efficiency: peaks around FRR 3:1 - 4:1
    const predictedEe = parseFloat(
      Math.min(98.5, Math.max(78.0, 95.0 - Math.abs(flowRateRatio - 3.5) * 3.5)).toFixed(1)
    );

    // Mixing time: sub-millisecond in SHM
    const mixingTimeMs = parseFloat(((30 / totalFlowRate) * (mixerGeometry === 'shm' ? 0.8 : 1.4)).toFixed(1));

    // Reynolds Number Re = rho * v * D_h / mu (typically laminar, Re < 80)
    const reynoldsNumber = Math.round(totalFlowRate * 3.8);

    // Residual ethanol in crude mixture
    const crudeEthanolPct = parseFloat(((1 / (flowRateRatio + 1)) * 100).toFixed(1));

    return {
      diameterNm: predictedDiameter,
      pdi: predictedPdi,
      encapsulationEfficiencyPct: predictedEe,
      mixingTimeMs,
      reynoldsNumber,
      crudeEthanolPct,
    };
  }, [flowRateRatio, totalFlowRate, mixerGeometry, lipidStockConcMgMl]);

  // Mathematical Prediction Calculations for Thin-Film Hydration
  const thinFilmPrediction = useMemo(() => {
    // Sizing depends strongly on extrusion pore size and pass count
    // As pass count increases, size converges on pore size + 10-15 nm
    const cycleEfficiency = 1 - Math.exp(-extrusionPasses / 4.5);
    const predictedDiameter = Math.round(
      extrusionPoreSizeNm + (1 - cycleEfficiency) * 80 + (hydrationTemp_C < 55 ? 25 : 0)
    );

    // PDI starts high (>0.4 for MLVs) and drops with extrusion passes
    const predictedPdi = parseFloat(
      Math.max(0.12, 0.45 - (extrusionPasses / 20) * 0.30 + (extrusionPoreSizeNm > 150 ? 0.05 : 0)).toFixed(3)
    );

    // Unilamellarity fraction
    const unilamellarPct = Math.min(98, Math.round(50 + cycleEfficiency * 46));

    // Remote loading encapsulation efficiency
    const predictedEe = parseFloat(
      Math.min(99.0, Math.max(60.0, 80.0 + (transmembraneGradientMm / 250) * 16.5)).toFixed(1)
    );

    return {
      diameterNm: predictedDiameter,
      pdi: predictedPdi,
      unilamellarPct,
      encapsulationEfficiencyPct: predictedEe,
    };
  }, [hydrationTemp_C, extrusionPoreSizeNm, extrusionPasses, transmembraneGradientMm]);

  // Step sequences for the methods
  const microfluidicSteps: WorkflowStep[] = [
    {
      id: 'step_1_mf',
      stepNumber: 1,
      title: 'Phase Formulation & Solvent Solubilization',
      subtitle: 'Organic Lipid Stream & Aqueous Nucleic Acid Cargo',
      duration: '15 – 30 min',
      temperature: '20°C – 25°C (Controlled Room Temp)',
      description:
        'Dissolve ionizable lipid (e.g. SM-102 or DLin-MC3-DMA), helper lipid (DSPC), cholesterol, and PEG2000-DMG in anhydrous ethanol at target molar ratios (e.g. 50:10:38.5:1.5). Concurrently, prepare active pharmaceutical ingredient (mRNA or siRNA) in 50 mM sodium citrate buffer at pH 4.0 (low pH ensures positive protonation of the ionizable lipid amine heads).',
      cpps: [
        { name: 'Lipid Molar Ratios', value: '50 : 10 : 38.5 : 1.5 mol%', impact: 'Controls pKa and bilayer phase curvature' },
        { name: 'Aqueous Buffer pH', value: 'pH 4.0 ± 0.05 (50 mM Citrate)', impact: 'Ensures 100% ionizable lipid protonation' },
        { name: 'N/P Ratio', value: '6:1 (Amine to Phosphate)', impact: 'Governs complete nucleic acid condensation' },
      ],
      cqas: [
        { name: 'Lipid Homogeneity', target: 'Complete clarity, no particulate' },
        { name: 'Aqueous Cargo Integrity', target: 'Single sharp electropherogram band' },
      ],
      pitfalls: [
        'Lipid precipitation if ethanol concentration is diluted prematurely.',
        'RNA hydrolysis if aqueous buffer contains trace divalent cations (Mg²⁺) or RNase.',
      ],
    },
    {
      id: 'step_2_mf',
      stepNumber: 2,
      title: 'Microfluidic Hydrodynamic Mixing & Self-Assembly',
      subtitle: 'Chaotic Advection & Polarity-Driven Condensation',
      duration: 'Continuous Flow (12 mL/min)',
      temperature: '22°C (Isothermal)',
      description:
        'Introduce the organic lipid ethanol stream and aqueous mRNA stream into the microfluidic chip at a precise Flow Rate Ratio (FRR 3:1). Within the staggered herringbone micromixer (SHM), chaotic advection and vortex stretching mix the streams in under 3 milliseconds. The sharp drop in ethanol concentration below 25% triggers rapid phase separation: cationic lipids condense polyanionic mRNA into an inverted micellar hydrophobic core, followed by self-coating with DSPC, cholesterol, and external PEG-lipid stealth chains.',
      cpps: [
        { name: 'Flow Rate Ratio (FRR)', value: `${flowRateRatio}:1 (Aqueous : Ethanol)`, impact: 'Primary governor of particle diameter & PDI' },
        { name: 'Total Flow Rate (TFR)', value: `${totalFlowRate} mL/min`, impact: 'Controls convective residence time and shear' },
        { name: 'Reynolds Number (Re)', value: `Re ≈ ${microfluidicPrediction.reynoldsNumber}`, impact: 'Guarantees microfluidic laminar flow regime' },
      ],
      cqas: [
        { name: 'Instantaneous Z-Average', target: `${microfluidicPrediction.diameterNm} ± 5 nm` },
        { name: 'Polydispersity (PDI)', target: `${microfluidicPrediction.pdi} (Monodisperse)` },
        { name: 'Encapsulation Efficiency', target: `${microfluidicPrediction.encapsulationEfficiencyPct}%` },
      ],
      pitfalls: [
        'Pressure pulsation from syringe/peristaltic pumps causing polydispersity spikes.',
        'Microchannel clogging from lipid aggregates if flow is halted abruptly.',
      ],
    },
    {
      id: 'step_3_mf',
      stepNumber: 3,
      title: 'Inline Quenching & Post-Mix Dilution',
      subtitle: 'Rapid Ethanol Dilution to Freeze Particle Growth',
      duration: '< 1 min (Direct Inline)',
      temperature: '20°C – 25°C',
      description:
        'Directly at the chip outlet, the newly assembled LNPs are diluted 1:1 or 1:2 with neutral physiological buffer (PBS pH 7.4). Diluting the ethanol below 10% freezes kinetic Ostwald ripening and locks the nanoparticle dimensions, while deprotonating surface ionizable amines for neutral physiological surface charge.',
      cpps: [
        { name: 'Inline Dilution Ratio', value: '1:1 with PBS 1X (pH 7.4)', impact: 'Stops particle fusion and ripening' },
        { name: 'Residence in >10% EtOH', value: '< 10 seconds', impact: 'Prevents progressive particle size drift' },
      ],
      cqas: [
        { name: 'Colloidal Zeta Potential', target: '-2.5 to -5.0 mV (Steric Neutral)' },
        { name: 'Structural Lamellarity', target: 'Solid amorphous core with outer monolayer' },
      ],
      pitfalls: [
        'Inadequate dilution volume allowing secondary coalescence and particle enlargement.',
      ],
    },
    {
      id: 'step_4_mf',
      stepNumber: 4,
      title: 'Tangential Flow Filtration (TFF) & Diafiltration',
      subtitle: 'Residual Solvent Elimination & Buffer Exchange',
      duration: '45 – 90 min',
      temperature: '2°C – 8°C (Chilled Module)',
      description:
        'Recirculate the crude LNP suspension across a hollow fiber Tangential Flow Filtration (TFF) membrane (100 kDa or 300 kDa MWCO). Perform 6 to 10 continuous diafiltration volumes against sterile PBS (pH 7.4) with sucrose cryoprotectant. This purges residual ethanol down to <0.05% (<500 ppm, ICH Q3C Class 3 limits), clears unencapsulated cargo, and concentrates the batch to target therapeutic dose concentration.',
      cpps: [
        { name: 'Transmembrane Pressure (TMP)', value: '0.3 – 0.5 bar (Low Shear)', impact: 'Avoids membrane fouling and LNP deformation' },
        { name: 'Diafiltration Volumes', value: '8 – 10 Continuous Diavolumes', impact: 'Purges ethanol below 500 ppm ICH threshold' },
        { name: 'Membrane MWCO', value: '100 kDa PES Hollow Fiber', impact: 'Retains 100% of 70nm LNPs while passing solvent' },
      ],
      cqas: [
        { name: 'Residual Ethanol', target: '< 0.05% (< 500 ppm ICH Limit)' },
        { name: 'Concentration Factor', target: '5X to 10X Final API Payload' },
        { name: 'Osmolality', target: '290 – 320 mOsm/kg' },
      ],
      pitfalls: [
        'Excessive shear stress (TMP > 1 bar) causing mRNA leakage or vesicle rupture.',
        'Membrane fouling resulting in prolonged diafiltration times.',
      ],
    },
    {
      id: 'step_5_mf',
      stepNumber: 5,
      title: 'Sterile Filtration (0.22 µm) & Final Quality Release',
      subtitle: 'Bioburden Control, Cryopreservation & QC',
      duration: '15 – 20 min',
      temperature: '2°C – 8°C / Stored at -80°C',
      description:
        'Pass the purified LNP bulk through a 0.22 µm Polyethersulfone (PES) sterilizing-grade filter into sterile vials. Add 8–10% sucrose or trehalose cryoprotectant. Perform final analytical release assays: Dynamic Light Scattering (DLS) for particle size and PDI, Ribogreen fluorometric assay for encapsulation efficiency (>90%), RP-HPLC for lipid purity, and endotoxin LAL testing (<0.5 EU/mL).',
      cpps: [
        { name: 'Filter Membrane Material', value: '0.22 µm PES (Low Protein/Lipid Binding)', impact: 'Ensures sterile release without lipid retention' },
        { name: 'Cryoprotectant Excipient', value: '8% Sucrose + 10 mM Histidine', impact: 'Prevents particle ice-crystal rupture at -80°C' },
      ],
      cqas: [
        { name: 'Sterility & Endotoxin', target: '< 0.2 EU/mg (Meets USP <85>)', },
        { name: 'Final Encapsulation', target: '> 90% Intact Nucleic Acid', },
        { name: 'Storage Shelf-Life', target: '> 12 months at -80°C or -20°C', },
      ],
      pitfalls: [
        'Clogging of 0.22 µm filter if upstream PDI is >0.20 or oversized aggregates exist.',
        'Slow freezing rates causing cryo-crystallization damage without rapid blast freezing.',
      ],
    },
  ];

  const thinFilmSteps: WorkflowStep[] = [
    {
      id: 'step_1_tf',
      stepNumber: 1,
      title: 'Lipid Solubilization in Volatile Organic Solvent',
      subtitle: 'Homogeneous Molecular Dissolution',
      duration: '20 min',
      temperature: '25°C',
      description:
        'Weigh high-phase-transition lipids such as Hydrogenated Soy Phosphatidylcholine (HSPC, Tm = 53°C), Cholesterol, and mPEG2000-DSPE in a molar ratio of 56:39:5. Dissolve completely in a volatile organic solvent mixture of Chloroform : Methanol (9:1 v/v) in a round-bottom flask to ensure molecular mixing of all lipid components.',
      cpps: [
        { name: 'Solvent System', value: 'Chloroform : Methanol (9:1 v/v)', impact: 'Dissolves both neutral and charged phospholipids' },
        { name: 'Lipid Composition', value: 'HSPC : Chol : mPEG2000-DSPE (56:39:5)', impact: 'Establishes rigid gel-phase bilayer and stealth corona' },
      ],
      cqas: [
        { name: 'Optical Clarity', target: 'Complete clarity, absence of crystal nuclei' },
      ],
      pitfalls: [
        'Incomplete lipid dissolution leading to heterogeneous phase segregation in the film.',
      ],
    },
    {
      id: 'step_2_tf',
      stepNumber: 2,
      title: 'Rotary Evaporation & Vacuum Desiccation',
      subtitle: 'Formation of Stacked Thin Lipid Film',
      duration: '60 min Evaporation + Overnight Desiccation',
      temperature: '45°C – 50°C (Water Bath)',
      description:
        'Mount the flask onto a rotary evaporator operating at 120 RPM under progressive vacuum (from 350 mbar down to 20 mbar). As solvent evaporates, a uniform, paper-thin lipid film deposits on the inner glass wall. Transfer the flask to a high-vacuum chamber (<1 mbar) for ≥12 hours or purge with dry nitrogen to eliminate all trace Class 2 chloroform solvents (<60 ppm ICH Q3C limit).',
      cpps: [
        { name: 'Evaporation Temperature', value: '45°C ± 2°C', impact: 'Maintains lipid fluidity during solvent removal' },
        { name: 'Desiccation Pressure', value: '< 10 mbar Vacuum overnight', impact: 'Removes toxic chloroform residues below ICH Q3C limits' },
      ],
      cqas: [
        { name: 'Film Uniformity', target: 'Translucent, homogeneous, no lipid clumps' },
        { name: 'Residual Chloroform', target: '< 60 ppm (ICH Q3C Limit)' },
      ],
      pitfalls: [
        'Rapid vacuum drop causing solvent "bumping" and uneven lipid spatter.',
        'Residual solvent traces accelerating lipid oxidation and membrane leakiness.',
      ],
    },
    {
      id: 'step_3_tf',
      stepNumber: 3,
      title: 'Aqueous Hydration Above Phase Transition (T > Tm)',
      subtitle: 'Spontaneous Swelling into Multi-Lamellar Vesicles (MLVs)',
      duration: '45 – 60 min',
      temperature: `${hydrationTemp_C}°C (Above HSPC Tm = 53°C)`,
      description:
        `Hydrate the dry lipid film with an aqueous buffer containing ${transmembraneGradientMm} mM Ammonium Sulfate (pH 5.5). The hydration must be conducted at ${hydrationTemp_C}°C—well above the lipid gel-to-liquid-crystalline phase transition temperature (Tm = 53°C for HSPC). Gentle vortexing and agitation peel the stacked bilayers from the glass, spontaneously swelling into giant Multi-Lamellar Vesicles (MLVs, 1 to 5 µm in diameter).`,
      cpps: [
        { name: 'Hydration Temperature', value: `${hydrationTemp_C}°C (T > Tm + 7°C)`, impact: 'Essential for phospholipid hydrocarbon chain mobility' },
        { name: 'Transmembrane Salt', value: `${transmembraneGradientMm} mM Ammonium Sulfate`, impact: 'Establishes subsequent remote loading ion gradient' },
      ],
      cqas: [
        { name: 'Hydration Efficiency', target: '> 95% Lipid film detached from glass' },
        { name: 'Vesicle Architecture', target: 'Multi-lamellar "onion-skin" vesicles (1–5 µm)' },
      ],
      pitfalls: [
        'Hydration below Tm yields rigid, unswollen lipid flakes with zero encapsulation.',
        'Thermal degradation of unsaturated lipid bonds if temperature exceeds 70°C.',
      ],
    },
    {
      id: 'step_4_tf',
      stepNumber: 4,
      title: 'High-Pressure Membrane Extrusion or Sonication',
      subtitle: 'Downsizing MLVs to Small Unilamellar Vesicles (SUVs)',
      duration: `${extrusionPasses} Extrusion Cycles (~30 min)`,
      temperature: '55°C – 60°C (Thermostatted Extruder Barrel)',
      description:
        `Pass the crude milky MLV suspension through an automated high-pressure extruder (e.g. Lipex extruder) pressurized with nitrogen gas (20 to 40 bar). The suspension is forced sequentially through track-etched polycarbonate membranes down to ${extrusionPoreSizeNm} nm for ${extrusionPasses} repetitive passes. High shear forces peel outer lamellae and break vesicles down into monodisperse Small Unilamellar Vesicles (SUVs) with targeted ~${thinFilmPrediction.diameterNm} nm diameter.`,
      cpps: [
        { name: 'Extrusion Membrane Pore', value: `${extrusionPoreSizeNm} nm Polycarbonate`, impact: 'Directly dictates final vesicle cutoff diameter' },
        { name: 'Cycle Passes', value: `${extrusionPasses} Cycles`, impact: 'Reduces PDI from >0.45 down to ~0.15' },
        { name: 'Nitrogen Drive Pressure', value: '20 – 35 bar', impact: 'Provides required shear velocity through pores' },
      ],
      cqas: [
        { name: 'Mean Vesicle Size', target: `${thinFilmPrediction.diameterNm} ± 8 nm` },
        { name: 'Polydispersity (PDI)', target: `${thinFilmPrediction.pdi} (Unilamellar)` },
        { name: 'Unilamellarity', target: `${thinFilmPrediction.unilamellarPct}% Unilamellar SUVs` },
      ],
      pitfalls: [
        'Membrane tearing under excessive pressure (>50 bar), allowing large vesicles to bypass.',
        'Lipid freezing in extruder if barrel jacket drops below lipid Tm (53°C).',
      ],
    },
    {
      id: 'step_5_tf',
      stepNumber: 5,
      title: 'Transmembrane Ion Gradient & Remote Active Drug Loading',
      subtitle: 'Ammonium Sulfate Gradient & Intraliposomal Drug Crystallization',
      duration: '60 min Loading at 60°C + Dialysis',
      temperature: '60°C (Incubation) followed by 4°C',
      description:
        'Exchange the external buffer against 10% sucrose / histidine (pH 6.5) via dialysis or size-exclusion column, creating an ammonium sulfate gradient ([NH4+]inside >> [NH4+]outside). Add the amphiphilic weak-base drug (e.g. Doxorubicin HCl). Neutral uncharged drug permeates the liposomal bilayer into the acidic interior, where protons from NH4+ dissociate, protonating the drug into an impermeable cation (Drug-NH3+). The cationic drug forms a bundled, fibrous crystalline precipitate with sulfate ions, trapping the drug with >98% encapsulation efficiency (Doxil mechanism).',
      cpps: [
        { name: 'Transmembrane ΔpH', value: 'pH_in 5.5 vs pH_out 7.4 (ΔpH ≈ 2.0)', impact: 'Chemical driving force for active influx' },
        { name: 'Drug-to-Lipid (D/L) Ratio', value: '0.125 – 0.200 (wt/wt)', impact: 'Optimizes precipitation without membrane lysis' },
        { name: 'Incubation Temp & Time', value: '60°C for 60 min', impact: 'Facilitates trans-bilayer permeation' },
      ],
      cqas: [
        { name: 'Active Encapsulation', target: `${thinFilmPrediction.encapsulationEfficiencyPct}% (Nanocrystal Core)` },
        { name: 'Drug Leakage Rate', target: '< 2% leakage over 6 months at 4°C' },
      ],
      pitfalls: [
        'Premature collapse of ammonium sulfate gradient before drug addition.',
        'Precipitation of free drug on outer surface if incubation temperature is insufficient.',
      ],
    },
  ];

  const currentSteps = selectedMethod === 'microfluidic_mixing' ? microfluidicSteps : thinFilmSteps;
  const currentStep = currentSteps[activeStepIndex] || currentSteps[0];

  // Apply parameters callback
  const handleTransferToStudio = () => {
    if (selectedMethod === 'microfluidic_mixing') {
      onApplyParameters({
        particleDiameter_nm: microfluidicPrediction.diameterNm,
        pegFraction_pct: nanoState.pegFraction_pct,
        coreMaterial: 'Ionizable LNP (SM-102 / MC3)',
        notes: `Microfluidic Formulation (FRR ${flowRateRatio}:1, TFR ${totalFlowRate} mL/min, PDI ${microfluidicPrediction.pdi})`,
      });
      setAppliedNotice(`Loaded Microfluidic LNP (${microfluidicPrediction.diameterNm} nm, PDI ${microfluidicPrediction.pdi}) into Active Studio!`);
    } else {
      onApplyParameters({
        particleDiameter_nm: thinFilmPrediction.diameterNm,
        pegFraction_pct: 5.0, // Classical Doxil formulation ~5 mol% mPEG-DSPE
        coreMaterial: 'PEGylated Stealth Liposome (HSPC/Chol/mPEG2000)',
        notes: `Thin-Film Extruded Liposome (${extrusionPasses} passes @ ${extrusionPoreSizeNm} nm, PDI ${thinFilmPrediction.pdi})`,
      });
      setAppliedNotice(`Loaded Thin-Film Extruded Liposome (${thinFilmPrediction.diameterNm} nm, PDI ${thinFilmPrediction.pdi}) into Active Studio!`);
    }

    setTimeout(() => setAppliedNotice(null), 4000);
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-6">
      {/* Success Notification */}
      {appliedNotice && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between text-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">{appliedNotice}</span>
          </div>
          <span className="text-[10px] font-mono uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
            Studio Synchronized
          </span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded bg-blue-100 text-blue-700">
              <RotateCw className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold tracking-tight text-slate-900">
              Nanoparticle Synthesis & Manufacturing Process Workflow
            </h3>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
              GMP Process Engineering
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Compare modern microfluidic chaotic advection mixing with classical thin-film hydration and extrusion. Simulate critical process parameters (CPPs) and predict critical quality attributes (CQAs).
          </p>
        </div>

        {/* Method Toggle Buttons */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => {
              setSelectedMethod('microfluidic_mixing');
              setActiveStepIndex(0);
            }}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
              selectedMethod === 'microfluidic_mixing'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Microfluidic Mixing (Modern LNP)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedMethod('thin_film_hydration');
              setActiveStepIndex(0);
            }}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
              selectedMethod === 'thin_film_hydration'
                ? 'bg-teal-700 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>Thin-Film Hydration (Extrusion)</span>
          </button>
        </div>
      </div>

      {/* Synthesis Method Synopsis Card */}
      <div
        className={`p-4 rounded-lg border text-xs space-y-2 ${
          selectedMethod === 'microfluidic_mixing'
            ? 'bg-blue-50/60 border-blue-200 text-blue-950'
            : 'bg-teal-50/60 border-teal-200 text-teal-950'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="font-bold text-sm flex items-center gap-2">
            {selectedMethod === 'microfluidic_mixing' ? (
              <>
                <Zap className="w-4 h-4 text-blue-600" />
                <span>Microfluidic Staggered Herringbone Mixing (SHM) Process Platform</span>
              </>
            ) : (
              <>
                <Flame className="w-4 h-4 text-teal-700" />
                <span>Thin-Film Hydration (Bangham Method) & High-Pressure Extrusion Platform</span>
              </>
            )}
          </span>

          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="text-slate-500">Commercial Standard:</span>
            <span className="font-bold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-800">
              {selectedMethod === 'microfluidic_mixing'
                ? 'Onpattro (Patisiran) • Comirnaty • Spikevax'
                : 'Doxil (Doxorubicin) • Ambisome • Marqibo'}
            </span>
          </div>
        </div>

        <p className="text-[11px] leading-relaxed text-slate-700">
          {selectedMethod === 'microfluidic_mixing'
            ? 'Operates under strict laminar flow (Re < 100) where custom microchannel grooves induce chaotic vortex stretching. Enables ultra-rapid millisecond mixing of ethanol-dissolved ionizable lipids with acidic aqueous mRNA, driving self-assembly into homogeneous 60–80 nm nanoparticles with PDI < 0.08.'
            : 'Dissolves high-transition phospholipids (HSPC, Tm 53°C) in organic chloroform, evaporates into a stacked thin film, and swells in warm buffer to yield heterogeneous Multi-Lamellar Vesicles (MLVs). Repeated extrusion through track-etched polycarbonate membranes downsizes MLVs into unilamellar liposomes, followed by active transmembrane ammonium sulfate loading.'}
        </p>
      </div>

      {/* Step-by-Step Visual Stepper Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-800">Process Flow Architecture (5-Step Sequence):</span>
          <span className="text-slate-500 font-mono">
            Step {activeStepIndex + 1} of {currentSteps.length}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
          {currentSteps.map((step, idx) => {
            const isActive = idx === activeStepIndex;
            const isCompleted = idx < activeStepIndex;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setActiveStepIndex(idx)}
                className={`p-2.5 rounded-lg border text-left transition-all relative flex flex-col justify-between ${
                  isActive
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm ring-2 ring-blue-500/30'
                    : isCompleted
                    ? 'bg-blue-50/70 border-blue-200 text-slate-800 hover:bg-blue-100/60'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-[10px] font-mono font-bold w-5 h-5 rounded-full flex items-center justify-center ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : isCompleted
                        ? 'bg-blue-200 text-blue-900'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {isCompleted ? <Check className="w-3 h-3" /> : idx + 1}
                  </span>
                  <span className={`text-[9px] font-mono ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>
                    {step.duration.split(' ')[0]}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-xs font-bold line-clamp-1 block leading-tight">
                    {step.title.split(' ')[0]} {step.title.split(' ')[1]}
                  </span>
                  <span
                    className={`text-[10px] line-clamp-1 block ${
                      isActive ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    {step.subtitle}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Step Detailed Operational Panel */}
      <div className="bg-slate-50 rounded-lg border border-slate-200 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-600 text-white">
                Step 0{currentStep.stepNumber}
              </span>
              <h4 className="text-sm font-bold text-slate-900">{currentStep.title}</h4>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{currentStep.subtitle}</p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1 text-slate-600 bg-white px-2 py-1 rounded border border-slate-200">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>{currentStep.duration}</span>
            </span>
            <span className="flex items-center gap-1 text-slate-600 bg-white px-2 py-1 rounded border border-slate-200">
              <Gauge className="w-3.5 h-3.5 text-amber-600" />
              <span>{currentStep.temperature}</span>
            </span>
          </div>
        </div>

        {/* Detailed Mechanics & Description */}
        <p className="text-xs text-slate-700 leading-relaxed bg-white p-3.5 rounded border border-slate-200">
          {currentStep.description}
        </p>

        {/* Interactive SVG Process Schematic for Active Step */}
        <div className="rounded-lg bg-slate-900 border border-slate-800 p-4 text-white overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider">
              {selectedMethod === 'microfluidic_mixing' ? 'Microfluidic Chip Fluid Dynamics' : 'Extrusion & Thin-Film Apparatus'}
            </span>
            <span className="text-[10px] font-mono text-blue-400">
              {selectedMethod === 'microfluidic_mixing' ? `FRR ${flowRateRatio}:1 • TFR ${totalFlowRate} mL/min` : `Extrusion Pass ${activeStepIndex + 1}/${extrusionPasses}`}
            </span>
          </div>

          <div className="w-full h-44 flex items-center justify-center">
            {selectedMethod === 'microfluidic_mixing' ? (
              /* Microfluidics SVG Schematic */
              <svg viewBox="0 0 600 160" className="w-full h-full">
                <defs>
                  <linearGradient id="ethanolStream" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#0284C7" stopOpacity="0.7" />
                  </linearGradient>
                  <linearGradient id="aqueousStream" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#D97706" stopOpacity="0.7" />
                  </linearGradient>
                  <linearGradient id="mixedLnp" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0284C7" />
                    <stop offset="100%" stopColor="#10B981" />
                  </linearGradient>
                </defs>

                {/* Microfluidic Chip Body */}
                <rect x="50" y="20" width="500" height="120" rx="8" fill="#1E293B" stroke="#334155" strokeWidth="2" />

                {/* Channel Inlet 1: Ethanol Lipid Phase */}
                <path d="M 60 40 L 160 70" stroke="url(#ethanolStream)" strokeWidth="8" fill="none" strokeLinecap="round" />
                <text x="70" y="32" fill="#38BDF8" fontSize="10" fontFamily="monospace">Inlet A: Lipids (EtOH)</text>

                {/* Channel Inlet 2: Aqueous mRNA Phase */}
                <path d="M 60 120 L 160 90" stroke="url(#aqueousStream)" strokeWidth="14" fill="none" strokeLinecap="round" />
                <text x="70" y="138" fill="#F59E0B" fontSize="10" fontFamily="monospace">Inlet B: mRNA (Aqueous Citrate pH 4)</text>

                {/* Junction / Herringbone Grooves */}
                <rect x="160" y="65" width="220" height="30" fill="#0F172A" stroke="#475569" strokeWidth="1.5" />

                {/* Herringbone Ribs Texture */}
                {Array.from({ length: 14 }).map((_, i) => (
                  <path
                    key={i}
                    d={`M ${175 + i * 15} 68 L ${182 + i * 15} 80 L ${175 + i * 15} 92`}
                    stroke="#38BDF8"
                    strokeWidth="1.5"
                    fill="none"
                    opacity="0.8"
                  />
                ))}

                {/* Mixing Fluid Gradient */}
                <rect x="165" y="72" width="210" height="16" fill="url(#mixedLnp)" opacity="0.6" rx="3" />

                {/* Assembling Nanoparticles inside channel */}
                {Array.from({ length: 8 }).map((_, i) => (
                  <circle key={i} cx={220 + i * 18} cy={76 + (i % 2 === 0 ? 3 : -3)} r="3" fill="#10B981" />
                ))}

                {/* Channel Outlet Stream with Dilution Buffer */}
                <path d="M 380 80 L 460 80" stroke="#10B981" strokeWidth="12" fill="none" />
                <text x="390" y="70" fill="#10B981" fontSize="9" fontFamily="monospace">Assembled LNPs</text>

                {/* Inline Dilution Port */}
                <path d="M 440 25 L 440 74" stroke="#60A5FA" strokeWidth="6" fill="none" strokeDasharray="3 2" />
                <text x="445" y="42" fill="#60A5FA" fontSize="9" fontFamily="monospace">Inline PBS pH 7.4</text>

                {/* Final Effluent Tube to TFF */}
                <path d="M 460 80 L 540 80" stroke="#34D399" strokeWidth="16" fill="none" strokeLinecap="round" />
                <text x="470" y="105" fill="#34D399" fontSize="10" fontFamily="monospace" fontWeight="bold">To TFF Filter ({microfluidicPrediction.diameterNm} nm)</text>
              </svg>
            ) : (
              /* Thin-Film Hydration / Extruder SVG Schematic */
              <svg viewBox="0 0 600 160" className="w-full h-full">
                <defs>
                  <linearGradient id="lipidFilm" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#0F766E" stopOpacity="0.9" />
                  </linearGradient>
                </defs>

                {/* Round-bottom Rotary Flask on Left */}
                <circle cx="120" cy="80" r="55" fill="#0F172A" stroke="#334155" strokeWidth="2" />
                {/* Thin lipid film on inner wall */}
                <path d="M 75 80 A 45 45 0 0 0 165 80" stroke="#14B8A6" strokeWidth="5" fill="none" />
                <text x="75" y="145" fill="#14B8A6" fontSize="10" fontFamily="monospace">1. Thin Lipid Film on Glass</text>

                {/* Transition Arrow */}
                <path d="M 190 80 L 230 80" stroke="#64748B" strokeWidth="2" strokeDasharray="4 3" markerEnd="url(#arrow)" />

                {/* Swollen Multi-Lamellar Vesicles */}
                <g transform="translate(260, 45)">
                  <circle cx="35" cy="35" r="32" fill="#0F172A" stroke="#0D9488" strokeWidth="2" strokeDasharray="3 2" />
                  <circle cx="35" cy="35" r="22" fill="#0F172A" stroke="#0D9488" strokeWidth="2" strokeDasharray="3 2" />
                  <circle cx="35" cy="35" r="12" fill="#0F172A" stroke="#0D9488" strokeWidth="2" />
                  <text x="-5" y="80" fill="#0D9488" fontSize="9" fontFamily="monospace">2. Swollen MLVs (1-5 µm)</text>
                </g>

                {/* Transition Arrow */}
                <path d="M 350 80 L 380 80" stroke="#64748B" strokeWidth="2" strokeDasharray="4 3" />

                {/* Extruder Barrel & Polycarbonate Membrane Filter */}
                <g transform="translate(400, 30)">
                  <rect x="0" y="15" width="80" height="70" fill="#1E293B" stroke="#64748B" strokeWidth="2" rx="4" />
                  {/* Track-etched membrane disc */}
                  <line x1="40" y1="15" x2="40" y2="85" stroke="#F43F5E" strokeWidth="4" strokeDasharray="4 2" />
                  <text x="10" y="10" fill="#F43F5E" fontSize="9" fontFamily="monospace">{extrusionPoreSizeNm} nm Membrane</text>
                  <text x="12" y="105" fill="#94A3B8" fontSize="8" fontFamily="monospace">N2 Gas (30 bar)</text>
                </g>

                {/* Transition Arrow */}
                <path d="M 490 80 L 520 80" stroke="#64748B" strokeWidth="2" strokeDasharray="4 3" />

                {/* Extruded Small Unilamellar Vesicles (SUVs) */}
                <g transform="translate(540, 50)">
                  <circle cx="15" cy="15" r="12" fill="#0F172A" stroke="#10B981" strokeWidth="2.5" />
                  <circle cx="40" cy="40" r="12" fill="#0F172A" stroke="#10B981" strokeWidth="2.5" />
                  <circle cx="15" cy="45" r="12" fill="#0F172A" stroke="#10B981" strokeWidth="2.5" />
                  <text x="-15" y="75" fill="#10B981" fontSize="9" fontFamily="monospace" fontWeight="bold">3. SUVs ({thinFilmPrediction.diameterNm} nm)</text>
                </g>
              </svg>
            )}
          </div>
        </div>

        {/* CPP & CQA Breakdown Grid for Active Step */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {/* Critical Process Parameters (CPPs) */}
          <div className="p-3 bg-white rounded border border-slate-200 space-y-2">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-blue-600" />
              <span>Critical Process Parameters (CPPs) at Step {currentStep.stepNumber}:</span>
            </span>
            <div className="space-y-1.5">
              {currentStep.cpps.map((cpp, idx) => (
                <div key={idx} className="p-2 bg-slate-50 rounded border border-slate-100 flex items-center justify-between text-[11px]">
                  <div>
                    <span className="font-semibold text-slate-800">{cpp.name}</span>
                    <span className="text-[10px] text-slate-500 block">{cpp.impact}</span>
                  </div>
                  <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-[10px]">
                    {cpp.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Critical Quality Attributes (CQAs) & In-Process Controls */}
          <div className="p-3 bg-white rounded border border-slate-200 space-y-2">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Critical Quality Attributes (CQAs) & Acceptance Criteria:</span>
            </span>
            <div className="space-y-1.5">
              {currentStep.cqas.map((cqa, idx) => (
                <div key={idx} className="p-2 bg-slate-50 rounded border border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-800">{cqa.name}</span>
                  <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                    {cqa.target}
                  </span>
                </div>
              ))}
            </div>

            {/* Pitfall Alert */}
            {currentStep.pitfalls.length > 0 && (
              <div className="p-2 rounded bg-amber-50 border border-amber-200 text-amber-900 text-[10px] space-y-0.5">
                <span className="font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  <span>Failure Mode / In-Process Risk:</span>
                </span>
                <p>{currentStep.pitfalls[0]}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Live Interactive Process Parameter Simulator */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="p-1 rounded bg-indigo-100 text-indigo-700">
                <Sliders className="w-4 h-4" />
              </span>
              <span>Process Parameter Simulator: Dynamic CQA Prediction</span>
            </h4>
            <p className="text-xs text-slate-500">
              Adjust manufacturing operating variables to simulate particle diameter, polydispersity, and encapsulation efficiency.
            </p>
          </div>

          <button
            type="button"
            onClick={handleTransferToStudio}
            className="px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-2xs self-start sm:self-auto"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Apply Parameters to Nanoparticle Studio</span>
          </button>
        </div>

        {selectedMethod === 'microfluidic_mixing' ? (
          /* Microfluidic Simulator Controls & Predicted Outputs */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left 6 Cols: Microfluidic Sliders */}
            <div className="lg:col-span-6 space-y-3.5 text-xs">
              <div>
                <div className="flex justify-between items-baseline mb-1">
                  <span className="font-semibold text-slate-700">Flow Rate Ratio (FRR: Aqueous : Organic)</span>
                  <span className="font-mono font-bold text-blue-600">{flowRateRatio.toFixed(1)} : 1</span>
                </div>
                <input
                  type="range"
                  min="1.5"
                  max="6.0"
                  step="0.1"
                  value={flowRateRatio}
                  onChange={(e) => setFlowRateRatio(parseFloat(e.target.value))}
                  className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded cursor-pointer"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Higher FRR dilutes ethanol faster, producing smaller, tighter LNPs (standard 3:1).
                </span>
              </div>

              <div>
                <div className="flex justify-between items-baseline mb-1">
                  <span className="font-semibold text-slate-700">Total Flow Rate (TFR)</span>
                  <span className="font-mono font-bold text-blue-600">{totalFlowRate.toFixed(1)} mL/min</span>
                </div>
                <input
                  type="range"
                  min="2.0"
                  max="30.0"
                  step="1.0"
                  value={totalFlowRate}
                  onChange={(e) => setTotalFlowRate(parseFloat(e.target.value))}
                  className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded cursor-pointer"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Governs convective vortex intensity and residence time inside herringbone ribs.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Microchannel Geometry</label>
                  <select
                    value={mixerGeometry}
                    onChange={(e) => setMixerGeometry(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800"
                  >
                    <option value="shm">Staggered Herringbone (SHM)</option>
                    <option value="toroidal">Toroidal Dean Vortex</option>
                    <option value="bifurcated">Bifurcated Cross-Flow</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Lipid Ethanol Stock</label>
                  <select
                    value={lipidStockConcMgMl}
                    onChange={(e) => setLipidStockConcMgMl(parseFloat(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800"
                  >
                    <option value="5">5.0 mg/mL (Dilute / Small Size)</option>
                    <option value="10">10.0 mg/mL (Standard GMP)</option>
                    <option value="20">20.0 mg/mL (High Mass Yield)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Right 6 Cols: Microfluidic Predicted CQA Dashboard */}
            <div className="lg:col-span-6 bg-slate-900 text-white rounded-lg p-4 space-y-3">
              <span className="text-xs font-bold text-slate-300 block pb-1 border-b border-slate-800">
                Predicted Microfluidic LNP Outputs for {currentDrug.name}
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="bg-white/5 rounded p-2 border border-white/10">
                  <span className="text-[10px] text-slate-400 block">Z-Average Diameter</span>
                  <span className="text-lg font-mono font-bold text-cyan-300">
                    {microfluidicPrediction.diameterNm} nm
                  </span>
                  <span className="text-[9px] text-slate-400 block">DLS Cumulants</span>
                </div>

                <div className="bg-white/5 rounded p-2 border border-white/10">
                  <span className="text-[10px] text-slate-400 block">Polydispersity (PDI)</span>
                  <span className="text-lg font-mono font-bold text-emerald-400">
                    {microfluidicPrediction.pdi}
                  </span>
                  <span className="text-[9px] text-emerald-300 block">Monodisperse</span>
                </div>

                <div className="bg-white/5 rounded p-2 border border-white/10">
                  <span className="text-[10px] text-slate-400 block">Encapsulation %</span>
                  <span className="text-lg font-mono font-bold text-indigo-300">
                    {microfluidicPrediction.encapsulationEfficiencyPct}%
                  </span>
                  <span className="text-[9px] text-slate-400 block">Ribogreen assay</span>
                </div>

                <div className="bg-white/5 rounded p-2 border border-white/10">
                  <span className="text-[10px] text-slate-400 block">Mixing Time (τ)</span>
                  <span className="text-base font-mono font-bold text-white">
                    {microfluidicPrediction.mixingTimeMs} ms
                  </span>
                  <span className="text-[9px] text-slate-400 block">Millisecond vortex</span>
                </div>

                <div className="bg-white/5 rounded p-2 border border-white/10">
                  <span className="text-[10px] text-slate-400 block">Reynolds Number</span>
                  <span className="text-base font-mono font-bold text-white">
                    Re ≈ {microfluidicPrediction.reynoldsNumber}
                  </span>
                  <span className="text-[9px] text-emerald-400 block">Laminar regime</span>
                </div>

                <div className="bg-white/5 rounded p-2 border border-white/10">
                  <span className="text-[10px] text-slate-400 block">Crude EtOH Fraction</span>
                  <span className="text-base font-mono font-bold text-amber-300">
                    {microfluidicPrediction.crudeEthanolPct}% v/v
                  </span>
                  <span className="text-[9px] text-slate-400 block">Purged by TFF</span>
                </div>
              </div>

              <div className="p-2 rounded bg-blue-500/10 border border-blue-400/20 text-blue-200 text-[11px]">
                <span className="font-semibold">Microfluidic Advantage:</span> Instantaneous kinetic nucleation avoids secondary ripening, achieving &gt;90% nucleic acid encapsulation efficiency with clinical batch-to-batch consistency.
              </div>
            </div>
          </div>
        ) : (
          /* Thin-Film Hydration Simulator Controls & Predicted Outputs */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left 6 Cols: Thin-Film Sliders */}
            <div className="lg:col-span-6 space-y-3.5 text-xs">
              <div>
                <div className="flex justify-between items-baseline mb-1">
                  <span className="font-semibold text-slate-700">Hydration Temperature (°C)</span>
                  <span className="font-mono font-bold text-teal-700">{hydrationTemp_C}°C (HSPC Tm = 53°C)</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="70"
                  step="1"
                  value={hydrationTemp_C}
                  onChange={(e) => setHydrationTemp_C(parseInt(e.target.value, 10))}
                  className="w-full accent-teal-700 h-1.5 bg-slate-200 rounded cursor-pointer"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Must exceed lipid gel-to-liquid crystalline transition Tm (53°C) for complete bilayer swelling.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Extrusion Pore Size</label>
                  <select
                    value={extrusionPoreSizeNm}
                    onChange={(e) => setExtrusionPoreSizeNm(parseInt(e.target.value, 10))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800"
                  >
                    <option value="50">50 nm Polycarbonate</option>
                    <option value="80">80 nm Polycarbonate</option>
                    <option value="100">100 nm (Doxil Standard)</option>
                    <option value="200">200 nm Polycarbonate</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Extrusion Cycle Passes</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={extrusionPasses}
                    onChange={(e) => setExtrusionPasses(Math.max(1, parseInt(e.target.value, 10)))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-baseline mb-1">
                  <span className="font-semibold text-slate-700">Transmembrane Gradient Salt</span>
                  <span className="font-mono font-bold text-teal-700">{transmembraneGradientMm} mM (NH4)2SO4</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="350"
                  step="25"
                  value={transmembraneGradientMm}
                  onChange={(e) => setTransmembraneGradientMm(parseInt(e.target.value, 10))}
                  className="w-full accent-teal-700 h-1.5 bg-slate-200 rounded cursor-pointer"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Generates transmembrane electrochemical proton gradient driving remote crystallization of weak base APIs.
                </span>
              </div>
            </div>

            {/* Right 6 Cols: Thin-Film Predicted CQA Dashboard */}
            <div className="lg:col-span-6 bg-slate-900 text-white rounded-lg p-4 space-y-3">
              <span className="text-xs font-bold text-slate-300 block pb-1 border-b border-slate-800">
                Predicted Extruded Liposome Outputs for {currentDrug.name}
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="bg-white/5 rounded p-2 border border-white/10">
                  <span className="text-[10px] text-slate-400 block">Mean Vesicle Size</span>
                  <span className="text-lg font-mono font-bold text-teal-300">
                    {thinFilmPrediction.diameterNm} nm
                  </span>
                  <span className="text-[9px] text-slate-400 block">Track-etched SUV</span>
                </div>

                <div className="bg-white/5 rounded p-2 border border-white/10">
                  <span className="text-[10px] text-slate-400 block">Polydispersity (PDI)</span>
                  <span className="text-lg font-mono font-bold text-amber-300">
                    {thinFilmPrediction.pdi}
                  </span>
                  <span className="text-[9px] text-slate-400 block">
                    {thinFilmPrediction.pdi <= 0.15 ? 'Homogeneous' : 'Moderate spread'}
                  </span>
                </div>

                <div className="bg-white/5 rounded p-2 border border-white/10">
                  <span className="text-[10px] text-slate-400 block">Unilamellarity</span>
                  <span className="text-lg font-mono font-bold text-emerald-400">
                    {thinFilmPrediction.unilamellarPct}%
                  </span>
                  <span className="text-[9px] text-slate-400 block">Cryo-TEM verified</span>
                </div>

                <div className="bg-white/5 rounded p-2 border border-white/10">
                  <span className="text-[10px] text-slate-400 block">Remote Loading EE</span>
                  <span className="text-lg font-mono font-bold text-indigo-300">
                    {thinFilmPrediction.encapsulationEfficiencyPct}%
                  </span>
                  <span className="text-[9px] text-slate-400 block">Sulfate precipitate</span>
                </div>

                <div className="bg-white/5 rounded p-2 border border-white/10">
                  <span className="text-[10px] text-slate-400 block">Residual Chloroform</span>
                  <span className="text-base font-mono font-bold text-white">
                    &lt; 35 ppm
                  </span>
                  <span className="text-[9px] text-emerald-400 block">Passes ICH Q3C</span>
                </div>

                <div className="bg-white/5 rounded p-2 border border-white/10">
                  <span className="text-[10px] text-slate-400 block">Bilayer Phase</span>
                  <span className="text-base font-mono font-bold text-white">
                    Rigid Gel (So)
                  </span>
                  <span className="text-[9px] text-slate-400 block">Minimal leakage</span>
                </div>
              </div>

              <div className="p-2 rounded bg-teal-500/10 border border-teal-400/20 text-teal-200 text-[11px]">
                <span className="font-semibold">Thin-Film Advantage:</span> Ideal for amphiphilic small-molecule antineoplastics (e.g. Doxorubicin) utilizing transmembrane ion gradients to produce dense, bundled internal nanocrystals.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Head-to-Head Comparative Engineering Matrix */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="p-1 rounded bg-purple-100 text-purple-700">
                <Layers className="w-4 h-4" />
              </span>
              <span>Head-to-Head Manufacturing Comparison: Microfluidics vs Thin-Film Hydration</span>
            </h4>
            <p className="text-xs text-slate-500">
              Technical trade-offs across scalability, payload suitability, solvent residue clearance, and capital investment.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="min-w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Process Dimension</th>
                <th className="py-2.5 px-3 text-blue-900 bg-blue-50/50">Microfluidic Mixing (SHM / Hydrodynamic)</th>
                <th className="py-2.5 px-3 text-teal-900 bg-teal-50/50">Thin-Film Hydration & Extrusion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr className="hover:bg-slate-50">
                <td className="py-2.5 px-3 font-semibold text-slate-900">Primary Pharmaceutical Payload</td>
                <td className="py-2.5 px-3 bg-blue-50/30 font-medium text-blue-900">
                  mRNA, siRNA, Oligonucleotides, Gene Editing Cas9/sgRNA
                </td>
                <td className="py-2.5 px-3 bg-teal-50/30 font-medium text-teal-900">
                  Hydrophilic & Amphiphilic Small Molecules (Doxorubicin, Daunorubicin)
                </td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-2.5 px-3 font-semibold text-slate-900">Particle Size Control & PDI</td>
                <td className="py-2.5 px-3 bg-blue-50/30">
                  Ultra-narrow PDI &lt; 0.08, exact diameter tuning (40–100 nm) via flow rate ratio
                </td>
                <td className="py-2.5 px-3 bg-teal-50/30">
                  Moderate PDI 0.12–0.22, strictly constrained by discrete membrane pore ratings
                </td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-2.5 px-3 font-semibold text-slate-900">Commercial Scalability (GMP)</td>
                <td className="py-2.5 px-3 bg-blue-50/30">
                  Linear scale-up via parallel microchannels (milliliters to 100+ liters/day)
                </td>
                <td className="py-2.5 px-3 bg-teal-50/30">
                  Batch-limited by rotary flask geometry and high-pressure extruder fouling
                </td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-2.5 px-3 font-semibold text-slate-900">Encapsulation Efficiency (EE%)</td>
                <td className="py-2.5 px-3 bg-blue-50/30">
                  &gt; 90% for polyanionic nucleic acids via electrostatic complexation
                </td>
                <td className="py-2.5 px-3 bg-teal-50/30">
                  &gt; 95% for weak bases via ammonium sulfate gradient, but &lt; 25% for passive DNA
                </td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-2.5 px-3 font-semibold text-slate-900">Solvent Toxicity Class</td>
                <td className="py-2.5 px-3 bg-blue-50/30">
                  Ethanol (ICH Class 3, low toxic potential, 5,000 ppm allowance)
                </td>
                <td className="py-2.5 px-3 bg-teal-50/30">
                  Chloroform / Methanol (ICH Class 2, strict 60 ppm / 3,000 ppm limit)
                </td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-2.5 px-3 font-semibold text-slate-900">Shear Stress on Payload</td>
                <td className="py-2.5 px-3 bg-blue-50/30">
                  Very low shear millisecond mixing, preserves 4,000+ nt mRNA chain integrity
                </td>
                <td className="py-2.5 px-3 bg-teal-50/30">
                  High shear stress at 30 bar through pores (can shear delicate nucleic acids)
                </td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-2.5 px-3 font-semibold text-slate-900">Regulatory & Commercial Precedents</td>
                <td className="py-2.5 px-3 bg-blue-50/30 font-semibold text-slate-900">
                  Onpattro (Patisiran), Comirnaty (COVID-19), Spikevax
                </td>
                <td className="py-2.5 px-3 bg-teal-50/30 font-semibold text-slate-900">
                  Doxil / Caelyx (Doxorubicin), Ambisome (Amphotericin B), DaunoXome
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
