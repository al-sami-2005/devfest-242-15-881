import React from 'react';
import { FileText, AlertTriangle, X } from 'lucide-react';
import { UploadedDocument } from '../core/types';
import { ChecklistItem } from '../core/matching/selectors';
import { cn } from '../utils/cn';

interface DocumentListProps {
  documents: UploadedDocument[];
  removeFile: (id: string) => void;
  checklist: ChecklistItem[];
}

export const DocumentList = ({ documents, removeFile, checklist }: DocumentListProps) => {
  if (documents.length === 0) return null;

  return (
    <div className="mb-10">
      <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">Uploaded Files</h3>
      <div className="border border-gray-800 bg-[#161616] rounded-xl overflow-hidden divide-y divide-gray-800/60">
        {documents.map(doc => {
          const isAssigned = checklist.some(item => item.assignment.documentId === doc.id);
          
          return (
            <div key={doc.id} className="flex items-center justify-between p-3.5 hover:bg-[#1a1a1a] transition-colors group">
              <div className="flex items-center gap-3.5 overflow-hidden">
                <div className="w-9 h-9 rounded-lg bg-gray-800/80 flex items-center justify-center shrink-0 border border-gray-700/50">
                  <FileText className="w-4.5 h-4.5 text-gray-400" />
                </div>
                <div className="flex flex-col truncate">
                  <span className="text-sm font-semibold text-gray-200 truncate">{doc.filename}</span>
                  <div className="flex items-center gap-2 text-[11px] font-medium text-gray-500 mt-0.5">
                    <span>{doc.pageCount ? `${doc.pageCount} page${doc.pageCount !== 1 ? 's' : ''}` : 'Counting...'}</span>
                    <span>·</span>
                    <span>{Math.round(doc.size / 1024)} KB</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 pl-4 shrink-0">
                {doc.isDuplicate && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-500 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20 uppercase tracking-wide">
                    <AlertTriangle className="w-3.5 h-3.5" /> Duplicate
                  </span>
                )}
                {isAssigned && !doc.isDuplicate && (
                  <span className="text-[10px] font-bold text-gray-400 bg-gray-800 px-2 py-1 rounded uppercase tracking-wider">Assigned</span>
                )}
                <button 
                  onClick={() => removeFile(doc.id)}
                  title="Remove file"
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-gray-700 transition-colors ml-1"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
