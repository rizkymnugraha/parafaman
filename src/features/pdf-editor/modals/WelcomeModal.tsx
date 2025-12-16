import React from 'react';
import { Heart, Github } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/Dialog';
import { Button } from '@/components/ui';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowTour?: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  isOpen,
  onClose,
  onShowTour: _onShowTour,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 gap-0" showCloseButton>
        <DialogHeader className="p-4 border-b bg-zinc-50 dark:bg-zinc-900">
          <p className="text-sm font-semibold text-brand-500 dark:text-brand-400 uppercase tracking-wide">
            Halo, Selamat Datang!
          </p>
        </DialogHeader>
        <div className="p-4 text-sm space-y-4 bg-background">
          {/* Description */}
          <h2 className="text-2xl font-bold">
            ParafAman - Tanda Tangan Digital PDF yang Aman & Privat
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Tambahkan tanda tangan dan/atau stempel pada dokumen PDF langsung dari browser. Semua
            proses berjalan offline di perangkatmu, jadi dokumenmu tetap aman dan privat.
          </p>

          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Proyek ini gratis dan open source. Kalau kamu suka, boleh banget kasih bintang di GitHub
            atau dukung lewat donasi.
          </p>

          <p>Terima kasih sudah menggunakan ParafAman!</p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              className="flex-1 gap-2 bg-neutral-900 hover:bg-neutral-700 text-white"
              onClick={() => window.open('https://github.com/rizkraf/parafaman', '_blank')}
            >
              <Github className="w-4 h-4" />
              Lihat & dukung di GitHub
            </Button>
            <Button
              className="gap-2 bg-orange-300 hover:bg-orange-400 text-black border border-black"
              onClick={() => window.open('https://saweria.co/rizkymeiputra', '_blank')}
            >
              <Heart className="w-4 h-4" />
              Donasi via Saweria
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
