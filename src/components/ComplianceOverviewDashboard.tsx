import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Circle,
  AlertTriangle,
  FileText,
  Download,
  Building,
  Layers,
  Wind,
  Atom,
  FlaskConical,
  Award,
  ArrowRight,
  RefreshCw,
  Check,
  BarChart2,
  Lock,
  Activity
} from 'lucide-react';
import { CompoundProperties } from '../types/pharmadds';

interface ComplianceOverviewDashboardProps {
  currentDrug: CompoundProperties;
  onNavigate: (section: string) => void;
}

interface StudioComplianceModule {
  id: string;
  name: string;
  category: string;
  icon: any;
  targetSection: string;
  totalItems: number;
  completedItems: number;
  inProgressItems: number;
  criticalGaps: number;
  status: 'Ready' | 'In Progress' | 'Review Required' | 'Action Needed';
  regulations: string[];
}

export const ComplianceOverviewDashboard: React.FC<ComplianceOverviewDashboardProps> = ({
  currentDrug,
  onNavigate,
}) => {
  // Centralized regulatory compliance state across studios
  const [modules, setModules] = useState<StudioComplianceModule[]>([
    {
      id: 'formulator_studio',
      name: 'Formulator Studio (Excipients & IID Limits)',
      category: 'Oral / Solid Dosage & CMC',
      icon: FlaskConical,
      targetSection: 'formulator',
      totalItems: 8,
      completedItems: 6,
      inProgressItems: 2,
      criticalGaps: 0,
      status: 'Ready',
      regulations: ['FDA IID Limits', 'ICH Q6A', 'USP/NF <1059>', 'ICH Q8(R2)']
    },
    {
      id: 'nanoparticle_studio',
      name: 'Nanoparticle Studio (LIMS & Reagent COAs)',
      category: 'Parenteral / LNP Nanomedicine',
      icon: SlidersIconMock => <Atom className="w-4 h-4 text-purple-600" />,
      targetSection: 'nanoparticles',
      totalItems: 7,
      completedItems: 5,
      inProgressItems: 1,
      criticalGaps: 1,
      status: 'In Progress',
      regulations: ['USP <729>', 'ISO 22412', 'FDA LNP Guidance', '21 CFR Part 11']
    },
    {
      id: 'amorphous_studio',
      name: 'Amorphous Dispersion Studio (Gordon-Taylor Tg)',
      category: 'Oral Bioavailability / ASD',
      icon: Layers,
      targetSection: 'amorphous',
      totalItems: 6,
      completedItems: 5,
      inProgressItems: 1,
      criticalGaps: 0,
      status: 'Ready',
      regulations: ['ICH Q1A(R2)', 'Hancock-Zografi 50°C Rule', 'Gordon-Taylor Thermodynamics']
    },
    {
      id: 'inhalation_studio',
      name: 'Inhalation Studio (NGI Cascade Impactor & MMAD)',
      category: 'Pulmonary DPI / pMDI',
      icon: Wind,
      targetSection: 'inhalation',
      totalItems: 6,
      completedItems: 4,
      inProgressItems: 2,
      criticalGaps: 0,
      status: 'In Progress',
      regulations: ['USP <601>', 'Ph. Eur. 2.9.18', 'FDA MDI/DPI Guidance', 'HFO Propellant Standards']
    },
    {
      id: 'pkpd_studio',
      name: 'PK/PD Safety Window & Toxicity Engine',
      category: 'Bioavailability & Therapeutic Index',
      icon: Activity,
      targetSection: 'pkpd',
      totalItems: 5,
      completedItems: 5,
      inProgressItems: 0,
      criticalGaps: 0,
      status: 'Ready',
      regulations: ['ICH M3(R2)', 'FDA Nonclinical Safety Evaluation', 'Pharmacokinetic Modeling']
    }
  ]);

  // Calculate overall maturity score
  const overallMaturityScore = React.useMemo(() => {
    const totalPossible = modules.reduce((acc, m) => acc + m.totalItems, 0);
    const totalCompleted = modules.reduce((acc, m) => acc + m.completedItems + (m.inProgressItems * 0.5), 0);
    return Math.round((totalCompleted / totalPossible) * 100);
  }, [modules]);

  const maturityTier = React.useMemo(() => {
    if (overallMaturityScore >= 80) return { label: 'GMP Regulatory Ready', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', desc: 'All core CMC, stability, and characterization modules meet ICH/FDA requirements.' };
    if (overallMaturityScore >= 50) return { label: 'Pre-Clinical Development', color: 'bg-indigo-100 text-indigo-800 border-indigo-300', desc: 'Formulation prototype established; stability and scale-up documentation in progress.' };
    return { label: 'Phase I Discovery Stage', color: 'bg-amber-100 text-amber-800 border-amber-300', desc: 'Initial preformulation and screening; comprehensive regulatory dossier pending.' };
  }, [overallMaturityScore]);

  const handleToggleModuleProgress = (id: string) => {
    setModules((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          const nextCompleted = m.completedItems < m.totalItems ? m.completedItems + 1 : 0;
          const nextStatus = nextCompleted === m.totalItems ? 'Ready' : 'In Progress';
          return {
            ...m,
            completedItems: nextCompleted,
            status: nextStatus as any,
          };
        }
        return m;
      })
    );
  };

  const handleExportComplianceReport = () => {
    const report = {
      projectDrug: currentDrug.name,
      pubChemCid: currentDrug.cid,
      bcsClass: currentDrug.bcsClass,
      overallMaturityScore: `${overallMaturityScore}%`,
      maturityTier: maturityTier.label,
      generatedAt: new Date().toISOString(),
      studioModules: modules
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentDrug.name.replace(/\s+/g, '_')}_Compliance_Maturity_Report.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section id="compliance-overview" className="py-6 space-y-6">
      {/* Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl border border-indigo-900/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-indigo-300 text-xs font-semibold w-fit mb-3">
            <ShieldCheck className="w-4 h-4" /> Multi-Studio Regulatory Compliance Dashboard
          </div>
          <h2 className="text-2xl font-bold">Compliance Overview & Project Maturity Engine</h2>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            Centralizing regulatory checklist progress across all formulation studios for <span className="font-semibold text-white">{currentDrug.name}</span> ({currentDrug.bcsClass}). Track ICH, FDA, and EMA documentation readiness in real time.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-800/80 p-4 rounded-xl border border-slate-700/60 min-w-[300px]">
          <div className="w-full">
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span className="font-medium">Regulatory Maturity Score</span>
              <span className="font-bold text-indigo-400 text-sm">{overallMaturityScore}%</span>
            </div>
            <div className="w-full bg-slate-700 h-3 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 via-teal-400 to-emerald-400 h-full transition-all duration-500"
                style={{ width: `${overallMaturityScore}%` }}
              ></div>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${maturityTier.color}`}>
                {maturityTier.label}
              </span>
              <span className="text-[11px] text-slate-400">5 Studios Integrated</span>
            </div>
          </div>

          <button
            onClick={handleExportComplianceReport}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md transition whitespace-nowrap cursor-pointer shrink-0"
          >
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>
      </div>

      {/* Maturity Tier Banner */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-start gap-3">
        <Award className="w-6 h-6 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wide">Project Regulatory Readiness Evaluation</h4>
          <p className="text-xs text-indigo-900 mt-0.5">
            {maturityTier.desc} Click any studio module below to navigate directly to its workspace, verify active excipient IID safety limits, run NGI cascade simulations, or execute Gordon-Taylor stability forecasts.
          </p>
        </div>
      </div>

      {/* Studios Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {modules.map((mod) => {
          const IconComp = mod.icon;
          const percent = Math.round((mod.completedItems / mod.totalItems) * 100);
          return (
            <div
              key={mod.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-700">
                    <IconComp className="w-5 h-5" />
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                      mod.status === 'Ready'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    }`}
                  >
                    {mod.status}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold">{mod.category}</span>
                  <h3 className="text-sm font-bold text-slate-900 mt-0.5">{mod.name}</h3>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-600">Checklist Progress</span>
                    <span className="font-bold text-slate-900">
                      {mod.completedItems} / {mod.totalItems} ({percent}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        percent === 100 ? 'bg-emerald-500' : 'bg-indigo-600'
                      }`}
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                </div>

                {/* Regulations Badges */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {mod.regulations.map((reg, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-mono rounded border border-slate-200"
                    >
                      {reg}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleModuleProgress(mod.id)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Toggle Task</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate(mod.targetSection)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition cursor-pointer"
                >
                  <span>Open Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
