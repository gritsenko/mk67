/**
 * DOM-слой сетевого боя: создание комнаты, вход по коду, статус подключения.
 *
 * Транспорт — в src/net/match.ts, симуляция — в game.ts. Эта сцена только
 * показывает состояние и дёргает то и другое, как и остальные сцены проекта.
 */
import {
  createRoom,
  getRoomCode,
  joinRoom,
  leaveRoom,
  normalizeCode,
  setCallbacks,
  type MatchPhase
} from '../net/match';
import { selection } from './selectionScene';
import { isNetConfigured } from '../net/config';

/** game.ts живёт под @ts-nocheck и публикует точки входа через window. */
interface GameBridge {
  startOnlineFight(hostCharId: string, guestCharId: string): void;
  onRemoteInput(packet: unknown): void;
  onRemoteState(snapshot: unknown): void;
  onOpponentLeft(): void;
}

const game = () => window as unknown as Partial<GameBridge>;
const byId = (id: string) => document.getElementById(id);

function setStatus(text: string, tone: 'info' | 'error' | 'ok' = 'info'): void {
  const el = byId('onlineStatus');
  if (!el) return;
  el.textContent = text;
  el.className = 'online-status online-status--' + tone;
}

function showCode(code: string): void {
  const box = byId('onlineCodeBox');
  const value = byId('onlineCode');
  if (value) value.textContent = code;
  box?.classList.toggle('hidden', !code);
  byId('onlineCancel')?.classList.toggle('hidden', !code);
}

/** Пока идёт создание или ожидание, повторные нажатия только мешают. */
function setBusy(busy: boolean): void {
  ['onlineCreate', 'onlineJoin', 'onlineCodeInput'].forEach(id => {
    const el = byId(id) as HTMLButtonElement | HTMLInputElement | null;
    if (el) el.disabled = busy;
  });
}

function resetPanel(): void {
  showCode('');
  setBusy(false);
  setStatus('');
  const input = byId('onlineCodeInput') as HTMLInputElement | null;
  if (input) input.value = '';
}

function onPhase(phase: MatchPhase, detail?: string): void {
  switch (phase) {
    case 'connecting':
      setBusy(true);
      setStatus('Подключаемся…');
      return;
    case 'waiting':
      setBusy(true);
      setStatus('Ждём соперника. Передай ему код.', 'ok');
      showCode(getRoomCode());
      return;
    case 'playing':
      setBusy(false);
      setStatus('');
      showCode('');
      return;
    case 'ended':
      setBusy(false);
      showCode('');
      setStatus(detail ?? 'Бой завершён', 'error');
      return;
    default:
      resetPanel();
  }
}

async function handleCreate(): Promise<void> {
  const fighter = selection.selectedP1;
  if (!fighter) {
    setStatus('Сначала выбери бойца', 'error');
    return;
  }
  if (!isNetConfigured()) {
    setStatus('Сетевые функции не настроены при сборке.', 'error');
    return;
  }
  await createRoom(fighter.id);
}

async function handleJoin(): Promise<void> {
  const fighter = selection.selectedP1;
  if (!fighter) {
    setStatus('Сначала выбери бойца', 'error');
    return;
  }
  if (!isNetConfigured()) {
    setStatus('Сетевые функции не настроены при сборке.', 'error');
    return;
  }

  const input = byId('onlineCodeInput') as HTMLInputElement | null;
  const code = normalizeCode(input?.value ?? '');
  if (code.length !== 5) {
    setStatus('Код состоит из 5 символов', 'error');
    return;
  }
  await joinRoom(code, fighter.id);
}

async function handleCancel(): Promise<void> {
  await leaveRoom();
  resetPanel();
}

function handleCopy(): void {
  const code = getRoomCode();
  if (!code) return;
  // Буфер обмена доступен не везде (http, старые браузеры) — молча переживаем отказ.
  navigator.clipboard?.writeText(code).then(
    () => setStatus('Код скопирован', 'ok'),
    () => setStatus('Скопируй код вручную')
  );
}

export function initOnline(): void {
  if (!byId('onlinePanel')) return;

  setCallbacks({
    onStart: ({ hostCharId, guestCharId }) => {
      resetPanel();
      game().startOnlineFight?.(hostCharId, guestCharId);
    },
    onInput: packet => game().onRemoteInput?.(packet),
    onState: snapshot => game().onRemoteState?.(snapshot),
    onOpponentLeft: () => {
      game().onOpponentLeft?.();
      resetPanel();
      setStatus('Соперник вышел из боя', 'error');
    },
    onPhase
  });

  byId('onlineCreate')?.addEventListener('click', () => void handleCreate());
  byId('onlineJoin')?.addEventListener('click', () => void handleJoin());
  byId('onlineCancel')?.addEventListener('click', () => void handleCancel());
  byId('onlineCopy')?.addEventListener('click', handleCopy);

  const input = byId('onlineCodeInput') as HTMLInputElement | null;
  input?.addEventListener('input', () => {
    // Код вводят с чужих слов — сразу приводим к допустимым символам.
    input.value = normalizeCode(input.value);
  });
  input?.addEventListener('keydown', event => {
    if ((event as KeyboardEvent).key === 'Enter') void handleJoin();
  });
}
