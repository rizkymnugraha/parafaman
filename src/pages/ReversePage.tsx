import React, { useState, useCallback } from 'react';
import { FlipVertical, Download, RotateCcw, Loader2, ArrowDown } from 'lucide-react';
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

export const ReversePage: React.FC = () => {
  const [file, setFile] = useState<LoadedFile | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { thumbnails } = usePageThumbnails(file?.doc ?? null, file?.numPages ?? 0);

  const baseFilename = file ? file.filename.replace(/\.pdf$/i, '') : 'document';

  const handleReverse = useCallback(async () => {
    if (!file) return;
    setSaving(true);
    setError(null);
    try {
      const sourceDoc = await PDFLib.PDFDocument.load(file.arrayBuffer.slice(0));
      const newDoc = await PDFLib.PDFDocument.create();
      const indices = sourceDoc.getPageIndices().slice().reverse();
      const copied = await newDoc.copyPages(sourceDoc, indices);
      copied.forEach((p) => newDoc.addPage(p));
      const bytes = await newDoc.save();
      const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
      downloadBlob(blob, `${baseFilename}_reversed.pdf`);
    } catch (err) {
      console.error(err);
      setError('Gagal membalik urutan halaman.');
    } finally {
      setSaving(false);
    }
  }, [file, baseFilename]);

  if (!file) {
    return (
      <ToolPageShell
        title="Balik Urutan Halaman"
        description="Balik urutan halaman PDF dari belakang ke depan."
        icon={<FlipVertical className="w-6 h-6" />}
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

  // Show preview: first 3 originals → first 3 reversed
  const previewIndices = Array.from({ length: Math.min(file.numPages, 4) }, (_, i) => i);
  const reversedPreviewIndices = previewIndices.map((_, i) => file.numPages - 1 - i);

  return (
    <ToolPageShell
      title="Balik Urutan Halaman"
      description={`${file.filename} · ${file.numPages} halaman`}
      icon={<FlipVertical className="w-6 h-6" />}
    >
      <div className="w-full max-w-3xl space-y-4">
        {error && (
          <div className="bg-red-500/10 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <div className="text-xs uppercase tracking-wide text-zinc-500 mb-2">Sebelum</div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {previewIndices.map((idx) => (
                  <div
                    key={`before-${idx}`}
                    className="shrink-0 w-20 aspect-[3/4] rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex items-center justify-center relative"
                  >
                    {thumbnails[idx] ? (
                      <img
                        src={thumbnails[idx] as string}
                        alt={`Halaman ${idx + 1}`}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="text-xs text-zinc-400">{idx + 1}</span>
                    )}
                    <div className="absolute bottom-0 inset-x-0 text-[10px] text-center bg-white/80 dark:bg-zinc-900/80">
                      {idx + 1}
                    </div>
                  </div>
                ))}
                {file.numPages > 4 && (
                  <div className="shrink-0 w-20 aspect-[3/4] flex items-center justify-center text-xs text-zinc-400">
                    +{file.numPages - 4}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-center">
              <ArrowDown className="w-5 h-5 text-brand-500" />
            </div>

            <div>
              <div className="text-xs uppercase tracking-wide text-zinc-500 mb-2">Setelah</div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {reversedPreviewIndices.map((idx, i) => (
                  <div
                    key={`after-${i}`}
                    className="shrink-0 w-20 aspect-[3/4] rounded border-2 border-brand-500 bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex items-center justify-center relative"
                  >
                    {thumbnails[idx] ? (
                      <img
                        src={thumbnails[idx] as string}
                        alt={`Halaman ${idx + 1}`}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="text-xs text-zinc-400">{idx + 1}</span>
                    )}
                    <div className="absolute bottom-0 inset-x-0 text-[10px] text-center bg-brand-500/90 text-white">
                      {idx + 1}
                    </div>
                  </div>
                ))}
                {file.numPages > 4 && (
                  <div className="shrink-0 w-20 aspect-[3/4] flex items-center justify-center text-xs text-zinc-400">
                    +{file.numPages - 4}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => setFile(null)}
            disabled={saving}
            className="flex-1"
          >
            <RotateCcw className="w-4 h-4" /> Buka file lain
          </Button>
          <Button onClick={handleReverse} disabled={saving} className="flex-1">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Balik & unduh
          </Button>
        </div>
      </div>
    </ToolPageShell>
  );
};
