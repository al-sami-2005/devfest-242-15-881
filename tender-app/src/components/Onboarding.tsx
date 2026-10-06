import React, { useRef } from 'react';
import { UploadCloud, AlertCircle } from 'lucide-react';
import { cn } from '../utils/cn';
import { TenderAppError } from '../app/useTenderApp';

export const Onboarding = ({ 
  loadRequirements, 
  error 
}: { 
  loadRequirements: (file: File) => Promise<void>,
  error: TenderAppError | null
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      loadRequirements(e.target.files[0]);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0c0c0c] text-gray-200">
      <div className="max-w-md w-full p-8 rounded-xl border border-gray-800 bg-[#111111] shadow-subtle flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-full bg-violet-500/10 flex items-center justify-center mb-6">
          <UploadCloud className="w-6 h-6 text-violet-500" />
        </div>
        <h1 className="text-xl font-medium text-white mb-2">Load tender requirements</h1>
        <p className="text-sm text-gray-400 mb-8">
          Select the <code className="bg-gray-800 px-1 py-0.5 rounded text-gray-300">requirements.json</code> supplied with the tender package.
        </p>

        {error && error.type === 'JSON_INVALID' && (
          <div className="w-full mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3 text-left">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{error.message}</p>
          </div>
        )}

        <button 
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-2.5 px-4 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors shadow-subtle"
        >
          Choose requirements.json
        </button>
        <input 
          type="file" 
          accept=".json,application/json" 
          className="hidden" 
          ref={fileInputRef}
          onChange={handleFile}
        />
      </div>
    </div>
  );
};
