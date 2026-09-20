/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Хост Nakama. Например dev.gritsenko.biz */
  readonly VITE_NAKAMA_HOST?: string;
  /**
   * Порт Nakama. Сюда же дописывается путь реверс-прокси — см. комментарий
   * в src/net/config.ts. Например "443/game_api".
   */
  readonly VITE_NAKAMA_PORT?: string;
  /** Ключ сервера Nakama (socket.server_key). Публичен: попадает в бандл. */
  readonly VITE_NAKAMA_SERVER_KEY?: string;
  /** "true" | "false" — использовать ли HTTPS/WSS. */
  readonly VITE_NAKAMA_SSL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/**
 * Подставляются на сборке через `define` в vite.config.ts.
 * Объявление нужно, чтобы про них знал tsc — в рантайме это литералы.
 */
declare const __APP_VERSION__: string;
declare const __BUILD_TIME__: number;
