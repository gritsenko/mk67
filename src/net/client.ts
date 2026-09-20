import { Client, Session, type Socket } from '@heroiclabs/nakama-js';
import { NET_CONFIG, isNetConfigured } from './config';

export type NetStatus = 'disabled' | 'offline' | 'connecting' | 'online';

const LS_DEVICE = 'mk67.deviceId';
const LS_TOKEN = 'mk67.token';
const LS_REFRESH = 'mk67.refreshToken';
const LS_NICK = 'mk67.nickname';

/** localStorage недоступен в приватных окнах и при запрете сторонних данных. */
function lsGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function lsSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* работаем дальше без сохранения */
  }
}

function randomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `dev-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getDeviceId(): string {
  let id = lsGet(LS_DEVICE);
  if (!id) {
    id = randomId();
    lsSet(LS_DEVICE, id);
  }
  return id;
}

/**
 * Технический логин аккаунта — только ASCII, и это не косметика.
 *
 * nakama-js 2.8.0 разбирает JWT так: JSON.parse(atob(payload)). atob отдаёт
 * байтовую строку, поэтому любой не-ASCII username (а ник «Боец» именно такой)
 * ломает разбор с «Bad control character in string literal in JSON».
 * Поэтому username у нас машинный и никогда не показывается, а человеческое
 * имя живёт отдельно в display_name — оно в токен не попадает.
 */
function technicalUsername(deviceId: string): string {
  const cleaned = deviceId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 24);
  return `u${cleaned || Date.now().toString(36)}`;
}

function defaultNickname(): string {
  return `Боец${Math.floor(1000 + Math.random() * 9000)}`;
}

let client: Client | null = null;
let session: Session | null = null;
let socket: Socket | null = null;
let displayName = lsGet(LS_NICK) ?? '';
let status: NetStatus = isNetConfigured() ? 'offline' : 'disabled';
let connectPromise: Promise<boolean> | null = null;

const statusListeners = new Set<(s: NetStatus) => void>();

function notifyListeners(): void {
  statusListeners.forEach(fn => fn(status));
}

function setStatus(next: NetStatus): void {
  if (status === next) return;
  status = next;
  notifyListeners();
}

export function onStatusChange(fn: (s: NetStatus) => void): () => void {
  statusListeners.add(fn);
  fn(status);
  return () => statusListeners.delete(fn);
}

export function getStatus(): NetStatus {
  return status;
}

export function getClient(): Client | null {
  return client;
}

export function getSession(): Session | null {
  return session;
}

export function getSocket(): Socket | null {
  return socket;
}

/** Человеческое имя игрока (display_name), а не технический username. */
export function getNickname(): string {
  return displayName;
}

/** Восстанавливаем сохранённую сессию, если refresh-токен ещё жив. */
async function restoreSession(c: Client): Promise<Session | null> {
  const token = lsGet(LS_TOKEN);
  const refresh = lsGet(LS_REFRESH);
  if (!token || !refresh) return null;

  try {
    const restored = Session.restore(token, refresh);
    const nowSec = Date.now() / 1000;
    if (restored.isrefreshexpired(nowSec)) return null;
    if (restored.isexpired(nowSec)) return await c.sessionRefresh(restored);
    return restored;
  } catch {
    return null;
  }
}

function persistSession(s: Session): void {
  lsSet(LS_TOKEN, s.token);
  lsSet(LS_REFRESH, s.refresh_token);
}

/** У свежего аккаунта display_name пуст — проставляем имя по умолчанию. */
async function syncDisplayName(c: Client, s: Session): Promise<void> {
  const account = await c.getAccount(s);
  const existing = account.user?.display_name ?? '';

  if (existing) {
    displayName = existing;
    lsSet(LS_NICK, existing);
    return;
  }

  const initial = lsGet(LS_NICK) || defaultNickname();
  await c.updateAccount(s, { display_name: initial });
  displayName = initial;
  lsSet(LS_NICK, initial);
}

/**
 * Подключение идемпотентно: повторные вызовы возвращают тот же промис.
 * Любая сетевая ошибка не должна ронять игру — возвращаем false и остаёмся офлайн.
 */
export function connect(): Promise<boolean> {
  if (!isNetConfigured()) {
    setStatus('disabled');
    return Promise.resolve(false);
  }
  if (status === 'online') return Promise.resolve(true);
  if (connectPromise) return connectPromise;

  connectPromise = (async () => {
    setStatus('connecting');
    try {
      client = new Client(NET_CONFIG.serverKey, NET_CONFIG.host, NET_CONFIG.port, NET_CONFIG.useSSL);

      const deviceId = getDeviceId();
      session =
        (await restoreSession(client)) ??
        (await client.authenticateDevice(deviceId, true, technicalUsername(deviceId)));
      persistSession(session);

      await syncDisplayName(client, session);

      socket = client.createSocket(NET_CONFIG.useSSL, false);
      socket.ondisconnect = () => {
        setStatus('offline');
        scheduleReconnect();
      };
      await socket.connect(session, true);

      setStatus('online');
      notifyListeners();
      return true;
    } catch (err) {
      console.warn('[net] не удалось подключиться к Nakama:', err);
      setStatus('offline');
      return false;
    } finally {
      connectPromise = null;
    }
  })();

  return connectPromise;
}

let reconnectTimer: number | undefined;
let reconnectDelay = 2000;

function scheduleReconnect(): void {
  if (reconnectTimer !== undefined) return;
  reconnectTimer = window.setTimeout(async () => {
    reconnectTimer = undefined;
    const ok = await connect();
    // Растём до минуты, чтобы не долбить лежащий сервер.
    reconnectDelay = ok ? 2000 : Math.min(reconnectDelay * 2, 60000);
  }, reconnectDelay);
}

export class NicknameError extends Error {}

/**
 * Меняем display_name. Username аккаунта при этом не трогаем — см. комментарий
 * к technicalUsername.
 *
 * Оговорка: Nakama не проверяет display_name на уникальность, поэтому двух
 * одинаковых ников сервер не запретит.
 */
export async function setNickname(raw: string): Promise<void> {
  const name = raw.trim();
  if (name.length < 3 || name.length > 16) {
    throw new NicknameError('Ник должен быть от 3 до 16 символов');
  }
  if (!/^[\wА-Яа-яЁё][\wА-Яа-яЁё .-]*$/u.test(name)) {
    throw new NicknameError('Допустимы буквы, цифры, пробел, точка и дефис');
  }

  const ok = await connect();
  if (!ok || !client || !session) throw new NicknameError('Нет связи с сервером');

  try {
    await client.updateAccount(session, { display_name: name });
  } catch (err) {
    console.warn('[net] смена ника не удалась:', err);
    throw new NicknameError('Не удалось сменить ник');
  }

  displayName = name;
  lsSet(LS_NICK, name);
  notifyListeners();
}
