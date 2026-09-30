import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  base: './',
  build: {
    outDir: '../assets/room', emptyOutDir: true, manifest: true,
    modulePreload: false, cssCodeSplit: false, sourcemap: true,
    rolldownOptions: {
      input: fileURLToPath(new URL('./src/main.ts', import.meta.url)),
      preserveEntrySignatures: 'strict',
      output: { entryFileNames: 'room-[hash].js', assetFileNames: '[name]-[hash][extname]' }
    }
  }
});
