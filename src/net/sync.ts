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
export const IDX_VX = 2;
export const IDX_VY = 3;
export const IDX_HP = 5;
const IDX_ATTACKING = 9;
const IDX_ATTACK_TYPE = 10;
const IDX_ATTACK_TIMER = 11;

/**
 * Поля, которые можно смешивать линейно.
 *
 * hp и combo сюда намеренно не входят: по ним гость ловит момент попадания
 * (упало — сыпем искры). Плавно сползающее hp срабатывало бы каждый кадр.
 * Полоса здоровья всё равно рисуется по displayHp, а он интерполируется.
 */
const BLEND_FIELDS = new Set([0, 1, 2, 3, 6, 11, 14, 16, 17, 18, 19]);

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


/* ------------------------------------------------- интерполяция чужого */

/**
 * Буфер снимков для бойца, которым управляет соперник.
 *
 * Снимки приходят 20 раз в секунду, а рисуем мы 60: если просто защёлкивать
 * позицию по приходу пакета, чужой боец дёргается — визуально это и читается
 * как «у него 20 fps». Вместо этого храним последние снимки и рисуем бойца
 * в прошлом, на INTERP_DELAY_MS назад, смешивая два соседних снимка. Тогда
 * между пакетами всегда есть куда двигаться, а дрожание сети съедается
 * запасом буфера.
 *
 * Плата — постоянная задержка отрисовки чужого бойца. Для гостя это не
 * ухудшает управление: свой боец предсказывается локально и на буфер не
 * смотрит, а попадания всё равно считает хост.
 */
export const INTERP_DELAY_MS = 100;

/** Пакетов нет — короткое время досчитываем по скорости, потом замираем. */
const MAX_EXTRAPOLATION_MS = 120;

/** Такое расхождение — это не сеть, а новый раунд: туда телепортируем. */
const TELEPORT_DISTANCE = 80;

/** Игровая логика считает в кадрах по 60 fps — переводим миллисекунды в них. */
const MS_PER_FRAME = 1000 / 60;

interface RemoteSample {
  /** Момент получения по локальным часам. */
  t: number;
  f: FighterTuple;
  p: ProjectileState | null;
}

export interface RemoteFrame {
  f: FighterTuple;
  p: ProjectileState | null;
}

function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function blendFighters(
  a: FighterTuple,
  b: FighterTuple,
  t: number,
  spanMs: number
): FighterTuple {
  const out: unknown[] = new Array(FIGHTER_FIELDS.length);
  // Атака идёт по своему таймеру: смешивать его можно, только если в обоих
  // снимках это один и тот же удар. Иначе досчитываем от старого снимка сами.
  const sameAttack =
    a[IDX_ATTACKING] === b[IDX_ATTACKING] && a[IDX_ATTACK_TYPE] === b[IDX_ATTACK_TYPE];

  for (let i = 0; i < FIGHTER_FIELDS.length; i++) {
    if (!BLEND_FIELDS.has(i)) {
      // Дискретные поля (facing, grounded, attacking, hp…) берём из снимка,
      // до которого уже дожили: так событие случается один раз и вовремя.
      out[i] = a[i];
      continue;
    }

    const from = num(a[i]), to = num(b[i]);

    if (i === IDX_X || i === IDX_Y) {
      out[i] = Math.abs(to - from) > TELEPORT_DISTANCE ? to : lerp(from, to, t);
      continue;
    }
    if (i === IDX_ATTACK_TIMER && !sameAttack) {
      // Удар начался или кончился между снимками: смешивать таймеры разных
      // ударов нельзя, поэтому просто крутим таймер старого снимка дальше.
      out[i] = Math.max(0, from - (t * spanMs) / MS_PER_FRAME);
      continue;
    }
    // animFrame/animTimer только растут; падение значения — сброс, не движение.
    if ((i === 17 || i === 18) && to < from) {
      out[i] = from;
      continue;
    }
    out[i] = lerp(from, to, t);
  }
  return out;
}

function extrapolateFighter(a: FighterTuple, aheadMs: number): FighterTuple {
  if (aheadMs <= 0) return a;
  const frames = aheadMs / MS_PER_FRAME;
  const out = a.slice();
  out[IDX_X] = num(a[IDX_X]) + num(a[IDX_VX]) * frames;
  out[IDX_ATTACK_TIMER] = Math.max(0, num(a[IDX_ATTACK_TIMER]) - frames);
  out[17] = num(a[17]) + frames / 8;
  return out;
}

function blendProjectiles(
  a: ProjectileState | null,
  b: ProjectileState | null,
  t: number
): ProjectileState | null {
  if (!a) return null;
  // Снаряд появился или исчез между снимками — смешивать нечего.
  if (!b) return { ...a };
  return { ...a, x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
}

export class RemoteFighterBuffer {
  private samples: RemoteSample[] = [];

  reset(): void {
    this.samples.length = 0;
  }

  push(t: number, f: FighterTuple, p: ProjectileState | null): void {
    this.samples.push({ t, f, p });
    // Больше десятка снимков — это полсекунды истории: столько не нужно даже
    // при рывках сети, а расти буфер без предела не должен.
    if (this.samples.length > 12) this.samples.shift();
  }

  /** Состояние чужого бойца на момент отрисовки. null — снимков ещё не было. */
  sample(now: number): RemoteFrame | null {
    if (!this.samples.length) return null;

    const target = now - INTERP_DELAY_MS;
    // Оставляем в буфере ровно один снимок раньше цели — он левая граница.
    while (this.samples.length > 1 && this.samples[1].t <= target) this.samples.shift();

    const a = this.samples[0];
    const b = this.samples[1];

    if (!b) {
      const ahead = Math.min(Math.max(target - a.t, 0), MAX_EXTRAPOLATION_MS);
      return { f: extrapolateFighter(a.f, ahead), p: a.p };
    }
    // Буфер ещё наполняется: до первого снимка «дожить» не успели.
    if (target <= a.t) return { f: a.f, p: a.p };

    const span = b.t - a.t;
    const k = span > 0 ? Math.min((target - a.t) / span, 1) : 1;
    return { f: blendFighters(a.f, b.f, k, span), p: blendProjectiles(a.p, b.p, k) };
  }
}
