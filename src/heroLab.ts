import './heroLab.css';
import { CHARACTERS, BOSS_DATA, BOSS_MOVES, BOSS_MOVE_INFO, SPECIAL_COOLDOWN_FRAMES_DEFAULT, SPECIAL_COOLDOWN_FRAMES_SOFYA } from './data/characters';

const FPS = 60;

function statBar(label: string, value: number, color: string): string {
  return `<div class="stat-row">
    <span class="stat-label">${label}</span>
    <div class="stat-track"><div class="stat-fill" style="width:${Math.min(100, value)}%;background:${color}"></div></div>
    <span class="stat-value">${value}</span>
  </div>`;
}

function renderHeroCard(c: any): string {
  const specialCd = c.specialCooldown || (c.id === 'sofya' ? SPECIAL_COOLDOWN_FRAMES_SOFYA : SPECIAL_COOLDOWN_FRAMES_DEFAULT);
  const specialCdSec = (specialCd / FPS).toFixed(1);

  const tags = [`HP ${c.hp}`, `Скорость ${c.speed}`, `Сила ${c.power}`, `Защита ${c.defense}`];
  if (c.projectile) tags.push('Дальнобойный');

  const avatarContent = c.avatar
    ? `<img src="${c.avatar}" alt="${c.name}" class="hero-avatar-img" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" /><span class="hero-avatar-fallback" style="display:none;">${c.icon}</span>`
    : `<span class="hero-avatar-fallback">${c.icon}</span>`;

  return `<div class="hero-card">
    <div class="hero-card-head">
      <div class="hero-avatar" style="background:${c.color};border-color:${c.color}">${avatarContent}</div>
      <div>
        <div class="hero-name">${c.name}</div>
        <div class="hero-style">${c.style}</div>
      </div>
    </div>

    <div class="hero-stats">
      ${statBar('ATK', c.statATK, c.color)}
      ${statBar('DEF', c.statDEF, c.colorLight || c.color)}
      ${statBar('SPD', c.statSPD, c.colorDark || c.color)}
    </div>

    <div class="hero-raw">
      <span><b>${c.hp}</b> HP</span>
      <span><b>${c.speed}</b> скорость</span>
      <span><b>${c.power}</b> сила</span>
      <span><b>${c.defense}</b> защита</span>
    </div>

    <div class="hero-moves">
      <div class="move-row">
        <div class="move-title"><span>Удар (light)</span><span class="move-key">урон x1.0</span></div>
        <div class="move-desc">Быстрая атака ближнего боя.</div>
      </div>
      <div class="move-row">
        <div class="move-title"><span>Тяжёлый (heavy)</span><span class="move-key">урон x1.8</span></div>
        <div class="move-desc">Более медленная, но сильная атака.</div>
      </div>
      <div class="move-row">
        <div class="move-title"><span>${c.special} (special)</span><span class="move-key">откат ${specialCdSec} сек</span></div>
        <div class="move-desc">${c.specialDesc}</div>
      </div>
    </div>
  </div>`;
}

function renderBoss(): string {
  const movesHtml = Object.keys(BOSS_MOVES).map(key => {
    const m = (BOSS_MOVES as any)[key];
    const info = (BOSS_MOVE_INFO as any)[key];
    const durSec = (m.dur / FPS).toFixed(2);
    const cdSec = m.cd ? (m.cd / FPS).toFixed(1) + ' сек' : '—';
    return `<div class="boss-move">
      <div class="boss-move-title"><span>${info.name}</span><span>[${m.key}]</span></div>
      <div class="boss-move-desc">${info.desc}<br>Длительность: ${durSec} сек · Откат: ${cdSec}</div>
    </div>`;
  }).join('');

  return `
    <div class="boss-head">
      <div class="boss-icon">
        <img src="${BOSS_DATA.avatar}" alt="${BOSS_DATA.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='block';" />
        <span style="display:none;">${BOSS_DATA.icon}</span>
      </div>
      <div>
        <div class="boss-name">${BOSS_DATA.name}</div>
        <div class="boss-style">${BOSS_DATA.style} · ${BOSS_DATA.special}</div>
      </div>
    </div>
    <div class="boss-stats">
      <span><b>${BOSS_DATA.hp}</b> HP</span>
      <span><b>${BOSS_DATA.speed}</b> скорость</span>
      <span><b>${BOSS_DATA.power}</b> сила</span>
      <span><b>${BOSS_DATA.defense}</b> защита</span>
      <span>ATK <b>${BOSS_DATA.statATK}</b></span>
      <span>DEF <b>${BOSS_DATA.statDEF}</b></span>
      <span>SPD <b>${BOSS_DATA.statSPD}</b></span>
    </div>
    <div class="boss-moves">${movesHtml}</div>
  `;
}

const grid = document.getElementById('labGrid');
if (grid) grid.innerHTML = CHARACTERS.map(renderHeroCard).join('');

const bossEl = document.getElementById('labBoss');
if (bossEl) bossEl.innerHTML = renderBoss();
