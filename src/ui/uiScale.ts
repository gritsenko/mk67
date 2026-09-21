/**
 * Пропорциональное масштабирование интерфейса под размер экрана.
 *
 * Вся вёрстка свёрстана под базовый экран BASE_W x BASE_H. На больших
 * мониторах она оставалась бы маленьким островком по центру, поэтому здесь
 * считается коэффициент min(ширина / BASE_W, высота / BASE_H) и отдаётся в
 * CSS-переменную --ui-scale. Блоки экранов применяют её через `zoom`, так что
 * пропорции макета не меняются — всё увеличивается целиком.
 *
 * Уменьшать ниже единицы нельзя: на маленьких экранах и телефонах за
 * компоновку отвечают медиазапросы в styles.css.
 */
const BASE_W = 1280;
const BASE_H = 720;
const SELECT_BASE_W = 860;
const SELECT_BASE_H = 460;
const MIN_SCALE = 1;
const MAX_SCALE = 3;

let applied = -1;
let selectApplied = -1;

function computeScale(): number {
  const raw = Math.min(window.innerWidth / BASE_W, window.innerHeight / BASE_H);
  const clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, raw));
  // Округление до сотых, чтобы не дёргать пересчёт вёрстки на каждый пиксель.
  return Math.round(clamped * 100) / 100;
}

function computeSelectScale(): number {
  const raw = Math.min(
    window.innerWidth * 0.94 / SELECT_BASE_W,
    window.innerHeight * 0.94 / SELECT_BASE_H,
  );
  const clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, raw));
  return Math.round(clamped * 100) / 100;
}

export function applyUiScale(): void {
  const scale = computeScale();
  if (scale !== applied) {
    applied = scale;
    document.documentElement.style.setProperty('--ui-scale', String(scale));
  }

  const selectScale = computeSelectScale();
  if (selectScale !== selectApplied) {
    selectApplied = selectScale;
    document.documentElement.style.setProperty('--select-ui-scale', String(selectScale));
  }
}

export function initUiScale(): void {
  applyUiScale();
  window.addEventListener('resize', applyUiScale);
  window.addEventListener('orientationchange', applyUiScale);
  window.visualViewport?.addEventListener('resize', applyUiScale);
}
