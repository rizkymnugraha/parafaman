import { pdfjsLib, PDFLib } from '@/hooks/usePdfLibraries';
import type { PlacedItem, SavedItem, ModalMode, PDFDocument } from '@/types';

export interface SavePdfOptions {
  password?: string;
  openPassword?: string; // Password used to open/decrypt the source PDF
}

export interface LoadPdfOptions {
  password?: string;
}

export class PasswordRequiredError extends Error {
  constructor() {
    super('PDF membutuhkan password untuk dibuka.');
    this.name = 'PasswordRequiredError';
  }
}

export class IncorrectPasswordError extends Error {
  constructor() {
    super('Password yang dimasukkan salah.');
    this.name = 'IncorrectPasswordError';
  }
}

export const loadPdfFile = async (
  file: File,
  options?: LoadPdfOptions
): Promise<{ arrayBuffer: ArrayBuffer; doc: PDFDocument; numPages: number }> => {
  if (file.type !== 'application/pdf') {
    throw new Error('Mohon unggah file dengan format PDF.');
  }

  const arrayBuffer = await file.arrayBuffer();
  const bufferForPreview = arrayBuffer.slice(0);

  const loadingTaskOptions: any = {};
  if (options?.password) {
    loadingTaskOptions.password = options.password;
  }

  const loadingTask = pdfjsLib.getDocument({
    data: bufferForPreview,
    ...loadingTaskOptions,
  });

  try {
    const doc = await loadingTask.promise;
    return {
      arrayBuffer,
      doc: doc as unknown as PDFDocument,
      numPages: doc.numPages,
    };
  } catch (error) {
    // Check if it's a password-related error
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      if (
        errorMessage.includes('password') ||
        errorMessage.includes('encrypted') ||
        error.name === 'PasswordException'
      ) {
        // Check if a password was provided but was incorrect
        if (options?.password) {
          throw new IncorrectPasswordError();
        }
        throw new PasswordRequiredError();
      }
    }
    throw error;
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

// Helper to render a PDF page to canvas and get image data
const renderPageToImage = async (
  pdfDoc: PDFDocument,
  pageNum: number,
  scale: number = 2 // Higher scale for better quality
): Promise<string> => {
  const page = await pdfDoc.getPage(pageNum);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not get canvas context');

  await page.render({
    canvasContext: context,
    viewport,
  }).promise;

  return canvas.toDataURL('image/png');
};

// Create a new PDF from rendered pages (for encrypted PDFs)
const createPdfFromRenderedPages = async (
  sourcePdfDoc: PDFDocument,
  numPages: number
): Promise<Awaited<ReturnType<typeof PDFLib.PDFDocument.create>>> => {
  const newPdfDoc = await PDFLib.PDFDocument.create();

  for (let i = 1; i <= numPages; i++) {
    const page = await sourcePdfDoc.getPage(i);
    const viewport = page.getViewport({ scale: 1 });

    // Render page to image at high resolution
    const imageDataUrl = await renderPageToImage(sourcePdfDoc, i, 3);

    // Embed the image in the new PDF
    const pngImage = await newPdfDoc.embedPng(imageDataUrl);

    // Add a page with the same dimensions as the original
    const newPage = newPdfDoc.addPage([viewport.width, viewport.height]);

    // Draw the image to fill the entire page
    newPage.drawImage(pngImage, {
      x: 0,
      y: 0,
      width: viewport.width,
      height: viewport.height,
    });
  }

  return newPdfDoc;
};

export const savePdfWithItems = async (
  pdfFile: ArrayBuffer,
  placedItems: PlacedItem[],
  savedSignatures: SavedItem[],
  savedStamps: SavedItem[],
  canvasWidth: number,
  options?: SavePdfOptions,
  sourcePdfDoc?: PDFDocument, // Pass the already-decrypted pdf.js document for encrypted PDFs
  numPages?: number
): Promise<Blob> => {
  const pdfBufferCopy = pdfFile.slice(0);

  // Try to load the PDF, handling encrypted PDFs
  let pdfDoc: Awaited<ReturnType<typeof PDFLib.PDFDocument.load>>;

  try {
    // First try normal load
    pdfDoc = await PDFLib.PDFDocument.load(pdfBufferCopy);
  } catch (error) {
    // If it's an encrypted PDF error, we need to create from rendered pages
    if (
      error instanceof Error &&
      (error.message.includes('encrypted') || error.message.includes('Encrypted'))
    ) {
      if (!sourcePdfDoc || !numPages) {
        throw new Error(
          'PDF terenkripsi membutuhkan dokumen sumber yang sudah didekripsi untuk disimpan.'
        );
      }
      // Create new PDF from rendered pages using pdf.js (which already decrypted it)
      pdfDoc = await createPdfFromRenderedPages(sourcePdfDoc, numPages);
    } else {
      throw error;
    }
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

  // Save with or without password protection
  if (options?.password) {
    await (pdfDoc as any).encrypt({
      userPassword: options.password,
      ownerPassword: options.password,
      permissions: {
        printing: 'highResolution',
        modifying: false,
        copying: false,
        annotating: false,
        fillingForms: false,
        contentAccessibility: true,
        documentAssembly: false,
      },
    });
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
};

export const downloadBlob = (blob: Blob, filename: string) => {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
};
