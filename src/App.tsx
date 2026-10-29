import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { HeroWorkbench } from './components/HeroWorkbench';
import { PreformulationInspector } from './components/PreformulationInspector';
import { NanoparticleStudio } from './components/NanoparticleStudio';
import { AmorphousDispersionStudio } from './components/AmorphousDispersionStudio';
import { InhalationStudio } from './components/InhalationStudio';
import { PkPdSimulationStudio } from './components/PkPdSimulationStudio';
import { FormulationDossierModal } from './components/FormulationDossierModal';
import { LabGuideModal } from './components/LabGuideModal';
import { MobileQuickNav } from './components/MobileQuickNav';
import { FormulationBatchCalculator } from './components/FormulationBatchCalculator';
import { LabDataLoggerWorkflow } from './components/LabDataLoggerWorkflow';
import { GlossaryDrawer } from './components/GlossaryDrawer';
import { CompoundSafetyModal } from './components/CompoundSafetyModal';
import { FormulatorStudio } from './components/FormulatorStudio';
import { ComplianceOverviewDashboard } from './components/ComplianceOverviewDashboard';
import { AboutSection } from './components/AboutSection';
import { BENCHMARK_DRUGS_LIST } from './data/benchmarkDrugs';
import {
  CompoundProperties,
  DeliverySystemType,
  NanoparticleState,
  AmorphousState,
  InhalationState,
  SimulationResult,
} from './types/pharmadds';

