import React, { useState, useCallback, useEffect } from 'react';
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog';

interface PasswordInputModalProps {
  isOpen: boolean;
  loading: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (password: string) => void;
}

export const PasswordInputModal: React.FC<PasswordInputModalProps> = ({
  isOpen,
  loading,
  error,
  onClose,
  onSubmit,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setPassword('');
      setShowPassword(false);
    }
  }, [isOpen]);

  const handleSubmit = useCallback(() => {
    if (password.trim()) {
      onSubmit(password);
    }
  }, [password, onSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && password.trim() && !loading) {
        handleSubmit();
      }
    },
    [password, loading, handleSubmit]
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            PDF Terproteksi
          </DialogTitle>
          <DialogDescription>
            File PDF ini dilindungi dengan password. Masukkan password untuk membuka file.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {error && (
            <div className="bg-red-500/10 text-red-600 dark:text-red-400 p-3 rounded-lg mb-4 text-sm flex items-center gap-2 animate-in slide-in-from-top-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
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
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={!password.trim() || loading}>
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
            ) : (
              'Buka'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
