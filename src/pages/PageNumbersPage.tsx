import React, { useState, useCallback } from 'react';
import { Hash, Download, RotateCcw, Loader2 } from 'lucide-react';
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

type Position =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

type Format = 'n' | 'n-of-total' | 'page-n' | 'page-n-of-total';

const FORMAT_LABELS: Record<Format, string> = {
  n: '1',
  'n-of-total': '1 / 10',
  'page-n': 'Halaman 1',
  'page-n-of-total': 'Halaman 1 dari 10',
};

const renderText = (format: Format, n: number, total: number): string => {
  switch (format) {
    case 'n':
      return `${n}`;
    case 'n-of-total':
      return `${n} / ${total}`;
    case 'page-n':
      return `Halaman ${n}`;
    case 'page-n-of-total':
      return `Halaman ${n} dari ${total}`;
  }
};

const MARGIN = 24;

export const PageNumbersPage: React.FC = () => {
  const [file, setFile] = useState<LoadedFile | null>(null);
  const [position, setPosition] = useState<Position>('bottom-center');
  const [format, setFormat] = useState<Format>('n-of-total');
  const [fontSize, setFontSize] = useState(12);
  const [startFrom, setStartFrom] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const baseFilename = file ? file.filename.replace(/\.pdf$/i, '') : 'document';

  const handleApply = useCallback(async () => {
    if (!file) return;
    setSaving(true);
    setError(null);
    try {
      const doc = await PDFLib.PDFDocument.load(file.arrayBuffer.slice(0));
      const font = await doc.embedFont(PDFLib.StandardFonts.Helvetica);
      const pages = doc.getPages();
      const total = pages.length;
      const startIdx = Math.max(0, startFrom - 1);

      pages.forEach((page, i) => {
        if (i < startIdx) return;
        const pageNumberText = renderText(format, i + 1, total);
        const { width, height } = page.getSize();
        const textWidth = font.widthOfTextAtSize(pageNumberText, fontSize);

        let x = MARGIN;
        let y = MARGIN;
        if (position.endsWith('center')) x = (width - textWidth) / 2;
        else if (position.endsWith('right')) x = width - textWidth - MARGIN;
        if (position.startsWith('top')) y = height - MARGIN - fontSize;

        page.drawText(pageNumberText, {
          x,
          y,
          size: fontSize,
          font,
          color: PDFLib.rgb(0, 0, 0),
        });
      });

      const bytes = await doc.save();
      const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
      downloadBlob(blob, `${baseFilename}_numbered.pdf`);
    } catch (err) {
      console.error(err);
      setError('Gagal menambahkan nomor halaman.');
    } finally {
      setSaving(false);
    }
  }, [file, position, format, fontSize, startFrom, baseFilename]);

  if (!file) {
    return (
      <ToolPageShell
        title="Nomor Halaman"
        description="Tambahkan nomor halaman ke setiap halaman PDF."
        icon={<Hash className="w-6 h-6" />}
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

  const positionGrid: Position[][] = [
    ['top-left', 'top-center', 'top-right'],
    ['bottom-left', 'bottom-center', 'bottom-right'],
  ];

  return (
    <ToolPageShell
      title="Nomor Halaman"
      description={`${file.filename} · ${file.numPages} halaman`}
      icon={<Hash className="w-6 h-6" />}
    >
      <div className="w-full max-w-xl space-y-4">
        <Card className="p-5 space-y-4">
          <div>
            <div className="text-sm font-medium mb-2">Posisi</div>
            <div className="grid grid-cols-3 gap-2">
              {positionGrid.flat().map((p) => (
                <button
                  key={p}
                  onClick={() => setPosition(p)}
                  className={`aspect-[4/3] rounded-md border-2 transition-colors flex items-center justify-center text-xs ${
                    position === p
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                      : 'border-zinc-200 dark:border-zinc-700 hover:border-brand-500/50'
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      position === p ? 'bg-brand-500' : 'bg-zinc-400'
                    }`}
                    style={{
                      transform: `translate(${
                        p.endsWith('left') ? '-100%' : p.endsWith('right') ? '100%' : '0'
                      }, ${p.startsWith('top') ? '-100%' : '100%'})`,
                    }}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Posisi:{' '}
              {position
                .split('-')
                .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
                .join(' ')}
            </p>
          </div>

          <div>
            <div className="text-sm font-medium mb-2">Format</div>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(FORMAT_LABELS) as Format[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`px-3 py-2 rounded-md text-sm transition-colors ${
                    format === f
                      ? 'bg-brand-500 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {FORMAT_LABELS[f]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1">Ukuran font</label>
              <input
                type="number"
                value={fontSize}
                onChange={(e) => setFontSize(Math.max(6, Math.min(48, parseInt(e.target.value) || 12)))}
                min={6}
                max={48}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Mulai dari halaman</label>
              <input
                type="number"
                value={startFrom}
                onChange={(e) =>
                  setStartFrom(Math.max(1, Math.min(file.numPages, parseInt(e.target.value) || 1)))
                }
                min={1}
                max={file.numPages}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"
              />
            </div>
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
          <Button onClick={handleApply} disabled={saving} className="flex-1">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Tambah nomor & unduh
          </Button>
        </div>
      </div>
    </ToolPageShell>
  );
};
