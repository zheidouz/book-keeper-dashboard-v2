import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'lucide-react',
      'date-fns',
      'clsx',
      'class-variance-authority',
      'tailwind-merge',
    ],
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    cssMinify: 'lightningcss',
    minify: 'terser',
    target: 'es2020',
    cssCodeSplit: true,
    modulePreload: {
      polyfill: false,
    },
    reportCompressedSize: false,
    chunkSizeWarningLimit: 400,
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        passes: 2,
      },
      mangle: {
        properties: {
          regex: /^_/,
        },
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('/node_modules/react-dom') || id.includes('/node_modules/react/') || id.includes('/node_modules/react-router')) return 'vendor-react';
          if (id.includes('/node_modules/@tanstack/react-query')) return 'vendor-query';
          if (id.includes('/node_modules/react-hook-form') || id.includes('/node_modules/@hookform/resolvers') || id.includes('/node_modules/zod')) return 'vendor-form';
          if (id.includes('/node_modules/lucide-react') || id.includes('/node_modules/date-fns') || id.includes('/node_modules/clsx') || id.includes('/node_modules/class-variance-authority') || id.includes('/node_modules/tailwind-merge')) return 'vendor-ui';
          if (id.includes('/node_modules/lenis')) return 'vendor-smooth';
        },
      },
    },
  },
});
