import React, { useState, useEffect } from 'react';
import { Package, FileText, CheckSquare, Settings2, Lightbulb, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '../utils/cn';
import { PackageReadiness, ChecklistItem } from '../core/matching/selectors';
import { UploadedDocument } from '../core/types';
import { Language } from '../core/i18n';

interface SidebarProps {
  readiness: PackageReadiness;
  language: Language;
  setLanguage: (lang: Language) => void;
  resetProject: () => void;
  isMobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  checklist: ChecklistItem[];
  documents: UploadedDocument[];
}

export const Sidebar = ({ readiness, language, setLanguage, resetProject, isMobileOpen, setMobileOpen, checklist, documents }: SidebarProps) => {
  const [activeSection, setActiveSection] = useState<string>('overview');

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['overview', 'documents', 'requirements'];
      for (const section of sections.reverse()) {
        const el = document.getElementById(section);
        if (el && window.scrollY >= el.offsetTop - 100) {
          setActiveSection(section);
          break;
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const totalReqs = checklist.length;
  const resolvedReqs = checklist.filter(i => i.status === 'ok').length;
  const progressPercent = totalReqs > 0 ? Math.round((resolvedReqs / totalReqs) * 100) : 0;
  
  const matchedCount = checklist.filter(i => i.assignment.documentId).length;
  const optionalSkipped = checklist.filter(i => !i.requirement.mandatory && !i.assignment.documentId).length;
  const duplicatesCount = documents.filter(d => d.isDuplicate).length;

  const handleNavClick = (section: string) => {
    setMobileOpen(false);
    setActiveSection(section);
  };

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
        "fixed md:sticky top-0 left-0 z-50 h-screen w-[280px] bg-[#0c0c0c] border-r border-gray-800/80 flex flex-col transition-transform duration-200 ease-out",
        isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        {/* Brand */}
        <div className="p-6 flex items-center gap-3 border-b border-gray-800/50">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center shadow-subtle shrink-0">
            <Package className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-[14px] font-semibold text-gray-100 leading-tight tracking-tight">Tender Package</h1>
            <p className="text-[11px] text-gray-500 font-medium">Builder App</p>
          </div>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          {/* Navigation */}
          <nav className="space-y-1 mb-8">
            <a href="#overview" onClick={() => handleNavClick('overview')} className={cn("flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-violet-500", activeSection === 'overview' ? "bg-gray-800/80 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800/40")}>
              <Settings2 className={cn("w-4 h-4", activeSection === 'overview' ? "text-violet-400" : "text-gray-500")} />
              Overview
            </a>
            <a href="#documents" onClick={() => handleNavClick('documents')} className={cn("flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-violet-500", activeSection === 'documents' ? "bg-gray-800/80 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800/40")}>
              <FileText className={cn("w-4 h-4", activeSection === 'documents' ? "text-violet-400" : "text-gray-500")} />
              Documents
            </a>
            <a href="#requirements" onClick={() => handleNavClick('requirements')} className={cn("flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-violet-500", activeSection === 'requirements' ? "bg-gray-800/80 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800/40")}>
              <CheckSquare className={cn("w-4 h-4", activeSection === 'requirements' ? "text-violet-400" : "text-gray-500")} />
              Requirements
            </a>
          </nav>

          {/* Readiness Card */}
          <div className="mb-6">
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2.5 px-3">Readiness</h3>
            <div className="mx-2 p-3.5 rounded-xl border border-gray-800/60 bg-[#111111] shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full", readiness.canGenerate ? "bg-green-500" : "bg-amber-500")} />
                  <span className="text-xs font-semibold text-gray-300">
                    {readiness.canGenerate ? "Ready to build" : `${readiness.blockingReasons.length} blocking issues`}
                  </span>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] text-gray-400 font-medium">
                  <span>Progress</span>
                  <span>{resolvedReqs} / {totalReqs}</span>
                </div>
                <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className={cn("h-full transition-all duration-500", readiness.canGenerate ? "bg-green-500" : "bg-violet-500")} 
                    style={{ width: `${progressPercent}%` }} 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Summary Card */}
          <div className="mb-6">
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2.5 px-3">Summary</h3>
            <div className="mx-2 p-3.5 rounded-xl border border-gray-800/60 bg-[#111111] shadow-sm space-y-2">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-gray-400 font-medium">Uploaded files</span>
                <span className="text-gray-200 font-semibold">{documents.length}</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-gray-400 font-medium">Matched reqs</span>
                <span className="text-gray-200 font-semibold">{matchedCount}</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-gray-400 font-medium">Optional skipped</span>
                <span className="text-gray-200 font-semibold">{optionalSkipped}</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-gray-400 font-medium">Duplicates</span>
                <span className={cn("font-semibold", duplicatesCount > 0 ? "text-amber-400" : "text-gray-200")}>{duplicatesCount}</span>
              </div>
            </div>
          </div>

          {/* Tips Card */}
          <div className="mx-2 p-3 rounded-xl bg-violet-500/5 border border-violet-500/10 flex items-start gap-3">
            <Lightbulb className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-violet-200/70 leading-relaxed">
              <span className="font-semibold text-violet-300 block mb-1">Tip</span>
              Optional documents do not block generation. Duplicate files cannot be matched to multiple requirements.
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-800/50 space-y-3 bg-[#0c0c0c]">
          <div className="flex items-center justify-between p-1 rounded-lg bg-[#161616] border border-gray-800 shadow-inner">
            <button 
              onClick={() => setLanguage('en')}
              className={cn("flex-1 py-1.5 text-[11px] font-bold tracking-wide rounded-md transition-all outline-none focus-visible:ring-2 focus-visible:ring-violet-500", language === 'en' ? "bg-[#2b2b2b] text-white shadow-sm" : "text-gray-500 hover:text-gray-300")}
            >
              ENGLISH
            </button>
            <button 
              onClick={() => setLanguage('bn')}
              className={cn("flex-1 py-1.5 text-[11px] font-bold tracking-wide rounded-md transition-all outline-none focus-visible:ring-2 focus-visible:ring-violet-500", language === 'bn' ? "bg-[#2b2b2b] text-white shadow-sm" : "text-gray-500 hover:text-gray-300")}
            >
              বাংলা
            </button>
          </div>
          <button 
            onClick={resetProject}
            className="w-full py-2 flex items-center justify-center gap-2 text-[11px] font-semibold text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20 outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reset Project
          </button>
        </div>
      </div>
    </>
  );
};
