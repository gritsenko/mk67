/** Shared game constants. Keep tuning values here so gameplay modules do not
 * need to duplicate canvas dimensions or rendering scales. */
export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;
export const PLAYER_SCALE = 1.4;
export const BOSS_SCALE = 1.35;
export const ROUND_DURATION_SECONDS = 99;


/**
 * Плавающий стик сенсорного управления. Все значения — в CSS-пикселях экрана
 * (до масштабирования --ui-scale). Центр стика ставится туда, где палец коснулся
 * левой половины экрана; дальше смещение от центра переводится в клавиши.
 */
export const TOUCH_STICK = {
  /** Смещение по горизонтали, с которого начинается шаг. */
  DEAD_ZONE: 12,
  /** Смещение, ниже которого шаг отпускается (гистерезис против дрожания). */
  RELEASE_ZONE: 7,
  /** Толчок вверх, с которого срабатывает прыжок. */
  JUMP_THRESHOLD: 30,
  /** Смещение вниз, с которого включается блок. */
  BLOCK_THRESHOLD: 26,
  /** Дальше этого радиуса «шляпка» стика визуально не уходит. */
  KNOB_RADIUS: 46,
};
