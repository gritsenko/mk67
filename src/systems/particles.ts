import { PLAYER_SCALE } from '../game/config';

interface Particle { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: string; size: number; type: string; }
const particles: Particle[] = [];

export function resetParticles() { particles.length = 0; }

export function spawnParticles(x: number, y: number, color: string, count: number, type: string) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = type === 'hit' ? Math.random() * 6 + 2 : type === 'rock' ? Math.random() * 4 - 2 : Math.random();
    particles.push({ x, y, vx: Math.cos(angle) * speed, vy: type === 'rock' ? -Math.random() * 8 : type === 'heal' ? -1.5 - Math.random() : Math.sin(angle) * speed - (type === 'hit' ? 3 : 1), life: type === 'dust' ? 15 : type === 'rock' ? 40 : type === 'heal' ? 40 : 30 + Math.random() * 20, maxLife: 50, color, size: (type === 'hit' ? Math.random() * 4 + 2 : type === 'rock' ? Math.random() * 8 + 4 : type === 'heal' ? 4 : Math.random() * 2 + 1) * PLAYER_SCALE, type });
  }
}

export function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const particle = particles[i]; particle.x += particle.vx; particle.y += particle.vy; particle.vy += particle.type === 'heal' ? -0.02 : 0.15; particle.life--;
    if (particle.life <= 0) particles.splice(i, 1);
  }
}

export function drawParticles(ctx: CanvasRenderingContext2D) {
  particles.forEach((particle) => {
    const alpha = Math.max(0, particle.life / particle.maxLife);
    ctx.globalAlpha = alpha; ctx.fillStyle = particle.color;
    if (particle.type === 'hit') { ctx.shadowColor = particle.color; ctx.shadowBlur = 10; }
    if (particle.type === 'rock') ctx.fillRect(particle.x - particle.size / 2, particle.y - particle.size / 2, particle.size, particle.size);
    else if (particle.type === 'heal') { ctx.fillRect(particle.x - particle.size / 2, particle.y - particle.size / 6, particle.size, particle.size / 3); ctx.fillRect(particle.x - particle.size / 6, particle.y - particle.size / 2, particle.size / 3, particle.size); }
    else { ctx.beginPath(); ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2); ctx.fill(); }
    ctx.shadowBlur = 0;
  });
  ctx.globalAlpha = 1;
}

