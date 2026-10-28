import React, { useState, useRef, useEffect } from 'react';
import { Search, Loader2, X, ExternalLink, ShieldAlert, ArrowRight } from 'lucide-react';
import { CompoundProperties } from '../types/pharmadds';

interface HeaderGlobalSearchProps {
  onSelectDrug: (drug: CompoundProperties) => void;
  onOpenSafetyModal?: (drug: CompoundProperties) => void;
}

interface SearchSuggestion {
  cid: number;
  name: string;
}

export const HeaderGlobalSearch: React.FC<HeaderGlobalSearchProps> = ({
  onSelectDrug,
  onOpenSafetyModal,
}) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // Close suggestions dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setSearchError(null);

    try {
      const res = await fetch(`/api/pubchem/search?q=${encodeURIComponent(query.trim())}`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();

      if (data.cids && data.cids.length > 0) {
        // Fetch the first match details
        await loadCompoundByCid(data.cids[0], query);
      } else {
        setSearchError(`No compounds found for "${query}"`);
      }
    } catch (err: any) {
      setSearchError('PubChem API lookup error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCompoundByCid = async (cid: number, fallbackName: string) => {
    setIsLoading(true);
    setIsOpen(false);
    setSearchError(null);

    try {
      const res = await fetch(`/api/pubchem/compound/${cid}`);
      if (!res.ok) throw new Error('Failed to load compound');
      const data = await res.json();
      const props = data.properties;

      const newCompound: CompoundProperties = {
        cid: props.CID,
        name: props.Title || fallbackName,
        category: data.benchmark ? data.benchmark.category : 'Targeted Nano',
        bcsClass: data.bcsClass,
        molecularWeight: parseFloat(props.MolecularWeight) || 0,
        xLogP: parseFloat(props.XLogP) || 0,
        tpsa: parseFloat(props.TPSA) || 0,
        hbd: parseInt(props.HBondDonorCount, 10) || 0,
        hba: parseInt(props.HBondAcceptorCount, 10) || 0,
        rotatableBonds: parseInt(props.RotatableBondCount, 10) || 0,
        smiles: props.CanonicalSMILES || '',
        indication: data.benchmark ? data.benchmark.indication : 'Investigational Molecule (PubChem)',
        targetReceptor: data.benchmark ? data.benchmark.targetReceptor : 'Molecular Target',
        defaultSystem: data.benchmark ? data.benchmark.defaultSystem : 'Nanoparticle / ASD Carrier',
        bioavailabilityOralBaseline: data.benchmark ? data.benchmark.bioavailabilityOralBaseline : 8.0,
        bioavailabilityTargetedExpected: data.benchmark ? data.benchmark.bioavailabilityTargetedExpected : 78.0,
        toxicityMTC_mgL: data.benchmark ? data.benchmark.toxicityMTC_mgL : 8.0,
        effectiveMEC_mgL: data.benchmark ? data.benchmark.effectiveMEC_mgL : 1.0,
        description: data.benchmark ? data.benchmark.description : 'Loaded directly via NCBI PubChem PUG REST & PUG View API.',
        bengaliSummary: data.benchmark ? data.benchmark.bengaliSummary : 'পাবকেম থেকে লোডকৃত নতুন ড্রাগ মলিকুলের জন্য অপ্টিমাইজড ড্রাগ ডেলিভারি সিস্টেম কনফিগার করা হয়েছে।',
        safetyData: data.safetyData,
      };

      onSelectDrug(newCompound);
      if (onOpenSafetyModal) {
        onOpenSafetyModal(newCompound);
      }
    } catch (err: any) {
      setSearchError('Failed to fetch compound specifications');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative flex-1 max-w-xs sm:max-w-sm md:max-w-md">
      <form onSubmit={handleSearchSubmit} className="relative flex items-center">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (searchError) setSearchError(null);
            }}
            placeholder="Search any drug on PubChem (e.g. Imatinib)..."
            className="w-full pl-8 pr-8 py-1.5 text-xs bg-slate-100 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all font-sans"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSearchError(null);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {isLoading && (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
          </div>
        )}
      </form>

      {/* Error Tooltip */}
      {searchError && (
        <div className="absolute top-full mt-1.5 left-0 right-0 bg-rose-50 border border-rose-200 text-rose-800 text-[11px] px-3 py-1.5 rounded-lg shadow-md z-50 flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          <span>{searchError}</span>
        </div>
      )}
    </div>
  );
};
