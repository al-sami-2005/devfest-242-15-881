import React from 'react';
import { Package, FileText, CheckSquare, Settings2 } from 'lucide-react';
import { cn } from '../utils/cn';
import { PackageReadiness } from '../core/matching/selectors';
import { Language } from '../core/i18n';

interface SidebarProps {
  readiness: PackageReadiness;
  language: Language;
  setLanguage: (lang: Language) => void;
  resetProject: () => void;
  isMobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar = ({ readiness, language, setLanguage, resetProject, isMobileOpen, setMobileOpen }: SidebarProps) => {
  const readyCount = readiness.blockingReasons.length === 0 ? "Ready to generate" : `${readiness.blockingReasons.length} issues remaining`;
  const isReady = readiness.canGenerate;

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}
      
      <div className={cn(
        "fixed md:sticky top-0 left-0 z-50 h-screen w-[260px] bg-[#111111] border-r border-gray-800 flex flex-col transition-transform duration-200 ease-out",
        isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="p-5 flex items-center gap-3.5 border-b border-gray-800/50">
          <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center shadow-subtle shrink-0">
            <Package className="w-4.5 h-4.5 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-[15px] font-semibold text-gray-100 leading-tight tracking-tight">Tender Package</h1>
            <p className="text-xs text-gray-500 font-medium">Builder</p>
          </div>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          <nav className="space-y-1">
            <a href="#overview" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800/60 rounded-lg transition-colors">
              <Settings2 className="w-4 h-4 text-gray-500" />
              Overview
            </a>
            <a href="#documents" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800/60 rounded-lg transition-colors">
              <FileText className="w-4 h-4 text-gray-500" />
              Documents
            </a>
            <a href="#requirements" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800/60 rounded-lg transition-colors">
              <CheckSquare className="w-4 h-4 text-gray-500" />
              Requirements
            </a>
          </nav>

          <div className="mt-8 px-1">
            <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3 px-2">Status</h3>
            <div className="p-3 rounded-xl border border-gray-800/80 bg-[#161616]">
              <div className="flex items-center gap-2 mb-1.5">
                <div className={cn("w-2 h-2 rounded-full", isReady ? "bg-green-500" : "bg-amber-500")} />
                <span className="text-xs font-semibold text-gray-300">Package readiness</span>
              </div>
              <p className={cn("text-xs font-medium", isReady ? "text-green-400" : "text-amber-400/90")}>
                {readyCount}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-800/50 space-y-4">
          <div className="flex items-center justify-between p-1 rounded-lg bg-[#0c0c0c] border border-gray-800 shadow-inner">
            <button 
              onClick={() => setLanguage('en')}
              className={cn("flex-1 py-1.5 text-xs font-semibold rounded-md transition-all", language === 'en' ? "bg-gray-800 text-white shadow-subtle" : "text-gray-500 hover:text-gray-300")}
            >
              EN
            </button>
            <button 
              onClick={() => setLanguage('bn')}
              className={cn("flex-1 py-1.5 text-xs font-semibold rounded-md transition-all", language === 'bn' ? "bg-gray-800 text-white shadow-subtle" : "text-gray-500 hover:text-gray-300")}
            >
              বাংলা
            </button>
          </div>
          <button 
            onClick={resetProject}
            className="w-full py-2 text-xs font-semibold text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 rounded-lg transition-colors border border-transparent hover:border-gray-700/50"
          >
            Reset project
          </button>
        </div>
      </div>
    </>
  );
};
