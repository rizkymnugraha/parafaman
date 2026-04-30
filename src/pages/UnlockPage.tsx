import React, { useState, useCallback } from 'react';
import { Unlock, Download, RotateCcw, Loader2, Info, ShieldOff } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { FilePicker, ToolPageShell } from '@/features/_shared';
import { downloadBlob, renderPageToImage } from '@/utils';
import { PDFLib } from '@/hooks/usePdfLibraries';
import type { PDFDocument } from '@/types';

interface LoadedFile {
  arrayBuffer: ArrayBuffer;
  doc: PDFDocument;
  numPages: number;
  filename: string;
  wasEncrypted: boolean;
}

export const UnlockPage: React.FC = () => {
  const [file, setFile] = useState<LoadedFile | null>(null);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const baseFilename = file ? file.filename.replace(/\.pdf$/i, '') : 'document';

  const handleUnlock = useCallback(async () => {
    if (!file) return;
    setSaving(true);
    setError(null);
    setProgress(0);
    try {
      // pdf.js already decrypted the doc when it was opened with password.
      // Rebuild a fresh unencrypted PDF from rendered pages.
      const newDoc = await PDFLib.PDFDocument.create();
      for (let i = 1; i <= file.numPages; i++) {
        const dataUrl = await renderPageToImage(file.doc, i, 2);
        const png = await newDoc.embedPng(dataUrl);
        const page = await file.doc.getPage(i);
        const viewport = page.getViewport({ scale: 1 });
        const newPage = newDoc.addPage([viewport.width, viewport.height]);
        newPage.drawImage(png, {
          x: 0,
          y: 0,
          width: viewport.width,
          height: viewport.height,
        });
        setProgress(Math.round((i / file.numPages) * 100));
      }
      const bytes = await newDoc.save();
      const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
      downloadBlob(blob, `${baseFilename}_unlocked.pdf`);
    } catch (err) {
      console.error(err);
      setError('Gagal membuka kunci PDF.');
    } finally {
      setSaving(false);
    }
  }, [file, baseFilename]);

  if (!file) {
    return (
      <ToolPageShell
        title="Buka Kunci PDF"
        description="Hapus password dari PDF yang dilindungi."
        icon={<Unlock className="w-6 h-6" />}
      >
        <FilePicker
          title="Buka Dokumen PDF"
          subtitle="Klik atau seret file PDF ke sini"
          onSuccess={({ arrayBuffer, doc, numPages, password, filename }) => {
            setFile({
              arrayBuffer,
              doc,
              numPages,
              filename,
              wasEncrypted: !!password,
            });
          }}
        />
      </ToolPageShell>
    );
  }

  if (!file.wasEncrypted) {
    return (
      <ToolPageShell
        title="Buka Kunci PDF"
        description={file.filename}
        icon={<Unlock className="w-6 h-6" />}
      >
        <Card className="p-6 max-w-xl text-center">
          <ShieldOff className="w-10 h-10 mx-auto mb-3 text-zinc-400" />
          <h3 className="font-semibold mb-1">PDF ini tidak terkunci</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
            File ini tidak dilindungi password, jadi tidak perlu dibuka kuncinya.
          </p>
          <Button variant="outline" onClick={() => setFile(null)}>
            <RotateCcw className="w-4 h-4" /> Buka file lain
          </Button>
        </Card>
      </ToolPageShell>
    );
  }

  return (
    <ToolPageShell
      title="Buka Kunci PDF"
      description={`${file.filename} · ${file.numPages} halaman`}
      icon={<Unlock className="w-6 h-6" />}
    >
      <div className="w-full max-w-xl space-y-4">
        <Card className="p-4 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-900 dark:text-amber-200">
              <p className="font-medium mb-1">Catatan teknis:</p>
              <p>
                Halaman akan dirender ulang sebagai gambar untuk menghapus enkripsi. Teks tetap
                terlihat namun tidak bisa dipilih atau dicari setelahnya.
              </p>
            </div>
          </div>
        </Card>

        {error && (
          <div className="bg-red-500/10 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {saving && (
          <Card className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Memproses...</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </Card>
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
          <Button onClick={handleUnlock} disabled={saving} className="flex-1">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Buka kunci & unduh
          </Button>
        </div>
      </div>
    </ToolPageShell>
  );
};
