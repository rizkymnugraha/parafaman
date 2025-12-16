import { pdfjsLib, PDFLib } from '@/hooks/usePdfLibraries';
import type { PlacedItem, SavedItem, ModalMode, PDFDocument } from '@/types';

export const loadPdfFile = async (
  file: File
): Promise<{ arrayBuffer: ArrayBuffer; doc: PDFDocument; numPages: number }> => {
  if (file.type !== 'application/pdf') {
    throw new Error('Mohon unggah file dengan format PDF.');
  }

  const arrayBuffer = await file.arrayBuffer();
  const bufferForPreview = arrayBuffer.slice(0);
  const loadingTask = pdfjsLib.getDocument(bufferForPreview);
  const doc = await loadingTask.promise;

  return {
    arrayBuffer,
    doc: doc as unknown as PDFDocument,
    numPages: doc.numPages,
  };
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

export const savePdfWithItems = async (
  pdfFile: ArrayBuffer,
  placedItems: PlacedItem[],
  savedSignatures: SavedItem[],
  savedStamps: SavedItem[],
  canvasWidth: number
): Promise<Blob> => {
  const pdfBufferCopy = pdfFile.slice(0);
  const pdfDoc = await PDFLib.PDFDocument.load(pdfBufferCopy);

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

  const pdfBytes = await pdfDoc.save();
  return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
};

export const downloadBlob = (blob: Blob, filename: string) => {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
};
