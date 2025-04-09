import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import mdx from '@mdx-js/rollup';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    mdx({
      remarkPlugins: [remarkGfm],
      rehypePlugins: [rehypeHighlight],
    }),
    react(),
  ],
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
    outDir: 'dist',
    sourcemap: true,
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
      '@': '/src',
      'quill': path.resolve(__dirname, 'node_modules/quill'),
    },
  },
  server: {
    port: 3000,
  },
});
