import { defineConfig, type Plugin } from 'vite';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));
const pkg = JSON.parse(readFileSync(r('package.json'), 'utf-8'));
const buildTime = Date.now();

function versionTrackerPlugin(): Plugin {
  return {
    name: 'version-tracker',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify(
          {
            version: pkg.version || '1.0.0',
            buildTime,
            builtAt: new Date(buildTime).toISOString()
          },
          null,
          2
        )
      });
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || '';
        if (url === '/version.json' || url.startsWith('/version.json?')) {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
          res.end(
            JSON.stringify({
              version: pkg.version || '1.0.0',
              buildTime,
              builtAt: new Date(buildTime).toISOString()
            })
          );
          return;
        }
        next();
      });
    }
  };
}

export default defineConfig({
  base: './',
  plugins: [versionTrackerPlugin()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version || '1.0.0'),
    __BUILD_TIME__: buildTime
  },
  build: {
    rollupOptions: {
      input: {
        main: r('index.html'),
        heroLab: r('hero-lab.html')
      }
    }
  }
});
