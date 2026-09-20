import './heroLab.css';
import {
  CHARACTERS,
  BOSS_DATA,
  BOSS_MOVES,
  BOSS_MOVE_INFO,
  SPECIAL_COOLDOWN_FRAMES_DEFAULT,
  SPECIAL_COOLDOWN_FRAMES_SOFYA
} from './data/characters';
import { CharacterModelViewer } from './characterRenderer';
import { initVersionChecker } from './systems/versionChecker';

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

  const avatarContent = c.avatar
    ? `<img src="${c.avatar}" alt="${c.name}" class="hero-avatar-img" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" /><span class="hero-avatar-fallback" style="display:none;">${c.icon}</span>`
    : `<span class="hero-avatar-fallback">${c.icon}</span>`;

  return `<div class="hero-card" id="card_${c.id}" data-id="${c.id}" style="--stage-glow:${c.color}22">
    <div class="hero-card-head">
      <div class="hero-avatar" style="background:${c.color};border-color:${c.color}">${avatarContent}</div>
      <div>
        <div class="hero-name">${c.name}</div>
        <div class="hero-style">${c.style}</div>
      </div>
      <div class="card-toggle">
        <button class="card-toggle-btn active" data-view="model" title="Модель бойца">🎮</button>
        <button class="card-toggle-btn" data-view="art" title="Арт-карточка">🎨</button>
      </div>
    </div>

    <!-- Full-body character stage -->
    <div class="hero-stage">
      <div class="stage-viewport" data-id="${c.id}" title="Кликните, чтобы персонаж атаковал">
        <canvas id="canvas_${c.id}" class="hero-canvas"></canvas>
        <div class="hero-art-wrapper">
          <img src="/avatars/${c.id}.svg" alt="${c.name}" class="hero-full-art" loading="lazy" />
        </div>
        <span class="stage-hint">Клик — атака</span>
      </div>
      <div class="stage-actions">
        <button class="stage-btn active-action" data-id="${c.id}" data-action="idle">Стойка</button>
        <button class="stage-btn" data-id="${c.id}" data-action="light">Удар</button>
        <button class="stage-btn" data-id="${c.id}" data-action="heavy">Тяжёлый</button>
        <button class="stage-btn stage-btn-special" data-id="${c.id}" data-action="special" title="${c.special}">Спец</button>
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
      <div class="move-row" data-id="${c.id}" data-move="light" title="Наведите для анимации">
        <div class="move-title"><span>Удар (light)</span><span class="move-key">урон x1.0</span></div>
        <div class="move-desc">Быстрая атака ближнего боя.</div>
      </div>
      <div class="move-row" data-id="${c.id}" data-move="heavy" title="Наведите для анимации">
        <div class="move-title"><span>Тяжёлый (heavy)</span><span class="move-key">урон x1.8</span></div>
        <div class="move-desc">Более медленная, но сильная атака.</div>
      </div>
      <div class="move-row" data-id="${c.id}" data-move="special" title="Наведите для анимации">
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
    const action = key === 'spikes' || key === 'wave' || key === 'rain' || key === 'clones' ? 'light' : key;
    return `<div class="boss-move" data-id="darksergey" data-move="${action}" title="Наведите для анимации">
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
      <div class="boss-card-toggle">
        <button class="card-toggle-btn active" id="bossBtnModel" data-view="model">🎮 Модель</button>
        <button class="card-toggle-btn" id="bossBtnArt" data-view="art">🎨 Арт</button>
      </div>
    </div>

    <!-- Full-body Boss stage -->
    <div class="boss-stage-container">
      <div class="boss-stage-viewport" data-id="darksergey" title="Кликните для атаки босса">
        <canvas id="canvas_darksergey" class="boss-canvas"></canvas>
        <div class="boss-art-wrapper">
          <img src="/avatars/darksergey.svg" alt="Dark Sergey" class="boss-full-art" loading="lazy" />
        </div>
        <span class="stage-hint">Клик — атака</span>
      </div>
      <div class="boss-stage-actions">
        <button class="stage-btn active-action" data-id="darksergey" data-action="idle">Стойка</button>
        <button class="stage-btn" data-id="darksergey" data-action="light">Щупальце (T)</button>
        <button class="stage-btn" data-id="darksergey" data-action="heavy">Пасть (Y)</button>
        <button class="stage-btn stage-btn-boss-ulta" data-id="darksergey" data-action="ulta">☠ УЛЬТА БЕЗДНЫ (N)</button>
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

// Render HTML
const grid = document.getElementById('labGrid');
if (grid) grid.innerHTML = CHARACTERS.map(renderHeroCard).join('');

const bossEl = document.getElementById('labBoss');
if (bossEl) bossEl.innerHTML = renderBoss();

// Initialize Viewers for all characters + Boss
interface ViewerItem {
  id: string;
  viewer: CharacterModelViewer;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
}

const viewers: Map<string, ViewerItem> = new Map();

function initViewer(id: string, charData: any) {
  const canvas = document.getElementById(`canvas_${id}`) as HTMLCanvasElement | null;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const viewer = new CharacterModelViewer(charData);
  viewers.set(id, { id, viewer, canvas, ctx });
}

CHARACTERS.forEach(c => initViewer(c.id, c));
initViewer('darksergey', BOSS_DATA);

