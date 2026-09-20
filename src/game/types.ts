import type { CharacterConfig } from '../data/characters';

export type GameState = 'menu' | 'fight' | 'ko' | 'win';
/** 'online' — сетевой бой. Остальные три режима одиночные и работают без сервера. */
export type PlayerMode = 'player' | 'bot' | 'boss' | 'online';

export interface SelectionState {
  selectedP1: CharacterConfig | null;
  selectedP2: CharacterConfig | null;
  p2Mode: PlayerMode;
  bossIsPlayer: boolean;
}

