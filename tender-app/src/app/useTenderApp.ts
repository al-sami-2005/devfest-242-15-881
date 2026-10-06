import { useState, useCallback, useMemo } from 'react';
import { TenderData, UploadedDocument } from '../core/types';
import { parseRequirementsJson } from '../core/validation/parser';
import { processUploadedFiles, removeDocument } from '../core/files/engine';
import { assignFile, unassignFile, setExpiryDate, MatchingState } from '../core/matching/engine';
import { getDerivedChecklist, getPackageReadiness, ChecklistItem, PackageReadiness } from '../core/matching/selectors';
import { generateTenderPackage } from '../core/pdf/generator';
import { Language } from '../core/i18n';

export interface TenderAppError {
  type: 'JSON_INVALID' | 'DUPLICATE_ASSIGNMENT_CONFLICT' | 'FILE_ALREADY_ASSIGNED' | 'PACKAGE_BLOCKED' | 'PACKAGE_GENERATION_FAILED';
  message: string;
}

export const useTenderApp = () => {
  // Source State
  const [tenderData, setTenderData] = useState<TenderData | null>(null);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [matchingState, setMatchingState] = useState<MatchingState>({ assignments: {} });
  const [language, setLanguage] = useState<Language>('en');

  // Processing State
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [isGeneratingPackage, setIsGeneratingPackage] = useState(false);
  
  // App-level errors
  const [appError, setAppError] = useState<TenderAppError | null>(null);

  // Derived State
  const checklist = useMemo<ChecklistItem[]>(() => {
    if (!tenderData) return [];
    return getDerivedChecklist(tenderData, matchingState, documents, language);
  }, [tenderData, matchingState, documents, language]);

  const readiness = useMemo<PackageReadiness>(() => {
    return getPackageReadiness(checklist);
  }, [checklist]);

  // Actions
  const loadRequirements = useCallback(async (jsonFile: File) => {
    setAppError(null);
    try {
      const text = await jsonFile.text();
      const parsed = parseRequirementsJson(text);
      if (parsed.error || !parsed.data) {
        setAppError({ type: 'JSON_INVALID', message: parsed.error || 'Invalid JSON format' });
        return;
      }
      setTenderData(parsed.data);
      setMatchingState({ assignments: {} });
    } catch (err) {
      setAppError({ type: 'JSON_INVALID', message: 'Failed to read file' });
    }
  }, []);

  const addFiles = useCallback(async (files: File[]) => {
    if (isProcessingFiles) return; // Prevent concurrent uploads and stale writes
    setAppError(null);
    setIsProcessingFiles(true);
    try {
      const result = await processUploadedFiles(files, documents);
      setDocuments(result.documents);
      if (result.batchError) {
        setAppError({ type: 'PACKAGE_GENERATION_FAILED', message: result.batchError.message });
      }
    } finally {
      setIsProcessingFiles(false);
    }
  }, [documents, isProcessingFiles]);

  const removeFile = useCallback((documentId: string) => {
    setAppError(null);
    setMatchingState(prev => {
      let newState = { ...prev };
      Object.keys(newState.assignments).forEach(reqId => {
        if (newState.assignments[reqId].documentId === documentId) {
          newState = unassignFile(newState, reqId);
        }
      });
      return newState;
    });
    setDocuments(prev => removeDocument(documentId, prev));
  }, []);

  const handleAssignFile = useCallback((requirementId: string, documentId: string) => {
    setAppError(null);
    if (!tenderData) return;
    const validReqIds = tenderData.requirements.map(r => r.id);
    const result = assignFile(matchingState, requirementId, documentId, documents, validReqIds);
    
    if (result.conflict) {
      if (result.conflict.type === 'DUPLICATE_CONTENT_ASSIGNED') {
        setAppError({ type: 'DUPLICATE_ASSIGNMENT_CONFLICT', message: 'This file (or an exact copy) is already assigned to another requirement.' });
      } else if (result.conflict.type === 'FILE_ALREADY_ASSIGNED') {
        setAppError({ type: 'FILE_ALREADY_ASSIGNED', message: 'File is already assigned.' });
      }
      return;
    }
    setMatchingState(result.state);
  }, [matchingState, tenderData, documents]);

  const handleUnassignFile = useCallback((requirementId: string) => {
    setAppError(null);
    setMatchingState(prev => unassignFile(prev, requirementId));
  }, []);

  const handleSetExpiry = useCallback((requirementId: string, dateStr: string | null) => {
    setMatchingState(prev => setExpiryDate(prev, requirementId, dateStr));
  }, []);

  const generatePackage = useCallback(async () => {
    setAppError(null);
    if (!tenderData) return;
    if (!readiness.canGenerate) {
      setAppError({ type: 'PACKAGE_BLOCKED', message: 'Cannot generate package. Some requirements are blocking.' });
      return;
    }
    
    setIsGeneratingPackage(true);
    try {
      const result = await generateTenderPackage(tenderData, checklist);
      if (result.error) {
        setAppError({ type: 'PACKAGE_GENERATION_FAILED', message: result.error });
        return;
      }
      
      if (result.pdfBytes) {
        const blob = new Blob([result.pdfBytes as any], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err: any) {
      setAppError({ type: 'PACKAGE_GENERATION_FAILED', message: err.message || 'Unknown generation error' });
    } finally {
      setIsGeneratingPackage(false);
    }
  }, [tenderData, readiness, checklist]);

  const resetProject = useCallback(() => {
    setTenderData(null);
    setDocuments([]);
    setMatchingState({ assignments: {} });
    setAppError(null);
  }, []);

  return {
    // State
    tenderData,
    documents,
    language,
    checklist,
    readiness,
    isProcessingFiles,
    isGeneratingPackage,
    appError,
    
    // Actions
    setLanguage,
    loadRequirements,
    addFiles,
    removeFile,
    assignFile: handleAssignFile,
    unassignFile: handleUnassignFile,
    setExpiry: handleSetExpiry,
    generatePackage,
    resetProject,
    clearError: () => setAppError(null)
  };
};
