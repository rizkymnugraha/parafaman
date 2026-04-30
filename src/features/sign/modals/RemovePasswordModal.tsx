import React from 'react';
import { LockOpen } from 'lucide-react';
import { Button } from '@/components/ui';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog';

interface RemovePasswordModalProps {
  isOpen: boolean;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const RemovePasswordModal: React.FC<RemovePasswordModalProps> = ({
  isOpen,
  loading = false,
  onClose,
  onConfirm,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LockOpen className="w-5 h-5 text-destructive" />
            Hapus Password?
          </DialogTitle>
          <DialogDescription>
            File PDF akan disimpan tanpa proteksi password. Siapa saja yang memiliki file ini akan
            dapat membukanya.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Batal
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin mr-2" />
            ) : null}
            Ya, Hapus Password
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
