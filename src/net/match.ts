/**
 * Онлайн-бой 1 на 1 поверх relayed-матча Nakama.
 *
 * Модель — host-authoritative: бой целиком считает хост, гость шлёт только свой
 * ввод и получает снимки состояния. Серверного кода это не требует: Nakama здесь
 * работает ретранслятором.
 *
 * Комната адресуется коротким кодом. Nakama умеет именованные матчи —
 * createMatch(name) делает детерминированный id из имени, поэтому обе стороны
 * попадают в один матч, вызвав createMatch с одинаковым именем. Отдельное
 * хранилище кодов не нужно.
 *
 * Здесь только транспорт: ни DOM, ни игровой логики.
 */
import type { Match, MatchData, MatchPresenceEvent } from '@heroiclabs/nakama-js';
import { connect, getSocket } from './client';

export type MatchRole = 'host' | 'guest';

export type MatchPhase =
  | 'idle'        // вне онлайна
  | 'connecting'  // создаём или ищем комнату
  | 'waiting'     // хост ждёт соперника
  | 'playing'     // бой идёт
  | 'ended';      // соперник вышел или связь потеряна

export const OP = {
  /** гость → хост: выбранный персонаж */
  HELLO: 1,
  /** хост → гость: персонажи обеих сторон, бой начинается */
  START: 2,
  /** гость → хост: состояние клавиш */
  INPUT: 3,
  /** хост → гость: снимок боя */
  STATE: 4
} as const;

/** Без похожих символов: 0/O и 1/I на слух и на вид не различить. */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 5;
const MATCH_PREFIX = 'mk67-';

export interface MatchCallbacks {
  /** Обе стороны: бой начинается, персонажи известны. */
  onStart: (payload: { hostCharId: string; guestCharId: string }) => void;
  /** Хост: пришёл ввод гостя. */
  onInput: (input: unknown) => void;
  /** Гость: пришёл снимок состояния. */
  onState: (state: unknown) => void;
  /** Соперник отключился или матч развалился. */
  onOpponentLeft: () => void;
  /** Смена фазы — для отрисовки статуса в UI. */
  onPhase: (phase: MatchPhase, detail?: string) => void;
}

let callbacks: MatchCallbacks | null = null;
let matchId: string | null = null;
let role: MatchRole = 'host';
let phase: MatchPhase = 'idle';
let roomCode = '';
let ownCharId = '';
let opponentPresent = false;

const decoder = new TextDecoder();

export function setCallbacks(next: MatchCallbacks): void {
  callbacks = next;
}

export function getRole(): MatchRole {
  return role;
}

export function getPhase(): MatchPhase {
  return phase;
}

export function getRoomCode(): string {
  return roomCode;
}

export function isHost(): boolean {
  return role === 'host';
}

/** Идёт ли сейчас сетевой бой. */
export function isOnlineMatchActive(): boolean {
  return phase === 'playing';
}

function setPhase(next: MatchPhase, detail?: string): void {
  phase = next;
  callbacks?.onPhase(next, detail);
}

function randomCode(): string {
  let out = '';
  const bytes = new Uint8Array(CODE_LENGTH);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(bytes);
  else for (let i = 0; i < CODE_LENGTH; i++) bytes[i] = Math.floor(Math.random() * 256);
  for (let i = 0; i < CODE_LENGTH; i++) out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return out;
}

/** Код вводят руками, поэтому регистр и похожие символы приводим к одному виду. */
export function normalizeCode(raw: string): string {
  const upper = raw.trim().toUpperCase();
  let out = '';
  for (const ch of upper) {
    if (CODE_ALPHABET.includes(ch)) out += ch;
  }
  return out;
}

function send(op: number, payload: unknown): void {
  const socket = getSocket();
  if (!socket || !matchId) return;
  try {
    void socket.sendMatchState(matchId, op, JSON.stringify(payload));
  } catch (err) {
    console.warn('[match] не удалось отправить пакет:', err);
  }
}

function decode(data: Uint8Array): unknown {
  try {
    return JSON.parse(decoder.decode(data));
  } catch {
    return null;
  }
}

