/**
 * «Игровой режим» экрана на мобильных устройствах.
 *
 * Меню и чат должны работать в любой ориентации — в портрете с клавиатурой
 * чатом пользоваться удобнее. Начиная с экрана выбора бойца (и далее: кампания,
 * бой, победа, пауза) игра переводится в игровой режим:
 *   - показывается подсказка «поверните экран», если телефон в портрете;
 *   - запрашивается полноэкранный режим (только из жеста пользователя,
 *     поэтому вызывать enterGameMode нужно синхронно из обработчика клика);
 *   - после входа в fullscreen делается попытка залочить landscape через
 *     Screen Orientation API (работает в Android Chrome, в iOS Safari — нет,
 *     там остаётся только подсказка);
 *   - блокируются жесты, мешающие игре: pinch-zoom, выделение текста,
 *     контекстное меню по долгому нажатию, зум страницы с клавиатуры/колеса.
 *     Двойной тап гасится CSS (touch-action: none / pan-y на body.game-mode),
 *     preventDefault на touchend здесь не используется — он глушил бы click.
 *
 * Возврат в главное меню снимает всё это: ориентация разблокируется,
 * полноэкранный режим закрывается, жесты снова разрешены.
 *
 * Модуль не знает о DOM экранов — только о <body> и глобальных событиях.
 */

const GAME_MODE_CLASS = 'game-mode';

let gameModeActive = false;

function isTouchLike(): boolean {
  return document.body.classList.contains('is-mobile');
}

/* ---------- Полноэкранный режим ---------- */

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};
type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

function fullscreenElement(): Element | null {
  const doc = document as FullscreenDocument;
  return document.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

/** Запрос fullscreen. Возвращает промис, который резолвится и при отказе. */
function requestFullscreen(): Promise<void> {
  if (fullscreenElement()) return Promise.resolve();
  const el = document.documentElement as FullscreenElement;
  try {
    if (el.requestFullscreen) {
      return el.requestFullscreen({ navigationUI: 'hide' }).catch(() => {});
    }
    if (el.webkitRequestFullscreen) {
      const r = el.webkitRequestFullscreen();
      return Promise.resolve(r).catch(() => {});
    }
  } catch {
    /* браузер не поддерживает или отказал — остаёмся как есть */
  }
  return Promise.resolve();
}

function exitFullscreen(): void {
  if (!fullscreenElement()) return;
  const doc = document as FullscreenDocument;
  try {
    if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
    else if (doc.webkitExitFullscreen) doc.webkitExitFullscreen();
  } catch {
    /* ignore */
  }
}

/* ---------- Ориентация ---------- */

type LockableOrientation = ScreenOrientation & {
  lock?: (orientation: string) => Promise<void>;
  unlock?: () => void;
};

function orientationApi(): LockableOrientation | null {
  const o = (typeof screen !== 'undefined' ? screen.orientation : null) as LockableOrientation | null;
  return o ?? null;
}

function lockLandscape(): void {
  const o = orientationApi();
  if (!o?.lock) return;
  // Lock доступен только в fullscreen; при отказе тихо остаёмся на подсказке.
  o.lock('landscape').catch(() => {});
}

function unlockOrientation(): void {
  const o = orientationApi();
  try {
    o?.unlock?.();
  } catch {
    /* ignore */
  }
}

/* ---------- Блокировка жестов ---------- */

/** Элементы, где ввод текста и выделение нужны даже в игровом режиме. */
function isEditable(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || !(el instanceof Element)) return false;
  return !!el.closest('input, textarea, [contenteditable="true"], .chat-panel');
}

function onTouchMove(e: TouchEvent): void {
  // Мультитач = pinch-zoom (iOS игнорирует user-scalable=no с iOS 10).
  if (gameModeActive && e.touches.length > 1) e.preventDefault();
}

function onGesture(e: Event): void {
  // Safari-специфичные события pinch/rotate.
  if (gameModeActive) e.preventDefault();
}

function onContextMenu(e: Event): void {
  // Долгое нажатие на сенсоре открывает контекстное меню / выделение картинки.
  if (gameModeActive && isTouchLike() && !isEditable(e.target)) e.preventDefault();
}

function onSelectStart(e: Event): void {
  if (gameModeActive && !isEditable(e.target)) e.preventDefault();
}

function onWheel(e: WheelEvent): void {
  // Ctrl+колесо / трекпад-pinch = зум страницы на десктопе.
  if (gameModeActive && e.ctrlKey) e.preventDefault();
}

function onKeyDown(e: KeyboardEvent): void {
  // Ctrl/Cmd + '+' '-' '0' — зум страницы с клавиатуры в бою мешает.
  if (!gameModeActive || !(e.ctrlKey || e.metaKey)) return;
  if (isEditable(e.target)) return;
  if (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '0') e.preventDefault();
}

let listenersInstalled = false;
function installGestureGuards(): void {
  if (listenersInstalled) return;
  listenersInstalled = true;
  const passiveOff: AddEventListenerOptions = { passive: false, capture: true };
  document.addEventListener('touchmove', onTouchMove, passiveOff);
  document.addEventListener('gesturestart', onGesture, passiveOff);
  document.addEventListener('gesturechange', onGesture, passiveOff);
  document.addEventListener('gestureend', onGesture, passiveOff);
  document.addEventListener('contextmenu', onContextMenu, true);
  document.addEventListener('selectstart', onSelectStart, true);
  document.addEventListener('wheel', onWheel, passiveOff);
  document.addEventListener('keydown', onKeyDown, true);
}

/* ---------- Публичный API ---------- */

/**
 * Включить игровой режим. Вызывать синхронно из обработчика пользовательского
 * действия (клик по «Кампания» / «Обычный бой»), иначе браузер откажет в fullscreen.
 * Повторные вызовы безопасны: fullscreen перезапрашивается только если его нет.
 */
export function enterGameMode(): void {
  installGestureGuards();
  gameModeActive = true;
  document.body.classList.add(GAME_MODE_CLASS);
  if (!isTouchLike()) return;
  // На сенсорных: полный экран + попытка залочить landscape.
  requestFullscreen().then(() => lockLandscape());
}

/** Выключить игровой режим: меню и чат должны работать в любой ориентации. */
export function leaveGameMode(): void {
  gameModeActive = false;
  document.body.classList.remove(GAME_MODE_CLASS);
  unlockOrientation();
  exitFullscreen();
}

export function isGameModeActive(): boolean {
  return gameModeActive;
}

/**
 * Если пользователь сам вышел из fullscreen системным жестом во время игры,
 * лок ориентации уже снят браузером — повторно его не запрашиваем (нет жеста),
 * подсказка о повороте продолжает работать через CSS по классу game-mode.
 */
export function initDisplayMode(): void {
  installGestureGuards();
}
