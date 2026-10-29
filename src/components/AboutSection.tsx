import React, { useState } from 'react';
import {
  Info,
  Atom,
  Sliders,
  Layers,
  Wind,
  Activity,
  FlaskConical,
  ShieldCheck,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  ExternalLink,
  Code2,
  Award,
  Database,
  Cpu,
  FileCheck,
  Sparkles,
} from 'lucide-react';

interface AboutSectionProps {
  onNavigate?: (sectionId: string) => void;
  onOpenGlossary?: (termId?: string) => void;
}

export const AboutSection: React.FC<AboutSectionProps> = ({
  onNavigate,
  onOpenGlossary,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'math' | 'regulatory' | 'academic'>('overview');

  const coreModules = [
    {
      id: 'preformulation',
      name: 'Pre-Formulation & PubChem Inspector',
      icon: Atom,
      badge: 'Physicochemical Intelligence',
      color: 'blue',
      description:
        'Live NCBI PubChem PUG REST integration for automated molecular property retrieval (MW, XLogP, TPSA, HBD, HBA, Rotatable Bonds) and Lipinski Rule of 5 evaluation.',
    },
    {
      id: 'nanoparticles',
      name: 'Nanocarriers & Lipid Nanoparticles (LNP)',
      icon: Sliders,
      badge: 'Colloidal Engineering',
      color: 'indigo',
      description:
        'Microfluidic parameterization of ionizable lipids (SM-102, DSPC, Cholesterol, DMG-PEG2000), DLS hydrodynamic sizing, cumulant PDI, and Henry equation Zeta potential.',
    },
    {
      id: 'amorphous',
      name: 'Amorphous Solid Dispersions (ASD)',
      icon: Layers,
      badge: 'Thermodynamics & Stability',
      color: 'amber',
      description:
        'Hansen 3D solubility coordinates, RED miscibility index, Gordon-Taylor glass transition (Tg) prediction, dynamic ±10% RH humidity sensitivity, and real-time D3.js degradation curves.',
    },
    {
      id: 'inhalation',
      name: 'Inhalation Science (DPI/MDI)',
      icon: Wind,
      badge: 'Pulmonary Aerodynamics',
      color: 'cyan',
      description:
        'Automated log-probit regression on Next Generation Impactor (NGI) and ACI stage depositions to calculate MMAD, GSD, and Fine Particle Fraction (FPF < 5 µm).',
    },
    {
      id: 'pkpd',
      name: 'PK/PD Bioavailability Engine',
      icon: Activity,
      badge: 'Pharmacokinetics',
      color: 'rose',
      description:
        'Two-compartment biopharmaceutical simulation comparing targeted vs. conventional plasma concentration-time curves with MEC/MTC therapeutic window monitoring.',
    },
    {
      id: 'formulator',
      name: 'Formulator Studio & Excipient IID',
      icon: FlaskConical,
      badge: 'Regulatory Safety (QbD)',
      color: 'emerald',
      description:
        'Direct screening against the FDA Inactive Ingredient Database (IID) for maximum potency limits, NIH GSRS substances, and UCSF-Stanford CERSI safety alerts.',
    },
  ];

  return (
    <section id="about" className="scroll-mt-20 space-y-6">
      {/* Top Banner & Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 p-6 sm:p-8 text-white shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-mono font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>PHARMACORE IN SILICO R&D SUITE</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
            About PharmaCore
          </h2>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-3xl">
            <strong>PharmaCore</strong> is a full-stack, enterprise-grade computational pharmaceutics and formulation engineering suite. It bridges physical chemistry, biopharmaceutics, and regulatory science to de-risk and accelerate the development of advanced drug delivery systems—including <strong>Lipid Nanoparticles (LNPs)</strong>, <strong>Amorphous Solid Dispersions (ASD)</strong>, and <strong>Pulmonary Inhalation Aerosols (DPI/MDI)</strong>.
          </p>

          {/* Quick Stat Badges */}
          <div className="pt-2 flex flex-wrap gap-3 text-xs font-mono">
            <span className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 text-slate-200">
              ICH Q8(R2) QbD & ICH Q1A Compliant
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 text-slate-200">
              NCBI PubChem PUG REST Live
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 text-slate-200">
              FDA IID & NIH GSRS Validated
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 text-slate-200">
              USP &lt;601&gt; & Ph. Eur. 2.9.18 Impactor Models
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Tabs */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50/75 overflow-x-auto text-xs font-semibold text-slate-600">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-5 py-3.5 flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600 bg-white font-bold'
                : 'border-transparent hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <Cpu className="w-4 h-4 text-blue-600" />
            <span>Platform Overview & Architecture</span>
          </button>

          <button
            onClick={() => setActiveTab('math')}
            className={`px-5 py-3.5 flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'math'
                ? 'border-blue-600 text-blue-600 bg-white font-bold'
                : 'border-transparent hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <Code2 className="w-4 h-4 text-amber-600" />
            <span>Mathematical Foundations & Equations</span>
          </button>

          <button
            onClick={() => setActiveTab('regulatory')}
            className={`px-5 py-3.5 flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'regulatory'
                ? 'border-blue-600 text-blue-600 bg-white font-bold'
                : 'border-transparent hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Regulatory Standards & Pharmacopeia</span>
          </button>

          <button
            onClick={() => setActiveTab('academic')}
            className={`px-5 py-3.5 flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'academic'
                ? 'border-blue-600 text-blue-600 bg-white font-bold'
                : 'border-transparent hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <Award className="w-4 h-4 text-purple-600" />
            <span>Academic Impact & Research Utility</span>
          </button>
        </div>

        {/* Tab 1: Platform Overview */}
        {activeTab === 'overview' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {coreModules.map((mod) => {
                const IconComponent = mod.icon;
                return (
                  <div
                    key={mod.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-blue-50/30 hover:border-blue-200 transition-all flex flex-col justify-between group"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-xs text-blue-600 group-hover:scale-105 transition-transform">
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700 font-semibold">
                          {mod.badge}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {mod.name}
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {mod.description}
                      </p>
                    </div>

                    {onNavigate && (
                      <button
                        onClick={() => onNavigate(mod.id)}
                        className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors pt-2 border-t border-slate-200/60"
                      >
                        <span>Open Studio</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Workflow Pipeline Callout */}
            <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <FileCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-blue-900">
                    Integrated End-to-End Formulation Development Lifecycle
                  </h4>
                  <p className="text-[11px] text-blue-800 leading-relaxed mt-0.5">
                    Seamlessly move from API structure retrieval to excipient compatibility screening, thermodynamic glass stability forecasting, cascade impactor aerosol sizing, and automated regulatory dossier generation.
                  </p>
                </div>
              </div>
              {onNavigate && (
                <button
                  onClick={() => onNavigate('workflow')}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shadow-xs shrink-0"
                >
                  View Workflow Engine
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Mathematical Foundations */}
        {activeTab === 'math' && (
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900">
                Rigorous Biophysical & Physicochemical Equations of State
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                PharmaCore embeds first-principles thermodynamic and kinetic formulations into every interactive simulation, eliminating empirical trial-and-error at the laboratory bench.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Equation 1: Gordon-Taylor */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 font-sans">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">
                    1. Gordon-Taylor Equation (Tg Prediction)
                  </span>
                  <span className="text-[10px] font-mono text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                    Thermodynamics
                  </span>
                </div>
                <div className="p-2.5 bg-slate-900 text-cyan-300 font-mono text-xs rounded">
                  Tg,blend = (w1·Tg1 + K·w2·Tg2) / (w1 + K·w2)
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Predicts the composite glass transition temperature of binary and ternary amorphous dispersions, where K ≈ (ρ1·Tg1)/(ρ2·Tg2) represents the free-volume interaction parameter. Also accounts for moisture plasticization via water (Tg,water = 138.15 K).
                </p>
              </div>

              {/* Equation 2: Hansen Solubility */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 font-sans">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">
                    2. Hansen Solubility Parameters & RED Index
                  </span>
                  <span className="text-[10px] font-mono text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                    Miscibility
                  </span>
                </div>
                <div className="p-2.5 bg-slate-900 text-cyan-300 font-mono text-xs rounded">
                  Ra = √[ 4(δD1-δD2)² + (δP1-δP2)² + (δH1-δH2)² ], RED = Ra / R0
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Calculates 3D solubility distance in Hansen space across dispersion (δD), polar (δP), and hydrogen-bonding (δH) forces. A Relative Energy Difference (RED) &lt; 1.0 confirms true thermodynamic miscibility.
                </p>
              </div>

              {/* Equation 3: Henry's Zeta Potential */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 font-sans">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">
                    3. Laser Electrophoresis & Henry Equation
                  </span>
                  <span className="text-[10px] font-mono text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                    Colloid Science
                  </span>
                </div>
                <div className="p-2.5 bg-slate-900 text-cyan-300 font-mono text-xs rounded">
                  μe = (2 · ε · ζ · f(κa)) / (3 · η)
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Converts laser Doppler electrophoretic mobility (μe) into surface Zeta potential (ζ) using Henry function f(κa) = 1.5 (Smoluchowski approximation for aqueous nanoparticle dispersions).
                </p>
              </div>

              {/* Equation 4: Log-Probit Aerodynamic Sizing */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 font-sans">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">
                    4. Log-Probit Cascade Impactor Regression
                  </span>
                  <span className="text-[10px] font-mono text-cyan-700 bg-cyan-100 px-2 py-0.5 rounded">
                    Aerosols
                  </span>
                </div>
                <div className="p-2.5 bg-slate-900 text-cyan-300 font-mono text-xs rounded">
                  Probit(Cumulative %) = Intercept + Slope · ln(Cutoff D50)
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Linearizes log-normal aerosol distributions to yield the Mass Median Aerodynamic Diameter (MMAD at 50% undersize) and Geometric Standard Deviation (GSD = √(D84.13/D15.87)).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Regulatory Standards */}
        {activeTab === 'regulatory' && (
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900">
                International Regulatory Compliance & Pharmacopeial Alignment
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every calculation and output within PharmaCore is structured to support regulatory submissions for Investigational New Drug (IND), Abbreviated New Drug Applications (ANDA), and New Drug Applications (NDA).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  <span>ICH Q8(R2)</span>
                </div>
                <span className="text-[10px] font-mono text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded font-semibold block w-fit">
                  Quality by Design (QbD)
                </span>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Design space definition linking Critical Process Parameters (CPPs) to Critical Quality Attributes (CQAs) including particle size, PDI, and stability margins.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>FDA IID Database</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded font-semibold block w-fit">
                  Excipient Safety
                </span>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Maximum potency validation by administration route and dosage form to prevent regulatory rejections due to unapproved excipient levels.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-cyan-600" />
                  <span>USP &lt;601&gt; & Ph. Eur.</span>
                </div>
                <span className="text-[10px] font-mono text-cyan-700 bg-cyan-100 px-1.5 py-0.5 rounded font-semibold block w-fit">
                  Inhalation Testing
                </span>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Next Generation Impactor (NGI) and Andersen Cascade Impactor (ACI) calibrated nozzle flow rate correction (Ph. Eur. 2.9.18).
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-purple-600" />
                  <span>ICH Q1A(R2)</span>
                </div>
                <span className="text-[10px] font-mono text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded font-semibold block w-fit">
                  Stability Testing
                </span>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Accelerated and long-term storage conditioning (25°C/60% RH, 30°C/65% RH, 40°C/75% RH) with moisture plasticization modeling.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Academic Impact */}
        {activeTab === 'academic' && (
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900">
                Academic Research, PhD Portfolios & Educational Utility
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                PharmaCore was designed from the ground up to support academic research in pharmaceutical nanotechnology, translational drug delivery, and computational formulation design.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-purple-600" />
                  <h4 className="text-xs font-bold text-slate-900">
                    PhD & Graduate Research Applications
                  </h4>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Demonstrates quantitative modeling competency in graduate applications, grant proposals, and research publications. Bridges theoretical coursework with practical formulation design.
                </p>
                <div className="pt-2 text-[11px] text-purple-700 font-mono">
                  Recommended fields: Pharmaceutics, Nanotechnology, Pulmonary Drug Delivery, Industrial Pharmacy.
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <h4 className="text-xs font-bold text-slate-900">
                    Interactive Teaching & Laboratory Training
                  </h4>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Provides university students, research fellows, and laboratory technicians with an intuitive environment to visualize the real-world impact of parameters like humidity, particle size, and excipient ratios.
                </p>
                {onOpenGlossary && (
                  <button
                    onClick={() => onOpenGlossary()}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline pt-1"
                  >
                    <span>Explore Comprehensive Scientific Glossary</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer Strip */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-mono">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">PharmaCore Suite v2.4</span>
            <span>·</span>
            <span>Computational Formulation & Biopharmaceutics Engine</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Compliant with FDA, EMA, USP, and ICH Guidelines
          </div>
        </div>
      </div>
    </section>
  );
};
