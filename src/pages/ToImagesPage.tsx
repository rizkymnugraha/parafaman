import React, { useState, useCallback } from 'react';
import { ImageDown, Download, RotateCcw, Loader2, FileText } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { FilePicker, ToolPageShell, usePageThumbnails } from '@/features/_shared';
import { downloadBlob } from '@/utils';
import { pdfjsLib } from '@/hooks/usePdfLibraries';
import type { PDFDocument } from '@/types';

interface LoadedFile {
  arrayBuffer: ArrayBuffer;
  doc: PDFDocument;
  numPages: number;
  filename: string;
}

type ImageFormat = 'png' | 'jpeg';

const renderPageBlob = async (
  doc: any,
  pageNum: number,
  format: ImageFormat,
  scale: number,
  quality: number
): Promise<Blob> => {
  const page = await doc.getPage(pageNum);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');
  if (format === 'jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  await page.render({ canvas, canvasContext: ctx, viewport }).promise;
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))),
      format === 'png' ? 'image/png' : 'image/jpeg',
      format === 'jpeg' ? quality : undefined
    );
  });
};

export const ToImagesPage: React.FC = () => {
  const [file, setFile] = useState<LoadedFile | null>(null);
  const [format, setFormat] = useState<ImageFormat>('png');
  const [scale, setScale] = useState(2);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);

  const { thumbnails } = usePageThumbnails(file?.doc ?? null, file?.numPages ?? 0);

  const baseFilename = file ? file.filename.replace(/\.pdf$/i, '') : 'document';

  const downloadAll = useCallback(async () => {
    if (!file) return;
    setSaving(true);
    setError(null);
    setProgress({ current: 0, total: file.numPages });
    try {
      const pdfJsDoc = await pdfjsLib.getDocument({ data: file.arrayBuffer.slice(0) }).promise;
      for (let i = 1; i <= file.numPages; i++) {
        const blob = await renderPageBlob(pdfJsDoc, i, format, scale, 0.85);
        const ext = format === 'png' ? 'png' : 'jpg';
        downloadBlob(blob, `${baseFilename}_page-${i}.${ext}`);
        setProgress({ current: i, total: file.numPages });
        await new Promise((r) => setTimeout(r, 150));
      }
    } catch (err) {
      console.error(err);
      setError('Gagal mengkonversi PDF ke gambar.');
    } finally {
      setSaving(false);
    }
  }, [file, format, scale, baseFilename]);

  const downloadSingle = useCallback(
    async (pageNum: number) => {
      if (!file) return;
      try {
        const pdfJsDoc = await pdfjsLib.getDocument({ data: file.arrayBuffer.slice(0) }).promise;
        const blob = await renderPageBlob(pdfJsDoc, pageNum, format, scale, 0.85);
        const ext = format === 'png' ? 'png' : 'jpg';
        downloadBlob(blob, `${baseFilename}_page-${pageNum}.${ext}`);
      } catch (err) {
        console.error(err);
        setError('Gagal mengkonversi halaman.');
      }
    },
    [file, format, scale, baseFilename]
  );

  if (!file) {
    return (
      <ToolPageShell
        title="PDF ke Gambar"
        description="Ekspor setiap halaman PDF menjadi gambar PNG atau JPG."
        icon={<ImageDown className="w-6 h-6" />}
      >
        <FilePicker
          title="Buka Dokumen PDF"
          subtitle="Klik atau seret file PDF ke sini"
          onSuccess={({ arrayBuffer, doc, numPages, filename }) => {
            setFile({ arrayBuffer, doc, numPages, filename });
          }}
        />
      </ToolPageShell>
    );
  }

  return (
    <ToolPageShell
      title="PDF ke Gambar"
      description={`${file.filename} · ${file.numPages} halaman`}
      icon={<ImageDown className="w-6 h-6" />}
    >
      <div className="w-full space-y-4">
        <Card className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium mb-2">Format</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setFormat('png')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    format === 'png'
                      ? 'bg-brand-500 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  PNG
                </button>
                <button
                  onClick={() => setFormat('jpeg')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    format === 'jpeg'
                      ? 'bg-brand-500 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  JPG
                </button>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium mb-2">Resolusi</div>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((s) => (
                  <button
                    key={s}
                    onClick={() => setScale(s)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      scale === s
                        ? 'bg-brand-500 text-white'
                        : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            File akan diunduh satu per satu. Browser mungkin meminta izin untuk mengunduh banyak
            file.
          </p>
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
                <span>Mengunduh halaman...</span>
                <span className="font-medium">
                  {progress.current} / {progress.total}
                </span>
              </div>
              <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-500 transition-all"
                  style={{
                    width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: file.numPages }, (_, i) => {
            const pageNum = i + 1;
            return (
              <Card key={pageNum} className="overflow-hidden p-0">
                <div className="aspect-[3/4] bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                  {thumbnails[i] ? (
                    <img
                      src={thumbnails[i] as string}
                      alt={`Halaman ${pageNum}`}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <FileText className="w-8 h-8 text-zinc-400 animate-pulse" />
                  )}
                </div>
                <button
                  onClick={() => downloadSingle(pageNum)}
                  disabled={saving}
                  className="w-full px-2 py-1.5 text-xs flex items-center justify-center gap-1 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-700 hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:text-brand-600 dark:hover:text-brand-400 transition-colors disabled:opacity-50"
                >
                  <Download className="w-3 h-3" />
                  Halaman {pageNum}
                </button>
              </Card>
            );
          })}
        </div>

        <div className="sticky bottom-4 flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center bg-background/80 backdrop-blur border border-border rounded-xl p-3 shadow-lg">
          <Button variant="outline" onClick={() => setFile(null)} disabled={saving}>
            <RotateCcw className="w-4 h-4" />
            Buka file lain
          </Button>
          <Button onClick={downloadAll} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Unduh semua ({file.numPages} file)
          </Button>
        </div>
      </div>
    </ToolPageShell>
  );
};
