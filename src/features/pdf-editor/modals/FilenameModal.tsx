import React, { useState, useCallback, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog';

interface FilenameModalProps {
  isOpen: boolean;
  loading: boolean;
  defaultFilename?: string;
  onClose: () => void;
  onConfirm: (filename: string) => void;
}

export const FilenameModal: React.FC<FilenameModalProps> = ({
  isOpen,
  loading,
  defaultFilename = '',
  onClose,
  onConfirm,
}) => {
  const [filename, setFilename] = useState(defaultFilename);

  // Update filename when defaultFilename changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setFilename(defaultFilename);
    }
  }, [isOpen, defaultFilename]);

  const handleConfirm = useCallback(() => {
    const trimmedFilename = filename.trim() || 'document';
    onConfirm(trimmedFilename);
  }, [filename, onConfirm]);

  const handleClose = useCallback(() => {
    setFilename(defaultFilename);
    onClose();
  }, [defaultFilename, onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleConfirm();
      }
    },
    [handleConfirm]
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Simpan PDF
          </DialogTitle>
          <DialogDescription>Masukkan nama file untuk dokumen PDF Anda.</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">ParafAman_</span>
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="nama file"
              className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              autoFocus
              disabled={loading}
            />
            <span className="text-sm text-muted-foreground">.pdf</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Batal
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
            ) : (
              'Simpan'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
