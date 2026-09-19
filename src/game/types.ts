import type { CharacterConfig } from '../data/characters';

export type GameState = 'menu' | 'fight' | 'ko' | 'win';
export type PlayerMode = 'player' | 'bot' | 'boss';

export interface SelectionState {
  selectedP1: CharacterConfig | null;
  selectedP2: CharacterConfig | null;
  p2Mode: PlayerMode;
  bossIsPlayer: boolean;
}

