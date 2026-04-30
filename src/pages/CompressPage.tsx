import React, { useState, useCallback } from 'react';
import { Minimize2, Download, RotateCcw, Loader2, Info } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { FilePicker, ToolPageShell } from '@/features/_shared';
import { downloadBlob } from '@/utils';
import { PDFLib, pdfjsLib } from '@/hooks/usePdfLibraries';
import type { PDFDocument } from '@/types';

interface LoadedFile {
  arrayBuffer: ArrayBuffer;
  doc: PDFDocument;
  numPages: number;
  filename: string;
  size: number;
}

type Quality = 'low' | 'medium' | 'high';

const QUALITY_CONFIG: Record<Quality, { scale: number; jpegQuality: number; label: string }> = {
  low: { scale: 1.0, jpegQuality: 0.5, label: 'Tinggi (file terkecil)' },
  medium: { scale: 1.5, jpegQuality: 0.7, label: 'Sedang (seimbang)' },
  high: { scale: 2.0, jpegQuality: 0.85, label: 'Ringan (kualitas terbaik)' },
};

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

export const CompressPage: React.FC = () => {
  const [file, setFile] = useState<LoadedFile | null>(null);
  const [quality, setQuality] = useState<Quality>('medium');
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ blob: Blob; filename: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const baseFilename = file ? file.filename.replace(/\.pdf$/i, '') : 'document';

  const handleCompress = useCallback(async () => {
    if (!file) return;
    setSaving(true);
    setError(null);
    setResult(null);
    setProgress(0);

    try {
      const config = QUALITY_CONFIG[quality];
      const newDoc = await PDFLib.PDFDocument.create();
      const pdfJsDoc = await pdfjsLib.getDocument({ data: file.arrayBuffer.slice(0) }).promise;

      for (let i = 1; i <= file.numPages; i++) {
        const page = await pdfJsDoc.getPage(i);
        const viewport = page.getViewport({ scale: config.scale });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas context unavailable');

        // White background so transparent areas don't go black on JPEG
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({ canvas, canvasContext: ctx, viewport }).promise;

        const jpegDataUrl = canvas.toDataURL('image/jpeg', config.jpegQuality);
        const jpegImage = await newDoc.embedJpg(jpegDataUrl);

        const originalViewport = page.getViewport({ scale: 1 });
        const newPage = newDoc.addPage([originalViewport.width, originalViewport.height]);
        newPage.drawImage(jpegImage, {
          x: 0,
          y: 0,
          width: originalViewport.width,
          height: originalViewport.height,
        });

        setProgress(Math.round((i / file.numPages) * 100));
      }

      const bytes = await newDoc.save();
      const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
      setResult({ blob, filename: `${baseFilename}_compressed.pdf` });
    } catch (err) {
      console.error(err);
      setError('Gagal mengompres PDF.');
    } finally {
      setSaving(false);
    }
  }, [file, quality, baseFilename]);

  const handleDownload = useCallback(() => {
    if (result) downloadBlob(result.blob, result.filename);
  }, [result]);

  if (!file) {
    return (
      <ToolPageShell
        title="Kompres PDF"
        description="Kurangi ukuran file PDF Anda."
        icon={<Minimize2 className="w-6 h-6" />}
      >
        <FilePicker
          title="Buka Dokumen PDF"
          subtitle="Klik atau seret file PDF ke sini"
          onSuccess={({ arrayBuffer, doc, numPages, filename }) => {
            setFile({
              arrayBuffer,
              doc,
              numPages,
              filename,
              size: arrayBuffer.byteLength,
            });
            setResult(null);
          }}
        />
      </ToolPageShell>
    );
  }

  const compressedSize = result ? result.blob.size : null;
  const savings =
    compressedSize !== null
      ? Math.max(0, Math.round((1 - compressedSize / file.size) * 100))
      : null;

  return (
    <ToolPageShell
      title="Kompres PDF"
      description={`${file.filename} · ${file.numPages} halaman · ${formatBytes(file.size)}`}
      icon={<Minimize2 className="w-6 h-6" />}
    >
      <div className="w-full max-w-xl space-y-4">
        <Card className="p-4 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-900 dark:text-amber-200">
              <p className="font-medium mb-1">Catatan:</p>
              <p>
                Kompresi mengubah halaman menjadi gambar JPEG. Teks akan tetap terlihat namun tidak
                bisa dipilih atau dicari setelah dikompres.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 space-y-3">
          <div className="text-sm font-medium">Tingkat kompresi</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {(Object.keys(QUALITY_CONFIG) as Quality[]).map((q) => (
              <button
                key={q}
                onClick={() => setQuality(q)}
                className={`px-3 py-3 rounded-md text-sm font-medium transition-colors text-left ${
                  quality === q
                    ? 'bg-brand-500 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                {QUALITY_CONFIG[q].label}
              </button>
            ))}
          </div>
        </Card>

        {error && (
          <div className="bg-red-500/10 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {result && (
          <Card className="p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <div className="text-sm space-y-1">
              <div className="font-medium text-green-900 dark:text-green-200">
                Kompresi selesai!
              </div>
              <div className="text-green-800 dark:text-green-300">
                {formatBytes(file.size)} → {formatBytes(compressedSize!)}
                {savings! > 0 && ` (hemat ${savings}%)`}
              </div>
            </div>
          </Card>
        )}

        {saving && (
          <Card className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Mengompres...</span>
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
            onClick={() => {
              setFile(null);
              setResult(null);
            }}
            disabled={saving}
            className="flex-1"
          >
            <RotateCcw className="w-4 h-4" />
            Buka file lain
          </Button>
          {result ? (
            <Button onClick={handleDownload} className="flex-1">
              <Download className="w-4 h-4" />
              Unduh hasil
            </Button>
          ) : (
            <Button onClick={handleCompress} disabled={saving} className="flex-1">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Minimize2 className="w-4 h-4" />}
              Kompres
            </Button>
          )}
        </div>
      </div>
    </ToolPageShell>
  );
};
