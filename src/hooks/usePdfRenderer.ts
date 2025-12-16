import { useEffect, useState, useCallback, useRef, type RefObject } from 'react';
import type { PDFDocument } from '@/types';

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3.0;
const ZOOM_STEP = 0.1;

export const usePdfRenderer = (
  pdfDoc: PDFDocument | null,
  pageNum: number,
  canvasRef: RefObject<HTMLCanvasElement | null>,
  containerRef: RefObject<HTMLDivElement | null>
) => {
  const [scale, setScale] = useState(1.0);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const baseScaleRef = useRef(1.0);

  // Calculate base scale and render in a single effect to avoid race condition
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current || !containerRef.current) return;

    const calculateAndRender = async () => {
      try {
        const page = await pdfDoc.getPage(pageNum);

        // Calculate base scale based on container width
        const containerWidth = containerRef.current ? containerRef.current.clientWidth - 40 : 600;
        const viewportUnscaled = page.getViewport({ scale: 1 });
        const newBaseScale = Math.min(containerWidth / viewportUnscaled.width, 1.5);
        baseScaleRef.current = newBaseScale;

        // Calculate final scale and render
        const finalScale = newBaseScale * zoomLevel;
        setScale(finalScale);

        const viewport = page.getViewport({ scale: finalScale });
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };
        await page.render(renderContext).promise;
      } catch (err) {
        console.error('Render error:', err);
      }
    };

    calculateAndRender();
  }, [pdfDoc, pageNum, canvasRef, containerRef, zoomLevel]);

  const zoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(prev + ZOOM_STEP, MAX_ZOOM));
  }, []);

  const zoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.max(prev - ZOOM_STEP, MIN_ZOOM));
  }, []);

  const resetZoom = useCallback(() => {
    setZoomLevel(1.0);
  }, []);

  return {
    scale,
    zoomLevel,
    zoomIn,
    zoomOut,
    resetZoom,
    canZoomIn: zoomLevel < MAX_ZOOM,
    canZoomOut: zoomLevel > MIN_ZOOM,
  };
};
