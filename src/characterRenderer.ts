// @ts-nocheck
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

  tentacle(time,x0,y0,dir,len,speed,phase,color,w){
    const s1=Math.sin(time*speed+phase), s2=Math.sin(time*speed*1.4+phase*2);
    ctx.strokeStyle=color; ctx.lineWidth=w; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(x0,y0);
    ctx.quadraticCurveTo(x0+dir*len*0.45, y0-30+s1*24, x0+dir*len*0.8, y0+40+s2*36); ctx.stroke();
    ctx.lineWidth=w*0.55;
    ctx.beginPath(); ctx.moveTo(x0+dir*len*0.8, y0+40+s2*36);
    ctx.quadraticCurveTo(x0+dir*len*0.95, y0+72+s2*30, x0+dir*len*0.78, y0+110+s1*22); ctx.stroke();
    ctx.globalCompositeOperation='lighter'; ctx.fillStyle='rgba(118,255,3,0.55)';
    ctx.beginPath(); ctx.arc(x0+dir*len*0.78,y0+110+s1*22,3.5,0,7); ctx.fill();
    ctx.globalCompositeOperation='source-over';
  }
  // ИСПРАВЛЕНО: удар щупальцем теперь идёт по низкой дуге — кончик опускается к земле
  tentaclePunch(time,x0,y0,dir,reach,color,w){
    ctx.strokeStyle=color; ctx.lineCap='round'; ctx.lineWidth=w;
    ctx.beginPath(); ctx.moveTo(x0,y0);
    ctx.quadraticCurveTo(x0+dir*reach*0.5, y0-10, x0+dir*reach, y0+55); ctx.stroke();
    ctx.fillStyle='#e8f5e9';
    for(let i=1;i<=4;i++){ const px=x0+dir*reach*i/5, py=y0+i*13-(i%2)*5;
      ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(px+dir*7,py-10); ctx.lineTo(px+dir*13,py); ctx.closePath(); ctx.fill(); }
    ctx.globalCompositeOperation='lighter';
    ctx.strokeStyle=`rgba(118,255,3,${0.6+Math.sin(time*20)*0.3})`; ctx.lineWidth=6; ctx.shadowColor='#76ff03'; ctx.shadowBlur=18;
    ctx.beginPath(); ctx.moveTo(x0+dir*reach,y0+55); ctx.lineTo(x0+dir*(reach+18),y0+46); ctx.stroke();
    ctx.shadowBlur=0; ctx.globalCompositeOperation='source-over';
    if(Math.random()<0.3) spawnParticles(this.x+this.facing*reach*BOSS_SCALE, this.feetY-(y0+55)*BOSS_SCALE, '#76ff03', 1, 'hit');
  }

  // Удар передним копытом коня — нога сгибается по дуге к копыту, которое разворачивается по направлению удара
  hoofStrike(hipX, hipY, angleDeg, len, color) {
    const rad = angleDeg * Math.PI / 180;
    const dx = Math.cos(rad), dy = Math.sin(rad);
    const hoofX = hipX + dx * len, hoofY = hipY + dy * len;
    const bendX = hipX + dx * len * 0.5 - dy * 10, bendY = hipY + dy * len * 0.5 + dx * 10;
    ctx.strokeStyle = color; ctx.lineWidth = 11; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(hipX, hipY); ctx.quadraticCurveTo(bendX, bendY, hoofX, hoofY); ctx.stroke();
    ctx.save(); ctx.translate(hoofX, hoofY); ctx.rotate(rad);
    ctx.fillStyle = '#161616'; ctx.beginPath(); ctx.ellipse(0, 0, 7, 5, 0, 0, 7); ctx.fill();
    ctx.restore(); ctx.lineCap = 'butt';
    return { hoofX, hoofY, rad };
  }

  drawDarkSergey(time, idle, walk) {
    const C=this.data;
    const ag=ctx.createRadialGradient(0,-140,30,0,-140,240);
    ag.addColorStop(0,'rgba(25,45,28,0.45)'); ag.addColorStop(0.7,'rgba(12,22,14,0.25)'); ag.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=ag; ctx.beginPath(); ctx.arc(0,-140,240,0,7); ctx.fill();

    const prog=this.attacking?1-this.attackTimer/this.attackDuration:0;
    const biting=this.attacking&&this.attackType==='heavy';
    const ultaOn=this.attacking&&this.attackType==='ulta';
    const mouthOpen=biting?Math.sin(prog*Math.PI):(ultaOn?1:0.15+Math.sin(time*2)*0.05);

    for(let i=0;i<4;i++) this.tentacle(time,-22+i*15, -200+idle, -1, 150+i*20, 1.1+i*0.17, i*1.9, '#0f1a12', 14-i*1.5);

    ctx.fillStyle='#0c120d';
    roundRect(-60-walk*0.3, -112+walk, 36, 114-walk, 8); ctx.fill();
    roundRect(24-walk*0.3, -112-walk, 36, 114+walk, 8); ctx.fill();
    ctx.fillStyle='#070c08';
    roundRect(-74-walk*0.3, -15+walk, 58, 17, 5); ctx.fill();
    roundRect(16-walk*0.3, -15-walk, 58, 17, 5); ctx.fill();
    ctx.globalCompositeOperation='lighter';
    ctx.strokeStyle=`rgba(118,255,3,${0.45+Math.sin(time*3)*0.25})`; ctx.lineWidth=2.5;
    ctx.beginPath(); ctx.moveTo(-46,-95+walk); ctx.lineTo(-38,-72+walk); ctx.lineTo(-45,-50+walk); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(35,-105-walk); ctx.lineTo(43,-82-walk); ctx.lineTo(36,-58-walk); ctx.stroke();
    ctx.globalCompositeOperation='source-over';

    const tg=ctx.createLinearGradient(-78,-245+idle,78,-105+idle);
    tg.addColorStop(0,'#1a281c'); tg.addColorStop(0.5,'#101a12'); tg.addColorStop(1,'#0a100c');
    ctx.fillStyle=tg; roundRect(-78,-245+idle,156,136,24); ctx.fill();
    ctx.strokeStyle='rgba(118,255,3,0.25)'; ctx.lineWidth=3.5;
    for(let i=0;i<3;i++){ ctx.beginPath(); ctx.arc(0,-142+idle-i*30,54-i*7,0.3,Math.PI-0.3); ctx.stroke(); }
    ctx.globalCompositeOperation='lighter';
    const coreR=ultaOn?40+Math.sin(time*25)*8:24+Math.sin(time*4)*4;
    const cg=ctx.createRadialGradient(0,-168+idle,4,0,-168+idle,coreR+12);
    cg.addColorStop(0,'rgba(118,255,3,0.95)'); cg.addColorStop(0.5,'rgba(60,140,10,0.5)'); cg.addColorStop(1,'rgba(118,255,3,0)');
    ctx.fillStyle=cg; ctx.beginPath(); ctx.arc(0,-168+idle,coreR+12,0,7); ctx.fill();
    ctx.globalCompositeOperation='source-over';
    ctx.strokeStyle='#555'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(0,-152+idle); ctx.lineTo(0,-138+idle); ctx.stroke();
    ctx.fillStyle='#9e9e9e'; roundRect(-5,-147+idle,10,15,2); ctx.fill();
    ctx.fillStyle='#333'; ctx.fillRect(-3,-144+idle,6,2); ctx.fillRect(-3,-139+idle,6,2);

    // ИСПРАВЛЕНО: атакующее щупальце закреплено ниже (у торса) и бьёт по низкой дуге
    if(this.attacking&&(this.attackType==='light'||this.attackType==='heavy')){
      const range=this.attackType==='light'?190:220;
      this.tentaclePunch(time, 40, -155+idle, 1, Math.sin(prog*Math.PI)*range, '#111d13', 18);
    } else if(this.attacking&&this.attackType==='ulta'){
      ctx.strokeStyle='#111d13'; ctx.lineWidth=18; ctx.lineCap='round';
      ctx.beginPath(); ctx.moveTo(34,-215+idle); ctx.quadraticCurveTo(80,-260,95,-320+Math.sin(time*20)*8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-30,-215+idle); ctx.quadraticCurveTo(-80,-260,-95,-320+Math.cos(time*18)*8); ctx.stroke();
      ctx.lineCap='butt';
    } else {
      this.tentacle(time, 40, -208+idle, 1, 125, 0.9, 0.5, '#111d13', 16);
      this.tentacle(time, 22, -188+idle, 1, 100, 1.2, 2.4, '#0e1810', 12);
    }

    const hy=-272+idle;
    ctx.fillStyle='#131f15'; ctx.beginPath(); ctx.ellipse(0,hy,64,56,0,0,7); ctx.fill();
    ctx.fillStyle='#0d150e'; ctx.beginPath(); ctx.ellipse(0,hy,64,56,0,0,7); ctx.fill();
    ctx.strokeStyle='#1f3324'; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(0,hy,64,56,0,0,7); ctx.stroke();
    ctx.fillStyle='#1c2b1f'; ctx.beginPath(); ctx.ellipse(0,hy-40,56,23,0,Math.PI,0); ctx.fill();
    ctx.fillStyle='#0f1a12'; ctx.fillRect(-56,hy-43,112,7);
    ctx.beginPath(); ctx.moveTo(-56,hy-36);
    for(let i=0;i<6;i++) ctx.lineTo(-47+i*19, hy-36+(i%2?7:-3));
    ctx.lineTo(56,hy-36); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#33691e'; ctx.fillRect(8,hy-58,7,7);

    ctx.globalCompositeOperation='lighter';
    const blink=Math.sin(time*1.3)>-0.96?1:0.1;
    ctx.shadowColor='#ff1744'; ctx.shadowBlur=16; ctx.fillStyle=`rgba(255,23,68,${(0.85+Math.sin(time*6)*0.15)*blink})`;
    ctx.beginPath(); ctx.arc(-27,hy-14,7,0,7); ctx.fill();
    ctx.beginPath(); ctx.arc(2,hy-19,9.5,0,7); ctx.fill();
    ctx.beginPath(); ctx.arc(29,hy-12,6,0,7); ctx.fill();
    ctx.shadowBlur=0; ctx.globalCompositeOperation='source-over';

    const mo=mouthOpen*46;
    ctx.fillStyle='#030503';
    ctx.beginPath(); ctx.ellipse(6,hy+24,45,10+mo,0,0,7); ctx.fill();
    ctx.globalCompositeOperation='lighter';
    const tg2=ctx.createRadialGradient(6,hy+26,2,6,hy+26,34+mo);
    tg2.addColorStop(0,'rgba(156,39,176,0.85)'); tg2.addColorStop(1,'rgba(156,39,176,0)');
    ctx.fillStyle=tg2; ctx.beginPath(); ctx.ellipse(6,hy+26,36,10+mo*0.85,0,0,7); ctx.fill();
    // НОВОЕ: при укусе пасть "обрушивается" вниз до земли — фиолетовая дуга-челюсть
    if(biting&&prog>0.35&&prog<0.85){
      const biteY=hy+24+prog*160;
      const bg2=ctx.createLinearGradient(0,hy+24,0,biteY+40);
      bg2.addColorStop(0,'rgba(156,39,176,0.7)'); bg2.addColorStop(1,'rgba(118,255,3,0.25)');
      ctx.fillStyle=bg2;
      ctx.beginPath();
      ctx.moveTo(-30,hy+24);
      ctx.quadraticCurveTo(30,biteY,150,biteY+30);
      ctx.quadraticCurveTo(40,biteY+55,-20,hy+40);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle='rgba(232,245,233,0.85)';
      for(let i=0;i<5;i++){ const tx=30+i*26;
        ctx.beginPath(); ctx.moveTo(tx,biteY+10); ctx.lineTo(tx+8,biteY+8); ctx.lineTo(tx+4,biteY+34); ctx.closePath(); ctx.fill(); }
      if(Math.random()<0.5) spawnParticles(this.x+this.facing*(60+prog*100)*BOSS_SCALE, this.feetY-(biteY+30)*BOSS_SCALE, '#9c27b0', 1, 'hit');
    }
    ctx.globalCompositeOperation='source-over';
    ctx.fillStyle='#e8f5e9';
    ctx.beginPath();
    for(let i=0;i<7;i++){ const tx=-27+i*11;
      ctx.moveTo(tx,hy+13-mo*0.55); ctx.lineTo(tx+5,hy+13-mo*0.55); ctx.lineTo(tx+2.5,hy+25-mo*0.15); }
    ctx.fill();
    ctx.beginPath();
    for(let i=0;i<7;i++){ const tx=-27+i*11;
      ctx.moveTo(tx,hy+35+mo*0.55); ctx.lineTo(tx+5,hy+35+mo*0.55); ctx.lineTo(tx+2.5,hy+24+mo*0.15); }
    ctx.fill();
    ctx.strokeStyle='#1f3324'; ctx.lineWidth=3;
    ctx.beginPath(); ctx.ellipse(6,hy+24,45,10+mo,0,0,7); ctx.stroke();

    if(ultaOn&&Math.random()<0.5) spawnParticles(this.x+(Math.random()-0.5)*200*BOSS_SCALE, this.feetY-Math.random()*this.bodyH, '#9c27b0', 1, 'hit');
  }

  drawDima(time, idle, walk) {
    const C = this.data;
    ctx.fillStyle = '#2c3e50'; ctx.fillRect(-12, -26 + walk, 10, 26); ctx.fillRect(2, -26 - walk, 10, 26);
    ctx.fillStyle = '#1a1a1a'; ctx.fillRect(-13, -2 + walk, 12, 5); ctx.fillRect(1, -2 - walk, 12, 5);
    const jGrad = ctx.createLinearGradient(-18, -80+idle, 18, -24+idle); jGrad.addColorStop(0, C.color); jGrad.addColorStop(1, C.colorDark);
    ctx.fillStyle = jGrad; roundRect(-18, -80 + idle, 36, 56, 4); ctx.fill();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = `rgba(255, 100, 0, ${0.2 + Math.sin(time*6)*0.1})`;
    ctx.fillRect(-18, -78+idle, 4, 50); ctx.fillRect(14, -78+idle, 4, 50);
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#f0e6d3'; ctx.fillRect(-1, -78 + idle, 2, 52);
    ctx.fillStyle = C.color; ctx.fillRect(-16, -80 + idle, 32, 8);
    ctx.fillStyle = C.skin; ctx.beginPath(); ctx.arc(0, -92, 14, 0, Math.PI*2); ctx.fill();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = C.color; ctx.beginPath(); ctx.moveTo(-10, -100); ctx.lineTo(-5, -115); ctx.lineTo(0, -102); ctx.lineTo(5, -118); ctx.lineTo(10, -100); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-8, -105); ctx.lineTo(-3, -112); ctx.lineTo(2, -106); ctx.lineTo(7, -115); ctx.lineTo(12, -105); ctx.closePath(); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = C.colorLight; ctx.fillRect(-14, -98, 28, 4);
    ctx.fillStyle = C.colorLight; ctx.save(); ctx.translate(14, -96); ctx.rotate(Math.sin(time*4)*0.2); ctx.fillRect(0, 0, 18, 4); ctx.restore();
    if(this.blocking) { 
      ctx.fillStyle = C.skin; ctx.fillRect(-20, -72, 12, 10); ctx.fillRect(8, -72, 12, 10); 
      ctx.fillStyle = '#f0e6d3'; ctx.fillRect(-22, -65, 14, 8); ctx.fillRect(8, -65, 14, 8); 
      ctx.globalCompositeOperation='lighter'; ctx.strokeStyle=`rgba(255,150,50,0.8)`;ctx.lineWidth=7;ctx.shadowColor=C.color;ctx.shadowBlur=25;ctx.beginPath();ctx.arc(0,-60,32,0,Math.PI*2);ctx.stroke();ctx.shadowBlur=0; ctx.globalCompositeOperation='source-over';
    } else if(this.attacking) { 
      const prog = 1 - this.attackTimer/this.attackDuration; const ext = this.attackType==='light'?25:this.attackType==='heavy'?40:55; const punchExt = Math.sin(prog*Math.PI)*ext; 
      ctx.fillStyle = C.skin; ctx.fillRect(-25, -70, 10, 12); ctx.fillStyle = '#f0e6d3'; ctx.fillRect(-26, -62, 12, 8); 
      ctx.fillStyle = C.skin; ctx.fillRect(16, -70, 12 + punchExt, 10); 
      if(this.attackType==='special') {
        ctx.fillStyle = '#f0e6d3'; ctx.fillRect(16 + punchExt, -72, 14, 14);
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle=C.color;ctx.shadowColor='#ffaa00';ctx.shadowBlur=60;ctx.beginPath();ctx.arc(23+punchExt,-65,25+Math.sin(time*20)*7,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
        ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(23+punchExt,-65,12,0,Math.PI*2);ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      } else { ctx.fillStyle = '#f0e6d3'; ctx.fillRect(16 + punchExt, -72, 14, 14); }
    } else { ctx.fillStyle = C.skin; ctx.fillRect(-24, -72+idle, 10, 12); ctx.fillRect(14, -72+idle, 10, 12); ctx.fillStyle = '#f0e6d3'; ctx.fillRect(-25, -64+idle, 12, 8); ctx.fillRect(13, -64+idle, 12, 8); }
    ctx.fillStyle='#fff';ctx.fillRect(-8,-96,7,5);ctx.fillRect(1,-96,7,5);
    ctx.fillStyle = this.attacking ? '#f00' : '#000'; ctx.fillRect(-5,-95,3,3);ctx.fillRect(4,-95,3,3);
  }

  drawLexa(time, idle, walk) {
    const C = this.data;
    ctx.fillStyle = '#1a1a2a'; ctx.fillRect(-18, -28+walk, 16, 28); ctx.fillRect(2, -28-walk, 16, 28);
    ctx.fillStyle = '#333'; ctx.fillRect(-19, -2+walk, 18, 5); ctx.fillRect(1, -2-walk, 18, 5);
    const bGrad = ctx.createLinearGradient(-26, -85+idle, 26, -25+idle); bGrad.addColorStop(0, C.color); bGrad.addColorStop(1, C.colorDark);
    ctx.fillStyle = bGrad; roundRect(-26, -85+idle, 52, 60, 6); ctx.fill();
    ctx.strokeStyle = `rgba(255,255,255,0.3)`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -80+idle); ctx.lineTo(0, -30+idle); ctx.stroke();
    ctx.fillStyle = C.skin; ctx.fillRect(-8, -90+idle, 16, 8);
    ctx.fillStyle = C.skin; ctx.beginPath(); ctx.arc(0, -98, 16, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = C.colorDark; ctx.fillRect(-16, -106, 32, 6); ctx.fillRect(14, -106, 6, 14); 
    ctx.fillStyle = '#000'; ctx.lineWidth=3; ctx.strokeStyle='#000'; ctx.beginPath(); ctx.moveTo(-12,-105); ctx.lineTo(-2,-102); ctx.stroke(); ctx.beginPath(); ctx.moveTo(12,-105); ctx.lineTo(2,-102); ctx.stroke();
    ctx.fillStyle='#fff';ctx.fillRect(-9,-101,7,5);ctx.fillRect(2,-101,7,5);ctx.fillStyle='#f00';ctx.fillRect(-6,-100,4,3);ctx.fillRect(5,-100,4,3);
    ctx.strokeStyle = '#ffd600'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, -85+idle, 10, 0, Math.PI); ctx.stroke();
    if(this.blocking) { 
      ctx.fillStyle = C.skin; ctx.fillRect(-30, -80, 14, 20); ctx.fillRect(16, -80, 14, 20); 
      ctx.fillStyle = C.colorDark; ctx.fillRect(-32, -64, 18, 14); ctx.fillRect(14, -64, 18, 14); 
      ctx.strokeStyle=`rgba(255,255,255,0.8)`;ctx.lineWidth=8;ctx.beginPath();ctx.arc(0,-65,42,0,Math.PI*2);ctx.stroke();
    } else if(this.attacking) { 
      const prog = 1 - this.attackTimer/this.attackDuration; const ext = this.attackType==='light'?30:this.attackType==='heavy'?50:65; const punchExt = Math.sin(prog*Math.PI)*ext; 
      ctx.fillStyle = C.skin; ctx.fillRect(-30, -78, 14, 16); ctx.fillStyle = C.colorDark; ctx.fillRect(-32, -64, 18, 14); 
      ctx.fillStyle = C.skin; ctx.fillRect(18, -78, 14+punchExt, 12); ctx.fillStyle = C.colorDark; ctx.fillRect(18+punchExt, -74, 22, 18); 
      if(this.attackType==='special') {
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = C.color; ctx.shadowColor = C.color; ctx.shadowBlur = 40; ctx.lineWidth = 10 - prog*8;
        ctx.beginPath(); ctx.arc(40+punchExt, -65, 20 + prog*60, 0, Math.PI*2); ctx.stroke(); ctx.shadowBlur = 0;
        ctx.fillStyle = `rgba(255,255,255,${1-prog})`; ctx.beginPath(); ctx.arc(40+punchExt, -65, 25, 0, Math.PI*2); ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      }
    } else { ctx.fillStyle = C.skin; ctx.fillRect(-32, -80+idle, 14, 16); ctx.fillRect(18, -80+idle, 14, 16); ctx.fillStyle = C.colorDark; ctx.fillRect(-34, -68+idle, 18, 14); ctx.fillRect(16, -68+idle, 18, 14); }
  }

  drawArtem(time, idle, walk) {
    const C = this.data;
    if (Math.abs(this.vx) > 2) { ctx.globalAlpha = 0.2; ctx.fillStyle = C.color; roundRect(-16, -75+idle, 32, 52, 8); ctx.fill(); ctx.globalAlpha = 1.0; }
    ctx.fillStyle = '#37474f'; ctx.fillRect(-10, -24+walk, 8, 24); ctx.fillRect(2, -24-walk, 8, 24);
    ctx.fillStyle = C.color; ctx.fillRect(-12, -2+walk, 12, 5); ctx.fillRect(0, -2-walk, 12, 5);
    const hGrad = ctx.createLinearGradient(-16, -75+idle, 16, -23+idle); hGrad.addColorStop(0, '#263238'); hGrad.addColorStop(1, C.colorDark);
    ctx.fillStyle = hGrad; roundRect(-16, -75+idle, 32, 52, 8); ctx.fill();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = C.color; ctx.shadowColor = C.color; ctx.shadowBlur = 15; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-12, -70+idle); ctx.lineTo(-12, -30+idle); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(12, -70+idle); ctx.lineTo(12, -30+idle); ctx.stroke();
    ctx.shadowBlur=0; ctx.globalCompositeOperation = 'source-over';
    if(this.blocking) { 
      ctx.fillStyle = C.color; ctx.fillRect(-22, -72, 10, 20); ctx.fillRect(12, -72, 10, 20); 
      ctx.globalCompositeOperation='lighter';ctx.strokeStyle=`rgba(0, 229, 255, 0.8)`;ctx.lineWidth=4;ctx.shadowColor=C.color;ctx.shadowBlur=25;ctx.beginPath();ctx.arc(0,-55,30,0,Math.PI*2);ctx.stroke();ctx.shadowBlur=0;ctx.globalCompositeOperation='source-over';
    } else if(this.attacking) { 
      const prog = 1 - this.attackTimer/this.attackDuration; const ext = this.attackType==='light'?30:this.attackType==='heavy'?45:20; const punchExt = Math.sin(prog*Math.PI)*ext; 
      ctx.fillStyle = C.color; ctx.fillRect(-22, -68, 10, 16); ctx.fillRect(12, -68, 10+punchExt, 10); ctx.fillStyle = C.skin; ctx.fillRect(12+punchExt, -70, 10, 10); 
      if(this.attackType==='special') {
        ctx.globalCompositeOperation = 'lighter';
        for(let i=0; i<5; i++) { const angle = (time*25 + i*Math.PI*2/5); ctx.save(); ctx.translate(10, -60); ctx.rotate(angle); ctx.fillStyle = C.color; ctx.shadowColor = C.color; ctx.shadowBlur = 20; ctx.fillRect(0, -5, 38, 12); ctx.fillStyle = '#fff'; ctx.fillRect(36, -4, 10, 10); ctx.restore(); }
        ctx.shadowBlur = 0; ctx.globalCompositeOperation = 'source-over';
      }
    } else { ctx.fillStyle = C.color; ctx.fillRect(-22, -68+idle, 10, 16); ctx.fillRect(12, -68+idle, 10, 16); }
    ctx.fillStyle = C.skin; ctx.beginPath(); ctx.arc(0, -86, 12, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#263238'; ctx.beginPath(); ctx.arc(0, -88, 16, Math.PI, Math.PI*2); ctx.fill(); ctx.fillRect(-16, -88, 32, 4);
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle=C.color;ctx.shadowColor=C.color;ctx.shadowBlur=18;ctx.fillRect(-6,-88,5,4);ctx.fillRect(1,-88,5,4);ctx.shadowBlur=0;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#263238'; ctx.fillRect(-8, -84, 16, 6);
  }

  drawMaks(time, idle, walk) {
    const C = this.data;
    ctx.fillStyle = '#3e2723'; ctx.fillRect(-18, -30+walk, 16, 30); ctx.fillRect(2, -30-walk, 16, 30);
    ctx.fillStyle = '#5d4037'; ctx.fillRect(-19, -4+walk, 18, 6); ctx.fillRect(1, -4-walk, 18, 6);
    ctx.fillStyle = '#78909c'; ctx.fillRect(-18, -14+walk, 4, 12); ctx.fillRect(2, -14-walk, 4, 12);
    const vGrad = ctx.createLinearGradient(-26, -80+idle, 26, -28+idle); vGrad.addColorStop(0, '#455a64'); vGrad.addColorStop(1, '#263238');
    ctx.fillStyle = vGrad; roundRect(-26, -80+idle, 52, 52, 4); ctx.fill();
    ctx.fillStyle = C.colorDark; ctx.fillRect(-26, -80+idle, 14, 52); ctx.fillRect(12, -80+idle, 14, 52);
    ctx.fillStyle = `rgba(255, 255, 255, ${0.4 + Math.sin(time*2)*0.3})`; ctx.fillRect(-26, -60+idle, 52, 3); ctx.fillRect(-26, -45+idle, 52, 3);
    ctx.fillStyle = '#ffb300'; ctx.fillRect(-26, -32+idle, 52, 4);
    ctx.fillStyle = C.skin; ctx.beginPath(); ctx.arc(0, -92, 14, 0, Math.PI*2); ctx.fill();
    const hGrad = ctx.createLinearGradient(-16, -108, 16, -92); hGrad.addColorStop(0, C.colorLight); hGrad.addColorStop(0.5, C.color); hGrad.addColorStop(1, C.colorDark);
    ctx.fillStyle = hGrad; roundRect(-16, -108, 32, 18, 8); ctx.fill(); ctx.fillRect(-18, -96, 36, 4);
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = '#fff'; ctx.shadowColor = '#fff'; ctx.shadowBlur = 20; ctx.beginPath(); ctx.arc(0, -104, 4, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur=0;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle='#fff';ctx.fillRect(-8,-96,6,5);ctx.fillRect(2,-96,6,5);ctx.fillStyle='#000';ctx.fillRect(-6,-95,3,3);ctx.fillRect(4,-95,3,3);
    ctx.fillStyle = '#3e2723'; ctx.fillRect(-6, -84, 12, 8);
    if(this.blocking) { ctx.fillStyle = C.skin; ctx.fillRect(-30, -76, 14, 16); ctx.fillRect(16, -76, 14, 16); ctx.fillStyle = '#78909c'; ctx.fillRect(-32, -64, 18, 14); ctx.fillRect(14, -64, 18, 14); ctx.strokeStyle=`rgba(136,204,255,0.8)`;ctx.lineWidth=8;ctx.beginPath();ctx.arc(0,-65,42,0,Math.PI*2);ctx.stroke(); }
    else if(this.attacking) { 
      const prog = 1 - this.attackTimer/this.attackDuration; const ext = this.attackType==='light'?30:this.attackType==='heavy'?50:60; const punchExt = Math.sin(prog*Math.PI)*ext; 
      ctx.fillStyle = C.skin; ctx.fillRect(-30, -74, 14, 14); ctx.fillStyle = '#78909c'; ctx.fillRect(-32, -64, 18, 14); 
      ctx.fillStyle = C.skin; ctx.fillRect(18, -74, 14+punchExt, 12); ctx.fillStyle = '#78909c'; ctx.fillRect(18+punchExt, -72, 20, 16); 
      if(this.attackType==='special') {
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = `rgba(118, 255, 3, ${0.8 - prog*0.8})`; ctx.shadowColor = C.color; ctx.shadowBlur = 40;
        ctx.fillRect(-60 - prog*70, -8, 120 + prog*140, 14); ctx.shadowBlur = 0;
        ctx.globalCompositeOperation = 'source-over';
        spawnParticles(this.x, this.groundY, '#5d4037', 3, 'rock');
      }
    } else { ctx.fillStyle = C.skin; ctx.fillRect(-32, -76+idle, 14, 14); ctx.fillRect(18, -76+idle, 14, 14); ctx.fillStyle = '#78909c'; ctx.fillRect(-34, -66+idle, 18, 14); ctx.fillRect(16, -66+idle, 18, 14); }
  }

  drawSanya(time, idle, walk) {
    const C = this.data;
    ctx.fillStyle = '#263238'; ctx.fillRect(-12, -26+walk, 10, 26); ctx.fillRect(2, -26-walk, 10, 26);
    ctx.fillStyle = '#37474f'; ctx.fillRect(-13, -2+walk, 12, 5); ctx.fillRect(1, -2-walk, 12, 5);
    ctx.fillStyle = '#455a64'; roundRect(-16, -78+idle, 32, 54, 4); ctx.fill();
    const vGrad = ctx.createLinearGradient(-14, -76+idle, 14, -26+idle); vGrad.addColorStop(0, C.color); vGrad.addColorStop(1, C.colorDark);
    ctx.fillStyle = vGrad; roundRect(-14, -76+idle, 28, 50, 4); ctx.fill();
    ctx.fillStyle = '#cfd8dc'; for(let i=0; i<4; i++) { ctx.fillRect(-8, -70+i*10+idle, 4, 6); ctx.fillRect(4, -68+i*10+idle, 4, 6); }
    ctx.fillStyle = C.skin; ctx.beginPath(); ctx.arc(0, -90, 13, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = C.colorDark; ctx.beginPath(); ctx.arc(0, -94, 13, Math.PI, Math.PI*2); ctx.fill(); ctx.fillRect(-16, -94, 32, 3);
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = C.color; ctx.shadowColor = C.color; ctx.shadowBlur = 15; ctx.fillRect(-10, -95, 8, 6); ctx.fillRect(2, -95, 8, 6); ctx.shadowBlur = 0;
    if (!this.attacking) { ctx.strokeStyle = `rgba(255, 0, 0, ${0.4 + Math.sin(time*5)*0.2})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(10, -92); ctx.lineTo(120, -97); ctx.stroke(); }
    ctx.globalCompositeOperation = 'source-over';
    if(this.blocking) { ctx.fillStyle = C.skin; ctx.fillRect(-22, -70, 10, 10); ctx.fillRect(12, -70, 10, 10); ctx.strokeStyle=`rgba(136,204,255,0.8)`;ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,-60,32,0,Math.PI*2);ctx.stroke(); }
    else if(this.attacking) { 
      const prog = 1 - this.attackTimer/this.attackDuration; const punchExt = Math.sin(prog*Math.PI)*25; 
      ctx.fillStyle = C.skin; ctx.fillRect(-22, -68, 10, 10); ctx.fillStyle = C.skin; ctx.fillRect(14, -68, 10+punchExt, 10); 
      ctx.fillStyle = '#455a64'; ctx.fillRect(14+punchExt, -76, 22, 20); ctx.fillStyle = C.color; ctx.fillRect(36+punchExt, -74, 6, 16);
      if(this.attackType==='special') {
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = '#fff'; ctx.shadowColor = C.color; ctx.shadowBlur = 50;
        ctx.beginPath(); ctx.arc(42+punchExt, -66, 15+Math.sin(time*20)*6, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;
        ctx.globalCompositeOperation = 'source-over';
      } else if (this.attackType === 'heavy') {
         ctx.globalCompositeOperation = 'lighter';
         ctx.fillStyle = '#fff'; ctx.shadowColor = C.color; ctx.shadowBlur = 25;
         ctx.beginPath(); ctx.arc(42+punchExt, -66, 10, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;
         ctx.globalCompositeOperation = 'source-over';
      }
    } else { ctx.fillStyle = C.skin; ctx.fillRect(-22, -70+idle, 10, 10); ctx.fillRect(14, -70+idle, 10, 10); ctx.fillStyle = '#455a64'; ctx.fillRect(14, -68+idle, 16, 10); }
  }

  drawKostya(time, idle, walk) {
    const C = this.data;
    ctx.fillStyle = '#263238'; ctx.fillRect(-12, -26+walk, 10, 26); ctx.fillRect(2, -26-walk, 10, 26);
    ctx.fillStyle = C.colorDark; ctx.fillRect(-3, -26, 6, 26);
    ctx.fillStyle = '#1a1a2a'; ctx.fillRect(-13, -2+walk, 12, 5); ctx.fillRect(1, -2-walk, 12, 5);
    const sGrad = ctx.createLinearGradient(-18, -80+idle, 18, -24+idle); sGrad.addColorStop(0, '#37474f'); sGrad.addColorStop(1, '#263238');
    ctx.fillStyle = sGrad; roundRect(-18, -80+idle, 36, 56, 4); ctx.fill();
    ctx.fillStyle = C.colorDark; ctx.fillRect(-18, -80+idle, 36, 10);
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = C.color; ctx.shadowColor = C.color; ctx.shadowBlur = 15 + Math.sin(time*5)*7; ctx.lineWidth = 2; 
    ctx.beginPath(); ctx.moveTo(-10, -70+idle); ctx.lineTo(-10, -30+idle); ctx.stroke(); 
    ctx.beginPath(); ctx.moveTo(10, -70+idle); ctx.lineTo(10, -30+idle); ctx.stroke();
    ctx.shadowBlur = 0; ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = C.skin; ctx.beginPath(); ctx.arc(0, -92, 13, 0, Math.PI*2); ctx.fill();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = C.color; ctx.shadowColor = C.color; ctx.shadowBlur = 20; ctx.fillRect(-14, -98, 28, 6);
    if (this.attacking && this.attackType === 'special') { ctx.fillRect(-14 + Math.sin(time*40)*4, -98, 28, 2); ctx.fillRect(-14, -98 + Math.cos(time*30)*4, 28, 2); }
    ctx.shadowBlur = 0; ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#263238'; ctx.beginPath(); ctx.arc(0, -98, 13, Math.PI, Math.PI*2); ctx.fill();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = C.color; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.5 + Math.sin(time*3)*0.3;
    ctx.strokeRect(-32, -80+idle + Math.sin(time*2)*6, 10, 10);
    ctx.strokeRect(24, -70+idle + Math.cos(time*2.5)*6, 10, 10);
    ctx.globalAlpha = 1.0; ctx.globalCompositeOperation = 'source-over';
    if(this.blocking) { ctx.fillStyle = '#37474f'; ctx.fillRect(-24, -72, 10, 12); ctx.fillRect(14, -72, 10, 12); ctx.fillStyle = C.color; ctx.fillRect(-26, -64, 14, 12); ctx.fillRect(12, -64, 14, 12); ctx.strokeStyle=`rgba(136,204,255,0.8)`;ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,-60,34,0,Math.PI*2);ctx.stroke(); }
    else if(this.attacking) { 
      const prog = 1 - this.attackTimer/this.attackDuration; const ext = this.attackType==='light'?30:this.attackType==='heavy'?45:55; const punchExt = Math.sin(prog*Math.PI)*ext; 
      ctx.fillStyle = '#37474f'; ctx.fillRect(-24, -70, 10, 10); ctx.fillStyle = C.color; ctx.fillRect(-26, -64, 14, 12); 
      ctx.fillStyle = '#37474f'; ctx.fillRect(16, -70, 12+punchExt, 10); ctx.fillStyle = C.color; ctx.fillRect(16+punchExt, -68, 16, 14);
      if(this.attackType==='special') {
        ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = C.color; ctx.globalAlpha = 0.3;
        ctx.fillRect(-55 - prog*35, -78, 22, 60); ctx.fillRect(-45 - prog*55, -78, 22, 60); ctx.globalAlpha = 1.0;
        ctx.strokeStyle = C.color; ctx.lineWidth = 3; ctx.shadowColor = C.color; ctx.shadowBlur = 15;
        for(let i=0; i<4; i++) { ctx.beginPath(); ctx.moveTo(-20 - prog*35, -75+i*12); ctx.lineTo(16, -75+i*12); ctx.stroke(); }
        ctx.shadowBlur = 0; ctx.globalCompositeOperation = 'source-over';
      }
    } else { ctx.fillStyle = '#37474f'; ctx.fillRect(-24, -72+idle, 10, 10); ctx.fillRect(16, -72+idle, 10, 10); ctx.fillStyle = C.color; ctx.fillRect(-26, -66+idle, 14, 12); ctx.fillRect(14, -66+idle, 14, 12); }
  }

  drawGrisha(time, idle, walk) {
    const C=this.data;
    ctx.fillStyle='#2b3b2e'; ctx.fillRect(-12,-26+walk,10,26); ctx.fillRect(2,-26-walk,10,26);
    ctx.fillStyle='#16211a'; ctx.fillRect(-13,-2+walk,12,5); ctx.fillRect(1,-2-walk,12,5);
    const g=ctx.createLinearGradient(-19,-80+idle,19,-24+idle); g.addColorStop(0,C.colorDark); g.addColorStop(1,'#13211a');
    ctx.fillStyle=g; roundRect(-19,-80+idle,38,58,5); ctx.fill();
    ctx.fillStyle='#0c1710'; ctx.fillRect(-1,-77+idle,3,53);
    ctx.fillStyle='rgba(29,233,182,0.4)'; ctx.beginPath(); ctx.arc(-9,-52+idle,4,0,7); ctx.fill(); ctx.beginPath(); ctx.arc(9,-40+idle,3,0,7); ctx.fill();
    ctx.fillStyle='#4e342e'; ctx.fillRect(-19,-42+idle,38,5);
    ctx.globalCompositeOperation='lighter';
    ctx.fillStyle=C.color; ctx.shadowColor=C.color; ctx.shadowBlur=8; ctx.fillRect(-14,-49+idle,5,8); ctx.fillRect(9,-49+idle,5,8); ctx.shadowBlur=0;
    ctx.globalCompositeOperation='source-over';
    ctx.fillStyle=C.colorDark; ctx.beginPath(); ctx.arc(-15,-68+idle,9,0,7); ctx.fill();
    ctx.fillStyle=C.skin; ctx.beginPath(); ctx.arc(0,-92,13,0,7); ctx.fill();
    ctx.fillStyle='#1c262b'; ctx.beginPath(); ctx.arc(0,-89,11.5,0,7); ctx.fill();
    ctx.fillStyle=C.colorDark; ctx.beginPath(); ctx.arc(0,-97,13,Math.PI,Math.PI*2); ctx.fill(); ctx.fillRect(-13,-97,26,4);
    ctx.globalCompositeOperation='lighter';
    ctx.fillStyle=C.color; ctx.shadowColor=C.color; ctx.shadowBlur=12;
    ctx.beginPath(); ctx.arc(-5,-93,4.5,0,7); ctx.fill(); ctx.beginPath(); ctx.arc(6,-93,4.5,0,7); ctx.fill();
    ctx.shadowBlur=0; ctx.globalCompositeOperation='source-over';
    ctx.fillStyle='#37474f'; roundRect(-5,-87,11,9,3); ctx.fill();
    ctx.fillStyle='#455a64'; ctx.beginPath(); ctx.arc(0,-83,3,0,7); ctx.fill();
    const drip=(time*18)%12; ctx.fillStyle=C.color; ctx.globalAlpha=0.8; ctx.fillRect(0,-80+drip,2,4); ctx.globalAlpha=1;
    if(this.blocking){
      ctx.fillStyle=C.skin; ctx.fillRect(-21,-72,11,11); ctx.fillRect(10,-72,11,11);
      ctx.globalCompositeOperation='lighter'; ctx.strokeStyle=`rgba(29,233,182,${0.6+Math.sin(time*7)*0.3})`; ctx.lineWidth=5; ctx.shadowColor=C.color; ctx.shadowBlur=20;
      ctx.beginPath(); ctx.arc(0,-60,30,0,Math.PI*2); ctx.stroke(); ctx.shadowBlur=0; ctx.globalCompositeOperation='source-over';
    } else if(this.attacking){
      const prog=1-this.attackTimer/this.attackDuration; const ext=this.attackType==='light'?25:this.attackType==='heavy'?40:50;
      const pE=Math.sin(prog*Math.PI)*ext;
      ctx.fillStyle=C.skin; ctx.fillRect(-24,-70,10,11);
      ctx.fillStyle=C.colorDark; ctx.fillRect(-25,-63,11,8);
      ctx.fillStyle=C.skin; ctx.fillRect(15,-70,11+pE,10);
      ctx.fillStyle='#37474f'; ctx.fillRect(24+pE,-72,9,13);
      if(this.attackType==='special'){
        ctx.globalCompositeOperation='lighter';
        ctx.fillStyle=C.color; ctx.shadowColor=C.color; ctx.shadowBlur=30;
        ctx.beginPath(); ctx.arc(29+pE,-66,10+Math.sin(time*18)*3,0,7); ctx.fill();
        ctx.fillStyle='#d0ffe8'; ctx.beginPath(); ctx.arc(29+pE,-68,4,0,7); ctx.fill();
        ctx.shadowBlur=0; ctx.globalCompositeOperation='source-over';
        if(Math.random()<0.4) spawnParticles(this.x+this.facing*(35+pE)*SCALE,this.feetY-66*SCALE,C.color,1,'hit');
      }
    } else {
      ctx.fillStyle=C.skin; ctx.fillRect(-23,-72+idle,10,11); ctx.fillRect(13,-72+idle,10,11);
      ctx.fillStyle='#37474f'; ctx.fillRect(15,-64+idle,8,11); ctx.fillRect(-24,-64+idle,8,11);
      ctx.globalCompositeOperation='lighter'; ctx.fillStyle=C.color; ctx.shadowColor=C.color; ctx.shadowBlur=6;
      ctx.fillRect(16,-63+idle,6,8); ctx.shadowBlur=0; ctx.globalCompositeOperation='source-over';
    }
  }

  drawIlya(time, idle, walk) {
    const C=this.data;
    ctx.fillStyle='#37474f'; ctx.fillRect(-13,-27+walk,11,27); ctx.fillRect(2,-27-walk,11,27);
    ctx.fillStyle='#263238'; ctx.fillRect(-14,-2+walk,13,5); ctx.fillRect(1,-2-walk,13,5);
    ctx.globalCompositeOperation='lighter'; ctx.fillStyle='#b3e5fc'; ctx.fillRect(-14,-2+walk,13,1.5); ctx.fillRect(1,-2-walk,13,1.5); ctx.globalCompositeOperation='source-over';
    const aG=ctx.createLinearGradient(-20,-84+idle,20,-26+idle); aG.addColorStop(0,'#cfe8ff'); aG.addColorStop(0.5,C.color); aG.addColorStop(1,C.colorDark);
    ctx.fillStyle=aG; roundRect(-20,-84+idle,40,58,6); ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,0.35)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(0,-82+idle); ctx.lineTo(0,-28+idle); ctx.stroke();
    ctx.globalCompositeOperation='lighter';
    ctx.strokeStyle=`rgba(179,229,252,${0.5+Math.sin(time*4)*0.3})`; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.moveTo(-12,-60+idle); ctx.lineTo(-4,-52+idle); ctx.moveTo(6,-66+idle); ctx.lineTo(13,-58+idle); ctx.stroke();
    ctx.globalCompositeOperation='source-over';
    ctx.fillStyle=C.colorDark; roundRect(-30,-86+idle,13,22,4); ctx.fill(); roundRect(17,-86+idle,13,22,4); ctx.fill();
    ctx.fillStyle=C.colorLight;
    ctx.beginPath(); ctx.moveTo(-27,-86+idle); ctx.lineTo(-24,-98+idle); ctx.lineTo(-20,-86+idle); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(20,-86+idle); ctx.lineTo(23,-97+idle); ctx.lineTo(27,-86+idle); ctx.closePath(); ctx.fill();
    ctx.fillStyle=C.skin; ctx.beginPath(); ctx.arc(0,-94,14,0,7); ctx.fill();
    ctx.fillStyle='#eceff1'; ctx.beginPath(); ctx.moveTo(-14,-98); ctx.lineTo(-8,-112); ctx.lineTo(-2,-100); ctx.lineTo(4,-114); ctx.lineTo(14,-98); ctx.closePath(); ctx.fill();
    ctx.fillStyle=C.color; ctx.fillRect(-12,-100,24,3);
    ctx.globalCompositeOperation='lighter';
    ctx.fillStyle=C.color; ctx.shadowColor=C.color; ctx.shadowBlur=10; ctx.fillRect(-8,-93,5,4); ctx.fillRect(3,-93,5,4);
    ctx.shadowBlur=0; ctx.globalCompositeOperation='source-over';
    if(this.blocking){
      ctx.fillStyle=C.skin; ctx.fillRect(-26,-76,12,14); ctx.fillRect(14,-76,12,14);
      ctx.fillStyle=C.colorDark; ctx.fillRect(-28,-66,15,12); ctx.fillRect(13,-66,15,12);
      ctx.globalCompositeOperation='lighter'; ctx.strokeStyle=`rgba(179,229,252,${0.7+Math.sin(time*6)*0.3})`; ctx.lineWidth=5; ctx.shadowColor=C.color; ctx.shadowBlur=25;
      ctx.beginPath(); ctx.arc(0,-62,34,0,Math.PI*2); ctx.stroke(); ctx.shadowBlur=0; ctx.globalCompositeOperation='source-over';
    } else if(this.attacking){
      const prog=1-this.attackTimer/this.attackDuration; const ext=this.attackType==='light'?30:this.attackType==='heavy'?48:62;
      const pE=Math.sin(prog*Math.PI)*ext;
      ctx.fillStyle=C.colorDark; ctx.fillRect(-28,-78,13,20);
      ctx.globalCompositeOperation='lighter';
      const bl=pE+18;
      const bG=ctx.createLinearGradient(16,-76,16+bl,-76); bG.addColorStop(0,C.color); bG.addColorStop(1,'#ffffff');
      ctx.fillStyle=bG; ctx.shadowColor=C.color; ctx.shadowBlur=25;
      ctx.beginPath(); ctx.moveTo(16,-72); ctx.lineTo(16+bl,-68); ctx.lineTo(16+bl,-62); ctx.lineTo(16,-58); ctx.closePath(); ctx.fill();
      ctx.shadowBlur=0;
      if(this.attackType==='special'){
        if(Math.random()<0.5) spawnParticles(this.x+this.facing*(20+pE)*SCALE,this.feetY-(60+Math.random()*30)*SCALE,'#b3e5fc',1,'hit');
        ctx.strokeStyle=`rgba(179,229,252,${0.8-prog*0.5})`; ctx.lineWidth=3;
        for(let i=0;i<3;i++){ ctx.beginPath(); ctx.arc(20+pE,-67,12+i*10+prog*20,-0.8,0.8); ctx.stroke(); }
      }
      ctx.globalCompositeOperation='source-over';
    } else {
      ctx.fillStyle=C.colorDark; ctx.fillRect(-28,-78+idle,13,20); ctx.fillRect(15,-78+idle,13,20);
    }
  }

  drawDavid(time, idle, walk) {
    const C=this.data;
    ctx.fillStyle=C.colorDark; ctx.fillRect(-13,-38+walk,11,26); ctx.fillRect(2,-38-walk,11,26);
    ctx.fillStyle=C.color; ctx.fillRect(-13,-38+walk,11,6); ctx.fillRect(2,-38-walk,11,6);
    ctx.fillStyle=C.skin; ctx.fillRect(-12,-14+walk,9,14); ctx.fillRect(2,-14-walk,9,14);
    ctx.fillStyle='#eceff1'; ctx.fillRect(-13,-2+walk,11,5); ctx.fillRect(1,-2-walk,11,5);
    ctx.fillStyle=C.color; ctx.fillRect(-13,-2+walk,11,2); ctx.fillRect(1,-2-walk,11,2);
    const tG=ctx.createLinearGradient(0,-82+idle,0,-30+idle); tG.addColorStop(0,'#fafafa'); tG.addColorStop(1,'#cfd8dc');
    ctx.fillStyle=tG; roundRect(-17,-82+idle,34,46,5); ctx.fill();
    ctx.fillStyle=C.color; ctx.fillRect(-17,-82+idle,34,6);
    ctx.fillStyle=C.skin; ctx.fillRect(-21,-80+idle,5,14); ctx.fillRect(16,-80+idle,5,14);
    ctx.fillStyle=C.skin; ctx.beginPath(); ctx.arc(0,-93,13,0,7); ctx.fill();
    ctx.fillStyle='#212121'; ctx.beginPath(); ctx.arc(0,-97,13,Math.PI,Math.PI*2); ctx.fill();
    ctx.fillStyle=C.color; ctx.save(); ctx.translate(-13,-98); ctx.rotate(Math.sin(time*5)*0.25+0.3); ctx.fillRect(-14,-2,14,4); ctx.restore();
    ctx.fillStyle=C.color; ctx.fillRect(-13,-101,26,5);
    ctx.fillStyle='#fff'; ctx.fillRect(-8,-96,6,4); ctx.fillRect(2,-96,6,4);
    ctx.fillStyle='#000'; ctx.fillRect(-6,-95,3,3); ctx.fillRect(4,-95,3,3);
    if(this.hurtTimer>0){ ctx.strokeStyle='#000'; ctx.beginPath(); ctx.arc(0,-85,4,0,Math.PI); ctx.stroke(); }
    const glove=(x,y,r)=>{ ctx.fillStyle=C.color; ctx.beginPath(); ctx.arc(x,y,r,0,7); ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,0.5)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(x,y,r*0.6,0,7); ctx.stroke();
      ctx.fillStyle=C.colorDark; ctx.fillRect(x-r,y+r-3,r*2,4); };
    if(this.blocking){
      glove(-14,-72,11); glove(12,-74,11);
      ctx.globalCompositeOperation='lighter'; ctx.strokeStyle=`rgba(255,64,129,${0.6+Math.sin(time*6)*0.3})`; ctx.lineWidth=4; ctx.shadowColor=C.color; ctx.shadowBlur=20;
      ctx.beginPath(); ctx.arc(0,-64,30,0,Math.PI*2); ctx.stroke(); ctx.shadowBlur=0; ctx.globalCompositeOperation='source-over';
    } else if(this.attacking){
      const prog=1-this.attackTimer/this.attackDuration; const ext=this.attackType==='light'?28:this.attackType==='heavy'?46:58;
      const pE=Math.sin(prog*Math.PI)*ext;
      glove(20+pE,-70,this.attackType==='special'?16:11);
      ctx.fillStyle=C.skin; ctx.fillRect(-22,-74,9,12);
      ctx.globalCompositeOperation='lighter'; ctx.strokeStyle=`rgba(255,255,255,${0.5*(1-prog)})`; ctx.lineWidth=2;
      for(let i=0;i<3;i++){ ctx.beginPath(); ctx.moveTo(-6+i*4,-78+i*6); ctx.lineTo(10+pE*0.6,-78+i*6); ctx.stroke(); }
      if(this.attackType==='special'){ ctx.strokeStyle=C.color; ctx.lineWidth=4; ctx.shadowColor=C.color; ctx.shadowBlur=20;
        ctx.beginPath(); ctx.arc(20+pE,-70,22+prog*14,0,Math.PI*2); ctx.stroke(); ctx.shadowBlur=0; }
      ctx.globalCompositeOperation='source-over';
    } else {
      glove(15,-68+idle,10); glove(-17,-64+idle,10);
    }
  }

  drawMatvey(time, idle, walk) {
    const C=this.data;
    ctx.fillStyle='#2b2b33'; ctx.fillRect(-12,-27+walk,10,27); ctx.fillRect(2,-27-walk,10,27);
    ctx.fillStyle='#111'; ctx.fillRect(-13,-2+walk,12,4); ctx.fillRect(1,-2-walk,12,4);
    const vG=ctx.createLinearGradient(-19,-80+idle,-19,-26+idle); vG.addColorStop(0,C.color); vG.addColorStop(1,C.colorDark);
    ctx.fillStyle='#eceff1'; roundRect(-15,-80+idle,30,54,4); ctx.fill();
    ctx.fillStyle=vG; ctx.fillRect(-19,-80+idle,10,54); ctx.fillRect(9,-80+idle,10,54);
    ctx.fillStyle=C.colorDark; ctx.beginPath(); ctx.moveTo(-2,-80+idle); ctx.lineTo(2,-80+idle); ctx.lineTo(1,-58+idle); ctx.lineTo(-1,-58+idle); ctx.closePath(); ctx.fill();
    ctx.fillStyle=C.skin; ctx.beginPath(); ctx.arc(0,-92,13,0,7); ctx.fill();
    ctx.fillStyle='#4e342e'; ctx.beginPath(); ctx.arc(0,-96,13,Math.PI,Math.PI*2); ctx.fill();
    ctx.fillRect(-13,-96,26,3); ctx.fillRect(2,-96,3,8);
    ctx.strokeStyle='#37474f'; ctx.lineWidth=1.5;
    ctx.strokeRect(-9,-94,7,5); ctx.strokeRect(2,-94,7,5); ctx.beginPath(); ctx.moveTo(-2,-92); ctx.lineTo(2,-92); ctx.stroke();
    ctx.globalCompositeOperation='lighter'; ctx.fillStyle='rgba(255,255,255,0.6)'; ctx.fillRect(-8,-93,5,1.5); ctx.fillRect(3,-93,5,1.5);
    ctx.globalCompositeOperation='source-over';
    if(this.blocking){
      ctx.fillStyle=C.skin; ctx.fillRect(-20,-72,10,10); ctx.fillRect(10,-72,10,10);
      ctx.globalCompositeOperation='lighter'; ctx.strokeStyle='rgba(215,204,200,0.8)'; ctx.lineWidth=4; ctx.beginPath(); ctx.arc(0,-60,30,0,7); ctx.stroke(); ctx.globalCompositeOperation='source-over';
    } else if(this.attacking){
      const prog=1-this.attackTimer/this.attackDuration;
      if(this.attackType==='special'){
        ctx.fillStyle=C.skin; ctx.fillRect(-22,-70,10,10);
        ctx.fillStyle='#2b2b33'; ctx.fillRect(4,-32,32,9);
        ctx.fillStyle='#111'; ctx.fillRect(34,-33,11,8);
        ctx.fillStyle='#2b2b33'; ctx.fillRect(-12,-24,10,14);
        ctx.fillStyle='#eceff1'; roundRect(-16,-78,30,48,4); ctx.fill();
        ctx.fillStyle=vG; ctx.fillRect(-20,-78,9,48); ctx.fillRect(8,-78,9,48);
        ctx.globalCompositeOperation='lighter'; ctx.strokeStyle=`rgba(215,204,200,${0.7-prog*0.4})`; ctx.lineWidth=2; ctx.setLineDash([6,6]);
        ctx.beginPath(); ctx.moveTo(-55,-10); ctx.quadraticCurveTo(-30,-60,-4,-45); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle=C.colorLight; ctx.globalAlpha=Math.max(0.2,0.7-prog*0.4); ctx.font='28px serif';
        ctx.fillText('♞',-50,-20+Math.sin(time*10)*4);
        ctx.globalAlpha=1; ctx.globalCompositeOperation='source-over';
      } else {
        const pE=Math.sin(prog*Math.PI)*(this.attackType==='light'?26:40);
        ctx.fillStyle=C.skin; ctx.fillRect(-22,-72,10,10);
        ctx.fillStyle='#8d6e63'; ctx.fillRect(-28,-70,9,12); ctx.fillStyle='#eceff1'; ctx.fillRect(-27,-69,7,2);
        ctx.fillStyle=C.skin; ctx.fillRect(15,-72,11+pE,10);
        ctx.fillStyle='#eceff1'; ctx.fillRect(24+pE,-74,9,12);
        if(this.attackType==='heavy'){ ctx.globalCompositeOperation='lighter'; ctx.strokeStyle=C.color; ctx.lineWidth=3; ctx.shadowColor=C.color; ctx.shadowBlur=12; ctx.beginPath(); ctx.arc(28+pE,-67,10,0,7); ctx.stroke(); ctx.shadowBlur=0; ctx.globalCompositeOperation='source-over'; }
      }
    } else {
      ctx.fillStyle=C.skin; ctx.fillRect(-22,-72+idle,10,10); ctx.fillRect(13,-72+idle,10,10);
      ctx.fillStyle='#8d6e63'; ctx.fillRect(-30,-70+idle,10,13);
      ctx.fillStyle='#eceff1'; ctx.fillRect(-29,-69+idle,8,2); ctx.fillRect(-29,-65+idle,8,1.5);
    }
  }

  drawNikita(time, idle, walk) {
    const C=this.data;
    ctx.fillStyle='#1c1c24'; ctx.fillRect(-12,-27+walk,10,27); ctx.fillRect(2,-27-walk,10,27);
    ctx.fillStyle='#e0e0e0'; ctx.fillRect(-8,-16+walk,4,1.5); ctx.fillRect(6,-12-walk,4,1.5); ctx.fillRect(-9,-8+walk,3,1.5);
    ctx.fillStyle='#000'; ctx.fillRect(-13,-2+walk,12,5); ctx.fillRect(1,-2-walk,12,5);
    const jG=ctx.createLinearGradient(-18,-80+idle,18,-24+idle); jG.addColorStop(0,'#37474f'); jG.addColorStop(1,'#0d0d12');
    ctx.fillStyle=jG; roundRect(-18,-80+idle,36,56,4); ctx.fill();
    ctx.fillStyle='#263238'; roundRect(-8,-72+idle,16,30,3); ctx.fill();
    ctx.fillStyle='#eceff1'; ctx.beginPath(); ctx.arc(0,-60+idle,5,0,7); ctx.fill();
    ctx.fillStyle='#263238'; ctx.fillRect(-3,-60+idle,2,2); ctx.fillRect(1,-60+idle,2,2);
    ctx.fillStyle='#cfd8dc'; for(let i=0;i<5;i++) ctx.fillRect(-16+i*8,-79+idle,2,2);
    ctx.strokeStyle='#90a4ae'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(-1,-78+idle); ctx.lineTo(-1,-44+idle); ctx.stroke();
    ctx.fillStyle=C.skin; ctx.beginPath(); ctx.arc(0,-92,13,0,7); ctx.fill();
    ctx.fillStyle='#263238';
    ctx.beginPath(); ctx.moveTo(-12,-100); ctx.quadraticCurveTo(-26-Math.sin(time*2.5)*4,-92,-22-Math.sin(time*2.5)*6,-66+idle); ctx.lineTo(-10,-78); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(0,-96,13,Math.PI,Math.PI*2); ctx.fill();
    ctx.fillStyle='#263238'; ctx.fillRect(-13,-98,26,4); ctx.fillRect(-13,-98,6,9); ctx.fillRect(6,-98,7,8);
    ctx.fillStyle='#fff'; ctx.fillRect(-8,-94,6,4); ctx.fillRect(2,-94,6,4);
    ctx.fillStyle='#000'; ctx.fillRect(-6,-93,3,2.5); ctx.fillRect(4,-93,3,2.5);
    ctx.fillStyle='rgba(38,50,56,0.35)'; ctx.fillRect(-8,-84,16,4);
    ctx.globalCompositeOperation='lighter'; ctx.fillStyle='#ffd600'; ctx.fillRect(-12,-88,2,3); ctx.globalCompositeOperation='source-over';
    ctx.strokeStyle='#4e342e'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(-14,-76+idle); ctx.lineTo(14,-48+idle); ctx.stroke();
    ctx.save(); ctx.translate(2,-46+idle); ctx.rotate(-0.35);
    ctx.fillStyle='#b71c1c'; roundRect(-12,-9,24,20,7); ctx.fill();
    ctx.fillStyle='#7f0000'; ctx.beginPath(); ctx.arc(-3,0,5,0,7); ctx.fill();
    ctx.fillStyle='#5d4037'; ctx.fillRect(8,-3,26,5);
    ctx.fillStyle='#cfd8dc'; ctx.fillRect(32,-4,5,7);
    ctx.strokeStyle='rgba(255,255,255,0.5)'; ctx.lineWidth=0.7; ctx.beginPath(); ctx.moveTo(8,-1.5); ctx.lineTo(32,-1.5); ctx.moveTo(8,1.5); ctx.lineTo(32,1.5); ctx.stroke();
    ctx.restore();
    if(this.blocking){
      ctx.fillStyle=C.skin; ctx.fillRect(-21,-72,10,11); ctx.fillRect(11,-72,10,11);
      ctx.globalCompositeOperation='lighter'; ctx.strokeStyle=`rgba(176,190,197,${0.6+Math.sin(time*6)*0.3})`; ctx.lineWidth=5; ctx.shadowColor=C.color; ctx.shadowBlur=20; ctx.beginPath(); ctx.arc(0,-60,32,0,Math.PI*2); ctx.stroke(); ctx.shadowBlur=0; ctx.globalCompositeOperation='source-over';
    } else if(this.attacking){
      const prog=1-this.attackTimer/this.attackDuration; const pE=Math.sin(prog*Math.PI)*(this.attackType==='light'?26:this.attackType==='heavy'?40:30);
      ctx.fillStyle=C.skin; ctx.fillRect(-22,-72,10,11);
      ctx.fillStyle='#37474f'; ctx.fillRect(-23,-65,11,8);
      ctx.fillStyle=C.skin; ctx.fillRect(16,-72,11+pE,10);
      if(this.attackType==='special'){
        ctx.globalCompositeOperation='lighter';
        ctx.strokeStyle=C.color; ctx.lineWidth=2; ctx.shadowColor='#eceff1'; ctx.shadowBlur=15;
        for(let i=0;i<3;i++){ const yy=-70+i*9; ctx.beginPath(); ctx.moveTo(30,yy); ctx.lineTo(40+Math.random()*4,yy-2); ctx.lineTo(48,yy+3); ctx.stroke(); }
        ctx.shadowBlur=0;
        ctx.fillStyle='#eceff1'; ctx.font='12px serif';
        ctx.fillText('♪',36+pE+6,-78+Math.sin(time*12)*4);
        ctx.fillText('♫',28+pE,-88+Math.cos(time*10)*4);
        ctx.globalCompositeOperation='source-over';
      }
    } else {
      ctx.fillStyle=C.skin; ctx.fillRect(-22,-72+idle,10,11); ctx.fillRect(6,-56+idle,10,10);
    }
  }

  drawVarya(time, idle, walk) {
    const C=this.data;
    ctx.fillStyle='#5d4037'; ctx.fillRect(-10,-25+walk,9,25); ctx.fillRect(1,-25-walk,9,25);
    ctx.fillStyle='#3e2723'; ctx.fillRect(-12,-14+walk,11,14); ctx.fillRect(1,-14-walk,11,14);
    ctx.fillStyle='#8d6e63'; ctx.fillRect(-13,-2+walk,12,4); ctx.fillRect(0,-2-walk,12,4);
    ctx.fillRect(-12,-10+walk,11,2); ctx.fillRect(1,-10-walk,11,2);
    ctx.fillStyle='#4e342e'; roundRect(-24,-78+idle,9,26,3); ctx.fill();
    ctx.strokeStyle='#8d6e63'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(-20,-80+idle); ctx.lineTo(-20,-86+idle); ctx.moveTo(-16,-80+idle); ctx.lineTo(-16,-85+idle); ctx.stroke();
    const tG=ctx.createLinearGradient(-15,-78+idle,15,-26+idle); tG.addColorStop(0,C.color); tG.addColorStop(1,C.colorDark);
    ctx.fillStyle=tG; roundRect(-15,-78+idle,30,52,5); ctx.fill();
    ctx.fillStyle='#5d4037'; ctx.fillRect(-15,-42+idle,30,4);
    ctx.fillStyle='#d7ccc8'; ctx.fillRect(-4,-40+idle,7,7);
    ctx.fillStyle=C.colorDark; ctx.beginPath(); ctx.moveTo(-13,-78+idle); ctx.quadraticCurveTo(-28,-50+idle,-20,-26+idle); ctx.lineTo(-10,-40+idle); ctx.closePath(); ctx.fill();
    ctx.fillStyle=C.skin; ctx.beginPath(); ctx.arc(0,-90,12,0,7); ctx.fill();
    ctx.fillStyle='#4a2c2a'; ctx.save(); ctx.translate(-10,-94); ctx.rotate(Math.sin(time*3)*0.15+0.5); roundRect(-4,-2,8,26,4); ctx.fill(); ctx.restore();
    ctx.fillStyle='#4a2c2a'; ctx.beginPath(); ctx.arc(0,-94,12,Math.PI,Math.PI*2); ctx.fill(); ctx.fillRect(-12,-94,24,4);
    ctx.fillStyle='#fff'; ctx.fillRect(-7,-92,5,3.5); ctx.fillRect(2,-92,5,3.5);
    ctx.fillStyle='#3e2723'; ctx.fillRect(-5,-91,3,2.5); ctx.fillRect(4,-91,3,2.5);
    const bowX=14, bowY=-64+idle;
    if(this.attacking && this.attackType==='special'){
      const el=this.attackDuration-this.attackTimer;
      if(el<20){
        ctx.strokeStyle='#8d6e63'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(bowX,bowY,20,-1.2,1.2); ctx.stroke();
        ctx.strokeStyle='#eceff1'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(bowX+7,bowY-19); ctx.lineTo(bowX-10,bowY); ctx.lineTo(bowX+7,bowY+19); ctx.stroke();
        ctx.globalCompositeOperation='lighter'; ctx.strokeStyle=C.colorLight; ctx.lineWidth=2; ctx.shadowColor=C.color; ctx.shadowBlur=10;
        ctx.beginPath(); ctx.moveTo(bowX-10,bowY); ctx.lineTo(bowX+22,bowY); ctx.stroke(); ctx.shadowBlur=0; ctx.globalCompositeOperation='source-over';
      } else {
        ctx.strokeStyle='#8d6e63'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(bowX,bowY,20,-1.2,1.2); ctx.stroke();
        ctx.strokeStyle='#eceff1'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(bowX+7,bowY-19); ctx.lineTo(bowX+7,bowY+19); ctx.stroke();
      }
      ctx.fillStyle=C.skin; ctx.fillRect(bowX-8,bowY-2,10,5);
    } else if(this.attacking){
      const prog=1-this.attackTimer/this.attackDuration; const pE=Math.sin(prog*Math.PI)*(this.attackType==='light'?24:38);
      const ang=-0.9+prog*1.8;
      ctx.save(); ctx.translate(bowX,bowY); ctx.rotate(ang);
      ctx.strokeStyle='#8d6e63'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(0,0,20,-1.1,1.1); ctx.stroke();
      ctx.restore();
      ctx.fillStyle=C.skin; ctx.fillRect(10,-66,10+pE,6);
      if(this.attackType==='heavy'){ ctx.globalCompositeOperation='lighter'; ctx.strokeStyle=`rgba(255,205,210,${0.6*(1-prog)})`; ctx.lineWidth=3;
        ctx.beginPath(); ctx.arc(bowX,bowY,26,-1,1); ctx.stroke(); ctx.globalCompositeOperation='source-over'; }
    } else if(this.blocking){
      ctx.fillStyle=C.skin; ctx.fillRect(-20,-70,9,9); ctx.fillRect(10,-70,9,9);
      ctx.globalCompositeOperation='lighter'; ctx.strokeStyle=`rgba(255,205,210,${0.6+Math.sin(time*6)*0.3})`; ctx.lineWidth=4; ctx.beginPath(); ctx.arc(0,-60,29,0,7); ctx.stroke(); ctx.globalCompositeOperation='source-over';
    } else {
      ctx.strokeStyle='#8d6e63'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(bowX,bowY,18,-1,1); ctx.stroke();
      ctx.strokeStyle='#eceff1'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(bowX+6,bowY-17); ctx.lineTo(bowX+6,bowY+17); ctx.stroke();
      ctx.fillStyle=C.skin; ctx.fillRect(10,-66+idle,9,5);
      ctx.fillStyle=C.skin; ctx.fillRect(-20,-70+idle,9,9);
    }
  }

  // Алиса-всадница: конь + наездница; ульта — конь встаёт на дыбы и бьёт передними копытами
  drawAlisa(time, idle, walk) {
    const C=this.data;
    const special=this.attacking&&this.attackType==='special';
    const prog=this.attacking?1-this.attackTimer/this.attackDuration:0;

    // Хвост коня
    ctx.strokeStyle=C.colorDark; ctx.lineWidth=6; ctx.lineCap='round';
    const wag=Math.sin(time*4)*10;
    ctx.beginPath(); ctx.moveTo(-38,-70+idle*0.3); ctx.quadraticCurveTo(-58,-64+wag*0.4,-66,-32+wag); ctx.stroke();
    ctx.strokeStyle=C.color; ctx.lineWidth=4;
    ctx.beginPath(); ctx.moveTo(-66,-32+wag); ctx.lineTo(-70,-16+wag); ctx.stroke();
    ctx.lineCap='butt';

    // Ноги коня (задние — планированы всегда здесь; передние во время ульты рисуются позже, поверх корпуса)
    const hipY=-46+idle*0.3;
    if(special){
      ctx.fillStyle='#2a1e1a';
      roundRect(-40,-40,11,40,3); ctx.fill();
      roundRect(-24,-42,11,42,3); ctx.fill();
      ctx.fillStyle='#161616';
      roundRect(-40,-4,11,6,2); ctx.fill();
      roundRect(-24,-6,11,6,2); ctx.fill();
    } else {
      ctx.fillStyle='#2a1e1a';
      roundRect(-42,-48+walk,11,48-walk,3); ctx.fill();
      roundRect(-26,-48-walk*0.6,11,48+walk*0.6,3); ctx.fill();
      roundRect(15,-48-walk*0.6,11,48+walk*0.6,3); ctx.fill();
      roundRect(31,-48+walk,11,48-walk,3); ctx.fill();
      ctx.fillStyle='#161616';
      roundRect(-42,-6+walk,11,6,2); ctx.fill();
      roundRect(-26,-6-walk*0.6,11,6,2); ctx.fill();
      roundRect(15,-6-walk*0.6,11,6,2); ctx.fill();
      roundRect(31,-6+walk,11,6,2); ctx.fill();
    }

    // Круп и корпус коня
    const bodyG=ctx.createLinearGradient(-40,-92,40,-46); bodyG.addColorStop(0,'#3a2a26'); bodyG.addColorStop(1,'#1c1310');
    ctx.fillStyle=bodyG; roundRect(-40,-92+idle*0.3,80,46,20); ctx.fill();

    // Седло
    ctx.fillStyle=C.colorDark; roundRect(-10,-96+idle*0.3,34,12,6); ctx.fill();
    ctx.fillStyle=C.color; roundRect(-10,-96+idle*0.3,34,4,4); ctx.fill();

    // Шея и голова коня
    ctx.fillStyle='#241914';
    ctx.beginPath(); ctx.moveTo(28,-88+idle*0.3); ctx.quadraticCurveTo(50,-100+idle,58,-128+idle); ctx.lineTo(44,-130+idle); ctx.quadraticCurveTo(36,-104+idle,22,-90+idle*0.3); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.ellipse(62,-134+idle,16,10,0.35,0,7); ctx.fill();
    ctx.fillStyle='#1a120e'; ctx.beginPath(); ctx.ellipse(76,-129+idle,8,5.5,0.25,0,7); ctx.fill();
    ctx.fillStyle='#000'; ctx.beginPath(); ctx.arc(80,-128+idle,1.4,0,7); ctx.fill();
    ctx.fillStyle='#241914';
    ctx.beginPath(); ctx.moveTo(53,-142+idle); ctx.lineTo(50,-153+idle); ctx.lineTo(59,-144+idle); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(62,-144+idle); ctx.lineTo(65,-155+idle); ctx.lineTo(69,-145+idle); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#fff'; ctx.beginPath(); ctx.ellipse(66,-135+idle,3,2.2,0.3,0,7); ctx.fill();
    ctx.fillStyle='#1a1a1a'; ctx.beginPath(); ctx.arc(67,-135+idle,1.3,0,7); ctx.fill();

    // Грива
    ctx.strokeStyle=C.color; ctx.lineWidth=5; ctx.lineCap='round';
    const maneWag=Math.sin(time*4)*5;
    ctx.beginPath(); ctx.moveTo(56,-140+idle); ctx.quadraticCurveTo(44,-118+maneWag*0.4,34,-96+maneWag); ctx.stroke();
    ctx.strokeStyle=C.colorLight; ctx.lineWidth=3;
    ctx.beginPath(); ctx.moveTo(48,-134+idle); ctx.quadraticCurveTo(38,-114+maneWag*0.3,30,-94+maneWag*0.7); ctx.stroke();
    ctx.lineCap='butt';

    // Передние копыта в ударе — рисуются поверх корпуса и головы, чтобы читались на фоне тела
    if(special){
      const rise=Math.min(prog/0.45,1);
      const strike=prog>0.45?Math.min((prog-0.45)/0.45,1):0;
      const angleDeg=prog<0.45?(90-130*rise):(-40+95*Math.pow(strike,0.7));
      const legA=this.hoofStrike(30,hipY,angleDeg,46,'#2a1e1a');
      this.hoofStrike(15,hipY,angleDeg-8*(1-strike),44,'#241a16');
      if(strike>0.08){
        ctx.globalCompositeOperation='lighter';
        ctx.strokeStyle=`rgba(244,143,177,${0.85-strike*0.5})`; ctx.lineWidth=4; ctx.shadowColor=C.color; ctx.shadowBlur=16;
        ctx.beginPath(); ctx.moveTo(legA.hoofX-Math.cos(legA.rad)*22,legA.hoofY-Math.sin(legA.rad)*22); ctx.lineTo(legA.hoofX+Math.cos(legA.rad)*16,legA.hoofY+Math.sin(legA.rad)*16); ctx.stroke();
        ctx.shadowBlur=0; ctx.globalCompositeOperation='source-over';
        if(Math.random()<0.5) spawnParticles(this.x+this.facing*SCALE*legA.hoofX, this.feetY+SCALE*legA.hoofY, C.color, 2, 'hit');
      }
    }

    // Нога наездницы, обхватывающая бок коня (видна ближняя нога, как при посадке верхом)
    ctx.strokeStyle=C.colorDark; ctx.lineWidth=13; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(-2,-94+idle*0.3); ctx.quadraticCurveTo(27,-82+idle*0.3,22,-50+idle*0.3); ctx.stroke();
    ctx.fillStyle='#2a1e1a'; ctx.beginPath(); ctx.ellipse(20,-44+idle*0.3,9,7,0.35,0,7); ctx.fill();
    ctx.lineCap='butt';

    if(special){ ctx.globalAlpha=0.22; ctx.fillStyle=C.color; roundRect(-30,-150,22,50,6); ctx.fill(); roundRect(8,-150,22,50,6); ctx.fill(); ctx.globalAlpha=1; }

    // Корпус (куртка) наездницы
    const jG=ctx.createLinearGradient(-13,-146+idle,13,-100+idle); jG.addColorStop(0,C.colorLight); jG.addColorStop(1,C.color);
    ctx.fillStyle=jG; roundRect(-13,-146+idle,26,46,8); ctx.fill();
    ctx.fillStyle='#fff'; ctx.fillRect(-3,-146+idle,6,44);
    ctx.fillStyle=C.colorDark;
    ctx.beginPath(); ctx.moveTo(-1,-140+idle); ctx.lineTo(-7,-143+idle); ctx.lineTo(-7,-137+idle); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-1,-140+idle); ctx.lineTo(5,-143+idle); ctx.lineTo(5,-137+idle); ctx.closePath(); ctx.fill();

    // Голова наездницы
    ctx.fillStyle=C.skin; ctx.beginPath(); ctx.arc(0,-158,12,0,7); ctx.fill();
    ctx.fillStyle=C.colorDark;
    ctx.beginPath(); ctx.moveTo(-11,-166); ctx.quadraticCurveTo(0,-174,11,-166); ctx.quadraticCurveTo(9,-158,0,-155); ctx.quadraticCurveTo(-9,-158,-11,-166); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(-5,-159,4,0,7); ctx.arc(5,-159,4,0,7); ctx.fill();
    ctx.fillStyle='#3e2723'; ctx.beginPath(); ctx.arc(-4,-159,2.2,0,7); ctx.arc(6,-159,2.2,0,7); ctx.fill();
    ctx.fillStyle='#fff'; ctx.fillRect(-5,-161,1.5,1.5); ctx.fillRect(5,-161,1.5,1.5);
    ctx.strokeStyle='#3e2723'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.arc(0,-153,2.5,0.2,Math.PI-0.2); ctx.stroke();

    // Руки наездницы
    if(this.blocking){
      ctx.fillStyle=C.skin; ctx.fillRect(-18,-140,8,8); ctx.fillRect(10,-140,8,8);
      ctx.globalCompositeOperation='lighter'; ctx.strokeStyle=`rgba(244,143,177,${0.6+Math.sin(time*7)*0.3})`; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(0,-128,26,0,7); ctx.stroke(); ctx.globalCompositeOperation='source-over';
    } else if(special){
      const lean=Math.sin(Math.min(prog*1.3,1)*Math.PI/2)*6;
      ctx.fillStyle=C.skin; ctx.fillRect(-18+lean,-134,8,8); ctx.fillRect(10+lean,-134,8,8);
      ctx.strokeStyle='#3e2723'; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.moveTo(-10+lean,-130); ctx.lineTo(30,-125); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(18+lean,-130); ctx.lineTo(30,-125); ctx.stroke();
    } else if(this.attacking){
      const pE=Math.sin(prog*Math.PI)*(this.attackType==='light'?24:36);
      ctx.fillStyle=C.skin; ctx.fillRect(-18,-136,8,8);
      ctx.fillStyle=C.skin; ctx.fillRect(10,-136,9+pE,8);
      ctx.fillStyle='#fff';
      const cx=19+pE;
      for(let i=0;i<3;i++){ ctx.beginPath(); ctx.moveTo(cx,-137+i*3); ctx.lineTo(cx+6,-138.5+i*3); ctx.lineTo(cx,-135.5+i*3); ctx.closePath(); ctx.fill(); }
    } else {
      ctx.fillStyle=C.skin; ctx.fillRect(-17,-138+idle,8,8); ctx.fillRect(9,-138+idle,8,8);
      ctx.strokeStyle='#3e2723'; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.moveTo(9+idle,-134+idle); ctx.lineTo(46,-128+idle); ctx.stroke();
    }
  }

  drawSofya(time, idle, walk) {
    const C=this.data;
    ctx.fillStyle='#cfd8dc'; ctx.fillRect(-11,-26+walk,9,26); ctx.fillRect(2,-26-walk,9,26);
    ctx.fillStyle='#eceff1'; ctx.fillRect(-12,-2+walk,11,5); ctx.fillRect(1,-2-walk,11,5);
    ctx.fillStyle=C.colorDark; ctx.fillRect(-12,-2+walk,11,2); ctx.fillRect(1,-2-walk,11,2);
    ctx.fillStyle='#90a4ae'; roundRect(-24,-74+idle,10,22,3); ctx.fill();
    ctx.fillStyle='#e53935'; ctx.fillRect(-22,-66+idle,6,2.5); ctx.fillRect(-20.5,-67.5+idle,3,5.5);
    const cG=ctx.createLinearGradient(-16,-80+idle,16,-26+idle); cG.addColorStop(0,'#ffffff'); cG.addColorStop(1,'#b0bec5');
    ctx.fillStyle=cG; roundRect(-16,-80+idle,32,56,5); ctx.fill();
    ctx.strokeStyle='#90a4ae'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(0,-78+idle); ctx.lineTo(0,-26+idle); ctx.stroke();
    ctx.fillStyle='#e53935'; ctx.fillRect(-3,-64+idle,6,14); ctx.fillRect(-7,-60+idle,14,6);
    ctx.strokeStyle='#37474f'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(0,-74+idle,8,0.3,Math.PI-0.3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-7.6,-71+idle); ctx.lineTo(-7.6,-56+idle); ctx.stroke();
    ctx.fillStyle='#37474f'; ctx.beginPath(); ctx.arc(-7.6,-54+idle,3,0,7); ctx.fill();
    ctx.fillStyle=C.skin; ctx.beginPath(); ctx.arc(0,-92,12,0,7); ctx.fill();
    ctx.fillStyle='#6d4c41'; ctx.beginPath(); ctx.arc(0,-96,12,Math.PI,Math.PI*2); ctx.fill(); ctx.fillRect(-12,-96,24,4);
    ctx.beginPath(); ctx.arc(0,-108,6,0,7); ctx.fill();
    ctx.fillStyle='#8d6e63'; ctx.beginPath(); ctx.arc(-2,-110,2.5,0,7); ctx.fill();
    ctx.fillStyle='#fff'; ctx.fillRect(-7,-93,5,4); ctx.fillRect(2,-93,5,4);
    ctx.fillStyle='#4e342e'; ctx.fillRect(-5,-92,3,3); ctx.fillRect(4,-92,3,3);
    ctx.strokeStyle='#4e342e'; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(0,-86,3,0.3,Math.PI-0.3); ctx.stroke();
    if(this.blocking){
      ctx.fillStyle=C.skin; ctx.fillRect(-20,-72,9,9); ctx.fillRect(11,-72,9,9);
      ctx.globalCompositeOperation='lighter'; ctx.strokeStyle=`rgba(255,255,255,${0.7+Math.sin(time*6)*0.25})`; ctx.lineWidth=4; ctx.beginPath(); ctx.arc(0,-60,29,0,7); ctx.stroke(); ctx.globalCompositeOperation='source-over';
    } else if(this.attacking){
      const prog=1-this.attackTimer/this.attackDuration;
      if(this.attackType==='special'){
        const pE=Math.sin(prog*Math.PI)*8;
        ctx.fillStyle=C.skin; ctx.fillRect(-20,-70,9,9); ctx.fillRect(11-pE,-80,9,9);
        ctx.fillStyle='#eceff1'; ctx.fillRect(12-pE,-96,7,16);
        ctx.fillStyle='#69f0ae'; ctx.fillRect(13-pE,-92,5,10);
        ctx.strokeStyle='#cfd8dc'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(15.5-pE,-96); ctx.lineTo(15.5-pE,-102); ctx.stroke();
        ctx.globalCompositeOperation='lighter';
        ctx.strokeStyle=`rgba(105,240,174,${0.8-prog*0.5})`; ctx.lineWidth=4; ctx.shadowColor='#69f0ae'; ctx.shadowBlur=20;
        ctx.beginPath(); ctx.arc(0,-58,20+prog*30,0,7); ctx.stroke();
        ctx.shadowBlur=0; ctx.globalCompositeOperation='source-over';
        if(Math.random()<0.5) spawnParticles(this.x+(Math.random()-0.5)*50*SCALE,this.feetY-Math.random()*this.bodyH,'#69f0ae',1,'heal');
      } else {
        const pE=Math.sin(prog*Math.PI)*(this.attackType==='light'?24:36);
        ctx.fillStyle=C.skin; ctx.fillRect(-20,-72,9,9);
        ctx.fillStyle=C.skin; ctx.fillRect(11,-70,8+pE,8);
        ctx.fillStyle='#eceff1'; ctx.fillRect(19+pE,-70,10,6);
        ctx.strokeStyle='#cfd8dc'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(29+pE,-67); ctx.lineTo(35+pE,-67); ctx.stroke();
        ctx.fillStyle='#f48fb1'; ctx.fillRect(20+pE,-69,8,2);
      }
    } else {
      ctx.fillStyle=C.skin; ctx.fillRect(-19,-72+idle,9,9); ctx.fillRect(10,-72+idle,9,9);
      ctx.fillStyle='#eceff1'; ctx.fillRect(11,-64+idle,9,4);
      ctx.strokeStyle='#cfd8dc'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(20,-62+idle); ctx.lineTo(24,-62+idle); ctx.stroke();
    }
  }

  drawSergey(time, idle, walk) {
    const C=this.data;
    ctx.fillStyle='#558b2f'; ctx.fillRect(-13,-28+walk,11,28); ctx.fillRect(2,-28-walk,11,28);
    ctx.fillStyle='#33691e';
    ctx.fillRect(-12,-22+walk,5,6); ctx.fillRect(-9,-12+walk,6,5); ctx.fillRect(4,-20-walk,5,7); ctx.fillRect(7,-10-walk,5,4);
    ctx.fillStyle='#212121'; ctx.fillRect(-14,-2+walk,12,5); ctx.fillRect(2,-2-walk,12,5);
    ctx.fillStyle='#689f38'; roundRect(-17,-80+idle,34,54,4); ctx.fill();
    ctx.fillStyle='#33691e'; roundRect(-19,-80+idle,12,54,3); ctx.fill(); roundRect(7,-80+idle,12,54,3); ctx.fill();
    ctx.fillStyle='#4e342e'; ctx.fillRect(-6,-52+idle,6,8); ctx.fillRect(2,-52+idle,6,8);
    ctx.strokeStyle='#90a4ae'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(-4,-78+idle); ctx.lineTo(-2,-66+idle); ctx.moveTo(4,-78+idle); ctx.lineTo(2,-66+idle); ctx.stroke();
    ctx.fillStyle='#cfd8dc'; ctx.fillRect(-4,-68+idle,4,6); ctx.fillRect(1,-67+idle,4,6);
    ctx.fillStyle='#37474f'; ctx.fillRect(12,-40+idle,4,10); ctx.fillStyle='#b0bec5'; ctx.fillRect(12,-44+idle,3,4);
    ctx.fillStyle=C.skin; ctx.beginPath(); ctx.arc(0,-92,13,0,7); ctx.fill();
    ctx.fillStyle='rgba(40,50,40,0.4)'; ctx.fillRect(-9,-84,18,5);
    ctx.strokeStyle='rgba(141,110,99,0.8)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(8,-97); ctx.lineTo(10,-90); ctx.stroke();
    ctx.fillStyle='#fff'; ctx.fillRect(-8,-95,6,4); ctx.fillRect(2,-95,6,4);
    ctx.fillStyle='#333'; ctx.fillRect(-6,-94,3,3); ctx.fillRect(4,-94,3,3);
    ctx.fillStyle='#33691e';
    ctx.beginPath(); ctx.moveTo(-13,-98); ctx.quadraticCurveTo(0,-112,14,-100); ctx.quadraticCurveTo(8,-96,-13,-98); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#cfd8dc'; ctx.fillRect(6,-103,4,4);
    if(this.blocking){
      ctx.fillStyle=C.skin; ctx.fillRect(-22,-74,10,12); ctx.fillRect(12,-74,10,12);
      ctx.fillStyle='#33691e'; ctx.fillRect(-24,-66,12,9); ctx.fillRect(12,-66,12,9);
      ctx.globalCompositeOperation='lighter'; ctx.strokeStyle=`rgba(197,225,165,${0.6+Math.sin(time*6)*0.3})`; ctx.lineWidth=5; ctx.beginPath(); ctx.arc(0,-62,33,0,7); ctx.stroke(); ctx.globalCompositeOperation='source-over';
    } else if(this.attacking){
      const prog=1-this.attackTimer/this.attackDuration; const pE=Math.sin(prog*Math.PI)*(this.attackType==='light'?26:this.attackType==='heavy'?42:40);
      ctx.fillStyle=C.skin; ctx.fillRect(-22,-74,10,12); ctx.fillStyle='#33691e'; ctx.fillRect(-24,-66,12,9);
      ctx.fillStyle=C.skin; ctx.fillRect(15,-72,11+pE,10);
      if(this.attackType==='special'){
        const el=this.attackDuration-this.attackTimer;
        if(el<15){ ctx.fillStyle='#33691e'; ctx.beginPath(); ctx.arc(28+pE,-66,6,0,7); ctx.fill();
          if(Math.sin(time*25)>0){ ctx.globalCompositeOperation='lighter'; ctx.fillStyle='#f00'; ctx.shadowColor='#f00'; ctx.shadowBlur=10; ctx.beginPath(); ctx.arc(28+pE,-70,2.5,0,7); ctx.fill(); ctx.shadowBlur=0; ctx.globalCompositeOperation='source-over'; } }
        else { ctx.fillStyle=C.skin; ctx.fillRect(26,-78,12,8); }
      } else {
        ctx.fillStyle='#33691e'; ctx.fillRect(24+pE,-74,10,12);
      }
    } else {
      ctx.fillStyle=C.skin; ctx.fillRect(-21,-74+idle,10,12); ctx.fillRect(11,-74+idle,10,12);
      ctx.fillStyle='#33691e'; ctx.fillRect(-23,-66+idle,12,9); ctx.fillRect(9,-66+idle,12,9);
    }
  }
}
