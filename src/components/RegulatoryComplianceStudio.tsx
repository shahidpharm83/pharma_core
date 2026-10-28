import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Circle,
  FileText,
  Download,
  AlertTriangle,
  Info,
  Check,
  RotateCcw,
  Sparkles,
  Layers,
  Building,
  BookOpen,
  HelpCircle,
  Lock,
  FileSpreadsheet
} from 'lucide-react';

interface RegulatoryItem {
  id: string;
  category: 'CMC' | 'Excipients & Safety' | 'Stability & ICH' | 'Quality & Data Integrity';
  title: string;
  description: string;
  guidelineRef: string;
  mandatory: boolean;
  status: 'pending' | 'in_progress' | 'completed' | 'not_applicable';
  notes: string;
  owner: string;
  targetDate: string;
}

interface RegulatoryComplianceStudioProps {
  currentRoute: string;
  dosageForm: string;
  drugName: string;
}

const INITIAL_REGULATORY_ITEMS: RegulatoryItem[] = [
  {
    id: 'reg_1',
    category: 'CMC',
    title: 'Drug Substance (DS) Specification & Characterization',
    description: 'Establish comprehensive physiochemical characterization including polymorph screening, particle size distribution (d10, d50, d90), hygroscopicity, and stereochemical purity.',
    guidelineRef: 'ICH Q6A / FDA Guidance for Industry: Drug Substance',
    mandatory: true,
    status: 'completed',
    notes: 'Polymorph Form I confirmed by XRPD and DSC. No hydrate or solvate forms observed.',
    owner: 'Dr. Sarah Jenkins (Analytical R&D)',
    targetDate: '2026-11-15'
  },
  {
    id: 'reg_2',
    category: 'CMC',
    title: 'Manufacturing Process Validation & Scale-Up Strategy',
    description: 'Define critical process parameters (CPPs) such as shear rate, drying temperature, and compression force linking them to critical quality attributes (CQAs).',
    guidelineRef: 'ICH Q8(R2) Pharmaceutical Development / FDA Guidance',
    mandatory: true,
    status: 'in_progress',
    notes: 'DOE matrix executed for granulation and blending stages. Scale-up batch validation pending pilot plant slot.',
    owner: 'Mark R. (Process Engineering)',
    targetDate: '2026-12-01'
  },
  {
    id: 'reg_3',
    category: 'Excipients & Safety',
    title: 'FDA Inactive Ingredients Database (IID) Limit Verification',
    description: 'Verify that all excipients in the formulation do not exceed maximum allowable potency limits for the specific route of administration and maximum daily dose (MDD).',
    guidelineRef: 'FDA IID Search Guidance / 21 CFR 314.94',
    mandatory: true,
    status: 'completed',
    notes: 'All excipients (HPMC-AS, Lactose Monohydrate, Magnesium Stearate) verified against oral route IID maximums.',
    owner: 'Elena Rostova (Formulation Lead)',
    targetDate: '2026-10-30'
  },
  {
    id: 'reg_4',
    category: 'Excipients & Safety',
    title: 'EMA Excipient Labeling & Pediatric Safety Assessment',
    description: 'Check European Medicines Agency (EMA) guideline on excipients in the labeling of medicinal products for human use, including warning statements for excipients with known action.',
    guidelineRef: 'EMA/CHMP/302620/2017 Rev. 1',
    mandatory: false,
    status: 'pending',
    notes: 'Reviewing lactose excipient threshold for patients with rare hereditary galactose intolerance.',
    owner: 'Dr. Hans Gruber (Regulatory Affairs)',
    targetDate: '2026-12-10'
  },
  {
    id: 'reg_5',
    category: 'Stability & ICH',
    title: 'ICH Q1A(R2) Accelerated & Long-Term Stability Protocols',
    description: 'Design and execute stability studies at 25C/60% RH (long-term), 30C/65% RH (intermediate), and 40C/75% RH (accelerated) for solid oral dosage forms.',
    guidelineRef: 'ICH Q1A(R2) Stability Testing of New Drug Substances and Products',
    mandatory: true,
    status: 'in_progress',
    notes: '6-month accelerated stability chamber active. HPLC assay and degradation products monitored monthly.',
    owner: 'David K. (Stability Quality Control)',
    targetDate: '2027-03-30'
  },
  {
    id: 'reg_6',
    category: 'Stability & ICH',
    title: 'Photostability Testing of Drug Product',
    description: 'Evaluate drug product photosensitivity in accordance with ICH Q1B guidelines to ensure adequate primary and secondary packaging protection.',
    guidelineRef: 'ICH Q1B Photostability Testing of New Drug Substances and Products',
    mandatory: true,
    status: 'pending',
    notes: 'Scheduled upon pilot batch release. Blister pack UV transmission testing required.',
    owner: 'David K. (Stability Quality Control)',
    targetDate: '2027-01-15'
  },
  {
    id: 'reg_7',
    category: 'Quality & Data Integrity',
    title: 'Analytical Method Validation (ICH Q2(R1))',
    description: 'Validate HPLC assay, impurity separation, and dissolution release methods for specificity, linearity, range, accuracy, precision, and robustness.',
    guidelineRef: 'ICH Q2(R1) Validation of Analytical Procedures',
    mandatory: true,
    status: 'completed',
    notes: 'Method validation report Q2-2026-089 approved by Quality Assurance.',
    owner: 'Dr. Sarah Jenkins (Analytical R&D)',
    targetDate: '2026-09-20'
  },
  {
    id: 'reg_8',
    category: 'Quality & Data Integrity',
    title: '21 CFR Part 11 Electronic Records & Audit Trail Compliance',
    description: 'Ensure all laboratory instruments, electronic balances, HPLC chromatography data systems (CDS), and LIMS maintain secure, time-stamped audit trails.',
    guidelineRef: 'FDA 21 CFR Part 11 / EU Annex 11',
    mandatory: true,
    status: 'completed',
    notes: 'Empower CDS and LIMS database audit trails verified during annual QA system audit.',
    owner: 'IT Compliance / QA Team',
    targetDate: '2026-10-01'
  }
];

