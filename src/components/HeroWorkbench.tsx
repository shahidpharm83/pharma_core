import React from 'react';
import { ArrowRight, Dna, Layers, Wind, Sparkles, CheckCircle2 } from 'lucide-react';
import { CompoundProperties } from '../types/pharmadds';

interface HeroWorkbenchProps {
  currentDrug: CompoundProperties;
  benchmarks: CompoundProperties[];
  onSelectDrug: (drug: CompoundProperties) => void;
  onNavigate: (section: string) => void;
}

export const HeroWorkbench: React.FC<HeroWorkbenchProps> = ({
  currentDrug,
  benchmarks,
  onSelectDrug,
  onNavigate,
}) => {
  return (
    <section className="py-6 space-y-6">
      {/* Top Quick-Try Example Bar (science skill mandate) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-lg shadow-xs">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-800">Pre-loaded Active Molecules:</span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-500">Select any benchmark compound to auto-configure simulation:</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {benchmarks.map((drug) => (
            <button
              key={drug.cid}
              onClick={() => onSelectDrug(drug)}
              className={`px-2.5 py-1 text-xs rounded transition-colors whitespace-nowrap ${
                currentDrug.cid === drug.cid
                  ? 'bg-blue-600 text-white font-medium shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {drug.name}
            </button>
          ))}
        </div>
      </div>

      {/* Hero Headline & Laboratory Scope */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 md:p-8 shadow-xs">
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 text-xs font-mono font-medium text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-100 mb-3">
            <span>PHARMACEUTICAL R&D WORKBENCH</span>
            <span>·</span>
            <span>TARGETED DRUG DELIVERY (ADDS)</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Engineering Bioavailable Targeted Formulations with Less Toxicity
          </h1>

          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed max-w-3xl">
            Integrated computational suite for formulation scientists in oncology, respiratory, and anti-infective drug development. Solve BCS Class II–IV solubility hurdles, model lipid nanocarrier stealth dynamics, evaluate Gordon-Taylor amorphous glass stability, and simulate NGI aerodynamic pulmonary delivery.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('preformulation')}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors inline-flex items-center gap-1.5 shadow-xs"
            >
              <span>Explore Pre-Formulation</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigate('pkpd')}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors inline-flex items-center gap-1.5"
            >
              <span>View PK/PD Bioavailability Engine</span>
            </button>
          </div>
        </div>

        {/* 3 Technological Pillars with Generated Lab Microscopy & NGI Images */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8 pt-8 border-t border-slate-100">
          {/* Pillar 1: Nanotechnology */}
          <div
            onClick={() => onNavigate('nanoparticles')}
            className="group cursor-pointer rounded-lg border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all overflow-hidden flex flex-col bg-white"
          >
            <div className="h-40 overflow-hidden bg-slate-900 relative">
              <img
                src="/src/assets/images/nano_carrier_microscopy_1792773734967.jpg"
                alt="Lipid Nanoparticles and Liposomes Cryo-TEM"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded">
                CRYO-TEM · LNPs & LIPOSOMES
              </div>
            </div>
            <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  Targeted Nanocarrier Science
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Lipid Nanoparticles (LNP) and stealth PEGylated liposomes. EPR passive accumulation combined with receptor-specific active targeting.
                </p>
              </div>
              <div className="text-[11px] font-medium text-blue-600 inline-flex items-center gap-1">
                <span>Configure Colloidal Parameters</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>

          {/* Pillar 2: Amorphous Solid Dispersions */}
          <div
            onClick={() => onNavigate('amorphous')}
            className="group cursor-pointer rounded-lg border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all overflow-hidden flex flex-col bg-white"
          >
            <div className="h-40 overflow-hidden bg-slate-900 relative">
              <img
                src="/src/assets/images/amorphous_solid_dispersion_1792773735451.jpg"
                alt="Amorphous Solid Dispersion Extrusion and Polarized Light"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded">
                HME & POLARIZED LIGHT
              </div>
            </div>
            <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  Amorphous Dispersions (ASD)
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Gordon-Taylor glass transition prediction and polymeric recrystallization inhibition. Generates prolonged supersaturation parachutes.
                </p>
              </div>
              <div className="text-[11px] font-medium text-blue-600 inline-flex items-center gap-1">
                <span>Model Miscibility Curves</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>

          {/* Pillar 3: Inhalation Delivery */}
          <div
            onClick={() => onNavigate('inhalation')}
            className="group cursor-pointer rounded-lg border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all overflow-hidden flex flex-col bg-white"
          >
            <div className="h-40 overflow-hidden bg-slate-900 relative">
              <img
                src="/src/assets/images/inhalation_cascade_lab_1792773735057.jpg"
                alt="Next Generation Impactor Cascade Apparatus"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded">
                NGI CASCADE · DPI / pMDI
              </div>
            </div>
            <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  Inhalation Aerosol Engineering
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Next Generation Impactor (NGI) 8-stage deposition modeling, Fine Particle Fraction (FPF &lt;5 µm), and green HFO-1234ze propellants.
                </p>
              </div>
              <div className="text-[11px] font-medium text-blue-600 inline-flex items-center gap-1">
                <span>Simulate Aerodynamic Cut-Offs</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
