import { UploadedDocument } from '../types';
import { computeFileHash } from './hash';
import { getPdfPageCount } from '../pdf/pageCount';
import { isPdfMimeType, hasPdfSignature, validateBatch } from './validation';
import { FileProcessingError } from './errors';

const generateId = () => Math.random().toString(36).substring(2, 9);

export interface ProcessBatchResult {
  documents: UploadedDocument[];
  batchError: FileProcessingError | null;
}

/**
 * Recomputes duplicate statuses for a list of documents.
 * Must be pure and deterministic.
 */
export const recomputeDuplicates = (documents: UploadedDocument[]): UploadedDocument[] => {
  const hashCounts = new Map<string, number>();
  
  // Count occurrences of each hash among valid parsed documents
  for (const doc of documents) {
    if (doc.status === 'success' && doc.contentHash) {
      hashCounts.set(doc.contentHash, (hashCounts.get(doc.contentHash) || 0) + 1);
    }
  }

  // Assign duplicate flags and grouping correctly
  return documents.map(doc => {
    if (doc.status !== 'success' || !doc.contentHash) {
      return { ...doc, isDuplicate: false, duplicateGroup: undefined };
    }
    
    const count = hashCounts.get(doc.contentHash) || 0;
    const isDuplicate = count > 1;
    
    return {
      ...doc,
      isDuplicate,
      duplicateGroup: isDuplicate ? doc.contentHash : undefined
    };
  });
};

/**
 * Processes a single file. Should never crash the batch.
 */
const processSingleFile = async (file: File): Promise<UploadedDocument> => {
  const baseDoc: UploadedDocument = {
    id: generateId(),
    file,
    filename: file.name,
    size: file.size,
    type: file.type,
    pageCount: 0,
    contentHash: '',
    isDuplicate: false,
    status: 'processing'
  };

  try {
    if (!isPdfMimeType(file) && !file.name.toLowerCase().endsWith('.pdf')) {
       return { ...baseDoc, status: 'error', error: { code: 'NOT_PDF', message: 'File is not a PDF' } };
    }

    const isValidSig = await hasPdfSignature(file);
    if (!isValidSig) {
       return { ...baseDoc, status: 'error', error: { code: 'NOT_PDF', message: 'File does not have a valid PDF signature' } };
    }

    const hash = await computeFileHash(file);
    const pageCount = await getPdfPageCount(file);

    return {
      ...baseDoc,
      status: 'success',
      contentHash: hash,
      pageCount
    };
  } catch (error: any) {
    const code = error.message === 'CORRUPT_PDF' ? 'CORRUPT_PDF' : 'FILE_READ_ERROR';
    return {
      ...baseDoc,
      status: 'error',
      error: { code, message: 'Failed to process file' }
    };
  }
};

/**
 * Main engine API to receive new files and merge them safely with existing ones.
 */
export const processUploadedFiles = async (
  newFiles: File[],
  existingDocuments: UploadedDocument[]
): Promise<ProcessBatchResult> => {
  
  const currentSize = existingDocuments.reduce((acc, doc) => acc + doc.size, 0);
  const currentCount = existingDocuments.length;

  const batchError = validateBatch(newFiles, currentSize, currentCount);
  if (batchError) {
    return { documents: existingDocuments, batchError };
  }

  // Process all files in parallel
  const processedNewFiles = await Promise.all(newFiles.map(processSingleFile));
  
  // Merge and recompute duplicates
  const allDocuments = [...existingDocuments, ...processedNewFiles];
  const finalDocuments = recomputeDuplicates(allDocuments);

  return { documents: finalDocuments, batchError: null };
};

/**
 * Remove a document safely and recompute duplicate group relationships.
 */
export const removeDocument = (
  documentIdToRemove: string,
  existingDocuments: UploadedDocument[]
): UploadedDocument[] => {
  const remaining = existingDocuments.filter(doc => doc.id !== documentIdToRemove);
  return recomputeDuplicates(remaining);
};
