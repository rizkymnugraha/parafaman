import React, { type RefObject, useEffect } from 'react';
import {
  Trash2,
  Stamp,
  Upload,
  ImageIcon,
  Download,
  Sparkles,
  X,
  CloudDownload,
  Cpu,
  ImageDown,
} from 'lucide-react';
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

type ProcessingStage = 'downloading' | 'processing' | 'encoding' | null;

interface CreateEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  modalMode: ModalMode;
  editingItemId: number | null;
  signaturePadRef: RefObject<HTMLCanvasElement | null>;
  fileInputRef: RefObject<HTMLInputElement | null>;
  isCanvasEmpty: boolean;
  hasUploadedImage: boolean;
  hasRemovedBackground: boolean;
  isRemovingBackground: boolean;
  backgroundRemovalProgress: number;
  backgroundRemovalStage: ProcessingStage;
  onStartDrawing: (e: React.MouseEvent | React.TouchEvent) => void;
  onDraw: (e: React.MouseEvent | React.TouchEvent) => void;
  onStopDrawing: () => void;
  onClearCanvas: () => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDownloadSignature: () => void;
  onSaveAndPlace: () => void;
  onInitializeCanvas?: () => void;
  onRemoveBackground: () => void;
  onCancelBackgroundRemoval: () => void;
}

// Get stage info for display
const getStageInfo = (stage: ProcessingStage) => {
  switch (stage) {
    case 'downloading':
      return {
        icon: CloudDownload,
        title: 'Mengunduh model AI...',
        subtitle: 'Proses ini hanya terjadi sekali (~44MB)',
        note: 'Model akan tersimpan di browser sampai cache dihapus',
      };
    case 'processing':
      return {
        icon: Cpu,
        title: 'Memproses gambar...',
        subtitle: 'AI sedang menghapus background',
        note: 'Semua proses berjalan di perangkatmu',
      };
    case 'encoding':
      return {
        icon: ImageDown,
        title: 'Menyimpan hasil...',
        subtitle: 'Hampir selesai',
        note: null,
      };
    default:
      return {
        icon: Sparkles,
        title: 'Mempersiapkan...',
        subtitle: 'Mohon tunggu',
        note: null,
      };
  }
};

// Processing overlay component with animated effects
const ProcessingOverlay: React.FC<{
  progress: number;
  stage: ProcessingStage;
  onCancel: () => void;
}> = ({ progress, stage, onCancel }) => {
  const stageInfo = getStageInfo(stage);
  const StageIcon = stageInfo.icon;

  return (
    <div className="absolute inset-0 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm flex flex-col items-center justify-center z-20 rounded-md">
      {/* Animated magic circle */}
      <div className="relative w-24 h-24 mb-4">
        {/* Outer rotating ring */}
        <svg
          className="absolute inset-0 w-full h-full animate-spin"
          style={{ animationDuration: '3s' }}
          viewBox="0 0 100 100"
        >
          <defs>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="50%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="url(#gradient1)"
            strokeWidth="2"
            strokeDasharray="70 200"
            strokeLinecap="round"
          />
        </svg>

        {/* Inner counter-rotating ring */}
        <svg
          className="absolute inset-2 w-20 h-20 animate-spin"
          style={{ animationDuration: '2s', animationDirection: 'reverse' }}
          viewBox="0 0 100 100"
        >
          <defs>
            <linearGradient id="gradient2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="url(#gradient2)"
            strokeWidth="2"
            strokeDasharray="50 200"
            strokeLinecap="round"
          />
        </svg>

        {/* Center icon based on stage */}
        <div className="absolute inset-0 flex items-center justify-center">
          <StageIcon className="w-8 h-8 text-purple-500 animate-pulse" />
        </div>

        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full animate-ping"
            style={{
              background: ['#8b5cf6', '#ec4899', '#f59e0b', '#06b6d4', '#10b981', '#6366f1'][i],
              top: `${20 + Math.sin((i * Math.PI) / 3) * 35}%`,
              left: `${50 + Math.cos((i * Math.PI) / 3) * 35}%`,
              animationDelay: `${i * 0.2}s`,
              animationDuration: '1.5s',
            }}
          />
        ))}
      </div>

      {/* Progress text */}
      <div className="text-center">
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          {stageInfo.title}
        </p>
        <p className="text-2xl font-bold bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 bg-clip-text text-transparent">
          {progress}%
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 max-w-[200px]">
          {stageInfo.subtitle}
        </p>
        {stageInfo.note && (
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 max-w-[220px]">
            {stageInfo.note}
          </p>
        )}
      </div>

      {/* Cancel button */}
      <button
        onClick={onCancel}
        className="mt-4 flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
      >
        <X className="w-3 h-3" />
        Batalkan
      </button>
    </div>
  );
};

