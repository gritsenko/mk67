export type ScreenId = 'menuScreen' | 'selectScreen' | 'winScreen';

function getScreen(id: ScreenId) {
  return document.getElementById(id);
}

export function showScreen(id: ScreenId) {
  getScreen(id)?.classList.remove('hidden');
}

export function hideScreen(id: ScreenId) {
  getScreen(id)?.classList.add('hidden');
}

export function hideTouchControls() {
  document.getElementById('touchControls')?.setAttribute('style', 'display:none');
  document.getElementById('p2TouchControls')?.setAttribute('style', 'display:none');
}

export function setControlsInfoVisible(visible: boolean) {
  const controls = document.getElementById('controlsInfo');
  if (controls) controls.style.display = visible ? 'flex' : 'none';
}

