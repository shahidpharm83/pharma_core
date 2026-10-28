import React, { useState, useRef, useEffect } from 'react';
import {
  FileDown,
  BookOpen,
  Menu,
  X,
  Atom,
  Layers,
  Wind,
  Activity,
  Sliders,
  ChevronRight,
  ChevronDown,
  FileCheck,
  HelpCircle,
  ShieldAlert,
  Calculator,
  Sparkles,
  FlaskConical,
  ShieldCheck,
} from 'lucide-react';
import { CompoundProperties } from '../types/pharmadds';
import { HeaderGlobalSearch } from './HeaderGlobalSearch';

interface HeaderProps {
  activeSection: string;
  onNavigate: (section: string) => void;
  onOpenDossier: () => void;
  onOpenLabGuide: () => void;
  onOpenGlossary: (termId?: string) => void;
  onSelectDrug: (drug: CompoundProperties) => void;
  onOpenSafetyModal?: (drug: CompoundProperties) => void;
  currentDrug?: CompoundProperties;
}

export const Header: React.FC<HeaderProps> = ({
  activeSection,
  onNavigate,
  onOpenDossier,
  onOpenLabGuide,
  onOpenGlossary,
  onSelectDrug,
  onOpenSafetyModal,
  currentDrug,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCalcMenuOpen, setIsCalcMenuOpen] = useState(false);
  const calcDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (calcDropdownRef.current && !calcDropdownRef.current.contains(event.target as Node)) {
        setIsCalcMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavClick = (section: string) => {
    onNavigate(section);
    setIsMobileMenuOpen(false);
    setIsCalcMenuOpen(false);
  };

  const navItems = [
    { id: 'workflow', label: 'R&D Workflow', icon: FileCheck },
    { id: 'preformulation', label: 'Pre-Formulation', icon: Atom },
    { id: 'nanoparticles', label: 'Nanocarriers', icon: Sliders },
    { id: 'amorphous', label: 'Amorphous (ASD)', icon: Layers },
    { id: 'inhalation', label: 'Inhalation (DPI/MDI)', icon: Wind },
    { id: 'pkpd', label: 'PK/PD Engine', icon: Activity },
    { id: 'formulator', label: 'Formulator (IID)', icon: FlaskConical },
    { id: 'compliance-overview', label: 'Compliance Overview', icon: ShieldCheck },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-4">
          {/* Zone 1: Brand wordmark & Mobile Hamburger */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Mobile menu trigger */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              aria-label="Open mobile navigation drawer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="w-8 h-8 rounded bg-slate-900 flex items-center justify-center text-white font-mono font-bold text-sm tracking-wider">
              AD
            </div>
            <button
              onClick={() => handleNavClick('overview')}
              className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap text-left hidden sm:inline"
            >
              PharmADDS
            </button>
          </div>

          {/* Global Search Input in Header */}
          <div className="flex-1 max-w-xs sm:max-w-sm md:max-w-md mx-1 sm:mx-2">
            <HeaderGlobalSearch
              onSelectDrug={onSelectDrug}
              onOpenSafetyModal={onOpenSafetyModal}
            />
          </div>

          {/* Zone 2: Desktop Navigation Links (hidden on smaller screens, accessible via drawer) */}
          <nav className="hidden xl:flex items-center gap-4 text-xs font-medium text-slate-600">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`transition-colors whitespace-nowrap hover:text-slate-900 ${
                  activeSection === item.id ? 'text-blue-600 font-semibold' : ''
                }`}
              >
                {item.label}
              </button>
            ))}

            {/* International Calculators Dropdown */}
            <div className="relative" ref={calcDropdownRef}>
              <button
                type="button"
                onClick={() => setIsCalcMenuOpen((prev) => !prev)}
                className="flex items-center gap-1.5 py-1 px-2.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors font-semibold"
              >
                <Calculator className="w-3.5 h-3.5 text-blue-600" />
                <span>Calculators</span>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>

              {isCalcMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-72 bg-white rounded-lg shadow-xl border border-slate-200 p-2 z-50 text-left space-y-1">
                  <div className="px-2 py-1 text-[10px] font-mono uppercase text-slate-400 font-bold">
                    International Lab Tools
                  </div>
                  <button
                    onClick={() => handleNavClick('aerodynamic-calculator')}
                    className="w-full text-left p-2 rounded hover:bg-slate-50 transition-colors flex items-start gap-2.5 group"
                  >
                    <Wind className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-slate-800 group-hover:text-blue-600">
                        Inhalation & Aerodynamic Particle Calc
                      </div>
                      <div className="text-[10px] text-slate-500">
                        MMAD, GSD probit fit, FPD/RDF & NGI/ACI
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleNavClick('hsp-miscibility')}
                    className="w-full text-left p-2 rounded hover:bg-slate-50 transition-colors flex items-start gap-2.5 group"
                  >
                    <Layers className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-slate-800 group-hover:text-blue-600">
                        HSP & Polymer Miscibility Index
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Hansen 3D (Ra), RED index, Gordon-Taylor Tg
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleNavClick('nanoparticle-characterization')}
                    className="w-full text-left p-2 rounded hover:bg-slate-50 transition-colors flex items-start gap-2.5 group"
                  >
                    <Sliders className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-slate-800 group-hover:text-blue-600">
                        Nanoparticle DLS, Zeta & EE% Studio
                      </div>
                      <div className="text-[10px] text-slate-500">
                        PDI cumulants, Henry&apos;s eq Zeta, EE%/DL%
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </nav>

          {/* Zone 3: Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {currentDrug && onOpenSafetyModal && (
              <button
                onClick={() => onOpenSafetyModal(currentDrug)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded transition-colors whitespace-nowrap border border-rose-200"
                title="View PubChem GHS Chemical Safety Data"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                <span className="hidden md:inline">Safety & GHS</span>
                <span className="md:hidden">GHS</span>
              </button>
            )}

            <button
              onClick={() => onOpenGlossary()}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded transition-colors whitespace-nowrap border border-blue-200"
              title="Scientific Glossary & Terms Explainer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Glossary</span>
              <span className="sm:hidden">Glossary</span>
            </button>

            <button
              onClick={onOpenLabGuide}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors whitespace-nowrap cursor-pointer"
              title="Scientific R&D Guide & Lab Manual"
            >
              <BookOpen className="w-3.5 h-3.5 text-slate-600" />
              <span>Lab Guide</span>
            </button>

            <button
              onClick={onOpenDossier}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors whitespace-nowrap shadow-xs"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Dossier</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Slide-Over Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-white shadow-2xl flex flex-col z-50">
            {/* Drawer Header */}
            <div className="h-16 px-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded bg-slate-900 flex items-center justify-center text-white font-mono font-bold text-xs">
                  AD
                </div>
                <span className="font-bold text-slate-900 text-base">PharmADDS Studio</span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
                aria-label="Close navigation drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Active Compound Info in Drawer */}
            {currentDrug && (
              <div className="p-4 bg-slate-50 border-b border-slate-200">
                <span className="text-[10px] font-mono uppercase text-slate-400 block">Active Molecule</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-bold text-slate-900 text-sm truncate">{currentDrug.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-mono font-semibold">
                    {currentDrug.bcsClass}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 block truncate mt-0.5">
                  CID: {currentDrug.cid} · MW: {currentDrug.molecularWeight}
                </span>

                {onOpenSafetyModal && (
                  <button
                    onClick={() => {
                      onOpenSafetyModal(currentDrug);
                      setIsMobileMenuOpen(false);
                    }}
                    className="mt-2 w-full flex items-center justify-center gap-1.5 py-1 px-2 rounded bg-rose-100 text-rose-800 text-[11px] font-semibold hover:bg-rose-200 transition-colors"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                    <span>View Chemical Safety & Hazards</span>
                  </button>
                )}
              </div>
            )}

            {/* Navigation Links */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              <span className="px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider text-slate-400 block">
                Scientific Workbenches
              </span>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                );
              })}

              {/* International Interactive Calculators */}
              <div className="pt-2 pb-1 border-t border-slate-100 mt-2">
                <span className="px-3 py-1 text-[11px] font-mono uppercase tracking-wider text-slate-400 block font-bold">
                  International Calculators
                </span>
                <button
                  onClick={() => handleNavClick('aerodynamic-calculator')}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-cyan-800 hover:bg-cyan-50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Wind className="w-4 h-4 text-cyan-600" />
                    <span>Inhalation MMAD & GSD Calc</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />
                </button>

                <button
                  onClick={() => handleNavClick('hsp-miscibility')}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-amber-800 hover:bg-amber-50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Layers className="w-4 h-4 text-amber-600" />
                    <span>HSP & Gordon-Taylor Miscibility</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
                </button>

                <button
                  onClick={() => handleNavClick('nanoparticle-characterization')}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-blue-800 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Sliders className="w-4 h-4 text-blue-600" />
                    <span>Nanoparticle DLS, Zeta & EE%</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-blue-400" />
                </button>
              </div>
            </div>

            {/* Drawer Bottom Actions */}
            <div className="p-4 border-t border-slate-200 space-y-2 bg-slate-50">
              <button
                onClick={() => {
                  onOpenGlossary();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-800 hover:bg-blue-100 transition-colors"
              >
                <HelpCircle className="w-4 h-4 text-blue-600" />
                <span>Scientific Glossary</span>
              </button>

              <button
                onClick={() => {
                  onOpenLabGuide();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-slate-600" />
                <span>Scientific R&D Guide</span>
              </button>

              <button
                onClick={() => {
                  onOpenDossier();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-blue-600 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-xs"
              >
                <FileDown className="w-4 h-4" />
                <span>Export Master Dossier</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
