import * as pdfjsLib from 'pdfjs-dist';

// We delay setting the worker URL until it's needed so that it's configurable or falls back to CDN.
let workerInitialized = false;

const initPdfJs = () => {
  if (!workerInitialized && typeof window !== 'undefined') {
    // Standard Vite pattern or CDN fallback
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
    workerInitialized = true;
  }
};

export const getPdfPageCount = async (file: File): Promise<number> => {
  initPdfJs();
  let arrayBuffer: ArrayBuffer | null = null;
  let pdf: pdfjsLib.PDFDocumentProxy | null = null;

  try {
    arrayBuffer = await file.arrayBuffer();
    // We clone the buffer or use it directly. To save memory, pdf.js can load from typed arrays.
    const data = new Uint8Array(arrayBuffer);
    
    // getDocument is asynchronous and returns a loading task
    const loadingTask = pdfjsLib.getDocument({ data });
    pdf = await loadingTask.promise;
    
    const pageCount = pdf.numPages;
    return pageCount;
  } catch (error) {
    throw new Error('CORRUPT_PDF');
  } finally {
    // Resource cleanup to prevent memory leaks with large files
    if (pdf) {
      try {
        await (pdf as any).destroy();
      } catch (e) {
        // ignore destroy errors
      }
    }
    // Hint GC
    arrayBuffer = null;
  }
};
