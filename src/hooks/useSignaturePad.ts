import { useRef, useState, useCallback, useEffect } from 'react';
import type { ModalMode } from '@/types';

interface Point {
  x: number;
  y: number;
  time: number;
  pressure?: number;
}

interface StrokePoint extends Point {
  lineWidth: number;
}

interface ExtendedCanvas extends HTMLCanvasElement {
  isDrawing?: boolean;
}

// Stroke settings
const MIN_LINE_WIDTH = 0.5;
const MAX_LINE_WIDTH = 3.5;
const BASE_LINE_WIDTH = 2.5;
const VELOCITY_FILTER_WEIGHT = 0.7;
const MIN_DISTANCE = 2;

export const useSignaturePad = (modalMode: ModalMode) => {
  const signaturePadRef = useRef<ExtendedCanvas>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCanvasEmpty, setIsCanvasEmpty] = useState(true);

  // Stroke tracking refs
  const pointsRef = useRef<StrokePoint[]>([]);
  const lastVelocityRef = useRef<number>(0);
  const lastWidthRef = useRef<number>(BASE_LINE_WIDTH);
  const strokeStartTimeRef = useRef<number>(0);

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

  const getCanvasCoordinates = useCallback((e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = signaturePadRef.current;
    if (!canvas) return { x: 0, y: 0, time: Date.now() };

    const rect = canvas.getBoundingClientRect();

    let clientX: number;
    let clientY: number;
    let pressure: number | undefined;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
      // Get pressure from touch event if available
      const touch = e.touches[0] as Touch & { force?: number };
      pressure = touch.force;
    } else {
      const mouseEvent = e as React.MouseEvent;
      clientX = mouseEvent.clientX;
      clientY = mouseEvent.clientY;
    }

    // Calculate the scale factor between canvas internal size and display size
    const dpr = window.devicePixelRatio || 1;
    const scaleX = canvas.width / dpr / rect.width;
    const scaleY = canvas.height / dpr / rect.height;

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    return { x, y, time: Date.now(), pressure };
  }, []);

  // Calculate distance between two points
  const distanceBetween = (p1: Point, p2: Point): number => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  };

  // Calculate velocity between two points
  const velocityBetween = (p1: Point, p2: Point): number => {
    const timeDiff = p2.time - p1.time;
    if (timeDiff <= 0) return 0;
    return distanceBetween(p1, p2) / timeDiff;
  };

  // Calculate stroke width based on velocity (faster = thinner)
  const calculateStrokeWidth = useCallback(
    (velocity: number, isStart: boolean, isEnd: boolean, strokeProgress: number): number => {
      // Apply velocity filter for smoothing
      const filteredVelocity =
        VELOCITY_FILTER_WEIGHT * velocity + (1 - VELOCITY_FILTER_WEIGHT) * lastVelocityRef.current;
      lastVelocityRef.current = filteredVelocity;

      // Map velocity to width (inverse relationship)
      // Higher velocity = thinner stroke
      const velocityFactor = Math.min(filteredVelocity / 2, 1);
      let width = MAX_LINE_WIDTH - (MAX_LINE_WIDTH - MIN_LINE_WIDTH) * velocityFactor;

      // Apply tapering at start and end
      if (isStart) {
        // Taper in at the start
        const taperFactor = Math.min(strokeProgress * 4, 1);
        width *= taperFactor;
      } else if (isEnd) {
        // Taper out at the end (handled in stopDrawing)
        width *= 0.3;
      }

      // Clamp width
      width = Math.max(MIN_LINE_WIDTH, Math.min(MAX_LINE_WIDTH, width));

      // Smooth transition from last width
      const smoothedWidth = lastWidthRef.current + (width - lastWidthRef.current) * 0.3;
      lastWidthRef.current = smoothedWidth;

      return smoothedWidth;
    },
    []
  );

  // Draw a smooth curve segment with variable width
  const drawCurveSegment = useCallback(
    (ctx: CanvasRenderingContext2D, p0: StrokePoint, p1: StrokePoint, p2: StrokePoint) => {
      // Calculate control point for quadratic bezier
      const midX = (p0.x + p1.x) / 2;
      const midY = (p0.y + p1.y) / 2;
      const midX2 = (p1.x + p2.x) / 2;
      const midY2 = (p1.y + p2.y) / 2;

      // Draw the curve with variable width using multiple small segments
      const steps = Math.ceil(distanceBetween(p0, p2) / 2);
      const actualSteps = Math.max(steps, 4);

      for (let i = 0; i < actualSteps; i++) {
        const t = i / actualSteps;
        const t2 = (i + 1) / actualSteps;

        // Quadratic bezier interpolation
        const x1 = (1 - t) * (1 - t) * midX + 2 * (1 - t) * t * p1.x + t * t * midX2;
        const y1 = (1 - t) * (1 - t) * midY + 2 * (1 - t) * t * p1.y + t * t * midY2;
        const x2 = (1 - t2) * (1 - t2) * midX + 2 * (1 - t2) * t2 * p1.x + t2 * t2 * midX2;
        const y2 = (1 - t2) * (1 - t2) * midY + 2 * (1 - t2) * t2 * p1.y + t2 * t2 * midY2;

        // Interpolate line width
        const width = p0.lineWidth + (p2.lineWidth - p0.lineWidth) * t;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
      }
    },
    []
  );

  // Draw a simple line segment for first two points
  const drawLineSegment = useCallback(
    (ctx: CanvasRenderingContext2D, p1: StrokePoint, p2: StrokePoint) => {
      const distance = distanceBetween(p1, p2);
      const steps = Math.max(Math.ceil(distance / 2), 2);

      for (let i = 0; i < steps; i++) {
        const t = i / steps;
        const t2 = (i + 1) / steps;

        const x1 = p1.x + (p2.x - p1.x) * t;
        const y1 = p1.y + (p2.y - p1.y) * t;
        const x2 = p1.x + (p2.x - p1.x) * t2;
        const y2 = p1.y + (p2.y - p1.y) * t2;

        // Interpolate width
        const width = p1.lineWidth + (p2.lineWidth - p1.lineWidth) * t;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
      }
    },
    []
  );

  const startDrawing = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (modalMode !== 'signature') return;
      const canvas = signaturePadRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const point = getCanvasCoordinates(e);

      // Reset stroke tracking
      pointsRef.current = [];
      lastVelocityRef.current = 0;
      lastWidthRef.current = MIN_LINE_WIDTH; // Start thin for taper
      strokeStartTimeRef.current = point.time;

      // Set stroke properties
      ctx.strokeStyle = '#000';
      ctx.fillStyle = '#000';
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Add first point with minimal width (tapered start)
      const strokePoint: StrokePoint = {
        ...point,
        lineWidth: MIN_LINE_WIDTH,
      };
      pointsRef.current.push(strokePoint);

      // Draw a small dot at the start
      ctx.beginPath();
      ctx.arc(point.x, point.y, MIN_LINE_WIDTH / 2, 0, Math.PI * 2);
      ctx.fill();

      canvas.isDrawing = true;
      setIsCanvasEmpty(false);
    },
    [modalMode, getCanvasCoordinates]
  );

  const draw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (modalMode !== 'signature') return;
      const canvas = signaturePadRef.current;
      if (!canvas || !canvas.isDrawing) return;

      e.preventDefault();
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const point = getCanvasCoordinates(e);
      const points = pointsRef.current;

      if (points.length === 0) return;

      const lastPoint = points[points.length - 1];

      // Skip if point is too close
      const distance = distanceBetween(lastPoint, point);
      if (distance < MIN_DISTANCE) return;

      // Calculate velocity and width
      const velocity = velocityBetween(lastPoint, point);
      const strokeDuration = point.time - strokeStartTimeRef.current;
      const isStart = strokeDuration < 100; // First 100ms is "start"
      const strokeProgress = Math.min(strokeDuration / 100, 1);

      const lineWidth = calculateStrokeWidth(velocity, isStart, false, strokeProgress);

      const strokePoint: StrokePoint = {
        ...point,
        lineWidth,
      };
      points.push(strokePoint);

      // Draw based on number of points
      ctx.strokeStyle = '#000';

      if (points.length === 2) {
        // Just two points - draw a line
        drawLineSegment(ctx, points[0], points[1]);
      } else if (points.length > 2) {
        // Three or more points - draw smooth curve
        const p0 = points[points.length - 3];
        const p1 = points[points.length - 2];
        const p2 = points[points.length - 1];
        drawCurveSegment(ctx, p0, p1, p2);
      }
    },
    [modalMode, getCanvasCoordinates, calculateStrokeWidth, drawCurveSegment, drawLineSegment]
  );

  const stopDrawing = useCallback(() => {
    const canvas = signaturePadRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const points = pointsRef.current;

    // Draw tapered end if we have enough points
    if (ctx && points.length >= 2) {
      const lastPoint = points[points.length - 1];

      // Create a tapered end point
      const taperedPoint: StrokePoint = {
        x: lastPoint.x,
        y: lastPoint.y,
        time: lastPoint.time,
        lineWidth: MIN_LINE_WIDTH * 0.5,
      };

      ctx.strokeStyle = '#000';

      if (points.length === 2) {
        // Update last point to be tapered
        points[points.length - 1].lineWidth = MIN_LINE_WIDTH;
        drawLineSegment(ctx, points[0], points[1]);
      } else if (points.length > 2) {
        // Draw final tapered segment
        const p0 = points[points.length - 2];
        const p1 = lastPoint;
        drawLineSegment(ctx, p0, { ...p1, lineWidth: MIN_LINE_WIDTH * 0.5 });
      }

      // Draw a small dot at the end for smooth finish
      ctx.beginPath();
      ctx.arc(taperedPoint.x, taperedPoint.y, MIN_LINE_WIDTH * 0.25, 0, Math.PI * 2);
      ctx.fill();
    }

    canvas.isDrawing = false;
    pointsRef.current = [];
  }, [drawLineSegment]);

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
    // Reset stroke state
    pointsRef.current = [];
    lastVelocityRef.current = 0;
    lastWidthRef.current = BASE_LINE_WIDTH;
  }, []);

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          drawImageOnCanvas(event.target.result as string);
          setIsCanvasEmpty(false);
        }
      };
      reader.readAsDataURL(file);
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
    startDrawing,
    draw,
    stopDrawing,
    clearCanvas,
    handleImageUpload,
    downloadSignature,
    drawImageOnCanvas,
    getCanvasDataUrl,
    initializeCanvas,
  };
};
