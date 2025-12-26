import { useState, useCallback, useRef } from 'react';
import { loadPdfFile, PasswordRequiredError, IncorrectPasswordError } from '@/utils';
import type { PDFDocument } from '@/types';

interface UseOpenPdfOptions {
  onSuccess?: (
    arrayBuffer: ArrayBuffer,
    doc: PDFDocument,
    numPages: number,
    password?: string,
    filename?: string
  ) => void;
  onError?: (error: Error) => void;
}

interface UseOpenPdfReturn {
  // State
  loading: boolean;
  error: string | null;
  isPasswordModalOpen: boolean;
  passwordError: string | null;
  passwordLoading: boolean;

  // Actions
  openFile: (file: File) => Promise<void>;
  handlePasswordSubmit: (password: string) => void;
  handlePasswordModalClose: () => void;
  resetError: () => void;
}

export const useOpenPdf = (options: UseOpenPdfOptions = {}): UseOpenPdfReturn => {
  const { onSuccess, onError } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const pendingFileRef = useRef<File | null>(null);

  const processFile = useCallback(
    async (file: File, password?: string) => {
      if (file.type !== 'application/pdf') {
        setError('File harus berformat PDF.');
        onError?.(new Error('File harus berformat PDF.'));
        return;
      }

      // Use appropriate loading state
      if (password) {
        setPasswordLoading(true);
        setPasswordError(null);
      } else {
        setLoading(true);
        setError(null);
      }

      try {
        const { arrayBuffer, doc, numPages } = await loadPdfFile(file, { password });
        setIsPasswordModalOpen(false);
        pendingFileRef.current = null;
        onSuccess?.(arrayBuffer, doc, numPages, password, file.name);
      } catch (err) {
        if (err instanceof PasswordRequiredError) {
          // PDF is encrypted, show password modal
          pendingFileRef.current = file;
          setIsPasswordModalOpen(true);
          setPasswordError(null);
        } else if (err instanceof IncorrectPasswordError) {
          // Wrong password entered
          setPasswordError(err.message);
        } else {
          // Other errors
          const errorMessage = err instanceof Error ? err.message : 'Gagal membaca file PDF.';
          if (password) {
            setPasswordError(errorMessage);
          } else {
            setError(errorMessage);
            onError?.(err instanceof Error ? err : new Error(errorMessage));
          }
        }
      } finally {
        setLoading(false);
        setPasswordLoading(false);
      }
    },
    [onSuccess, onError]
  );

  const openFile = useCallback(
    async (file: File) => {
      await processFile(file);
    },
    [processFile]
  );

  const handlePasswordSubmit = useCallback(
    (password: string) => {
      if (pendingFileRef.current) {
        processFile(pendingFileRef.current, password);
      }
    },
    [processFile]
  );

  const handlePasswordModalClose = useCallback(() => {
    setIsPasswordModalOpen(false);
    setPasswordError(null);
    pendingFileRef.current = null;
  }, []);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    isPasswordModalOpen,
    passwordError,
    passwordLoading,
    openFile,
    handlePasswordSubmit,
    handlePasswordModalClose,
    resetError,
  };
};
