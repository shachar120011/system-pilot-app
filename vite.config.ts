import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['recharts'],
          ai: ['@google/genai'],
          pdf: ['pdfjs-dist'],
          icons: ['lucide-react'],
        },
      },
    },
  },
  server: {
    port: 5173,
  },
});
