import { BOSS_DATA, CHARACTERS, getCharacterById } from '../data/characters';
import type { CharacterConfig } from '../data/characters';
import { hideScreen, showScreen } from './screenManager';

export interface CampaignStage {
  stageNumber: number;
  fighterId: string;
  isBoss: boolean;
}

export interface CampaignState {
  heroId: string;
  stages: CampaignStage[];
  currentStageIndex: number;
  completed: boolean;
}

const STORAGE_KEY = 'mk67_campaign';

export function getCampaignState(): CampaignState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CampaignState;
    if (parsed && parsed.heroId && Array.isArray(parsed.stages)) {
      return parsed;
    }
  } catch (e) {
    console.warn('Failed to load campaign state', e);
  }
  return null;
}

export function saveCampaignState(state: CampaignState | null): void {
  try {
    if (!state) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  } catch (e) {
    console.warn('Failed to save campaign state', e);
  }
}

export function initCampaign(heroId: string): CampaignState {
  // Выбираем 5 случайных соперников из ростера (кроме выбранного героя)
  const available = CHARACTERS.filter((c) => c.id !== heroId);
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  const chosenOpponents = shuffled.slice(0, 5);

  const stages: CampaignStage[] = chosenOpponents.map((char, index) => ({
    stageNumber: index + 1,
    fighterId: char.id,
    isBoss: false,
  }));

  // Финальный этап: Тёмный Сергей (ГИГА-БОСС)
  stages.push({
    stageNumber: stages.length + 1,
    fighterId: BOSS_DATA.id,
    isBoss: true,
  });

  const state: CampaignState = {
    heroId,
    stages,
    currentStageIndex: 0,
    completed: false,
  };

  saveCampaignState(state);
  return state;
}

export function advanceCampaign(): { state: CampaignState; nextStage: CampaignStage | null; completed: boolean } {
  let state = getCampaignState();
  if (!state) {
    throw new Error('No campaign in progress');
  }

  state.currentStageIndex++;
  if (state.currentStageIndex >= state.stages.length) {
    state.completed = true;
  }
  saveCampaignState(state);

  const nextStage = state.completed ? null : state.stages[state.currentStageIndex];
  return {
    state,
    nextStage,
    completed: state.completed,
  };
}

export function resetCampaign(): void {
  saveCampaignState(null);
}

export function getCurrentCampaignOpponent(state: CampaignState): CharacterConfig | null {
  if (!state || state.currentStageIndex >= state.stages.length) return null;
  const currentStage = state.stages[state.currentStageIndex];
  return getCharacterById(currentStage.fighterId) || null;
}

export function getCampaignHero(state: CampaignState): CharacterConfig | null {
  if (!state || !state.heroId) return null;
  return getCharacterById(state.heroId) || null;
}

function createAvatarHtml(char: CharacterConfig): string {
  const darkIcon = char.id === 'sofya';
  const fallback = `<div class="char-avatar-fallback" style="background:${char.color};color:${darkIcon ? '#37474f' : '#fff'};font-size:16px;">${char.icon}</div>`;
  if (char.avatar) {
    return `<img src="${char.avatar}" alt="${char.name}" class="char-avatar-img" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />${fallback.replace('style="', 'style="display:none;')}`;
  }
  return fallback;
}

export function renderCampaignScreen(): void {
  const state = getCampaignState();
  if (!state) return;

  const hero = getCampaignHero(state);
  const heroCardEl = document.getElementById('campaignHeroCard');
  if (heroCardEl && hero) {
    const avatar = createAvatarHtml(hero);
    heroCardEl.innerHTML = `
      <div class="campaign-hero-avatar-box" style="border-color:${hero.color};box-shadow:0 0 16px ${hero.color}66;">
        ${avatar}
      </div>
      <div class="campaign-hero-info">
        <div class="campaign-hero-label">ВАШ ГЕРОЙ</div>
        <div class="campaign-hero-name" style="color:${hero.color};">${hero.name}</div>
        <div class="campaign-hero-style">${hero.style} • ${hero.special}</div>
      </div>
    `;
  }

  const ladderEl = document.getElementById('campaignLadder');
  if (ladderEl) {
    ladderEl.replaceChildren();

    state.stages.forEach((stage, index) => {
      const opp = getCharacterById(stage.fighterId);
      if (!opp) return;

      const isCompleted = index < state.currentStageIndex;
      const isCurrent = index === state.currentStageIndex;
      const isLocked = index > state.currentStageIndex;

      const stageCard = document.createElement('div');
      stageCard.className = `campaign-stage-card ${isCurrent ? 'stage-current' : ''} ${isCompleted ? 'stage-completed' : ''} ${isLocked ? 'stage-locked' : ''}`;

      const avatarHtml = createAvatarHtml(opp);
      const isFinalBoss = stage.isBoss;

      let statusBadge = '';
      if (isCompleted) {
        statusBadge = `<span class="stage-status-badge status-done"><i class="fas fa-check"></i> ПОВЕРЖЕН</span>`;
      } else if (isCurrent) {
        statusBadge = `<span class="stage-status-badge status-active"><i class="fas fa-swords"></i> ТЕКУЩИЙ БОЙ</span>`;
      } else {
        statusBadge = `<span class="stage-status-badge status-locked"><i class="fas fa-lock"></i> ОЖИДАНИЕ</span>`;
      }

      stageCard.innerHTML = `
        <div class="stage-number-box ${isFinalBoss ? 'stage-boss-badge' : ''}">
          ${isFinalBoss ? '☠ ФИНАЛ' : `ЭТАП ${stage.stageNumber}`}
        </div>
        <div class="stage-avatar-box" style="border-color:${opp.color};">
          ${avatarHtml}
        </div>
        <div class="stage-details">
          <div class="stage-fighter-name" style="color:${opp.color};">${opp.name}</div>
          <div class="stage-fighter-style">${opp.style}</div>
        </div>
        <div class="stage-status-col">
          ${statusBadge}
        </div>
      `;

      ladderEl.appendChild(stageCard);
    });
  }

  const fightBtn = document.getElementById('btnCampaignFight') as HTMLButtonElement | null;
  if (fightBtn) {
    if (state.completed) {
      fightBtn.innerHTML = '<i class="fas fa-trophy"></i> Кампания завершена!';
      fightBtn.disabled = true;
      fightBtn.style.opacity = '0.5';
    } else {
      const currentOpp = getCurrentCampaignOpponent(state);
      const oppName = currentOpp ? currentOpp.name : 'соперником';
      fightBtn.innerHTML = `<i class="fas fa-bolt"></i> В бой с ${oppName}!`;
      fightBtn.disabled = false;
      fightBtn.style.opacity = '1';
    }
  }
}
