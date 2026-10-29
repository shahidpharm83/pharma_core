import React from 'react';
import { Atom, Sliders, Layers, Wind, Activity, FileCheck, HelpCircle, FlaskConical } from 'lucide-react';

interface MobileQuickNavProps {
  activeSection: string;
  onNavigate: (section: string) => void;
  onOpenGlossary: (termId?: string) => void;
}

export const MobileQuickNav: React.FC<MobileQuickNavProps> = ({
  activeSection,
  onNavigate,
  onOpenGlossary,
}) => {
  const tabs = [
    { id: 'workflow', label: 'Workflow', icon: FileCheck },
    { id: 'preformulation', label: 'Pre-Form', icon: Atom },
    { id: 'nanoparticles', label: 'Nano', icon: Sliders },
    { id: 'amorphous', label: 'ASD', icon: Layers },
    { id: 'inhalation', label: 'Inhale', icon: Wind },
    { id: 'pkpd', label: 'PK/PD', icon: Activity },
    { id: 'formulator', label: 'Formulator', icon: FlaskConical },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-1 py-1 shadow-lg">
      <div className="flex items-center justify-between max-w-lg mx-auto overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-lg transition-colors flex-1 min-w-[50px] ${
                isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span className={`text-[9.5px] font-medium leading-none ${isActive ? 'font-bold' : ''}`}>
                {tab.label}
              </span>
            </button>
          );
        })}

        {/* Quick Glossary Icon in Mobile Bar */}
        <button
          onClick={() => onOpenGlossary()}
          className="flex flex-col items-center justify-center py-1.5 px-2 rounded-lg text-blue-700 hover:text-blue-900 transition-colors flex-1 min-w-[50px]"
          title="Open Glossary"
        >
          <HelpCircle className="w-4 h-4 mb-0.5 text-blue-600" />
          <span className="text-[9.5px] font-semibold leading-none">
            Glossary
          </span>
        </button>
      </div>
    </div>
  );
};
