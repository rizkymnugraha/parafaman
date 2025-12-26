// Types for PDF Editor Application

export type Theme = 'light' | 'dark' | 'system';

export type ModalMode = 'signature' | 'stamp';

export type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';

export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

export interface SavedItem {
  id: number;
  dataUrl: string;
}

export interface PlacedItem {
  id: number;
  type: ModalMode;
  itemId: number;
  x: number;
  y: number;
  width: number;
  pageNum: number;
}

export interface DragStartPosition {
  x: number;
  y: number;
}

export interface ResizeStartPosition {
  startX: number;
  startWidth: number;
}

export interface Coordinates {
  left: number;
  top: number;
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
}

export interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

// PDF Library types (external)
import type * as PdfjsLib from 'pdfjs-dist';
import type * as PdfLibType from 'pdf-lib-plus-encrypt';

declare global {
  interface Window {
    pdfjsLib: typeof PdfjsLib;
    PDFLib: typeof PdfLibType;
  }
}

export interface PDFDocument {
  numPages: number;
  getPage: (pageNum: number) => Promise<PDFPage>;
}

export interface PDFPage {
  getViewport: (options: { scale: number }) => PDFViewport;
  render: (context: PDFRenderContext) => { promise: Promise<void> };
}

export interface PDFViewport {
  width: number;
  height: number;
}

export interface PDFRenderContext {
  canvasContext: CanvasRenderingContext2D;
  viewport: PDFViewport;
}

export interface PDFLibDocument {
  embedPng: (dataUrl: string) => Promise<PDFLibImage>;
  getPages: () => PDFLibPage[];
  save: () => Promise<Uint8Array>;
}

export interface PDFLibPage {
  getSize: () => { width: number; height: number };
  drawImage: (
    image: PDFLibImage,
    options: {
      x: number;
      y: number;
      width: number;
      height: number;
    }
  ) => void;
}

export interface PDFLibImage {
  scale: (scale: number) => { width: number; height: number };
}
