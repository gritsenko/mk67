// Единый источник данных о бойцах и боссе.
// Используется игрой (game.ts) и страницей hero-lab (heroLab.ts) —
// любые параметры, механики и аватарки настраиваются здесь.

export interface CharacterConfig {
  id: string;
  name: string;
  style: string;
  icon: string;
  avatar: string;
  color: string;
  colorDark: string;
  colorLight: string;
  skin: string;
  hp: number;
  speed: number;
  power: number;
  defense: number;
  statATK: number;
  statDEF: number;
  statSPD: number;
  bodyW: number;
  bodyH: number;
  special: string;
  specialDesc: string;
  specialCooldown?: number;
  specialDamageMult?: number;
  projectile?: boolean;
  projectileSpeed?: number;
  dashVx?: number;
  leapVy?: number;
  leapVx?: number;
  healPercent?: number;
  slowDuration?: number;
  slowFactor?: number;
  bigExplosion?: boolean;
  acidSplash?: boolean;
  isBoss?: boolean;
}

export const SPECIAL_COOLDOWN_FRAMES_DEFAULT = 180;
export const SPECIAL_COOLDOWN_FRAMES_SOFYA = 300;

export const CHARACTERS: CharacterConfig[] = [
  {
    id: 'dima',
    name: 'Дима',
    style: 'Сбалансированный',
    icon: 'Д',
    avatar: '/avatars/dima.jpg',
    color: '#ff4d2a',
    colorDark: '#8b0000',
    colorLight: '#ff8a65',
    skin: '#e8b89d',
    hp: 100,
    speed: 5.5,
    power: 12,
    defense: 0.9,
    statATK: 60,
    statDEF: 55,
    statSPD: 65,
    bodyW: 62,
    bodyH: 126,
    special: 'Огненный кулак',
    specialDesc: 'Мощный огненный удар кулаком вперёд, урон x2.2 от силы удара.',
    specialCooldown: SPECIAL_COOLDOWN_FRAMES_DEFAULT,
    specialDamageMult: 2.2
  },
  {
    id: 'lexa',
    name: 'Лёха',
    style: 'Тяжеловес',
    icon: 'Л',
    avatar: '/avatars/lexa.jpg',
    color: '#e040fb',
    colorDark: '#7b1fa2',
    colorLight: '#f48fb1',
    skin: '#d7a98c',
    hp: 120,
    speed: 4.0,
    power: 18,
    defense: 1.2,
    statATK: 90,
    statDEF: 75,
    statSPD: 30,
    bodyW: 81,
    bodyH: 133,
    special: 'Мега-удар',
    specialDesc: 'Тяжёлый акцентированный удар с огромным замахом, урон x2.2 от силы удара.',
    specialCooldown: SPECIAL_COOLDOWN_FRAMES_DEFAULT,
    specialDamageMult: 2.2
  },
  {
    id: 'artem',
    name: 'Артём',
    style: 'Скоростной',
    icon: 'А',
    avatar: '/avatars/artem.jpg',
    color: '#00e5ff',
    colorDark: '#006064',
    colorLight: '#80deea',
    skin: '#ffe0bd',
    hp: 80,
    speed: 8.1,
    power: 9,
    defense: 0.7,
    statATK: 40,
    statDEF: 35,
    statSPD: 95,
    bodyW: 53,
    bodyH: 119,
    special: 'Вихрь ударов',
    specialDesc: 'Серия быстрых слабых ударов (x0.6 от силы удара за удар) — компенсирует низкий урон высокой скоростью.',
    specialCooldown: SPECIAL_COOLDOWN_FRAMES_DEFAULT,
    specialDamageMult: 0.6
  },
  {
    id: 'maks',
    name: 'Макс',
    style: 'Танк',
    icon: 'М',
    avatar: '/avatars/maks.svg',
    color: '#76ff03',
    colorDark: '#33691e',
    colorLight: '#c5e1a5',
    skin: '#c68642',
    hp: 140,
    speed: 3.8,
    power: 14,
    defense: 1.5,
    statATK: 55,
    statDEF: 95,
    statSPD: 25,
    bodyW: 87,
    bodyH: 119,
    special: 'Землетрясение',
    specialDesc: 'Мощный удар оземь с большим уроном (x2.2 от силы удара), опирается на высокую защиту и HP.',
    specialCooldown: SPECIAL_COOLDOWN_FRAMES_DEFAULT,
    specialDamageMult: 2.2
  },
  {
    id: 'sanya',
    name: 'Саня',
    style: 'Хитрец',
    icon: 'С',
    avatar: '/avatars/sanya.svg',
    color: '#ff9100',
    colorDark: '#e65100',
    colorLight: '#ffcc80',
    skin: '#f3d5b5',
    hp: 90,
    speed: 6.0,
    power: 11,
    defense: 0.8,
    statATK: 50,
    statDEF: 40,
    statSPD: 70,
    bodyW: 59,
    bodyH: 123,
    special: 'Дальняя атака',
    specialDesc: 'Запускает снаряд по прямой (скорость 10), наносит x0.8 урона при попадании.',
    projectile: true,
    projectileSpeed: 10,
    specialCooldown: SPECIAL_COOLDOWN_FRAMES_DEFAULT,
    specialDamageMult: 2.2
  },
  {
    id: 'kostya',
    name: 'Костя',
    style: 'Технарь',
    icon: 'К',
    avatar: '/avatars/kostya.svg',
    color: '#ffd600',
    colorDark: '#f57f17',
    colorLight: '#fff9c4',
    skin: '#fce4ec',
    hp: 95,
    speed: 6.2,
    power: 13,
    defense: 0.85,
    statATK: 70,
    statDEF: 50,
    statSPD: 60,
    bodyW: 62,
    bodyH: 126,
    special: 'Комбо-рывок',
    specialDesc: 'Резкий рывок-удар вперёд, урон x2.2 от силы удара.',
    specialCooldown: SPECIAL_COOLDOWN_FRAMES_DEFAULT,
    specialDamageMult: 2.2
  },
  {
    id: 'grisha',
    name: 'Гриша',
    style: 'Токсиколог',
    icon: 'Г',
    avatar: '/avatars/grisha.svg',
    color: '#1de9b6',
    colorDark: '#00875a',
    colorLight: '#a7ffeb',
    skin: '#d7a98c',
    hp: 95,
    speed: 4.2,
    power: 11,
    defense: 0.85,
    statATK: 55,
    statDEF: 60,
    statSPD: 50,
    bodyW: 62,
    bodyH: 126,
    special: 'Кислотный залп',
    specialDesc: 'Запускает кислотный снаряд (скорость 8, x0.8 урона), при попадании дополнительно разбрызгивает кислоту.',
    projectile: true,
    projectileSpeed: 8,
    acidSplash: true,
    specialCooldown: SPECIAL_COOLDOWN_FRAMES_DEFAULT,
    specialDamageMult: 2.2
  },
  {
    id: 'ilya',
    name: 'Илья',
    style: 'Ледяной рыцарь',
    icon: 'И',
    avatar: '/avatars/ilya.svg',
    color: '#448aff',
    colorDark: '#0d47a1',
    colorLight: '#b3e5fc',
    skin: '#f0d5c0',
    hp: 110,
    speed: 4.0,
    power: 15,
    defense: 1.1,
    statATK: 75,
    statDEF: 70,
    statSPD: 40,
    bodyW: 66,
    bodyH: 130,
    special: 'Морозный шип',
    specialDesc: 'Ледяной удар (x2.2 урона), при попадании замедляет противника на 2.5 сек (скорость -55%).',
    slowDuration: 150,
    slowFactor: 0.45,
    specialCooldown: SPECIAL_COOLDOWN_FRAMES_DEFAULT,
    specialDamageMult: 2.2
  },
  {
    id: 'david',
    name: 'Давид',
    style: 'Боксёр',
    icon: 'Дв',
    avatar: '/avatars/david.svg',
    color: '#ff4081',
    colorDark: '#a00037',
    colorLight: '#ff80ab',
    skin: '#c68642',
    hp: 100,
    speed: 5.2,
    power: 13,
    defense: 0.9,
    statATK: 75,
    statDEF: 50,
    statSPD: 65,
    bodyW: 66,
    bodyH: 126,
    special: 'Ружа',
    specialDesc: 'Быстрый акцентированный удар боксёра, урон x2.2 от силы удара.',
    specialCooldown: SPECIAL_COOLDOWN_FRAMES_DEFAULT,
    specialDamageMult: 2.2
  },
  {
    id: 'matvey',
    name: 'Матвей',
    style: 'Стратег',
    icon: 'Мт',
    avatar: '/avatars/matvey.svg',
    color: '#a1887f',
    colorDark: '#5d4037',
    colorLight: '#d7ccc8',
    skin: '#f3d5b5',
    hp: 90,
    speed: 5.0,
    power: 12,
    defense: 0.85,
    statATK: 65,
    statDEF: 50,
    statSPD: 60,
    bodyW: 62,
    bodyH: 126,
    special: 'Прыжок коня',
    specialDesc: 'Прыжок буквой "Г" вперёд-вверх (как ход коня в шахматах) с ударом при приземлении, урон x2.2.',
    leapVy: -14,
    leapVx: 7,
    specialCooldown: SPECIAL_COOLDOWN_FRAMES_DEFAULT,
    specialDamageMult: 2.2
  },
  {
    id: 'nikita',
    name: 'Никита',
    style: 'Рокер',
    icon: 'Н',
    avatar: '/avatars/nikita.svg',
    color: '#b0bec5',
    colorDark: '#546e7a',
    colorLight: '#eceff1',
    skin: '#e8b89d',
    hp: 105,
    speed: 4.4,
    power: 12,
    defense: 1.0,
    statATK: 60,
    statDEF: 65,
    statSPD: 55,
    bodyW: 62,
    bodyH: 126,
    special: 'Соло-волна',
    specialDesc: 'Звуковая волна от гитары — снаряд по прямой (скорость 9, x0.8 урона).',
    projectile: true,
    projectileSpeed: 9,
    specialCooldown: SPECIAL_COOLDOWN_FRAMES_DEFAULT,
    specialDamageMult: 2.2
  },
  {
    id: 'varya',
    name: 'Варя',
    style: 'Охотница',
    icon: 'В',
    avatar: '/avatars/varya.svg',
    color: '#ef5350',
    colorDark: '#b71c1c',
    colorLight: '#ffcdd2',
    skin: '#f0d5c0',
    hp: 85,
    speed: 5.5,
    power: 10,
    defense: 0.75,
    statATK: 45,
    statDEF: 35,
    statSPD: 80,
    bodyW: 53,
    bodyH: 119,
    special: 'Верная стрела',
    specialDesc: 'Самый быстрый снаряд в игре (скорость 16), x0.8 урона.',
    projectile: true,
    projectileSpeed: 16,
    specialCooldown: SPECIAL_COOLDOWN_FRAMES_DEFAULT,
    specialDamageMult: 2.2
  },
  {
    id: 'alisa',
    name: 'Алиса',
    style: 'Всадница',
    icon: 'Ал',
    avatar: '/avatars/alisa.svg',
    color: '#f48fb1',
    colorDark: '#c2185b',
    colorLight: '#fce4ec',
    skin: '#ffe0bd',
    hp: 85,
    speed: 6.8,
    power: 10,
    defense: 0.7,
    statATK: 50,
    statDEF: 35,
    statSPD: 90,
    bodyW: 53,
    bodyH: 119,
    special: 'Удар копытами',
    specialDesc: 'Конь встаёт на дыбы и бьёт врага передними копытами, урон x2.2 от силы удара.',
    dashVx: 6.5,
    specialCooldown: SPECIAL_COOLDOWN_FRAMES_DEFAULT,
    specialDamageMult: 2.2
  },
  {
    id: 'sofya',
    name: 'Софья',
    style: 'Медик',
    icon: 'Сф',
    avatar: '/avatars/sofya.svg',
    color: '#eceff1',
    colorDark: '#90a4ae',
    colorLight: '#ffffff',
    skin: '#f3d5b5',
    hp: 90,
    speed: 4.6,
    power: 11,
    defense: 0.8,
    statATK: 50,
    statDEF: 45,
    statSPD: 55,
    bodyW: 62,
    bodyH: 126,
    special: 'Аптечка',
    specialDesc: 'Не атакует — восстанавливает себе 20% максимального HP. Откат в 1.7 раза дольше, чем у остальных (5 сек вместо 3).',
    healPercent: 0.2,
    specialCooldown: SPECIAL_COOLDOWN_FRAMES_SOFYA,
    specialDamageMult: 0
  },
  {
    id: 'sergey',
    name: 'Сергей',
    style: 'Командос',
    icon: 'Сг',
    avatar: '/avatars/sergey.svg',
    color: '#7cb342',
    colorDark: '#33691e',
    colorLight: '#dcedc8',
    skin: '#d7a98c',
    hp: 115,
    speed: 4.2,
    power: 14,
    defense: 1.15,
    statATK: 70,
    statDEF: 80,
    statSPD: 40,
    bodyW: 66,
    bodyH: 123,
    special: 'Граната',
    specialDesc: 'Бросок гранаты (снаряд, скорость 7, x0.8 урона) с усиленным взрывом и отдачей экрана при попадании.',
    projectile: true,
    projectileSpeed: 7,
    bigExplosion: true,
    specialCooldown: SPECIAL_COOLDOWN_FRAMES_DEFAULT,
    specialDamageMult: 2.2
  }
];

