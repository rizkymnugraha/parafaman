import React, { useState, useCallback, useEffect } from 'react';
import { Crop, Download, RotateCcw, Loader2, FileText } from 'lucide-react';
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
  pageWidth: number;
  pageHeight: number;
}

export const CropPage: React.FC = () => {
  const [file, setFile] = useState<LoadedFile | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [margins, setMargins] = useState({ top: 0, right: 0, bottom: 0, left: 0 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const baseFilename = file ? file.filename.replace(/\.pdf$/i, '') : 'document';

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const dataUrl = await renderPageToImage(file.doc, 1, 1);
        if (!cancelled) setPreview(dataUrl);
      } catch (err) {
        console.error(err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [file]);

  const update = (key: keyof typeof margins, max: number) => (v: number) => {
    const clamped = Math.max(0, Math.min(max, v || 0));
    setMargins((prev) => ({ ...prev, [key]: clamped }));
  };

  const handleApply = useCallback(async () => {
    if (!file) return;
    const newWidth = file.pageWidth - margins.left - margins.right;
    const newHeight = file.pageHeight - margins.top - margins.bottom;
    if (newWidth <= 0 || newHeight <= 0) {
      setError('Margin terlalu besar — tidak ada area yang tersisa.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const doc = await PDFLib.PDFDocument.load(file.arrayBuffer.slice(0));
      doc.getPages().forEach((page) => {
        const { width, height } = page.getSize();
        const pageNewWidth = Math.max(1, width - margins.left - margins.right);
        const pageNewHeight = Math.max(1, height - margins.top - margins.bottom);
        // PDF coords: origin bottom-left. Crop box trims from the edges.
        page.setCropBox(
          margins.left,
          margins.bottom,
          pageNewWidth,
          pageNewHeight
        );
        page.setMediaBox(
          margins.left,
          margins.bottom,
          pageNewWidth,
          pageNewHeight
        );
      });
      const bytes = await doc.save();
      const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
      downloadBlob(blob, `${baseFilename}_cropped.pdf`);
    } catch (err) {
      console.error(err);
      setError('Gagal melakukan crop.');
    } finally {
      setSaving(false);
    }
  }, [file, margins, baseFilename]);

  if (!file) {
    return (
      <ToolPageShell
        title="Crop PDF"
        description="Potong margin halaman PDF."
        icon={<Crop className="w-6 h-6" />}
      >
        <FilePicker
          title="Buka Dokumen PDF"
          subtitle="Klik atau seret file PDF ke sini"
          onSuccess={async ({ arrayBuffer, doc, numPages, filename }) => {
            const page = await doc.getPage(1);
            const viewport = page.getViewport({ scale: 1 });
            setFile({
              arrayBuffer,
              doc,
              numPages,
              filename,
              pageWidth: viewport.width,
              pageHeight: viewport.height,
            });
          }}
        />
      </ToolPageShell>
    );
  }

  const pageWPct = ((file.pageWidth - margins.left - margins.right) / file.pageWidth) * 100;
  const pageHPct = ((file.pageHeight - margins.top - margins.bottom) / file.pageHeight) * 100;
  const leftPct = (margins.left / file.pageWidth) * 100;
  const topPct = (margins.top / file.pageHeight) * 100;

  return (
    <ToolPageShell
      title="Crop PDF"
      description={`${file.filename} · ${file.numPages} halaman · ${Math.round(file.pageWidth)} × ${Math.round(file.pageHeight)} pt`}
      icon={<Crop className="w-6 h-6" />}
    >
      <div className="w-full max-w-3xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Preview */}
          <Card className="p-4">
            <div className="text-xs font-medium text-zinc-500 mb-2 uppercase tracking-wide">
              Preview halaman 1
            </div>
            <div className="relative aspect-[3/4] bg-zinc-100 dark:bg-zinc-800 rounded overflow-hidden flex items-center justify-center">
              {preview ? (
                <>
                  <img
                    src={preview}
                    alt="Preview"
                    className="max-w-full max-h-full object-contain"
                  />
                  {/* Crop overlay */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 bg-black/40" />
                    <div
                      className="absolute border-2 border-brand-500 bg-transparent"
                      style={{
                        left: `${leftPct}%`,
                        top: `${topPct}%`,
                        width: `${pageWPct}%`,
                        height: `${pageHPct}%`,
                        boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)',
                      }}
                    />
                  </div>
                </>
              ) : (
                <FileText className="w-8 h-8 text-zinc-400 animate-pulse" />
              )}
            </div>
          </Card>

          {/* Margin inputs */}
          <Card className="p-5 space-y-3">
            <div className="text-xs font-medium text-zinc-500 mb-1 uppercase tracking-wide">
              Margin (points)
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium block mb-1">Atas</label>
                <input
                  type="number"
                  value={margins.top}
                  onChange={(e) => update('top', file.pageHeight - margins.bottom - 1)(parseInt(e.target.value))}
                  min={0}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Bawah</label>
                <input
                  type="number"
                  value={margins.bottom}
                  onChange={(e) => update('bottom', file.pageHeight - margins.top - 1)(parseInt(e.target.value))}
                  min={0}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Kiri</label>
                <input
                  type="number"
                  value={margins.left}
                  onChange={(e) => update('left', file.pageWidth - margins.right - 1)(parseInt(e.target.value))}
                  min={0}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Kanan</label>
                <input
                  type="number"
                  value={margins.right}
                  onChange={(e) => update('right', file.pageWidth - margins.left - 1)(parseInt(e.target.value))}
                  min={0}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"
                />
              </div>
            </div>
            <div className="pt-2 border-t border-border text-xs text-zinc-500">
              Hasil: {Math.round(file.pageWidth - margins.left - margins.right)} ×{' '}
              {Math.round(file.pageHeight - margins.top - margins.bottom)} pt
            </div>
            <button
              onClick={() => setMargins({ top: 0, right: 0, bottom: 0, left: 0 })}
              className="text-xs text-brand-600 dark:text-brand-400 hover:underline"
            >
              Reset margin
            </button>
          </Card>
        </div>

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
          <Button onClick={handleApply} disabled={saving} className="flex-1">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Crop & unduh
          </Button>
        </div>
      </div>
    </ToolPageShell>
  );
};
