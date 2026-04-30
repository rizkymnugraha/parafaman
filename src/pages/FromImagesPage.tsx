import React, { useState, useCallback } from 'react';
import {
  ImageUp,
  Download,
  ArrowLeft,
  ArrowRight,
  Trash2,
  Plus,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { FilePicker, ToolPageShell } from '@/features/_shared';
import { downloadBlob } from '@/utils';
import { PDFLib } from '@/hooks/usePdfLibraries';

interface ImageItem {
  id: string;
  file: File;
  dataUrl: string;
  width: number;
  height: number;
}

type PageSize = 'auto' | 'a4' | 'letter';

const PAGE_DIMENSIONS: Record<Exclude<PageSize, 'auto'>, { width: number; height: number }> = {
  a4: { width: 595, height: 842 },
  letter: { width: 612, height: 792 },
};

const readImage = (file: File): Promise<ImageItem> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        resolve({
          id: `${Date.now()}-${Math.random()}`,
          file,
          dataUrl,
          width: img.width,
          height: img.height,
        });
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = dataUrl;
    };
    reader.onerror = () => reject(new Error('Failed to read image'));
    reader.readAsDataURL(file);
  });
};

export const FromImagesPage: React.FC = () => {
  const [items, setItems] = useState<ImageItem[]>([]);
  const [pageSize, setPageSize] = useState<PageSize>('auto');
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addImages = useCallback(async (files: File[]) => {
    setLoadingFiles(true);
    setError(null);
    try {
      const validFiles = files.filter(
        (f) => f.type === 'image/png' || f.type === 'image/jpeg' || f.type === 'image/jpg'
      );
      if (validFiles.length === 0) {
        setError('Hanya format PNG dan JPG yang didukung.');
        return;
      }
      const loaded = await Promise.all(validFiles.map(readImage));
      setItems((prev) => [...prev, ...loaded]);
    } catch (err) {
      console.error(err);
      setError('Gagal memuat gambar.');
    } finally {
      setLoadingFiles(false);
    }
  }, []);

  const moveLeft = useCallback((index: number) => {
    if (index === 0) return;
    setItems((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }, []);

  const moveRight = useCallback((index: number) => {
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

  const handleGenerate = useCallback(async () => {
    if (items.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const newDoc = await PDFLib.PDFDocument.create();
      for (const item of items) {
        const isPng = item.file.type === 'image/png';
        const embedded = isPng
          ? await newDoc.embedPng(item.dataUrl)
          : await newDoc.embedJpg(item.dataUrl);

        let pageWidth: number;
        let pageHeight: number;
        if (pageSize === 'auto') {
          pageWidth = item.width;
          pageHeight = item.height;
        } else {
          pageWidth = PAGE_DIMENSIONS[pageSize].width;
          pageHeight = PAGE_DIMENSIONS[pageSize].height;
        }

        const page = newDoc.addPage([pageWidth, pageHeight]);
        // Fit image into page while preserving aspect ratio
        const imgRatio = item.width / item.height;
        const pageRatio = pageWidth / pageHeight;
        let drawWidth: number;
        let drawHeight: number;
        if (imgRatio > pageRatio) {
          drawWidth = pageWidth;
          drawHeight = pageWidth / imgRatio;
        } else {
          drawHeight = pageHeight;
          drawWidth = pageHeight * imgRatio;
        }
        const x = (pageWidth - drawWidth) / 2;
        const y = (pageHeight - drawHeight) / 2;
        page.drawImage(embedded, { x, y, width: drawWidth, height: drawHeight });
      }
      const bytes = await newDoc.save();
      const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
      downloadBlob(blob, `images_${Date.now()}.pdf`);
    } catch (err) {
      console.error(err);
      setError('Gagal membuat PDF dari gambar.');
    } finally {
      setSaving(false);
    }
  }, [items, pageSize]);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const handleAddMoreClick = () => fileInputRef.current?.click();
  const handleAddMoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addImages(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  if (items.length === 0) {
    return (
      <ToolPageShell
        title="Gambar ke PDF"
        description="Gabungkan beberapa gambar (PNG/JPG) menjadi satu file PDF."
        icon={<ImageUp className="w-6 h-6" />}
      >
        <FilePicker
          title="Pilih Gambar"
          subtitle="Pilih satu atau beberapa gambar PNG/JPG"
          accept="image/png,image/jpeg"
          multiple
          onMultipleSuccess={addImages}
        />
      </ToolPageShell>
    );
  }

  return (
    <ToolPageShell
      title="Gambar ke PDF"
      description={`${items.length} gambar · urutan menentukan urutan halaman`}
      icon={<ImageUp className="w-6 h-6" />}
    >
      <div className="w-full space-y-4">
        <Card className="p-4">
          <div className="text-sm font-medium mb-2">Ukuran halaman</div>
          <div className="grid grid-cols-3 gap-2">
            {(['auto', 'a4', 'letter'] as PageSize[]).map((size) => (
              <button
                key={size}
                onClick={() => setPageSize(size)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pageSize === size
                    ? 'bg-brand-500 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                {size === 'auto' ? 'Sesuai gambar' : size.toUpperCase()}
              </button>
            ))}
          </div>
        </Card>

        {error && (
          <div className="bg-amber-500/10 text-amber-700 dark:text-amber-400 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {items.map((item, index) => (
            <Card key={item.id} className="overflow-hidden p-0">
              <div className="aspect-[3/4] bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center relative">
                <img
                  src={item.dataUrl}
                  alt={item.file.name}
                  className="w-full h-full object-contain"
                />
                <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-brand-500 text-white flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </div>
              </div>
              <div className="px-2 py-1 text-xs text-center bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-700 truncate">
                {item.file.name}
              </div>
              <div className="grid grid-cols-3 border-t border-zinc-200 dark:border-zinc-700">
                <button
                  onClick={() => moveLeft(index)}
                  disabled={index === 0}
                  className="p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Geser kiri"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mx-auto" />
                </button>
                <button
                  onClick={() => remove(item.id)}
                  className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title="Hapus"
                >
                  <Trash2 className="w-3.5 h-3.5 mx-auto" />
                </button>
                <button
                  onClick={() => moveRight(index)}
                  disabled={index === items.length - 1}
                  className="p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Geser kanan"
                >
                  <ArrowRight className="w-3.5 h-3.5 mx-auto" />
                </button>
              </div>
            </Card>
          ))}
        </div>

        <Button variant="outline" onClick={handleAddMoreClick} disabled={loadingFiles} className="w-full">
          {loadingFiles ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Tambah gambar lain
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg"
          multiple
          className="hidden"
          onChange={handleAddMoreChange}
        />

        <div className="sticky bottom-4 flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center bg-background/80 backdrop-blur border border-border rounded-xl p-3 shadow-lg">
          <Button variant="outline" onClick={() => setItems([])} disabled={saving}>
            <RotateCcw className="w-4 h-4" />
            Mulai ulang
          </Button>
          <Button onClick={handleGenerate} disabled={items.length === 0 || saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Buat PDF
          </Button>
        </div>
      </div>
    </ToolPageShell>
  );
};
