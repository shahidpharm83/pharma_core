import React, { useState, useMemo, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Database,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  FlaskConical,
  Plus,
  Trash2,
  Copy,
  Check,
  Layers,
  Sparkles,
  RefreshCw,
  Info,
  CheckCircle2,
  XCircle,
  FileText,
  Sliders,
  Building,
  Eye,
  ChevronRight,
  ShieldAlert,
  HelpCircle,
  Activity,
  HeartPulse,
  Atom,
  Wrench,
  RotateCcw,
  AlertCircle,
  ArrowRight,
  BarChart2,
  Calendar,
} from 'lucide-react';
import { CompoundProperties } from '../types/pharmadds';
import {
  FDA_IID_FLAT_DATABASE,
  IidExcipientRecord,
  DOSAGE_FORM_PRESET_TEMPLATES,
  DosageFormPresetTemplate,
} from '../data/fdaIidDatabase';
import {
  searchOpenFdaLabels,
  searchNihGsrsSubstances,
  getUcsfCersiProfile,
  queryFdaIidAsync,
  fetchUcsfCersiProfiles,
  OpenFdaLabelResult,
  NihGsrsResult,
  UcsfCersiResult,
} from '../services/formulatorApis';
import {
  detectDrugFunctionalGroups,
  evaluateDrugExcipientCompatibility,
  evaluateSingleExcipientCompatibility,
  DrugFunctionalGroup,
  ExcipientCompatibilityResult,
  CompatibilityRiskLevel,
} from '../services/drugExcipientCompatibility';
import { FdaIidLimitChart, ExcipientChartItem } from './FdaIidLimitChart';
import { RegulatoryStabilityDashboard } from './RegulatoryStabilityDashboard';
import { DoePlannerStudio } from './DoePlannerStudio';
import { RegulatoryComplianceStudio } from './RegulatoryComplianceStudio';

interface FormulatorStudioProps {
  currentDrug: CompoundProperties;
  onOpenGlossary?: (termId?: string) => void;
}

interface FormulationIngredientItem {
  id: string;
  excipient: IidExcipientRecord;
  route: string;
  dosageForm: string;
  proposedAmountMg: number;
  roleNote?: string;
}

