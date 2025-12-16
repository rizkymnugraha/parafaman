import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Eye, Server, Lock } from 'lucide-react';
import { Footer } from '@/components/Footer';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col animate-in fade-in zoom-in-95 duration-500 overflow-auto">
      <div className="flex-1 max-w-2xl mx-auto px-6 py-20 pt-24">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Beranda
        </Link>

        <h1 className="text-3xl font-bold mb-8">Kebijakan Privasi</h1>

        <div className="space-y-8 text-zinc-600 dark:text-zinc-400">
          <p className="text-lg">
            ParafAman berkomitmen untuk melindungi privasi Anda. Kebijakan ini menjelaskan bagaimana
            aplikasi kami menangani data Anda.
          </p>

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
              <Server className="w-5 h-5 text-brand-500" />
              <h2 className="text-xl font-semibold">Tidak Ada Pengumpulan Data</h2>
            </div>
            <p>
              ParafAman adalah aplikasi yang berjalan sepenuhnya di browser Anda. ParafAman{' '}
              <strong>tidak mengumpulkan, menyimpan, atau mengirimkan</strong> data apapun ke server
              eksternal.
            </p>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
              <Eye className="w-5 h-5 text-brand-500" />
              <h2 className="text-xl font-semibold">Pemrosesan Lokal</h2>
            </div>
            <p>
              Semua dokumen PDF yang Anda buka diproses langsung di perangkat Anda. File tidak
              pernah meninggalkan browser Anda dan tidak diunggah ke server manapun.
            </p>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
              <Lock className="w-5 h-5 text-brand-500" />
              <h2 className="text-xl font-semibold">Penyimpanan Lokal</h2>
            </div>
            <p>
              Aplikasi ini menggunakan penyimpanan lokal browser (localStorage) hanya untuk
              menyimpan preferensi pengguna seperti tema tampilan. Data ini tersimpan di perangkat
              Anda dan dapat dihapus kapan saja melalui pengaturan browser.
            </p>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
              <Shield className="w-5 h-5 text-brand-500" />
              <h2 className="text-xl font-semibold">Keamanan Dokumen</h2>
            </div>
            <p>
              Karena semua pemrosesan dilakukan secara offline, dokumen sensitif Anda tetap aman dan
              privat. Tidak ada risiko kebocoran data melalui jaringan internet.
            </p>
          </section>

          <section className="space-y-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Pertanyaan?</h2>
            <p>
              Jika Anda memiliki pertanyaan tentang kebijakan privasi ini, silakan hubungi melalui
              GitHub.
            </p>
          </section>
        </div>
      </div>

      <Footer showPrivacyLink={false} />
    </div>
  );
};
