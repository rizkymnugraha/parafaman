import React from 'react';
import { HelpCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';

interface InstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstructionsModal: React.FC<InstructionsModalProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 gap-0">
        <DialogHeader className="p-4 border-b bg-zinc-50 dark:bg-zinc-900">
          <DialogTitle className="font-bold flex items-center gap-2">
            <HelpCircle className="w-4 h-4" /> Panduan Penggunaan
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 text-sm space-y-4 bg-background">
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs shrink-0">
              1
            </div>
            <p>
              Gunakan tombol <b>(+)</b> pada bagian Tanda Tangan atau Stempel untuk menambahkan aset
              baru.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs shrink-0">
              2
            </div>
            <p>
              Klik tombol <b>Pasang</b> pada item di sidebar untuk menempelkannya ke halaman PDF.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs shrink-0">
              3
            </div>
            <p>
              <b>Geser (Drag)</b> item di area PDF untuk menyesuaikan posisi. Tarik sudut kanan
              bawah untuk <b>mengubah ukuran</b>.
            </p>
          </div>
        </div>

        <div className="p-4 bg-zinc-50 dark:bg-zinc-900 text-center text-xs text-zinc-500 rounded-b-lg">
          Klik di mana saja di luar kotak ini untuk menutup.
        </div>
      </DialogContent>
    </Dialog>
  );
};
