import React, { useState, useCallback } from 'react';
import { Scissors, Download, RotateCcw, FileText, Loader2 } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { FilePicker, ToolPageShell } from '@/features/_shared';
import { usePageThumbnails } from '@/features/_shared';
import { downloadBlob } from '@/utils';
import { PDFLib } from '@/hooks/usePdfLibraries';
import type { PDFDocument } from '@/types';

interface LoadedFile {
  arrayBuffer: ArrayBuffer;
  doc: PDFDocument;
  numPages: number;
  filename: string;
}

type SplitMode = 'extract' | 'individual';

export const SplitPage: React.FC = () => {
  const [file, setFile] = useState<LoadedFile | null>(null);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [mode, setMode] = useState<SplitMode>('extract');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { thumbnails, loading: thumbsLoading } = usePageThumbnails(
    file?.doc ?? null,
    file?.numPages ?? 0
  );

  const togglePage = useCallback((pageNum: number) => {
    setSelectedPages((prev) => {
      const next = new Set(prev);
      if (next.has(pageNum)) next.delete(pageNum);
      else next.add(pageNum);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (!file) return;
    const all = new Set<number>();
    for (let i = 1; i <= file.numPages; i++) all.add(i);
    setSelectedPages(all);
  }, [file]);

  const clearSelection = useCallback(() => {
    setSelectedPages(new Set());
  }, []);

  const baseFilename = file ? file.filename.replace(/\.pdf$/i, '') : 'document';

  const extractSelected = useCallback(async () => {
    if (!file || selectedPages.size === 0) return;
    setSaving(true);
    setError(null);
    try {
      const sourceDoc = await PDFLib.PDFDocument.load(file.arrayBuffer.slice(0));
      const newDoc = await PDFLib.PDFDocument.create();
      const pageIndices = Array.from(selectedPages)
        .sort((a, b) => a - b)
        .map((p) => p - 1);
      const copied = await newDoc.copyPages(sourceDoc, pageIndices);
      copied.forEach((page) => newDoc.addPage(page));
      const bytes = await newDoc.save();
      const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
      downloadBlob(blob, `${baseFilename}_extract.pdf`);
    } catch (err) {
      console.error(err);
      setError('Gagal mengekstrak halaman PDF.');
    } finally {
      setSaving(false);
    }
  }, [file, selectedPages, baseFilename]);

  const splitIntoIndividual = useCallback(async () => {
    if (!file) return;
    setSaving(true);
    setError(null);
    try {
      const sourceDoc = await PDFLib.PDFDocument.load(file.arrayBuffer.slice(0));
      for (let i = 0; i < file.numPages; i++) {
        const newDoc = await PDFLib.PDFDocument.create();
        const [copied] = await newDoc.copyPages(sourceDoc, [i]);
        newDoc.addPage(copied);
        const bytes = await newDoc.save();
        const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
        downloadBlob(blob, `${baseFilename}_page-${i + 1}.pdf`);
        // Small delay to avoid browser download spam blocking
        await new Promise((r) => setTimeout(r, 150));
      }
    } catch (err) {
      console.error(err);
      setError('Gagal memisahkan PDF.');
    } finally {
      setSaving(false);
    }
  }, [file, baseFilename]);

  const handleSplit = mode === 'extract' ? extractSelected : splitIntoIndividual;
  const canSplit = mode === 'extract' ? selectedPages.size > 0 : !!file;

  if (!file) {
    return (
      <ToolPageShell
        title="Pisah PDF"
        description="Pilih halaman yang ingin dipisahkan dari PDF Anda."
        icon={<Scissors className="w-6 h-6" />}
      >
        <FilePicker
          title="Buka Dokumen PDF"
          subtitle="Klik atau seret file PDF ke sini"
          onSuccess={({ arrayBuffer, doc, numPages, filename }) => {
            setFile({ arrayBuffer, doc, numPages, filename });
            setSelectedPages(new Set());
          }}
        />
      </ToolPageShell>
    );
  }

  return (
    <ToolPageShell
      title="Pisah PDF"
      description={`${file.filename} · ${file.numPages} halaman`}
      icon={<Scissors className="w-6 h-6" />}
    >
      <div className="w-full space-y-4">
        {/* Mode selector */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => setMode('extract')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  mode === 'extract'
                    ? 'bg-brand-500 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                Ekstrak halaman terpilih
              </button>
              <button
                onClick={() => setMode('individual')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  mode === 'individual'
                    ? 'bg-brand-500 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                Pisah jadi file per-halaman
              </button>
            </div>
            {mode === 'extract' && (
              <div className="flex gap-2 text-sm">
                <button
                  onClick={selectAll}
                  className="text-brand-600 dark:text-brand-400 hover:underline"
                >
                  Pilih semua
                </button>
                <span className="text-zinc-300 dark:text-zinc-600">·</span>
                <button
                  onClick={clearSelection}
                  className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:underline"
                >
                  Bersihkan
                </button>
              </div>
            )}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-3">
            {mode === 'extract'
              ? 'Klik halaman untuk memilih. Halaman terpilih akan digabung dalam satu PDF.'
              : `Akan menghasilkan ${file.numPages} file PDF terpisah, satu per halaman.`}
          </p>
        </Card>

        {error && (
          <div className="bg-red-500/10 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Page grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: file.numPages }, (_, i) => {
            const pageNum = i + 1;
            const selected = selectedPages.has(pageNum);
            const interactive = mode === 'extract';
            return (
              <button
                key={pageNum}
                onClick={() => interactive && togglePage(pageNum)}
                disabled={!interactive}
                className={`relative rounded-lg border-2 overflow-hidden transition-all ${
                  interactive ? 'cursor-pointer' : 'cursor-default'
                } ${
                  selected
                    ? 'border-brand-500 ring-2 ring-brand-500/30'
                    : 'border-zinc-200 dark:border-zinc-700 hover:border-brand-500/50'
                }`}
              >
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
                <div className="px-2 py-1 text-xs text-center bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-700">
                  Halaman {pageNum}
                </div>
                {selected && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-brand-500 text-white flex items-center justify-center text-xs font-bold">
                    {Array.from(selectedPages)
                      .sort((a, b) => a - b)
                      .indexOf(pageNum) + 1}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Action bar */}
        <div className="sticky bottom-4 flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center bg-background/80 backdrop-blur border border-border rounded-xl p-3 shadow-lg">
          <Button
            variant="outline"
            onClick={() => {
              setFile(null);
              setSelectedPages(new Set());
            }}
            disabled={saving}
          >
            <RotateCcw className="w-4 h-4" />
            Buka file lain
          </Button>
          <Button onClick={handleSplit} disabled={!canSplit || saving || thumbsLoading}>
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {mode === 'extract'
              ? `Unduh ${selectedPages.size > 0 ? `(${selectedPages.size} hal)` : ''}`
              : `Unduh ${file.numPages} file`}
          </Button>
        </div>
      </div>
    </ToolPageShell>
  );
};
