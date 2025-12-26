import React, { useState, useCallback } from 'react';
import { Lock, Eye, EyeOff, AlertCircle, AlertTriangle } from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui';

interface PasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (password: string) => Promise<void>;
  error?: string | null;
  isSubmitting?: boolean;
}

export const PasswordDialog: React.FC<PasswordDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  error,
  isSubmitting = false,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!password.trim()) return;
    await onSubmit(password);
  }, [password, onSubmit]);

  const handleClose = useCallback(() => {
    setPassword('');
    setShowPassword(false);
    onOpenChange(false);
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="mx-auto mb-2 p-3 rounded-full bg-brand-100 dark:bg-brand-900/30">
            <Lock className="w-6 h-6 text-brand-500" />
          </div>
          <DialogTitle className="text-center">PDF Dilindungi Password</DialogTitle>
          <DialogDescription className="text-center">
            Dokumen ini memerlukan password untuk dibuka. Silakan masukkan password PDF.
          </DialogDescription>
        </DialogHeader>

        {/* Warning about rasterization */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm">
          <div className="flex gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
            <div className="text-amber-800 dark:text-amber-200">
              <p className="font-medium">Perhatian</p>
              <p className="text-xs mt-1 text-amber-700 dark:text-amber-300">
                File PDF terproteksi akan dikonversi menjadi gambar saat disimpan. Teks tidak akan
                bisa dipilih/dicari dan kualitas mungkin sedikit berkurang.
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="w-full px-4 py-2.5 pr-10 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:border-zinc-700"
                autoFocus
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && (
              <p className="text-sm text-red-500 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                {error}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" disabled={!password.trim() || isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Membuka...
                </>
              ) : (
                'Buka PDF'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
