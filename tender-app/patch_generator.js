const fs = require('fs');

const content = `import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { ChecklistItem, getPackageReadiness } from '../matching/selectors';
import { TenderData } from '../types';
import { format } from 'date-fns';

export interface GenerationResult {
  pdfBytes: Uint8Array | null;
  filename: string;
  error: string | null;
}

export const getPackageFilename = (tenderId: string): string => {
  return \`\${tenderId}_Package.pdf\`;
};

// Colors
const colors = {
  navy: rgb(0.1, 0.15, 0.25),
  charcoal: rgb(0.2, 0.2, 0.2),
  gray: rgb(0.5, 0.5, 0.5),
  lightGray: rgb(0.85, 0.85, 0.85),
  accent: rgb(0.3, 0.35, 0.75), // Indigo
  white: rgb(1, 1, 1),
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

    // 2. Cover Page
    const coverPage = mergedPdf.addPage();
    const { width, height } = coverPage.getSize();
    
    let y = height - 80;
    const marginX = 60;

    // "TENDER DOCUMENT PACKAGE"
    coverPage.drawText('TENDER DOCUMENT PACKAGE', { x: marginX, y, size: 10, font: boldFont, color: colors.gray });
    y -= 30;

    // Title
    coverPage.drawText(tenderData.tender.title, { x: marginX, y, size: 24, font: boldFont, color: colors.navy });
    y -= 30;

    // Badge
    const badgeText = tenderData.tender.tender_id;
    const badgeTextWidth = boldFont.widthOfTextAtSize(badgeText, 12);
    coverPage.drawRectangle({
      x: marginX, y: y - 5, width: badgeTextWidth + 16, height: 20,
      color: rgb(0.95, 0.95, 0.98), borderColor: colors.accent, borderWidth: 1
    });
    coverPage.drawText(badgeText, { x: marginX + 8, y, size: 12, font: boldFont, color: colors.accent });
    y -= 60;

    // TENDER DETAILS
    coverPage.drawText('TENDER DETAILS', { x: marginX, y, size: 10, font: boldFont, color: colors.gray });
    y -= 10;
    coverPage.drawLine({ start: { x: marginX, y }, end: { x: width - marginX, y }, thickness: 1, color: colors.lightGray });
    y -= 25;

    const drawDetail = (label, value, colX, colY) => {
      coverPage.drawText(label.toUpperCase(), { x: colX, y: colY, size: 8, font: font, color: colors.gray });
      coverPage.drawText(value, { x: colX, y: colY - 14, size: 11, font: boldFont, color: colors.charcoal });
    };

    drawDetail('Procuring Entity', tenderData.tender.procuring_entity, marginX, y);
    drawDetail('Submission Deadline', format(new Date(tenderData.tender.submission_deadline), 'dd MMMM yyyy'), marginX + 250, y);
    y -= 45;
    
    drawDetail('Bidder', tenderData.tender.bidder, marginX, y);
    drawDetail('Package Generated', format(new Date(), 'dd MMMM yyyy'), marginX + 250, y);
    y -= 50;

    // Save Y to draw summary later (after we know pages)
    const summaryY = y;
    y -= 60;

    // INCLUDED DOCUMENTS
    coverPage.drawText('INCLUDED DOCUMENTS', { x: marginX, y, size: 10, font: boldFont, color: colors.gray });
    y -= 10;
    coverPage.drawLine({ start: { x: marginX, y }, end: { x: width - marginX, y }, thickness: 1, color: colors.lightGray });
    y -= 20;

    for (const item of includedItems) {
      const numStr = String(item.requirement.order).padStart(2, '0');
      const title = item.requirement.title_en;
      const filename = item.matchedDocument?.filename || '';
      
      // Check if we need a new page for cover docs
      if (y < 120) {
        // Just break to prevent overflow, unlikely with <10 docs but safety first
        break;
      }

      coverPage.drawText(numStr, { x: marginX, y, size: 10, font: boldFont, color: colors.accent });
      coverPage.drawText(title, { x: marginX + 25, y, size: 11, font: boldFont, color: colors.navy });
      coverPage.drawText(filename, { x: marginX + 25, y: y - 12, size: 9, font: font, color: colors.gray });
      
      y -= 20;
      coverPage.drawLine({ start: { x: marginX, y }, end: { x: width - marginX, y }, thickness: 0.5, color: rgb(0.9, 0.9, 0.9) });
      y -= 15;
    }

    // Cover Footer
    coverPage.drawText('Prepared for tender submission', { x: marginX, y: 50, size: 9, font: font, color: colors.gray });
    coverPage.drawText('Generated locally in Tender Package Builder', { x: marginX, y: 38, size: 9, font: font, color: colors.gray });


    // 3. Merge Source PDFs
    for (const item of includedItems) {
      if (!item.matchedDocument) continue;

      let sourcePdf: PDFDocument;
      try {
        const buffer = await item.matchedDocument.file.arrayBuffer();
        sourcePdf = await PDFDocument.load(buffer, { ignoreEncryption: false });
      } catch (err: any) {
        if (err.message && err.message.toLowerCase().includes('encrypted')) {
           return { pdfBytes: null, filename: '', error: \`Cannot process encrypted/password-protected file: \${item.matchedDocument.filename}\` };
        }
        return { pdfBytes: null, filename: '', error: \`Cannot load or parse file: \${item.matchedDocument.filename}\` };
      }

      try {
        const copiedPages = await mergedPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
        copiedPages.forEach(page => mergedPdf.addPage(page));
      } catch (err) {
        return { pdfBytes: null, filename: '', error: \`Failed to merge pages from file: \${item.matchedDocument.filename}\` };
      }
    }

    // 4 & 5. Global Footer & Total Page Count
    const totalPages = mergedPdf.getPageCount();
    
    // Fill SUMMARY
    coverPage.drawText('PACKAGE SUMMARY', { x: marginX, y: summaryY, size: 10, font: boldFont, color: colors.gray });
    coverPage.drawLine({ start: { x: marginX, y: summaryY - 10 }, end: { x: width - marginX, y: summaryY - 10 }, thickness: 1, color: colors.lightGray });
    coverPage.drawText(\`\${includedItems.length} documents included\`, { x: marginX, y: summaryY - 25, size: 10, font: font, color: colors.charcoal });
    coverPage.drawText(\`\${totalPages - 1} source pages\`, { x: marginX, y: summaryY - 40, size: 10, font: font, color: colors.charcoal });
    coverPage.drawText(\`\${totalPages} total package pages\`, { x: marginX, y: summaryY - 55, size: 10, font: boldFont, color: colors.navy });

    // Apply Footers to ALL pages
    for (let i = 0; i < totalPages; i++) {
      const page = mergedPdf.getPage(i);
      const { width: pWidth } = page.getSize();
      
      const footerText = \`\${tenderData.tender.tender_id} | Page \${i + 1} of \${totalPages}\`;
      const textWidth = font.widthOfTextAtSize(footerText, 9);
      
      const fy = 20;
      page.drawLine({ start: { x: 40, y: fy + 12 }, end: { x: pWidth - 40, y: fy + 12 }, thickness: 0.5, color: colors.lightGray });
      
      // Draw white background rect to ensure readable over content
      page.drawRectangle({
        x: pWidth / 2 - textWidth / 2 - 4,
        y: fy - 2,
        width: textWidth + 8,
        height: 12,
        color: colors.white
      });
      
      page.drawText(footerText, {
        x: pWidth / 2 - textWidth / 2,
        y: fy,
        size: 9,
        font: font,
        color: rgb(0.3, 0.3, 0.3) // Muted dark gray
      });
    }

    const pdfBytes = await mergedPdf.save();
    return {
      pdfBytes,
      filename: getPackageFilename(tenderData.tender.tender_id),
      error: null
    };
  } catch (error: any) {
    return { pdfBytes: null, filename: '', error: \`Unexpected generation error: \${error.message}\` };
  }
};
`;

fs.writeFileSync('src/core/pdf/generator.ts', content);