function handleMatchData(md: MatchData): void {
  if (md.match_id !== matchId) return;
  const payload = decode(md.data);
  if (payload === null) return;

  switch (md.op_code) {
    case OP.HELLO: {
      // Только хост принимает HELLO: гость представился, можно начинать.
      if (role !== 'host') return;
      const guestCharId = String((payload as { charId?: unknown }).charId ?? '');
      if (!guestCharId) return;
      opponentPresent = true;
      send(OP.START, { hostCharId: ownCharId, guestCharId });
      setPhase('playing');
      callbacks?.onStart({ hostCharId: ownCharId, guestCharId });
      return;
    }
    case OP.START: {
      if (role !== 'guest') return;
      const p = payload as { hostCharId?: unknown; guestCharId?: unknown };
      opponentPresent = true;
      setPhase('playing');
      callbacks?.onStart({
        hostCharId: String(p.hostCharId ?? ''),
        guestCharId: String(p.guestCharId ?? '')
      });
      return;
    }
    case OP.INPUT:
      if (role === 'host') callbacks?.onInput(payload);
      return;
    case OP.STATE:
      if (role === 'guest') callbacks?.onState(payload);
      return;
  }
}

function handlePresence(evt: MatchPresenceEvent): void {
  if (evt.match_id !== matchId) return;

  if (evt.leaves?.length && opponentPresent) {
    setPhase('ended', 'Соперник вышел');
    callbacks?.onOpponentLeft();
  }
}

function attachHandlers(): boolean {
  const socket = getSocket();
  if (!socket) return false;
  socket.onmatchdata = handleMatchData;
  socket.onmatchpresence = handlePresence;
  return true;
}

/**
 * Создаёт комнату и возвращает код для друга.
 * Имя матча детерминировано, поэтому теоретически возможно совпадение кодов —
 * если в созданной комнате уже кто-то есть, берём новый код.
 */
export async function createRoom(charId: string): Promise<string | null> {
  const ok = await connect();
  const socket = getSocket();
  if (!ok || !socket) {
    setPhase('ended', 'Нет связи с сервером');
    return null;
  }

  role = 'host';
  ownCharId = charId;
  opponentPresent = false;
  setPhase('connecting');

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode();
    try {
      const match: Match = await socket.createMatch(MATCH_PREFIX + code);
      // В свежей комнате есть только мы. Если нет — код занят чужим боем.
      if ((match.presences?.length ?? 0) > 0) {
        await socket.leaveMatch(match.match_id);
        continue;
      }
      matchId = match.match_id;
      roomCode = code;
      attachHandlers();
      setPhase('waiting');
      return code;
    } catch (err) {
      console.warn('[match] не удалось создать комнату:', err);
    }
  }

  setPhase('ended', 'Не удалось создать комнату');
  return null;
}

/** Вход по коду. Присоединение к именованному матчу — тот же createMatch. */
export async function joinRoom(rawCode: string, charId: string): Promise<boolean> {
  const code = normalizeCode(rawCode);
  if (code.length !== CODE_LENGTH) {
    setPhase('ended', 'Код состоит из 5 символов');
    return false;
  }

  const ok = await connect();
  const socket = getSocket();
  if (!ok || !socket) {
    setPhase('ended', 'Нет связи с сервером');
    return false;
  }

  role = 'guest';
  ownCharId = charId;
  opponentPresent = false;
  setPhase('connecting');

  try {
    const match: Match = await socket.createMatch(MATCH_PREFIX + code);
    // Пустая комната означает, что хоста там нет: код неверный или бой уже закрыт.
    if ((match.presences?.length ?? 0) === 0) {
      await socket.leaveMatch(match.match_id);
      setPhase('ended', 'Комната не найдена');
      return false;
    }

    matchId = match.match_id;
    roomCode = code;
    attachHandlers();
    send(OP.HELLO, { charId });
    return true;
  } catch (err) {
    console.warn('[match] не удалось войти в комнату:', err);
    setPhase('ended', 'Комната не найдена');
    return false;
  }
}

export function sendInput(input: unknown): void {
  if (role !== 'guest' || phase !== 'playing') return;
  send(OP.INPUT, input);
}

export function sendState(state: unknown): void {
  if (role !== 'host' || phase !== 'playing') return;
  send(OP.STATE, state);
}

export async function leaveRoom(): Promise<void> {
  const socket = getSocket();
  const id = matchId;

  matchId = null;
  roomCode = '';
  opponentPresent = false;
  setPhase('idle');

  if (socket && id) {
    try {
      await socket.leaveMatch(id);
    } catch {
      /* матч мог уже закрыться — выходим молча */
    }
  }
}
