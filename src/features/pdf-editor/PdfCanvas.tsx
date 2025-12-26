import React, { forwardRef, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import type { PlacedItem } from '@/types';

interface PdfCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  placedItems: PlacedItem[];
  pageNum: number;
  draggingId: number | null;
  resizingId: number | null;
  zoomLevel: number;
  selectedId: number | null;
  getItemImage: (type: 'signature' | 'stamp', itemId: number) => string | null;
  onDragStart: (e: React.MouseEvent | React.TouchEvent, id: number) => void;
  onResizeStart: (e: React.MouseEvent | React.TouchEvent, id: number) => void;
  onGlobalMove: (e: React.MouseEvent | React.TouchEvent) => void;
  onGlobalEnd: () => void;
  onRemoveItem: (id: number) => void;
  onSelectItem: (id: number | null) => void;
  onBackgroundClick: () => void;
}

// Threshold in pixels to distinguish click from drag
const DRAG_THRESHOLD = 5;

export const PdfCanvas = forwardRef<HTMLDivElement, PdfCanvasProps>(
  (
    {
      canvasRef,
      placedItems,
      pageNum,
      draggingId,
      resizingId,
      zoomLevel,
      selectedId,
      getItemImage,
      onDragStart,
      onResizeStart,
      onGlobalMove,
      onGlobalEnd,
      onRemoveItem,
      onSelectItem,
      onBackgroundClick,
    },
    containerRef
  ) => {
    // Track pointer start position to distinguish click from drag
    const pointerStartRef = useRef<{ x: number; y: number; id: number | null }>({
      x: 0,
      y: 0,
      id: null,
    });
    const hasDraggedRef = useRef(false);

    // Handle mouse down on an item (desktop)
    const handleMouseDown = useCallback(
      (e: React.MouseEvent, itemId: number) => {
        e.stopPropagation();

        pointerStartRef.current = { x: e.clientX, y: e.clientY, id: itemId };
        hasDraggedRef.current = false;

        // Always start drag immediately - this enables smooth dragging
        onDragStart(e, itemId);
      },
      [onDragStart]
    );

    // Handle touch start on an item (mobile) - immediately select and start drag
    const handleTouchStart = useCallback(
      (e: React.TouchEvent, itemId: number) => {
        e.stopPropagation();

        const touch = e.touches[0];
        pointerStartRef.current = { x: touch.clientX, y: touch.clientY, id: itemId };
        hasDraggedRef.current = false;

        // On mobile, immediately select and start drag for better UX
        onSelectItem(itemId);
        onDragStart(e, itemId);
      },
      [onDragStart, onSelectItem]
    );

    // Handle touch move on item (mobile) - forward to global move handler
    const handleTouchMove = useCallback(
      (e: React.TouchEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onGlobalMove(e);
      },
      [onGlobalMove]
    );

    // Handle mouse up - determine if it was a click or drag (desktop)
    const handleMouseUp = useCallback(
      (itemId: number) => {
        // If we didn't drag past threshold, treat as click and select
        if (!hasDraggedRef.current && pointerStartRef.current.id === itemId) {
          onSelectItem(itemId);
        }
        pointerStartRef.current = { x: 0, y: 0, id: null };
      },
      [onSelectItem]
    );

    // Handle touch end (mobile) - forward to global end and reset tracking
    const handleTouchEnd = useCallback(() => {
      pointerStartRef.current = { x: 0, y: 0, id: null };
      onGlobalEnd();
    }, [onGlobalEnd]);

    // Track movement to determine if dragging occurred (desktop only)
    const handleMouseMove = useCallback((e: React.MouseEvent) => {
      if (pointerStartRef.current.id === null) return;

      const deltaX = Math.abs(e.clientX - pointerStartRef.current.x);
      const deltaY = Math.abs(e.clientY - pointerStartRef.current.y);

      if (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD) {
        hasDraggedRef.current = true;
      }
    }, []);

    return (
      <div
        className="flex-1 bg-zinc-100 dark:bg-zinc-900 overflow-auto relative"
        ref={containerRef}
        onClick={onBackgroundClick}
        onTouchStart={(e) => {
          // Deselect when touching outside items (on the background)
          if (e.target === e.currentTarget) {
            onBackgroundClick();
          }
        }}
      >
        {/* Scrollable container - uses inline-flex to allow proper scrolling when zoomed */}
        <div className="inline-flex p-8 min-h-full min-w-full box-border">
          <div
            className="relative shadow-xl h-fit border border-zinc-200 dark:border-zinc-800 bg-white m-auto"
            onClick={(e) => {
              e.stopPropagation();
              onBackgroundClick();
            }}
            onTouchEnd={(e) => {
              // Only deselect if touching directly on this container (not on items)
              if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === 'CANVAS') {
                onBackgroundClick();
              }
            }}
          >
            {/* PDF Layer */}
            <canvas ref={canvasRef} className="block" />

            {/* Placed Items Layer */}
            {placedItems.map((placement) => {
              if (placement.pageNum !== pageNum) return null;
              const imgSrc = getItemImage(placement.type, placement.itemId);
              if (!imgSrc) return null;

              const isActive = draggingId === placement.id || resizingId === placement.id;
              const isSelected = selectedId === placement.id;

              // Scale position and size by zoomLevel
              const scaledX = placement.x * zoomLevel;
              const scaledY = placement.y * zoomLevel;
              const scaledWidth = placement.width * zoomLevel;

              return (
                <div
                  key={placement.id}
                  onMouseDown={(e) => handleMouseDown(e, placement.id)}
                  onMouseMove={handleMouseMove}
                  onMouseUp={() => handleMouseUp(placement.id)}
                  onTouchStart={(e) => handleTouchStart(e, placement.id)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  className={`group absolute cursor-move select-none transition-transform duration-75 rounded-md ${isActive ? 'ring-2 ring-brand-500 ring-dashed scale-[1.02] shadow-2xl z-50' : isSelected ? 'ring-2 ring-brand-500 z-40' : 'hover:ring-1 hover:ring-brand-400 z-10'}`}
                  style={{
                    left: scaledX,
                    top: scaledY,
                    width: scaledWidth + 'px',
                    height: 'auto',
                    touchAction: 'none',
                  }}
                >
                  <img
                    src={imgSrc}
                    alt="Item"
                    className="w-full h-auto object-contain pointer-events-none"
                  />

                  {/* Delete Button (Top Right) - visible on hover (desktop) or when selected (mobile) */}
                  <button
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveItem(placement.id);
                    }}
                    className={`absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 transition-all duration-200 shadow-sm z-20 cursor-pointer hover:scale-110 ${isSelected || isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                    title="Hapus dari PDF"
                  >
                    <X className="w-3 h-3" />
                  </button>

                  {/* Resize Handle (Bottom Right) - visible on hover (desktop) or when selected (mobile) */}
                  <div
                    className={`absolute -bottom-1 -right-1 w-4 h-4 bg-white border-2 border-brand-500 rounded-full cursor-nwse-resize z-20 shadow-sm flex items-center justify-center hover:scale-125 transition-transform duration-100 ${isSelected || isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      onSelectItem(placement.id);
                      onResizeStart(e, placement.id);
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      onSelectItem(placement.id);
                      onResizeStart(e, placement.id);
                    }}
                    title="Tarik untuk ubah ukuran"
                  />
                </div>
              );
            })}
          </div>
        </div>
        {/* Click handler for deselecting */}
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: -1 }} />
      </div>
    );
  }
);

PdfCanvas.displayName = 'PdfCanvas';