export const FormulatorStudio: React.FC<FormulatorStudioProps> = ({
  currentDrug,
  onOpenGlossary,
}) => {
  // Navigation tabs within Formulator Studio
  const [activeSubTab, setActiveSubTab] = useState<
    | 'recipe_builder'
    | 'doe_planner'
    | 'stability_dashboard'
    | 'iid_limits_chart'
    | 'compatibility'
    | 'regulatory_compliance'
    | 'fda_iid'
    | 'openfda'
    | 'nih_gsrs'
    | 'ucsf_cersi'
    | 'hub'
  >('recipe_builder');

  // 1. openFDA State
  const [openFdaSearch, setOpenFdaSearch] = useState<string>(currentDrug.name);
  const [openFdaResults, setOpenFdaResults] = useState<OpenFdaLabelResult[]>([]);
  const [isOpenFdaLoading, setIsOpenFdaLoading] = useState<boolean>(false);

  // 2. NIH GSRS State
  const [gsrsSearch, setGsrsSearch] = useState<string>('HPMC-AS');
  const [gsrsResults, setGsrsResults] = useState<NihGsrsResult[]>([]);
  const [isGsrsLoading, setIsGsrsLoading] = useState<boolean>(false);

  // 3. FDA IID Flat File Search State
  const [iidQuery, setIidQuery] = useState<string>('');
  const [selectedRoute, setSelectedRoute] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // 4. Formulation Recipe Builder State
  const [selectedPresetId, setSelectedPresetId] = useState<string>('oral_asd_tablet');
  const [recipeRoute, setRecipeRoute] = useState<string>('Oral');
  const [recipeDosageForm, setRecipeDosageForm] = useState<string>('Tablet');
  const [drugDoseMg, setDrugDoseMg] = useState<number>(50);
  const [dosingFrequency, setDosingFrequency] = useState<'QD' | 'BID' | 'TID' | 'QID' | 'CUSTOM'>('BID');
  const [customDosesPerDay, setCustomDosesPerDay] = useState<number>(2);

  // Candidate excipient screener state (testing excipients not loaded in active recipe)
  const [screenerExcipientId, setScreenerExcipientId] = useState<string>('lactose_monohydrate');

  // Selected excipient for deep profile drawer/modal
  const [inspectedExcipient, setInspectedExcipient] = useState<IidExcipientRecord | null>(null);

  // Recipe items state initialized with ASD Oral Tablet preset
  const [recipeItems, setRecipeItems] = useState<FormulationIngredientItem[]>(() => {
    const preset = DOSAGE_FORM_PRESET_TEMPLATES[0];
    return preset.ingredients.map((ing, idx) => {
      const exc = FDA_IID_FLAT_DATABASE.find((e) => e.id === ing.excipientId) || FDA_IID_FLAT_DATABASE[0];
      return {
        id: `rec_${idx}_${ing.excipientId}`,
        excipient: exc,
        route: preset.route,
        dosageForm: preset.dosageForm,
        proposedAmountMg: ing.proposedAmountMg,
        roleNote: ing.roleNote,
      };
    });
  });

  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Compute effective doses per day
  const effectiveDosesPerDay = useMemo(() => {
    switch (dosingFrequency) {
      case 'QD':
        return 1;
      case 'BID':
        return 2;
      case 'TID':
        return 3;
      case 'QID':
        return 4;
      case 'CUSTOM':
        return Math.max(1, customDosesPerDay);
      default:
        return 2;
    }
  }, [dosingFrequency, customDosesPerDay]);

  // Initial load for openFDA with current drug
  useEffect(() => {
    handleRunOpenFdaSearch(currentDrug.name);
    handleRunGsrsSearch('HPMC-AS');
  }, [currentDrug.name]);

  const handleRunOpenFdaSearch = async (term: string) => {
    if (!term.trim()) return;
    setIsOpenFdaLoading(true);
    try {
      const results = await searchOpenFdaLabels(term);
      setOpenFdaResults(results);
    } finally {
      setIsOpenFdaLoading(false);
    }
  };

  const handleRunGsrsSearch = async (term: string) => {
    if (!term.trim()) return;
    setIsGsrsLoading(true);
    try {
      const results = await searchNihGsrsSubstances(term);
      setGsrsResults(results);
    } finally {
      setIsGsrsLoading(false);
    }
  };

  // Filtered IID database records via Real API
  const [filteredIidRecords, setFilteredIidRefRecords] = useState<IidExcipientRecord[]>([]);
  const [isIidLoading, setIsIidLoading] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    setIsIidLoading(true);
    queryFdaIidAsync({
      search: iidQuery,
      route: selectedRoute,
      category: selectedCategory,
    }).then((res) => {
      if (isMounted) {
        setFilteredIidRefRecords(res);
        setIsIidLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [iidQuery, selectedRoute, selectedCategory]);

  // Handle Preset Selection (Dynamically loads relevant excipients for selected dosage form)
  const handleApplyPreset = (presetId: string) => {
    const preset = DOSAGE_FORM_PRESET_TEMPLATES.find((p) => p.id === presetId);
    if (!preset) return;

    setSelectedPresetId(preset.id);
    setRecipeRoute(preset.route);
    setRecipeDosageForm(preset.dosageForm);
    setDrugDoseMg(preset.defaultDoseMg);
    setDosingFrequency(preset.dosingFrequency);
    setCustomDosesPerDay(preset.dosesPerDay);

    const newItems: FormulationIngredientItem[] = preset.ingredients.map((ing, idx) => {
      const exc = FDA_IID_FLAT_DATABASE.find((e) => e.id === ing.excipientId) || FDA_IID_FLAT_DATABASE[0];
      return {
        id: `rec_${Date.now()}_${idx}`,
        excipient: exc,
        route: preset.route,
        dosageForm: preset.dosageForm,
        proposedAmountMg: ing.proposedAmountMg,
        roleNote: ing.roleNote,
      };
    });
    setRecipeItems(newItems);
  };

  // =========================================================================
  // DYNAMIC DRUG FUNCTIONAL GROUP & EXCIPIENT COMPATIBILITY ENGINE
  // =========================================================================
  const drugFunctionalGroups = useMemo(() => {
    return detectDrugFunctionalGroups(currentDrug);
  }, [currentDrug]);

  const presentFunctionalGroups = useMemo(() => {
    return drugFunctionalGroups.filter((g) => g.isPresent);
  }, [drugFunctionalGroups]);

  // Dynamic compatibility evaluation across all excipients loaded in the formulation
  const recipeCompatibilityResults = useMemo(() => {
    return evaluateDrugExcipientCompatibility(
      currentDrug,
      recipeItems.map((item) => item.excipient)
    );
  }, [currentDrug, recipeItems]);

  // Compatibility map for quick row-level lookup
  const compatibilityMap = useMemo(() => {
    const map = new Map<string, ExcipientCompatibilityResult>();
    recipeCompatibilityResults.forEach((res) => {
      map.set(res.excipientId, res);
    });
    return map;
  }, [recipeCompatibilityResults]);

  // Compatibility statistics
  const compatibilityStats = useMemo(() => {
    let highRisk = 0;
    let moderateRisk = 0;
    let compatible = 0;
    recipeCompatibilityResults.forEach((res) => {
      if (res.riskLevel === 'HIGH_RISK') highRisk++;
      else if (res.riskLevel === 'MODERATE_RISK') moderateRisk++;
      else compatible++;
    });
    return {
      highRisk,
      moderateRisk,
      compatible,
      total: recipeCompatibilityResults.length,
      hasIncompatibility: highRisk > 0,
    };
  }, [recipeCompatibilityResults]);

  // Candidate Screener Excipient (tests excipients not loaded in active recipe)
  const screenerExcipient = useMemo(() => {
    return (
      FDA_IID_FLAT_DATABASE.find((e) => e.id === screenerExcipientId) ||
      FDA_IID_FLAT_DATABASE[0]
    );
  }, [screenerExcipientId]);

  const screenerCompatibilityResult = useMemo(() => {
    return evaluateSingleExcipientCompatibility(currentDrug, screenerExcipient);
  }, [currentDrug, screenerExcipient]);

  const isScreenerExcipientLoadedInRecipe = useMemo(() => {
    return recipeItems.some((item) => item.excipient.id === screenerExcipient.id);
  }, [recipeItems, screenerExcipient]);

  // Auto-mitigation handler
  const handleAutoMitigate = (itemToReplaceId: string, alternativeExcipientId?: string) => {
    if (!alternativeExcipientId) return;
    const altExcipient = FDA_IID_FLAT_DATABASE.find((e) => e.id === alternativeExcipientId);
    if (!altExcipient) return;

    setRecipeItems((prev) =>
      prev.map((item) => {
        if (item.id === itemToReplaceId) {
          return {
            ...item,
            excipient: altExcipient,
            roleNote: altExcipient.roleInFormula,
          };
        }
        return item;
      })
    );
  };

  // DOE Planner Injection Handler: Replaces/Updates Polymeric Carrier & Surfactant with optimized ratios
  const handleApplyDoeToRecipe = ({
    targetDrugDoseMg,
    polymerExcipient,
    polymerMg,
    surfactantExcipient,
    surfactantMg,
    doeCandidateTitle,
  }: {
    targetDrugDoseMg: number;
    polymerExcipient: IidExcipientRecord;
    polymerMg: number;
    surfactantExcipient: IidExcipientRecord;
    surfactantMg: number;
    doeCandidateTitle: string;
  }) => {
    setDrugDoseMg(targetDrugDoseMg);

    setRecipeItems((prev) => {
      // Retain excipients that are not polymers or surfactants (e.g. disintegrant, lubricant, filler)
      const nonPolymerOrSurf = prev.filter(
        (item) =>
          item.excipient.functionalCategory !== 'Polymeric Carrier' &&
          item.excipient.functionalCategory !== 'Surfactant / Solubilizer' &&
          item.excipient.id !== polymerExcipient.id &&
          item.excipient.id !== surfactantExcipient.id
      );

      const newPolymerItem: FormulationIngredientItem = {
        id: `rec_doe_${Date.now()}_poly`,
        excipient: polymerExcipient,
        route: recipeRoute,
        dosageForm: recipeDosageForm,
        proposedAmountMg: polymerMg,
        roleNote: `DOE Optimized Polymeric Carrier (${doeCandidateTitle})`,
      };

      const newSurfactantItem: FormulationIngredientItem = {
        id: `rec_doe_${Date.now()}_surf`,
        excipient: surfactantExcipient,
        route: recipeRoute,
        dosageForm: recipeDosageForm,
        proposedAmountMg: surfactantMg,
        roleNote: `DOE Optimized Surfactant / Wetting Agent (${doeCandidateTitle})`,
      };

      return [newPolymerItem, newSurfactantItem, ...nonPolymerOrSurf];
    });

    setActiveSubTab('recipe_builder');
  };

  // =========================================================================
  // EXCIPIENT SAFETY CROSS-CHECK ENGINE
  // =========================================================================
  const safetyAudit = useMemo(() => {
    const totalExcipientMg = recipeItems.reduce((acc, item) => acc + item.proposedAmountMg, 0);
    const totalUnitDoseMassMg = drugDoseMg + totalExcipientMg;
    const drugLoadingPct = (drugDoseMg / totalUnitDoseMassMg) * 100;

    let flaggedCount = 0;
    let warningCount = 0;
    let passCount = 0;

    const auditedIngredients = recipeItems.map((item) => {
      // 1. Check unit dose limit from IID records
      const matchedRecord =
        item.excipient.maxPotencyRecords.find(
          (m) =>
            m.route.toLowerCase() === recipeRoute.toLowerCase() &&
            (m.dosageForm.toLowerCase().includes(recipeDosageForm.toLowerCase()) ||
              recipeDosageForm.toLowerCase().includes(m.dosageForm.toLowerCase()))
        ) ||
        item.excipient.maxPotencyRecords.find(
          (m) => m.route.toLowerCase() === recipeRoute.toLowerCase()
        ) ||
        item.excipient.maxPotencyRecords[0];

      const unitMaxPotencyLimit = matchedRecord?.maxPotency || 500;
      const unit = matchedRecord?.unit || 'mg';

      // 2. Calculate daily intake
      const proposedDailyIntakeMg = item.proposedAmountMg * effectiveDosesPerDay;
      const maxDailyIntakeLimit = item.excipient.maxDailyIntakeMg;

      // 3. ADI threshold for 60kg adult
      const cersiAdiMgPerKg = item.excipient.ucsfCersi.adi_mg_kg || 25;
      const adult60kgAdiLimitMg = cersiAdiMgPerKg * 60;

      // 4. Evaluate Safety Flags
      const exceedsUnitLimit = item.proposedAmountMg > unitMaxPotencyLimit;
      const exceedsMdiLimit = proposedDailyIntakeMg > maxDailyIntakeLimit;

      // Utilization ratios
      const unitUtilizationPct = (item.proposedAmountMg / unitMaxPotencyLimit) * 100;
      const mdiUtilizationPct = (proposedDailyIntakeMg / maxDailyIntakeLimit) * 100;

      let safetyStatus: 'PASS' | 'WARNING' | 'FLAG_EXCEEDED' = 'PASS';
      let regulatoryNotice = '';

      if (exceedsMdiLimit || exceedsUnitLimit) {
        safetyStatus = 'FLAG_EXCEEDED';
        flaggedCount++;
        if (exceedsMdiLimit) {
          const delta = proposedDailyIntakeMg - maxDailyIntakeLimit;
          regulatoryNotice = `EXCEEDS FDA IID MDI: Daily intake ${proposedDailyIntakeMg.toFixed(1)} mg/day exceeds historical maximum precedent of ${maxDailyIntakeLimit} mg/day by +${delta.toFixed(1)} mg/day (+${((delta / maxDailyIntakeLimit) * 100).toFixed(0)}%). Nonclinical safety qualification required under FDA CDER Excipient Guidance.`;
        } else {
          regulatoryNotice = `EXCEEDS UNIT PRECEDENT: Proposed unit potency ${item.proposedAmountMg} ${unit} exceeds historical precedent of ${unitMaxPotencyLimit} ${unit}. Requires formulation justification or bridge toxicology data.`;
        }
      } else if (unitUtilizationPct > 80 || mdiUtilizationPct > 80) {
        safetyStatus = 'WARNING';
        warningCount++;
        regulatoryNotice = `APPROACHING CEILING: Formula utilizes ${Math.max(unitUtilizationPct, mdiUtilizationPct).toFixed(0)}% of FDA approved historical threshold. Acceptable, but close to historical maximum precedent.`;
      } else {
        passCount++;
        regulatoryNotice = `WITHIN FDA LIMITS: Within precedent limits (Unit: ${unitUtilizationPct.toFixed(0)}% of max, Daily MDI: ${mdiUtilizationPct.toFixed(0)}% of max). Meets standard FDA CDER criteria.`;
      }

      // Check chemical compatibility for this excipient
      const compResult = compatibilityMap.get(item.excipient.id);

      return {
        ...item,
        unitMaxPotencyLimit,
        unit,
        proposedDailyIntakeMg,
        maxDailyIntakeLimit,
        adult60kgAdiLimitMg,
        unitUtilizationPct,
        mdiUtilizationPct,
        safetyStatus,
        regulatoryNotice,
        compatibilityResult: compResult,
        isRoutePrecedentMatched: item.excipient.routes.some(
          (r) => r.toLowerCase() === recipeRoute.toLowerCase()
        ),
      };
    });

    const isOverallCompliant = flaggedCount === 0;

    return {
      totalExcipientMg,
      totalUnitDoseMassMg,
      drugLoadingPct,
      auditedIngredients,
      isOverallCompliant,
      flaggedCount,
      warningCount,
      passCount,
    };
  }, [recipeItems, drugDoseMg, recipeRoute, recipeDosageForm, effectiveDosesPerDay, compatibilityMap]);

  // Map audited ingredients to chart items for Recharts FDA IID limit visualization
  const excipientChartItems: ExcipientChartItem[] = useMemo(() => {
    return safetyAudit.auditedIngredients.map((item) => ({
      id: item.id,
      name: item.excipient.name,
      category: item.excipient.functionalCategory,
      route: item.route,
      proposedUnitDoseMg: item.proposedAmountMg,
      fdaIidUnitMaxMg: item.unitMaxPotencyLimit,
      unit: item.unit,
      proposedDailyIntakeMg: item.proposedDailyIntakeMg,
      fdaIidDailyMaxMg: item.maxDailyIntakeLimit,
      unitUtilizationPct: item.unitUtilizationPct,
      dailyUtilizationPct: item.mdiUtilizationPct,
      safetyStatus: item.safetyStatus,
    }));
  }, [safetyAudit.auditedIngredients]);

  const handleAddIngredient = (excipient: IidExcipientRecord) => {
    const existing = recipeItems.find((r) => r.excipient.id === excipient.id);
    if (existing) {
      handleUpdateAmount(existing.id, existing.proposedAmountMg + 10);
      return;
    }

    const matchedRecord =
      excipient.maxPotencyRecords.find(
        (m) => m.route.toLowerCase() === recipeRoute.toLowerCase()
      ) || excipient.maxPotencyRecords[0];

    const safeAmount = Math.max(0.1, Math.round((matchedRecord?.maxPotency || 50) * 0.35 * 10) / 10);

    const newItem: FormulationIngredientItem = {
      id: `rec_${Date.now()}_${excipient.id}`,
      excipient,
      route: recipeRoute,
      dosageForm: recipeDosageForm,
      proposedAmountMg: safeAmount,
      roleNote: excipient.roleInFormula,
    };
    setRecipeItems([...recipeItems, newItem]);
  };

  const handleRemoveIngredient = (id: string) => {
    setRecipeItems(recipeItems.filter((i) => i.id !== id));
  };

  const handleUpdateAmount = (id: string, amount: number) => {
    setRecipeItems(
      recipeItems.map((i) =>
        i.id === id ? { ...i, proposedAmountMg: Math.max(0.01, amount) } : i
      )
    );
  };

  const handleCopyRecipeDossier = () => {
    const jsonStr = JSON.stringify(
      {
        formulationMetadata: {
          activeDrug: currentDrug.name,
          pubChemCid: currentDrug.cid,
          molecularWeight: currentDrug.molecularWeight,
          bcsClass: currentDrug.bcsClass,
          dosageForm: recipeDosageForm,
          deliveryRoute: recipeRoute,
          activeUnitDoseMg: drugDoseMg,
          dosingFrequency: `${dosingFrequency} (${effectiveDosesPerDay} doses/day)`,
          totalDailyDrugIntakeMg: drugDoseMg * effectiveDosesPerDay,
          totalUnitDoseWeightMg: Number(safetyAudit.totalUnitDoseMassMg.toFixed(2)),
          drugLoadingPercent: Number(safetyAudit.drugLoadingPct.toFixed(2)),
          safetyAuditStatus: safetyAudit.isOverallCompliant
            ? 'COMPLIANT_WITH_FDA_IID'
            : 'NON_COMPLIANT_EXCEEDS_MDI',
          chemicalCompatibilityStatus:
            compatibilityStats.highRisk > 0
              ? 'HIGH_RISK_INCOMPATIBILITY_DETECTED'
              : compatibilityStats.moderateRisk > 0
              ? 'MODERATE_RISK_PRECEDENT'
              : 'COMPATIBLE_USP_NF',
          guidanceReference:
            'FDA CDER/CBER Guidance for Industry: Nonclinical Studies for the Safety Evaluation of Pharmaceutical Excipients & USP/NF <1059>',
        },
        detectedDrugFunctionalGroups: presentFunctionalGroups.map((g) => ({
          name: g.name,
          formula: g.formulaLabel,
          reactivity: g.reactivityProfile,
        })),
        safetyCrossCheckAudit: safetyAudit.auditedIngredients.map((ing) => ({
          excipientName: ing.excipient.name,
          unii: ing.excipient.unii,
          functionalRole: ing.excipient.roleInFormula,
          proposedUnitDoseMg: ing.proposedAmountMg,
          proposedDailyIntakeMg: ing.proposedDailyIntakeMg,
          fdaIidMaxPotencyPerUnit: `${ing.unitMaxPotencyLimit} ${ing.unit}`,
          fdaIidMaxDailyIntakeLimitMg: ing.maxDailyIntakeLimit,
          complianceStatus: ing.safetyStatus,
          uspChemicalCompatibility: ing.compatibilityResult?.riskLevel || 'COMPATIBLE',
          degradationPathway: ing.compatibilityResult?.degradationPathway,
          chemicalMechanism: ing.compatibilityResult?.chemicalMechanism,
          uspNfReference: ing.compatibilityResult?.uspNfReference,
          mitigationStrategy: ing.compatibilityResult?.mitigationStrategy,
        })),
      },
      null,
      2
    );
    navigator.clipboard.writeText(jsonStr);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <section id="formulator" className="py-6 space-y-6">
      {/* Studio Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded bg-blue-100 text-blue-700">
                <FlaskConical className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                07. Formulator Studio — Multi-Dosage Form Design & Excipient Compatibility Matrix
              </h2>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                USP/NF & FDA IID Intelligence
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Cross-reference chosen polymers and surfactants with drug functional groups, predict USP/NF chemical degradation pathways, and validate against FDA IID Maximum Daily Intake (MDI) limits.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-500">Candidate API:</span>
            <span className="font-semibold text-slate-800">{currentDrug.name}</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
              {currentDrug.bcsClass}
            </span>
            <button
              type="button"
              onClick={() => onOpenGlossary?.('fda_iid')}
              className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 ml-2 font-medium"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>FDA IID & USP Glossary</span>
            </button>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex flex-wrap items-center gap-1.5 mt-4 pt-4 border-t border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => setActiveSubTab('recipe_builder')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'recipe_builder'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Formulator & Safety Cross-Check</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('doe_planner')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'doe_planner'
                ? 'bg-gradient-to-r from-indigo-700 to-purple-700 text-white shadow-2xs'
                : 'text-indigo-800 bg-indigo-50/90 hover:bg-indigo-100 border border-indigo-200/60'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>DOE Planner (QbD Grid-Search)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-indigo-200 text-indigo-900">
              Optimal Space
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('stability_dashboard')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'stability_dashboard'
                ? 'bg-teal-700 text-white shadow-2xs'
                : 'text-teal-800 bg-teal-50 hover:bg-teal-100'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Regulatory Stability Dashboard (ICH Q1A)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('iid_limits_chart')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'iid_limits_chart'
                ? 'bg-purple-700 text-white shadow-2xs'
                : 'text-purple-700 bg-purple-50 hover:bg-purple-100'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>FDA IID Limit Chart (Recharts)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('compatibility')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'compatibility'
                ? 'bg-rose-700 text-white shadow-2xs'
                : 'text-rose-700 bg-rose-50 hover:bg-rose-100'
            }`}
          >
            <Atom className="w-3.5 h-3.5" />
            <span>Excipient Compatibility Matrix (USP/NF)</span>
            {compatibilityStats.highRisk > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-rose-200 text-rose-900">
                {compatibilityStats.highRisk} Flag
              </span>
            )}
            {compatibilityStats.highRisk === 0 && compatibilityStats.moderateRisk > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-200 text-amber-900">
                {compatibilityStats.moderateRisk} Caution
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('regulatory_compliance')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'regulatory_compliance'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'text-amber-800 bg-amber-50 hover:bg-amber-100'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Regulatory Compliance (FDA/EMA)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('fda_iid')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
              activeSubTab === 'fda_iid'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            FDA IID Database & Excipient Dossiers
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('openfda')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
              activeSubTab === 'openfda'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            openFDA Drug Labels
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('nih_gsrs')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
              activeSubTab === 'nih_gsrs'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            NIH GSRS Registry
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('ucsf_cersi')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
              activeSubTab === 'ucsf_cersi'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            UCSF CERSI Safety
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('hub')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
              activeSubTab === 'hub'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Resource Comparison Table
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. RECIPE BUILDER & EXCIPIENT SAFETY CROSS-CHECK                          */}
      {/* ========================================================================= */}
      {activeSubTab === 'recipe_builder' && (
        <div className="space-y-5">
          {/* Top Level: Dosage Form Starter Template Selector */}
          <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-lg p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 font-semibold">
                  Multi-Dosage Form Engine
                </span>
                <h3 className="text-lg font-bold text-white mt-1">
                  Design Formulation for Any Pharmaceutical Dosage Form
                </h3>
                <p className="text-xs text-indigo-200/80">
                  Select a validated starter platform or design custom formulations across Oral Solid, Inhalation, Parenteral Nanomedicine, and Oral Liquids.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyRecipeDossier}
                  className="px-3 py-1.5 text-xs font-semibold rounded-md bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1.5 border border-white/20"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'Copied Full Dossier!' : 'Copy Dossier JSON'}</span>
                </button>
              </div>
            </div>

            {/* Starter Presets Pills */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-indigo-200 block">
                Load 1-Click Starter Formulation Template:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {DOSAGE_FORM_PRESET_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => handleApplyPreset(tmpl.id)}
                    className={`text-left p-2.5 rounded-lg border text-xs transition-all ${
                      selectedPresetId === tmpl.id
                        ? 'bg-indigo-600/90 border-indigo-300 shadow-sm text-white'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-200'
                    }`}
                  >
                    <div className="font-bold truncate">{tmpl.name}</div>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-indigo-200">
                      <span>{tmpl.category}</span>
                      <span className="font-mono">{tmpl.defaultDoseMg} mg</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Dosing Parameters & Delivery Target */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-slate-700" />
              <span>Dosing Regimen & Delivery Target</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="text-slate-700 font-bold block mb-1">Target Route:</label>
                <select
                  value={recipeRoute}
                  onChange={(e) => setRecipeRoute(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-semibold text-slate-800"
                >
                  <option value="Oral">Oral (Tablets, Capsules, Solutions)</option>
                  <option value="Inhalation">Inhalation (DPI, pMDI, Nebulizer)</option>
                  <option value="Intravenous">Intravenous (LNPs, Liposomes, Vials)</option>
                  <option value="Intramuscular">Intramuscular (Nano-suspensions)</option>
                  <option value="Subcutaneous">Subcutaneous (mAbs, Peptides)</option>
                  <option value="Ophthalmic">Ophthalmic (Drops, Microemulsions)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Dosage Form:</label>
                <select
                  value={recipeDosageForm}
                  onChange={(e) => setRecipeDosageForm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-semibold text-slate-800"
                >
                  <option value="Tablet">Film-Coated Tablet</option>
                  <option value="Capsule">Hard Gelatin / HPMC Capsule</option>
                  <option value="Extended Release Tablet">Extended Release (ER) Matrix Tablet</option>
                  <option value="ODT Tablet">Orally Disintegrating Tablet (ODT)</option>
                  <option value="Inhalation Powder">Dry Powder Inhalation (DPI) Capsule</option>
                  <option value="Pressurized Metered Dose Inhaler (pMDI)">pMDI Aerosol Canister</option>
                  <option value="Suspension">Lipid Nanoparticle (LNP) Suspension</option>
                  <option value="Liposomal Injection">Liposomal Injection / Infusion</option>
                  <option value="Lyophilized Cake">Lyophilized Cake for Injection</option>
                  <option value="Oral Solution">Pediatric Oral Solution</option>
                  <option value="Eye Drops">Sterile Ophthalmic Solution</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">
                  Active Drug Dose ({currentDrug.name}):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0.01"
                    step="1"
                    value={drugDoseMg}
                    onChange={(e) => setDrugDoseMg(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-mono font-bold text-blue-700"
                  />
                  <span className="font-mono text-slate-500 font-semibold">mg/dose</span>
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">
                  Dosing Frequency (Daily Exposure):
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={dosingFrequency}
                    onChange={(e) => setDosingFrequency(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-semibold text-slate-800"
                  >
                    <option value="QD">Once Daily (QD — 1x/day)</option>
                    <option value="BID">Twice Daily (BID — 2x/day)</option>
                    <option value="TID">Three Times Daily (TID — 3x/day)</option>
                    <option value="QID">Four Times Daily (QID — 4x/day)</option>
                    <option value="CUSTOM">Custom Doses / Day</option>
                  </select>
                  {dosingFrequency === 'CUSTOM' && (
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={customDosesPerDay}
                      onChange={(e) => setCustomDosesPerDay(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 bg-slate-50 border border-slate-300 rounded px-2 py-1.5 font-mono font-bold text-center text-slate-800"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Dual Status Alert Banner: Safety Cross-Check (MDI) & USP Compatibility */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: FDA IID Safety Cross-Check */}
            <div
              className={`rounded-lg border p-4 shadow-xs transition-colors ${
                safetyAudit.isOverallCompliant
                  ? safetyAudit.warningCount > 0
                    ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                    : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                  : 'bg-rose-50/80 border-rose-200 text-rose-950'
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`p-2 rounded-lg mt-0.5 ${
                    safetyAudit.isOverallCompliant
                      ? safetyAudit.warningCount > 0
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {safetyAudit.isOverallCompliant ? (
                    safetyAudit.warningCount > 0 ? (
                      <AlertTriangle className="w-5 h-5" />
                    ) : (
                      <ShieldCheck className="w-5 h-5" />
                    )
                  ) : (
                    <ShieldAlert className="w-5 h-5" />
                  )}
                </span>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold uppercase tracking-wide">
                      1. FDA IID Maximum Daily Intake (MDI) Check
                    </h4>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/5 font-semibold">
                      {effectiveDosesPerDay}x/day
                    </span>
                  </div>
                  <p className="text-xs font-medium">
                    {safetyAudit.isOverallCompliant
                      ? safetyAudit.warningCount > 0
                        ? `Caution: ${safetyAudit.warningCount} excipient(s) approaching precedent ceiling (>80% MDI).`
                        : `100% Precedent Compliant. All ${recipeItems.length} excipients within approved FDA IID MDI.`
                      : `FLAGGED: ${safetyAudit.flaggedCount} excipient(s) exceed FDA IID Maximum Daily Intake (MDI). Nonclinical qualification required.`}
                  </p>
                  <div className="text-[11px] opacity-80 pt-1">
                    Pass: {safetyAudit.passCount} | Watch: {safetyAudit.warningCount} | Flagged: {safetyAudit.flaggedCount}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: USP/NF Excipient Compatibility Matrix */}
            <div
              className={`rounded-lg border p-4 shadow-xs transition-colors ${
                compatibilityStats.highRisk > 0
                  ? 'bg-rose-50/80 border-rose-200 text-rose-950'
                  : compatibilityStats.moderateRisk > 0
                  ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                  : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span
                    className={`p-2 rounded-lg mt-0.5 ${
                      compatibilityStats.highRisk > 0
                        ? 'bg-rose-100 text-rose-800'
                        : compatibilityStats.moderateRisk > 0
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    <Atom className="w-5 h-5" />
                  </span>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold uppercase tracking-wide">
                        2. USP/NF Chemical Compatibility Status
                      </h4>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/5 font-semibold">
                        {presentFunctionalGroups.length} Active API Groups
                      </span>
                    </div>
                    <p className="text-xs font-medium">
                      {compatibilityStats.highRisk > 0
                        ? `ALERT: ${compatibilityStats.highRisk} High-Risk Drug-Excipient Incompatibility detected (e.g. Maillard browning / alkaline cleavage).`
                        : compatibilityStats.moderateRisk > 0
                        ? `Caution: ${compatibilityStats.moderateRisk} excipient(s) have potential interaction pathways under stress conditions.`
                        : `100% Compatible. No reactive chemical clashes identified with ${currentDrug.name}.`}
                    </p>
                    <div className="text-[11px] opacity-80 pt-1">
                      Compatible: {compatibilityStats.compatible} | Caution: {compatibilityStats.moderateRisk} | High Risk: {compatibilityStats.highRisk}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveSubTab('compatibility')}
                  className="px-2.5 py-1 text-xs font-semibold rounded bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 shrink-0 transition-colors"
                >
                  View Matrix →
                </button>
              </div>
            </div>
          </div>

          {/* ================================================================= */}
          {/* MAIN FORMULATION COMPOSITION & SAFETY + COMPATIBILITY TABLE       */}
          {/* ================================================================= */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-indigo-600" />
                  <span>Formulation Composition, FDA IID Potency & USP Compatibility</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Daily Intake vs FDA Maximum Daily Intake (MDI) & chemical reactivity with {currentDrug.name}.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveSubTab('compatibility')}
                  className="text-xs text-rose-700 hover:text-rose-900 flex items-center gap-1 font-semibold"
                >
                  <Atom className="w-3.5 h-3.5" />
                  <span>Open Compatibility Matrix</span>
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('fda_iid')}
                  className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add from FDA IID Database</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="min-w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Ingredient</th>
                    <th className="py-2.5 px-3">Role & Function</th>
                    <th className="py-2.5 px-3">Unit Dose</th>
                    <th className="py-2.5 px-3">Daily Intake ({effectiveDosesPerDay}x/day)</th>
                    <th className="py-2.5 px-3">FDA IID Max Daily (MDI)</th>
                    <th className="py-2.5 px-3">FDA IID Safety Status</th>
                    <th className="py-2.5 px-3">USP Chemical Compatibility</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {/* Active Drug row */}
                  <tr className="bg-blue-50/50 font-semibold">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-blue-900">{currentDrug.name}</div>
                      <div className="text-[10px] font-mono text-blue-700">
                        API Payload (CID: {currentDrug.cid})
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-blue-900 text-[11px]">
                      Active Pharmaceutical Ingredient ({currentDrug.bcsClass})
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-mono font-bold text-blue-900">{drugDoseMg} mg</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-mono font-bold text-blue-900">
                        {(drugDoseMg * effectiveDosesPerDay).toFixed(1)} mg/day
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 font-mono">—</td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                        Target Therapeutic Agent
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] font-mono text-blue-700">
                        {presentFunctionalGroups.length} active groups detected
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-400 font-mono">—</td>
                  </tr>

                  {/* Excipient Items */}
                  {safetyAudit.auditedIngredients.map((item) => (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        item.safetyStatus === 'FLAG_EXCEEDED' || item.compatibilityResult?.riskLevel === 'HIGH_RISK'
                          ? 'bg-rose-50/30'
                          : ''
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{item.excipient.name}</span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-500">
                          UNII: {item.excipient.unii}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 max-w-xs">
                        <div className="font-medium text-slate-800 text-[11px] truncate">
                          {item.excipient.functionalCategory}
                        </div>
                        <div className="text-[10px] text-slate-500 line-clamp-1">
                          {item.roleNote || item.excipient.roleInFormula}
                        </div>
                      </td>

                      {/* Proposed Unit Dose */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0.01"
                            step="0.5"
                            value={item.proposedAmountMg}
                            onChange={(e) =>
                              handleUpdateAmount(item.id, parseFloat(e.target.value) || 0)
                            }
                            className="w-20 px-2 py-1 text-xs border border-slate-300 rounded font-mono font-bold text-slate-900 bg-white focus:ring-1 focus:ring-indigo-500"
                          />
                          <span className="font-mono text-slate-500 text-[11px]">mg</span>
                        </div>
                      </td>

                      {/* Proposed Daily Intake */}
                      <td className="py-2.5 px-3 font-mono">
                        <div className="font-bold text-slate-900">
                          {item.proposedDailyIntakeMg.toFixed(1)} mg
                        </div>
                        <div className="text-[10px] text-slate-500">
                          ({effectiveDosesPerDay} doses × {item.proposedAmountMg} mg)
                        </div>
                      </td>

                      {/* FDA IID Daily Limit (MDI) */}
                      <td className="py-2.5 px-3 font-mono text-slate-800">
                        <span className="font-bold">{item.maxDailyIntakeLimit} mg/day</span>
                        <div className="text-[10px] text-purple-700">
                          Max Unit: {item.unitMaxPotencyLimit} {item.unit}
                        </div>
                      </td>

                      {/* FDA IID Safety Status */}
                      <td className="py-2.5 px-3">
                        {item.safetyStatus === 'PASS' && (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Pass (MDI {item.mdiUtilizationPct.toFixed(0)}%)</span>
                            </span>
                            <div className="w-20 bg-slate-200 rounded-full h-1 overflow-hidden">
                              <div
                                className="bg-emerald-500 h-1 rounded-full"
                                style={{ width: `${Math.min(100, item.mdiUtilizationPct)}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {item.safetyStatus === 'WARNING' && (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              <span>Warning ({item.mdiUtilizationPct.toFixed(0)}% MDI)</span>
                            </span>
                            <div className="w-20 bg-slate-200 rounded-full h-1 overflow-hidden">
                              <div
                                className="bg-amber-500 h-1 rounded-full"
                                style={{ width: `${Math.min(100, item.mdiUtilizationPct)}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {item.safetyStatus === 'FLAG_EXCEEDED' && (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              <span>Exceeds MDI</span>
                            </span>
                          </div>
                        )}
                      </td>

                      {/* USP Chemical Compatibility */}
                      <td className="py-2.5 px-3 max-w-xs">
                        {item.compatibilityResult?.riskLevel === 'COMPATIBLE' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Compatible (USP)</span>
                          </span>
                        )}

                        {item.compatibilityResult?.riskLevel === 'MODERATE_RISK' && (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              <span>{item.compatibilityResult.degradationPathway.split('(')[0]}</span>
                            </span>
                            <div className="text-[10px] text-amber-900/80 truncate">
                              Interacts: {item.compatibilityResult.interactingDrugGroups.join(', ')}
                            </div>
                          </div>
                        )}

                        {item.compatibilityResult?.riskLevel === 'HIGH_RISK' && (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              <span>{item.compatibilityResult.degradationPathway.split('(')[0]}</span>
                            </span>
                            <div className="text-[10px] text-rose-900 font-medium truncate">
                              {item.compatibilityResult.chemicalMechanism.slice(0, 50)}...
                            </div>
                            {item.compatibilityResult.recommendedAlternativeId && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleAutoMitigate(
                                    item.id,
                                    item.compatibilityResult?.recommendedAlternativeId
                                  )
                                }
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-600 hover:bg-rose-700 text-white text-[9px] font-bold transition-colors"
                              >
                                <Wrench className="w-2.5 h-2.5" />
                                <span>Auto-Mitigate</span>
                              </button>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setInspectedExcipient(item.excipient)}
                            className="p-1 rounded text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                            title="Inspect Excipient Dossier & Physicochemical Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveIngredient(item.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
                            title="Remove excipient"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary Metrics Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-900 text-white rounded-lg">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Total Unit Dose Mass
                </span>
                <span className="text-lg font-mono font-bold text-white">
                  {safetyAudit.totalUnitDoseMassMg.toFixed(1)} mg
                </span>
                <span className="text-[10px] text-slate-400 block">per individual unit</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Drug Loading Wt%
                </span>
                <span className="text-lg font-mono font-bold text-blue-400">
                  {safetyAudit.drugLoadingPct.toFixed(1)} wt%
                </span>
                <span className="text-[10px] text-slate-400 block">active payload</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Daily Excipient Mass
                </span>
                <span className="text-lg font-mono font-bold text-purple-400">
                  {(safetyAudit.totalExcipientMg * effectiveDosesPerDay).toFixed(1)} mg/day
                </span>
                <span className="text-[10px] text-slate-400 block">
                  at {effectiveDosesPerDay} doses/day
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Formulation Health
                </span>
                <span
                  className={`text-sm font-bold flex items-center gap-1 ${
                    safetyAudit.isOverallCompliant && compatibilityStats.highRisk === 0
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                  }`}
                >
                  {safetyAudit.isOverallCompliant && compatibilityStats.highRisk === 0 ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Valid & Stable</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      <span>
                        {safetyAudit.flaggedCount > 0 ? `${safetyAudit.flaggedCount} Safety Flag` : ''}
                        {safetyAudit.flaggedCount > 0 && compatibilityStats.highRisk > 0 ? ' • ' : ''}
                        {compatibilityStats.highRisk > 0 ? `${compatibilityStats.highRisk} Incompatible` : ''}
                      </span>
                    </>
                  )}
                </span>
                <span className="text-[10px] text-slate-400 block">FDA IID + USP/NF</span>
              </div>
            </div>

            {/* Quick-jump Button to Stability Dashboard */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-teal-50/70 border border-teal-200 rounded-lg text-xs">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 rounded bg-teal-100 text-teal-800">
                  <Calendar className="w-4 h-4" />
                </span>
                <div>
                  <div className="font-bold text-teal-950">
                    Projected Formulation Shelf-Life: ICH Q1A(R2) Simulation Ready
                  </div>
                  <div className="text-teal-800 text-[11px]">
                    Simulate real-time Arrhenius chemical kinetics and degradation across 25°C, 30°C, and 40°C/75% RH stress.
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveSubTab('stability_dashboard')}
                className="px-3 py-1.5 rounded-md bg-teal-700 hover:bg-teal-800 text-white font-semibold transition-colors flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
              >
                <span>Open Stability Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick-jump Button to DOE Optimization Planner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-lg text-xs">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 rounded bg-indigo-100 text-indigo-800">
                  <Sliders className="w-4 h-4" />
                </span>
                <div>
                  <div className="font-bold text-indigo-950">
                    Design of Experiments (DOE) Planner: Grid-Search Optimization
                  </div>
                  <div className="text-indigo-800 text-[11px]">
                    Systematically optimize polymer and surfactant ratios for {currentDrug.name} to maximize Tg margin and FaSSIF parachute duration.
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveSubTab('doe_planner')}
                className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
              >
                <span>Open DOE Planner</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Interactive Recharts Visualization: Proposed Concentrations vs FDA IID Maximum Limits */}
          <FdaIidLimitChart
            items={excipientChartItems}
            deliveryRoute={recipeRoute}
            dosageForm={recipeDosageForm}
            dosingFrequency={dosingFrequency}
            dosesPerDay={effectiveDosesPerDay}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. DESIGN OF EXPERIMENTS (DOE) OPTIMIZATION PLANNER                       */}
      {/* ========================================================================= */}
      {activeSubTab === 'doe_planner' && (
        <DoePlannerStudio
          currentDrug={currentDrug}
          currentDrugDoseMg={drugDoseMg}
          onApplyFormulation={handleApplyDoeToRecipe}
          onOpenGlossary={onOpenGlossary}
        />
      )}

      {/* ========================================================================= */}
      {/* 2. REGULATORY STABILITY DASHBOARD — ICH Q1A(R2) COMPLIANCE                */}
      {/* ========================================================================= */}
      {activeSubTab === 'stability_dashboard' && (
        <RegulatoryStabilityDashboard
          currentDrug={currentDrug}
          recipeItems={recipeItems}
          dosageForm={recipeDosageForm}
          deliveryRoute={recipeRoute}
          compatibilityResults={recipeCompatibilityResults}
          onOpenGlossary={onOpenGlossary}
        />
      )}

      {activeSubTab === 'regulatory_compliance' && (
        <RegulatoryComplianceStudio
          currentRoute={recipeRoute}
          dosageForm={recipeDosageForm}
          drugName={currentDrug.name}
        />
      )}

      {/* ========================================================================= */}
      {/* 3. DEDICATED FDA IID LIMIT VISUALIZATION SUB-TAB (RECHARTS)               */}
      {/* ========================================================================= */}
      {activeSubTab === 'iid_limits_chart' && (
        <div className="space-y-4">
          <FdaIidLimitChart
            items={excipientChartItems}
            deliveryRoute={recipeRoute}
            dosageForm={recipeDosageForm}
            dosingFrequency={dosingFrequency}
            dosesPerDay={effectiveDosesPerDay}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. EXCIPIENT COMPATIBILITY MATRIX (USP/NF) SUB-TAB                        */}
      {/* ========================================================================= */}
      {activeSubTab === 'compatibility' && (
        <div className="space-y-5">
          {/* Candidate Drug Functional Group Map */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded bg-rose-100 text-rose-700">
                    <Atom className="w-4 h-4" />
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    API Chemical Structure & Reactive Functional Groups: {currentDrug.name}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dynamic structure parsing analyzes active drug moieties to screen for chemical degradation pathways under USP/NF &lt;1059&gt;.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-slate-500">MW: {currentDrug.molecularWeight} g/mol</span>
                <span>•</span>
                <span className="text-slate-500">LogP: {currentDrug.xLogP}</span>
                <span>•</span>
                <span className="text-slate-500">HBD: {currentDrug.hbd}</span>
                <span>•</span>
                <span className="text-slate-500">HBA: {currentDrug.hba}</span>
              </div>
            </div>

            {/* Functional Groups Badges Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {drugFunctionalGroups.map((group) => (
                <div
                  key={group.id}
                  className={`p-3 rounded-lg border text-xs transition-all ${
                    group.isPresent
                      ? 'bg-rose-50/70 border-rose-200 text-rose-950 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      {group.isPresent && <span className="w-2 h-2 rounded-full bg-rose-500"></span>}
                      <span>{group.name}</span>
                    </span>
                    <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700 text-[10px]">
                      {group.formulaLabel}
                    </span>
                  </div>

                  <p className="text-[11px] mt-1.5 leading-relaxed">
                    {group.isPresent ? group.reactivityProfile : 'Not identified in target molecule'}
                  </p>

                  <div className="mt-2 pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                    <span className="font-medium">
                      Status: {group.isPresent ? <strong className="text-rose-700">Present (Active)</strong> : 'Negative'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Formulation Compatibility Matrix Table */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="p-1 rounded bg-indigo-100 text-indigo-700">
                    <FlaskConical className="w-4 h-4" />
                  </span>
                  <span>Active Formulation Compatibility Matrix</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Cross-referencing currently loaded polymers, surfactants, and excipients against {currentDrug.name}.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                  {compatibilityStats.compatible} Compatible
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                  {compatibilityStats.moderateRisk} Caution
                </span>
                <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 font-bold">
                  {compatibilityStats.highRisk} Incompatible
                </span>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="min-w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Loaded Excipient</th>
                    <th className="py-2.5 px-3">Interacting API Functional Group</th>
                    <th className="py-2.5 px-3">USP Compatibility Risk</th>
                    <th className="py-2.5 px-3">Degradation Pathway & Mechanism</th>
                    <th className="py-2.5 px-3">Potential Degradants / Impurities</th>
                    <th className="py-2.5 px-3">USP/NF Mitigation Strategy</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {recipeItems.map((item) => {
                    const comp = compatibilityMap.get(item.excipient.id);
                    if (!comp) return null;

                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          comp.riskLevel === 'HIGH_RISK'
                            ? 'bg-rose-50/30'
                            : comp.riskLevel === 'MODERATE_RISK'
                            ? 'bg-amber-50/20'
                            : ''
                        }`}
                      >
                        <td className="py-3 px-3 font-semibold text-slate-900">
                          <div>{item.excipient.name}</div>
                          <span className="text-[10px] text-slate-500 font-normal">
                            {item.excipient.functionalCategory} • {item.proposedAmountMg} mg
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <div className="flex flex-wrap gap-1">
                            {comp.interactingDrugGroups.map((g, idx) => (
                              <span
                                key={idx}
                                className={`px-2 py-0.5 rounded font-mono text-[10px] font-semibold ${
                                  comp.riskLevel === 'HIGH_RISK'
                                    ? 'bg-rose-100 text-rose-900 border border-rose-200'
                                    : comp.riskLevel === 'MODERATE_RISK'
                                    ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                }`}
                              >
                                {g}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          {comp.riskLevel === 'COMPATIBLE' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Compatible (USP)</span>
                            </span>
                          )}
                          {comp.riskLevel === 'MODERATE_RISK' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              <span>Moderate Precaution</span>
                            </span>
                          )}
                          {comp.riskLevel === 'HIGH_RISK' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              <span>High Incompatibility</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 max-w-xs">
                          <div className="font-bold text-slate-900 text-[11px]">
                            {comp.degradationPathway}
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-3">
                            {comp.chemicalMechanism}
                          </p>
                        </td>

                        <td className="py-3 px-3 max-w-xs text-[11px] font-mono text-slate-700">
                          {comp.potentialDegradants}
                        </td>

                        <td className="py-3 px-3 max-w-xs">
                          <p className="text-[11px] text-slate-700">{comp.mitigationStrategy}</p>
                          <span className="text-[10px] text-slate-400 block mt-1 italic">
                            Ref: {comp.uspNfReference}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-right">
                          {comp.recommendedAlternativeId ? (
                            <button
                              type="button"
                              onClick={() =>
                                handleAutoMitigate(item.id, comp.recommendedAlternativeId)
                              }
                              className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-colors text-[10px] flex items-center gap-1 ml-auto"
                            >
                              <Wrench className="w-3 h-3" />
                              <span>Mitigate</span>
                            </button>
                          ) : (
                            <span className="text-slate-400 font-mono text-[11px]">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Dynamic Candidate Excipient Compatibility Screener ("Test Unloaded Excipients") */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-purple-100 text-purple-700 border border-purple-200">
                  Pre-Formulation Screening Tool
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1 flex items-center gap-2">
                  <Search className="w-4 h-4 text-purple-600" />
                  <span>Dynamic Candidate Excipient Screener (Test Any Excipient)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Select any candidate polymer, surfactant, or excipient from the compendial database to screen its dynamic compatibility against {currentDrug.name} before loading into the formulation.
                </p>
              </div>

              {/* Excipient Selector */}
              <div className="flex items-center gap-2">
                <select
                  value={screenerExcipientId}
                  onChange={(e) => setScreenerExcipientId(e.target.value)}
                  className="bg-white border border-slate-300 rounded px-3 py-1.5 text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-purple-500"
                >
                  {FDA_IID_FLAT_DATABASE.map((exc) => (
                    <option key={exc.id} value={exc.id}>
                      {exc.name} ({exc.functionalCategory})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Screener Result Card */}
            <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-sm">
                      {screenerExcipient.name}
                    </h4>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium">
                      {screenerExcipient.functionalCategory}
                    </span>
                    {isScreenerExcipientLoadedInRecipe ? (
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                        Currently Loaded in Formulation
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-medium">
                        Not in Active Recipe
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">
                    UNII: {screenerExcipient.unii} • CAS: {screenerExcipient.cas} • FDA IID MDI: {screenerExcipient.maxDailyIntakeMg} mg/day
                  </div>
                </div>

                {/* Compatibility Badge */}
                <div>
                  {screenerCompatibilityResult.riskLevel === 'COMPATIBLE' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>100% Compatible with {currentDrug.name}</span>
                    </span>
                  )}
                  {screenerCompatibilityResult.riskLevel === 'MODERATE_RISK' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>Moderate Interaction Risk Detected</span>
                    </span>
                  )}
                  {screenerCompatibilityResult.riskLevel === 'HIGH_RISK' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
                      <XCircle className="w-4 h-4 text-rose-600" />
                      <span>High Incompatibility Flag</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Detailed Degradation Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    Degradation Pathway & Reactive Target:
                  </span>
                  <div className="font-bold text-slate-900">
                    {screenerCompatibilityResult.degradationPathway}
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed pt-1">
                    {screenerCompatibilityResult.chemicalMechanism}
                  </p>
                  <div className="text-[10px] font-mono text-purple-700 pt-1">
                    Interacting API Groups: {screenerCompatibilityResult.interactingDrugGroups.join(', ')}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    USP/NF Compendial Mitigation & Alternatives:
                  </span>
                  <p className="text-slate-700 text-[11px] leading-relaxed">
                    {screenerCompatibilityResult.mitigationStrategy}
                  </p>
                  <div className="text-[10px] font-mono text-slate-500 pt-1">
                    Potential Degradants: {screenerCompatibilityResult.potentialDegradants}
                  </div>
                  {screenerCompatibilityResult.recommendedAlternativeName && (
                    <div className="text-[10px] font-bold text-emerald-700 pt-1">
                      Recommended Replacement: {screenerCompatibilityResult.recommendedAlternativeName}
                    </div>
                  )}
                </div>
              </div>

              {/* Load into Recipe Button */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setInspectedExcipient(screenerExcipient)}
                  className="text-xs text-indigo-600 hover:underline flex items-center gap-1 font-semibold"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect Complete Physicochemical Profile</span>
                </button>

                {!isScreenerExcipientLoadedInRecipe ? (
                  <button
                    type="button"
                    onClick={() => {
                      handleAddIngredient(screenerExcipient);
                      setActiveSubTab('recipe_builder');
                    }}
                    className="px-3 py-1.5 rounded-md bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Load {screenerExcipient.name} into Active Recipe</span>
                  </button>
                ) : (
                  <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Already loaded in active recipe</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Compendial Knowledge Card: 6 Classic USP/NF Incompatibilities */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-slate-700" />
              <span>USP/NF &lt;1059&gt; Classic Pharmaceutical Chemical Degradation Mechanisms</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
                <span className="font-bold text-slate-900 block">1. Maillard Browning Reaction</span>
                <p className="text-slate-600 text-[11px]">
                  Primary/secondary amines + Reducing sugars (Lactose, Dextrose) → Schiff base → Amadori rearrangement → brown melanoidin adducts.
                </p>
                <span className="text-[10px] text-emerald-700 font-semibold block">
                  USP Mitigation: Substitute with D-Mannitol or Trehalose.
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
                <span className="font-bold text-slate-900 block">2. Alkaline Ester Hydrolysis</span>
                <p className="text-slate-600 text-[11px]">
                  Esters/lactones + Magnesium Stearate (boundary microclimate pH 8.5–9.2) → base-catalyzed ester cleavage into acid and alcohol degradants.
                </p>
                <span className="text-[10px] text-emerald-700 font-semibold block">
                  USP Mitigation: Replace with Sodium Stearyl Fumarate or add Citric Acid.
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
                <span className="font-bold text-slate-900 block">3. Peroxide Auto-Oxidation</span>
                <p className="text-slate-600 text-[11px]">
                  Thioethers, tertiary amines, and alkenes + Trace peroxides in Polysorbate 80 / PEG 400 → sulfoxides and amine N-oxides.
                </p>
                <span className="text-[10px] text-emerald-700 font-semibold block">
                  USP Mitigation: Use low-peroxide grades + Citric Acid/EDTA chelator.
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
                <span className="font-bold text-slate-900 block">4. Polymeric Transesterification</span>
                <p className="text-slate-600 text-[11px]">
                  Drug hydroxyls + Ester-bearing polymers (HPMC-AS, Polyvinyl acetate) at elevated hot-melt extrusion temperatures (&gt;150°C).
                </p>
                <span className="text-[10px] text-emerald-700 font-semibold block">
                  USP Mitigation: Extrude below 135°C using Soluplus plasticizer.
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
                <span className="font-bold text-slate-900 block">5. Insoluble Salt Metathesis</span>
                <p className="text-slate-600 text-[11px]">
                  Carboxylic acid drugs + Divalent cations (Mg²⁺ from Mg stearate) → insoluble magnesium carboxylate precipitation slowing dissolution.
                </p>
                <span className="text-[10px] text-emerald-700 font-semibold block">
                  USP Mitigation: Use monovalent Sodium Stearyl Fumarate (Na⁺).
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
                <span className="font-bold text-slate-900 block">6. Polyelectrolyte Complexation</span>
                <p className="text-slate-600 text-[11px]">
                  Strongly cationic APIs + Anionic polymers (Croscarmellose sodium, Carbomer) → ionic cross-binding retarding initial drug release.
                </p>
                <span className="text-[10px] text-emerald-700 font-semibold block">
                  USP Mitigation: Substitute with non-ionic Crospovidone (PVP-XL).
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. FDA IID DATABASE & DETAILED EXCIPIENT DOSSIERS                         */}
      {/* ========================================================================= */}
      {activeSubTab === 'fda_iid' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="p-1 rounded bg-purple-100 text-purple-700">
                    <Building className="w-4 h-4" />
                  </span>
                  <span>FDA Inactive Ingredient Database (IID) & Excipient Intelligence</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Search approved pharmaceutical excipients, maximum potency precedents, Maximum Daily Intake (MDI), and full physicochemical profiles.
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <input
                  type="text"
                  value={iidQuery}
                  onChange={(e) => setIidQuery(e.target.value)}
                  placeholder="Filter excipient or UNII..."
                  className="px-2.5 py-1 text-xs border border-slate-300 rounded bg-white text-slate-900 w-44 focus:ring-1 focus:ring-purple-500"
                />
                <select
                  value={selectedRoute}
                  onChange={(e) => setSelectedRoute(e.target.value)}
                  className="px-2 py-1 text-xs border border-slate-300 rounded bg-white text-slate-800"
                >
                  <option value="All">All Routes</option>
                  <option value="Oral">Oral</option>
                  <option value="Inhalation">Inhalation</option>
                  <option value="Intravenous">Intravenous</option>
                  <option value="Intramuscular">Intramuscular</option>
                  <option value="Subcutaneous">Subcutaneous</option>
                  <option value="Ophthalmic">Ophthalmic</option>
                </select>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-2 py-1 text-xs border border-slate-300 rounded bg-white text-slate-800"
                >
                  <option value="All">All Categories</option>
                  <option value="Polymeric Carrier">Polymeric Carrier</option>
                  <option value="Lipid Excipient">Lipid Excipient</option>
                  <option value="Surfactant / Solubilizer">Surfactant / Solubilizer</option>
                  <option value="Carrier Lactose">Carrier Lactose</option>
                  <option value="Cryoprotectant">Cryoprotectant</option>
                  <option value="Disintegrant">Disintegrant</option>
                  <option value="Lubricant">Lubricant</option>
                  <option value="Filler / Binder">Filler / Binder</option>
                  <option value="Matrix Polymer (ER)">Matrix Polymer (ER)</option>
                  <option value="Complexing Agent">Complexing Agent</option>
                  <option value="Glidant / Anti-Caking">Glidant / Anti-Caking</option>
                  <option value="Propellant">Propellant</option>
                  <option value="Buffering Agent">Buffering Agent</option>
                </select>
              </div>
            </div>

            {/* Excipient Directory Grid / Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="min-w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Excipient Name</th>
                    <th className="py-2.5 px-3">UNII / CAS</th>
                    <th className="py-2.5 px-3">Functional Role & Category</th>
                    <th className="py-2.5 px-3">FDA IID Max Potency & MDI</th>
                    <th className="py-2.5 px-3">Key Physicochemical Props</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredIidRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        <div>{rec.name}</div>
                        <div className="text-[10px] text-slate-500 font-normal mt-0.5 line-clamp-1">
                          {rec.openFdaCommercialProducts.slice(0, 2).join(', ')}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">
                        <div>UNII: {rec.unii}</div>
                        <div className="text-[10px] text-slate-400">CAS: {rec.cas}</div>
                      </td>
                      <td className="py-2.5 px-3 max-w-xs">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[10px]">
                          {rec.functionalCategory}
                        </span>
                        <div className="text-[11px] text-slate-600 line-clamp-1 mt-1">
                          {rec.roleInFormula}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        {rec.maxPotencyRecords.map((m, idx) => (
                          <div key={idx} className="font-mono text-purple-700 font-bold">
                            {m.maxPotency} {m.unit}{' '}
                            <span className="font-normal text-slate-500 text-[10px]">
                              ({m.route} {m.dosageForm})
                            </span>
                          </div>
                        ))}
                        <div className="text-[10px] font-mono font-semibold text-slate-600 mt-0.5">
                          Max Daily Intake (MDI): {rec.maxDailyIntakeMg} mg/day
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-600 font-mono">
                        <div>MW: {rec.physicochemicalProps.mw}</div>
                        <div>{rec.physicochemicalProps.tgOrTm}</div>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setInspectedExcipient(rec)}
                            className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors text-[11px] flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Dossier</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handleAddIngredient(rec);
                              setActiveSubTab('recipe_builder');
                            }}
                            className="px-2 py-1 rounded bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold transition-colors flex items-center gap-1 text-[11px]"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. OPENFDA DRUG LABELS SUB-TAB                                            */}
      {/* ========================================================================= */}
      {activeSubTab === 'openfda' && (
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="p-1 rounded bg-blue-100 text-blue-700">
                  <Database className="w-4 h-4" />
                </span>
                <span>openFDA Drug Product Inactive Ingredient Search</span>
              </h3>
              <p className="text-xs text-slate-500">
                Queries live openFDA Structured Product Labeling (SPL) to extract approved commercial excipient compositions.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={openFdaSearch}
                onChange={(e) => setOpenFdaSearch(e.target.value)}
                placeholder="Search brand, drug, or excipient..."
                className="px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white text-slate-900 w-56 focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => handleRunOpenFdaSearch(openFdaSearch)}
                disabled={isOpenFdaLoading}
                className="px-3 py-1.5 text-xs rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1"
              >
                {isOpenFdaLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Search className="w-3.5 h-3.5" />
                )}
                <span>Search</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {openFdaResults.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{item.brandName}</h4>
                    <span className="text-[11px] text-slate-600">{item.genericName}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono font-semibold text-[10px] border border-blue-200">
                    {item.source === 'live_api' ? 'Live openFDA' : 'Curated FDA Label'}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 text-[11px] text-slate-500 pt-1">
                  <span>Mfr: {item.manufacturer}</span>
                  <span>•</span>
                  <span>Route: {item.route}</span>
                  <span>•</span>
                  <span>Dosage: {item.dosageForm}</span>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <span className="font-semibold text-slate-800 block mb-1">
                    Labeled Inactive Ingredients (Excipients):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {item.inactiveIngredients.map((ing, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-medium text-[10px]"
                      >
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>

                {item.splSectionSnippet && (
                  <p className="text-[10px] text-slate-500 italic bg-white p-2 rounded border border-slate-200">
                    "{item.splSectionSnippet}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. NIH GSRS SUBSTANCE REGISTRY                                            */}
      {/* ========================================================================= */}
      {activeSubTab === 'nih_gsrs' && (
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="p-1 rounded bg-indigo-100 text-indigo-700">
                  <ExternalLink className="w-4 h-4" />
                </span>
                <span>NIH Global Substance Registration System (GSRS) API</span>
              </h3>
              <p className="text-xs text-slate-500">
                Retrieves verified Unique Ingredient Identifiers (UNII), chemical structure definitions, and molecular specifications.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={gsrsSearch}
                onChange={(e) => setGsrsSearch(e.target.value)}
                placeholder="Excipient substance or UNII..."
                className="px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white text-slate-900 w-56 focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => handleRunGsrsSearch(gsrsSearch)}
                disabled={isGsrsLoading}
                className="px-3 py-1.5 text-xs rounded bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1"
              >
                {isGsrsLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Search className="w-3.5 h-3.5" />
                )}
                <span>Query GSRS</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gsrsResults.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2 text-xs"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{item.substanceName}</h4>
                    <span className="text-[11px] font-mono text-indigo-700 font-semibold">
                      UNII: {item.unii}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono font-semibold text-[10px] border border-indigo-200">
                    {item.substanceClass}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] bg-white p-2.5 rounded border border-slate-200">
                  <div>
                    <span className="text-slate-400 block text-[10px]">CAS Number:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {item.casNumber || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Molecular Weight:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {item.molecularWeight ? `${item.molecularWeight} g/mol` : 'Polymeric / Mixed'}
                    </span>
                  </div>
                </div>

                <p className="text-slate-600 text-[11px]">{item.definition}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. UCSF CERSI SAFETY & ADI SUB-TAB                                        */}
      {/* ========================================================================= */}
      {activeSubTab === 'ucsf_cersi' && (
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-200">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="p-1 rounded bg-teal-100 text-teal-700">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <span>UCSF CERSI Excipient Toxicity & ADI Database</span>
            </h3>
            <p className="text-xs text-slate-500">
              Center of Excellence in Regulatory Science and Innovation (CERSI) academic toxicological thresholds, Acceptable Daily Intake (ADI), and NOAEL values.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FDA_IID_FLAT_DATABASE.slice(0, 9).map((rec) => {
              const profile = getUcsfCersiProfile(rec.name);
              if (!profile) return null;
              return (
                <div
                  key={rec.id}
                  className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900">{profile.excipientName}</h4>
                      <span className="text-[10px] font-mono text-slate-500">
                        UNII: {profile.unii}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-700 font-bold text-[10px] border border-teal-200">
                      {profile.safetyClass}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-white p-2 rounded border border-slate-200">
                    <div>
                      <span className="text-slate-400 block text-[10px]">ADI (Human):</span>
                      <span className="font-mono font-bold text-teal-700">
                        {profile.adi_mg_kg} mg/kg/day
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">NOAEL (Animal):</span>
                      <span className="font-mono font-bold text-slate-800">
                        {profile.noael_mg_kg} mg/kg
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-600">{profile.toxicityAlert}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-[10px] text-slate-500">
                    <span>Usage Trend: <strong>{profile.usageTrend}</strong></span>
                    <button
                      type="button"
                      onClick={() => setInspectedExcipient(rec)}
                      className="text-teal-700 hover:underline font-semibold"
                    >
                      View Full Dossier →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. RESOURCE COMPARISON TABLE                                              */}
      {/* ========================================================================= */}
      {activeSubTab === 'hub' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Pharmaceutical Regulatory & Excipient Data Resources
                </h3>
                <p className="text-xs text-slate-500">
                  Architectural mapping of official regulatory databases, chemical substance registries, and academic safety sources.
                </p>
              </div>
              <span className="text-xs font-mono text-slate-500">4 Integrated Systems</span>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="min-w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-bold text-slate-900">Resource</th>
                    <th className="py-3 px-4">Best For</th>
                    <th className="py-3 px-4">Technical Format</th>
                    <th className="py-3 px-4">Data Depth</th>
                    <th className="py-3 px-4 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  <tr className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        openFDA Drug Label API
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        api.fda.gov/drug/label.json
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      Live app deployment, search queries, mapping excipients to drug products.
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono font-semibold border border-blue-200">
                        REST JSON API
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900">High:</span> Full labeling, ingredient roles, active/inactive mappings.
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setActiveSubTab('openfda')}
                        className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                      >
                        Explore Labels →
                      </button>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                        NIH GSRS API
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        gsrs.ncats.nih.gov/api/v1
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      Pulling exact chemical structures, molecular weight, and UNII codes for complex mixtures.
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono font-semibold border border-indigo-200">
                        REST JSON API
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900">High (Chemical):</span> Structure-focused; lacks formulation limits.
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setActiveSubTab('nih_gsrs')}
                        className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                      >
                        Search UNII →
                      </button>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                        UCSF CERSI Excipient Browser
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        cersi.ucsf.edu/excipients
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      Deep academic research and usage trends over time.
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-700 font-mono font-semibold border border-teal-200">
                        Front-end lookup / Local download
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900">High (Academic):</span> Focuses on safe limits, toxicological data, and categories.
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setActiveSubTab('ucsf_cersi')}
                        className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                      >
                        Safety Data →
                      </button>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                        FDA IID Flat Files (Quarterly)
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        fda.gov/drugs/drug-approvals-and-databases/inactive-ingredient-search
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      Setting up your own local SQL/NoSQL database for your app's backend.
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-mono font-semibold border border-purple-200">
                        CSV / Excel (Quarterly)
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-purple-900">Highest (Regulatory):</span> Strict maximum potency limits by dosage form and route.
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setActiveSubTab('fda_iid')}
                        className="px-2.5 py-1 rounded bg-purple-100 hover:bg-purple-200 text-purple-800 font-semibold transition-colors"
                      >
                        Browse IID →
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. DETAILED EXCIPIENT DOSSIER MODAL / DRAWER                              */}
      {/* ========================================================================= */}
      {inspectedExcipient && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-start justify-between bg-slate-50/70 sticky top-0 backdrop-blur-xs z-10">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                  {inspectedExcipient.functionalCategory} • {inspectedExcipient.safetyCategory}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  {inspectedExcipient.name}
                </h3>
                <div className="flex items-center gap-3 text-xs text-slate-500 font-mono mt-0.5">
                  <span>UNII: {inspectedExcipient.unii}</span>
                  <span>•</span>
                  <span>CAS: {inspectedExcipient.cas}</span>
                  <span>•</span>
                  <span>Routes: {inspectedExcipient.routes.join(', ')}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setInspectedExcipient(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 bg-blue-50/60 rounded-lg border border-blue-200/60 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-blue-700 block">
                    1. Role of Excipient in Formula:
                  </span>
                  <p className="font-semibold text-blue-950 leading-relaxed">
                    {inspectedExcipient.roleInFormula}
                  </p>
                </div>

                <div className="p-3.5 bg-indigo-50/60 rounded-lg border border-indigo-200/60 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-indigo-700 block">
                    2. Use Case:
                  </span>
                  <p className="text-indigo-950 leading-relaxed">
                    {inspectedExcipient.useCase}
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-600 block flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>3. Why Use? (Formulation & Scientific Justification vs Alternatives)</span>
                </span>
                <p className="text-slate-800 leading-relaxed">
                  {inspectedExcipient.whyUseRationale}
                </p>
              </div>

              <div className="p-3.5 bg-purple-50/60 rounded-lg border border-purple-200/60 space-y-2">
                <span className="text-[10px] uppercase font-bold text-purple-700 block">
                  4. FDA IIG / IID Regulatory Potency & Daily Limits:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="p-2.5 bg-white rounded border border-purple-200">
                    <span className="text-[10px] text-slate-500 block">FDA Max Potency per Unit:</span>
                    <div className="font-mono font-bold text-purple-900 text-sm">
                      {inspectedExcipient.maxPotencyRecords[0]?.maxPotency}{' '}
                      {inspectedExcipient.maxPotencyRecords[0]?.unit}
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {inspectedExcipient.maxPotencyRecords[0]?.route}{' '}
                      {inspectedExcipient.maxPotencyRecords[0]?.dosageForm}
                    </span>
                  </div>

                  <div className="p-2.5 bg-white rounded border border-purple-200">
                    <span className="text-[10px] text-slate-500 block">FDA Maximum Daily Intake (MDI):</span>
                    <div className="font-mono font-bold text-purple-900 text-sm">
                      {inspectedExcipient.maxDailyIntakeMg} mg/day
                    </div>
                    <span className="text-[10px] text-slate-400">Historical regulatory ceiling</span>
                  </div>

                  <div className="p-2.5 bg-white rounded border border-purple-200">
                    <span className="text-[10px] text-slate-500 block">UCSF CERSI Adult ADI:</span>
                    <div className="font-mono font-bold text-teal-800 text-sm">
                      {inspectedExcipient.ucsfCersi.adi_mg_kg} mg/kg/day
                    </div>
                    <span className="text-[10px] text-slate-400">
                      (~{(inspectedExcipient.ucsfCersi.adi_mg_kg || 25) * 60} mg for 60kg adult)
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 bg-emerald-50/60 rounded-lg border border-emerald-200/60 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-emerald-800 block">
                    5. How It Contributes (In Vivo & Formulation Mechanism):
                  </span>
                  <p className="text-emerald-950 leading-relaxed">
                    {inspectedExcipient.howItContributes}
                  </p>
                </div>

                <div className="p-3.5 bg-cyan-50/60 rounded-lg border border-cyan-200/60 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-cyan-800 block">
                    6. How It Improves Quality (Critical Quality Attributes / CQAs):
                  </span>
                  <p className="text-cyan-950 leading-relaxed">
                    {inspectedExcipient.qualityImprovementCqa}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-700 block">
                  7. Physicochemical Properties & Material Characterization:
                </span>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="min-w-full text-xs text-left divide-y divide-slate-200">
                    <tbody className="divide-y divide-slate-100">
                      <tr className="bg-slate-50/70">
                        <td className="py-2 px-3 font-semibold text-slate-700 w-1/3">
                          Molecular Weight (Mw)
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-900">
                          {inspectedExcipient.physicochemicalProps.mw}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold text-slate-700">
                          Glass Transition (Tg) / Melting Point (Tm)
                        </td>
                        <td className="py-2 px-3 font-mono text-indigo-700 font-semibold">
                          {inspectedExcipient.physicochemicalProps.tgOrTm}
                        </td>
                      </tr>
                      <tr className="bg-slate-50/70">
                        <td className="py-2 px-3 font-semibold text-slate-700">
                          HLB Value / Lipophilicity (LogP)
                        </td>
                        <td className="py-2 px-3 text-slate-900">
                          {inspectedExcipient.physicochemicalProps.hlbOrLogP}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold text-slate-700">
                          Solubility Profile
                        </td>
                        <td className="py-2 px-3 text-slate-900">
                          {inspectedExcipient.physicochemicalProps.solubility}
                        </td>
                      </tr>
                      <tr className="bg-slate-50/70">
                        <td className="py-2 px-3 font-semibold text-slate-700">
                          Viscosity & Rheology
                        </td>
                        <td className="py-2 px-3 text-slate-900">
                          {inspectedExcipient.physicochemicalProps.viscosity}
                        </td>
                      </tr>
                      {inspectedExcipient.physicochemicalProps.pKa && (
                        <tr>
                          <td className="py-2 px-3 font-semibold text-slate-700">
                            pKa / Ionization
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-900">
                            {inspectedExcipient.physicochemicalProps.pKa}
                          </td>
                        </tr>
                      )}
                      <tr className="bg-slate-50/70">
                        <td className="py-2 px-3 font-semibold text-slate-700">
                          Solid-State Flow & Bulk Properties
                        </td>
                        <td className="py-2 px-3 text-slate-900">
                          {inspectedExcipient.physicochemicalProps.solidStateOrFlow}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                <div>
                  <span className="font-semibold text-slate-700">FDA Reference Products: </span>
                  <span>{inspectedExcipient.openFdaCommercialProducts.join(', ')}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleAddIngredient(inspectedExcipient);
                    setInspectedExcipient(null);
                    setActiveSubTab('recipe_builder');
                  }}
                  className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add to Active Recipe</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
