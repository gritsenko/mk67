import { enterGameMode, leaveGameMode } from '../systems/displayMode';

export type ScreenId = 'menuScreen' | 'selectScreen' | 'winScreen' | 'pauseScreen' | 'campaignScreen';

function getScreen(id: ScreenId) {
  return document.getElementById(id);
}

export function showScreen(id: ScreenId) {
  getScreen(id)?.classList.remove('hidden');
  // Главное меню (и чат из него) работает в любой ориентации; начиная с экрана
  // выбора бойца / кампании включается игровой режим: landscape, fullscreen,
  // блокировка зума и выделения. Бой не показывает экранов — он наследует
  // режим, включённый на выборе.
  if (id === 'menuScreen') leaveGameMode();
  else if (id === 'selectScreen' || id === 'campaignScreen') enterGameMode();
}

export function hideScreen(id: ScreenId) {
  getScreen(id)?.classList.add('hidden');
}

export function showTouchControls(mode: 'solo' | 'versus' = 'solo') {
  const touchEl = document.getElementById('touchControls');
  if (touchEl) {
    touchEl.classList.remove('touch-solo', 'touch-versus');
    touchEl.classList.add(mode === 'versus' ? 'touch-versus' : 'touch-solo');
    touchEl.style.display = 'flex';
  }
}

export function hideTouchControls() {
  const touchEl = document.getElementById('touchControls');
  if (touchEl) touchEl.style.display = 'none';
}

export function setFightHudVisible(visible: boolean) {
  const hud = document.getElementById('fightHudBar');
  if (hud) {
    hud.classList.toggle('hidden', !visible);
  }
}

export function setControlsInfoVisible(visible: boolean) {
  const controls = document.getElementById('controlsInfo');
  if (controls) controls.style.display = visible ? 'flex' : 'none';
}