export const BOSS_DATA: CharacterConfig = {
  id: 'darksergey',
  name: 'ТЁМНЫЙ СЕРГЕЙ',
  style: 'ГИГА-БОСС БЕЗДНЫ',
  icon: '☠',
  avatar: '/avatars/darksergey.svg',
  color: '#76ff03',
  colorDark: '#0a140a',
  colorLight: '#b39ddb',
  skin: '#131f15',
  hp: 420,
  speed: 3.4,
  power: 15,
  defense: 1.25,
  statATK: 100,
  statDEF: 100,
  statSPD: 20,
  bodyW: 190,
  bodyH: 330,
  special: 'Владыка Бездны',
  specialDesc: 'Древняя сущность бездны, повелевающая щупальцами, шипами и темным дождем.',
  isBoss: true
};

export const BOSS_MOVES: Record<string, { dur: number; cd?: number; key: string }> = {
  light: { dur: 22, key: 'T' },
  heavy: { dur: 32, key: 'Y' },
  spikes: { dur: 44, cd: 240, key: 'G' },
  wave: { dur: 40, cd: 300, key: 'H' },
  rain: { dur: 50, cd: 360, key: 'V' },
  clones: { dur: 44, cd: 420, key: 'B' },
  ulta: { dur: 90, cd: 720, key: 'N' }
};

export const BOSS_MOVE_INFO: Record<string, { name: string; desc: string }> = {
  light: { name: 'Хлыст', desc: 'Быстрый удар щупальцем, урон 16.' },
  heavy: { name: 'Пасть', desc: 'Укус с большим замахом, урон 28.' },
  spikes: { name: 'Шипы', desc: 'Ряд шипов из земли на линии перед боссом.' },
  wave: { name: 'Волна', desc: 'Снаряд-волна по земле, урон 24.' },
  rain: { name: 'Дождь', desc: '5 снарядов падают с неба на позицию игрока, урон 14 за попадание.' },
  clones: { name: 'Клоны', desc: 'Веер из 3 снарядов, урон 18 за попадание.' },
  ulta: { name: 'УЛЬТА', desc: 'Финальная атака боссфазы — самый долгий откат (12 сек).' }
};

export const CHARACTERS_MAP: Record<string, CharacterConfig> = CHARACTERS.reduce((acc, char) => {
  acc[char.id] = char;
  return acc;
}, {} as Record<string, CharacterConfig>);

export function getCharacterById(id: string): CharacterConfig | undefined {
  if (id === 'darksergey') return BOSS_DATA;
  return CHARACTERS_MAP[id];
}
