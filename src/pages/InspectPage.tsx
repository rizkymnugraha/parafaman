import React, { useState, useCallback, useEffect } from 'react';
import { Info, Download, RotateCcw, Loader2, Save } from 'lucide-react';
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
  size: number;
  wasEncrypted: boolean;
}

interface Metadata {
  title: string;
  author: string;
  subject: string;
  keywords: string;
  creator: string;
  producer: string;
}

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

export const InspectPage: React.FC = () => {
  const [file, setFile] = useState<LoadedFile | null>(null);
  const [metadata, setMetadata] = useState<Metadata>({
    title: '',
    author: '',
    subject: '',
    keywords: '',
    creator: '',
    producer: '',
  });
  const [pageSize, setPageSize] = useState<{ width: number; height: number } | null>(null);
  const [pdfVersion, setPdfVersion] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const baseFilename = file ? file.filename.replace(/\.pdf$/i, '') : 'document';

  // Load metadata when file changes
  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    (async () => {
      try {
        const doc = await PDFLib.PDFDocument.load(file.arrayBuffer.slice(0), {
          ignoreEncryption: true,
        });
        if (cancelled) return;
        setMetadata({
          title: doc.getTitle() || '',
          author: doc.getAuthor() || '',
          subject: doc.getSubject() || '',
          keywords: (doc.getKeywords() as unknown as string) || '',
          creator: doc.getCreator() || '',
          producer: doc.getProducer() || '',
        });
        const firstPage = doc.getPage(0);
        const { width, height } = firstPage.getSize();
        setPageSize({ width: Math.round(width), height: Math.round(height) });
      } catch (err) {
        console.error(err);
      }

      try {
        const page = await file.doc.getPage(1);
        const viewport = page.getViewport({ scale: 1 });
        if (!cancelled && !pageSize) {
          setPageSize({ width: Math.round(viewport.width), height: Math.round(viewport.height) });
        }
      } catch {
        // ignore
      }

      // Try to extract PDF version from arrayBuffer header
      try {
        const headerBytes = new Uint8Array(file.arrayBuffer.slice(0, 8));
        const header = new TextDecoder().decode(headerBytes);
        const match = header.match(/%PDF-(\d+\.\d+)/);
        if (!cancelled && match) setPdfVersion(match[1]);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  const handleSave = useCallback(async () => {
    if (!file) return;
    setSaving(true);
    setError(null);
    try {
      const doc = await PDFLib.PDFDocument.load(file.arrayBuffer.slice(0));
      doc.setTitle(metadata.title || '');
      doc.setAuthor(metadata.author || '');
      doc.setSubject(metadata.subject || '');
      doc.setKeywords(metadata.keywords ? metadata.keywords.split(',').map((k) => k.trim()) : []);
      doc.setCreator(metadata.creator || '');
      doc.setProducer(metadata.producer || '');
      doc.setModificationDate(new Date());
      const bytes = await doc.save();
      const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
      downloadBlob(blob, `${baseFilename}_metadata.pdf`);
    } catch (err) {
      console.error(err);
      setError('Gagal menyimpan metadata.');
    } finally {
      setSaving(false);
    }
  }, [file, metadata, baseFilename]);

  if (!file) {
    return (
      <ToolPageShell
        title="Info & Metadata PDF"
        description="Lihat informasi file dan edit metadata seperti judul, penulis, atau kata kunci."
        icon={<Info className="w-6 h-6" />}
      >
        <FilePicker
          title="Buka Dokumen PDF"
          subtitle="Klik atau seret file PDF ke sini"
          onSuccess={({ arrayBuffer, doc, numPages, filename, password }) => {
            setFile({
              arrayBuffer,
              doc,
              numPages,
              filename,
              size: arrayBuffer.byteLength,
              wasEncrypted: !!password,
            });
          }}
        />
      </ToolPageShell>
    );
  }

  const updateField = (key: keyof Metadata) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setMetadata((prev) => ({ ...prev, [key]: e.target.value }));
  };

  return (
    <ToolPageShell
      title="Info & Metadata PDF"
      description={file.filename}
      icon={<Info className="w-6 h-6" />}
    >
      <div className="w-full max-w-2xl space-y-4">
        {/* File Info (read-only) */}
        <Card className="p-5">
          <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide text-zinc-500">
            Informasi File
          </h3>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div className="flex justify-between sm:block">
              <dt className="text-zinc-500">Nama file</dt>
              <dd className="font-medium truncate">{file.filename}</dd>
            </div>
            <div className="flex justify-between sm:block">
              <dt className="text-zinc-500">Ukuran</dt>
              <dd className="font-medium">{formatBytes(file.size)}</dd>
            </div>
            <div className="flex justify-between sm:block">
              <dt className="text-zinc-500">Halaman</dt>
              <dd className="font-medium">{file.numPages}</dd>
            </div>
            <div className="flex justify-between sm:block">
              <dt className="text-zinc-500">Versi PDF</dt>
              <dd className="font-medium">{pdfVersion || '—'}</dd>
            </div>
            {pageSize && (
              <div className="flex justify-between sm:block">
                <dt className="text-zinc-500">Ukuran halaman</dt>
                <dd className="font-medium">
                  {pageSize.width} × {pageSize.height} pt
                </dd>
              </div>
            )}
            <div className="flex justify-between sm:block">
              <dt className="text-zinc-500">Terenkripsi</dt>
              <dd className="font-medium">{file.wasEncrypted ? 'Ya' : 'Tidak'}</dd>
            </div>
          </dl>
        </Card>

        {/* Editable Metadata */}
        <Card className="p-5 space-y-3">
          <h3 className="font-semibold mb-1 text-sm uppercase tracking-wide text-zinc-500">
            Metadata
          </h3>

          <div>
            <label className="text-sm font-medium block mb-1">Judul</label>
            <input
              type="text"
              value={metadata.title}
              onChange={updateField('title')}
              placeholder="Judul dokumen"
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Penulis</label>
            <input
              type="text"
              value={metadata.author}
              onChange={updateField('author')}
              placeholder="Nama penulis"
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Subjek</label>
            <input
              type="text"
              value={metadata.subject}
              onChange={updateField('subject')}
              placeholder="Topik dokumen"
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Kata kunci</label>
            <input
              type="text"
              value={metadata.keywords}
              onChange={updateField('keywords')}
              placeholder="Pisahkan dengan koma"
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1">Creator</label>
              <input
                type="text"
                value={metadata.creator}
                onChange={updateField('creator')}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Producer</label>
              <input
                type="text"
                value={metadata.producer}
                onChange={updateField('producer')}
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
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Simpan & unduh
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </ToolPageShell>
  );
};