// Remove background button with eye-catching animation
const RemoveBackgroundButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
}> = ({ onClick, disabled }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="remove-bg-btn group relative overflow-hidden px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {/* Animated gradient background */}
      <span className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 opacity-90 group-hover:opacity-100 transition-opacity" />

      {/* Shimmer effect */}
      <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <span
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
          style={{ transitionDelay: '100ms' }}
        />
      </span>

      {/* Sparkle particles on hover */}
      <span className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <span
            key={i}
            className="sparkle absolute w-1 h-1 bg-white rounded-full opacity-0 group-hover:opacity-100"
            style={{
              left: `${20 + i * 15}%`,
              bottom: '30%',
            }}
          />
        ))}
      </span>

      {/* Button content */}
      <span className="relative flex items-center gap-1.5 text-white">
        <Sparkles
          className="w-3.5 h-3.5 group-hover:animate-spin"
          style={{ animationDuration: '2s' }}
        />
        Hapus Background
      </span>

      <style>{`
        .remove-bg-btn .sparkle {
          animation: none;
        }
        .remove-bg-btn:hover .sparkle {
          animation: sparkleFloat 0.8s ease-out forwards;
        }
        .remove-bg-btn:hover .sparkle:nth-child(1) { animation-delay: 0s; }
        .remove-bg-btn:hover .sparkle:nth-child(2) { animation-delay: 0.1s; }
        .remove-bg-btn:hover .sparkle:nth-child(3) { animation-delay: 0.05s; }
        .remove-bg-btn:hover .sparkle:nth-child(4) { animation-delay: 0.15s; }
        .remove-bg-btn:hover .sparkle:nth-child(5) { animation-delay: 0.08s; }

        @keyframes sparkleFloat {
          0% {
            transform: translateY(0) scale(1);
            opacity: 0;
          }
          30% {
            opacity: 1;
          }
          100% {
            transform: translateY(-20px) scale(0);
            opacity: 0;
          }
        }
      `}</style>
    </button>
  );
};

export const CreateEditModal: React.FC<CreateEditModalProps> = ({
  isOpen,
  onClose,
  modalMode,
  editingItemId,
  signaturePadRef,
  fileInputRef,
  isCanvasEmpty,
  hasUploadedImage,
  hasRemovedBackground,
  isRemovingBackground,
  backgroundRemovalProgress,
  backgroundRemovalStage,
  onStartDrawing,
  onDraw,
  onStopDrawing,
  onClearCanvas,
  onImageUpload,
  onDownloadSignature,
  onSaveAndPlace,
  onInitializeCanvas,
  onRemoveBackground,
  onCancelBackgroundRemoval,
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

            {/* Processing overlay */}
            {isRemovingBackground && (
              <ProcessingOverlay
                progress={backgroundRemovalProgress}
                stage={backgroundRemovalStage}
                onCancel={onCancelBackgroundRemoval}
              />
            )}

            {!isCanvasEmpty && !isRemovingBackground && (
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

          {/* Remove Background Button - shown when image is uploaded and not yet processed */}
          {hasUploadedImage && !isCanvasEmpty && !isRemovingBackground && !hasRemovedBackground && (
            <div className="w-full flex justify-center">
              <RemoveBackgroundButton onClick={onRemoveBackground} />
            </div>
          )}

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
              disabled={isRemovingBackground}
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
                disabled={isRemovingBackground}
              >
                <Download className="w-3 h-3 mr-1.5" /> Simpan File Tanda Tangan
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={onSaveAndPlace}
              className="h-8 px-4 text-xs"
              disabled={isRemovingBackground}
            >
              {editingItemId ? 'Simpan Perubahan' : 'Pasang'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
