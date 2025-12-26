import { pdfjsLib, PDFLib } from '@/hooks/usePdfLibraries';
import type { PlacedItem, SavedItem, ModalMode, PDFDocument } from '@/types';

export class PasswordRequiredError extends Error {
  constructor() {
    super('Password required');
    this.name = 'PasswordRequiredError';
  }
}

export class IncorrectPasswordError extends Error {
  constructor() {
    super('Incorrect password');
    this.name = 'IncorrectPasswordError';
  }
}

export const loadPdfFile = async (
  file: File,
  password?: string
): Promise<{ arrayBuffer: ArrayBuffer; doc: PDFDocument; numPages: number }> => {
  if (file.type !== 'application/pdf') {
    throw new Error('Mohon unggah file dengan format PDF.');
  }

  const arrayBuffer = await file.arrayBuffer();
  const bufferForPreview = arrayBuffer.slice(0);
  const loadingTask = pdfjsLib.getDocument({
    data: bufferForPreview,
    password: password,
  });

  try {
    const doc = await loadingTask.promise;

    return {
      arrayBuffer,
      doc: doc as unknown as PDFDocument,
      numPages: doc.numPages,
    };
  } catch (err) {
    if (err instanceof Error) {
      // pdf.js uses PasswordException with code 1 for needing password, code 2 for incorrect password
      const pdfError = err as Error & { code?: number };
      if (pdfError.name === 'PasswordException') {
        if (pdfError.code === 1) {
          throw new PasswordRequiredError();
        } else if (pdfError.code === 2) {
          throw new IncorrectPasswordError();
        }
      }
    }
    throw err;
  }
};

export const getItemImage = (
  type: ModalMode,
  itemId: number,
  savedSignatures: SavedItem[],
  savedStamps: SavedItem[]
): string | null => {
  const items = type === 'signature' ? savedSignatures : savedStamps;
  const item = items.find((s) => s.id === itemId);
  return item ? item.dataUrl : null;
};

// Helper function to render a PDF page to an image using pdf.js
const renderPageToImageBytes = async (
  pdfDoc: PDFDocument,
  pageNum: number,
  scale: number = 2 // Higher scale = better quality
): Promise<{ imageBytes: ArrayBuffer; width: number; height: number }> => {
  const page = await pdfDoc.getPage(pageNum);
  const viewport = page.getViewport({ scale: 1 });

  // Create canvas at higher resolution for quality
  const canvas = document.createElement('canvas');
  const scaledViewport = page.getViewport({ scale });
  canvas.width = scaledViewport.width;
  canvas.height = scaledViewport.height;

  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not get canvas context');

  // Render with white background
  context.fillStyle = 'white';
  context.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({
    canvasContext: context,
    viewport: scaledViewport,
  }).promise;

  // Convert to blob and then to ArrayBuffer (JPEG for smaller size)
  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.92);
  });
  const imageBytes = await blob.arrayBuffer();

  return {
    imageBytes,
    width: viewport.width,
    height: viewport.height,
  };
};

// Reconstruct PDF from rendered pages (for encrypted PDFs that we can't directly modify)
const reconstructPdfFromPages = async (
  sourcePdfDoc: PDFDocument,
  numPages: number
): Promise<Uint8Array> => {
  const newPdfDoc = await PDFLib.PDFDocument.create();

  for (let i = 1; i <= numPages; i++) {
    const { imageBytes, width, height } = await renderPageToImageBytes(sourcePdfDoc, i);
    const jpgImage = await newPdfDoc.embedJpg(imageBytes);

    const page = newPdfDoc.addPage([width, height]);
    page.drawImage(jpgImage, {
      x: 0,
      y: 0,
      width: width,
      height: height,
    });
  }

  return newPdfDoc.save();
};

export const savePdfWithItems = async (
  pdfFile: ArrayBuffer,
  placedItems: PlacedItem[],
  savedSignatures: SavedItem[],
  savedStamps: SavedItem[],
  canvasWidth: number,
  password?: string | null,
  sourcePdfDoc?: PDFDocument | null
): Promise<Blob> => {
  let pdfDoc;

  // For password-protected PDFs, we need to reconstruct from rendered pages
  // because pdf-lib cannot decrypt the content streams
  if (password && sourcePdfDoc) {
    const reconstructedBytes = await reconstructPdfFromPages(sourcePdfDoc, sourcePdfDoc.numPages);
    pdfDoc = await PDFLib.PDFDocument.load(reconstructedBytes);
  } else {
    const pdfBufferCopy = pdfFile.slice(0);
    pdfDoc = await PDFLib.PDFDocument.load(pdfBufferCopy);
  }

  const embeddedImages: Record<string, Awaited<ReturnType<typeof pdfDoc.embedPng>>> = {};
  const uniqueNeeded = new Set<string>();
  placedItems.forEach((p) => uniqueNeeded.add(`${p.type}|${p.itemId}`));

  for (const uniqueKey of uniqueNeeded) {
    const [type, idStr] = uniqueKey.split('|');
    const id = parseInt(idStr);
    const dataUrl = getItemImage(type as ModalMode, id, savedSignatures, savedStamps);
    if (dataUrl) {
      embeddedImages[uniqueKey] = await pdfDoc.embedPng(dataUrl);
    }
  }

  const pages = pdfDoc.getPages();

  for (const placement of placedItems) {
    const page = pages[placement.pageNum - 1];
    if (!page) continue;

    const key = `${placement.type}|${placement.itemId}`;
    const pngImage = embeddedImages[key];
    if (!pngImage) continue;

    const { width, height } = page.getSize();
    const scaleFactor = width / canvasWidth;

    const sigWidth = placement.width * scaleFactor;
    const imgDims = pngImage.scale(1);
    const aspectRatio = imgDims.width / imgDims.height;
    const sigHeight = sigWidth / aspectRatio;

    const x = placement.x * scaleFactor;
    const y = height - placement.y * scaleFactor - sigHeight;

    page.drawImage(pngImage, {
      x,
      y,
      width: sigWidth,
      height: sigHeight,
    });
  }

  // Encrypt the PDF if a password was provided
  if (password) {
    await pdfDoc.encrypt({
      userPassword: password,
      ownerPassword: password,
    });
  }

  const pdfBytes = await pdfDoc.save({ useObjectStreams: false });
  return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
};

export const downloadBlob = (blob: Blob, filename: string) => {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
};
