import React, { useState } from 'react';
import { useTenderApp } from './app/useTenderApp';
import { Onboarding } from './components/Onboarding';
import { Sidebar } from './components/Sidebar';
import { UploadZone } from './components/UploadZone';
import { DocumentList } from './components/DocumentList';
import { RequirementsTable } from './components/RequirementsTable';
import { Menu, AlertCircle, Check, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export const App = () => {
  const { 
    tenderData, documents, language, checklist, readiness, 
    isProcessingFiles, isGeneratingPackage, appError,
    setLanguage, loadRequirements, addFiles, removeFile, 
    assignFile, unassignFile, setExpiry, generatePackage, resetProject, clearError 
  } = useTenderApp();

  const [isMobileOpen, setMobileOpen] = useState(false);

  if (!tenderData) {
    return <Onboarding loadRequirements={loadRequirements} error={appError} />;
  }

  return (
    <div className="flex min-h-screen w-full bg-[#0c0c0c]">
      <Sidebar 
        readiness={readiness} 
        language={language} 
        setLanguage={setLanguage} 
        resetProject={resetProject}
        isMobileOpen={isMobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <main className="flex-1 min-w-0 flex flex-col relative">
        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 z-30 bg-[#111111]/80 backdrop-blur border-b border-gray-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-violet-600 flex items-center justify-center">
              <span className="text-[10px] font-bold text-white">TP</span>
            </div>
            <span className="text-sm font-semibold text-gray-200">Builder</span>
          </div>
          <button onClick={() => setMobileOpen(true)} className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-gray-800">
            <Menu className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-1 p-4 md:p-8 lg:p-12 max-w-5xl mx-auto w-full">
          {/* Top Error Toast */}
          {appError && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 relative shadow-subtle animate-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-400 font-medium pr-6">{appError.message}</p>
              <button onClick={clearError} className="absolute top-4 right-4 text-red-500/60 hover:text-red-500">
                <span className="sr-only">Close</span>
                ×
              </button>
            </div>
          )}

          {/* Header */}
          <div className="mb-10" id="overview">
            <h1 className="text-2xl font-semibold text-white mb-4 tracking-tight">{tenderData.tender.title}</h1>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="px-2.5 py-1 rounded-md bg-violet-500/10 text-violet-400 font-mono text-xs font-medium border border-violet-500/20">{tenderData.tender.tender_id}</span>
              <span className="text-gray-500 hidden sm:inline">·</span>
              <span className="text-gray-300 font-medium">{tenderData.tender.procuring_entity}</span>
              <span className="text-gray-500">·</span>
              <span className="text-gray-400">{tenderData.tender.bidder}</span>
              <span className="text-gray-500">·</span>
              <span className="inline-flex items-center text-gray-400 bg-gray-800/50 px-2.5 py-1 rounded-md text-xs font-medium border border-gray-700/50">
                Deadline: {format(new Date(tenderData.tender.submission_deadline), 'dd MMM yyyy')}
              </span>
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
          <div className="mt-12 pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 pb-20">
            <div className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full ${readiness.canGenerate ? 'bg-green-500' : 'bg-amber-500'}`} />
              <p className="text-sm font-medium text-gray-300">
                {readiness.canGenerate ? 'All required documents are ready' : `${readiness.blockingReasons.length} blocking requirements remaining`}
              </p>
            </div>
            <button
              onClick={generatePackage}
              disabled={!readiness.canGenerate || isGeneratingPackage}
              className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-white text-black font-semibold text-sm hover:bg-gray-200 disabled:bg-gray-800 disabled:text-gray-500 transition-colors flex items-center justify-center gap-2 shadow-subtle"
            >
              {isGeneratingPackage ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
              ) : (
                <><Check className="w-4 h-4" /> Generate Package</>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
