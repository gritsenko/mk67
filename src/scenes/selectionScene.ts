import { BOSS_DATA, CHARACTERS } from '../data/characters';
import type { CharacterConfig } from '../data/characters';
import type { PlayerMode, SelectionState } from '../game/types';

/** DOM scene for fighter selection. Gameplay owns the match; this scene only
 * owns selection state and screen widgets. */
export const selection: SelectionState = {
  selectedP1: null,
  selectedP2: null,
  p2Mode: 'player',
  bossIsPlayer: false,
};

export let isCampaignSelectMode = false;

export function setCampaignSelectMode(enabled: boolean) {
  isCampaignSelectMode = enabled;
  const selectScreen = document.getElementById('selectScreen');
  const title = document.getElementById('selectTitle');
  const hint = document.getElementById('selectHint');
  const p1Title = document.getElementById('p1Title');
  const p2Col = document.getElementById('p2Col');
  const vsDivider = document.getElementById('vsDivider');
  const startBtn = document.getElementById('startFightBtn');

  if (enabled) {
    selectScreen?.classList.add('select-campaign');
    if (title) title.textContent = 'Выбор героя кампании';
    if (hint) hint.textContent = 'Выберите своего персонажа для сражений с ботами и Тёмным Сергеем';
    if (p1Title) p1Title.innerHTML = '<i class="fas fa-user-shield"></i> Ваш боец';
    if (p2Col) p2Col.style.display = 'none';
    if (vsDivider) vsDivider.style.display = 'none';
    if (startBtn) startBtn.innerHTML = '<i class="fas fa-dungeon"></i> К кампании';
  } else {
    selectScreen?.classList.remove('select-campaign');
    if (title) title.textContent = 'Выбор бойцов';
    if (hint) hint.textContent = 'Каждый игрок выбирает своего персонажа';
    if (p1Title) p1Title.innerHTML = '<i class="fas fa-gamepad"></i> Игрок 1';
    if (p2Col) p2Col.style.display = '';
    if (vsDivider) vsDivider.style.display = '';
    if (startBtn) startBtn.innerHTML = 'Бой!';
  }
  checkReady();
}

export function resetSelection() {
  selection.selectedP1 = null;
  selection.selectedP2 = null;

  const b1 = document.getElementById('p1Badge');
  if (b1) b1.innerHTML = '<span class="badge-placeholder">Выберите бойца</span>';
  const b2 = document.getElementById('p2Badge');
  if (b2) b2.innerHTML = '<span class="badge-placeholder">Выберите бойца</span>';

  document.querySelectorAll('.char-card').forEach((el) => {
    el.classList.remove('selected-p1', 'selected-p2');
  });
}

export function checkReady() {
  const online = selection.p2Mode === 'online';
  const ready = isCampaignSelectMode
    ? Boolean(selection.selectedP1)
    : Boolean(selection.selectedP1 && (selection.selectedP2 || selection.p2Mode === 'boss' || online));

  const button = document.getElementById('startFightBtn') as HTMLButtonElement | null;
  if (button) {
    button.style.opacity = ready ? '1' : '0.4';
    button.style.pointerEvents = ready ? 'auto' : 'none';
  }

  // Кнопки комнаты активны только когда боец выбран.
  document.querySelectorAll<HTMLElement>('.online-needs-fighter').forEach((el) => {
    el.style.opacity = ready && online ? '1' : '0.4';
    el.style.pointerEvents = ready && online ? 'auto' : 'none';
  });
}

function updateBadge(player: 1 | 2, character: CharacterConfig) {
  const badge = document.getElementById(player === 1 ? 'p1Badge' : 'p2Badge');
  if (badge) {
    badge.innerHTML = `<span class="badge-char-name" style="color:${character.color}">${character.name}</span> <span class="badge-char-style">${character.style}</span>`;
  }
}

