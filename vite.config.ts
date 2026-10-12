import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };

// React Host serves the build from the package root of its own origin: relative base, no
// SPA fallback (use HashRouter if routing is needed), no service worker, no CDN assets.
export default defineConfig({
  base: './',
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(process.env.RH_APP_VERSION ?? pkg.version),
    __APP_NAME__: JSON.stringify(process.env.RH_APP_NAME ?? 'Quick Notes'),
  },
  build: {
    // Android 8 WebView without updates is Chrome 69: transpile syntax down to it.
    target: 'chrome69',
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
  },
});
