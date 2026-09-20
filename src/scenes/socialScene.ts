/**
 * DOM-слой сетевых функций: статус подключения, ник, чат и таблица лидеров.
 * Транспорт живёт в src/net/, здесь только UI и обработчики.
 *
 * Всё построено так, чтобы отсутствие сервера не ломало игру: при статусе
 * 'offline' или 'disabled' панели просто сообщают, что связи нет.
 */
import {
  connect,
  getNickname,
  getStatus,
  NicknameError,
  onStatusChange,
  setNickname,
  type NetStatus
} from '../net/client';
import { joinChat, loadHistory, onMessage, sendMessage, type ChatMessage } from '../net/chat';
import { BOARDS, loadLeaderboard, type BoardId } from '../net/leaderboard';
import { isNetConfigured } from '../net/config';

const byId = (id: string) => document.getElementById(id);

const STATUS_TEXT: Record<NetStatus, string> = {
  disabled: 'сеть не настроена',
  offline: 'нет связи',
  connecting: 'подключение…',
  online: 'в сети'
};

/* --------------------------------------------------------------- статус */

function renderStatus(status: NetStatus): void {
  const dot = byId('netDot');
  const nick = byId('netNick');

  if (dot) {
    dot.className = 'net-dot net-dot--' + status;
    dot.title = STATUS_TEXT[status];
  }
  if (nick) nick.textContent = getNickname() || STATUS_TEXT[status];

  const changeBtn = byId('btnChangeNick');
  if (changeBtn) changeBtn.classList.toggle('hidden', status !== 'online');
}

/* ------------------------------------------------------------------ ник */

function closeNickEditor(): void {
  byId('nickEditor')?.classList.add('hidden');
  byId('netNickRow')?.classList.remove('hidden');
}

function openNickEditor(): void {
  const editor = byId('nickEditor');
  const input = byId('nickInput') as HTMLInputElement | null;
  if (!editor || !input) return;

  byId('netNickRow')?.classList.add('hidden');
  editor.classList.remove('hidden');
  input.value = getNickname();
  input.focus();
  input.select();
}

async function submitNick(): Promise<void> {
  const input = byId('nickInput') as HTMLInputElement | null;
  const error = byId('nickError');
  if (!input) return;

  if (error) error.textContent = '';
  try {
    await setNickname(input.value);
    closeNickEditor();
    renderStatus(getStatus());
  } catch (err) {
    const text = err instanceof NicknameError ? err.message : 'Не удалось сменить ник';
    if (error) error.textContent = text;
  }
}

/* --------------------------------------------------------------- лидеры */

let activeBoard: BoardId = BOARDS[0].id;

function renderBoardTabs(): void {
  const tabs = byId('lbTabs');
  if (!tabs) return;
  tabs.textContent = '';

  BOARDS.forEach(board => {
    const btn = document.createElement('button');
    btn.className = 'lb-tab' + (board.id === activeBoard ? ' active' : '');
    btn.textContent = board.label;
    btn.addEventListener('click', () => {
      activeBoard = board.id;
      renderBoardTabs();
      void refreshLeaderboard();
    });
    tabs.appendChild(btn);
  });
}

function setBoardMessage(text: string): void {
  const list = byId('lbList');
  if (!list) return;

  list.textContent = '';
  const empty = document.createElement('p');
  empty.className = 'lb-empty';
  empty.textContent = text;
  list.appendChild(empty);
}

async function refreshLeaderboard(): Promise<void> {
  const list = byId('lbList');
  if (!list) return;

  if (!isNetConfigured()) {
    setBoardMessage('Сетевые функции не настроены при сборке.');
    return;
  }

  setBoardMessage('Загружаем…');
  const rows = await loadLeaderboard(activeBoard);

  if (!rows.length) {
    setBoardMessage(
      getStatus() === 'online' ? 'Пока никто не победил. Будь первым!' : 'Нет связи с сервером.'
    );
    return;
  }

  list.textContent = '';
  rows.forEach(row => {
    const item = document.createElement('div');
    item.className = 'lb-row' + (row.own ? ' lb-row--own' : '');

    const rank = document.createElement('span');
    rank.className = 'lb-rank';
    rank.textContent = String(row.rank);

    const name = document.createElement('span');
    name.className = 'lb-name';
    name.textContent = row.username;

    const score = document.createElement('span');
    score.className = 'lb-score';
    score.textContent = String(row.score);

    item.append(rank, name, score);
    list.appendChild(item);
  });
}

