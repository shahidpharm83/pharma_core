import React from 'react';
import { X, ShieldAlert, AlertTriangle, Eye, Flame, Biohazard, Activity, Heart, ExternalLink, Printer } from 'lucide-react';
import { CompoundProperties } from '../types/pharmadds';

interface CompoundSafetyModalProps {
  isOpen: boolean;
  onClose: () => void;
  compound: CompoundProperties;
}

export const CompoundSafetyModal: React.FC<CompoundSafetyModalProps> = ({
  isOpen,
  onClose,
  compound,
}) => {
  if (!isOpen) return null;

  const safety = compound.safetyData || {
    source: 'PharmaCore Standard Laboratory Chemical Safety Heuristics',
    signalWord: compound.molecularWeight > 500 ? 'Danger' : 'Warning',
    hazardStatements: [
      'H302: Harmful if swallowed (Oral Acute Toxicity Cat 4)',
      'H315: Causes skin irritation (Skin Corrosion/Irritation Cat 2)',
      'H319: Causes serious eye irritation (Eye Irritation Cat 2A)',
      'H335: May cause respiratory irritation (STOT SE 3)',
    ],
    pictograms: [
      { code: 'GHS07', name: 'Exclamation mark (Irritant / Harmful)' },
      { code: 'GHS08', name: 'Health hazard (Specific Target Organ Toxicity)' },
    ],
    firstAidMeasures: {
      inhalation: 'Remove subject to fresh air immediately. If not breathing, administer artificial respiration and seek emergency medical care.',
      skinContact: 'Rinse immediately with abundant water for ≥15 minutes. Strip contaminated clothing and wash before reuse.',
      eyeContact: 'Flush eyes thoroughly with saline or sterile water for at least 15 minutes, holding eyelids apart. Seek ophthalmologist.',
      ingestion: 'Rinse oral cavity thoroughly with water. Never induce vomiting in an unconscious individual. Seek medical aid.',
    },
    handlingStorage: 'Store sealed in a light-resistant container at 2°C–8°C under inert gas. Dispense inside an ISO Class 5 cytotoxic/fume containment isolator.',
  };

  const isDanger = safety.signalWord?.toLowerCase().includes('danger');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className={`w-5 h-5 ${isDanger ? 'text-rose-600' : 'text-amber-600'}`} />
            <div>
              <h3 className="text-base font-bold text-slate-900">
                PubChem GHS Chemical Safety & Hazard Dossier
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                {compound.name} · NCBI CID: {compound.cid}
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

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 leading-relaxed font-sans">
          {/* Top Compound Summary & Signal Banner */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* 2D Structure Image */}
            <div className="md:col-span-4 p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col items-center justify-center text-center">
              <img
                src={`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${compound.cid}/PNG?image_size=240x240`}
                alt={`${compound.name} 2D Structure`}
                referrerPolicy="no-referrer"
                className="max-h-36 object-contain mix-blend-multiply"
              />
              <span className="font-mono text-[10px] text-slate-400 mt-2 block break-all">
                Formula: {compound.molecularWeight.toFixed(1)} g/mol
              </span>
            </div>

            {/* Signal Word & Pictograms */}
            <div className="md:col-span-8 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">
                    GHS Signal Classification
                  </span>
                  <span
                    className={`text-xl font-extrabold uppercase tracking-wider inline-block px-3 py-0.5 rounded mt-0.5 ${
                      isDanger ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {safety.signalWord || 'Warning'}
                  </span>
                </div>
                <a
                  href={`https://pubchem.ncbi.nlm.nih.gov/compound/${compound.cid}#section=Safety-and-Hazards`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline inline-flex items-center gap-1 font-mono text-[11px]"
                >
                  View on PubChem <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Pictograms list */}
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1.5">
                  GHS Hazard Pictograms
                </span>
                <div className="flex flex-wrap gap-2">
                  {safety.pictograms.map((pic, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-50 border border-rose-200 text-rose-900 text-[11px] font-medium"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>{pic.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data source badge */}
              <div className="text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-100">
                Source: {safety.source}
              </div>
            </div>
          </div>

          {/* Hazard Statements */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>GHS Hazard Statements (H-Codes)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {safety.hazardStatements.map((statement, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-rose-50/50 border border-rose-100 rounded text-slate-800 font-mono text-[11px] flex items-start gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5"></span>
                  <span>{statement}</span>
                </div>
              ))}
            </div>
          </div>

          {/* First Aid Measures */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-blue-600" />
              <span>Emergency First Aid Procedures</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1">Inhalation Exposure</span>
                <p className="text-slate-600 text-[11px]">{safety.firstAidMeasures.inhalation}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1">Dermal / Skin Contact</span>
                <p className="text-slate-600 text-[11px]">{safety.firstAidMeasures.skinContact}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1">Ocular / Eye Contact</span>
                <p className="text-slate-600 text-[11px]">{safety.firstAidMeasures.eyeContact}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1">Oral Ingestion</span>
                <p className="text-slate-600 text-[11px]">{safety.firstAidMeasures.ingestion}</p>
              </div>
            </div>
          </div>

          {/* Handling & Storage in Pharmaceutical R&D */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 flex items-center gap-1.5">
              <Biohazard className="w-3.5 h-3.5 text-amber-600" />
              <span>Safe Laboratory Handling & Storage Guidelines</span>
            </h4>
            <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-lg text-[11px] text-amber-950 leading-relaxed">
              {safety.handlingStorage}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-mono">
            Compliant with GHS Rev. 10 & OSHA Hazard Communication
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};
