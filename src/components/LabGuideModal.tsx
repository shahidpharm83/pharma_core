import React from 'react';
import { X, BookOpen, CheckCircle, ShieldAlert, Sparkles, Wind, Layers } from 'lucide-react';

interface LabGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LabGuideModal: React.FC<LabGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Advanced Drug Delivery Systems (ADDS) - Scientific Guide & Lab Manual
              </h3>
              <p className="text-xs text-slate-500">
                Comprehensive R&D Laboratory Reference & Regulatory Documentation Guide
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 leading-relaxed font-sans">
          {/* Section 1: Core Objective */}
          <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-lg space-y-2 text-blue-950">
            <h4 className="font-bold text-sm text-blue-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Core Scientific Objective: "Maximized Therapeutic Efficacy with Minimized Toxicity"</span>
            </h4>
            <p>
              In conventional dosage forms (such as standard tablets or IV bolus injections), a large fraction of the active pharmaceutical ingredient (API) is prematurely metabolized in liver first-pass or distributed nonspecifically to healthy tissues (heart, kidneys, bone marrow), leading to severe systemic toxicity.
            </p>
            <p>
              Advanced targeted drug delivery systems transport active payloads directly to pathological sites (e.g., solid tumor microenvironments or bronchial airways). Consequently, therapeutic outcomes are achieved using only <strong>10% to 20% of conventional clinical doses</strong> while maintaining circulating plasma concentrations well below toxic thresholds.
            </p>
          </div>

          {/* Section 2: Nanoparticle Science */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              1. Nanotechnology & Lipid Nanoparticles (LNPs)
            </h4>
            <div className="space-y-2 pl-4">
              <p>
                <strong>Lipid Nanoparticles (LNPs) & Liposomes:</strong> Composed of ionizable lipids (e.g., SM-102), helper phospholipids (DSPC), cholesterol, and PEGylated lipids (DMG-PEG2000) assembled into vesicles ranging from 70 to 120 nm.
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                <li>
                  <strong>Passive Targeting (EPR Effect):</strong> Enhanced Permeability and Retention effect allows nanoscale carriers to extravasate through fenestrated tumor endothelia and accumulate locally.
                </li>
                <li>
                  <strong>Active Targeting (Ligand-Receptor Mediated):</strong> Surface functionalization with folate, transferrin, or monoclonal antibody fragments enables receptor-mediated endocytosis into target cancer cells.
                </li>
                <li>
                  <strong>Zeta Potential & Colloidal Stability:</strong> Maintaining surface charge magnitude above ±30 mV or utilizing steric PEG shielding prevents particle aggregation and rapid clearance.
                </li>
              </ul>
            </div>
          </div>

          {/* Section 3: Amorphous Solid Dispersions */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-600"></span>
              2. Amorphous Solid Dispersions (ASD)
            </h4>
            <div className="space-y-2 pl-4">
              <p>
                BCS Class II and IV drugs (e.g., Itraconazole, Paclitaxel, Curcumin) exhibit extremely low aqueous solubility in their crystalline state. Converting them into amorphous high-energy solid dispersions dramatically enhances dissolution rate and oral bioavailability.
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                <li>
                  <strong>Gordon-Taylor Equation:</strong> Predicts the glass transition temperature ($T_g$) of polymer-drug binary systems. Ensuring $T_g$ remains at least 50°C above storage temperature prevents physical aging and recrystallization.
                </li>
                <li>
                  <strong>Spring & Parachute Effect:</strong> Solubilizing amorphous APIs generates a supersaturated "spring" state. Appropriate polymer matrices (HPMC-AS, Copovidone) act as a "parachute," maintaining high supersaturation without precipitation across the gastrointestinal tract.
                </li>
              </ul>
            </div>
          </div>

          {/* Section 4: Inhalation Science */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-600"></span>
              3. Inhalation Science: pMDIs & Dry Powder Inhalers (DPI)
            </h4>
            <div className="space-y-2 pl-4">
              <p>
                Pulmonary delivery targets respiratory conditions (asthma, COPD) locally while avoiding hepatic first-pass metabolism and systemic cardiac side effects associated with oral administration.
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                <li>
                  <strong>Aerodynamic Diameter (MMAD):</strong> Particles with Mass Median Aerodynamic Diameter between 1 to 5 µm successfully penetrate deep into bronchial and alveolar regions.
                </li>
                <li>
                  <strong>NGI Cascade Impactor Testing:</strong> 8-stage cascade impactors measure Fine Particle Fraction (FPF) and regional lung deposition in vitro according to USP &lt;601&gt; / Ph. Eur. 2.9.18.
                </li>
                <li>
                  <strong>Eco-Friendly Propellants:</strong> Transitioning to advanced HFO-1234ze propellants reduces global warming potential to near-zero standards.
                </li>
              </ul>
            </div>
          </div>

          {/* Section 5: Calculator Models */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-lg space-y-3 text-emerald-950">
            <h5 className="font-bold text-xs text-emerald-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>International Advanced Calculator Modules:</span>
            </h5>
            <div className="space-y-2 text-[11px] leading-relaxed">
              <p>
                <strong>1. Inhalation & Aerodynamic Cascade Calculator (USP &lt;601&gt; / Ph.Eur 2.9.18):</strong> Processes stage mass depositions via log-probabilistic linear regression to calculate MMAD, GSD, Fine Particle Dose (FPD &lt; 5µm), and Respirable Fraction.
              </p>
              <p>
                <strong>2. Amorphous Dispersion & Polymer Miscibility Index (HSP & Gordon-Taylor):</strong> Computes 3D Hansen solubility parameters ($\delta_D, \delta_P, \delta_H$), interaction distance ($R_a$), and Relative Energy Difference (RED &lt; 1.0) alongside moisture-plasticized Tg degradation curves.
              </p>
              <p>
                <strong>3. Nanoparticle Characterization Studio (DLS, Zeta & EE%):</strong> Evaluates cumulant PDI, Smoluchowski electrokinetic zeta potential, and ultrafiltration encapsulation efficiency (%EE).
              </p>
            </div>
          </div>

          {/* Section 6: PubChem PUG REST API */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 text-slate-700">
            <h5 className="font-bold text-xs text-slate-900">Open-Source Database Integration (PubChem PUG REST API)</h5>
            <p className="text-[11px]">
              This application integrates directly with the US National Center for Biotechnology Information (NCBI) <strong>PubChem REST API</strong>. Querying any drug name retrieves verified chemical structures, molecular weights, logP, 3D conformers, and Lipinski's Rule of Five parameters in real time.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
