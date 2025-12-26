import { defineConfig } from 'vite';
import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['pdfjs-dist'],
  },
  worker: {
    format: 'es',
  },
  build: {
    // Code splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'pdf-lib': ['pdf-lib-plus-encrypt'],
          pdfjs: ['pdfjs-dist'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-tooltip', 'lucide-react'],
        },
      },
    },
    // Enable source maps for error tracking (optional)
    sourcemap: false,
    // Increase chunk size warning limit (PDF libs are large)
    chunkSizeWarningLimit: 1000,
  },
});
