import { describe, it, expect, vi } from 'vitest';
import { removeDocument, recomputeDuplicates } from '../core/files/engine';
import { UploadedDocument } from '../core/types';
import { validateBatch } from '../core/files/validation';

// Mock getPdfPageCount so we don't need real PDF data
vi.mock('../core/pdf/pageCount', () => ({
  getPdfPageCount: vi.fn().mockResolvedValue(1)
}));

describe('engine duplicate recomputation', () => {
  it('correctly marks duplicates', () => {
    const docs = [
      { id: '1', contentHash: 'hashA', status: 'success' },
      { id: '2', contentHash: 'hashA', status: 'success' },
      { id: '3', contentHash: 'hashB', status: 'success' },
      { id: '4', contentHash: 'hashC', status: 'error' } // Errors shouldn't be duplicates
    ] as UploadedDocument[];

    const result = recomputeDuplicates(docs);

    expect(result[0].isDuplicate).toBe(true);
    expect(result[0].duplicateGroup).toBe('hashA');
    expect(result[1].isDuplicate).toBe(true);
    
    expect(result[2].isDuplicate).toBe(false);
    expect(result[2].duplicateGroup).toBeUndefined();

    expect(result[3].isDuplicate).toBe(false);
  });

  it('unmarks duplicate when one is removed', () => {
    const docs = [
      { id: '1', contentHash: 'hashA', status: 'success' },
      { id: '2', contentHash: 'hashA', status: 'success' }
    ] as UploadedDocument[];

    const initial = recomputeDuplicates(docs);
    expect(initial[0].isDuplicate).toBe(true);

    const afterRemoval = removeDocument('2', initial);
    expect(afterRemoval.length).toBe(1);
    expect(afterRemoval[0].isDuplicate).toBe(false);
  });
});

describe('validation rules', () => {
  it('rejects batch if max files exceeded', () => {
    const mockFile = new File([''], 'test.pdf');
    const result = validateBatch([mockFile], 3000, 30);
    expect(result?.code).toBe('MAX_FILES_EXCEEDED');
  });

  it('rejects batch if max size exceeded', () => {
    const mockFile = new File(['a'.repeat(1024 * 1024)], 'test.pdf');
    Object.defineProperty(mockFile, 'size', { value: 1024 * 1024 * 10 }); // 10 MB

    // Already 45 MB existing
    const result = validateBatch([mockFile], 45 * 1024 * 1024, 1);
    expect(result?.code).toBe('MAX_SIZE_EXCEEDED');
  });
});
