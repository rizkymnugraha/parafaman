import { useState, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import * as PDFLib from 'pdf-lib-plus-encrypt';

// Set up the worker for PDF.js
// Using .js extension from public folder for server MIME type compatibility
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

// Expose libraries globally for other modules
window.pdfjsLib = pdfjsLib as typeof window.pdfjsLib;
window.PDFLib = PDFLib as typeof window.PDFLib;

export const usePdfLibraries = () => {
  const [librariesLoaded, setLibrariesLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Libraries are already imported, just verify they're available
      if (pdfjsLib && PDFLib) {
        setLibrariesLoaded(true);
      } else {
        setError('Gagal memuat library PDF.');
      }
    } catch (err) {
      setError('Gagal memuat library PDF.');
      console.error(err);
    }
  }, []);

  return { librariesLoaded, error };
};

// Export libraries for direct import in other files
export { pdfjsLib, PDFLib };
