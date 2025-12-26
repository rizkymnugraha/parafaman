import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, AlertCircle, Shield } from 'lucide-react';
import { Card } from '@/components/ui';
import { Footer } from '@/components/Footer';
import { PasswordInputModal } from '@/components/PasswordInputModal';
import { useOpenPdf } from '@/hooks';
import { usePdfStore } from '@/store/pdfStore';
import Lottie from 'lottie-react';
import signatureAnimation from '@/assets/signature_animation.json';
import landingIllustration from '@/assets/landing.svg';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const { setPdfData } = usePdfStore();

  const {
    loading,
    error,
    isPasswordModalOpen,
    passwordError,
    passwordLoading,
    openFile,
    handlePasswordSubmit,
    handlePasswordModalClose,
  } = useOpenPdf({
    onSuccess: (arrayBuffer, doc, numPages, password, filename) => {
      setPdfData(arrayBuffer, doc, numPages, password, filename);
      navigate('/editor');
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await openFile(file);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const file = e.dataTransfer.files?.[0];
      if (!file) return;
      await openFile(file);
    },
    [openFile]
  );

  return (
    <div className="min-h-screen md:h-screen flex flex-col animate-in fade-in zoom-in-95 duration-500 bg-dotted-grid bg-white dark:bg-zinc-900 transition-all md:overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto">
        {/* Left Section - Copy */}
        <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-6 pb-0 md:py-8 md:px-6 lg:py-10 lg:px-8">
          <div className="md:max-w-lg pt-24 md:p-0">
            <div className="flex relative">
              <Lottie
                animationData={signatureAnimation}
                loop={true}
                className="w-64 md:w-48 md:-right-18 -right-4 bottom-0 absolute dark:invert dark:brightness-200 opacity-20 md:opacity-100"
              />
              <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-4">
                Tanda Tangan Digital yang{' '}
                <span className="text-brand-500 dark:text-brand-400 shine-effect cursor-default transition-transform duration-200 hover:scale-105">
                  Aman
                </span>
              </h1>
            </div>

            {/* Landing Illustration - visible on desktop */}
            <div className="hidden md:block">
              <img
                src={landingIllustration}
                alt="Digital signature illustration"
                className="w-full max-w-md opacity-90"
              />
            </div>

            <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Tambahkan tanda tangan dan stempel ke dokumen PDF Anda dengan mudah dan aman. Semua
              proses dilakukan langsung di browser Anda.
            </p>
          </div>
        </div>

        {/* Right Section - Input */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:py-8 md:px-6 lg:py-10 lg:px-8">
          <div className="w-full max-w-sm space-y-4 rounded-3xl">
            <label
              className="cursor-pointer block group"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Card
                className={`w-full p-8 text-center border-dashed border-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${
                  isDragging
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 scale-[1.02] shadow-lg'
                    : 'hover:border-brand-500/50'
                }`}
              >
                {error && (
                  <div className="bg-red-500/10 text-red-600 dark:text-red-400 p-3 rounded-lg mb-4 text-sm flex items-center gap-2 animate-in slide-in-from-top-2">
                    <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                  </div>
                )}
                <div className="flex flex-col items-center gap-3">
                  <div
                    className={`p-4 rounded-full transition-colors duration-300 ${
                      isDragging
                        ? 'bg-brand-100 dark:bg-brand-900/30'
                        : 'bg-zinc-100 dark:bg-zinc-800 group-hover:bg-brand-100 dark:group-hover:bg-brand-900/30'
                    }`}
                  >
                    {loading ? (
                      <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <FolderOpen
                        className={`w-8 h-8 transition-colors duration-300 ${
                          isDragging ? 'text-brand-500' : 'text-zinc-400 group-hover:text-brand-500'
                        }`}
                      />
                    )}
                  </div>
                  <div className="space-y-1">
                    <span
                      className={`text-base font-semibold transition-colors block ${
                        isDragging ? 'text-brand-500' : 'group-hover:text-brand-500'
                      }`}
                    >
                      {loading
                        ? 'Memuat...'
                        : isDragging
                          ? 'Lepaskan file di sini'
                          : 'Buka Dokumen PDF'}
                    </span>
                    <span className="text-sm text-zinc-500 dark:text-zinc-400 hidden md:block">
                      Klik atau seret file PDF ke sini
                    </span>
                  </div>
                </div>
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={loading}
                />
              </Card>
            </label>

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-brand-700 dark:text-brand-400 font-semibold text-sm">
                <Shield className="w-4 h-4" />
                <span>Jaminan Keamanan & Privasi</span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                Dokumen Anda diproses <b>100% secara offline</b> di browser perangkat Anda. Tidak
                ada data yang diunggah ke server, menjamin privasi dan keamanan dokumen sensitif
                Anda tetap terjaga sepenuhnya.
              </p>

              {/* Landing Illustration - visible on mobile only */}
              <div className="md:hidden mt-4">
                <img
                  src={landingIllustration}
                  alt="Digital signature illustration"
                  className="w-full opacity-90"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      <PasswordInputModal
        isOpen={isPasswordModalOpen}
        loading={passwordLoading}
        error={passwordError}
        onClose={handlePasswordModalClose}
        onSubmit={handlePasswordSubmit}
      />
    </div>
  );
};
