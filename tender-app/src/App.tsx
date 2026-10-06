import React, { useState } from 'react';
import { useTenderApp } from './app/useTenderApp';
import { Onboarding } from './components/Onboarding';
import { Sidebar } from './components/Sidebar';
import { UploadZone } from './components/UploadZone';
import { DocumentList } from './components/DocumentList';
import { RequirementsTable } from './components/RequirementsTable';
import { Menu, AlertCircle, CheckCircle2, Loader2, Download } from 'lucide-react';
import { format } from 'date-fns';

export const App = () => {
  const { 
    tenderData, documents, language, checklist, readiness, 
    isProcessingFiles, isGeneratingPackage, appError,
    setLanguage, loadRequirements, addFiles, removeFile, 
    assignFile, unassignFile, setExpiry, generatePackage, resetProject, clearError 
  } = useTenderApp();

  const [isMobileOpen, setMobileOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  if (!tenderData) {
    return <Onboarding loadRequirements={loadRequirements} error={appError} />;
  }

  const handleGenerate = async () => {
    setShowSuccess(false);
    await generatePackage();
    // Assuming if generation failed, useTenderApp sets appError, so we only show success if no new error
    // To be perfectly accurate, we show it if readiness was ok and we get here without an error
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 5000);
  };

  return (
    <div className="flex min-h-screen w-full bg-[#0c0c0c] font-sans selection:bg-violet-500/30">
      <Sidebar 
        readiness={readiness} 
        language={language} 
        setLanguage={setLanguage} 
        resetProject={resetProject}
        isMobileOpen={isMobileOpen}
        setMobileOpen={setMobileOpen}
        checklist={checklist}
        documents={documents}
      />

      <main className="flex-1 min-w-0 flex flex-col relative">
        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 z-30 bg-[#111111]/90 backdrop-blur-md border-b border-gray-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-violet-600 flex items-center justify-center shadow-subtle">
              <span className="text-[11px] font-bold text-white tracking-tight">TP</span>
            </div>
            <span className="text-sm font-semibold text-gray-200">Builder</span>
          </div>
          <button aria-label="Open menu" onClick={() => setMobileOpen(true)} className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
            <Menu className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-1 p-4 md:p-8 lg:p-12 max-w-[920px] mx-auto w-full">
          {/* Top Error Toast */}
          {appError && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 relative shadow-subtle animate-in fade-in slide-in-from-top-4 duration-200">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-400 font-medium pr-6">{appError.message}</p>
              <button onClick={clearError} className="absolute top-4 right-4 text-red-500/60 hover:text-red-500 transition-colors">
                <span className="sr-only">Close</span>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 1L1 13M1 1l12 12"/></svg>
              </button>
            </div>
          )}

          {/* Success Toast */}
          {showSuccess && !appError && (
            <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-start gap-3 relative shadow-subtle animate-in fade-in slide-in-from-top-4 duration-200">
              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              <p className="text-sm text-green-400 font-medium pr-6">Package generated successfully and downloaded!</p>
              <button onClick={() => setShowSuccess(false)} className="absolute top-4 right-4 text-green-500/60 hover:text-green-500 transition-colors">
                <span className="sr-only">Close</span>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 1L1 13M1 1l12 12"/></svg>
              </button>
            </div>
          )}

          {/* Header */}
          <div className="mb-10" id="overview">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-start gap-3">
                <span className="inline-flex items-center px-2.5 py-1 rounded bg-violet-500/10 text-violet-400 font-mono text-xs font-semibold tracking-wide border border-violet-500/20">
                  {tenderData.tender.tender_id}
                </span>
                <span className="inline-flex items-center px-2.5 py-1 rounded bg-gray-800 text-gray-300 text-xs font-medium border border-gray-700/50">
                  Deadline: <span className="text-gray-100 ml-1">{format(new Date(tenderData.tender.submission_deadline), 'dd MMM yyyy')}</span>
                </span>
              </div>
              
              <h1 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight leading-tight">
                {tenderData.tender.title}
              </h1>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-400 mt-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-300">Entity:</span>
                  <span>{tenderData.tender.procuring_entity}</span>
                </div>
                <span className="hidden sm:inline text-gray-700">•</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-300">Bidder:</span>
                  <span>{tenderData.tender.bidder}</span>
                </div>
              </div>
            </div>
          </div>

          <UploadZone addFiles={addFiles} isProcessingFiles={isProcessingFiles} />
          <DocumentList documents={documents} removeFile={removeFile} checklist={checklist} />
          
          <RequirementsTable 
            checklist={checklist}
            documents={documents}
            assignFile={assignFile}
            unassignFile={unassignFile}
            setExpiry={setExpiry}
            language={language}
          />

          {/* Action Footer */}
          <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-20">
            <div className="flex items-start gap-3 max-w-sm">
              {readiness.canGenerate ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-green-400">Package ready</p>
                    <p className="text-sm text-gray-400 mt-1">All required documents are valid.</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1.5 ml-1.5" />
                  <div>
                    <p className="text-sm font-semibold text-gray-200">{readiness.blockingReasons.length} blocking requirements</p>
                    <p className="text-sm text-gray-400 mt-1">Resolve all missing or expired items to continue.</p>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={handleGenerate}
              disabled={!readiness.canGenerate || isGeneratingPackage}
              className="w-full md:w-auto px-8 py-3 rounded-xl bg-violet-600 text-white font-semibold text-sm hover:bg-violet-500 disabled:bg-[#1a1a1a] disabled:text-gray-500 disabled:border disabled:border-gray-800 transition-all flex items-center justify-center gap-2 shadow-subtle"
            >
              {isGeneratingPackage ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Generating…</>
              ) : (
                <><Download className="w-5 h-5" /> Generate Package</>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
