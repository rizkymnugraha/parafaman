import { useEffect, useState } from 'react';
import { renderPageToImage } from '@/utils';
import type { PDFDocument } from '@/types';

/**
 * Render every page of a PDF to a low-res thumbnail dataUrl.
 * Returns thumbnails in page order; entries are filled in as they finish rendering.
 */
export const usePageThumbnails = (
  doc: PDFDocument | null,
  numPages: number,
  scale: number = 0.4
) => {
  const [thumbnails, setThumbnails] = useState<(string | null)[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!doc || numPages === 0) {
      setThumbnails([]);
      return;
    }

    let cancelled = false;
    setThumbnails(new Array(numPages).fill(null));
    setLoading(true);

    (async () => {
      for (let i = 1; i <= numPages; i++) {
        if (cancelled) return;
        try {
          const dataUrl = await renderPageToImage(doc, i, scale);
          if (cancelled) return;
          setThumbnails((prev) => {
            const next = [...prev];
            next[i - 1] = dataUrl;
            return next;
          });
        } catch (err) {
          console.error(`Failed to render thumbnail for page ${i}:`, err);
        }
      }
      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [doc, numPages, scale]);

  return { thumbnails, loading };
};
