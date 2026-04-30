import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Github, Sparkles, ArrowRight } from 'lucide-react';
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
  const navigate = useNavigate();

  const handleViewFeatures = () => {
    onClose();
    navigate('/whats-new');
  };

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
          <h2 className="text-2xl font-bold">ParafAman — Alat PDF Lengkap yang Aman & Privat</h2>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Tanda tangan, pisah, gabung, kompres, watermark, kunci dengan password, dan banyak lagi
            — semuanya berjalan langsung di browser kamu. Dokumen tetap aman dan privat, tidak
            pernah dikirim ke server.
          </p>

          {/* What's New CTA */}
          <button
            onClick={handleViewFeatures}
            className="w-full text-left p-3 rounded-lg bg-gradient-to-br from-brand-500/10 via-brand-400/5 to-transparent border border-brand-500/30 hover:border-brand-500/60 hover:shadow-md transition-all duration-300 cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-brand-500/15 text-brand-600 dark:text-brand-400 shrink-0 group-hover:scale-110 transition-transform">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm">15 fitur baru baru saja dirilis</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-brand-500 text-white">
                    Baru
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Lihat semua yang bisa dilakukan ParafAman
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-brand-500 dark:text-brand-400 shrink-0 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Proyek ini gratis dan open source. Kalau kamu suka, boleh banget kasih bintang di GitHub
            atau dukung lewat donasi.
          </p>

          <p>Terima kasih sudah menggunakan ParafAman!</p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              className="flex-1 gap-2 bg-neutral-900 hover:bg-neutral-700 text-white"
              onClick={() => window.open('https://github.com/rizkymnugraha/parafaman', '_blank')}
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
