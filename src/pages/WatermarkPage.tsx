import React, { useState, useCallback } from 'react';
import { Stamp, Download, RotateCcw, Loader2, Type, ImageIcon, Upload } from 'lucide-react';
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

type Mode = 'text' | 'image';

export const WatermarkPage: React.FC = () => {
  const [file, setFile] = useState<LoadedFile | null>(null);
  const [mode, setMode] = useState<Mode>('text');

  // Text mode
  const [text, setText] = useState('CONFIDENTIAL');
  const [fontSize, setFontSize] = useState(60);
  const [opacity, setOpacity] = useState(0.2);
  const [rotation, setRotation] = useState(45);

  // Image mode
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageType, setImageType] = useState<'png' | 'jpeg'>('png');
  const [imageScale, setImageScale] = useState(0.5);
  const [imageOpacity, setImageOpacity] = useState(0.3);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const baseFilename = file ? file.filename.replace(/\.pdf$/i, '') : 'document';

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type !== 'image/png' && f.type !== 'image/jpeg') {
      setError('Hanya PNG dan JPG yang didukung sebagai watermark.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageDataUrl(reader.result as string);
      setImageType(f.type === 'image/png' ? 'png' : 'jpeg');
    };
    reader.readAsDataURL(f);
  };

  const handleApply = useCallback(async () => {
    if (!file) return;
    if (mode === 'image' && !imageDataUrl) {
      setError('Pilih gambar untuk watermark.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const doc = await PDFLib.PDFDocument.load(file.arrayBuffer.slice(0));
      const pages = doc.getPages();

      if (mode === 'text') {
        const font = await doc.embedFont(PDFLib.StandardFonts.HelveticaBold);
        for (const page of pages) {
          const { width, height } = page.getSize();
          const textWidth = font.widthOfTextAtSize(text, fontSize);
          page.drawText(text, {
            x: width / 2 - textWidth / 2,
            y: height / 2 - fontSize / 2,
            size: fontSize,
            font,
            color: PDFLib.rgb(0.5, 0.5, 0.5),
            opacity,
            rotate: PDFLib.degrees(rotation),
          });
        }
      } else if (imageDataUrl) {
        const embedded =
          imageType === 'png'
            ? await doc.embedPng(imageDataUrl)
            : await doc.embedJpg(imageDataUrl);
        for (const page of pages) {
          const { width, height } = page.getSize();
          const imgDims = embedded.scale(1);
          const targetWidth = width * imageScale;
          const aspect = imgDims.width / imgDims.height;
          const drawWidth = targetWidth;
          const drawHeight = targetWidth / aspect;
          page.drawImage(embedded, {
            x: (width - drawWidth) / 2,
            y: (height - drawHeight) / 2,
            width: drawWidth,
            height: drawHeight,
            opacity: imageOpacity,
          });
        }
      }

      const bytes = await doc.save();
      const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
      downloadBlob(blob, `${baseFilename}_watermark.pdf`);
    } catch (err) {
      console.error(err);
      setError('Gagal menambahkan watermark.');
    } finally {
      setSaving(false);
    }
  }, [
    file,
    mode,
    text,
    fontSize,
    opacity,
    rotation,
    imageDataUrl,
    imageType,
    imageScale,
    imageOpacity,
    baseFilename,
  ]);

  if (!file) {
    return (
      <ToolPageShell
        title="Watermark PDF"
        description="Tambahkan teks atau gambar watermark ke setiap halaman."
        icon={<Stamp className="w-6 h-6" />}
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
      title="Watermark PDF"
      description={`${file.filename} · ${file.numPages} halaman`}
      icon={<Stamp className="w-6 h-6" />}
    >
      <div className="w-full max-w-xl space-y-4">
        <Card className="p-1">
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => setMode('text')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                mode === 'text'
                  ? 'bg-brand-500 text-white'
                  : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <Type className="w-4 h-4" /> Teks
            </button>
            <button
              onClick={() => setMode('image')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                mode === 'image'
                  ? 'bg-brand-500 text-white'
                  : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <ImageIcon className="w-4 h-4" /> Gambar
            </button>
          </div>
        </Card>

        {mode === 'text' ? (
          <Card className="p-5 space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1">Teks watermark</label>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="CONFIDENTIAL"
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium flex justify-between mb-1">
                Ukuran font <span className="text-zinc-500">{fontSize}</span>
              </label>
              <input
                type="range"
                min={20}
                max={120}
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm font-medium flex justify-between mb-1">
                Transparansi <span className="text-zinc-500">{Math.round(opacity * 100)}%</span>
              </label>
              <input
                type="range"
                min={5}
                max={100}
                value={opacity * 100}
                onChange={(e) => setOpacity(parseInt(e.target.value) / 100)}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm font-medium flex justify-between mb-1">
                Rotasi <span className="text-zinc-500">{rotation}°</span>
              </label>
              <input
                type="range"
                min={-90}
                max={90}
                value={rotation}
                onChange={(e) => setRotation(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </Card>
        ) : (
          <Card className="p-5 space-y-4">
            <div>
              <label className="text-sm font-medium block mb-2">Gambar</label>
              <label className="cursor-pointer">
                <div
                  className={`border-2 border-dashed rounded-md p-4 text-center transition-colors ${
                    imageDataUrl
                      ? 'border-brand-500/50'
                      : 'border-zinc-300 dark:border-zinc-700 hover:border-brand-500/50'
                  }`}
                >
                  {imageDataUrl ? (
                    <div className="flex flex-col items-center gap-2">
                      <img
                        src={imageDataUrl}
                        alt="Watermark"
                        className="max-h-32 max-w-full object-contain"
                      />
                      <span className="text-xs text-zinc-500">Klik untuk ganti gambar</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-zinc-500">
                      <Upload className="w-6 h-6" />
                      <span className="text-sm">Pilih gambar PNG / JPG</span>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
            </div>
            <div>
              <label className="text-sm font-medium flex justify-between mb-1">
                Ukuran <span className="text-zinc-500">{Math.round(imageScale * 100)}% lebar halaman</span>
              </label>
              <input
                type="range"
                min={10}
                max={100}
                value={imageScale * 100}
                onChange={(e) => setImageScale(parseInt(e.target.value) / 100)}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm font-medium flex justify-between mb-1">
                Transparansi <span className="text-zinc-500">{Math.round(imageOpacity * 100)}%</span>
              </label>
              <input
                type="range"
                min={5}
                max={100}
                value={imageOpacity * 100}
                onChange={(e) => setImageOpacity(parseInt(e.target.value) / 100)}
                className="w-full"
              />
            </div>
          </Card>
        )}

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
            Terapkan & unduh
          </Button>
        </div>
      </div>
    </ToolPageShell>
  );
};
