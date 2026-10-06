export type FileErrorCode = 
  | 'NOT_PDF'
  | 'MAX_FILES_EXCEEDED'
  | 'MAX_SIZE_EXCEEDED'
  | 'FILE_READ_ERROR'
  | 'CORRUPT_PDF';

export interface FileProcessingError {
  code: FileErrorCode;
  message: string;
}
