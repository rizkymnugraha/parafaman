import React, { useState, useCallback } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog';

interface PasswordModalProps {
  isOpen: boolean;
  loading: boolean;
  onClose: () => void;
  onConfirm: (password: string) => void;
}

export const PasswordModal: React.FC<PasswordModalProps> = ({
  isOpen,
  loading,
  onClose,
  onConfirm,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleConfirm = useCallback(() => {
    if (password.trim()) {
      onConfirm(password);
    }
  }, [password, onConfirm]);

  const handleClose = useCallback(() => {
    setPassword('');
    setShowPassword(false);
    onClose();
  }, [onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && password.trim()) {
        handleConfirm();
      }
    },
    [password, handleConfirm]
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Proteksi Password
          </DialogTitle>
          <DialogDescription>
            Masukkan password untuk melindungi file PDF Anda. Password ini akan diperlukan untuk
            membuka file.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Masukkan password"
              className="w-full px-3 py-2 pr-10 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              autoFocus
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              disabled={loading}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Pastikan Anda mengingat password ini. File tidak dapat dibuka tanpa password yang benar.
          </p>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Batal
          </Button>
          <Button onClick={handleConfirm} disabled={!password.trim() || loading}>
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
