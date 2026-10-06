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
    <div className="mb-10" id="documents">
      <div 
        onClick={() => !isProcessingFiles && fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "relative flex flex-col items-center justify-center p-10 rounded-xl border transition-all cursor-pointer overflow-hidden group",
          isDragging ? "border-violet-500 bg-violet-500/10" : "border-gray-800 bg-[#161616] hover:border-gray-600 hover:bg-[#1a1a1a]",
          isProcessingFiles && "opacity-70 cursor-not-allowed pointer-events-none border-gray-800"
        )}
      >
        {isProcessingFiles ? (
          <div className="flex flex-col items-center text-violet-400">
            <Loader2 className="w-8 h-8 mb-4 animate-spin" />
            <p className="text-sm font-medium">Processing PDFs…</p>
            <p className="text-xs text-gray-400 mt-1.5">Counting pages and checking duplicates</p>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-colors",
              isDragging ? "bg-violet-500/20 text-violet-400" : "bg-gray-800 text-gray-400 group-hover:bg-gray-700 group-hover:text-gray-300"
            )}>
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-[15px] font-medium text-gray-200">
              Drop PDF files here <span className="text-gray-400 font-normal">or click to browse</span>
            </p>
            <p className="text-xs text-gray-500 mt-2 font-medium">PDF only · Up to 30 files · 50 MB total</p>
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