export function showLeaderboard(): void {
  byId('leaderboardScreen')?.classList.remove('hidden');
  renderBoardTabs();
  void refreshLeaderboard();
}

export function hideLeaderboard(): void {
  byId('leaderboardScreen')?.classList.add('hidden');
}

/* ------------------------------------------------------------------ чат */

let chatReady = false;
const seenMessageIds = new Set<string>();

function appendMessage(msg: ChatMessage): void {
  const log = byId('chatLog');
  if (!log) return;
  if (seenMessageIds.has(msg.id)) return;
  seenMessageIds.add(msg.id);

  const row = document.createElement('div');
  row.className = 'chat-msg' + (msg.own ? ' chat-msg--own' : '');

  const head = document.createElement('div');
  head.className = 'chat-msg-head';

  const author = document.createElement('span');
  author.className = 'chat-author';
  author.textContent = msg.username;

  const time = document.createElement('span');
  time.className = 'chat-time';
  time.textContent = msg.createdAt.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  });

  head.append(author, time);

  // textContent, а не innerHTML: тексты пишут другие люди.
  const body = document.createElement('div');
  body.className = 'chat-text';
  body.textContent = msg.text;

  row.append(head, body);
  log.appendChild(row);

  // Не дёргаем прокрутку, если человек читает старое выше.
  const nearBottom = log.scrollHeight - log.scrollTop - log.clientHeight < 120;
  if (nearBottom || msg.own) log.scrollTop = log.scrollHeight;
}

function setChatNotice(text: string): void {
  const log = byId('chatLog');
  if (!log) return;

  log.textContent = '';
  const notice = document.createElement('p');
  notice.className = 'chat-notice';
  notice.textContent = text;
  log.appendChild(notice);
}

async function ensureChat(): Promise<void> {
  if (chatReady) return;

  if (!isNetConfigured()) {
    setChatNotice('Сетевые функции не настроены при сборке.');
    return;
  }

  setChatNotice('Подключаемся…');
  const ok = await joinChat();
  if (!ok) {
    setChatNotice('Нет связи с сервером. Сообщения отправить нельзя.');
    return;
  }

  chatReady = true;
  const history = await loadHistory();

  const log = byId('chatLog');
  if (log) log.textContent = '';

  if (!history.length) setChatNotice('История пуста — напиши первым.');
  else history.forEach(appendMessage);

  onMessage(appendMessage);
}

export function toggleChat(): void {
  const panel = byId('chatPanel');
  if (!panel) return;

  const opening = panel.classList.contains('hidden');
  panel.classList.toggle('hidden', !opening);

  if (opening) {
    void ensureChat();
    (byId('chatInput') as HTMLInputElement | null)?.focus();
  }
}

export function closeChat(): void {
  byId('chatPanel')?.classList.add('hidden');
}

async function submitChat(event: Event): Promise<void> {
  event.preventDefault();

  const input = byId('chatInput') as HTMLInputElement | null;
  if (!input) return;

  const text = input.value;
  if (!text.trim()) return;

  input.value = '';
  const sent = await sendMessage(text);

  if (!sent) {
    // Возвращаем текст в поле, чтобы написанное не пропало.
    input.value = text;
    const log = byId('chatLog');
    if (log) {
      const warn = document.createElement('p');
      warn.className = 'chat-notice';
      warn.textContent = 'Сообщение не ушло — проверь связь.';
      log.appendChild(warn);
      log.scrollTop = log.scrollHeight;
    }
  }
}

/* ----------------------------------------------------------------- init */

export function initSocial(): void {
  // Hero Lab этих элементов не содержит — молча выходим.
  if (!byId('netBar')) return;

  onStatusChange(renderStatus);

  byId('btnChangeNick')?.addEventListener('click', openNickEditor);
  byId('nickSave')?.addEventListener('click', () => void submitNick());
  byId('nickCancel')?.addEventListener('click', closeNickEditor);
  byId('nickInput')?.addEventListener('keydown', event => {
    const key = (event as KeyboardEvent).key;
    if (key === 'Enter') void submitNick();
    if (key === 'Escape') closeNickEditor();
  });

  byId('chatClose')?.addEventListener('click', closeChat);
  byId('chatForm')?.addEventListener('submit', event => void submitChat(event));
  byId('lbClose')?.addEventListener('click', hideLeaderboard);

  Object.assign(window, { showLeaderboard, hideLeaderboard, toggleChat, closeChat });

  // Подключаемся в фоне: игра не должна ждать сеть.
  void connect();
}

Object.assign(window, { showLeaderboard, hideLeaderboard, toggleChat, closeChat });
