import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ChevronLeft,
  ArrowRight,
  PenLine,
  Scissors,
  Combine,
  Minimize2,
  LayoutGrid,
  ImageDown,
  ImageUp,
  Lock,
  Unlock,
  FlipVertical,
  Info,
  Hash,
  Stamp,
  Crop,
  Grid3x3,
  Wrench,
  Shield,
} from 'lucide-react';
import { Card } from '@/components/ui';
import { Footer } from '@/components/Footer';

interface Feature {
  to: string;
  title: string;
  short: string;
  long: string;
  icon: React.ReactNode;
  isNew?: boolean;
}

interface Section {
  heading: string;
  description: string;
  features: Feature[];
}

const SECTIONS: Section[] = [
  {
    heading: 'Tanda Tangan & Anotasi',
    description: 'Tambahkan tanda tangan, stempel, dan informasi ke dokumen.',
    features: [
      {
        to: '/sign',
        title: 'Tanda Tangan PDF',
        short: 'Tanda tangan & stempel digital.',
        long: 'Gambar tanda tangan langsung di canvas atau unggah gambar, lalu posisikan di mana saja di dokumen. Mendukung multi-halaman dan PDF terenkripsi.',
        icon: <PenLine className="w-5 h-5" />,
      },
      {
        to: '/page-numbers',
        title: 'Nomor Halaman',
        short: 'Tambahkan nomor halaman otomatis.',
        long: 'Pilih dari 6 posisi dan 4 format (1, 1/10, Halaman 1, Halaman 1 dari 10). Atur ukuran font dan halaman mulai.',
        icon: <Hash className="w-5 h-5" />,
        isNew: true,
      },
      {
        to: '/watermark',
        title: 'Watermark PDF',
        short: 'Watermark teks atau gambar.',
        long: 'Tambahkan watermark "CONFIDENTIAL" dengan rotasi, atau logo perusahaan dengan transparansi yang bisa diatur. Berlaku untuk semua halaman.',
        icon: <Stamp className="w-5 h-5" />,
        isNew: true,
      },
    ],
  },
  {
    heading: 'Atur Halaman',
    description: 'Pisah, gabung, urutkan ulang, dan susun halaman.',
    features: [
      {
        to: '/split',
        title: 'Pisah PDF',
        short: 'Ekstrak halaman tertentu jadi PDF baru.',
        long: 'Pilih halaman secara visual dengan klik thumbnail, atau pisah seluruh dokumen menjadi file per halaman dalam satu klik.',
        icon: <Scissors className="w-5 h-5" />,
        isNew: true,
      },
      {
        to: '/merge',
        title: 'Gabung PDF',
        short: 'Gabungkan beberapa PDF jadi satu.',
        long: 'Tambahkan banyak file PDF, atur urutan, lalu gabungkan menjadi satu dokumen tunggal.',
        icon: <Combine className="w-5 h-5" />,
        isNew: true,
      },
      {
        to: '/organize',
        title: 'Atur Halaman',
        short: 'Putar, urutkan, atau hapus halaman.',
        long: 'Lihat semua halaman dalam grid thumbnail. Putar 90°/180°, geser kiri/kanan, atau hapus halaman per item.',
        icon: <LayoutGrid className="w-5 h-5" />,
        isNew: true,
      },
      {
        to: '/reverse',
        title: 'Balik Halaman',
        short: 'Balik urutan halaman jadi terbalik.',
        long: 'Berguna untuk dokumen yang di-scan dari belakang ke depan, atau untuk membuat versi terbalik dari sebuah PDF.',
        icon: <FlipVertical className="w-5 h-5" />,
        isNew: true,
      },
      {
        to: '/crop',
        title: 'Crop PDF',
        short: 'Potong margin halaman.',
        long: 'Atur margin atas, bawah, kiri, dan kanan dalam satuan point dengan preview real-time pada halaman pertama.',
        icon: <Crop className="w-5 h-5" />,
        isNew: true,
      },
      {
        to: '/n-up',
        title: 'N-up Print',
        short: 'Beberapa halaman per lembar.',
        long: 'Hemat kertas dengan layout 2-up, 4-up, atau 6-up pada kertas A4 portrait atau landscape.',
        icon: <Grid3x3 className="w-5 h-5" />,
        isNew: true,
      },
    ],
  },
  {
    heading: 'Konversi',
    description: 'Konversi antara PDF dan format gambar.',
    features: [
      {
        to: '/to-images',
        title: 'PDF ke Gambar',
        short: 'Ekspor halaman jadi PNG/JPG.',
        long: 'Render setiap halaman menjadi gambar berkualitas tinggi (1x, 2x, atau 3x). Unduh per halaman atau semuanya sekaligus.',
        icon: <ImageDown className="w-5 h-5" />,
        isNew: true,
      },
      {
        to: '/from-images',
        title: 'Gambar ke PDF',
        short: 'Buat PDF dari kumpulan gambar.',
        long: 'Pilih gambar PNG/JPG, atur urutan, dan pilih ukuran halaman (A4, Letter, atau sesuai gambar). Berguna untuk membuat PDF dari foto-foto.',
        icon: <ImageUp className="w-5 h-5" />,
        isNew: true,
      },
    ],
  },
  {
    heading: 'Optimasi & Perbaikan',
    description: 'Kompres, perbaiki, dan tingkatkan kualitas file.',
    features: [
      {
        to: '/compress',
        title: 'Kompres PDF',
        short: 'Kurangi ukuran file.',
        long: 'Pilih dari 3 tingkat kompresi (rendah, sedang, tinggi). Halaman akan dirender ulang sebagai gambar JPEG dengan kualitas yang dapat diatur.',
        icon: <Minimize2 className="w-5 h-5" />,
        isNew: true,
      },
      {
        to: '/repair',
        title: 'Perbaiki PDF',
        short: 'Perbaiki file yang rusak.',
        long: 'Coba dua strategi perbaikan: rebuild ringan (menjaga teks) untuk file yang masih bisa dibaca, atau rasterize ulang untuk file yang sangat rusak.',
        icon: <Wrench className="w-5 h-5" />,
        isNew: true,
      },
    ],
  },
  {
    heading: 'Keamanan & Privasi',
    description: 'Lindungi PDF dengan password.',
    features: [
      {
        to: '/lock',
        title: 'Kunci PDF',
        short: 'Tambahkan password.',
        long: 'Lindungi PDF dengan password. Permission untuk modifikasi, copy, dan anotasi dapat dibatasi otomatis.',
        icon: <Lock className="w-5 h-5" />,
        isNew: true,
      },
      {
        to: '/unlock',
        title: 'Buka Kunci PDF',
        short: 'Hapus password dari PDF.',
        long: 'Buka kunci PDF dengan memasukkan password yang benar. Hasil yang sudah tidak terenkripsi bisa langsung diunduh.',
        icon: <Unlock className="w-5 h-5" />,
        isNew: true,
      },
    ],
  },
  {
    heading: 'Lainnya',
    description: 'Tools tambahan untuk inspeksi dan metadata.',
    features: [
      {
        to: '/inspect',
        title: 'Info & Metadata PDF',
        short: 'Lihat info dan edit metadata.',
        long: 'Lihat ukuran file, jumlah halaman, ukuran halaman, versi PDF, dan status enkripsi. Edit judul, penulis, subjek, kata kunci, dan metadata lainnya.',
        icon: <Info className="w-5 h-5" />,
        isNew: true,
      },
    ],
  },
];

