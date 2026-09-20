/**
 * Формат сетевых пакетов онлайн-боя.
 *
 * Вынесено из game.ts отдельно, чтобы формат можно было читать и менять,
 * не разбираясь в игровом цикле. Модуль ничего не знает про Fighter —
 * работает с любыми объектами, у которых есть нужные поля.
 *
 * Пакеты ходят JSON'ом. Снимок — около 400 байт, при 20 пакетах в секунду
 * это ~8 КБ/с на гостя; для боя двоих это несущественно, а читаемость важнее
 * экономии. Если когда-нибудь понадобится ужать — менять только этот файл.
 */

/**
 * Поля бойца, которые меняются по ходу боя и нужны госту для отрисовки.
 * Остальное (data, pi, maxHp, bodyW/bodyH, характеристики) задаётся один раз
 * при старте и по сети не гоняется.
 *
 * Порядок важен: он же определяет порядок значений в массиве.
 */
export const FIGHTER_FIELDS = [
  'x', 'y', 'vx', 'vy', 'facing',
  'hp', 'displayHp',
  'grounded', 'blocking',
  'attacking', 'attackType', 'attackTimer', 'attackDuration', 'attackHit',
  'hurtTimer', 'combo', 'specialCooldown',
  'animFrame', 'animTimer', 'slowTimer'
] as const;

/** Индексы полей, которые интерполируются, — их нельзя просто защёлкивать. */
export const IDX_X = 0;
export const IDX_Y = 1;
export const IDX_HP = 5;

export type FighterTuple = unknown[];

export interface ProjectileState {
  x: number;
  y: number;
  vx: number;
  life: number;
  hit: boolean;
}

export interface RoundState {
  /** gameState хоста: 'fight' | 'ko' | 'win' */
  gs: string;
  timer: number;
  round: number;
  w1: number;
  w2: number;
  koText: string;
  koTimer: number;
}

export interface Snapshot {
  /** Номер снимка: пакеты могут прийти не по порядку, старые игнорируем. */
  s: number;
  f1: FighterTuple;
  f2: FighterTuple;
  p1: ProjectileState | null;
  p2: ProjectileState | null;
  r: RoundState;
}

/* ------------------------------------------------------------------ ввод */

/** Удерживаемые действия — шлём состояние целиком каждый пакет. */
export const HOLD = {
  LEFT: 1 << 0,
  RIGHT: 1 << 1,
  JUMP: 1 << 2,
  BLOCK: 1 << 3
} as const;

/**
 * Атаки — события, а не состояние. Шлём только новые нажатия с прошлого пакета,
 * иначе один удар применился бы многократно.
 */
export const ATTACK = {
  LIGHT: 1 << 0,
  HEAVY: 1 << 1,
  SPECIAL: 1 << 2
} as const;

export interface InputPacket {
  /** Номер пакета: защищает от применения устаревшего ввода. */
  s: number;
  /** Маска удерживаемых действий (HOLD). */
  h: number;
  /** Маска новых нажатий атак (ATTACK). */
  a: number;
}

/* --------------------------------------------------------------- сборка */

export function captureFighter(fighter: Record<string, unknown>): FighterTuple {
  const out: unknown[] = new Array(FIGHTER_FIELDS.length);
  for (let i = 0; i < FIGHTER_FIELDS.length; i++) out[i] = fighter[FIGHTER_FIELDS[i]];
  return out;
}

export function captureProjectile(fighter: Record<string, unknown>): ProjectileState | null {
  const p = fighter.projectile as ProjectileState | null | undefined;
  if (!p) return null;
  return { x: p.x, y: p.y, vx: p.vx, life: p.life, hit: p.hit };
}

/**
 * Накатывает снимок на бойца.
 *
 * `smoothing` от 0 до 1 — доля, на которую позиция подтягивается к авторитетной
 * вместо мгновенной установки. Нужно для своего же бойца: его гость предсказывает
 * локально, и защёлкивание на каждом пакете читалось бы как рывки.
 * Для чужого бойца ставим 1 — там предсказывать нечего.
 */
export function applyFighter(
  fighter: Record<string, unknown>,
  tuple: FighterTuple,
  smoothing = 1
): void {
  for (let i = 0; i < FIGHTER_FIELDS.length; i++) {
    const value = tuple[i];
    if (value === undefined) continue;

    if (smoothing < 1 && (i === IDX_X || i === IDX_Y)) {
      const current = Number(fighter[FIGHTER_FIELDS[i]]) || 0;
      const target = Number(value) || 0;
      // Большое расхождение всё равно защёлкиваем: это не дрейф, а рассинхрон.
      fighter[FIGHTER_FIELDS[i]] =
        Math.abs(target - current) > 60 ? target : current + (target - current) * smoothing;
      continue;
    }

    fighter[FIGHTER_FIELDS[i]] = value;
  }
}

export function applyProjectile(
  fighter: Record<string, unknown>,
  state: ProjectileState | null
): void {
  fighter.projectile = state ? { ...state } : null;
}
