import React, { useRef, useState } from 'react';
import { UploadCloud, Loader2 } from 'lucide-react';
import { cn } from '../utils/cn';

interface UploadZoneProps {
  addFiles: (files: File[]) => Promise<void>;
  isProcessingFiles: boolean;
}

export const UploadZone = ({ addFiles, isProcessingFiles }: UploadZoneProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      addFiles(Array.from(e.target.files));
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  return (
    <div className="mb-8" id="documents">
      <h2 className="text-sm font-medium text-white mb-3">Upload tender documents</h2>
      
      <div 
        onClick={() => !isProcessingFiles && fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "relative flex flex-col items-center justify-center p-8 rounded-xl border border-dashed transition-all cursor-pointer overflow-hidden",
          isDragging ? "border-violet-500 bg-violet-500/5" : "border-gray-700 bg-[#161616] hover:border-gray-500 hover:bg-[#1a1a1a]",
          isProcessingFiles && "opacity-70 cursor-not-allowed pointer-events-none"
        )}
      >
        {isProcessingFiles ? (
          <div className="flex flex-col items-center text-violet-400">
            <Loader2 className="w-8 h-8 mb-3 animate-spin" />
            <p className="text-sm font-medium">Processing PDFs…</p>
            <p className="text-xs text-gray-400 mt-1">Counting pages and checking duplicates</p>
          </div>
        ) : (
          <div className="flex flex-col items-center text-gray-400 group">
            <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center mb-3 group-hover:bg-gray-700 transition-colors">
              <UploadCloud className="w-5 h-5 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-200">Drop PDF files here <span className="text-gray-400 font-normal">or click to browse</span></p>
            <p className="text-xs text-gray-500 mt-2">PDF only · Up to 30 files · 50 MB total</p>
          </div>
        )}
        
        <input 
          type="file" 
          multiple
          accept=".pdf,application/pdf"
          className="hidden" 
          ref={fileInputRef}
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
};
