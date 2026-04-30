import React, { useState, useCallback } from 'react';
import { FolderOpen, AlertCircle, Shield } from 'lucide-react';
import { Card } from '@/components/ui';
import { PasswordInputModal } from '@/components/PasswordInputModal';
import { useOpenPdf } from '@/hooks';
import type { PDFDocument } from '@/types';

interface FilePickerProps {
  title: string;
  subtitle?: string;
  accept?: string;
  multiple?: boolean;
  onSuccess?: (file: {
    arrayBuffer: ArrayBuffer;
    doc: PDFDocument;
    numPages: number;
    password?: string;
    filename: string;
  }) => void;
  onMultipleSuccess?: (files: File[]) => void;
}

/**
 * Shared drag-and-drop PDF file picker. Handles encrypted PDFs via password modal.
 * For tools that take non-PDF input (e.g. images), pass `accept` and use `onMultipleSuccess`.
 */
export const FilePicker: React.FC<FilePickerProps> = ({
  title,
  subtitle = 'Klik atau seret file ke sini',
  accept = 'application/pdf',
  multiple = false,
  onSuccess,
  onMultipleSuccess,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const isPdfMode = accept === 'application/pdf' && !multiple;

  const {
    loading,
    error,
    isPasswordModalOpen,
    passwordError,
    passwordLoading,
    openFile,
    handlePasswordSubmit,
    handlePasswordModalClose,
  } = useOpenPdf({
    onSuccess: (arrayBuffer, doc, numPages, password, filename) => {
      onSuccess?.({ arrayBuffer, doc, numPages, password, filename: filename || 'document.pdf' });
    },
  });

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      if (multiple && onMultipleSuccess) {
        onMultipleSuccess(Array.from(files));
        return;
      }

      if (isPdfMode) {
        await openFile(files[0]);
      }
    },
    [multiple, onMultipleSuccess, isPdfMode, openFile]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  return (
    <>
      <div className="w-full max-w-sm space-y-4 rounded-3xl mx-auto">
        <label
          className="cursor-pointer block group"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Card
            className={`w-full p-8 text-center border-dashed border-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${
              isDragging
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 scale-[1.02] shadow-lg'
                : 'hover:border-brand-500/50'
            }`}
          >
            {error && (
              <div className="bg-red-500/10 text-red-600 dark:text-red-400 p-3 rounded-lg mb-4 text-sm flex items-center gap-2 animate-in slide-in-from-top-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}
            <div className="flex flex-col items-center gap-3">
              <div
                className={`p-4 rounded-full transition-colors duration-300 ${
                  isDragging
                    ? 'bg-brand-100 dark:bg-brand-900/30'
                    : 'bg-zinc-100 dark:bg-zinc-800 group-hover:bg-brand-100 dark:group-hover:bg-brand-900/30'
                }`}
              >
                {loading ? (
                  <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FolderOpen
                    className={`w-8 h-8 transition-colors duration-300 ${
                      isDragging ? 'text-brand-500' : 'text-zinc-400 group-hover:text-brand-500'
                    }`}
                  />
                )}
              </div>
              <div className="space-y-1">
                <span
                  className={`text-base font-semibold transition-colors block ${
                    isDragging ? 'text-brand-500' : 'group-hover:text-brand-500'
                  }`}
                >
                  {loading ? 'Memuat...' : isDragging ? 'Lepaskan di sini' : title}
                </span>
                <span className="text-sm text-zinc-500 dark:text-zinc-400 hidden md:block">
                  {subtitle}
                </span>
              </div>
            </div>
            <input
              type="file"
              accept={accept}
              multiple={multiple}
              className="hidden"
              onChange={handleFileInput}
              disabled={loading}
            />
          </Card>
        </label>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-brand-700 dark:text-brand-400 font-semibold text-sm">
            <Shield className="w-4 h-4" />
            <span>Jaminan Keamanan & Privasi</span>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
            Dokumen Anda diproses <b>100% secara offline</b> di browser perangkat Anda. Tidak ada
            data yang diunggah ke server.
          </p>
        </div>
      </div>

      <PasswordInputModal
        isOpen={isPasswordModalOpen}
        loading={passwordLoading}
        error={passwordError}
        onClose={handlePasswordModalClose}
        onSubmit={handlePasswordSubmit}
      />
    </>
  );
};
