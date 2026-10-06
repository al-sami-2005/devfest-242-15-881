import React from 'react';
import { File, AlertTriangle, X } from 'lucide-react';
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
    <div className="mb-8">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Uploaded Files</h3>
      <div className="border border-gray-800 bg-[#161616] rounded-xl overflow-hidden divide-y divide-gray-800/50">
        {documents.map(doc => {
          const isAssigned = checklist.some(item => item.assignment.documentId === doc.id);
          
          return (
            <div key={doc.id} className="flex items-center justify-between p-3 hover:bg-[#1a1a1a] transition-colors group">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-8 h-8 rounded bg-gray-800 flex items-center justify-center shrink-0">
                  <File className="w-4 h-4 text-gray-400" />
                </div>
                <div className="flex flex-col truncate">
                  <span className="text-sm font-medium text-gray-200 truncate">{doc.filename}</span>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{doc.pageCount ? `${doc.pageCount} page${doc.pageCount !== 1 ? 's' : ''}` : 'Counting...'}</span>
                    <span>·</span>
                    <span>{Math.round(doc.size / 1024)} KB</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 pl-4 shrink-0">
                {doc.isDuplicate && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    <AlertTriangle className="w-3 h-3" /> Duplicate
                  </span>
                )}
                {isAssigned && !doc.isDuplicate && (
                  <span className="text-[11px] font-medium text-gray-400 bg-gray-800 px-2 py-0.5 rounded">Assigned</span>
                )}
                <button 
                  onClick={() => removeFile(doc.id)}
                  title="Remove file"
                  className="w-7 h-7 flex items-center justify-center rounded text-gray-500 hover:text-white hover:bg-gray-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
