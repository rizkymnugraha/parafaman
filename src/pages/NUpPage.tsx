import React, { useState, useCallback } from 'react';
import { Grid3x3, Download, RotateCcw, Loader2 } from 'lucide-react';
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

type Layout = '2up' | '4up' | '6up';
type Orientation = 'auto' | 'portrait' | 'landscape';

const LAYOUTS: Record<Layout, { cols: number; rows: number; recommended: Orientation }> = {
  '2up': { cols: 2, rows: 1, recommended: 'landscape' },
  '4up': { cols: 2, rows: 2, recommended: 'portrait' },
  '6up': { cols: 2, rows: 3, recommended: 'portrait' },
};

const A4 = { portrait: { width: 595, height: 842 }, landscape: { width: 842, height: 595 } };
const GAP = 8;
const MARGIN = 24;

export const NUpPage: React.FC = () => {
  const [file, setFile] = useState<LoadedFile | null>(null);
  const [layout, setLayout] = useState<Layout>('2up');
  const [orientation, setOrientation] = useState<Orientation>('auto');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const baseFilename = file ? file.filename.replace(/\.pdf$/i, '') : 'document';

  const handleApply = useCallback(async () => {
    if (!file) return;
    setSaving(true);
    setError(null);
    try {
      const sourceDoc = await PDFLib.PDFDocument.load(file.arrayBuffer.slice(0));
      const newDoc = await PDFLib.PDFDocument.create();
      const config = LAYOUTS[layout];
      const resolvedOrient: 'portrait' | 'landscape' =
        orientation === 'auto'
          ? config.recommended === 'landscape'
            ? 'landscape'
            : 'portrait'
          : orientation;
      const sheet = A4[resolvedOrient];

      const innerWidth = sheet.width - MARGIN * 2 - GAP * (config.cols - 1);
      const innerHeight = sheet.height - MARGIN * 2 - GAP * (config.rows - 1);
      const slotWidth = innerWidth / config.cols;
      const slotHeight = innerHeight / config.rows;
      const perPage = config.cols * config.rows;

      const pageIndices = sourceDoc.getPageIndices();
      const embeddedPages = await newDoc.embedPdf(sourceDoc, pageIndices);

      for (let i = 0; i < embeddedPages.length; i += perPage) {
        const newPage = newDoc.addPage([sheet.width, sheet.height]);
        for (let slot = 0; slot < perPage; slot++) {
          const embedded = embeddedPages[i + slot];
          if (!embedded) break;
          const col = slot % config.cols;
          const row = Math.floor(slot / config.cols);
          // Fit the source page into the slot, preserving aspect ratio
          const dims = embedded.scale(1);
          const srcAspect = dims.width / dims.height;
          const slotAspect = slotWidth / slotHeight;
          let drawWidth: number;
          let drawHeight: number;
          if (srcAspect > slotAspect) {
            drawWidth = slotWidth;
            drawHeight = slotWidth / srcAspect;
          } else {
            drawHeight = slotHeight;
            drawWidth = slotHeight * srcAspect;
          }
          // Slot top-left in PDF (origin bottom-left): grid top-down
          const slotX = MARGIN + col * (slotWidth + GAP);
          const slotY = sheet.height - MARGIN - (row + 1) * slotHeight - row * GAP;
          // Center within slot
          const x = slotX + (slotWidth - drawWidth) / 2;
          const y = slotY + (slotHeight - drawHeight) / 2;
          newPage.drawPage(embedded, { x, y, width: drawWidth, height: drawHeight });
        }
      }

      const bytes = await newDoc.save();
      const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
      downloadBlob(blob, `${baseFilename}_${layout}.pdf`);
    } catch (err) {
      console.error(err);
      setError('Gagal membuat layout N-up.');
    } finally {
      setSaving(false);
    }
  }, [file, layout, orientation, baseFilename]);

  if (!file) {
    return (
      <ToolPageShell
        title="N-up Print"
        description="Cetak beberapa halaman PDF dalam satu lembar untuk hemat kertas."
        icon={<Grid3x3 className="w-6 h-6" />}
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

  const config = LAYOUTS[layout];
  const totalSheets = Math.ceil(file.numPages / (config.cols * config.rows));

  return (
    <ToolPageShell
      title="N-up Print"
      description={`${file.filename} · ${file.numPages} halaman → ${totalSheets} lembar`}
      icon={<Grid3x3 className="w-6 h-6" />}
    >
      <div className="w-full max-w-xl space-y-4">
        <Card className="p-5 space-y-4">
          <div>
            <div className="text-sm font-medium mb-2">Layout</div>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(LAYOUTS) as Layout[]).map((l) => {
                const c = LAYOUTS[l];
                const cells = Array.from({ length: c.cols * c.rows });
                return (
                  <button
                    key={l}
                    onClick={() => setLayout(l)}
                    className={`p-3 rounded-md border-2 transition-colors flex flex-col items-center gap-2 ${
                      layout === l
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30'
                        : 'border-zinc-200 dark:border-zinc-700 hover:border-brand-500/50'
                    }`}
                  >
                    <div
                      className="grid gap-0.5 w-12"
                      style={{
                        gridTemplateColumns: `repeat(${c.cols}, 1fr)`,
                      }}
                    >
                      {cells.map((_, i) => (
                        <div
                          key={i}
                          className={`aspect-[3/4] rounded-sm ${
                            layout === l
                              ? 'bg-brand-500'
                              : 'bg-zinc-300 dark:bg-zinc-600'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-medium uppercase">{l}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="text-sm font-medium mb-2">Orientasi</div>
            <div className="grid grid-cols-3 gap-2">
              {(['auto', 'portrait', 'landscape'] as Orientation[]).map((o) => (
                <button
                  key={o}
                  onClick={() => setOrientation(o)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    orientation === o
                      ? 'bg-brand-500 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {o === 'auto' ? 'Otomatis' : o === 'portrait' ? 'Portrait' : 'Landscape'}
                </button>
              ))}
            </div>
            {orientation === 'auto' && (
              <p className="text-xs text-zinc-500 mt-1">
                Disarankan: {config.recommended === 'landscape' ? 'Landscape' : 'Portrait'} untuk{' '}
                {layout}
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
          <Button onClick={handleApply} disabled={saving} className="flex-1">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Buat & unduh
          </Button>
        </div>
      </div>
    </ToolPageShell>
  );
};
