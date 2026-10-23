import tailwindcss from '@tailwindcss/postcss';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig } from 'vite';
export default defineConfig({
  css: { postcss: { plugins: [tailwindcss()] } },
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, '.') } },
  server: { host: '127.0.0.1', port: 3010, strictPort: true },
  preview: { host: '127.0.0.1', port: 3010, strictPort: true },
  build: { outDir: 'dist-vercel' },
});
