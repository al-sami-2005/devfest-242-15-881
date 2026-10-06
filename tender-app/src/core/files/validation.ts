import { FileProcessingError } from './errors';

const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50 MB
const MAX_FILE_COUNT = 30;

export const isPdfMimeType = (file: File): boolean => {
  return file.type === 'application/pdf';
};

export const hasPdfSignature = async (file: File): Promise<boolean> => {
  try {
    // Read just the first 5 bytes to check signature %PDF-
    const slice = file.slice(0, 5);
    const arrayBuffer = await slice.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    
    // % P D F -
    // 37 80 68 70 45 in decimal
    // % (37), P (80), D (68), F (70), - (45)
    return (
      bytes.length === 5 &&
      bytes[0] === 37 &&
      bytes[1] === 80 &&
      bytes[2] === 68 &&
      bytes[3] === 70 &&
      bytes[4] === 45
    );
  } catch {
    return false;
  }
};

export const validateBatch = (
  newFiles: File[],
  existingFilesSize: number,
  existingFilesCount: number
): FileProcessingError | null => {
  const newCount = newFiles.length;
  if (existingFilesCount + newCount > MAX_FILE_COUNT) {
    return { code: 'MAX_FILES_EXCEEDED', message: `Cannot exceed ${MAX_FILE_COUNT} files` };
  }

  const newTotalSize = newFiles.reduce((acc, f) => acc + f.size, 0);
  if (existingFilesSize + newTotalSize > MAX_TOTAL_SIZE) {
    return { code: 'MAX_SIZE_EXCEEDED', message: 'Cannot exceed 50 MB total size' };
  }

  return null;
};
