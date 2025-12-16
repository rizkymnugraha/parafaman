import React, { forwardRef } from 'react';
import { X } from 'lucide-react';
import type { PlacedItem } from '@/types';

interface Viewport {
  x: number;
  y: number;
}

interface PdfCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  placedItems: PlacedItem[];
  pageNum: number;
  draggingId: number | null;
  resizingId: number | null;
  isPanning: boolean;
  viewport: Viewport;
  getItemImage: (type: 'signature' | 'stamp', itemId: number) => string | null;
  onDragStart: (e: React.MouseEvent | React.TouchEvent, id: number) => void;
  onResizeStart: (e: React.MouseEvent | React.TouchEvent, id: number) => void;
  onRemoveItem: (id: number) => void;
  onPanStart: (e: React.MouseEvent | React.TouchEvent) => void;
  onPanMove: (e: React.MouseEvent | React.TouchEvent) => void;
  onPanEnd: () => void;
}

export const PdfCanvas = forwardRef<HTMLDivElement, PdfCanvasProps>(
  (
    {
      canvasRef,
      placedItems,
      pageNum,
      draggingId,
      resizingId,
      isPanning,
      viewport,
      getItemImage,
      onDragStart,
      onResizeStart,
      onRemoveItem,
      onPanStart,
      onPanMove,
      onPanEnd,
    },
    containerRef
  ) => {
    return (
      <div
        className={`flex-1 bg-zinc-100 dark:bg-zinc-900 overflow-hidden relative ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
        ref={containerRef}
        onMouseDown={onPanStart}
        onMouseMove={onPanMove}
        onMouseUp={onPanEnd}
        onMouseLeave={onPanEnd}
        onTouchStart={onPanStart}
        onTouchMove={onPanMove}
        onTouchEnd={onPanEnd}
      >
        {/* Transform container for panning */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: `translate(${viewport.x}px, ${viewport.y}px)`,
          }}
        >
          <div className="relative shadow-xl h-fit border border-zinc-200 dark:border-zinc-800 bg-white">
            {/* PDF Layer */}
            <canvas ref={canvasRef} className="block" />

            {/* Placed Items Layer */}
            {placedItems.map((placement) => {
              if (placement.pageNum !== pageNum) return null;
              const imgSrc = getItemImage(placement.type, placement.itemId);
              if (!imgSrc) return null;

              const isActive = draggingId === placement.id || resizingId === placement.id;

              return (
                <div
                  key={placement.id}
                  onMouseDown={(e) => onDragStart(e, placement.id)}
                  onTouchStart={(e) => onDragStart(e, placement.id)}
                  className={`absolute z-10 cursor-move group select-none transition-transform duration-75 ${isActive ? 'ring-2 ring-brand-500 ring-dashed scale-[1.02] shadow-2xl z-50' : 'hover:ring-1 hover:ring-brand-400 z-10'}`}
                  style={{
                    left: placement.x,
                    top: placement.y,
                    width: placement.width + 'px',
                    height: 'auto',
                    touchAction: 'none',
                  }}
                >
                  <img
                    src={imgSrc}
                    alt="Item"
                    className="w-full h-auto object-contain pointer-events-none"
                  />

                  {/* Delete Button (Top Right) */}
                  <button
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveItem(placement.id);
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-sm z-20 cursor-pointer hover:scale-110"
                    title="Hapus dari PDF"
                  >
                    <X className="w-3 h-3" />
                  </button>

                  {/* Resize Handle (Bottom Right) */}
                  <div
                    className="absolute -bottom-1 -right-1 w-4 h-4 bg-white border-2 border-brand-500 rounded-full cursor-nwse-resize z-20 opacity-0 group-hover:opacity-100 shadow-sm flex items-center justify-center hover:scale-125 transition-transform duration-100"
                    onMouseDown={(e) => onResizeStart(e, placement.id)}
                    onTouchStart={(e) => onResizeStart(e, placement.id)}
                    title="Tarik untuk ubah ukuran"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
);

PdfCanvas.displayName = 'PdfCanvas';
