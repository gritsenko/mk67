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
 */
export const NET_CONFIG = {
  host: import.meta.env.VITE_NAKAMA_HOST ?? 'dev.gritsenko.biz',
  port: import.meta.env.VITE_NAKAMA_PORT ?? '443/game_api',
  serverKey: import.meta.env.VITE_NAKAMA_SERVER_KEY ?? '',
  useSSL: (import.meta.env.VITE_NAKAMA_SSL ?? 'true') !== 'false'
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
