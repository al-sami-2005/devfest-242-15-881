import React from 'react';
import { Package, FileText, CheckSquare, Settings2, Globe } from 'lucide-react';
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
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}
      
      <div className={cn(
        "fixed md:sticky top-0 left-0 z-50 h-screen w-[240px] bg-[#111111] border-r border-gray-800 flex flex-col transition-transform duration-200 ease-in-out",
        isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="p-5 flex items-center gap-3 border-b border-gray-800/50">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center shadow-subtle shrink-0">
            <Package className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-100 leading-tight">Tender Package</h1>
            <p className="text-xs text-gray-500 font-medium">Builder</p>
          </div>
        </div>

        <div className="p-3 flex-1 overflow-y-auto">
          <nav className="space-y-1">
            <a href="#overview" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors">
              <Settings2 className="w-4 h-4 text-gray-500" />
              Overview
            </a>
            <a href="#documents" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors">
              <FileText className="w-4 h-4 text-gray-500" />
              Documents
            </a>
            <a href="#requirements" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors">
              <CheckSquare className="w-4 h-4 text-gray-500" />
              Package Requirements
            </a>
          </nav>

          <div className="mt-8 px-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Progress</h3>
            <div className="p-3 rounded-lg border border-gray-800 bg-[#161616]">
              <div className="flex items-center gap-2 mb-1.5">
                <div className={cn("w-2 h-2 rounded-full", isReady ? "bg-green-500" : "bg-amber-500")} />
                <span className="text-xs font-medium text-gray-300">Package readiness</span>
              </div>
              <p className={cn("text-xs font-medium", isReady ? "text-green-400" : "text-amber-400/90")}>
                {readyCount}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-800/50 space-y-3">
          <div className="flex items-center justify-between p-1 rounded-lg bg-[#161616] border border-gray-800">
            <button 
              onClick={() => setLanguage('en')}
              className={cn("flex-1 py-1 text-xs font-medium rounded-md transition-colors", language === 'en' ? "bg-gray-700 text-white shadow-sm" : "text-gray-400 hover:text-gray-200")}
            >
              EN
            </button>
            <button 
              onClick={() => setLanguage('bn')}
              className={cn("flex-1 py-1 text-xs font-medium rounded-md transition-colors", language === 'bn' ? "bg-gray-700 text-white shadow-sm" : "text-gray-400 hover:text-gray-200")}
            >
              বাংলা
            </button>
          </div>
          <button 
            onClick={resetProject}
            className="w-full py-1.5 text-xs font-medium text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            Reset project
          </button>
        </div>
      </div>
    </>
  );
};
