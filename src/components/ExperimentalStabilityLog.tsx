import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  FlaskConical,
  CheckCircle2,
  AlertTriangle,
  TrendingDown,
  ShieldAlert,
  FileDown,
  Plus,
  Search,
  Filter,
  Sparkles,
  Trash2,
  UserCheck,
  ChevronRight,
  Layers,
  Thermometer,
  Droplets,
  Activity,
  FileSpreadsheet,
  X,
  FileText,
  HelpCircle,
} from 'lucide-react';
import { CompoundProperties } from '../types/pharmadds';

export interface StabilityObservation {
  id: string;
  batchId: string;
  drugCid: number;
  drugName: string;
  systemType: string;
  storageCondition: string; // e.g., '40°C / 75% RH (Accelerated)', '25°C / 60% RH (Long-Term)', '5°C (Refrigerated)'
  timepointDay: number; // e.g. 0, 1, 3, 7, 14, 30, 60, 90, 180
  timepointLabel: string; // e.g. 'Day 0 (Baseline)', 'Day 30 Pull'
  observationDate: string; // YYYY-MM-DD
  potencyPct: number; // % label claim (e.g., 99.8, 97.4, 91.2)
  totalImpuritiesPct: number; // % degradation products (e.g., 0.12, 0.45, 1.25)
  moistureContentPct: number; // % w/w Karl Fischer
  measuredTg_C?: number; // for ASD: Glass transition temp in °C
  particleSize_nm?: number; // for Nano: DLS Hydrodynamic size in nm
  physicalAppearance: string; // Observation description
  physicalStateCategory: 'intact_glass' | 'slight_haze' | 'nucleation_detected' | 'phase_separated' | 'intact_colloid' | 'flocculated';
  analyticalMethod: string; // e.g., 'HPLC-UV & DSC', 'UPLC-MS & PXRD'
  analystName: string;
  analystSignatureId: string; // 21 CFR Part 11 Electronic Signature hash/ID
  isOos: boolean; // Out of Specification (<90% potency or >2% impurities)
  isOot: boolean; // Out of Trend
  notes: string;
  createdAt: string;
}

export interface StabilityBatchMetadata {
  batchId: string;
  drugCid: number;
  drugName: string;
  formulationDesc: string;
  systemType: 'amorphous' | 'nanoparticle' | 'inhalation';
  storageChamberId: string;
  storageCondition: string;
  mfgDate: string;
  packagingSystem: string;
  targetAssayPct: number;
}

interface ExperimentalStabilityLogProps {
  currentDrug: CompoundProperties;
  onOpenGlossary?: (termId?: string) => void;
}

const STORAGE_CONDITIONS = [
  '40°C / 75% RH (ICH Q1A Accelerated)',
  '25°C / 60% RH (ICH Q1A Long-Term)',
  '30°C / 65% RH (ICH Q1A Intermediate)',
  '5°C ± 3°C (Refrigerated / Cold-Chain)',
  '50°C / 80% RH (Stress Testing)',
];

const PHYSICAL_APPEARANCE_OPTIONS = [
  { value: 'intact_glass', label: 'Optically Clear Amorphous Glass (No Birefringence)', status: 'normal' },
  { value: 'slight_haze', label: 'Slight Opalescence / Micro-Phase Hazing', status: 'warning' },
  { value: 'nucleation_detected', label: 'Micro-Crystals / Bragg Diffraction Peaks Detected', status: 'warning' },
  { value: 'phase_separated', label: 'Macro Phase Separation / Crystallization Flakes', status: 'critical' },
  { value: 'intact_colloid', label: 'Translucent Monodisperse Colloidal Dispersion', status: 'normal' },
  { value: 'flocculated', label: 'Colloidal Flocculation / Precipitate Cake', status: 'critical' },
];

const ANALYTICAL_METHODS = [
  'HPLC-UV (Assay) & mDSC (Tg Glass Relaxation)',
  'RP-UPLC-MS (Related Substances & Impurities)',
  'Powder X-ray Diffraction (PXRD Crystalline Halo)',
  'Dynamic Light Scattering (DLS Hydrodynamic Diameter & PDI)',
  'Karl Fischer Coulometric Titration (Moisture w/w)',
  'Polarized Light Microscopy (PLM Birefringence Check)',
];

const INITIAL_BATCHES: StabilityBatchMetadata[] = [
  {
    batchId: 'ITZ-ASD-40C75RH-01',
    drugCid: 55283,
    drugName: 'Itraconazole',
    formulationDesc: 'Itraconazole 30% w/w in HPMC-AS MF spray-dried solid dispersion',
    systemType: 'amorphous',
    storageChamberId: 'Chamber-C4-ZoneIV',
    storageCondition: '40°C / 75% RH (ICH Q1A Accelerated)',
    mfgDate: '2024-08-01',
    packagingSystem: 'Alu-Alu blister with molecular sieve desiccant pouch',
    targetAssayPct: 100.0,
  },
  {
    batchId: 'PAC-LNP-5C-02',
    drugCid: 36314,
    drugName: 'Paclitaxel',
    formulationDesc: 'Paclitaxel LNP (SM-102:DSPC:Chol:DMG-PEG2000) 100 nm',
    systemType: 'nanoparticle',
    storageChamberId: 'ColdRoom-A1',
    storageCondition: '5°C ± 3°C (Refrigerated / Cold-Chain)',
    mfgDate: '2024-09-10',
    packagingSystem: 'Type I Borosilicate glass vial with FluroTec stopper',
    targetAssayPct: 100.0,
  },
  {
    batchId: 'BUD-DPI-25C60RH-03',
    drugCid: 63007,
    drugName: 'Budesonide',
    formulationDesc: 'Engineered porous spray-dried microparticles with InhaLac 70',
    systemType: 'inhalation',
    storageChamberId: 'Chamber-B2-ZoneII',
    storageCondition: '25°C / 60% RH (ICH Q1A Long-Term)',
    mfgDate: '2024-07-15',
    packagingSystem: 'Capsule-based DPI blister pack with induction seal',
    targetAssayPct: 100.0,
  },
];

