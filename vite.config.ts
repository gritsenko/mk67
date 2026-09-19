import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: r('index.html'),
        heroLab: r('hero-lab.html')
      }
    }
  }
});
