import React, { createContext, useContext, useState, useCallback } from 'react';
import type { PDFDocument, SavedItem, PlacedItem } from '@/types';

interface PdfStoreState {
  pdfFile: ArrayBuffer | null;
  pdfDoc: PDFDocument | null;
  numPages: number;
  isPasswordProtected: boolean;
  pdfPassword: string | null;
  savedSignatures: SavedItem[];
  savedStamps: SavedItem[];
  placedItems: PlacedItem[];
}

interface PdfStoreActions {
  setPdfData: (
    arrayBuffer: ArrayBuffer,
    doc: PDFDocument,
    numPages: number,
    password?: string | null
  ) => void;
  clearPdfData: () => void;
  setSavedSignatures: React.Dispatch<React.SetStateAction<SavedItem[]>>;
  setSavedStamps: React.Dispatch<React.SetStateAction<SavedItem[]>>;
  setPlacedItems: React.Dispatch<React.SetStateAction<PlacedItem[]>>;
}

type PdfStoreContextType = PdfStoreState & PdfStoreActions;

const PdfStoreContext = createContext<PdfStoreContextType | null>(null);

export const PdfStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pdfFile, setPdfFile] = useState<ArrayBuffer | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocument | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [pdfPassword, setPdfPassword] = useState<string | null>(null);
  const [savedSignatures, setSavedSignatures] = useState<SavedItem[]>([]);
  const [savedStamps, setSavedStamps] = useState<SavedItem[]>([]);
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([]);

  const setPdfData = useCallback(
    (arrayBuffer: ArrayBuffer, doc: PDFDocument, pages: number, password?: string | null) => {
      setPdfFile(arrayBuffer);
      setPdfDoc(doc);
      setNumPages(pages);
      setIsPasswordProtected(!!password);
      setPdfPassword(password || null);
      setPlacedItems([]);
    },
    []
  );

  const clearPdfData = useCallback(() => {
    setPdfFile(null);
    setPdfDoc(null);
    setNumPages(0);
    setIsPasswordProtected(false);
    setPdfPassword(null);
    setPlacedItems([]);
  }, []);

  const value: PdfStoreContextType = {
    pdfFile,
    pdfDoc,
    numPages,
    isPasswordProtected,
    pdfPassword,
    savedSignatures,
    savedStamps,
    placedItems,
    setPdfData,
    clearPdfData,
    setSavedSignatures,
    setSavedStamps,
    setPlacedItems,
  };

  return <PdfStoreContext.Provider value={value}>{children}</PdfStoreContext.Provider>;
};

export const usePdfStore = (): PdfStoreContextType => {
  const context = useContext(PdfStoreContext);
  if (!context) {
    throw new Error('usePdfStore must be used within a PdfStoreProvider');
  }
  return context;
};
