import React, { useState, useCallback } from 'react';
import { Lock, Download, RotateCcw, Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { FilePicker, ToolPageShell } from '@/features/_shared';
import { downloadBlob } from '@/utils';
import { PDFLib } from '@/hooks/usePdfLibraries';
import type { PDFDocument } from '@/types';

interface LoadedFile {
  arrayBuffer: ArrayBuffer;
  doc: PDFDocument;
  numPages: number;
  filename: string;
}

export const LockPage: React.FC = () => {
  const [file, setFile] = useState<LoadedFile | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const baseFilename = file ? file.filename.replace(/\.pdf$/i, '') : 'document';

  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const passwordTooShort = password.length > 0 && password.length < 4;

  const handleLock = useCallback(async () => {
    if (!file || !passwordsMatch || passwordTooShort) return;
    setSaving(true);
    setError(null);
    try {
      const doc = await PDFLib.PDFDocument.load(file.arrayBuffer.slice(0));
      await (doc as unknown as { encrypt: (opts: unknown) => Promise<void> }).encrypt({
        userPassword: password,
        ownerPassword: password,
        permissions: {
          printing: 'highResolution',
          modifying: false,
          copying: false,
          annotating: false,
          fillingForms: false,
          contentAccessibility: true,
          documentAssembly: false,
        },
      });
      const bytes = await doc.save();
      const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
      downloadBlob(blob, `${baseFilename}_locked.pdf`);
    } catch (err) {
      console.error(err);
      setError('Gagal mengunci PDF. Pastikan file tidak rusak atau sudah terenkripsi.');
    } finally {
      setSaving(false);
    }
  }, [file, password, passwordsMatch, passwordTooShort, baseFilename]);

  if (!file) {
    return (
      <ToolPageShell
        title="Kunci PDF"
        description="Tambahkan password untuk melindungi PDF Anda."
        icon={<Lock className="w-6 h-6" />}
      >
        <FilePicker
          title="Buka Dokumen PDF"
          subtitle="Klik atau seret file PDF ke sini"
          onSuccess={({ arrayBuffer, doc, numPages, filename }) => {
            setFile({ arrayBuffer, doc, numPages, filename });
            setPassword('');
            setConfirmPassword('');
          }}
        />
      </ToolPageShell>
    );
  }

  return (
    <ToolPageShell
      title="Kunci PDF"
      description={`${file.filename} · ${file.numPages} halaman`}
      icon={<Lock className="w-6 h-6" />}
    >
      <div className="w-full max-w-md space-y-4">
        <Card className="p-4 space-y-4">
          <div>
            <label className="text-sm font-medium block mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 4 karakter"
                className="w-full px-3 py-2 pr-10 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                autoFocus
                disabled={saving}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                disabled={saving}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">Konfirmasi password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ulangi password"
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              disabled={saving}
            />
            {confirmPassword.length > 0 && !passwordsMatch && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Password tidak cocok
              </p>
            )}
            {passwordTooShort && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Minimal 4 karakter
              </p>
            )}
          </div>
        </Card>

        {error && (
          <div className="bg-red-500/10 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => setFile(null)}
            disabled={saving}
            className="flex-1"
          >
            <RotateCcw className="w-4 h-4" /> Buka file lain
          </Button>
          <Button
            onClick={handleLock}
            disabled={!passwordsMatch || passwordTooShort || saving}
            className="flex-1"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Kunci & unduh
          </Button>
        </div>
      </div>
    </ToolPageShell>
  );
};
