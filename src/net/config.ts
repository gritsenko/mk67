/**
 * Настройки подключения к Nakama.
 *
 * Про порт: nakama-js не умеет базовый путь. Внутри клиента URL собирается
 * простой конкатенацией — `${scheme}${host}:${port}` для HTTP API и
 * `${scheme}${host}:${port}/ws` для сокета (см. dist/nakama-js.cjs.js).
 * Поэтому путь реверс-прокси дописывается к порту: "443/game_api" даёт
 * https://dev.gritsenko.biz:443/game_api/v2/... и wss://.../game_api/ws.
 * Выглядит как трюк, потому что это он и есть. На отдельном поддомене
 * (game.gritsenko.biz) port был бы просто "443".
 *
 * Отсюда же следует главный симптом неверной настройки: если из URL пропал
 * префикс /game_api, nginx отвечает 404 — такого location у него просто нет.
 */

/** Порт в адресной строке: у http/https он обычно пуст, а nakama-js его требует. */
function currentPort(): string {
  if (location.port) return location.port;
  return location.protocol === 'https:' ? '443' : '80';
}

/**
 * Разработка через прокси dev-сервера.
 *
 * Когда в .env.local задан VITE_NAKAMA_DEV_PROXY, Vite поднимает прокси
 * /game_api → этот адрес (см. vite.config.ts), а клиент ходит на свой же
 * origin. Браузер при этом остаётся в пределах localhost:5173: тот же
 * протокол, тот же хост, никакого CORS — а до настоящего Nakama запрос
 * доводит dev-сервер.
 *
 * Побочная польза: dev-сервер, открытый с телефона по адресу вида
 * http://192.168.1.5:5173, работает без отдельной настройки — host берётся
 * из location, а не из .env.
 */
const useDevProxy =
  import.meta.env.DEV && (import.meta.env.VITE_NAKAMA_DEV_PROXY ?? '').trim().length > 0;

export const NET_CONFIG = {
  host: useDevProxy ? location.hostname : (import.meta.env.VITE_NAKAMA_HOST ?? 'dev.gritsenko.biz'),
  port: useDevProxy
    ? `${currentPort()}/game_api`
    : (import.meta.env.VITE_NAKAMA_PORT ?? '443/game_api'),
  serverKey: import.meta.env.VITE_NAKAMA_SERVER_KEY ?? '',
  useSSL: useDevProxy
    ? location.protocol === 'https:'
    : (import.meta.env.VITE_NAKAMA_SSL ?? 'true') !== 'false'
} as const;

/** Имя комнаты общего чата. */
export const CHAT_ROOM = 'mk67-global';

/** Сколько сообщений истории подтягиваем при входе. */
export const CHAT_HISTORY_LIMIT = 50;

/** Идентификаторы лидербордов — должны совпадать с server/nakama/modules/leaderboards.lua. */
export const LEADERBOARD_TOTAL = 'wins_total';
export const LEADERBOARD_WEEKLY = 'wins_weekly';

/**
 * Без ключа сервера подключаться бессмысленно. Это не ошибка сборки:
 * игра обязана работать и без бэкенда, просто без сетевых функций.
 */
export function isNetConfigured(): boolean {
  return NET_CONFIG.serverKey.length > 0;
}
