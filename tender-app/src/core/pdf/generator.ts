import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { ChecklistItem, getPackageReadiness } from '../matching/selectors';
import { TenderData } from '../types';

export interface GenerationResult {
  pdfBytes: Uint8Array | null;
  filename: string;
  error: string | null;
}

export const getPackageFilename = (tenderId: string): string => {
  return `${tenderId}_Package.pdf`;
};

export const generateTenderPackage = async (
  tenderData: TenderData,
  checklist: ChecklistItem[]
): Promise<GenerationResult> => {
  try {
    const readiness = getPackageReadiness(checklist);
    if (!readiness.canGenerate) {
      return { pdfBytes: null, filename: '', error: 'Cannot generate package with blocking statuses.' };
    }

    const mergedPdf = await PDFDocument.create();
    const font = await mergedPdf.embedFont(StandardFonts.Helvetica);
    const boldFont = await mergedPdf.embedFont(StandardFonts.HelveticaBold);

    // 1. Determine included documents and sort by order
    const includedItems = checklist
      .filter(item => item.matchedDocument !== undefined)
      .sort((a, b) => a.requirement.order - b.requirement.order);

    // 2. Generate Cover Page
    const coverPage = mergedPdf.addPage();
    const { width, height } = coverPage.getSize();
    
    let y = height - 50;
    const drawLine = (text: string, size: number, isBold: boolean = false, yOffset: number = 20) => {
      const targetFont = isBold ? boldFont : font;
      coverPage.drawText(text, { x: 50, y, size, font: targetFont });
      y -= yOffset;
    };

    drawLine(`Tender ID: ${tenderData.tender.tender_id}`, 18, true, 30);
    drawLine(`Title: ${tenderData.tender.title}`, 16, true, 30);
    drawLine(`Procuring Entity: ${tenderData.tender.procuring_entity}`, 12, false, 20);
    drawLine(`Bidder: ${tenderData.tender.bidder}`, 12, false, 20);
    drawLine(`Submission Deadline: ${tenderData.tender.submission_deadline}`, 12, false, 20);
    drawLine(`Generated At: ${new Date().toISOString().split('T')[0]}`, 12, false, 40);

    drawLine('Included Documents:', 14, true, 20);
    
    includedItems.forEach((item, index) => {
      const docName = item.matchedDocument?.filename || 'Unknown File';
      drawLine(`${index + 1}. ${item.requirement.title_en} (${docName})`, 10, false, 15);
    });

    // 3. Merge Source PDFs
    for (const item of includedItems) {
      if (!item.matchedDocument) continue;

      let sourcePdf: PDFDocument;
      try {
        const buffer = await item.matchedDocument.file.arrayBuffer();
        sourcePdf = await PDFDocument.load(buffer, { ignoreEncryption: false });
      } catch (err: any) {
        if (err.message && err.message.toLowerCase().includes('encrypted')) {
           return { pdfBytes: null, filename: '', error: `Cannot process encrypted/password-protected file: ${item.matchedDocument.filename}` };
        }
        return { pdfBytes: null, filename: '', error: `Cannot load or parse file: ${item.matchedDocument.filename}` };
      }

      try {
        const copiedPages = await mergedPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
        copiedPages.forEach(page => mergedPdf.addPage(page));
      } catch (err) {
        return { pdfBytes: null, filename: '', error: `Failed to merge pages from file: ${item.matchedDocument.filename}` };
      }
    }

    // 4 & 5. Global Footer & Total Page Count
    const totalPages = mergedPdf.getPageCount();
    for (let i = 0; i < totalPages; i++) {
      const page = mergedPdf.getPage(i);
      const { width: pWidth } = page.getSize();
      
      const footerText = `${tenderData.tender.tender_id} | Page ${i + 1} of ${totalPages}`;
      const textWidth = font.widthOfTextAtSize(footerText, 10);
      
      // Draw centered footer at the bottom (y=15), with a white background for legibility if needed
      // Actually, to prevent covering content simply, we draw at the very bottom edge where margins usually exist
      page.drawText(footerText, {
        x: pWidth / 2 - textWidth / 2,
        y: 15,
        size: 10,
        font: font,
        color: rgb(0, 0, 0)
      });
    }

    const pdfBytes = await mergedPdf.save();
    return {
      pdfBytes,
      filename: getPackageFilename(tenderData.tender.tender_id),
      error: null
    };
  } catch (error: any) {
    return { pdfBytes: null, filename: '', error: `Unexpected generation error: ${error.message}` };
  }
};
