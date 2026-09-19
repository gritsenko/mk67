import fs from 'fs';

const code = fs.readFileSync('src/game.ts', 'utf8');
const start = code.indexOf('  tentacle(time,x0,y0,dir,len,speed,phase,color,w){');
const end = code.indexOf('\n  }\n}\n\nfunction drawProjectileVis', start) + 4;
const methodsBlock = code.substring(start, end);

const out = `// @ts-nocheck
import type { CharacterConfig } from './data/characters';

export const SCALE = 1.4;
export const BOSS_SCALE = 1.35;

let ctx: any = null;
let activeSpawnParticles: ((x: number, y: number, color: string, count: number, type: string) => void) | null = null;

function roundRect(x: number, y: number, w: number, h: number, r: number) {
  if (!ctx) return;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function spawnParticles(x: number, y: number, color: string, count: number, type: string) {
  if (activeSpawnParticles) {
    activeSpawnParticles(x, y, color, count, type);
  }
}

export interface PreviewParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: string;
}

export class CharacterModelViewer {
  data: CharacterConfig;
  x: number = 0;
  y: number = 0;
  feetY: number = 0;
  groundY: number = 0;
  bodyH: number = 120;
  facing: number = 1;
  attacking: boolean = false;
  attackType: string = '';
  attackTimer: number = 0;
  attackDuration: number = 0;
  blocking: boolean = false;
  hurtTimer: number = 0;
  slowTimer: number = 0;
  animFrame: number = 0;
  animTimer: number = 0;
  vx: number = 0;
  vy: number = 0;
  particles: PreviewParticle[] = [];

  constructor(data: CharacterConfig) {
    this.data = data;
    this.bodyH = data.bodyH || 120;
  }

  get centerY() {
    return this.feetY - this.bodyH / 2;
  }

  triggerAttack(type: string = 'light') {
    this.attacking = true;
    this.attackType = type;
    if (this.data.isBoss) {
      if (type === 'light') this.attackDuration = 18;
      else if (type === 'heavy') this.attackDuration = 32;
      else if (type === 'ulta') this.attackDuration = 55;
      else this.attackDuration = 30;
    } else {
      if (type === 'light') this.attackDuration = 16;
      else if (type === 'heavy') this.attackDuration = 28;
      else if (type === 'special') this.attackDuration = 38;
      else this.attackDuration = 20;
    }
    this.attackTimer = this.attackDuration;
  }

  update(dt: number = 1 / 60) {
    if (this.attacking) {
      this.attackTimer--;
      if (this.attackTimer <= 0) {
        this.attacking = false;
        this.attackType = '';
      }
    }
    this.animTimer++;
    if (this.animTimer > 8) {
      this.animTimer = 0;
      this.animFrame++;
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  spawnParticle(x: number, y: number, color: string, count: number, type: string) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = type === 'hit' ? Math.random() * 4 + 2 : type === 'rock' ? Math.random() * 3 + 1 : Math.random() * 1.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: type === 'rock' ? -Math.random() * 5 : type === 'heal' ? -1 - Math.random() : Math.sin(angle) * speed - (type === 'hit' ? 2 : 0.5),
        life: type === 'dust' ? 15 : type === 'rock' ? 30 : type === 'heal' ? 35 : 25 + Math.random() * 15,
        maxLife: 40,
        color,
        size: (type === 'hit' ? Math.random() * 3 + 2 : type === 'rock' ? Math.random() * 5 + 3 : type === 'heal' ? 3.5 : Math.random() * 2 + 1) * SCALE,
        type
      });
    }
  }

  draw(targetCtx: CanvasRenderingContext2D, width: number, height: number, time: number, customScale?: number) {
    ctx = targetCtx;
    activeSpawnParticles = (x, y, color, count, type) => {
      this.spawnParticle(x, y, color, count, type);
    };

    const isBoss = !!this.data.isBoss;
    const groundY = height * (isBoss ? 0.88 : 0.84);
    const feetY = groundY;
    const centerX = width / 2;

    this.x = centerX;
    this.feetY = feetY;
    this.groundY = groundY;

    // Platform glow and shadow
    ctx.save();
    const shadowW = isBoss ? 80 : 38 * SCALE;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(centerX, groundY + 2, shadowW, isBoss ? 14 : 8 * SCALE, 0, 0, Math.PI * 2);
    ctx.fill();

    // Subtle arena pedestal ring
    ctx.strokeStyle = this.data.color;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(centerX, groundY + 2, shadowW * 1.25, isBoss ? 18 : 11 * SCALE, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;

    const defaultScale = isBoss ? BOSS_SCALE * 0.72 : (this.data.id === 'alisa' ? SCALE * 0.95 : (this.data.id === 'maks' ? SCALE * 1.05 : SCALE * 1.15));
    const sc = customScale || defaultScale;
    ctx.translate(centerX, feetY);
    ctx.scale(this.facing * sc, sc);

    const idle = Math.sin(time * 3) * 3;
    const walk = 0;

    if (isBoss) {
      this.drawDarkSergey(time, idle, walk);
    } else {
      switch (this.data.id) {
        case 'dima': this.drawDima(time, idle, walk); break;
        case 'lexa': this.drawLexa(time, idle, walk); break;
        case 'artem': this.drawArtem(time, idle, walk); break;
        case 'maks': this.drawMaks(time, idle, walk); break;
        case 'sanya': this.drawSanya(time, idle, walk); break;
        case 'kostya': this.drawKostya(time, idle, walk); break;
        case 'grisha': this.drawGrisha(time, idle, walk); break;
        case 'ilya': this.drawIlya(time, idle, walk); break;
        case 'david': this.drawDavid(time, idle, walk); break;
        case 'matvey': this.drawMatvey(time, idle, walk); break;
        case 'nikita': this.drawNikita(time, idle, walk); break;
        case 'varya': this.drawVarya(time, idle, walk); break;
        case 'alisa': this.drawAlisa(time, idle, walk); break;
        case 'sofya': this.drawSofya(time, idle, walk); break;
        case 'sergey': this.drawSergey(time, idle, walk); break;
      }
    }

    ctx.restore();

    // Draw Special ability aura if in special move
    if (this.attacking && this.attackType === 'special' && !isBoss) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = this.data.color;
      ctx.beginPath();
      ctx.arc(centerX, this.centerY, 65 + Math.sin(time * 10) * 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw particles
    if (this.particles.length > 0) {
      ctx.save();
      for (const p of this.particles) {
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    ctx = null;
    activeSpawnParticles = null;
  }

` + methodsBlock + `
}
`;

fs.writeFileSync('src/characterRenderer.ts', out);
console.log('Rebuilt src/characterRenderer.ts successfully with module-level ctx!');
