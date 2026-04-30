import React, { useState, useCallback, useEffect } from 'react';
import {
  LayoutGrid,
  Download,
  RotateCcw,
  RotateCw,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Loader2,
  FileText,
} from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { FilePicker, ToolPageShell, usePageThumbnails } from '@/features/_shared';
import { downloadBlob } from '@/utils';
import { PDFLib } from '@/hooks/usePdfLibraries';
import type { PDFDocument } from '@/types';

interface LoadedFile {
  arrayBuffer: ArrayBuffer;
  doc: PDFDocument;
  numPages: number;
  filename: string;
}

interface PageState {
  originalIndex: number; // 0-based index in source PDF
  rotation: 0 | 90 | 180 | 270;
}

export const OrganizePage: React.FC = () => {
  const [file, setFile] = useState<LoadedFile | null>(null);
  const [pages, setPages] = useState<PageState[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { thumbnails } = usePageThumbnails(file?.doc ?? null, file?.numPages ?? 0);

  useEffect(() => {
    if (file) {
      setPages(
        Array.from({ length: file.numPages }, (_, i) => ({ originalIndex: i, rotation: 0 }))
      );
    }
  }, [file]);

  const rotate = useCallback((index: number, delta: 90 | -90) => {
    setPages((prev) => {
      const next = [...prev];
      const newRotation = (((next[index].rotation + delta) % 360) + 360) % 360;
      next[index] = { ...next[index], rotation: newRotation as PageState['rotation'] };
      return next;
    });
  }, []);

  const remove = useCallback((index: number) => {
    setPages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const moveLeft = useCallback((index: number) => {
    if (index === 0) return;
    setPages((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }, []);

  const moveRight = useCallback((index: number) => {
    setPages((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }, []);

  const baseFilename = file ? file.filename.replace(/\.pdf$/i, '') : 'document';

  const handleSave = useCallback(async () => {
    if (!file || pages.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const sourceDoc = await PDFLib.PDFDocument.load(file.arrayBuffer.slice(0));
      const newDoc = await PDFLib.PDFDocument.create();
      const indices = pages.map((p) => p.originalIndex);
      const copied = await newDoc.copyPages(sourceDoc, indices);
      copied.forEach((page, i) => {
        const rotation = pages[i].rotation;
        if (rotation !== 0) {
          page.setRotation(PDFLib.degrees(rotation));
        }
        newDoc.addPage(page);
      });
      const bytes = await newDoc.save();
      const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
      downloadBlob(blob, `${baseFilename}_organized.pdf`);
    } catch (err) {
      console.error(err);
      setError('Gagal menyimpan PDF.');
    } finally {
      setSaving(false);
    }
  }, [file, pages, baseFilename]);

  if (!file) {
    return (
      <ToolPageShell
        title="Atur Halaman"
        description="Putar, urutkan ulang, dan hapus halaman PDF."
        icon={<LayoutGrid className="w-6 h-6" />}
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
      title="Atur Halaman"
      description={`${file.filename} · ${pages.length} dari ${file.numPages} halaman`}
      icon={<LayoutGrid className="w-6 h-6" />}
    >
      <div className="w-full space-y-4">
        {error && (
          <div className="bg-red-500/10 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {pages.length === 0 ? (
          <Card className="p-8 text-center text-zinc-500">
            Semua halaman dihapus. Buka file lain untuk memulai ulang.
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {pages.map((pageState, index) => (
              <Card
                key={`${pageState.originalIndex}-${index}`}
                className="overflow-hidden p-0 group"
              >
                <div className="aspect-[3/4] bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden">
                  {thumbnails[pageState.originalIndex] ? (
                    <img
                      src={thumbnails[pageState.originalIndex] as string}
                      alt={`Halaman ${pageState.originalIndex + 1}`}
                      className="w-full h-full object-contain transition-transform"
                      style={{ transform: `rotate(${pageState.rotation}deg)` }}
                    />
                  ) : (
                    <FileText className="w-8 h-8 text-zinc-400 animate-pulse" />
                  )}
                </div>
                <div className="px-2 py-1.5 text-xs text-center bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-700">
                  Halaman {pageState.originalIndex + 1}
                </div>
                <div className="grid grid-cols-5 border-t border-zinc-200 dark:border-zinc-700">
                  <button
                    onClick={() => moveLeft(index)}
                    disabled={index === 0}
                    className="p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Geser kiri"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 mx-auto" />
                  </button>
                  <button
                    onClick={() => rotate(index, -90)}
                    className="p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    title="Putar kiri"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mx-auto" />
                  </button>
                  <button
                    onClick={() => remove(index)}
                    className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Hapus"
                  >
                    <Trash2 className="w-3.5 h-3.5 mx-auto" />
                  </button>
                  <button
                    onClick={() => rotate(index, 90)}
                    className="p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    title="Putar kanan"
                  >
                    <RotateCw className="w-3.5 h-3.5 mx-auto" />
                  </button>
                  <button
                    onClick={() => moveRight(index)}
                    disabled={index === pages.length - 1}
                    className="p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Geser kanan"
                  >
                    <ArrowRight className="w-3.5 h-3.5 mx-auto" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}

        <div className="sticky bottom-4 flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center bg-background/80 backdrop-blur border border-border rounded-xl p-3 shadow-lg">
          <Button
            variant="outline"
            onClick={() => setFile(null)}
            disabled={saving}
          >
            <RotateCcw className="w-4 h-4" />
            Buka file lain
          </Button>
          <Button onClick={handleSave} disabled={pages.length === 0 || saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Simpan & Unduh
          </Button>
        </div>
      </div>
    </ToolPageShell>
  );
};
