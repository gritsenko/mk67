import { GAME_HEIGHT, GAME_WIDTH } from '../game/config';

interface Star { x: number; y: number; r: number; a: number; speed: number; }
interface Building { x: number; w: number; h: number; windows: boolean; }

export interface BackgroundState { stars: Star[]; buildings: Building[]; }

export function createBackground(): BackgroundState {
  const stars: Star[] = [];
  for (let i = 0; i < 80; i++) stars.push({ x: Math.random() * GAME_WIDTH, y: Math.random() * GAME_HEIGHT * 0.5, r: Math.random() * 1.5 + 0.3, a: Math.random() * 0.6 + 0.2, speed: Math.random() * 0.003 + 0.001 });
  const buildings: Building[] = [];
  let x = 0;
  while (x < GAME_WIDTH) {
    const w = Math.random() * 60 + 30;
    buildings.push({ x, w, h: Math.random() * 150 + 60, windows: Math.random() > 0.3 });
    x += w + Math.random() * 10;
  }
  return { stars, buildings };
}

export function drawBackground(ctx: CanvasRenderingContext2D, background: BackgroundState, time: number, bossFight: boolean) {
  const grad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
  grad.addColorStop(0, '#0a0a1a'); grad.addColorStop(0.4, '#1a0f20'); grad.addColorStop(0.7, '#2a1520'); grad.addColorStop(1, '#0d0d15');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  background.stars.forEach((star) => {
    const flicker = Math.sin(time * star.speed * 1000) * 0.3 + 0.7;
    ctx.fillStyle = `rgba(255,230,200,${star.a * flicker})`;
    ctx.beginPath(); ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2); ctx.fill();
  });
  const groundY = GAME_HEIGHT * 0.82;
  background.buildings.forEach((building) => {
    ctx.fillStyle = '#0f0f18'; ctx.fillRect(building.x, groundY - building.h, building.w, building.h);
    if (building.windows) for (let y = groundY - building.h + 10; y < groundY - 10; y += 18) for (let x = building.x + 6; x < building.x + building.w - 6; x += 12) {
      const lit = Math.sin(x * 3.7 + y * 2.1 + time * 0.5) > 0.3;
      ctx.fillStyle = lit ? 'rgba(255,180,60,0.25)' : 'rgba(30,30,50,0.3)'; ctx.fillRect(x, y, 6, 8);
    }
  });
  const floor = ctx.createLinearGradient(0, groundY, 0, GAME_HEIGHT);
  floor.addColorStop(0, '#2a1f1a'); floor.addColorStop(0.3, '#1a1410'); floor.addColorStop(1, '#0a0a0f');
  ctx.fillStyle = floor; ctx.fillRect(0, groundY, GAME_WIDTH, GAME_HEIGHT - groundY);
  ctx.strokeStyle = 'rgba(255,77,42,0.3)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(GAME_WIDTH, groundY); ctx.stroke();
  const glow = ctx.createRadialGradient(GAME_WIDTH / 2, groundY, 0, GAME_WIDTH / 2, groundY, GAME_WIDTH * 0.4);
  glow.addColorStop(0, 'rgba(255,77,42,0.08)'); glow.addColorStop(1, 'rgba(255,77,42,0)'); ctx.fillStyle = glow; ctx.fillRect(0, groundY - 40, GAME_WIDTH, 80);
  if (bossFight) { ctx.fillStyle = `rgba(40,10,50,${0.12 + Math.sin(time * 1.5) * 0.05})`; ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT); }
}

