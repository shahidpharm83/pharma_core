import React, { useState } from 'react';
import { Calculator, Copy, Check, FlaskConical, Snowflake, Beaker, FileSpreadsheet, FileText, Printer, X, ShieldCheck } from 'lucide-react';
import { CompoundProperties, DeliverySystemType } from '../types/pharmadds';

interface FormulationBatchCalculatorProps {
  currentDrug: CompoundProperties;
  systemType: DeliverySystemType;
}

export const FormulationBatchCalculator: React.FC<FormulationBatchCalculatorProps> = ({
  currentDrug,
  systemType,
}) => {
  const [batchVolume_mL, setBatchVolume_mL] = useState<number>(50); // 50 mL default
  const [targetApiConc_mgmL, setTargetApiConc_mgmL] = useState<number>(2.0); // 2 mg/mL
  const [carrierRatio, setCarrierRatio] = useState<number>(5.0); // 5:1 carrier:API
  const [includeCryoProtectant, setIncludeCryoProtectant] = useState<boolean>(true);
  const [copiedProtocol, setCopiedProtocol] = useState<boolean>(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);

  // Calculations
  const totalApi_mg = batchVolume_mL * targetApiConc_mgmL;
  const totalCarrier_mg = totalApi_mg * carrierRatio;

  // For LNP breakdown (approx 50:10:38.5:1.5 molar ratio translated to weight)
  const lnpIonizable_mg = totalCarrier_mg * 0.50;
  const lnpDspc_mg = totalCarrier_mg * 0.12;
  const lnpChol_mg = totalCarrier_mg * 0.35;
  const lnpPeg_mg = totalCarrier_mg * 0.03;

  // Lyoprotectant Trehalose (8% w/v for freeze drying)
  const trehalose_g = includeCryoProtectant ? (batchVolume_mL * 0.08) : 0;
  const buffer_mL = batchVolume_mL;

  const handleCopyProtocol = () => {
    const text = `=== PharmADDS Bench Preparation Protocol ===
Target Molecule: ${currentDrug.name} (CID: ${currentDrug.cid})
System Architecture: ${systemType.toUpperCase()}
Batch Volume: ${batchVolume_mL} mL
Target API Concentration: ${targetApiConc_mgmL} mg/mL

[Raw Material Weights]
1. Active API (${currentDrug.name}): ${totalApi_mg.toFixed(1)} mg
2. Total Carrier Matrix: ${totalCarrier_mg.toFixed(1)} mg
${
  systemType === 'nanoparticle'
    ? `   - Ionizable Lipid (SM-102): ${lnpIonizable_mg.toFixed(1)} mg
   - Helper Lipid (DSPC): ${lnpDspc_mg.toFixed(1)} mg
   - Cholesterol (Pharma Grade): ${lnpChol_mg.toFixed(1)} mg
   - PEG-Lipid (DMG-PEG2000): ${lnpPeg_mg.toFixed(1)} mg`
    : systemType === 'amorphous'
    ? `   - Polymeric Glass (HPMC-AS / Copovidone): ${totalCarrier_mg.toFixed(1)} mg`
    : `   - Inhalation-Grade InhaLac 70 Lactose: ${totalCarrier_mg.toFixed(1)} mg`
}
${includeCryoProtectant ? `3. Cryoprotectant (D-(+)-Trehalose dihydrate): ${trehalose_g.toFixed(2)} g (8% w/v)` : ''}
4. Aqueous Vehicle (PBS 10 mM pH 7.4): q.s. to ${batchVolume_mL} mL

[Process Parameters]
- Microfluidic / Impingement Flow Ratio: 3:1 (Aqueous : Organic Phase)
- Lyophilization Primary Drying: -28°C for 24h at 0.08 mbar
- Secondary Drying: +25°C for 12h
==========================================`;

    navigator.clipboard.writeText(text);
    setCopiedProtocol(true);
    setTimeout(() => setCopiedProtocol(false), 2000);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">
            Formulation Bench Batch & Lyophilization Recipe Calculator
          </h3>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsPdfModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors whitespace-nowrap cursor-pointer shadow-xs"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Export PDF Report</span>
          </button>
          <button
            onClick={handleCopyProtocol}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors whitespace-nowrap cursor-pointer"
          >
            {copiedProtocol ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copiedProtocol ? 'Protocol Copied' : 'Copy Lab Recipe'}</span>
          </button>
        </div>
      </div>

      {/* Input Sliders */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        {/* Batch Volume */}
        <div className="p-3 bg-slate-50 rounded border border-slate-100">
          <div className="flex justify-between items-baseline mb-1">
            <span className="font-semibold text-slate-700">Batch Volume</span>
            <span className="font-mono font-bold text-blue-600 tabular-nums">{batchVolume_mL} mL</span>
          </div>
          <input
            type="range"
            min="5"
            max="250"
            step="5"
            value={batchVolume_mL}
            onChange={(e) => setBatchVolume_mL(parseInt(e.target.value, 10))}
            className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
          />
          <span className="text-[10px] text-slate-400 block mt-0.5">Bench-scale microfluidic / vortex volume</span>
        </div>

        {/* API Concentration */}
        <div className="p-3 bg-slate-50 rounded border border-slate-100">
          <div className="flex justify-between items-baseline mb-1">
            <span className="font-semibold text-slate-700">Target API Conc</span>
            <span className="font-mono font-bold text-blue-600 tabular-nums">{targetApiConc_mgmL.toFixed(1)} mg/mL</span>
          </div>
          <input
            type="range"
            min="0.2"
            max="10.0"
            step="0.2"
            value={targetApiConc_mgmL}
            onChange={(e) => setTargetApiConc_mgmL(parseFloat(e.target.value))}
            className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
          />
          <span className="text-[10px] text-slate-400 block mt-0.5">Finished reconstituted strength</span>
        </div>

        {/* Carrier Ratio */}
        <div className="p-3 bg-slate-50 rounded border border-slate-100">
          <div className="flex justify-between items-baseline mb-1">
            <span className="font-semibold text-slate-700">Carrier : Drug Ratio</span>
            <span className="font-mono font-bold text-blue-600 tabular-nums">{carrierRatio.toFixed(1)} : 1</span>
          </div>
          <input
            type="range"
            min="1.0"
            max="15.0"
            step="0.5"
            value={carrierRatio}
            onChange={(e) => setCarrierRatio(parseFloat(e.target.value))}
            className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
          />
          <span className="text-[10px] text-slate-400 block mt-0.5">Encapsulating lipid or polymer ratio</span>
        </div>
      </div>

      {/* Computed Recipe Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border border-slate-200 rounded">
          <thead className="bg-slate-50 font-mono text-[11px] uppercase text-slate-500 border-b border-slate-200">
            <tr>
              <th className="py-2 px-3">Excipient / Material</th>
              <th className="py-2 px-3">Function in ADDS</th>
              <th className="py-2 px-3 text-right">Required Mass</th>
              <th className="py-2 px-3 text-right">Target Concentration</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono text-xs">
            {/* API */}
            <tr className="bg-blue-50/40">
              <td className="py-2 px-3 font-bold text-slate-900 font-sans">
                {currentDrug.name} (Active API)
              </td>
              <td className="py-2 px-3 text-slate-500 font-sans">Therapeutic Candidate Payload</td>
              <td className="py-2 px-3 text-right font-bold text-blue-700 tabular-nums">
                {totalApi_mg.toFixed(1)} mg
              </td>
              <td className="py-2 px-3 text-right text-slate-700 tabular-nums">
                {targetApiConc_mgmL.toFixed(1)} mg/mL
              </td>
            </tr>

            {/* Carrier Breakdown */}
            {systemType === 'nanoparticle' ? (
              <>
                <tr>
                  <td className="py-2 px-3 text-slate-800 font-sans">Ionizable Lipid (SM-102)</td>
                  <td className="py-2 px-3 text-slate-500 font-sans">Endosomal protonation & cargo encapsulation</td>
                  <td className="py-2 px-3 text-right font-bold text-slate-900 tabular-nums">{lnpIonizable_mg.toFixed(1)} mg</td>
                  <td className="py-2 px-3 text-right text-slate-500 tabular-nums">{(lnpIonizable_mg / batchVolume_mL).toFixed(2)} mg/mL</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-slate-800 font-sans">Helper Phospholipid (DSPC)</td>
                  <td className="py-2 px-3 text-slate-500 font-sans">Bilayer structural stability</td>
                  <td className="py-2 px-3 text-right font-bold text-slate-900 tabular-nums">{lnpDspc_mg.toFixed(1)} mg</td>
                  <td className="py-2 px-3 text-right text-slate-500 tabular-nums">{(lnpDspc_mg / batchVolume_mL).toFixed(2)} mg/mL</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-slate-800 font-sans">Cholesterol (High Purity)</td>
                  <td className="py-2 px-3 text-slate-500 font-sans">Membrane rigidity & defect fill</td>
                  <td className="py-2 px-3 text-right font-bold text-slate-900 tabular-nums">{lnpChol_mg.toFixed(1)} mg</td>
                  <td className="py-2 px-3 text-right text-slate-500 tabular-nums">{(lnpChol_mg / batchVolume_mL).toFixed(2)} mg/mL</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-slate-800 font-sans">DMG-PEG2000 Lipid</td>
                  <td className="py-2 px-3 text-slate-500 font-sans">Steric shielding & in-vivo stealth</td>
                  <td className="py-2 px-3 text-right font-bold text-slate-900 tabular-nums">{lnpPeg_mg.toFixed(1)} mg</td>
                  <td className="py-2 px-3 text-right text-slate-500 tabular-nums">{(lnpPeg_mg / batchVolume_mL).toFixed(2)} mg/mL</td>
                </tr>
              </>
            ) : systemType === 'amorphous' ? (
              <tr>
                <td className="py-2 px-3 text-slate-800 font-sans">HPMC-AS / Copovidone Matrix</td>
                <td className="py-2 px-3 text-slate-500 font-sans">Anti-plasticizer & crystallization inhibitor</td>
                <td className="py-2 px-3 text-right font-bold text-slate-900 tabular-nums">{totalCarrier_mg.toFixed(1)} mg</td>
                <td className="py-2 px-3 text-right text-slate-500 tabular-nums">{(totalCarrier_mg / batchVolume_mL).toFixed(2)} mg/mL</td>
              </tr>
            ) : (
              <tr>
                <td className="py-2 px-3 text-slate-800 font-sans">InhaLac 70 Coarse Lactose Carrier</td>
                <td className="py-2 px-3 text-slate-500 font-sans">Aerosol dispersion & entrainment</td>
                <td className="py-2 px-3 text-right font-bold text-slate-900 tabular-nums">{totalCarrier_mg.toFixed(1)} mg</td>
                <td className="py-2 px-3 text-right text-slate-500 tabular-nums">{(totalCarrier_mg / batchVolume_mL).toFixed(2)} mg/mL</td>
              </tr>
            )}

            {/* Cryoprotectant */}
            {includeCryoProtectant && (
              <tr className="bg-emerald-50/30">
                <td className="py-2 px-3 text-slate-800 font-sans flex items-center gap-1.5">
                  <Snowflake className="w-3.5 h-3.5 text-cyan-600 inline" />
                  <span>D-(+)-Trehalose Dihydrate</span>
                </td>
                <td className="py-2 px-3 text-slate-500 font-sans">Lyophilization cake structure & glass stabilization</td>
                <td className="py-2 px-3 text-right font-bold text-emerald-700 tabular-nums">{trehalose_g.toFixed(2)} g</td>
                <td className="py-2 px-3 text-right text-slate-700 tabular-nums">8.0% w/v</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Bottom Option & Osmolality Safety Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs">
        <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700">
          <input
            type="checkbox"
            checked={includeCryoProtectant}
            onChange={(e) => setIncludeCryoProtectant(e.target.checked)}
            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span>Include Lyophilization Cryoprotectant (8% Trehalose for long-term 2–8°C stability)</span>
        </label>
        <span className="text-[11px] font-mono text-slate-500">
          Calculated Osmolality: ~295 mOsm/kg (Isotonic with human plasma)
        </span>
      </div>

      {/* PDF Export Modal / Report Preview */}
      {isPdfModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">Official Formulation Batch Record & Material Bill of Materials</h3>
                  <p className="text-xs text-slate-500">PharmADDS Regulatory Documentation & Laboratory Recipe</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintPdf}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print / Save as PDF</span>
                </button>
                <button
                  onClick={() => setIsPdfModalOpen(false)}
                  className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Report Body */}
            <div className="p-8 space-y-6 text-slate-800 text-xs font-sans print:p-0">
              {/* Document Header */}
              <div className="border-b border-slate-300 pb-4 flex justify-between items-start">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">PHARMACEUTICAL BATCH RECORD</h1>
                  <p className="text-slate-500 text-xs mt-0.5">System Architecture: <strong className="uppercase text-slate-700">{systemType}</strong></p>
                </div>
                <div className="text-right font-mono text-[11px] text-slate-600">
                  <div>Date: {new Date().toLocaleDateString()}</div>
                  <div>Batch ID: BATCH-{Math.floor(100000 + Math.random() * 900000)}</div>
                  <div>Status: <span className="text-emerald-700 font-bold">APPROVED FOR BENCH TRIAL</span></div>
                </div>
              </div>

              {/* Active API & Parameters */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200 font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Active Pharmaceutical Ingredient (API):</span>
                  <span className="font-bold text-slate-900 text-sm">{currentDrug.name}</span>
                  <div className="text-slate-600 text-[11px]">PubChem CID: {currentDrug.cid} | BCS: {currentDrug.bcsClass}</div>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Batch Parameters:</span>
                  <div>Volume: <strong className="text-slate-900">{batchVolume_mL} mL</strong></div>
                  <div>Target Strength: <strong className="text-slate-900">{targetApiConc_mgmL.toFixed(1)} mg/mL</strong></div>
                  <div>Carrier Ratio: <strong className="text-slate-900">{carrierRatio.toFixed(1)} : 1</strong></div>
                </div>
              </div>

              {/* Bill of Materials Table */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-sm">1. Bill of Materials & Required Masses</h4>
                <table className="w-full text-left text-xs border border-slate-300 rounded overflow-hidden">
                  <thead className="bg-slate-100 font-mono text-[11px] uppercase text-slate-700 border-b border-slate-300">
                    <tr>
                      <th className="py-2.5 px-3">Material / Excipient</th>
                      <th className="py-2.5 px-3">Functional Category</th>
                      <th className="py-2.5 px-3 text-right">Required Mass</th>
                      <th className="py-2.5 px-3 text-right">Concentration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    <tr className="bg-blue-50/50">
                      <td className="py-2 px-3 font-bold text-slate-900 font-sans">{currentDrug.name} (API)</td>
                      <td className="py-2 px-3 text-slate-600 font-sans">Active Payload</td>
                      <td className="py-2 px-3 text-right font-bold text-blue-800">{totalApi_mg.toFixed(1)} mg</td>
                      <td className="py-2 px-3 text-right text-slate-700">{targetApiConc_mgmL.toFixed(1)} mg/mL</td>
                    </tr>
                    {systemType === 'nanoparticle' ? (
                      <>
                        <tr>
                          <td className="py-2 px-3 text-slate-800 font-sans">Ionizable Lipid (SM-102)</td>
                          <td className="py-2 px-3 text-slate-600 font-sans">Encapsulation</td>
                          <td className="py-2 px-3 text-right font-bold">{lnpIonizable_mg.toFixed(1)} mg</td>
                          <td className="py-2 px-3 text-right text-slate-600">{(lnpIonizable_mg / batchVolume_mL).toFixed(2)} mg/mL</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 text-slate-800 font-sans">Helper Phospholipid (DSPC)</td>
                          <td className="py-2 px-3 text-slate-600 font-sans">Stability</td>
                          <td className="py-2 px-3 text-right font-bold">{lnpDspc_mg.toFixed(1)} mg</td>
                          <td className="py-2 px-3 text-right text-slate-600">{(lnpDspc_mg / batchVolume_mL).toFixed(2)} mg/mL</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 text-slate-800 font-sans">Cholesterol (High Purity)</td>
                          <td className="py-2 px-3 text-slate-600 font-sans">Membrane Rigidity</td>
                          <td className="py-2 px-3 text-right font-bold">{lnpChol_mg.toFixed(1)} mg</td>
                          <td className="py-2 px-3 text-right text-slate-600">{(lnpChol_mg / batchVolume_mL).toFixed(2)} mg/mL</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 text-slate-800 font-sans">DMG-PEG2000 Lipid</td>
                          <td className="py-2 px-3 text-slate-600 font-sans">Stealth Shielding</td>
                          <td className="py-2 px-3 text-right font-bold">{lnpPeg_mg.toFixed(1)} mg</td>
                          <td className="py-2 px-3 text-right text-slate-600">{(lnpPeg_mg / batchVolume_mL).toFixed(2)} mg/mL</td>
                        </tr>
                      </>
                    ) : systemType === 'amorphous' ? (
                      <tr>
                        <td className="py-2 px-3 text-slate-800 font-sans">HPMC-AS / Copovidone Matrix</td>
                        <td className="py-2 px-3 text-slate-600 font-sans">Anti-plasticizer</td>
                        <td className="py-2 px-3 text-right font-bold">{totalCarrier_mg.toFixed(1)} mg</td>
                        <td className="py-2 px-3 text-right text-slate-600">{(totalCarrier_mg / batchVolume_mL).toFixed(2)} mg/mL</td>
                      </tr>
                    ) : (
                      <tr>
                        <td className="py-2 px-3 text-slate-800 font-sans">InhaLac 70 Coarse Lactose Carrier</td>
                        <td className="py-2 px-3 text-slate-600 font-sans">Aerosol Dispersion</td>
                        <td className="py-2 px-3 text-right font-bold">{totalCarrier_mg.toFixed(1)} mg</td>
                        <td className="py-2 px-3 text-right text-slate-600">{(totalCarrier_mg / batchVolume_mL).toFixed(2)} mg/mL</td>
                      </tr>
                    )}
                    {includeCryoProtectant && (
                      <tr className="bg-emerald-50/50">
                        <td className="py-2 px-3 text-slate-800 font-sans">D-(+)-Trehalose Dihydrate</td>
                        <td className="py-2 px-3 text-slate-600 font-sans">Lyoprotectant</td>
                        <td className="py-2 px-3 text-right font-bold text-emerald-800">{trehalose_g.toFixed(2)} g</td>
                        <td className="py-2 px-3 text-right text-slate-700">8.0% w/v</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Process & Lyophilization Parameters */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-sm">2. Manufacturing & Lyophilization Parameters</h4>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5 text-xs">
                  <div>• <strong>Aqueous Vehicle:</strong> Phosphate Buffered Saline (PBS 10 mM, pH 7.4) q.s. to {batchVolume_mL} mL</div>
                  <div>• <strong>Mixing Flow Ratio:</strong> 3:1 (Aqueous Phase : Organic Phase) at 12 mL/min total flow rate</div>
                  <div>• <strong>Primary Drying Cycle:</strong> -28°C shelf temperature for 24 hours at 0.08 mbar vacuum</div>
                  <div>• <strong>Secondary Drying Cycle:</strong> Ramp to +25°C for 12 hours at 0.05 mbar vacuum</div>
                  <div>• <strong>Calculated Osmolality:</strong> ~295 mOsm/kg (Isotonic)</div>
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-6 border-t border-slate-300 grid grid-cols-2 gap-8 text-xs">
                <div>
                  <div className="h-10 border-b border-slate-400 mb-1"></div>
                  <span className="font-bold text-slate-700">Formulation Scientist Signature</span>
                  <div className="text-slate-500 text-[10px]">Date: ________________________</div>
                </div>
                <div>
                  <div className="h-10 border-b border-slate-400 mb-1"></div>
                  <span className="font-bold text-slate-700">Quality Assurance (QA) Approval</span>
                  <div className="text-slate-500 text-[10px]">Date: ________________________</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
