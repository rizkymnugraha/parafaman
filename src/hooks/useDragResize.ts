import { useState, useRef, useCallback, type RefObject } from 'react';
import type { PlacedItem, DragStartPosition, ResizeStartPosition } from '@/types';
import { MIN_ITEM_WIDTH } from '@/constants';

export const useDragResize = (
  placedItems: PlacedItem[],
  setPlacedItems: React.Dispatch<React.SetStateAction<PlacedItem[]>>,
  canvasRef?: RefObject<HTMLCanvasElement | null>,
  zoomLevel: number = 1.0
) => {
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [resizingId, setResizingId] = useState<number | null>(null);

  const dragStartRef = useRef<DragStartPosition>({ x: 0, y: 0 });
  const resizeStartRef = useRef<ResizeStartPosition>({
    startX: 0,
    startWidth: 0,
  });

  const bringToFront = useCallback(
    (instanceId: number) => {
      setPlacedItems((prev) => {
        const index = prev.findIndex((p) => p.id === instanceId);
        if (index === -1 || index === prev.length - 1) return prev;
        const newItems = [...prev];
        const [movedItem] = newItems.splice(index, 1);
        newItems.push(movedItem);
        return newItems;
      });
    },
    [setPlacedItems]
  );

  const handleDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent, instanceId: number) => {
      if ('button' in e && e.button !== 0) return;
      e.stopPropagation();

      bringToFront(instanceId);
      setDraggingId(instanceId);

      const instance = placedItems.find((p) => p.id === instanceId);
      if (!instance) return;

      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

      // Get canvas position to calculate relative coordinates
      const canvas = canvasRef?.current;
      const canvasRect = canvas?.getBoundingClientRect();
      const canvasLeft = canvasRect?.left ?? 0;
      const canvasTop = canvasRect?.top ?? 0;

      // Calculate offset: mouse position relative to canvas, accounting for zoom
      // Item positions are stored at base scale, but rendered at zoomLevel scale
      dragStartRef.current = {
        x: (clientX - canvasLeft) / zoomLevel - instance.x,
        y: (clientY - canvasTop) / zoomLevel - instance.y,
      };
    },
    [placedItems, bringToFront, canvasRef, zoomLevel]
  );

  const handleResizeStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent, instanceId: number) => {
      e.stopPropagation();
      e.preventDefault();

      bringToFront(instanceId);
      setResizingId(instanceId);

      const instance = placedItems.find((p) => p.id === instanceId);
      if (!instance) return;

      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;

      resizeStartRef.current = {
        startX: clientX,
        startWidth: instance.width,
      };
    },
    [placedItems, bringToFront]
  );

  const handleGlobalMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

      if (resizingId) {
        // Account for zoom when calculating resize delta
        const deltaX = (clientX - resizeStartRef.current.startX) / zoomLevel;
        const newWidth = Math.max(MIN_ITEM_WIDTH, resizeStartRef.current.startWidth + deltaX);

        setPlacedItems((prev) =>
          prev.map((p) => (p.id === resizingId ? { ...p, width: newWidth } : p))
        );
      } else if (draggingId) {
        // Get canvas position to calculate relative coordinates
        const canvas = canvasRef?.current;
        const canvasRect = canvas?.getBoundingClientRect();
        const canvasLeft = canvasRect?.left ?? 0;
        const canvasTop = canvasRect?.top ?? 0;

        // Calculate new position relative to PDF canvas, accounting for zoom
        // Convert screen coordinates to base scale coordinates
        const newX = (clientX - canvasLeft) / zoomLevel - dragStartRef.current.x;
        const newY = (clientY - canvasTop) / zoomLevel - dragStartRef.current.y;

        setPlacedItems((prev) =>
          prev.map((p) => (p.id === draggingId ? { ...p, x: newX, y: newY } : p))
        );
      }
    },
    [draggingId, resizingId, setPlacedItems, canvasRef, zoomLevel]
  );

  const handleGlobalEnd = useCallback(() => {
    setDraggingId(null);
    setResizingId(null);
  }, []);

  const removePlacedItem = useCallback(
    (instanceId: number) => {
      setPlacedItems((prev) => prev.filter((p) => p.id !== instanceId));
    },
    [setPlacedItems]
  );

  return {
    draggingId,
    resizingId,
    handleDragStart,
    handleResizeStart,
    handleGlobalMove,
    handleGlobalEnd,
    removePlacedItem,
  };
};
