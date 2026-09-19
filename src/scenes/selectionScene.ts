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

export function resetSelection() {
  selection.selectedP1 = null;
  selection.selectedP2 = null;
}

export function checkReady() {
  const button = document.getElementById('startFightBtn') as HTMLButtonElement | null;
  if (!button) return;
  const ready = Boolean(selection.selectedP1 && (selection.selectedP2 || selection.p2Mode === 'boss'));
  button.style.opacity = ready ? '1' : '0.4';
  button.style.pointerEvents = ready ? 'auto' : 'none';
}

function createCharCard(character: CharacterConfig, player: 1 | 2) {
  const card = document.createElement('div');
  card.className = 'char-card';
  card.dataset.id = character.id;
  const darkIcon = character.id === 'sofya';
  const fallback = `<div class="char-avatar-fallback" style="background:${character.color};color:${darkIcon ? '#37474f' : '#fff'};font-size:${character.icon.length > 1 ? '13px' : '17px'}">${character.icon}</div>`;
  const avatar = character.avatar
    ? `<img src="${character.avatar}" alt="${character.name}" class="char-avatar-img" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />${fallback.replace('style="', 'style="display:none;')}`
    : fallback;
  card.innerHTML = `<div class="char-avatar" style="border-color:${character.color};background:${character.colorDark || '#1a1a24'}">${avatar}</div><div class="char-name">${character.name}</div><div class="char-stat" style="font-style:italic;color:${character.color}">${character.style}</div><div class="char-stat">ATK</div><div class="stat-bar"><div class="stat-fill" style="width:${character.statATK}%;background:${character.color}"></div></div><div class="char-stat">DEF</div><div class="stat-bar"><div class="stat-fill" style="width:${character.statDEF}%;background:${character.color}"></div></div><div class="char-stat">SPD</div><div class="stat-bar"><div class="stat-fill" style="width:${character.statSPD}%;background:${character.color}"></div></div><div class="char-stat" style="color:var(--accent2)">${character.special}</div>`;
  card.addEventListener('click', () => {
    const grid = player === 1 ? '#p1Grid' : '#p2Grid';
    document.querySelectorAll(`${grid} .char-card`).forEach((item) => item.classList.remove(player === 1 ? 'selected-p1' : 'selected-p2'));
    card.classList.add(player === 1 ? 'selected-p1' : 'selected-p2');
    if (player === 1) selection.selectedP1 = character;
    else selection.selectedP2 = character;
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
  document.getElementById('btnP2Player')?.classList.toggle('active-p2', mode === 'player');
  document.getElementById('btnP2Bot')?.classList.toggle('active-p2', mode === 'bot');
  document.getElementById('btnP2Boss')?.classList.toggle('active-p2', mode === 'boss');
  document.getElementById('p2Grid')?.setAttribute('style', mode === 'boss' ? 'display:none' : 'display:grid');
  document.getElementById('bossCard')?.setAttribute('style', mode === 'boss' ? 'display:flex' : 'display:none');
  if (mode === 'boss') setBossCtrl(false);
  const hint = document.getElementById('p2ControlsHint');
  if (hint) hint.style.display = mode === 'bot' ? 'none' : 'inline';
  const touchControls = document.getElementById('p2TouchControls');
  if (touchControls && 'ontouchstart' in window) touchControls.style.display = mode === 'bot' || mode === 'boss' ? 'none' : 'flex';
  checkReady();
}

export { BOSS_DATA };