// Set canvas dimensions with devicePixelRatio for sharpness
function resizeCanvas(item: ViewerItem) {
  const rect = item.canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const targetW = Math.round(rect.width * dpr);
  const targetH = Math.round(rect.height * dpr);

  if (item.canvas.width !== targetW || item.canvas.height !== targetH) {
    item.canvas.width = targetW;
    item.canvas.height = targetH;
  }
}

// Animation loop
let lastTime = 0;
function animate(timestamp: number) {
  if (!lastTime) lastTime = timestamp;
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;
  const time = timestamp / 1000;

  for (const item of viewers.values()) {
    // Only render visible canvases
    if (item.canvas.offsetParent === null) continue;

    resizeCanvas(item);
    const { canvas, ctx, viewer } = item;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    viewer.update(dt);
    viewer.draw(ctx, w, h, time);

    ctx.restore();
  }

  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);

// Attack triggering helper
function triggerHeroAttack(id: string, action: string) {
  const item = viewers.get(id);
  if (!item) return;

  if (action === 'idle') {
    item.viewer.attacking = false;
    item.viewer.attackType = '';
  } else {
    item.viewer.triggerAttack(action);
  }

  // Update button active state
  const stage = id === 'darksergey'
    ? document.querySelector('.boss-stage-actions')
    : document.querySelector(`#card_${id} .stage-actions`);

  if (stage) {
    stage.querySelectorAll('.stage-btn').forEach(btn => {
      const b = btn as HTMLButtonElement;
      b.classList.toggle('active-action', b.dataset.action === action);
    });
  }
}

// Interactive event listeners
document.addEventListener('click', e => {
  const target = e.target as HTMLElement;

  // Stage action buttons: [Стойка], [Удар], [Тяжёлый], [Спец]
  const btn = target.closest('.stage-btn') as HTMLElement | null;
  if (btn && btn.dataset.id && btn.dataset.action) {
    triggerHeroAttack(btn.dataset.id, btn.dataset.action);
    return;
  }

  // Click on viewport directly to attack
  const viewport = target.closest('.stage-viewport, .boss-stage-viewport') as HTMLElement | null;
  if (viewport && viewport.dataset.id) {
    const id = viewport.dataset.id;
    const item = viewers.get(id);
    if (item) {
      const nextAction = !item.viewer.attacking
        ? 'light'
        : (item.viewer.attackType === 'light' ? 'heavy' : (id === 'darksergey' ? 'ulta' : 'special'));
      triggerHeroAttack(id, nextAction);
    }
    return;
  }

  // Individual card toggle [🎮] / [🎨]
  const cardToggleBtn = target.closest('.card-toggle-btn') as HTMLElement | null;
  if (cardToggleBtn && cardToggleBtn.dataset.view) {
    const isBoss = cardToggleBtn.closest('.boss-card-toggle') !== null;
    const view = cardToggleBtn.dataset.view;
    if (isBoss) {
      const boss = document.getElementById('labBoss');
      if (boss) boss.classList.toggle('is-art-mode', view === 'art');
      document.querySelectorAll('.boss-card-toggle .card-toggle-btn').forEach(b => {
        b.classList.toggle('active', (b as HTMLElement).dataset.view === view);
      });
    } else {
      const card = cardToggleBtn.closest('.hero-card') as HTMLElement | null;
      if (card) {
        card.classList.toggle('is-art-mode', view === 'art');
        card.querySelectorAll('.card-toggle-btn').forEach(b => {
          b.classList.toggle('active', (b as HTMLElement).dataset.view === view);
        });
      }
    }
  }
});

// Hover on move rows in moves list triggers the move animation!
document.addEventListener('mouseover', e => {
  const target = e.target as HTMLElement;
  const moveRow = target.closest('.move-row, .boss-move') as HTMLElement | null;
  if (moveRow && moveRow.dataset.id && moveRow.dataset.move) {
    triggerHeroAttack(moveRow.dataset.id, moveRow.dataset.move);
  }
});

// Global view mode toggle in header: [🎮 Бойцы в полный рост] / [🎨 Полные арт-карточки]
const btnModeModel = document.getElementById('btnModeModel');
const btnModeArt = document.getElementById('btnModeArt');

function setGlobalMode(mode: 'model' | 'art') {
  btnModeModel?.classList.toggle('active', mode === 'model');
  btnModeArt?.classList.toggle('active', mode === 'art');

  const isArt = mode === 'art';
  document.querySelectorAll('.hero-card').forEach(card => {
    card.classList.toggle('is-art-mode', isArt);
    card.querySelectorAll('.card-toggle-btn').forEach(btn => {
      btn.classList.toggle('active', (btn as HTMLElement).dataset.view === mode);
    });
  });

  const boss = document.getElementById('labBoss');
  if (boss) {
    boss.classList.toggle('is-art-mode', isArt);
    boss.querySelectorAll('.card-toggle-btn').forEach(btn => {
      btn.classList.toggle('active', (btn as HTMLElement).dataset.view === mode);
    });
  }
}

btnModeModel?.addEventListener('click', () => setGlobalMode('model'));
btnModeArt?.addEventListener('click', () => setGlobalMode('art'));

// Support deep linking to art mode via ?mode=art or #art
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('mode') === 'art' || window.location.hash === '#art') {
  setGlobalMode('art');
}

initVersionChecker();
