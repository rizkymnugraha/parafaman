import React from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui';

interface PageNavigationProps {
  pageNum: number;
  numPages: number;
  pageInput: string;
  zoomLevel: number;
  canZoomIn: boolean;
  canZoomOut: boolean;
  onPageChange: (page: number) => void;
  onPageInputChange: (value: string) => void;
  onPageInputBlur: () => void;
  onPageInputKeyDown: (e: React.KeyboardEvent) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
}

export const PageNavigation: React.FC<PageNavigationProps> = ({
  pageNum,
  numPages,
  pageInput,
  zoomLevel,
  canZoomIn,
  canZoomOut,
  onPageChange,
  onPageInputChange,
  onPageInputBlur,
  onPageInputKeyDown,
  onZoomIn,
  onZoomOut,
  onResetZoom,
}) => {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 md:bottom-auto md:top-6 md:left-auto md:translate-x-0 md:right-76 z-30 flex items-center gap-1 md:gap-2 flex-nowrap">
      {/* Zoom Controls */}
      <div className="h-10 md:h-12 border shadow-md border-border bg-background flex items-center px-1.5 md:px-2 rounded-full shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 md:h-8 md:w-8 rounded-full"
          onClick={onZoomOut}
          disabled={!canZoomOut}
          title="Perkecil"
        >
          <ZoomOut className="w-3.5 h-3.5 md:w-4 md:h-4" />
        </Button>

        <button
          onClick={onResetZoom}
          className="px-1 md:px-2 text-xs font-medium min-w-10 md:min-w-14 text-center hover:bg-accent rounded-md py-1 transition-colors"
          title="Reset zoom"
        >
          {Math.round(zoomLevel * 100)}%
        </button>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 md:h-8 md:w-8 rounded-full"
          onClick={onZoomIn}
          disabled={!canZoomIn}
          title="Perbesar"
        >
          <ZoomIn className="w-3.5 h-3.5 md:w-4 md:h-4" />
        </Button>
      </div>

      {/* Page Navigation */}
      <div className="h-10 md:h-12 border shadow-md border-border bg-background flex items-center justify-between px-1.5 md:px-2 rounded-full shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 md:h-8 md:w-8 rounded-full"
          onClick={() => onPageChange(Math.max(pageNum - 1, 1))}
          disabled={pageNum <= 1}
        >
          <ChevronLeft className="w-3.5 h-3.5 md:w-4 md:h-4" />
        </Button>

        <div className="flex items-center gap-1 md:gap-2 text-xs font-medium px-1 md:px-2">
          <span className="hidden md:inline">Hal</span>
          <input
            type="text"
            value={pageInput}
            onChange={(e) => onPageInputChange(e.target.value)}
            onBlur={onPageInputBlur}
            onKeyDown={onPageInputKeyDown}
            className="w-8 md:w-10 text-center border rounded-md bg-background px-1 py-0.5 focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 outline-none transition-all duration-200"
          />
          <span className="text-muted-foreground">/ {numPages}</span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 md:h-8 md:w-8 rounded-full"
          onClick={() => onPageChange(Math.min(pageNum + 1, numPages))}
          disabled={pageNum >= numPages}
        >
          <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
        </Button>
      </div>
    </div>
  );
};
