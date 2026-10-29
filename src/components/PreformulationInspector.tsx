import React, { useState } from 'react';
import { Search, CheckCircle2, AlertCircle, Copy, ExternalLink, Activity, Info } from 'lucide-react';
import { CompoundProperties } from '../types/pharmadds';
import { MoleculeViewer3D } from './MoleculeViewer3D';

interface PreformulationInspectorProps {
  currentDrug: CompoundProperties;
  onSelectDrug: (drug: CompoundProperties) => void;
  benchmarks: CompoundProperties[];
}

export const PreformulationInspector: React.FC<PreformulationInspectorProps> = ({
  currentDrug,
  onSelectDrug,
  benchmarks,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [copiedSmiles, setCopiedSmiles] = useState(false);

  // Search PubChem via backend proxy
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError(null);

    try {
      const res = await fetch(`/api/pubchem/search?q=${encodeURIComponent(searchQuery.trim())}`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();

      if (data.cids && data.cids.length > 0) {
        const firstCid = data.cids[0];
        const detailRes = await fetch(`/api/pubchem/compound/${firstCid}`);
        if (!detailRes.ok) throw new Error('Could not retrieve compound properties');
        const detail = await detailRes.json();

        const props = detail.properties;
        const newCompound: CompoundProperties = {
          cid: props.CID,
          name: props.Title || searchQuery,
          category: detail.benchmark ? detail.benchmark.category : 'Targeted Nano',
          bcsClass: detail.bcsClass,
          molecularWeight: parseFloat(props.MolecularWeight) || 0,
          xLogP: parseFloat(props.XLogP) || 0,
          tpsa: parseFloat(props.TPSA) || 0,
          hbd: parseInt(props.HBondDonorCount, 10) || 0,
          hba: parseInt(props.HBondAcceptorCount, 10) || 0,
          rotatableBonds: parseInt(props.RotatableBondCount, 10) || 0,
          smiles: props.CanonicalSMILES || '',
          indication: detail.benchmark ? detail.benchmark.indication : 'Investigational Compound',
          targetReceptor: detail.benchmark ? detail.benchmark.targetReceptor : 'Molecular Target',
          defaultSystem: detail.benchmark ? detail.benchmark.defaultSystem : 'Nanoparticle / ASD Carrier',
          bioavailabilityOralBaseline: detail.benchmark ? detail.benchmark.bioavailabilityOralBaseline : 8.0,
          bioavailabilityTargetedExpected: detail.benchmark ? detail.benchmark.bioavailabilityTargetedExpected : 75.0,
          toxicityMTC_mgL: detail.benchmark ? detail.benchmark.toxicityMTC_mgL : 8.0,
          effectiveMEC_mgL: detail.benchmark ? detail.benchmark.effectiveMEC_mgL : 1.0,
          description: detail.benchmark ? detail.benchmark.description : 'Imported via PubChem PUG REST open scientific database.',
          bengaliSummary: detail.benchmark ? detail.benchmark.bengaliSummary : 'Select the optimal drug delivery system architecture based on physicochemical parameters retrieved from PubChem.'
        };
        onSelectDrug(newCompound);
      } else {
        setSearchError('No matching chemical compounds found on PubChem.');
      }
    } catch (err: any) {
      setSearchError('Network error or rate limit. Select from benchmark compounds.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleCopySmiles = () => {
    navigator.clipboard.writeText(currentDrug.smiles);
    setCopiedSmiles(true);
    setTimeout(() => setCopiedSmiles(false), 2000);
  };

  // Lipinski evaluation
  const lipinskiViolations = [
    currentDrug.molecularWeight > 500 ? 'MW > 500 Da' : null,
    currentDrug.xLogP > 5.0 ? 'LogP > 5.0' : null,
    currentDrug.hbd > 5 ? 'HBD > 5' : null,
    currentDrug.hba > 10 ? 'HBA > 10' : null,
  ].filter(Boolean);

  const passesLipinski = lipinskiViolations.length <= 1;
  const passesVeber = currentDrug.rotatableBonds <= 10 && currentDrug.tpsa <= 140;

  return (
    <section id="preformulation" className="py-6 space-y-6">
      {/* Section Header & Live PubChem Query Bar */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              01. Pre-Formulation & Physicochemical Profiling
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Authoritative molecular properties queried directly from NCBI PubChem PUG REST API
            </p>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-md w-full">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search PubChem by drug name or CID..."
                className="w-full pl-9 pr-3 py-2 sm:py-1.5 text-xs bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-slate-800"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="px-4 py-2 sm:py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors whitespace-nowrap disabled:opacity-50 text-center"
            >
              {isSearching ? 'Querying...' : 'Query API'}
            </button>
          </form>
        </div>

        {searchError && (
          <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>{searchError}</span>
          </div>
        )}

        {/* Curated Benchmark Presets */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium whitespace-nowrap">Benchmark Models:</span>
          {benchmarks.map((drug) => (
            <button
              key={drug.cid}
              onClick={() => onSelectDrug(drug)}
              className={`px-2.5 py-1 rounded text-xs transition-colors whitespace-nowrap ${
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

      {/* Main 2-Column Split: Structure & Physicochemical Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 Cols): 3D Conformer & 2D Depiction */}
        <div className="lg:col-span-5 space-y-4">
          <MoleculeViewer3D
            smiles={currentDrug.smiles}
            name={currentDrug.name}
            cid={currentDrug.cid}
          />

          {/* 2D Chemical Diagram & PubChem Provenance */}
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between text-xs mb-3">
              <span className="font-semibold text-slate-800">2D Topology & Structural Formula</span>
              <a
                href={`https://pubchem.ncbi.nlm.nih.gov/compound/${currentDrug.cid}`}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline inline-flex items-center gap-1 font-mono text-[11px]"
              >
                NCBI PubChem Record <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex items-center justify-center p-3 bg-slate-50 border border-slate-100 rounded">
              <img
                src={`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${currentDrug.cid}/PNG?image_size=300x300`}
                alt={`${currentDrug.name} 2D Structure`}
                referrerPolicy="no-referrer"
                className="max-h-44 object-contain mix-blend-multiply"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>

            {/* SMILES with Copy Button */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                <span>Canonical SMILES</span>
                <button
                  onClick={handleCopySmiles}
                  className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedSmiles ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="font-mono text-[11px] bg-slate-100 p-2 rounded text-slate-700 break-all leading-tight">
                {currentDrug.smiles}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (7 Cols): Physicochemical Tables & BCS Classification */}
        <div className="lg:col-span-7 space-y-4">
          {/* Properties Table */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Material & Pre-Formulation Metrics
              </h3>
              <span className="text-xs font-mono text-slate-500">
                System: {currentDrug.defaultSystem}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
              <div className="p-3 bg-slate-50 rounded border border-slate-100">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-mono block">
                  Molecular Weight
                </span>
                <div className="mt-1 flex items-baseline">
                  <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">
                    {currentDrug.molecularWeight.toFixed(1)}
                  </span>
                  <span className="text-xs font-mono text-slate-400 ml-1">g/mol</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded border border-slate-100">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-mono block">
                  Lipophilicity (XLogP)
                </span>
                <div className="mt-1 flex items-baseline">
                  <span className={`text-xl font-bold font-mono tabular-nums ${currentDrug.xLogP > 4 ? 'text-amber-600' : 'text-slate-900'}`}>
                    {currentDrug.xLogP.toFixed(2)}
                  </span>
                  <span className="text-xs font-mono text-slate-400 ml-1">log units</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded border border-slate-100">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-mono block">
                  Polar Surface (TPSA)
                </span>
                <div className="mt-1 flex items-baseline">
                  <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">
                    {currentDrug.tpsa.toFixed(1)}
                  </span>
                  <span className="text-xs font-mono text-slate-400 ml-1">Å²</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded border border-slate-100">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-mono block">
                  Rotatable Bonds
                </span>
                <div className="mt-1 flex items-baseline">
                  <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">
                    {currentDrug.rotatableBonds}
                  </span>
                  <span className="text-xs font-mono text-slate-400 ml-1">bonds</span>
                </div>
              </div>
            </div>

            {/* Additional Chemical Indices */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3">
              <div className="p-2.5 bg-slate-50/70 rounded text-xs">
                <span className="text-slate-500">H-Bond Donors:</span>{' '}
                <span className="font-mono font-semibold text-slate-900">{currentDrug.hbd}</span>
              </div>
              <div className="p-2.5 bg-slate-50/70 rounded text-xs">
                <span className="text-slate-500">H-Bond Acceptors:</span>{' '}
                <span className="font-mono font-semibold text-slate-900">{currentDrug.hba}</span>
              </div>
              <div className="p-2.5 bg-slate-50/70 rounded text-xs">
                <span className="text-slate-500">Baseline Oral Bioavail:</span>{' '}
                <span className="font-mono font-semibold text-slate-900">{currentDrug.bioavailabilityOralBaseline}%</span>
              </div>
              <div className="p-2.5 bg-slate-50/70 rounded text-xs">
                <span className="text-slate-500">Targeted Expected:</span>{' '}
                <span className="font-mono font-semibold text-emerald-600">{currentDrug.bioavailabilityTargetedExpected}%</span>
              </div>
            </div>
          </div>

          {/* BCS Classification Quadrant */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Biopharmaceutics Classification System (BCS)
                </h3>
                <p className="text-xs text-slate-500">
                  Therapeutic formulation delivery route routing based on aqueous solubility vs intestinal permeability
                </p>
              </div>
              <span className="px-2.5 py-1 rounded bg-blue-100 text-blue-800 font-mono font-bold text-xs">
                {currentDrug.bcsClass}
              </span>
            </div>

            {/* 4 Quadrants Visual */}
            <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
              <div
                className={`p-3 rounded border transition-colors ${
                  currentDrug.bcsClass === 'BCS I'
                    ? 'border-blue-500 bg-blue-50/60 ring-1 ring-blue-500'
                    : 'border-slate-200 bg-slate-50/40 text-slate-600'
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>Class I (High Sol, High Perm)</span>
                  {currentDrug.bcsClass === 'BCS I' && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Ideal candidate for conventional oral tablets or immediate aerosolization (e.g. Salbutamol).
                </p>
              </div>

              <div
                className={`p-3 rounded border transition-colors ${
                  currentDrug.bcsClass === 'BCS II'
                    ? 'border-amber-500 bg-amber-50/60 ring-1 ring-amber-500'
                    : 'border-slate-200 bg-slate-50/40 text-slate-600'
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>Class II (Low Sol, High Perm)</span>
                  {currentDrug.bcsClass === 'BCS II' && <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />}
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Dissolution-rate limited. Prime target for Amorphous Solid Dispersions (ASD) or Nanocrystals.
                </p>
              </div>

              <div
                className={`p-3 rounded border transition-colors ${
                  currentDrug.bcsClass === 'BCS III'
                    ? 'border-indigo-500 bg-indigo-50/60 ring-1 ring-indigo-500'
                    : 'border-slate-200 bg-slate-50/40 text-slate-600'
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>Class III (High Sol, Low Perm)</span>
                  {currentDrug.bcsClass === 'BCS III' && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Permeability-limited. Demands ion-pairing, liposomes, or actively targeted endocytosis.
                </p>
              </div>

              <div
                className={`p-3 rounded border transition-colors ${
                  currentDrug.bcsClass === 'BCS IV'
                    ? 'border-rose-500 bg-rose-50/60 ring-1 ring-rose-500'
                    : 'border-slate-200 bg-slate-50/40 text-slate-600'
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>Class IV (Low Sol, Low Perm)</span>
                  {currentDrug.bcsClass === 'BCS IV' && <CheckCircle2 className="w-3.5 h-3.5 text-rose-600" />}
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Extremely challenging. Requires engineered lipid nanoparticles (LNPs) or pulmonary delivery.
                </p>
              </div>
            </div>
          </div>

          {/* Lipinski & Veber Heuristics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-white rounded-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900">Lipinski Rule of 5</span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${passesLipinski ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                  {passesLipinski ? 'Compliant (Oral Druglike)' : `${lipinskiViolations.length} Violations`}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {passesLipinski
                  ? 'Favorable molecular properties for passive oral mucosal absorption.'
                  : `Violations: ${lipinskiViolations.join(', ')}. Advanced delivery vehicle strictly required.`}
              </p>
            </div>

            <div className="p-4 bg-white rounded-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900">Veber Bioavailability Rule</span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${passesVeber ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                  {passesVeber ? 'High Permeability Expected' : 'Conformational Rigidity Risk'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Rotatable Bonds ≤ 10 ({currentDrug.rotatableBonds}) · TPSA ≤ 140 Å² ({currentDrug.tpsa} Å²)
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
