import React, { useState } from 'react';
import { X, Search, BookOpen, Layers, Beaker, CheckCircle2, HelpCircle } from 'lucide-react';
import { SCIENTIFIC_GLOSSARY, GlossaryItem } from '../data/scientificGlossary';

interface GlossaryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialTermId?: string | null;
}

export const GlossaryDrawer: React.FC<GlossaryDrawerProps> = ({
  isOpen,
  onClose,
  initialTermId,
}) => {
  const [selectedTermId, setSelectedTermId] = useState<string>(
    initialTermId && SCIENTIFIC_GLOSSARY[initialTermId] ? initialTermId : 'epr_effect'
  );
  const [searchFilter, setSearchFilter] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  if (!isOpen) return null;

  const allTerms = Object.values(SCIENTIFIC_GLOSSARY);
  const categories = ['all', 'Nanotechnology', 'Amorphous Solid Dispersion', 'Inhalation Aerosols', 'PK/PD & Biopharmaceutics', 'Pre-Formulation & QbD'];

  const filteredTerms = allTerms.filter((item) => {
    const matchesSearch =
      item.term.toLowerCase().includes(searchFilter.toLowerCase()) ||
      item.shortName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      item.definitionBn.includes(searchFilter);
    const matchesCat = activeCategory === 'all' || item.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  const activeItem: GlossaryItem = SCIENTIFIC_GLOSSARY[selectedTermId] || allTerms[0];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 max-w-xl w-full bg-white shadow-2xl flex flex-col z-50">
        {/* Top Header */}
        <div className="h-16 px-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Pharmaceutical R&D Scientific Glossary & Explainer
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">
                বৈজ্ঞানিক পরিভাষা, ল্যাব মেথড ও গ্রহণযোগ্য মানদণ্ড
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="p-4 border-b border-slate-200 bg-white space-y-2.5">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search scientific terms or Bengali meaning..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-slate-800"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-colors ${
                  activeCategory === cat
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat === 'all' ? 'All Terms' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* 2-Column or Stacked Details Layout */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Quick Click Term Chips */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block">
              Terms ({filteredTerms.length})
            </span>
            <div className="flex flex-wrap gap-1.5">
              {filteredTerms.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTermId(t.id)}
                  className={`px-2.5 py-1 text-xs rounded transition-colors whitespace-nowrap ${
                    selectedTermId === t.id
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {t.shortName}
                </button>
              ))}
            </div>
          </div>

          {/* Active Term Card */}
          {activeItem && (
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
              {/* Title & Category */}
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-semibold uppercase text-blue-700 px-2 py-0.5 rounded bg-blue-100">
                    {activeItem.category}
                  </span>
                  <span className="text-xs font-mono text-slate-500">ID: {activeItem.id}</span>
                </div>
                <h4 className="text-base font-bold text-slate-900 mt-2">
                  {activeItem.term}
                </h4>
              </div>

              {/* Lab Specification Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white rounded border border-slate-200">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">
                    Lab Measurement Method
                  </span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">
                    {activeItem.measurementMethod}
                  </span>
                </div>
                <div className="p-3 bg-white rounded border border-slate-200">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">
                    Target Acceptance Criteria (Pharma QC)
                  </span>
                  <span className="font-mono font-bold text-emerald-700 mt-0.5 block">
                    {activeItem.targetCriteria}
                  </span>
                </div>
              </div>

              {/* Mathematical Formula if present */}
              {activeItem.formula && (
                <div className="p-2.5 bg-slate-900 text-cyan-300 rounded font-mono text-xs flex items-center justify-between">
                  <span>Formula:</span>
                  <span className="font-bold">{activeItem.formula}</span>
                </div>
              )}

              {/* English Scientific Definition */}
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-900 block">English Definition:</span>
                <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded border border-slate-200">
                  {activeItem.definitionEn}
                </p>
              </div>

              {/* Scientific Explanation & Principle */}
              <div className="space-y-1">
                <span className="text-xs font-bold text-blue-900 block flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Scientific Explanation & Principle:</span>
                </span>
                <p className="text-xs text-slate-700 leading-relaxed bg-blue-50/60 p-3 rounded border border-blue-200">
                  {activeItem.definitionBn}
                </p>
              </div>

              {/* Lab & Clinical Significance */}
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-900 block">
                  R&D Laboratory & Clinical Significance:
                </span>
                <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded border border-slate-200">
                  {activeItem.labSignificanceBn}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">
            Compliant with ICH Q8 (QbD) & Ph. Eur. standards
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
