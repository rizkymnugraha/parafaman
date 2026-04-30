import React, { useState, useCallback } from 'react';
import { Combine, Download, ArrowUp, ArrowDown, X, Plus, Loader2, FileText } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { FilePicker, ToolPageShell } from '@/features/_shared';
import { downloadBlob, loadPdfFile, renderPageToImage } from '@/utils';
import { PDFLib } from '@/hooks/usePdfLibraries';

interface MergeItem {
  id: string;
  file: File;
  arrayBuffer: ArrayBuffer;
  numPages: number;
  thumbnail: string | null;
}

export const MergePage: React.FC = () => {
  const [items, setItems] = useState<MergeItem[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addFiles = useCallback(async (files: File[]) => {
    setLoadingFiles(true);
    setError(null);
    try {
      const newItems: MergeItem[] = [];
      for (const file of files) {
        if (file.type !== 'application/pdf') continue;
        try {
          const { arrayBuffer, doc, numPages } = await loadPdfFile(file);
          let thumbnail: string | null = null;
          try {
            thumbnail = await renderPageToImage(doc, 1, 0.3);
          } catch {
            thumbnail = null;
          }
          newItems.push({
            id: `${Date.now()}-${Math.random()}`,
            file,
            arrayBuffer,
            numPages,
            thumbnail,
          });
        } catch (err) {
          console.error(`Failed to load ${file.name}:`, err);
          setError(
            `${file.name} dilewati. PDF terenkripsi atau rusak tidak didukung untuk merge.`
          );
        }
      }
      setItems((prev) => [...prev, ...newItems]);
    } finally {
      setLoadingFiles(false);
    }
  }, []);

  const moveUp = useCallback((index: number) => {
    if (index === 0) return;
    setItems((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }, []);

  const moveDown = useCallback((index: number) => {
    setItems((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const totalPages = items.reduce((sum, item) => sum + item.numPages, 0);

  const handleMerge = useCallback(async () => {
    if (items.length < 2) return;
    setSaving(true);
    setError(null);
    try {
      const mergedDoc = await PDFLib.PDFDocument.create();
      for (const item of items) {
        const sourceDoc = await PDFLib.PDFDocument.load(item.arrayBuffer.slice(0));
        const indices = sourceDoc.getPageIndices();
        const copied = await mergedDoc.copyPages(sourceDoc, indices);
        copied.forEach((p) => mergedDoc.addPage(p));
      }
      const bytes = await mergedDoc.save();
      const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
      downloadBlob(blob, `merged_${Date.now()}.pdf`);
    } catch (err) {
      console.error(err);
      setError('Gagal menggabungkan PDF.');
    } finally {
      setSaving(false);
    }
  }, [items]);

  // File input for "add more"
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const handleAddMoreClick = () => fileInputRef.current?.click();
  const handleAddMoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  if (items.length === 0) {
    return (
      <ToolPageShell
        title="Gabung PDF"
        description="Pilih beberapa file PDF untuk digabungkan menjadi satu."
        icon={<Combine className="w-6 h-6" />}
      >
        <FilePicker
          title="Pilih PDF"
          subtitle="Pilih dua atau lebih file PDF untuk digabungkan"
          accept="application/pdf"
          multiple
          onMultipleSuccess={addFiles}
        />
      </ToolPageShell>
    );
  }

  return (
    <ToolPageShell
      title="Gabung PDF"
      description={`${items.length} file · ${totalPages} halaman total · urutan menentukan urutan halaman`}
      icon={<Combine className="w-6 h-6" />}
    >
      <div className="w-full space-y-3">
        {error && (
          <div className="bg-amber-500/10 text-amber-700 dark:text-amber-400 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="space-y-2">
          {items.map((item, index) => (
            <Card key={item.id} className="p-3">
              <div className="flex items-center gap-3">
                <div className="w-12 text-center text-sm font-medium text-zinc-500">
                  {index + 1}
                </div>
                <div className="w-12 h-16 shrink-0 rounded border border-zinc-200 dark:border-zinc-700 overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                  {item.thumbnail ? (
                    <img
                      src={item.thumbnail}
                      alt={item.file.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <FileText className="w-5 h-5 text-zinc-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{item.file.name}</div>
                  <div className="text-xs text-zinc-500">
                    {item.numPages} halaman · {(item.file.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    title="Naikkan"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => moveDown(index)}
                    disabled={index === items.length - 1}
                    title="Turunkan"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => remove(item.id)}
                    title="Hapus"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Button variant="outline" onClick={handleAddMoreClick} disabled={loadingFiles} className="w-full">
          {loadingFiles ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Tambah file lain
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          multiple
          className="hidden"
          onChange={handleAddMoreChange}
        />

        <div className="sticky bottom-4 flex justify-end bg-background/80 backdrop-blur border border-border rounded-xl p-3 shadow-lg">
          <Button onClick={handleMerge} disabled={items.length < 2 || saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Gabung & Unduh
          </Button>
        </div>
      </div>
    </ToolPageShell>
  );
};