export default function App() {
  const [currentDrug, setCurrentDrug] = useState<CompoundProperties>(BENCHMARK_DRUGS_LIST[0]);
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [systemType, setSystemType] = useState<DeliverySystemType>('nanoparticle');
  const [doseMg, setDoseMg] = useState<number>(50);

  // Modals & Panels
  const [isDossierOpen, setIsDossierOpen] = useState(false);
  const [isLabGuideOpen, setIsLabGuideOpen] = useState(false);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);
  const [glossaryTermId, setGlossaryTermId] = useState<string | null>(null);
  const [isSafetyModalOpen, setIsSafetyModalOpen] = useState(false);
  const [safetyModalCompound, setSafetyModalCompound] = useState<CompoundProperties | null>(null);

  const handleOpenGlossary = (termId?: string) => {
    setGlossaryTermId(termId || null);
    setIsGlossaryOpen(true);
  };

  const handleOpenSafetyModal = (drug: CompoundProperties) => {
    setSafetyModalCompound(drug);
    setIsSafetyModalOpen(true);
  };

  // Domain parameter states
  const [nanoState, setNanoState] = useState<NanoparticleState>({
    lipidType: 'SM-102 Ionizable',
    particleDiameter_nm: 85,
    pegFraction_pct: 1.5,
    ligandTargetDensity: 250,
    coreMaterial: 'Ionizable LNP (SM-102 / MC3)',
    targetingLigand: 'Folate Receptor Ligand (FR-alpha)',
  });

  const [amorphousState, setAmorphousState] = useState<AmorphousState>({
    polymerType: 'HPMC-AS (LF Grade, Tg 120°C)',
    polymerTg_C: 120,
    drugTg_C: 45,
    drugWeightFraction: 0.25,
    storageTemp_C: 25,
  });

  const [inhalationState, setInhalationState] = useState<InhalationState>({
    deviceType: 'DPI',
    flowRate_Lmin: 60,
    mmad_um: 2.4,
    gsd: 1.6,
    fineLactoseRatio: 0.05,
    propellantType: 'HFO-1234ze (Ultra-Low GWP)',
  });

  const [simulation, setSimulation] = useState<SimulationResult | null>(null);

  // Trigger calculation from backend simulation engine
  const runSimulation = useCallback(async () => {
    try {
      const resp = await fetch('/api/simulation/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          drug: currentDrug,
          systemType,
          dose_mg: doseMg,
          // Nano
          particleDiameter_nm: nanoState.particleDiameter_nm,
          pegFraction_pct: nanoState.pegFraction_pct,
          ligandTargetDensity: nanoState.ligandTargetDensity,
          lipidType: nanoState.coreMaterial,
          // Amorphous
          polymerType: amorphousState.polymerType,
          polymerTg_C: amorphousState.polymerTg_C,
          drugTg_C: amorphousState.drugTg_C,
          drugWeightFraction: amorphousState.drugWeightFraction,
          storageTemp_C: amorphousState.storageTemp_C,
          // Inhalation
          deviceType: inhalationState.deviceType,
          flowRate_Lmin: inhalationState.flowRate_Lmin,
          mmad_um: inhalationState.mmad_um,
          gsd: inhalationState.gsd,
          fineLactoseRatio: inhalationState.fineLactoseRatio,
          propellantType: inhalationState.propellantType,
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        setSimulation(data);
      }
    } catch (err) {
      console.warn('Simulation API offline, using local mathematical simulation fallback', err);
    }
  }, [currentDrug, systemType, doseMg, nanoState, amorphousState, inhalationState]);

  useEffect(() => {
    runSimulation();
  }, [runSimulation]);

  const handleSelectDrug = (drug: CompoundProperties) => {
    setCurrentDrug(drug);
    // Align default recommended system
    if (drug.category === 'Targeted Nano' || drug.category === 'Biologic LNP') {
      setSystemType('nanoparticle');
    } else if (drug.category === 'Amorphous Solid Dispersion') {
      setSystemType('amorphous');
    } else if (drug.category === 'Inhalation DPI/MDI') {
      setSystemType('inhalation');
    }
  };

  const handleNavigate = (section: string) => {
    setActiveSection(section);
    if (section === 'overview') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const el = document.getElementById(section);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* Top Bar Navigation with Global PubChem Search & Mobile Drawer */}
      <Header
        activeSection={activeSection}
        onNavigate={handleNavigate}
        onOpenDossier={() => setIsDossierOpen(true)}
        onOpenLabGuide={() => setIsLabGuideOpen(true)}
        onOpenGlossary={handleOpenGlossary}
        onSelectDrug={handleSelectDrug}
        onOpenSafetyModal={handleOpenSafetyModal}
        currentDrug={currentDrug}
      />

      {/* Main Workspace Stage */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 lg:pb-16 w-full space-y-6">
        {/* Hero Section & Quick Benchmark Selector */}
        <HeroWorkbench
          currentDrug={currentDrug}
          benchmarks={BENCHMARK_DRUGS_LIST}
          onSelectDrug={handleSelectDrug}
          onNavigate={handleNavigate}
        />

        {/* 0. End-to-End Formulation Development Workflow & Lab Data Logger */}
        <LabDataLoggerWorkflow
          currentDrug={currentDrug}
          systemType={systemType}
          onOpenGlossary={handleOpenGlossary}
        />

        {/* 1. Pre-Formulation & PubChem Inspector */}
        <PreformulationInspector
          currentDrug={currentDrug}
          onSelectDrug={handleSelectDrug}
          benchmarks={BENCHMARK_DRUGS_LIST}
        />

        {/* 2. Targeted Nanotechnology Studio */}
        <NanoparticleStudio
          currentDrug={currentDrug}
          nanoState={nanoState}
          onUpdateNanoState={(patch) => setNanoState((prev) => ({ ...prev, ...patch }))}
          simulation={simulation}
          onOpenGlossary={handleOpenGlossary}
        />

        {/* 3. Amorphous Solid Dispersions Studio */}
        <AmorphousDispersionStudio
          currentDrug={currentDrug}
          amorphousState={amorphousState}
          onUpdateAmorphousState={(patch) => setAmorphousState((prev) => ({ ...prev, ...patch }))}
          simulation={simulation}
          onOpenGlossary={handleOpenGlossary}
        />

        {/* 4. Inhalation Science Studio (DPI & pMDI) */}
        <InhalationStudio
          currentDrug={currentDrug}
          inhalationState={inhalationState}
          onUpdateInhalationState={(patch) => setInhalationState((prev) => ({ ...prev, ...patch }))}
          simulation={simulation}
          onOpenGlossary={handleOpenGlossary}
        />

        {/* 5. PK/PD Bioavailability & Toxicity Simulation Engine */}
        <PkPdSimulationStudio
          currentDrug={currentDrug}
          simulation={simulation}
          systemType={systemType}
          onChangeSystemType={setSystemType}
          doseMg={doseMg}
          onChangeDoseMg={setDoseMg}
        />

        {/* 6. Formulation Bench Batch & Lyophilization Recipe Calculator */}
        <FormulationBatchCalculator
          currentDrug={currentDrug}
          systemType={systemType}
        />

        {/* 7. Formulator Studio: Excipient Intelligence & Regulatory Engine (openFDA, NIH GSRS, UCSF CERSI, FDA IID) */}
        <FormulatorStudio
          currentDrug={currentDrug}
          onOpenGlossary={handleOpenGlossary}
        />

        {/* 8. Centralized Regulatory Compliance Overview & Project Maturity Dashboard */}
        <ComplianceOverviewDashboard
          currentDrug={currentDrug}
          onNavigate={handleNavigate}
        />

        {/* 9. About PharmaCore: Platform Architecture, Mathematical Foundations & Regulatory Standards */}
        <AboutSection
          onNavigate={handleNavigate}
          onOpenGlossary={handleOpenGlossary}
        />
      </main>

      {/* Floating Bottom Quick Nav for Mobile Screens */}
      <MobileQuickNav
        activeSection={activeSection}
        onNavigate={handleNavigate}
        onOpenGlossary={handleOpenGlossary}
      />

      {/* Lab Master Dossier Printable Modal */}
      <FormulationDossierModal
        isOpen={isDossierOpen}
        onClose={() => setIsDossierOpen(false)}
        drug={currentDrug}
        simulation={simulation}
        nanoState={nanoState}
        amorphousState={amorphousState}
        inhalationState={inhalationState}
        systemType={systemType}
        doseMg={doseMg}
      />

      {/* Scientific R&D Guide Modal */}
      <LabGuideModal
        isOpen={isLabGuideOpen}
        onClose={() => setIsLabGuideOpen(false)}
      />

      {/* Scientific Glossary Explainer Drawer */}
      <GlossaryDrawer
        isOpen={isGlossaryOpen}
        onClose={() => setIsGlossaryOpen(false)}
        initialTermId={glossaryTermId}
      />

      {/* PubChem Chemical Safety & Hazard Modal */}
      <CompoundSafetyModal
        isOpen={isSafetyModalOpen}
        onClose={() => setIsSafetyModalOpen(false)}
        compound={safetyModalCompound || currentDrug}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">PharmaCore</span>
            <span>·</span>
            <span>Pharmaceutical R&D Studio for Advanced Drug Delivery Systems</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>PubChem PUG REST API Integrated</span>
            <span>·</span>
            <span>Ph. Eur. & USP &lt;601&gt; Standards</span>
            <span>·</span>
            <button
              onClick={() => handleNavigate('about')}
              className="text-slate-600 hover:text-blue-600 hover:underline font-medium cursor-pointer"
            >
              About Platform
            </button>
            <span>·</span>
            <button
              onClick={() => setIsLabGuideOpen(true)}
              className="text-blue-600 hover:underline font-medium cursor-pointer"
            >
              R&D Manual
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
