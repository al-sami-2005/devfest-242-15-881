import React from 'react';
import { ChecklistItem } from '../core/matching/selectors';
import { UploadedDocument } from '../core/types';
import { Language, t } from '../core/i18n/index';
import { cn } from '../utils/cn';

interface RequirementsTableProps {
  checklist: ChecklistItem[];
  documents: UploadedDocument[];
  assignFile: (reqId: string, docId: string) => void;
  unassignFile: (reqId: string) => void;
  setExpiry: (reqId: string, dateStr: string | null) => void;
  language: Language;
}

const StatusBadge = ({ status, language }: { status: ChecklistItem['status'], language: Language }) => {
  switch (status) {
    case 'ok':
      return <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-400"><div className="w-1.5 h-1.5 rounded-full bg-green-500" /> {t('status_ok', language)}</span>;
    case 'missing':
      return <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-400"><div className="w-1.5 h-1.5 rounded-full bg-red-500" /> {t('status_missing', language)}</span>;
    case 'expiry-date-needed':
      return <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400"><div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> {t('status_expiry_date_needed', language)}</span>;
    case 'expired':
      return <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-400"><div className="w-1.5 h-1.5 rounded-full bg-red-500" /> {t('status_expired', language)}</span>;
    case 'not-provided':
      return <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500"><div className="w-1.5 h-1.5 rounded-full bg-gray-500" /> {t('status_not_provided', language)}</span>;
    default:
      return null;
  }
};

export const RequirementsTable = ({ checklist, documents, assignFile, unassignFile, setExpiry, language }: RequirementsTableProps) => {
  return (
    <div className="mb-8" id="requirements">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-white">Tender requirements</h2>
      </div>
      
      <div className="space-y-3">
        {checklist.map((item) => (
          <div key={item.requirement.id} className="p-4 rounded-xl border border-gray-800 bg-[#161616] flex flex-col md:flex-row md:items-center gap-4 transition-all hover:border-gray-700">
            {/* Left */}
            <div className="flex-1 min-w-0 flex gap-4">
              <div className="text-xs font-mono text-gray-500 pt-0.5 w-6">
                {String(item.requirement.order).padStart(2, '0')}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-200 truncate" title={item.localizedTitle}>{item.localizedTitle}</span>
                <span className={cn("text-[11px] font-medium mt-1 w-max px-1.5 py-0.5 rounded", item.requirement.mandatory ? "bg-violet-500/10 text-violet-400" : "bg-gray-800 text-gray-400")}>
                  {item.requirement.mandatory ? 'Required' : 'Optional'}
                </span>
              </div>
            </div>

            {/* Center */}
            <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <select 
                className={cn(
                  "w-full sm:w-auto flex-1 bg-[#1a1a1a] border border-gray-700 text-sm rounded-lg px-3 py-1.5 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-shadow appearance-none",
                  !item.assignment.documentId ? "text-gray-500" : "text-gray-200"
                )}
                value={item.assignment.documentId || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) unassignFile(item.requirement.id);
                  else assignFile(item.requirement.id, val);
                }}
              >
                <option value="">Select PDF</option>
                {documents.map(doc => (
                  <option key={doc.id} value={doc.id}>{doc.filename}</option>
                ))}
              </select>

              {item.requirement.has_expiry && item.assignment.documentId && (
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500 mb-0.5 uppercase tracking-wide">Expiry</span>
                  <input 
                    type="date"
                    value={item.assignment.expiryDate || ''}
                    onChange={(e) => setExpiry(item.requirement.id, e.target.value || null)}
                    className="bg-[#1a1a1a] border border-gray-700 text-sm text-gray-200 rounded-lg px-2 py-1 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                  />
                </div>
              )}
            </div>

            {/* Right */}
            <div className="w-40 shrink-0 flex justify-end">
              <StatusBadge status={item.status} language={language} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
