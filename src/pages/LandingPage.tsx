import React from 'react';
import { Link } from 'react-router-dom';
import {
  PenLine,
  Scissors,
  Combine,
  Minimize2,
  LayoutGrid,
  ImageDown,
  ImageUp,
  Shield,
  Lock,
  Unlock,
  FlipVertical,
  Info,
  Hash,
  Stamp,
  Crop,
  Grid3x3,
  Wrench,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Card } from '@/components/ui';
import { Footer } from '@/components/Footer';
import Lottie from 'lottie-react';
import signatureAnimation from '@/assets/signature_animation.json';

interface Tool {
  to: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
}

const TOOLS: Tool[] = [
  {
    to: '/sign',
    title: 'Tanda Tangan PDF',
    description: 'Tambahkan tanda tangan dan stempel ke dokumen PDF.',
    icon: <PenLine className="w-6 h-6" />,
    badge: 'Populer',
  },
  {
    to: '/split',
    title: 'Pisah PDF',
    description: 'Pisahkan halaman PDF menjadi file-file terpisah.',
    icon: <Scissors className="w-6 h-6" />,
  },
  {
    to: '/merge',
    title: 'Gabung PDF',
    description: 'Gabungkan beberapa PDF menjadi satu file.',
    icon: <Combine className="w-6 h-6" />,
  },
  {
    to: '/compress',
    title: 'Kompres PDF',
    description: 'Kurangi ukuran file PDF tanpa kehilangan kualitas.',
    icon: <Minimize2 className="w-6 h-6" />,
  },
  {
    to: '/organize',
    title: 'Atur Halaman',
    description: 'Putar, urutkan ulang, dan hapus halaman PDF.',
    icon: <LayoutGrid className="w-6 h-6" />,
  },
  {
    to: '/to-images',
    title: 'PDF ke Gambar',
    description: 'Ekspor setiap halaman PDF menjadi gambar PNG/JPG.',
    icon: <ImageDown className="w-6 h-6" />,
  },
  {
    to: '/from-images',
    title: 'Gambar ke PDF',
    description: 'Gabungkan beberapa gambar menjadi satu file PDF.',
    icon: <ImageUp className="w-6 h-6" />,
  },
  {
    to: '/page-numbers',
    title: 'Nomor Halaman',
    description: 'Tambahkan nomor halaman ke setiap halaman PDF.',
    icon: <Hash className="w-6 h-6" />,
  },
  {
    to: '/watermark',
    title: 'Watermark PDF',
    description: 'Tambahkan watermark teks atau gambar ke setiap halaman.',
    icon: <Stamp className="w-6 h-6" />,
  },
  {
    to: '/crop',
    title: 'Crop PDF',
    description: 'Potong margin halaman PDF.',
    icon: <Crop className="w-6 h-6" />,
  },
  {
    to: '/n-up',
    title: 'N-up Print',
    description: 'Cetak beberapa halaman per lembar untuk hemat kertas.',
    icon: <Grid3x3 className="w-6 h-6" />,
  },
  {
    to: '/reverse',
    title: 'Balik Halaman',
    description: 'Balik urutan halaman dari belakang ke depan.',
    icon: <FlipVertical className="w-6 h-6" />,
  },
  {
    to: '/lock',
    title: 'Kunci PDF',
    description: 'Tambahkan password untuk melindungi PDF Anda.',
    icon: <Lock className="w-6 h-6" />,
  },
  {
    to: '/unlock',
    title: 'Buka Kunci PDF',
    description: 'Hapus password dari PDF yang dilindungi.',
    icon: <Unlock className="w-6 h-6" />,
  },
  {
    to: '/repair',
    title: 'Perbaiki PDF',
    description: 'Coba perbaiki file PDF yang rusak atau tidak bisa dibuka.',
    icon: <Wrench className="w-6 h-6" />,
  },
  {
    to: '/inspect',
    title: 'Info & Metadata',
    description: 'Lihat informasi file dan edit metadata PDF.',
    icon: <Info className="w-6 h-6" />,
  },
];

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col animate-in fade-in zoom-in-95 duration-500 bg-dotted-grid bg-white dark:bg-zinc-900 transition-all">
      <div className="flex-1 flex flex-col max-w-6xl w-full mx-auto px-6 pt-28 pb-10">
        {/* Hero */}
        <div className="text-center mb-10 md:mb-14">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">
            Alat PDF yang <span className="text-brand-500 dark:text-brand-400">Aman</span>
          </h1>
          <div className="relative">
            <p className="text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
              Tanda tangan, pisah, gabung, dan kelola PDF — semuanya berjalan langsung di browser
              Anda. File tidak pernah diunggah ke server.
            </p>
          </div>
        </div>

        {/* Privacy pill */}
        <div className="flex justify-center items-center mb-8 -my-18">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-xs font-medium border border-brand-200/50 dark:border-brand-800/50">
              <Shield className="w-3.5 h-3.5" />
              100% offline · diproses di browser Anda
            </div>
          </div>

          <div className="inline-flex justify-center">
            <Lottie
              animationData={signatureAnimation}
              loop
              className="w-32 h-32 dark:invert dark:brightness-200 opacity-80"
            />
          </div>
        </div>

        {/* Tool grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOOLS.map((tool) => (
            <Link key={tool.to} to={tool.to} className="group">
              <Card className="h-full p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:border-brand-500/50 cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 group-hover:bg-brand-100 dark:group-hover:bg-brand-900/30 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors shrink-0">
                    {tool.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-base group-hover:text-brand-500 transition-colors">
                        {tool.title}
                      </h3>
                      {tool.badge && (
                        <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-600 dark:text-brand-400">
                          {tool.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      {tool.description}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* What's New Announcement */}
        <Link to="/whats-new" className="block group mt-10">
          <Card className="p-5 sm:p-6 bg-gradient-to-br from-brand-500/10 via-brand-400/5 to-transparent border-brand-500/30 dark:border-brand-400/20 hover:border-brand-500/60 dark:hover:border-brand-400/50 hover:shadow-lg transition-all duration-300 cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-brand-500/15 text-brand-600 dark:text-brand-400 shrink-0 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-semibold text-base sm:text-lg">Banyak fitur baru dirilis!</h3>
                  <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-brand-500 text-white animate-pulse">
                    Baru
                  </span>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Pisah, gabung, kompres, watermark, kunci, dan banyak lagi — semuanya tetap 100%
                  offline.
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-brand-500 dark:text-brand-400 shrink-0 group-hover:translate-x-1 transition-transform" />
            </div>
          </Card>
        </Link>
      </div>

      <Footer />
    </div>
  );
};