const INITIAL_OBSERVATIONS: StabilityObservation[] = [
  {
    id: 'obs-001',
    batchId: 'ITZ-ASD-40C75RH-01',
    drugCid: 55283,
    drugName: 'Itraconazole',
    systemType: 'amorphous',
    storageCondition: '40°C / 75% RH (ICH Q1A Accelerated)',
    timepointDay: 0,
    timepointLabel: 'Day 0 (Initial Release)',
    observationDate: '2024-08-01',
    potencyPct: 100.2,
    totalImpuritiesPct: 0.11,
    moistureContentPct: 0.85,
    measuredTg_C: 98.4,
    physicalAppearance: 'Optically clear homogeneous pale yellow glass powder; amorphous halo on PXRD without crystalline diffraction peaks.',
    physicalStateCategory: 'intact_glass',
    analyticalMethod: 'HPLC-UV (Assay) & mDSC (Tg Glass Relaxation)',
    analystName: 'Dr. Sarah Jenkins',
    analystSignatureId: 'SIG-9041-SJ',
    isOos: false,
    isOot: false,
    notes: 'Baseline batch testing meets all USP <621> assay standards and ICH Q6A specifications.',
    createdAt: '2024-08-01T09:30:00Z',
  },
  {
    id: 'obs-002',
    batchId: 'ITZ-ASD-40C75RH-01',
    drugCid: 55283,
    drugName: 'Itraconazole',
    systemType: 'amorphous',
    storageCondition: '40°C / 75% RH (ICH Q1A Accelerated)',
    timepointDay: 7,
    timepointLabel: 'Day 7 Pull',
    observationDate: '2024-08-08',
    potencyPct: 99.7,
    totalImpuritiesPct: 0.18,
    moistureContentPct: 1.12,
    measuredTg_C: 95.8,
    physicalAppearance: 'Uniform free-flowing powder, no cake compaction or visible sintering.',
    physicalStateCategory: 'intact_glass',
    analyticalMethod: 'HPLC-UV (Assay) & mDSC (Tg Glass Relaxation)',
    analystName: 'Dr. Sarah Jenkins',
    analystSignatureId: 'SIG-9078-SJ',
    isOos: false,
    isOot: false,
    notes: 'Slight moisture uptake noted (+0.27% w/w). Glass transition temperature remains comfortably above chamber temperature (Tg - T_storage = 55.8°C).',
    createdAt: '2024-08-08T10:15:00Z',
  },
  {
    id: 'obs-003',
    batchId: 'ITZ-ASD-40C75RH-01',
    drugCid: 55283,
    drugName: 'Itraconazole',
    systemType: 'amorphous',
    storageCondition: '40°C / 75% RH (ICH Q1A Accelerated)',
    timepointDay: 14,
    timepointLabel: 'Day 14 Pull',
    observationDate: '2024-08-15',
    potencyPct: 99.1,
    totalImpuritiesPct: 0.26,
    moistureContentPct: 1.35,
    measuredTg_C: 93.6,
    physicalAppearance: 'Free-flowing powder, pure amorphous halo maintained under PXRD analysis.',
    physicalStateCategory: 'intact_glass',
    analyticalMethod: 'RP-UPLC-MS (Related Substances & Impurities)',
    analystName: 'Marcus Vance, M.Sc.',
    analystSignatureId: 'SIG-9112-MV',
    isOos: false,
    isOot: false,
    notes: 'Oxidative degradation metabolite Impurity-B detected at 0.09% (well below ICH Q3A reporting threshold of 0.20%).',
    createdAt: '2024-08-15T14:20:00Z',
  },
  {
    id: 'obs-004',
    batchId: 'ITZ-ASD-40C75RH-01',
    drugCid: 55283,
    drugName: 'Itraconazole',
    systemType: 'amorphous',
    storageCondition: '40°C / 75% RH (ICH Q1A Accelerated)',
    timepointDay: 30,
    timepointLabel: 'Day 30 (1-Month Milestone)',
    observationDate: '2024-08-31',
    potencyPct: 98.3,
    totalImpuritiesPct: 0.42,
    moistureContentPct: 1.68,
    measuredTg_C: 89.2,
    physicalAppearance: 'Powder remains homogeneous; polarized light microscopy reveals no birefringent crystal needles.',
    physicalStateCategory: 'intact_glass',
    analyticalMethod: 'HPLC-UV (Assay) & mDSC (Tg Glass Relaxation)',
    analystName: 'Dr. Sarah Jenkins',
    analystSignatureId: 'SIG-9230-SJ',
    isOos: false,
    isOot: false,
    notes: '1-month accelerated protocol completion. Tg reduced by 9.2°C due to moisture plasticization, yet stability margin (49.2°C) satisfies Hancock-Zografi criteria.',
    createdAt: '2024-08-31T11:00:00Z',
  },
  {
    id: 'obs-005',
    batchId: 'ITZ-ASD-40C75RH-01',
    drugCid: 55283,
    drugName: 'Itraconazole',
    systemType: 'amorphous',
    storageCondition: '40°C / 75% RH (ICH Q1A Accelerated)',
    timepointDay: 60,
    timepointLabel: 'Day 60 (2-Month Pull)',
    observationDate: '2024-09-30',
    potencyPct: 96.9,
    totalImpuritiesPct: 0.68,
    moistureContentPct: 1.95,
    measuredTg_C: 85.0,
    physicalAppearance: 'Trace opalescence visible under optical stereomicroscopy. No sharp Bragg diffraction peaks on high-resolution PXRD.',
    physicalStateCategory: 'slight_haze',
    analyticalMethod: 'HPLC-UV (Assay) & mDSC (Tg Glass Relaxation)',
    analystName: 'Marcus Vance, M.Sc.',
    analystSignatureId: 'SIG-9391-MV',
    isOos: false,
    isOot: false,
    notes: 'Potency tracking comfortably within 90-110% specification. Minor phase hazing correlates with slow plasticizer migration.',
    createdAt: '2024-09-30T15:45:00Z',
  },
  {
    id: 'obs-006',
    batchId: 'ITZ-ASD-40C75RH-01',
    drugCid: 55283,
    drugName: 'Itraconazole',
    systemType: 'amorphous',
    storageCondition: '40°C / 75% RH (ICH Q1A Accelerated)',
    timepointDay: 90,
    timepointLabel: 'Day 90 (3-Month Final Accelerated)',
    observationDate: '2024-10-30',
    potencyPct: 95.2,
    totalImpuritiesPct: 0.94,
    moistureContentPct: 2.15,
    measuredTg_C: 81.4,
    physicalAppearance: 'Stable amorphous matrix. Minor micro-clusters detected under polarized light; supersaturation parachute test maintains >85% solubility after 120 min.',
    physicalStateCategory: 'slight_haze',
    analyticalMethod: 'RP-UPLC-MS (Related Substances & Impurities)',
    analystName: 'Dr. Sarah Jenkins',
    analystSignatureId: 'SIG-9540-SJ',
    isOos: false,
    isOot: false,
    notes: 'Batch demonstrates 3-month accelerated physical and chemical stability under ICH Q1A 40°C/75% RH conditions. Projected real-time ambient shelf life exceeds 24 months.',
    createdAt: '2024-10-30T16:10:00Z',
  },
];

