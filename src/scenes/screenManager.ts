export type ScreenId = 'menuScreen' | 'selectScreen' | 'winScreen' | 'pauseScreen';

function getScreen(id: ScreenId) {
  return document.getElementById(id);
}

export function showScreen(id: ScreenId) {
  getScreen(id)?.classList.remove('hidden');
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
