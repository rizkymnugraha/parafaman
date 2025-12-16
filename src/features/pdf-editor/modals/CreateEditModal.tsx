import React, { type RefObject, useEffect } from 'react';
import { Trash2, Stamp, Upload, ImageIcon, Download } from 'lucide-react';
import { Button } from '@/components/ui';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/constants';
import type { ModalMode } from '@/types';

interface CreateEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  modalMode: ModalMode;
  editingItemId: number | null;
  signaturePadRef: RefObject<HTMLCanvasElement | null>;
  fileInputRef: RefObject<HTMLInputElement | null>;
  isCanvasEmpty: boolean;
  onStartDrawing: (e: React.MouseEvent | React.TouchEvent) => void;
  onDraw: (e: React.MouseEvent | React.TouchEvent) => void;
  onStopDrawing: () => void;
  onClearCanvas: () => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDownloadSignature: () => void;
  onSaveAndPlace: () => void;
  onInitializeCanvas?: () => void;
}

export const CreateEditModal: React.FC<CreateEditModalProps> = ({
  isOpen,
  onClose,
  modalMode,
  editingItemId,
  signaturePadRef,
  fileInputRef,
  isCanvasEmpty,
  onStartDrawing,
  onDraw,
  onStopDrawing,
  onClearCanvas,
  onImageUpload,
  onDownloadSignature,
  onSaveAndPlace,
  onInitializeCanvas,
}) => {
  // Initialize canvas with HiDPI support when modal opens
  useEffect(() => {
    if (isOpen && onInitializeCanvas) {
      // Small delay to ensure canvas is rendered
      const timeoutId = setTimeout(() => {
        onInitializeCanvas();
      }, 50);
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, onInitializeCanvas]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg p-0 gap-0">
        <DialogHeader className="p-4 border-b border-border">
          <DialogTitle className="text-md font-semibold tracking-tight">
            {editingItemId ? 'Ubah ' : 'Tambah '}
            {modalMode === 'signature' ? 'Tanda Tangan' : 'Stempel / Materai'}
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-col items-center gap-4">
          {modalMode === 'signature' && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center md:px-12">
              Goreskan tanda tangan Anda di area putih di bawah menggunakan mouse atau layar sentuh.
            </p>
          )}

          <div
            className={`border rounded-md bg-white overflow-hidden shadow-sm w-full relative group ${modalMode === 'signature' ? 'cursor-crosshair' : ''}`}
          >
            <canvas
              ref={signaturePadRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="w-full h-auto touch-none block"
              onMouseDown={onStartDrawing}
              onMouseMove={onDraw}
              onMouseUp={onStopDrawing}
              onMouseLeave={onStopDrawing}
              onTouchStart={onStartDrawing}
              onTouchMove={onDraw}
              onTouchEnd={onStopDrawing}
            />

            {!isCanvasEmpty && (
              <button
                onClick={onClearCanvas}
                className="absolute top-2 right-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 rounded p-1 text-xs opacity-50 hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}

            {modalMode === 'stamp' && isCanvasEmpty && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-zinc-400 text-sm">
                <div className="text-center">
                  <Stamp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Pratinjau gambar akan muncul di sini</p>
                </div>
              </div>
            )}
          </div>

          <div className="w-full flex flex-col items-center gap-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest text-center font-medium">
              {modalMode === 'signature'
                ? '— atau unggah file gambar —'
                : '— unggah file stempel / materai —'}
            </p>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={onImageUpload}
            />

            <Button
              variant={modalMode === 'stamp' ? 'default' : 'secondary'}
              size={modalMode === 'stamp' ? 'default' : 'sm'}
              onClick={() => fileInputRef.current?.click()}
              className="gap-2"
            >
              {modalMode === 'stamp' ? (
                <Upload className="w-4 h-4" />
              ) : (
                <ImageIcon className="w-3 h-3" />
              )}
              Pilih Gambar
            </Button>
          </div>
        </div>

        <DialogFooter className="p-4 border-t border-border bg-background flex items-center justify-between sm:justify-between">
          <div>
            {!isCanvasEmpty && modalMode === 'signature' && (
              <Button
                variant="outline"
                size="sm"
                onClick={onDownloadSignature}
                className="text-xs text-zinc-500 px-2 h-7"
                title="Download Master"
              >
                <Download className="w-3 h-3 mr-1.5" /> Simpan File Tanda Tangan
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={onSaveAndPlace} className="h-8 px-4 text-xs">
              {editingItemId ? 'Simpan Perubahan' : 'Pasang'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