export const ExperimentalStabilityLog: React.FC<ExperimentalStabilityLogProps> = ({
  currentDrug,
  onOpenGlossary,
}) => {
  // Persistence via localStorage
  const [batches, setBatches] = useState<StabilityBatchMetadata[]>(() => {
    try {
      const saved = localStorage.getItem('pharmacore_stability_batches_v1');
      return saved ? JSON.parse(saved) : INITIAL_BATCHES;
    } catch {
      return INITIAL_BATCHES;
    }
  });

  const [observations, setObservations] = useState<StabilityObservation[]>(() => {
    try {
      const saved = localStorage.getItem('pharmacore_stability_observations_v1');
      return saved ? JSON.parse(saved) : INITIAL_OBSERVATIONS;
    } catch {
      return INITIAL_OBSERVATIONS;
    }
  });

  // Current selected batch filter
  const [selectedBatchId, setSelectedBatchId] = useState<string>(() => {
    // Attempt to match currentDrug
    const match = batches.find((b) => b.drugCid === currentDrug.cid);
    return match ? match.batchId : batches[0]?.batchId || 'ITZ-ASD-40C75RH-01';
  });

  // Update selected batch when currentDrug changes if a batch exists
  useEffect(() => {
    const match = batches.find((b) => b.drugCid === currentDrug.cid);
    if (match) {
      setSelectedBatchId(match.batchId);
    }
  }, [currentDrug.cid, batches]);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('pharmacore_stability_batches_v1', JSON.stringify(batches));
    } catch (e) {
      console.warn('Failed to save batches to localStorage', e);
    }
  }, [batches]);

  useEffect(() => {
    try {
      localStorage.setItem('pharmacore_stability_observations_v1', JSON.stringify(observations));
    } catch (e) {
      console.warn('Failed to save observations to localStorage', e);
    }
  }, [observations]);

  // UI state for adding new observation modal / form
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isNewBatchModalOpen, setIsNewBatchModalOpen] = useState(false);
  const [timelineSortOrder, setTimelineSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterQuery, setFilterQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pass' | 'alert'>('all');

  // Form state for new observation
  const [formTimepointDay, setFormTimepointDay] = useState<number>(30);
  const [formTimepointLabel, setFormTimepointLabel] = useState<string>('Day 30 Pull');
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formPotency, setFormPotency] = useState<number>(98.5);
  const [formImpurities, setFormImpurities] = useState<number>(0.35);
  const [formMoisture, setFormMoisture] = useState<number>(1.2);
  const [formTg, setFormTg] = useState<number>(88.0);
  const [formAppearance, setFormAppearance] = useState<string>(
    'Uniform free-flowing powder; amorphous halo verified under PXRD analysis.'
  );
  const [formPhysicalState, setFormPhysicalState] = useState<
    'intact_glass' | 'slight_haze' | 'nucleation_detected' | 'phase_separated' | 'intact_colloid' | 'flocculated'
  >('intact_glass');
  const [formMethod, setFormMethod] = useState<string>(ANALYTICAL_METHODS[0]);
  const [formAnalyst, setFormAnalyst] = useState<string>('Lead Formulation Scientist');
  const [formNotes, setFormNotes] = useState<string>('Scheduled pull from stability chamber. Specification check confirmed.');
  const [formIsOos, setFormIsOos] = useState<boolean>(false);
  const [formIsOot, setFormIsOot] = useState<boolean>(false);

  // Form state for new batch
  const [newBatchId, setNewBatchId] = useState(`BATCH-${currentDrug.name.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`);
  const [newBatchDesc, setNewBatchDesc] = useState(`${currentDrug.name} formulation development stability test batch`);
  const [newBatchSystem, setNewBatchSystem] = useState<'amorphous' | 'nanoparticle' | 'inhalation'>('amorphous');
  const [newBatchCondition, setNewBatchCondition] = useState(STORAGE_CONDITIONS[0]);
  const [newBatchChamber, setNewBatchChamber] = useState('Chamber-Alpha-ZoneIV');
  const [newBatchPackaging, setNewBatchPackaging] = useState('High-barrier Alu-Alu blister with molecular sieve');

  // Active batch object
  const activeBatch = useMemo(() => {
    return batches.find((b) => b.batchId === selectedBatchId) || batches[0];
  }, [batches, selectedBatchId]);

  // Observations for the active batch
  const batchObservations = useMemo(() => {
    if (!activeBatch) return [];
    return observations
      .filter((o) => o.batchId === activeBatch.batchId)
      .sort((a, b) => {
        if (timelineSortOrder === 'asc') {
          return a.timepointDay - b.timepointDay;
        } else {
          return b.timepointDay - a.timepointDay;
        }
      });
  }, [observations, activeBatch, timelineSortOrder]);

  // Filtered observations
  const filteredObservations = useMemo(() => {
    return batchObservations.filter((obs) => {
      if (filterStatus === 'pass' && (obs.isOos || obs.isOot)) return false;
      if (filterStatus === 'alert' && !(obs.isOos || obs.isOot)) return false;
      if (filterQuery) {
        const q = filterQuery.toLowerCase();
        const matchNote = obs.notes.toLowerCase().includes(q);
        const matchAppearance = obs.physicalAppearance.toLowerCase().includes(q);
        const matchAnalyst = obs.analystName.toLowerCase().includes(q);
        const matchMethod = obs.analyticalMethod.toLowerCase().includes(q);
        if (!matchNote && !matchAppearance && !matchAnalyst && !matchMethod) return false;
      }
      return true;
    });
  }, [batchObservations, filterStatus, filterQuery]);

  // Statistical calculations across timeline
  const stabilityMetrics = useMemo(() => {
    if (batchObservations.length === 0) {
      return {
        count: 0,
        baselinePotency: 100,
        latestPotency: 100,
        potencyLoss: 0,
        rateLossPerDay: 0,
        projectedDaysTo90: 730,
        hasOos: false,
        hasOot: false,
        maxDaysTracked: 0,
      };
    }

    // Sort strictly chronological for slope calculation
    const chrono = [...batchObservations].sort((a, b) => a.timepointDay - b.timepointDay);
    const baseline = chrono[0];
    const latest = chrono[chrono.length - 1];

    const potencyLoss = baseline.potencyPct - latest.potencyPct;
    const daysDiff = Math.max(1, latest.timepointDay - baseline.timepointDay);
    const rateLossPerDay = daysDiff > 0 ? Math.max(0, potencyLoss / daysDiff) : 0;
    const projectedDaysTo90 =
      rateLossPerDay > 0
        ? Math.round((latest.potencyPct - 90.0) / rateLossPerDay)
        : 730;

    const hasOos = chrono.some((o) => o.isOos || o.potencyPct < 90.0 || o.totalImpuritiesPct > 2.0);
    const hasOot = chrono.some((o) => o.isOot);

    return {
      count: chrono.length,
      baselinePotency: baseline.potencyPct,
      latestPotency: latest.potencyPct,
      potencyLoss: parseFloat(potencyLoss.toFixed(2)),
      rateLossPerDay: parseFloat(rateLossPerDay.toFixed(4)),
      projectedDaysTo90: Math.max(0, projectedDaysTo90),
      hasOos,
      hasOot,
      maxDaysTracked: latest.timepointDay,
    };
  }, [batchObservations]);

  // Delete an observation
  const handleDeleteObservation = (id: string) => {
    if (confirm('Are you sure you want to delete this stability observation record? This will update the 21 CFR Part 11 audit log.')) {
      setObservations((prev) => prev.filter((o) => o.id !== id));
    }
  };

  // Add new observation handler
  const handleSaveObservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBatch) return;

    const isAutoOos = formPotency < 90.0 || formImpurities > 2.0;

    const newObs: StabilityObservation = {
      id: `obs-${Date.now()}`,
      batchId: activeBatch.batchId,
      drugCid: activeBatch.drugCid,
      drugName: activeBatch.drugName,
      systemType: activeBatch.systemType,
      storageCondition: activeBatch.storageCondition,
      timepointDay: Number(formTimepointDay),
      timepointLabel: formTimepointLabel.trim() || `Day ${formTimepointDay} Pull`,
      observationDate: formDate,
      potencyPct: Number(formPotency),
      totalImpuritiesPct: Number(formImpurities),
      moistureContentPct: Number(formMoisture),
      measuredTg_C: formTg ? Number(formTg) : undefined,
      physicalAppearance: formAppearance.trim(),
      physicalStateCategory: formPhysicalState,
      analyticalMethod: formMethod,
      analystName: formAnalyst.trim() || 'Formulation Analyst',
      analystSignatureId: `SIG-${Math.floor(1000 + Math.random() * 9000)}-${formAnalyst.slice(0, 2).toUpperCase()}`,
      isOos: formIsOos || isAutoOos,
      isOot: formIsOot,
      notes: formNotes.trim(),
      createdAt: new Date().toISOString(),
    };

    setObservations((prev) => [...prev, newObs]);
    setIsAddModalOpen(false);

    // Reset some fields
    setFormTimepointDay((prev) => prev + 30);
    setFormTimepointLabel(`Day ${Number(formTimepointDay) + 30} Pull`);
  };

  // Create new batch handler
  const handleCreateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    const batch: StabilityBatchMetadata = {
      batchId: newBatchId.trim(),
      drugCid: currentDrug.cid,
      drugName: currentDrug.name,
      formulationDesc: newBatchDesc.trim(),
      systemType: newBatchSystem,
      storageChamberId: newBatchChamber.trim(),
      storageCondition: newBatchCondition,
      mfgDate: new Date().toISOString().split('T')[0],
      packagingSystem: newBatchPackaging.trim(),
      targetAssayPct: 100.0,
    };

    setBatches((prev) => [batch, ...prev]);
    setSelectedBatchId(batch.batchId);
    setIsNewBatchModalOpen(false);

    // Create Day 0 initial release baseline
    const dayZeroObs: StabilityObservation = {
      id: `obs-init-${Date.now()}`,
      batchId: batch.batchId,
      drugCid: batch.drugCid,
      drugName: batch.drugName,
      systemType: batch.systemType,
      storageCondition: batch.storageCondition,
      timepointDay: 0,
      timepointLabel: 'Day 0 (Initial Release)',
      observationDate: new Date().toISOString().split('T')[0],
      potencyPct: 100.0,
      totalImpuritiesPct: 0.08,
      moistureContentPct: 0.95,
      measuredTg_C: currentDrug.category === 'Amorphous Solid Dispersion' ? 95.0 : undefined,
      physicalAppearance: 'Initial freshly prepared formulation batch; complies with preliminary release testing specifications.',
      physicalStateCategory: 'intact_glass',
      analyticalMethod: 'HPLC-UV (Assay) & mDSC (Tg Glass Relaxation)',
      analystName: 'Lead Formulation Scientist',
      analystSignatureId: `SIG-INIT-${Math.floor(1000 + Math.random() * 9000)}`,
      isOos: false,
      isOot: false,
      notes: 'Initial timepoint Day 0 release testing logged. Formal stability chamber pull schedule initiated.',
      createdAt: new Date().toISOString(),
    };

    setObservations((prev) => [...prev, dayZeroObs]);
  };

  // Reset to default sample study
  const handleResetSampleData = () => {
    if (confirm('Reset stability log to standard ICH Q1A benchmark study data? Current changes will be replaced.')) {
      setBatches(INITIAL_BATCHES);
      setObservations(INITIAL_OBSERVATIONS);
      setSelectedBatchId(INITIAL_BATCHES[0].batchId);
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    if (batchObservations.length === 0) return;

    const headers = [
      'Batch ID',
      'API Drug Name',
      'Timepoint (Days)',
      'Timepoint Label',
      'Observation Date',
      'Storage Condition',
      'Potency Assay (% Label Claim)',
      'Total Degradation Impurities (%)',
      'Moisture Content (% w/w KF)',
      'Glass Transition Tg (°C)',
      'Physical Appearance',
      'Analytical Method',
      'Analyst Name',
      'Electronic Signature ID',
      'Specification Status (OOS/OOT)',
      'Analyst Audit Notes',
    ];

    const rows = batchObservations.map((o) => [
      `"${o.batchId}"`,
      `"${o.drugName}"`,
      o.timepointDay,
      `"${o.timepointLabel}"`,
      o.observationDate,
      `"${o.storageCondition}"`,
      o.potencyPct.toFixed(2),
      o.totalImpuritiesPct.toFixed(2),
      o.moistureContentPct.toFixed(2),
      o.measuredTg_C ? o.measuredTg_C.toFixed(1) : 'N/A',
      `"${o.physicalAppearance.replace(/"/g, '""')}"`,
      `"${o.analyticalMethod}"`,
      `"${o.analystName}"`,
      `"${o.analystSignatureId}"`,
      o.isOos ? 'OUT OF SPECIFICATION (OOS)' : o.isOot ? 'OUT OF TREND (OOT)' : 'IN SPECIFICATION (PASS)',
      `"${o.notes.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `PharmaCore_Stability_Log_${activeBatch?.batchId || 'Batch'}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden space-y-0">
      {/* Header Bar */}
      <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-400/30">
              <Calendar className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Experimental Stability Log</span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30">
                ICH Q1A & 21 CFR Part 11
              </span>
            </h3>
          </div>
          <p className="text-xs text-slate-300">
            Record, track, and audit chronological degradation observations, moisture uptake, and glass relaxation across real-world laboratory pull timepoints.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Observation</span>
          </button>

          <button
            onClick={() => setIsNewBatchModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors cursor-pointer"
          >
            <FlaskConical className="w-3.5 h-3.5 text-cyan-300" />
            <span>New Batch</span>
          </button>

          <button
            onClick={handleExportCsv}
            disabled={batchObservations.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
            title="Export official stability log as CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Batch Selector & Metadata Banner */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs">
        {/* Batch Dropdown and Details */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1">
          <div className="space-y-1 w-full sm:w-auto">
            <span className="text-[10px] font-mono uppercase text-slate-500 block font-bold">
              Active Stability Batch:
            </span>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-xs w-full sm:w-64"
            >
              {batches.map((b) => (
                <option key={b.batchId} value={b.batchId}>
                  {b.batchId} ({b.drugName})
                </option>
              ))}
            </select>
          </div>

          {activeBatch && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pl-0 sm:pl-3 sm:border-l border-slate-200 text-[11px] text-slate-600">
              <div>
                <span className="text-slate-400 block font-mono text-[10px]">CONDITION</span>
                <span className="font-semibold text-slate-800 truncate block">
                  {activeBatch.storageCondition}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-mono text-[10px]">CHAMBER</span>
                <span className="font-semibold text-slate-800 truncate block">
                  {activeBatch.storageChamberId}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-mono text-[10px]">PACKAGING</span>
                <span className="font-semibold text-slate-800 truncate block">
                  {activeBatch.packagingSystem}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Reset Sample Button */}
        <div className="flex items-center gap-2 self-end lg:self-center">
          <button
            onClick={handleResetSampleData}
            className="text-[11px] text-slate-500 hover:text-slate-800 underline transition-colors cursor-pointer"
          >
            Reload Benchmark Study
          </button>
        </div>
      </div>

      {/* Analytics Summary Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-y md:divide-y-0 divide-slate-200 border-b border-slate-200 bg-white">
        <div className="p-3.5 space-y-0.5">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">
            PULL CHECKPOINTS
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-slate-900 font-mono">
              {stabilityMetrics.count}
            </span>
            <span className="text-[11px] text-slate-500">
              ({stabilityMetrics.maxDaysTracked} Days)
            </span>
          </div>
          <span className="text-[10px] text-slate-500 block truncate">
            Baseline to Latest pull
          </span>
        </div>

        <div className="p-3.5 space-y-0.5">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">
            LATEST POTENCY ASSAY
          </span>
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-lg font-bold font-mono ${
                stabilityMetrics.latestPotency >= 95.0
                  ? 'text-emerald-700'
                  : stabilityMetrics.latestPotency >= 90.0
                  ? 'text-amber-600'
                  : 'text-rose-600'
              }`}
            >
              {stabilityMetrics.latestPotency.toFixed(1)}%
            </span>
            <span className="text-[10px] text-slate-400">
              (-{stabilityMetrics.potencyLoss}%)
            </span>
          </div>
          <span className="text-[10px] text-slate-500 block">
            Specification: 90.0% – 110.0%
          </span>
        </div>

        <div className="p-3.5 space-y-0.5">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">
            DEGRADATION RATE (k)
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-slate-900 font-mono">
              {stabilityMetrics.rateLossPerDay.toFixed(3)}
            </span>
            <span className="text-[11px] text-slate-500">% / day</span>
          </div>
          <span className="text-[10px] text-slate-500 block">
            Zero-order initial rate slope
          </span>
        </div>

        <div className="p-3.5 space-y-0.5">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">
            PROJECTED SHELF LIFE (90% CUTOFF)
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-blue-700 font-mono">
              {stabilityMetrics.projectedDaysTo90}
            </span>
            <span className="text-[11px] text-slate-500">days</span>
          </div>
          <span className="text-[10px] text-slate-500 block">
            ~{(stabilityMetrics.projectedDaysTo90 / 30.4).toFixed(1)} months at test chamber
          </span>
        </div>

        <div className="p-3.5 space-y-0.5 col-span-2 md:col-span-1">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">
            COMPLIANCE STATUS
          </span>
          <div>
            {stabilityMetrics.hasOos ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-800">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>OOS Triggered</span>
              </span>
            ) : stabilityMetrics.hasOot ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>OOT Flagged</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>In Specification</span>
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-500 block">
            Audited per ICH Q1A guidelines
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-3 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search notes, appearance, or analyst..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center rounded-lg bg-white border border-slate-300 p-0.5 text-xs font-medium">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterStatus === 'all'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({batchObservations.length})
            </button>
            <button
              onClick={() => setFilterStatus('pass')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterStatus === 'pass'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pass
            </button>
            <button
              onClick={() => setFilterStatus('alert')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterStatus === 'alert'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Alerts
            </button>
          </div>

          <button
            onClick={() => setTimelineSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
            className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors"
          >
            {timelineSortOrder === 'asc' ? 'Oldest → Newest' : 'Newest → Oldest'}
          </button>
        </div>
      </div>

      {/* Chronological Timeline Container */}
      <div className="p-6 bg-slate-50/50">
        {filteredObservations.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-xl border border-slate-200 space-y-3">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700">No Stability Observations Found</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              There are no observation logs recorded matching your filter for batch{' '}
              <strong>{activeBatch?.batchId}</strong>. Click "Record Observation" to log laboratory degradation data.
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record First Observation</span>
            </button>
          </div>
        ) : (
          <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
            {filteredObservations.map((obs) => {
              const isAlert = obs.isOos || obs.isOot;
              const potencyColor =
                obs.potencyPct >= 95.0
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  : obs.potencyPct >= 90.0
                  ? 'text-amber-700 bg-amber-50 border-amber-200'
                  : 'text-rose-700 bg-rose-50 border-rose-200';

              return (
                <div key={obs.id} className="relative group">
                  {/* Timeline Node Bullet */}
                  <div
                    className={`absolute -left-6 sm:-left-8 top-3 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-transform group-hover:scale-110 ${
                      obs.isOos
                        ? 'border-rose-600 bg-rose-100 text-rose-700'
                        : obs.isOot
                        ? 'border-amber-500 bg-amber-100 text-amber-700'
                        : obs.timepointDay === 0
                        ? 'border-blue-600 bg-blue-100 text-blue-700'
                        : 'border-emerald-600 bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        obs.isOos
                          ? 'bg-rose-600'
                          : obs.isOot
                          ? 'bg-amber-500'
                          : obs.timepointDay === 0
                          ? 'bg-blue-600'
                          : 'bg-emerald-600'
                      }`}
                    />
                  </div>

                  {/* Card Content */}
                  <div
                    className={`bg-white rounded-xl border p-4 sm:p-5 shadow-xs transition-shadow hover:shadow-md space-y-3 ${
                      isAlert ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
                    }`}
                  >
                    {/* Top Row: Milestone & Date */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 font-mono">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          <span>{obs.timepointLabel}</span>
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                          Day {obs.timepointDay}
                        </span>
                        {obs.isOos && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold border border-rose-200">
                            OOS
                          </span>
                        )}
                        {obs.isOot && !obs.isOos && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold border border-amber-200">
                            OOT
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{obs.observationDate}</span>
                        </span>
                        <button
                          onClick={() => handleDeleteObservation(obs.id)}
                          className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Delete observation"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Middle Row: Core Stability Analytics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      {/* Potency Assay */}
                      <div className={`p-2.5 rounded-lg border ${potencyColor} flex flex-col justify-between`}>
                        <span className="text-[10px] font-mono uppercase font-semibold">
                          Drug Potency Assay
                        </span>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-base font-bold font-mono">
                            {obs.potencyPct.toFixed(2)}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1 mt-1.5 overflow-hidden">
                          <div
                            className={`h-1 rounded-full ${
                              obs.potencyPct >= 95.0
                                ? 'bg-emerald-600'
                                : obs.potencyPct >= 90.0
                                ? 'bg-amber-500'
                                : 'bg-rose-600'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(0, obs.potencyPct))}%` }}
                          />
                        </div>
                      </div>

                      {/* Degradation Impurities */}
                      <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex flex-col justify-between">
                        <span className="text-[10px] font-mono uppercase text-slate-500">
                          Total Impurities
                        </span>
                        <span className="text-base font-bold text-slate-800 font-mono mt-1">
                          {obs.totalImpuritiesPct.toFixed(2)}%
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Limit: &lt; 2.0% w/w
                        </span>
                      </div>

                      {/* Moisture Content */}
                      <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex flex-col justify-between">
                        <span className="text-[10px] font-mono uppercase text-slate-500 flex items-center gap-1">
                          <Droplets className="w-3 h-3 text-cyan-600" />
                          <span>Moisture (KF)</span>
                        </span>
                        <span className="text-base font-bold text-slate-800 font-mono mt-1">
                          {obs.moistureContentPct.toFixed(2)}%
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Karl Fischer coulometric
                        </span>
                      </div>

                      {/* Glass Transition / Physical parameter */}
                      <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex flex-col justify-between">
                        <span className="text-[10px] font-mono uppercase text-slate-500 flex items-center gap-1">
                          <Thermometer className="w-3 h-3 text-amber-600" />
                          <span>Measured Tg (mDSC)</span>
                        </span>
                        <span className="text-base font-bold text-slate-800 font-mono mt-1">
                          {obs.measuredTg_C ? `${obs.measuredTg_C.toFixed(1)} °C` : 'N/A'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Amorphous relaxation
                        </span>
                      </div>
                    </div>

                    {/* Bottom: Physical Observation & Analyst Notes */}
                    <div className="space-y-2 pt-1 text-xs">
                      <div>
                        <span className="font-semibold text-slate-800 block text-[11px] mb-0.5">
                          Physical Appearance & Morphology:
                        </span>
                        <p className="text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200 leading-relaxed text-[11px]">
                          {obs.physicalAppearance}
                        </p>
                      </div>

                      {obs.notes && (
                        <div>
                          <span className="font-semibold text-slate-800 block text-[11px] mb-0.5">
                            Analyst Scientific Notes & Audit Trail:
                          </span>
                          <p className="text-slate-600 text-[11px] leading-relaxed italic">
                            "{obs.notes}"
                          </p>
                        </div>
                      )}

                      {/* Audit Strip */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-mono">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 text-slate-600 font-semibold">
                            <UserCheck className="w-3 h-3 text-blue-600" />
                            <span>{obs.analystName}</span>
                          </span>
                          <span>·</span>
                          <span>Signature ID: {obs.analystSignatureId}</span>
                        </div>
                        <div>
                          <span>Method: {obs.analyticalMethod}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Record Observation Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Record Stability Degradation Observation
                  </h3>
                  <p className="text-xs text-slate-500">
                    Batch: {activeBatch?.batchId} ({activeBatch?.drugName})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSaveObservation} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Timepoint Day */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Timepoint (Days Elapsed):
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formTimepointDay}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setFormTimepointDay(val);
                      setFormTimepointLabel(`Day ${val} Pull`);
                    }}
                    required
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                  />
                </div>

                {/* Timepoint Label */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Timepoint Milestone Label:
                  </label>
                  <input
                    type="text"
                    value={formTimepointLabel}
                    onChange={(e) => setFormTimepointLabel(e.target.value)}
                    required
                    placeholder="e.g. Day 30 Pull or 1-Month Milestone"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 text-xs"
                  />
                </div>

                {/* Observation Date */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Observation Date:
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 text-xs"
                  />
                </div>

                {/* Potency Assay */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Potency Assay (% Label Claim):
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="150"
                    step="0.01"
                    value={formPotency}
                    onChange={(e) => setFormPotency(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                  />
                </div>

                {/* Total Impurities */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Total Impurities / Degradants (% w/w):
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    step="0.01"
                    value={formImpurities}
                    onChange={(e) => setFormImpurities(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                  />
                </div>

                {/* Moisture Content */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Karl Fischer Moisture (% w/w):
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    step="0.01"
                    value={formMoisture}
                    onChange={(e) => setFormMoisture(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                  />
                </div>

                {/* Measured Tg (mDSC) */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Measured Glass Transition Tg (°C):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formTg}
                    onChange={(e) => setFormTg(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                  />
                </div>

                {/* Analytical Technique */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Analytical Method:
                  </label>
                  <select
                    value={formMethod}
                    onChange={(e) => setFormMethod(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 text-xs"
                  >
                    {ANALYTICAL_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Physical State Category */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Physical Matrix State:
                </label>
                <select
                  value={formPhysicalState}
                  onChange={(e) => setFormPhysicalState(e.target.value as any)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 text-xs"
                >
                  {PHYSICAL_APPEARANCE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Physical Appearance Details */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Detailed Physical Appearance Observation:
                </label>
                <textarea
                  rows={2}
                  value={formAppearance}
                  onChange={(e) => setFormAppearance(e.target.value)}
                  required
                  placeholder="Record powder texture, coloration, visual sintering, cake formation..."
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 text-xs"
                />
              </div>

              {/* Analyst Name */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Analyst Name / Investigator:
                </label>
                <input
                  type="text"
                  value={formAnalyst}
                  onChange={(e) => setFormAnalyst(e.target.value)}
                  required
                  placeholder="e.g. Dr. Sarah Jenkins"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 text-xs"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Audit Notes & Corrective Actions:
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Enter 21 CFR Part 11 audit commentary, OOS investigation notes..."
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 text-xs"
                />
              </div>

              {/* Out of Trend / Out of Specification Flags */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-6">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsOos}
                    onChange={(e) => setFormIsOos(e.target.checked)}
                    className="rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span className="font-bold text-rose-800">
                    Flag as Out of Specification (OOS)
                  </span>
                </label>

                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsOot}
                    onChange={(e) => setFormIsOot(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="font-bold text-amber-800">
                    Flag as Out of Trend (OOT)
                  </span>
                </label>
              </div>

              {/* Footer Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-xs"
                >
                  Sign & Save Observation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Batch Modal */}
      {isNewBatchModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Register New Stability Test Batch
                </h3>
              </div>
              <button
                onClick={() => setIsNewBatchModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Unique Batch Identification (Batch ID):
                </label>
                <input
                  type="text"
                  value={newBatchId}
                  onChange={(e) => setNewBatchId(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Active Drug Compound:
                </label>
                <input
                  type="text"
                  disabled
                  value={`${currentDrug.name} (CID: ${currentDrug.cid})`}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-100 text-slate-600 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Formulation Description:
                </label>
                <textarea
                  rows={2}
                  value={newBatchDesc}
                  onChange={(e) => setNewBatchDesc(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    System Architecture:
                  </label>
                  <select
                    value={newBatchSystem}
                    onChange={(e) => setNewBatchSystem(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 text-xs"
                  >
                    <option value="amorphous">Amorphous Solid Dispersion (ASD)</option>
                    <option value="nanoparticle">Targeted Lipid Nanoparticle (LNP)</option>
                    <option value="inhalation">Inhalation Aerosol (DPI/MDI)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Storage Chamber Condition:
                  </label>
                  <select
                    value={newBatchCondition}
                    onChange={(e) => setNewBatchCondition(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 text-xs"
                  >
                    {STORAGE_CONDITIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Chamber Unit / Location:
                  </label>
                  <input
                    type="text"
                    value={newBatchChamber}
                    onChange={(e) => setNewBatchChamber(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Packaging / Container Closure:
                  </label>
                  <input
                    type="text"
                    value={newBatchPackaging}
                    onChange={(e) => setNewBatchPackaging(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewBatchModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-xs"
                >
                  Register Batch & Initialize Day 0
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
