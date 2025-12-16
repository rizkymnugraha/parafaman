import { useRef, useState, useCallback, useEffect } from 'react';
import type { ModalMode } from '@/types';

interface ExtendedCanvas extends HTMLCanvasElement {
  isDrawing?: boolean;
}

export const useSignaturePad = (modalMode: ModalMode) => {
  const signaturePadRef = useRef<ExtendedCanvas>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCanvasEmpty, setIsCanvasEmpty] = useState(true);
  const [hasUploadedImage, setHasUploadedImage] = useState(false);
  const [currentImageDataUrl, setCurrentImageDataUrl] = useState<string | null>(null);
  const [hasRemovedBackground, setHasRemovedBackground] = useState(false);

  // Initialize canvas with HiDPI support for better anti-aliasing
  const initializeCanvas = useCallback(() => {
    const canvas = signaturePadRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get the device pixel ratio for HiDPI displays
    const dpr = window.devicePixelRatio || 1;

    // Get the display size from CSS
    const rect = canvas.getBoundingClientRect();
    const displayWidth = rect.width;
    const displayHeight = rect.height;

    // Set the canvas internal size to match display size * pixel ratio
    // This creates a higher resolution drawing surface
    if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
      canvas.width = displayWidth * dpr;
      canvas.height = displayHeight * dpr;

      // Scale the context to match the device pixel ratio
      ctx.scale(dpr, dpr);
    }

    // Set anti-aliasing properties
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
  }, []);

  // Re-initialize canvas when component mounts or window resizes
  useEffect(() => {
    initializeCanvas();

    const handleResize = () => {
      // Debounce resize handling
      const timeoutId = setTimeout(initializeCanvas, 100);
      return () => clearTimeout(timeoutId);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [initializeCanvas]);

  const drawImageOnCanvas = useCallback((dataUrl: string) => {
    const img = new Image();
    img.onload = () => {
      const canvas = signaturePadRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      const displayWidth = rect.width;
      const displayHeight = rect.height;

      // Enable image smoothing for better anti-aliasing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      ctx.clearRect(0, 0, displayWidth, displayHeight);

      // Calculate scale to fit image within canvas with padding
      const scale = Math.min(displayWidth / img.width, displayHeight / img.height) * 0.8;
      const w = img.width * scale;
      const h = img.height * scale;
      const x = (displayWidth - w) / 2;
      const y = (displayHeight - h) / 2;

      ctx.drawImage(img, x, y, w, h);
    };
    img.src = dataUrl;
  }, []);

  const startDrawing = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (modalMode !== 'signature') return;
      const canvas = signaturePadRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      // Set stroke properties for smooth, anti-aliased lines
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round'; // Smooth line connections
      ctx.strokeStyle = '#000';

      // Enable anti-aliasing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      ctx.beginPath();
      ctx.moveTo(x, y);
      canvas.isDrawing = true;
      setIsCanvasEmpty(false);
    },
    [modalMode]
  );

  const draw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (modalMode !== 'signature') return;
      const canvas = signaturePadRef.current;
      if (!canvas || !canvas.isDrawing) return;

      e.preventDefault();
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      ctx.lineTo(x, y);
      ctx.stroke();
    },
    [modalMode]
  );

  const stopDrawing = useCallback(() => {
    const canvas = signaturePadRef.current;
    if (canvas) canvas.isDrawing = false;
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = signaturePadRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const rect = canvas.getBoundingClientRect();
        ctx.clearRect(0, 0, rect.width, rect.height);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsCanvasEmpty(true);
    setHasUploadedImage(false);
    setCurrentImageDataUrl(null);
    setHasRemovedBackground(false);
  }, []);

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const dataUrl = event.target.result as string;
          drawImageOnCanvas(dataUrl);
          setIsCanvasEmpty(false);
          setHasUploadedImage(true);
          setCurrentImageDataUrl(dataUrl);
        }
      };
      reader.readAsDataURL(file);
    },
    [drawImageOnCanvas]
  );

  const updateCanvasWithProcessedImage = useCallback(
    (dataUrl: string) => {
      drawImageOnCanvas(dataUrl);
      setCurrentImageDataUrl(dataUrl);
      setHasRemovedBackground(true);
    },
    [drawImageOnCanvas]
  );

  const downloadSignature = useCallback(() => {
    const canvas = signaturePadRef.current;
    if (canvas && !isCanvasEmpty) {
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `ParafAman_Asset_${Date.now()}.png`;
      link.click();
    }
  }, [isCanvasEmpty]);

  const getCanvasDataUrl = useCallback(() => {
    const canvas = signaturePadRef.current;
    if (!canvas) return null;
    return canvas.toDataURL('image/png');
  }, []);

  return {
    signaturePadRef,
    fileInputRef,
    isCanvasEmpty,
    setIsCanvasEmpty,
    hasUploadedImage,
    hasRemovedBackground,
    currentImageDataUrl,
    startDrawing,
    draw,
    stopDrawing,
    clearCanvas,
    handleImageUpload,
    downloadSignature,
    drawImageOnCanvas,
    getCanvasDataUrl,
    initializeCanvas,
    updateCanvasWithProcessedImage,
  };
};
