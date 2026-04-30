import React from 'react';
import { Button } from '@/components/ui';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog';

interface ReplaceFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReplaceOnly: () => void;
  onSaveAndReplace: () => void;
}

export const ReplaceFileModal: React.FC<ReplaceFileModalProps> = ({
  isOpen,
  onClose,
  onReplaceOnly,
  onSaveAndReplace,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pilih File Lain?</DialogTitle>
          <DialogDescription>
            Anda akan mengganti file PDF yang sedang diedit. Semua tanda tangan dan stempel yang
            sudah dipasang akan dihapus.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="sm:order-1">
            Batal
          </Button>
          <Button variant="secondary" onClick={onReplaceOnly} className="sm:order-2">
            Lanjut Pilih File
          </Button>
          <Button onClick={onSaveAndReplace} className="sm:order-3">
            Simpan dan Pilih
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
