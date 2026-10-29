import React from 'react';
import { HelpCircle } from 'lucide-react';

interface GlossaryTermProps {
  id: string;
  children: React.ReactNode;
  onOpenGlossary: (id: string) => void;
  className?: string;
}

export const GlossaryTerm: React.FC<GlossaryTermProps> = ({
  id,
  children,
  onOpenGlossary,
  className = '',
}) => {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onOpenGlossary(id);
      }}
      className={`inline-flex items-center gap-0.5 text-blue-600 hover:text-blue-800 underline decoration-dotted decoration-blue-400 underline-offset-2 cursor-pointer font-medium transition-colors ${className}`}
      title="Click to view scientific definition, laboratory measurement method & mechanistic principle"
    >
      <span>{children}</span>
      <HelpCircle className="w-3 h-3 text-blue-400 hover:text-blue-600 shrink-0 inline ml-0.5" />
    </button>
  );
};
