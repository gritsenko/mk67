import { CHAT_ROOM, CHAT_HISTORY_LIMIT } from './config';
import { connect, getClient, getNickname, getSession, getSocket } from './client';

/** Nakama не экспортирует enum типов канала. 1 = Room, 2 = Direct, 3 = Group. */
const CHANNEL_TYPE_ROOM = 1;

export interface ChatMessage {
  id: string;
  senderId: string;
  username: string;
  text: string;
  createdAt: Date;
  own: boolean;
}

let channelId: string | null = null;
let joining: Promise<boolean> | null = null;
const messageListeners = new Set<(m: ChatMessage) => void>();

/**
 * content приезжает по-разному: сокет его уже распарсил в объект,
 * а история через REST отдаёт сырую JSON-строку. Приводим к одному виду.
 *
 * Имя автора кладём в само сообщение: username аккаунта технический
 * (см. technicalUsername в client.ts), показывать его нельзя.
 */
function parseContent(content: unknown): { text: string; name: string } {
  let payload: unknown = content;

  if (typeof content === 'string') {
    try {
      payload = JSON.parse(content);
    } catch {
      // Не JSON — считаем всю строку текстом сообщения.
      return { text: content, name: '' };
    }
  }

  if (payload && typeof payload === 'object') {
    const obj = payload as { text?: unknown; name?: unknown };
    return {
      text: obj.text === undefined ? '' : String(obj.text),
      name: obj.name === undefined ? '' : String(obj.name)
    };
  }
  return { text: '', name: '' };
}

function toChatMessage(raw: {
  message_id?: string;
  sender_id?: string;
  username?: string;
  content?: unknown;
  create_time?: string;
}): ChatMessage {
  const senderId = raw.sender_id ?? '';
  const { text, name } = parseContent(raw.content);
  return {
    id: raw.message_id ?? `${senderId}-${raw.create_time ?? ''}`,
    senderId,
    // Имя из сообщения — исторический снимок на момент отправки;
    // на технический username откатываемся только если его там нет.
    username: name || raw.username || 'неизвестный',
    text,
    createdAt: raw.create_time ? new Date(raw.create_time) : new Date(),
    own: senderId === getSession()?.user_id
  };
}

export function onMessage(fn: (m: ChatMessage) => void): () => void {
  messageListeners.add(fn);
  return () => messageListeners.delete(fn);
}

/** Вход в общую комнату. persistence = true — ради этого история и живёт на сервере. */
export function joinChat(): Promise<boolean> {
  if (channelId) return Promise.resolve(true);
  if (joining) return joining;

  joining = (async () => {
    const ok = await connect();
    const socket = getSocket();
    if (!ok || !socket) return false;

    try {
      socket.onchannelmessage = msg => {
        const mapped = toChatMessage(msg);
        if (mapped.text) messageListeners.forEach(fn => fn(mapped));
      };
      const channel = await socket.joinChat(CHAT_ROOM, CHANNEL_TYPE_ROOM, true, false);
      channelId = channel.id ?? null;
      return channelId !== null;
    } catch (err) {
      console.warn('[chat] не удалось войти в канал:', err);
      return false;
    } finally {
      joining = null;
    }
  })();

  return joining;
}

/** Реконнект отдаёт новый channel id, поэтому сбрасываем свой при разрыве. */
export function resetChannel(): void {
  channelId = null;
}

/**
 * История канала. Сервер отдаёт её от новых к старым (forward = false),
 * а показывать надо от старых к новым — поэтому разворачиваем.
 */
export async function loadHistory(): Promise<ChatMessage[]> {
  const ok = await joinChat();
  const client = getClient();
  const session = getSession();
  if (!ok || !client || !session || !channelId) return [];

  try {
    const list = await client.listChannelMessages(session, channelId, CHAT_HISTORY_LIMIT, false);
    const messages = (list.messages ?? []).map(toChatMessage).filter(m => m.text);
    return messages.reverse();
  } catch (err) {
    console.warn('[chat] не удалось загрузить историю:', err);
    return [];
  }
}

export async function sendMessage(text: string): Promise<boolean> {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (trimmed.length > 300) return false;

  const ok = await joinChat();
  const socket = getSocket();
  if (!ok || !socket || !channelId) return false;

  try {
    await socket.writeChatMessage(channelId, { text: trimmed, name: getNickname() });
    return true;
  } catch (err) {
    console.warn('[chat] сообщение не ушло:', err);
    return false;
  }
}