function createCharCard(character: CharacterConfig, player: 1 | 2) {
  const card = document.createElement('div');
  card.className = 'char-card';
  card.dataset.id = character.id;
  card.title = `${character.name} • ${character.style} (${character.special})`;

  const darkIcon = character.id === 'sofya';
  const fallback = `<div class="char-avatar-fallback" style="background:${character.color};color:${darkIcon ? '#37474f' : '#fff'};font-size:${character.icon.length > 1 ? '13px' : '17px'}">${character.icon}</div>`;
  const avatar = character.avatar
    ? `<img src="${character.avatar}" alt="${character.name}" class="char-avatar-img" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />${fallback.replace('style="', 'style="display:none;')}`
    : fallback;

  card.innerHTML = `<div class="char-avatar" style="border-color:${character.color};background:${character.colorDark || '#1a1a24'}">${avatar}</div>`;

  card.addEventListener('click', () => {
    const grid = player === 1 ? '#p1Grid' : '#p2Grid';
    document.querySelectorAll(`${grid} .char-card`).forEach((item) => item.classList.remove(player === 1 ? 'selected-p1' : 'selected-p2'));
    card.classList.add(player === 1 ? 'selected-p1' : 'selected-p2');
    if (player === 1) {
      selection.selectedP1 = character;
      updateBadge(1, character);
    } else {
      selection.selectedP2 = character;
      updateBadge(2, character);
    }
    checkReady();
  });
  return card;
}

export function buildCharGrids() {
  const p1Grid = document.getElementById('p1Grid');
  const p2Grid = document.getElementById('p2Grid');
  if (!p1Grid || !p2Grid) return;
  p1Grid.replaceChildren();
  p2Grid.replaceChildren();
  CHARACTERS.forEach((character) => {
    p1Grid.appendChild(createCharCard(character, 1));
    p2Grid.appendChild(createCharCard(character, 2));
  });
}

export function setBossCtrl(asPlayer: boolean) {
  selection.bossIsPlayer = asPlayer;
  document.getElementById('bossCtrlBot')?.classList.toggle('active', !asPlayer);
  document.getElementById('bossCtrlPlayer')?.classList.toggle('active', asPlayer);
}

export function setP2Mode(mode: PlayerMode) {
  selection.p2Mode = mode;
  const online = mode === 'online';

  document.getElementById('btnP2Player')?.classList.toggle('active-p2', mode === 'player');
  document.getElementById('btnP2Bot')?.classList.toggle('active-p2', mode === 'bot');
  document.getElementById('btnP2Boss')?.classList.toggle('active-p2', mode === 'boss');
  document.getElementById('btnP2Online')?.classList.toggle('active-p2', online);

  // В онлайне сетка соперника не нужна: он выбирает бойца у себя.
  document.getElementById('p2Grid')?.setAttribute('style', mode === 'boss' || online ? 'display:none' : 'display:grid');
  document.getElementById('bossCard')?.setAttribute('style', mode === 'boss' ? 'display:flex' : 'display:none');
  document.getElementById('onlinePanel')?.setAttribute('style', online ? 'display:flex' : 'display:none');

  // Бой начинается по готовности обеих сторон, а не по кнопке.
  const startRow = document.getElementById('startFightBtn');
  if (startRow) startRow.style.display = online ? 'none' : '';

  const label = document.getElementById('p2Label');
  if (label) label.textContent = online ? 'Соперник по сети' : 'Игрок 2';

  if (mode === 'boss') {
    setBossCtrl(false);
    const b2 = document.getElementById('p2Badge');
    if (b2) b2.innerHTML = `<span class="badge-char-name" style="color:#76ff03">ТЁМНЫЙ СЕРГЕЙ</span> <span class="badge-char-style">ГИГА-БОСС</span>`;
  }
  const hint = document.getElementById('p2ControlsHint');
  if (hint) hint.style.display = mode === 'bot' || online ? 'none' : 'inline';

  const touchEl = document.getElementById('touchControls');
  if (touchEl) {
    touchEl.classList.toggle('touch-versus', mode === 'player');
    touchEl.classList.toggle('touch-solo', mode !== 'player');
  }
  checkReady();
}

export { BOSS_DATA };