const NEW_COUNT = SECTIONS.flatMap((s) => s.features).filter((f) => f.isNew).length;

export const WhatsNewPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col animate-in fade-in zoom-in-95 duration-500 bg-dotted-grid bg-white dark:bg-zinc-900 transition-all">
      <div className="flex-1 flex flex-col max-w-5xl w-full mx-auto px-6 pt-28 pb-10">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-brand-500 dark:text-zinc-400 dark:hover:text-brand-400 transition-colors w-fit mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Kembali ke beranda
        </Link>

        {/* Hero */}
        <div className="text-center mb-10 md:mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 text-brand-700 dark:text-brand-300 text-xs font-medium mb-4 border border-brand-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            Update terbaru
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">
            <span className="text-brand-500 dark:text-brand-400">{NEW_COUNT} fitur baru</span>{' '}
            untuk PDF Anda
          </h1>
          <p className="text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
            ParafAman sekarang bukan hanya tanda tangan — pisah, gabung, kompres, watermark, dan
            banyak lagi. Semuanya tetap berjalan 100% di browser Anda.
          </p>
        </div>

        {/* Privacy banner */}
        <Card className="p-5 mb-10 bg-gradient-to-br from-brand-50 to-brand-100/50 dark:from-brand-900/20 dark:to-brand-900/5 border-brand-200/50 dark:border-brand-800/50">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Tetap 100% offline & privat</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Setiap fitur di sini berjalan langsung di browser Anda. Tidak ada file yang diunggah
                ke server, tidak ada akun, dan tidak ada data yang dilacak. Dokumen sensitif Anda
                tetap di perangkat Anda.
              </p>
            </div>
          </div>
        </Card>

        {/* Sections */}
        {SECTIONS.map((section) => (
          <section key={section.heading} className="mb-10">
            <div className="mb-5">
              <h2 className="text-xl md:text-2xl font-bold tracking-tight mb-1">
                {section.heading}
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{section.description}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {section.features.map((feature) => (
                <Link key={feature.to} to={feature.to} className="group">
                  <Card className="h-full p-5 transition-all duration-300 hover:scale-[1.01] hover:shadow-md hover:border-brand-500/50">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 group-hover:bg-brand-100 dark:group-hover:bg-brand-900/30 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors shrink-0">
                        {feature.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold text-base group-hover:text-brand-500 transition-colors">
                            {feature.title}
                          </h3>
                          {feature.isNew && (
                            <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-600 dark:text-brand-400">
                              Baru
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-2">
                          {feature.long}
                        </p>
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 dark:text-brand-400 group-hover:gap-2 transition-all">
                          Coba sekarang
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>

      <Footer />
    </div>
  );
};