export const RegulatoryComplianceStudio: React.FC<RegulatoryComplianceStudioProps> = ({
  currentRoute,
  dosageForm,
  drugName,
}) => {
  const [items, setItems] = useState<RegulatoryItem[]>(INITIAL_REGULATORY_ITEMS);
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingItemNotesId, setEditingItemNotesId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState<string>('');

  const handleStatusChange = (id: string, newStatus: RegulatoryItem['status']) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );
  };

  const handleSaveNotes = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, notes: tempNotes } : item))
    );
    setEditingItemNotesId(null);
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchCat = filterCategory === 'All' || item.category === filterCategory;
      const matchSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.guidelineRef.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [items, filterCategory, searchQuery]);

  const stats = useMemo(() => {
    const total = items.length;
    const completed = items.filter((i) => i.status === 'completed').length;
    const inProgress = items.filter((i) => i.status === 'in_progress').length;
    const pending = items.filter((i) => i.status === 'pending').length;
    const percent = Math.round((completed / total) * 100);
    return { total, completed, inProgress, pending, percent };
  }, [items]);

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(items, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${drugName.replace(/\s+/g, '_')}_Regulatory_Compliance_Checklist.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl border border-indigo-900/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-indigo-300 text-xs font-semibold w-fit mb-3">
            <ShieldCheck className="w-4 h-4" /> FDA & EMA Regulatory Documentation Hub
          </div>
          <h2 className="text-2xl font-bold">Regulatory Compliance & eCTD Dossier Checklist</h2>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            Active formulation: <span className="font-semibold text-white">{drugName}</span> ({dosageForm} / {currentRoute}). Track CMC, stability, excipient IID limits, and quality documentation requirements for regulatory submission.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-800/80 p-4 rounded-xl border border-slate-700/60 min-w-[280px]">
          <div className="w-full">
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span className="font-medium">Compliance Readiness</span>
              <span className="font-bold text-indigo-400">{stats.percent}%</span>
            </div>
            <div className="w-full bg-slate-700 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full transition-all duration-500"
                style={{ width: `${stats.percent}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 mt-2">
              <span>{stats.completed} Completed</span>
              <span>{stats.inProgress} In Progress</span>
              <span>{stats.pending} Pending</span>
            </div>
          </div>

          <button
            onClick={handleExportJson}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md transition whitespace-nowrap cursor-pointer"
          >
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {['All', 'CMC', 'Excipients & Safety', 'Stability & ICH', 'Quality & Data Integrity'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                filterCategory === cat
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search guidelines or tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Checklist Items Table / Cards */}
      <div className="space-y-4">
        {filteredItems.map((item) => {
          const isEditing = editingItemNotesId === item.id;
          return (
            <div
              key={item.id}
              className={`bg-white rounded-xl p-5 border shadow-sm transition hover:shadow-md ${
                item.status === 'completed'
                  ? 'border-emerald-200 bg-emerald-50/20'
                  : item.status === 'in_progress'
                  ? 'border-indigo-200 bg-indigo-50/20'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-3 border-b border-slate-100">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {item.status === 'completed' ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    ) : item.status === 'in_progress' ? (
                      <div className="w-6 h-6 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                    ) : (
                      <Circle className="w-6 h-6 text-slate-300" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-medium text-[10px] rounded">
                        {item.category}
                      </span>
                      <span className="text-xs text-indigo-600 font-semibold flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" /> {item.guidelineRef}
                      </span>
                      {item.mandatory && (
                        <span className="px-1.5 py-0.5 bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold rounded">
                          Mandatory (FDA/EMA)
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto">
                  <select
                    value={item.status}
                    onChange={(e) =>
                      handleStatusChange(item.id, e.target.value as RegulatoryItem['status'])
                    }
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                      item.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : item.status === 'in_progress'
                        ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                        : item.status === 'not_applicable'
                        ? 'bg-slate-100 text-slate-600 border-slate-300'
                        : 'bg-amber-50 text-amber-800 border-amber-300'
                    }`}
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="not_applicable">Not Applicable</option>
                  </select>
                </div>
              </div>

              <p className="text-sm text-slate-600 mt-3">{item.description}</p>

              {/* Footer info & Notes */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs text-slate-500">
                <div className="flex flex-wrap items-center gap-4">
                  <span>
                    <strong className="text-slate-700">Owner:</strong> {item.owner}
                  </span>
                  <span>
                    <strong className="text-slate-700">Target:</strong> {item.targetDate}
                  </span>
                </div>

                <div className="w-full sm:w-auto">
                  {isEditing ? (
                    <div className="flex items-center gap-2 mt-2 sm:mt-0">
                      <input
                        type="text"
                        value={tempNotes}
                        onChange={(e) => setTempNotes(e.target.value)}
                        placeholder="Enter documentation notes..."
                        className="px-3 py-1 bg-white border border-slate-300 rounded text-xs w-64 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <button
                        onClick={() => handleSaveNotes(item.id)}
                        className="px-2.5 py-1 bg-indigo-600 text-white rounded text-xs font-medium cursor-pointer"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingItemNotesId(null)}
                        className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="italic text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-200 max-w-md truncate">
                        {item.notes || 'No notes added.'}
                      </span>
                      <button
                        onClick={() => {
                          setEditingItemNotesId(item.id);
                          setTempNotes(item.notes);
                        }}
                        className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer whitespace-nowrap"
                      >
                        Edit Notes
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Educational Guidance Footer */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 flex items-start gap-4">
        <Info className="w-6 h-6 text-indigo-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-indigo-950">Regulatory Documentation Best Practices</h4>
          <p className="text-xs text-indigo-900 leading-relaxed">
            For electronic Common Technical Document (eCTD) submissions, ensure Module 3 (Quality) sections 3.2.P.1 (Description and Composition), 3.2.P.2 (Pharmaceutical Development), and 3.2.P.5 (Control of Drug Product) are fully cross-referenced with excipient IID safety limits and stability batches. Regular audits of analytical methods and raw material COAs guarantee compliance with FDA 21 CFR Part 11 and cGMP standards.
          </p>
        </div>
      </div>
    </div>
  );
};
