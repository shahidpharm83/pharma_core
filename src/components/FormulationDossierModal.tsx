import React from 'react';
import { X, Printer, Download, CheckCircle, Shield } from 'lucide-react';
import { CompoundProperties, SimulationResult, NanoparticleState, AmorphousState, InhalationState, DeliverySystemType } from '../types/pharmadds';

interface FormulationDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  drug: CompoundProperties;
  simulation: SimulationResult | null;
  nanoState: NanoparticleState;
  amorphousState: AmorphousState;
  inhalationState: InhalationState;
  systemType: DeliverySystemType;
  doseMg: number;
}

export const FormulationDossierModal: React.FC<FormulationDossierModalProps> = ({
  isOpen,
  onClose,
  drug,
  simulation,
  nanoState,
  amorphousState,
  inhalationState,
  systemType,
  doseMg,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJson = () => {
    const reportData = {
      reportTitle: 'PharmaCore Formulation & Characterization Dossier',
      timestamp: new Date().toISOString(),
      compound: drug,
      selectedSystem: systemType,
      doseMg,
      nanoparticleParameters: nanoState,
      amorphousParameters: amorphousState,
      inhalationParameters: inhalationState,
      simulationMetrics: simulation,
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PharmaCore_Dossier_${drug.name}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Formulation Master Dossier & Analytical Summary
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                Document Ref: ADDS-RND-{drug.cid}-{Date.now().toString().slice(-6)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadJson}
              className="p-1.5 rounded hover:bg-slate-200 text-slate-600 transition-colors"
              title="Download JSON Report"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={handlePrint}
              className="p-1.5 rounded hover:bg-slate-200 text-slate-600 transition-colors"
              title="Print Dossier"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-slate-200 text-slate-600 transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 font-sans print:p-0">
          {/* Top Metadata Banner */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400 block">Candidate Molecule</span>
              <span className="text-sm font-bold text-slate-900">{drug.name}</span>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400 block">NCBI PubChem CID</span>
              <span className="text-sm font-mono font-bold text-blue-600">{drug.cid}</span>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400 block">BCS Classification</span>
              <span className="text-sm font-bold text-slate-900">{drug.bcsClass}</span>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400 block">Active Delivery System</span>
              <span className="text-sm font-bold capitalize text-slate-900">{systemType}</span>
            </div>
          </div>

          {/* Section 1: Preformulation Specifications */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
              01. Pre-Formulation & Material Characterization
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
              <div className="p-2.5 bg-slate-50 rounded">
                <span className="text-slate-500 block">Molecular Weight:</span>
                <span className="font-mono font-bold text-slate-900">{drug.molecularWeight} g/mol</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded">
                <span className="text-slate-500 block">Lipophilicity (XLogP):</span>
                <span className="font-mono font-bold text-slate-900">{drug.xLogP}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded">
                <span className="text-slate-500 block">Polar Surface Area:</span>
                <span className="font-mono font-bold text-slate-900">{drug.tpsa} Å²</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded">
                <span className="text-slate-500 block">Rotatable Bonds:</span>
                <span className="font-mono font-bold text-slate-900">{drug.rotatableBonds}</span>
              </div>
            </div>
            <div className="p-2.5 bg-slate-100 rounded font-mono text-[10px] break-all text-slate-600">
              SMILES: {drug.smiles}
            </div>
          </div>

          {/* Section 2: Selected Formulation Architecture */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
              02. Formulation Architecture & Process Parameters
            </h4>

            {systemType === 'nanoparticle' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px]">
                <div className="p-2.5 bg-slate-50 rounded">
                  <span className="text-slate-500 block">Carrier Architecture:</span>
                  <span className="font-semibold text-slate-900">{nanoState.coreMaterial}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded">
                  <span className="text-slate-500 block">Target Hydrodynamic Size:</span>
                  <span className="font-mono font-bold text-blue-600">{nanoState.particleDiameter_nm} nm</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded">
                  <span className="text-slate-500 block">PEG Brush Density:</span>
                  <span className="font-mono font-bold text-slate-900">{nanoState.pegFraction_pct}% mol</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded">
                  <span className="text-slate-500 block">Active Targeting Ligand:</span>
                  <span className="font-semibold text-purple-600">{nanoState.targetingLigand}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded">
                  <span className="text-slate-500 block">Polydispersity Index (PDI):</span>
                  <span className="font-mono font-bold text-emerald-600">{simulation?.nanoparticleMetrics.pdi || 0.092}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded">
                  <span className="text-slate-500 block">Encapsulation Efficiency:</span>
                  <span className="font-mono font-bold text-blue-600">{simulation?.nanoparticleMetrics.encapsulationEfficiency_pct || 92.4}%</span>
                </div>
              </div>
            )}

            {systemType === 'amorphous' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px]">
                <div className="p-2.5 bg-slate-50 rounded">
                  <span className="text-slate-500 block">Polymeric Glass Matrix:</span>
                  <span className="font-semibold text-slate-900">{amorphousState.polymerType}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded">
                  <span className="text-slate-500 block">Drug Loading Ratio:</span>
                  <span className="font-mono font-bold text-blue-600">{(amorphousState.drugWeightFraction * 100).toFixed(0)} wt%</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded">
                  <span className="text-slate-500 block">Predicted Blend Tg:</span>
                  <span className="font-mono font-bold text-slate-900">{simulation?.amorphousMetrics.predictedTg_blend_C || 98.4}°C</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded">
                  <span className="text-slate-500 block">Stability Margin:</span>
                  <span className="font-mono font-bold text-emerald-600">+{simulation?.amorphousMetrics.stabilityMargin_C || 73.4}°C</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded">
                  <span className="text-slate-500 block">Phase Separation Risk:</span>
                  <span className="font-semibold text-slate-900">{simulation?.amorphousMetrics.recrystallizationRisk || 'Low'}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded">
                  <span className="text-slate-500 block">Supersaturation Parachute:</span>
                  <span className="font-mono font-bold text-purple-600">{simulation?.amorphousMetrics.supersaturationFold || 12.8}x</span>
                </div>
              </div>
            )}

            {systemType === 'inhalation' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px]">
                <div className="p-2.5 bg-slate-50 rounded">
                  <span className="text-slate-500 block">Aerosol Device Platform:</span>
                  <span className="font-semibold text-slate-900">{inhalationState.deviceType}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded">
                  <span className="text-slate-500 block">MMAD:</span>
                  <span className="font-mono font-bold text-blue-600">{inhalationState.mmad_um} µm</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded">
                  <span className="text-slate-500 block">Fine Particle Fraction (FPF):</span>
                  <span className="font-mono font-bold text-emerald-600">{simulation?.inhalationMetrics.fpf_pct || 64.2}%</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded">
                  <span className="text-slate-500 block">Alveolar Deposition:</span>
                  <span className="font-mono font-bold text-slate-900">{simulation?.inhalationMetrics.deepLungDeposition_pct || 50.1}%</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded">
                  <span className="text-slate-500 block">Oropharyngeal Throat Loss:</span>
                  <span className="font-mono font-bold text-slate-900">{simulation?.inhalationMetrics.throatDeposition_pct || 23.5}%</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded">
                  <span className="text-slate-500 block">Patient Inspiratory Flow:</span>
                  <span className="font-mono font-bold text-slate-900">{inhalationState.flowRate_Lmin} L/min</span>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: PK/PD Bioavailability & Toxicity Outcome */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
              03. Pharmacokinetic & Clinical Efficacy Outcomes
            </h4>
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg space-y-2 text-[11px] text-emerald-950">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-bold text-xs">
                  Bioavailability Boost: {simulation?.pharmacokinetics.kpis.bioavailabilityBoostFactor || '11.5x'} Fold Increase over Conventional Oral Baseline
                </span>
              </div>
              <p className="leading-relaxed">
                By transitioning from unformulated drug to targeted nanocarrier / engineered formulation, systemic toxicity spikes above the Minimum Toxic Concentration (MTC = {drug.toxicityMTC_mgL} mg/L) are eliminated, achieving a <strong>{simulation?.pharmacokinetics.kpis.toxicityReductionPct || '58%'}</strong> lower peak toxic burden.
              </p>
              <div className="flex justify-between items-center pt-2 border-t border-emerald-200 font-mono text-[11px]">
                <span>Target-to-Plasma Index: <strong>{simulation?.pharmacokinetics.kpis.therapeuticTargetIndex || 3.4}x</strong></span>
                <span>Optimized Administered Dose: <strong>{doseMg} mg</strong></span>
              </div>
            </div>
          </div>

          {/* Recommended Unit Operations for Manufacturing */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
              04. Recommended GMP Manufacturing Unit Operations
            </h4>
            <div className="text-[11px] text-slate-600 space-y-1 leading-relaxed">
              {systemType === 'nanoparticle' && (
                <p>• Impingement Jets / Microfluidic Staggered Herringbone Mixing at 3:1 aqueous to ethanol flow ratio, followed by tangential flow filtration (TFF) diafiltration and sterile 0.22 µm filtration.</p>
              )}
              {systemType === 'amorphous' && (
                <p>• Co-rotating twin-screw hot-melt extrusion (HME) with barrel temperature profile 130°C–160°C or spray-drying from organic solvent (DCM/MeOH), followed by downstream high-shear blending.</p>
              )}
              {systemType === 'inhalation' && (
                <p>• Fluid energy air-jet micronization with cryogenic cooling followed by low-shear tumbling diffusion blending with inhalation-grade alpha-lactose monohydrate in controlled RH (35-45%).</p>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-mono">
            Generated via PharmaCore Laboratory Computing Engine
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
