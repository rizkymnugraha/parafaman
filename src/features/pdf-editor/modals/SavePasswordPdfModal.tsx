import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog';

interface SavePasswordPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export const SavePasswordPdfModal: React.FC<SavePasswordPdfModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="mx-auto mb-2 p-3 rounded-full bg-amber-100 dark:bg-amber-900/30">
            <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-500" />
          </div>
          <DialogTitle className="text-center">Simpan PDF Terproteksi?</DialogTitle>
          <DialogDescription className="text-center">
            Karena PDF ini dilindungi password, file akan disimpan dengan konversi berikut:
          </DialogDescription>
        </DialogHeader>

        <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-3 text-sm space-y-2">
          <ul className="list-disc list-inside text-zinc-600 dark:text-zinc-400 space-y-1 text-xs">
            <li>Halaman dikonversi menjadi gambar (rasterized)</li>
            <li>Teks tidak dapat dipilih atau dicari</li>
            <li>Kualitas visual mungkin sedikit berkurang</li>
            <li>Password akan tetap dipertahankan</li>
          </ul>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Batal
          </Button>
          <Button onClick={onConfirm} disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Menyimpan...
              </>
            ) : (
              'Ya, Simpan'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
