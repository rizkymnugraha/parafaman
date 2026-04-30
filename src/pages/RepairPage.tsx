import React, { useState, useCallback } from 'react';
import { Wrench, Download, RotateCcw, Loader2, Info } from 'lucide-react';
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
  size: number;
}

type Strategy = 'rebuild' | 'rasterize';

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

export const RepairPage: React.FC = () => {
  const [file, setFile] = useState<LoadedFile | null>(null);
  const [strategy, setStrategy] = useState<Strategy>('rebuild');
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ blob: Blob; filename: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const baseFilename = file ? file.filename.replace(/\.pdf$/i, '') : 'document';

  const handleRepair = useCallback(async () => {
    if (!file) return;
    setSaving(true);
    setError(null);
    setResult(null);
    setProgress(0);
    try {
      let blob: Blob;
      if (strategy === 'rebuild') {
        // Light repair: load with lenient parser, save with clean output
        const doc = await PDFLib.PDFDocument.load(file.arrayBuffer.slice(0), {
          ignoreEncryption: true,
          throwOnInvalidObject: false,
        });
        const bytes = await doc.save({ useObjectStreams: false });
        blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
        setProgress(100);
      } else {
        // Aggressive repair: rasterize every page via pdf.js, rebuild from images
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
        blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
      }
      setResult({ blob, filename: `${baseFilename}_repaired.pdf` });
    } catch (err) {
      console.error(err);
      setError(
        'Gagal memperbaiki PDF. Coba strategi "Rasterize ulang" untuk file yang sangat rusak.'
      );
    } finally {
      setSaving(false);
    }
  }, [file, strategy, baseFilename]);

  const handleDownload = useCallback(() => {
    if (result) downloadBlob(result.blob, result.filename);
  }, [result]);

  if (!file) {
    return (
      <ToolPageShell
        title="Perbaiki PDF"
        description="Coba perbaiki file PDF yang rusak atau tidak bisa dibuka di aplikasi lain."
        icon={<Wrench className="w-6 h-6" />}
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

  return (
    <ToolPageShell
      title="Perbaiki PDF"
      description={`${file.filename} · ${file.numPages} halaman · ${formatBytes(file.size)}`}
      icon={<Wrench className="w-6 h-6" />}
    >
      <div className="w-full max-w-xl space-y-4">
        <Card className="p-5 space-y-3">
          <div className="text-sm font-medium">Strategi perbaikan</div>
          <div className="space-y-2">
            <button
              onClick={() => setStrategy('rebuild')}
              className={`w-full text-left p-3 rounded-md border-2 transition-colors ${
                strategy === 'rebuild'
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                  : 'border-zinc-200 dark:border-zinc-700 hover:border-brand-500/50'
              }`}
            >
              <div className="font-medium text-sm">Rebuild ringan (disarankan)</div>
              <div className="text-xs text-zinc-500 mt-1">
                Buka dengan parser yang toleran, simpan ulang. Tetap menjaga teks dan kualitas.
              </div>
            </button>
            <button
              onClick={() => setStrategy('rasterize')}
              className={`w-full text-left p-3 rounded-md border-2 transition-colors ${
                strategy === 'rasterize'
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                  : 'border-zinc-200 dark:border-zinc-700 hover:border-brand-500/50'
              }`}
            >
              <div className="font-medium text-sm">Rasterize ulang</div>
              <div className="text-xs text-zinc-500 mt-1">
                Render setiap halaman jadi gambar lalu rebuild PDF. Untuk file yang sangat rusak.
                Teks tidak bisa dipilih setelahnya.
              </div>
            </button>
          </div>
        </Card>

        <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900 dark:text-blue-200">
              Jika file Anda berhasil dibuka di sini, kemungkinan besar tinggal disimpan ulang dengan
              "Rebuild ringan" untuk membersihkan file yang rusak namun masih bisa dibaca.
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
                <span>Memperbaiki...</span>
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

        {result && (
          <Card className="p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <div className="text-sm space-y-1">
              <div className="font-medium text-green-900 dark:text-green-200">
                Perbaikan selesai!
              </div>
              <div className="text-green-800 dark:text-green-300">
                {formatBytes(file.size)} → {formatBytes(result.blob.size)}
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
            <RotateCcw className="w-4 h-4" /> Buka file lain
          </Button>
          {result ? (
            <Button onClick={handleDownload} className="flex-1">
              <Download className="w-4 h-4" />
              Unduh hasil
            </Button>
          ) : (
            <Button onClick={handleRepair} disabled={saving} className="flex-1">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wrench className="w-4 h-4" />}
              Perbaiki
            </Button>
          )}
        </div>
      </div>
    </ToolPageShell>
  );
};
