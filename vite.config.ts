import { defineConfig, loadEnv, type Plugin } from 'vite';
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

export default defineConfig(({ mode }) => {
  // Читаем .env* вручную: import.meta.env здесь ещё нет, это код сборщика.
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  /**
   * Бэкенд через dev-сервер.
   *
   * Если задан VITE_NAKAMA_DEV_PROXY, всё под /game_api уезжает на указанный
   * адрес, а клиент ходит на свой же localhost:5173 (см. src/net/config.ts).
   * Это снимает сразу три местные болячки разработки:
   *
   *  - hairpin NAT: изнутри домашней сети https://dev.gritsenko.biz отвечает
   *    через раз, и прокси можно нацелить прямо на http://192.168.1.12;
   *  - страница открыта по http, а бэкенд по https — никаких смешанных схем;
   *  - запросы становятся same-origin, то есть без CORS и preflight.
   *
   * ws: true обязателен — игровой сокет идёт по тому же пути (/game_api/ws).
   */
  const proxyTarget = env.VITE_NAKAMA_DEV_PROXY?.trim();

  return {
    base: './',
    plugins: [versionTrackerPlugin()],
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version || '1.0.0'),
      __BUILD_TIME__: buildTime
    },
    server: proxyTarget
      ? {
          proxy: {
            '/game_api': {
              target: proxyTarget,
              changeOrigin: true,
              // Прокси может смотреть на IP, а сертификат выписан на домен.
              secure: false,
              ws: true
            }
          }
        }
      : undefined,
    build: {
      rollupOptions: {
        input: {
          main: r('index.html'),
          heroLab: r('hero-lab.html')
        }
      }
    }
  };
});
