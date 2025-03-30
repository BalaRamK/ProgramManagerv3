import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['react-quill'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-quill': ['react-quill'],
        },
      },
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: '',
      },
    },
  },
  resolve: {
    alias: {
      'quill': path.resolve(__dirname, 'node_modules/quill'),
      '@': path.resolve(__dirname, './src'),
    },
  },
});
