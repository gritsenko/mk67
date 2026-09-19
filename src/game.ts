// @ts-nocheck
import { CHARACTERS, BOSS_DATA, BOSS_MOVES } from './data/characters';

const SCALE = 1.4;
const BOSS_SCALE = 1.35;

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const CW = 960; const CH = 540; canvas.width = CW; canvas.height = CH;

let gameState = 'menu', selectedP1 = null, selectedP2 = null, isP2Bot = false;
let isBossFight = false, isBossSel = false, bossIsPlayer = false; // босс по умолчанию — БОТ
let player1, player2, particles = [], screenShake = 0, roundTimer = 99, roundTimerAccum = 0, roundNum = 1, p1Wins = 0, p2Wins = 0, koText = '', koTimer = 0;
let bgStars = [], bgBuildings = [];
let botActionTimer = 0, botDecision = 'idle';
let bossBotTimer = 0, bossBotDecision = 'idle';
let isTouchDevice = false;
const keys = {};
window.addEventListener('keydown', e => { keys[e.code] = true; e.preventDefault(); });
window.addEventListener('keyup', e => { keys[e.code] = false; });

if ('ontouchstart' in window || navigator.maxTouchPoints > 0) { isTouchDevice = true; document.body.classList.add('is-mobile'); setupTouchControls(); }

function setupTouchControls() {
    const touchEl = document.getElementById('touchControls'); const activeTouches = {}; 
    touchEl.addEventListener('touchstart', e => { e.preventDefault(); for (let touch of e.changedTouches) { const target = document.elementFromPoint(touch.clientX, touch.clientY); if (target && target.dataset.key) { activeTouches[touch.identifier] = target.dataset.key; keys[target.dataset.key] = true; } } }, { passive: false });
    touchEl.addEventListener('touchend', e => { e.preventDefault(); for (let touch of e.changedTouches) { const key = activeTouches[touch.identifier]; if (key) { keys[key] = false; delete activeTouches[touch.identifier]; } } }, { passive: false });
    touchEl.addEventListener('touchcancel', e => { e.preventDefault(); for (let touch of e.changedTouches) { const key = activeTouches[touch.identifier]; if (key) { keys[key] = false; delete activeTouches[touch.identifier]; } } }, { passive: false });
}

function hideTouchUI() {
  if(isTouchDevice){
    document.getElementById('touchControls').style.display='none';
    document.getElementById('p2TouchControls').style.display='none';
  }
}

function generateBackground() { bgStars=[]; for(let i=0;i<80;i++) bgStars.push({x:Math.random()*CW,y:Math.random()*CH*0.5,r:Math.random()*1.5+0.3,a:Math.random()*0.6+0.2,speed:Math.random()*0.003+0.001}); bgBuildings=[]; let bx=0; while(bx<CW){const bw=Math.random()*60+30,bh=Math.random()*150+60;bgBuildings.push({x:bx,w:bw,h:bh,windows:Math.random()>0.3});bx+=bw+Math.random()*10;} }
generateBackground();

function drawBackground(time) {
  const grad=ctx.createLinearGradient(0,0,0,CH);grad.addColorStop(0,'#0a0a1a');grad.addColorStop(0.4,'#1a0f20');grad.addColorStop(0.7,'#2a1520');grad.addColorStop(1,'#0d0d15');ctx.fillStyle=grad;ctx.fillRect(0,0,CW,CH);
  bgStars.forEach(s=>{const f=Math.sin(time*s.speed*1000)*0.3+0.7;ctx.fillStyle=`rgba(255,230,200,${s.a*f})`;ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fill();});
  const groundY=CH*0.82; bgBuildings.forEach(b=>{ctx.fillStyle='#0f0f18';ctx.fillRect(b.x,groundY-b.h,b.w,b.h);if(b.windows){for(let wy=groundY-b.h+10;wy<groundY-10;wy+=18)for(let wx=b.x+6;wx<b.x+b.w-6;wx+=12){const lit=Math.sin(wx*3.7+wy*2.1+time*0.5)>0.3;ctx.fillStyle=lit?'rgba(255,180,60,0.25)':'rgba(30,30,50,0.3)';ctx.fillRect(wx,wy,6,8);}}});
  const gGrad=ctx.createLinearGradient(0,groundY,0,CH);gGrad.addColorStop(0,'#2a1f1a');gGrad.addColorStop(0.3,'#1a1410');gGrad.addColorStop(1,'#0a0a0f');ctx.fillStyle=gGrad;ctx.fillRect(0,groundY,CW,CH-groundY);
  ctx.strokeStyle='rgba(255,77,42,0.3)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,groundY);ctx.lineTo(CW,groundY);ctx.stroke();
  const glowGrad=ctx.createRadialGradient(CW/2,groundY,0,CW/2,groundY,CW*0.4);glowGrad.addColorStop(0,'rgba(255,77,42,0.08)');glowGrad.addColorStop(1,'rgba(255,77,42,0)');ctx.fillStyle=glowGrad;ctx.fillRect(0,groundY-40,CW,80);
  if(isBossFight){ ctx.fillStyle=`rgba(40,10,50,${0.12+Math.sin(time*1.5)*0.05})`; ctx.fillRect(0,0,CW,CH); }
}

function roundRect(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();}

class Fighter {
  constructor(charData, x, facing, playerIndex) { Object.assign(this, { data: charData, x, y:0, vx:0, vy:0, facing, pi:playerIndex, hp:charData.hp, maxHp:charData.hp, displayHp:charData.hp, speed:charData.speed, power:charData.power, defense:charData.defense, grounded:true, blocking:false, attacking:false, attackType:'', attackTimer:0, attackDuration:0, attackHit:false, hurtTimer:0, combo:0, specialCooldown:0, animFrame:0, animTimer:0, bodyW:charData.bodyW, bodyH:charData.bodyH, projectile:null, slowTimer:0, bossCD:{light:0,heavy:0,spikes:0,wave:0,rain:0,clones:0,ulta:0}, bossProjectiles:[], bossSpikes:null, bossWave:null }); }
  get groundY() { return CH*0.82; } get feetY() { return this.groundY-this.y; } get centerY() { return this.feetY-this.bodyH/2; }
  get effSpeed() { return this.slowTimer>0 ? this.data.speed*0.45 : this.data.speed; }
  canAct() { return this.hurtTimer<=0 && !this.attacking; }

  attack(type) {
    if(this.data.isBoss){
      const M=BOSS_MOVES[type];
      if(M.cd&&this.bossCD[type]>0) return;
      this.attacking=true; this.attackType=type; this.attackHit=false;
      this.attackDuration=M.dur; this.attackTimer=M.dur;
      if(M.cd) this.bossCD[type]=M.cd;
      const gy=this.groundY, f=this.facing;
      // ИСПРАВЛЕНО: снаряды летят по низу — на уровне торса игрока (~105-170px над землёй)
      if(type==='wave') this.bossProjectiles.push({x:this.x+f*140,y:gy-105,vx:f*8.5,vy:0,r:34,dmg:24});
      if(type==='rain'){ const hx=player1.x; for(let i=0;i<5;i++) this.bossProjectiles.push({x:hx-130+i*65+(Math.random()-0.5)*30,y:-60-i*45,vx:0,vy:10,r:20,dmg:14}); }
      if(type==='clones'){ for(let i=-1;i<=1;i++) this.bossProjectiles.push({x:this.x+f*130,y:gy-105+i*62,vx:f*12,vy:i*0.9,r:22,dmg:18}); }
      if(type==='spikes'){ const x1=this.x+f*170,x2=this.x+f*450; this.bossSpikes={t:0,x1:Math.min(x1,x2),x2:Math.max(x1,x2),hit:false}; }
      if(type==='ulta') this.bossWave={r:80,hit:false};
      return;
    }
    if(!this.canAct()) return; if(type==='special'&&this.specialCooldown>0) return;
    this.attacking=true; this.attackType=type; this.attackHit=false;
    if(type==='light'){this.attackDuration=15;this.attackTimer=15;}
    else if(type==='heavy'){this.attackDuration=28;this.attackTimer=28;}
    else if(type==='special'){
      this.attackDuration=35;this.attackTimer=35;
      this.specialCooldown=this.data.specialCooldown || (this.data.id==='sofya'?300:180);
      if(this.data.projectile){ const spd=this.data.projectileSpeed || ({sanya:10,grisha:8,varya:16,nikita:9,sergey:7}[this.data.id]||10); this.projectile={x:this.x+this.facing*45*SCALE,y:this.feetY-this.bodyH*0.55,vx:this.facing*spd*SCALE,life:60,hit:false}; }
      if(this.data.leapVx || this.data.id==='matvey'){ this.vy=this.data.leapVy || -14; this.grounded=false; this.y=1; this.vx=this.facing*(this.data.leapVx || 7); }
      if(this.data.dashVx || this.data.id==='alisa'){ this.vx=this.facing*(this.data.dashVx || 6.5); }
      if(this.data.healPercent || this.data.id==='sofya'){ const healAmt=this.maxHp*(this.data.healPercent || 0.2); this.hp=Math.min(this.maxHp,this.hp+healAmt); for(let i=0;i<10;i++) spawnParticles(this.x+(Math.random()-0.5)*60*SCALE,this.feetY-Math.random()*this.bodyH,'#69f0ae',1,'heal'); }
    }
  }
  getAttackBox() {
    if(this.data.isBoss){
      if(this.attackType!=='light'&&this.attackType!=='heavy') return null;
      if(this.attackHit) return null;
      const el=this.attackDuration-this.attackTimer;
      const as=this.attackType==='light'?6:12, ae=this.attackType==='light'?16:26;
      if(el<as||el>ae) return null;
      // ИСПРАВЛЕНО: хитбоксы опущены до уровня игрока (покрывают от земли вверх)
      // light: от 0 до ~205px над землёй; heavy (укус): от 0 до ~264px + шире
      const cov=this.attackType==='light'?0.62:0.8;
      const range=this.attackType==='light'?270:320;
      return{x:this.x+this.facing*40,y:this.feetY-this.bodyH*cov,w:range,h:this.bodyH*cov};
    }
    if(!this.attacking||this.attackHit) return null; if(this.data.id==='sofya'&&this.attackType==='special') return null;
    let as,ae;if(this.attackType==='light'){as=4;ae=10;}else if(this.attackType==='heavy'){as=10;ae=20;}else{as=12;ae=26;}
    const el=this.attackDuration-this.attackTimer; if(el<as||el>ae) return null;
    const range=this.attackType==='light'?55:this.attackType==='heavy'?70:85;
    return{x:this.x+this.facing*25*SCALE, y:this.feetY-this.bodyH*0.7, w:range*SCALE, h:40*SCALE}; }
  getDamage() {
    if(this.data.isBoss){ return this.attackType==='light'?16:this.attackType==='heavy'?28:0; }
    const b=this.power; if(this.attackType==='light')return b; if(this.attackType==='heavy')return b*1.8; if(this.attackType==='special')return this.data.specialDamageMult !== undefined ? b*this.data.specialDamageMult : ((this.data.id==='artem')?b*0.6:b*2.2); return b; }
  takeDamage(dmg, attacker) {
    let fd=dmg;
    if(this.blocking){ fd=dmg*0.25/this.defense; spawnParticles(this.x,this.feetY-this.bodyH*0.5,'#88ccff',5,'block'); }
    else{ fd=dmg/this.defense; this.hurtTimer=12;
      if((attacker.data.slowDuration || attacker.data.id==='ilya')&&attacker.attackType==='special'){ this.slowTimer=attacker.data.slowDuration || 150; spawnParticles(this.x,this.feetY-this.bodyH*0.7,'#b3e5fc',8,'hit'); }
      screenShake=Math.min(screenShake+fd*0.7,20); spawnParticles(this.x,this.feetY-this.bodyH*0.5,attacker.data.color,15,'hit'); }
    this.hp=Math.max(0,this.hp-fd); attacker.combo++; }

  update() {
    if(!this.grounded){this.vy+=0.6;this.y-=this.vy;if(this.y<=0){this.y=0;this.vy=0;this.grounded=true;}}
    this.x+=this.vx; const margin=this.data.isBoss?115:60; this.x=Math.max(margin,Math.min(CW-margin,this.x));
    if(this.hurtTimer>0)this.hurtTimer--; if(this.specialCooldown>0)this.specialCooldown--; if(this.slowTimer>0)this.slowTimer--;
    if(this.data.isBoss){ for(const k in this.bossCD) if(this.bossCD[k]>0)this.bossCD[k]--; }
    if(this.attacking){this.attackTimer--;if(this.attackTimer<=0){this.attacking=false;this.attackType='';}}
    this.animTimer++; if(this.animTimer>8){this.animTimer=0;this.animFrame++;}
    this.displayHp+=(this.hp-this.displayHp)*0.1;
    if(this.projectile){this.projectile.x+=this.projectile.vx;this.projectile.life--;if(this.projectile.life<=0)this.projectile=null;}
    if(this.grounded&&!this.attacking)this.vx*=0.8;
    if (this.grounded && Math.abs(this.vx) > 2 && Math.random() < 0.4) spawnParticles(this.x, this.groundY, this.data.isBoss?'#1a0a1e':'#5a5466', 2, 'dust');
  }

  draw(time) {
    ctx.save();
    const bx=this.x, by=this.feetY, f=this.facing;
    const shadowW=this.data.isBoss?95:45*SCALE;
    ctx.fillStyle='rgba(0,0,0,0.4)';ctx.beginPath();ctx.ellipse(bx,this.groundY+2, shadowW, this.data.isBoss?16:9*SCALE, 0, 0, Math.PI*2);ctx.fill();
    const hurt=this.hurtTimer>0&&this.hurtTimer%4<2;
    const C=this.data;
    const sc=this.data.isBoss?BOSS_SCALE:SCALE;
    ctx.translate(bx, by); ctx.scale(f * sc, sc); 
    if(hurt) ctx.globalAlpha=0.6;
    const idle=Math.sin(time*3)*3;
    const walk=Math.sin(this.animFrame*0.8)*(Math.abs(this.vx)>0.5?10:0);
    if(C.isBoss) this.drawDarkSergey(time, idle, walk);
    else switch(C.id) {
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
    if(this.slowTimer>0){ ctx.globalAlpha=0.3; ctx.fillStyle='#b3e5fc'; roundRect(-34,-118,68,118,8); ctx.fill(); ctx.globalAlpha=1; }
    ctx.globalAlpha=1; ctx.restore();

    if(this.projectile&&!this.projectile.hit) drawProjectileVis(this.projectile, this.data, time);
    if(!this.data.isBoss&&this.specialCooldown>0){const maxCd=this.data.specialCooldown||(this.data.id==='sofya'?300:180);const cd=this.specialCooldown/maxCd;ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(bx-30,this.groundY+12,60,6);ctx.fillStyle=C.color;ctx.fillRect(bx-30,this.groundY+12,60*(1-cd),6);}
    if (this.attacking && this.attackType === 'special' && !C.isBoss) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.15; ctx.fillStyle = C.color;
      ctx.beginPath(); ctx.arc(bx, this.centerY, 85 + Math.sin(time*10)*15, 0, Math.PI*2); ctx.fill(); ctx.restore();
    }
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

function drawProjectileVis(p,C,time){
  ctx.save(); ctx.translate(p.x,p.y); ctx.scale(SCALE,SCALE);
  ctx.globalCompositeOperation='lighter';
  if(C.id==='sanya'){
    ctx.fillStyle=C.color; ctx.shadowColor=C.color; ctx.shadowBlur=40; ctx.beginPath(); ctx.arc(0,0,16,0,7); ctx.fill(); ctx.shadowBlur=0;
    ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(0,0,8,0,7); ctx.fill();
    ctx.fillStyle=C.color;
    for(let i=1;i<=8;i++){ ctx.globalAlpha=0.6-i*0.07; ctx.fillRect(-Math.sign(p.vx)*i*18-12,-5+Math.sin(time*30+i)*4,24,10); }
  } else if(C.id==='grisha'){
    ctx.fillStyle=C.color; ctx.shadowColor=C.color; ctx.shadowBlur=30; ctx.beginPath(); ctx.arc(0,0,14+Math.sin(time*15)*2,0,7); ctx.fill(); ctx.shadowBlur=0;
    ctx.fillStyle='#d0ffe8'; ctx.beginPath(); ctx.arc(-3,-3,5,0,7); ctx.fill();
    ctx.strokeStyle='#fff'; ctx.lineWidth=1.5; ctx.globalAlpha=0.8;
    ctx.beginPath(); ctx.arc(5,4,3,0,7); ctx.stroke(); ctx.beginPath(); ctx.arc(-6,5,2,0,7); ctx.stroke();
    ctx.globalAlpha=1; ctx.fillStyle=C.color;
    for(let i=1;i<=4;i++){ ctx.globalAlpha=0.5-i*0.1; ctx.beginPath(); ctx.arc(-Math.sign(p.vx)*i*12,Math.sin(time*20+i*2)*4,9-i*1.5,0,7); ctx.fill(); }
  } else if(C.id==='varya'){
    ctx.rotate(p.vx<0?Math.PI:0);
    const aG=ctx.createLinearGradient(-24,0,30,0); aG.addColorStop(0,C.colorDark); aG.addColorStop(1,C.colorLight);
    ctx.fillStyle=aG; ctx.shadowColor=C.color; ctx.shadowBlur=15;
    ctx.fillRect(-22,-2,40,4);
    ctx.beginPath(); ctx.moveTo(18,-7); ctx.lineTo(30,0); ctx.lineTo(18,7); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='#fff'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(-22,0); ctx.lineTo(-34,0); ctx.stroke();
    ctx.shadowBlur=0;
  } else if(C.id==='nikita'){
    ctx.strokeStyle='#eceff1'; ctx.shadowColor=C.color; ctx.shadowBlur=25;
    const dir=p.vx>0?1:-1;
    for(let i=0;i<3;i++){ ctx.lineWidth=5-i*1.2; ctx.globalAlpha=1-i*0.28;
      ctx.beginPath(); ctx.arc(-i*12*dir,0,12+i*6, dir>0?-1.1:Math.PI-1.1, dir>0?1.1:Math.PI+1.1); ctx.stroke(); }
    ctx.shadowBlur=0;
  } else if(C.id==='sergey'){
    ctx.globalCompositeOperation='source-over';
    ctx.fillStyle='#33691e'; ctx.shadowColor='rgba(0,0,0,0.5)'; ctx.shadowBlur=6;
    ctx.beginPath(); ctx.ellipse(0,0,9,12,0,0,7); ctx.fill(); ctx.shadowBlur=0;
    ctx.fillStyle='#689f38'; ctx.beginPath(); ctx.ellipse(-3,-4,4,6,0,0,7); ctx.fill();
    ctx.fillStyle='#616161'; ctx.fillRect(-3,-17,6,6);
    if(Math.sin(time*22)>0){ ctx.globalCompositeOperation='lighter'; ctx.fillStyle='#f00'; ctx.shadowColor='#f00'; ctx.shadowBlur=15; ctx.beginPath(); ctx.arc(0,-14,3,0,7); ctx.fill(); ctx.shadowBlur=0; }
  }
  ctx.globalCompositeOperation='source-over'; ctx.globalAlpha=1; ctx.restore();
}

function updateBossFX(){ player2.bossProjectiles.forEach(p=>{ p.x+=p.vx; p.y+=p.vy; }); }
function checkBossFX(){
  const b=player2,h=player1;
  for(let i=b.bossProjectiles.length-1;i>=0;i--){
    const p=b.bossProjectiles[i];
    const hb={x:h.x-h.bodyW/2,y:h.feetY-h.bodyH,w:h.bodyW,h:h.bodyH};
    if(p.x+p.r>hb.x&&p.x-p.r<hb.x+hb.w&&p.y+p.r>hb.y&&p.y-p.r<hb.y+hb.h){
      b.attackType='special';
      h.takeDamage(p.dmg,b);
      spawnParticles(p.x,p.y,'#9c27b0',14,'hit');
      b.bossProjectiles.splice(i,1); continue;
    }
    if(p.x<-80||p.x>CW+80||p.y>CH+80) b.bossProjectiles.splice(i,1);
  }
  if(b.bossSpikes){
    const s=b.bossSpikes; s.t++;
    if(s.t>=24&&s.t<=38&&!s.hit&&h.y<30&&h.x>s.x1&&h.x<s.x2){
      s.hit=true; b.attackType='special'; h.takeDamage(30,b);
      spawnParticles(h.x,h.feetY,'#76ff03',18,'hit'); screenShake=Math.min(screenShake+12,20);
    }
    if(s.t>44) b.bossSpikes=null;
  }
  if(b.bossWave){
    const w=b.bossWave; w.r+=9;
    const d=Math.abs(h.x-b.x);
    if(!w.hit&&d<w.r&&d>w.r-55){ w.hit=true; b.attackType='special'; h.takeDamage(50,b); screenShake=Math.min(screenShake+16,22); }
    if(w.r>CW) b.bossWave=null;
  }
}
function drawBossFX(time){
  const b=player2; if(!b||!b.data||!b.data.isBoss) return;
  b.bossProjectiles.forEach(p=>{
    ctx.save(); ctx.translate(p.x,p.y);
    ctx.globalCompositeOperation='lighter';
    const g=ctx.createRadialGradient(0,0,2,0,0,p.r*1.9);
    g.addColorStop(0,'rgba(156,39,176,0.95)'); g.addColorStop(0.55,'rgba(118,255,3,0.35)'); g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(0,0,p.r*1.9,0,7); ctx.fill();
    ctx.fillStyle='#16061c'; ctx.beginPath(); ctx.arc(0,0,p.r*0.55,0,7); ctx.fill();
    ctx.strokeStyle='rgba(118,255,3,0.8)'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(0,0,p.r*0.72,0,7); ctx.stroke();
    if(p.vx){ for(let i=1;i<5;i++){ ctx.globalAlpha=0.35-i*0.07; ctx.beginPath(); ctx.arc(-Math.sign(p.vx)*i*p.r*0.85,0,p.r*0.5,0,7); ctx.fill(); } }
    ctx.globalAlpha=1; ctx.globalCompositeOperation='source-over';
    ctx.restore();
  });
  if(b.bossSpikes){
    const s=b.bossSpikes, gy=CH*0.82;
    if(s.t<22){
      ctx.save(); ctx.globalAlpha=0.5+Math.sin(time*20)*0.3;
      ctx.strokeStyle='#ff1744'; ctx.lineWidth=3; ctx.setLineDash([10,8]);
      ctx.beginPath(); ctx.moveTo(s.x1,gy); ctx.lineTo(s.x2,gy); ctx.stroke();
      ctx.setLineDash([]); ctx.restore();
    } else if(s.t<=42){
      const rise=Math.min(1,(s.t-22)/6), fall=s.t>36?1-(s.t-36)/6:1;
      const n=6;
      for(let i=0;i<n;i++){
        const sx=s.x1+(s.x2-s.x1)*(i+0.5)/n;
        const hgt=(75+((i*37)%55))*rise*fall;
        ctx.fillStyle='#0d1710';
        ctx.beginPath(); ctx.moveTo(sx-22,gy+2); ctx.lineTo(sx,gy-hgt); ctx.lineTo(sx+22,gy+2); ctx.closePath(); ctx.fill();
        ctx.globalCompositeOperation='lighter';
        ctx.strokeStyle=`rgba(118,255,3,${0.6*rise*fall})`; ctx.lineWidth=2.5;
        ctx.beginPath(); ctx.moveTo(sx,gy-hgt); ctx.lineTo(sx+9,gy); ctx.stroke();
        ctx.globalCompositeOperation='source-over';
      }
    }
  }
  if(b.bossWave){
    const w=b.bossWave;
    ctx.save(); ctx.globalCompositeOperation='lighter';
    ctx.strokeStyle='rgba(156,39,176,0.7)'; ctx.lineWidth=30;
    ctx.beginPath(); ctx.arc(b.x,CH*0.82-110,w.r,0,7); ctx.stroke();
    ctx.strokeStyle='rgba(118,255,3,0.5)'; ctx.lineWidth=10;
    ctx.beginPath(); ctx.arc(b.x,CH*0.82-110,w.r*0.92,0,7); ctx.stroke();
    ctx.restore();
  }
}

function spawnParticles(x,y,color,count,type){for(let i=0;i<count;i++){const angle=Math.random()*Math.PI*2,speed=type==='hit'?Math.random()*6+2:type==='rock'?Math.random()*4-2:Math.random()*1;particles.push({x,y,vx:Math.cos(angle)*speed,vy:type==='rock'?-Math.random()*8:(type==='heal'?-1.5-Math.random():Math.sin(angle)*speed-(type==='hit'?3:1)),life:type==='dust'?15:type==='rock'?40:type==='heal'?40:30+Math.random()*20,maxLife:50,color,size:(type==='hit'?Math.random()*4+2:type==='rock'?Math.random()*8+4:type==='heal'?4:Math.random()*2+1)*SCALE,type});}}
function updateParticles(){for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.x+=p.vx;p.y+=p.vy;p.vy+= p.type==='heal' ? -0.02 : 0.15; p.life--;if(p.life<=0)particles.splice(i,1);}}
function drawParticles(){particles.forEach(p=>{const alpha=Math.max(0,p.life/p.maxLife);ctx.globalAlpha=alpha;ctx.fillStyle=p.color;if(p.type==='hit'){ctx.shadowColor=p.color;ctx.shadowBlur=10;}if(p.type==='rock'){ctx.fillRect(p.x-p.size/2,p.y-p.size/2,p.size,p.size);}else if(p.type==='heal'){ctx.fillRect(p.x-p.size/2,p.y-p.size/6,p.size,p.size/3);ctx.fillRect(p.x-p.size/6,p.y-p.size/2,p.size/3,p.size);}else{ctx.beginPath();ctx.arc(p.x,p.y,p.size*alpha,0,Math.PI*2);ctx.fill();}ctx.shadowBlur=0;});ctx.globalAlpha=1;}

function drawFightUI(time) {
  const barW=CW*0.35,barH=22,barY=30,gap=20;
  drawHPBar(CW/2-gap-barW,barY,barW,barH,player1,true,time);
  if(isBossFight){
    drawBossHUD(time);
  } else {
    drawHPBar(CW/2+gap,barY,barW,barH,player2,false,time);
    ctx.font='800 20px "Russo One"';ctx.textAlign='left';ctx.fillStyle=player2.data.color;ctx.fillText(player2.data.name+(isP2Bot?' (БОТ)':''),CW/2+gap,barY-8);
    ctx.font='800 20px "Russo One"';ctx.fillStyle=player1.data.color;ctx.textAlign='right';ctx.fillText(p1Wins,CW/2-30,barY+48);ctx.fillStyle=player2.data.color;ctx.textAlign='left';ctx.fillText(p2Wins,CW/2+30,barY+48);
    ctx.font='600 14px "Exo 2"';ctx.fillStyle='#5a5466';ctx.fillText(`Раунд ${roundNum}`,CW/2,barY+48);
  }
  ctx.font='800 20px "Russo One"';ctx.textAlign='right';ctx.fillStyle=player1.data.color;ctx.fillText(player1.data.name,CW/2-gap-barW+barW,barY-8);
  ctx.font='800 40px "Russo One"';ctx.textAlign='center';ctx.fillStyle=roundTimer<=10?'#ff4d2a':'#f0e6d3';ctx.fillText(Math.ceil(roundTimer),CW/2,barY+32);
  if(player1.combo>1){ctx.font='800 28px "Russo One"';ctx.fillStyle=player1.data.color;ctx.textAlign='center';ctx.fillText(`${player1.combo} COMBO!`,player1.x,player1.feetY-player1.bodyH-40);}
  if(player2.combo>1&&!isBossFight){ctx.font='800 28px "Russo One"';ctx.fillStyle=player2.data.color;ctx.textAlign='center';ctx.fillText(`${player2.combo} COMBO!`,player2.x,player2.feetY-player2.bodyH-40);}
  if(koTimer>0){const scale=1+Math.sin(koTimer*0.1)*0.05;ctx.save();ctx.translate(CW/2,CH/2-40);ctx.scale(scale,scale);ctx.font='800 90px "Russo One"';ctx.textAlign='center';ctx.fillStyle=isBossFight?'#76ff03':'#ff4d2a';ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=40;ctx.fillText(koText,0,0);ctx.shadowBlur=0;ctx.restore();koTimer--;}
}

function drawBossHUD(time) {
  const b=player2;
  const x=CW*0.2,w=CW*0.6,y=76,h=18;
  ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(x-3,y-3,w+6,h+6);
  ctx.strokeStyle='rgba(118,255,3,0.5)';ctx.lineWidth=2;ctx.strokeRect(x-3,y-3,w+6,h+6);
  ctx.fillStyle='rgba(70,0,25,0.85)';ctx.fillRect(x,y,w,h);
  const pct=Math.max(0,b.displayHp/b.maxHp);
  const g=ctx.createLinearGradient(x,0,x+w,0);g.addColorStop(0,'#8b0000');g.addColorStop(1,'#ff1744');
  ctx.fillStyle=g;ctx.fillRect(x,y,w*pct,h);
  ctx.fillStyle='rgba(255,255,255,0.15)';ctx.fillRect(x,y,w,h*0.4);
  ctx.font='800 15px "Russo One"';ctx.textAlign='center';ctx.fillStyle='#76ff03';
  ctx.shadowColor='#76ff03';ctx.shadowBlur=12;
  ctx.fillText('☠ ТЁМНЫЙ СЕРГЕЙ — ВЛАДЫКА БЕЗДНЫ ☠'+(bossIsPlayer?'':' (ИИ)'),CW/2,y-8);
  ctx.shadowBlur=0;
  if(bossIsPlayer){
    const list=[['light','T'],['heavy','Y'],['spikes','G'],['wave','H'],['rain','V'],['clones','B'],['ulta','N']];
    let px=CW/2-(7*40-6)/2;
    list.forEach(([k,label])=>{
      const cd=b.bossCD[k],max=BOSS_MOVES[k].cd||1;
      ctx.fillStyle='rgba(0,0,0,0.65)';ctx.fillRect(px,CH-48,34,34);
      if(cd>0){ctx.fillStyle='rgba(156,39,176,0.5)';ctx.fillRect(px,CH-48+34*(cd/max),34,34*(1-cd/max));ctx.fillStyle='rgba(255,255,255,0.6)';ctx.font='800 11px "Exo 2"';ctx.textAlign='center';ctx.fillText(Math.ceil(cd/60),px+17,CH-38);}
      ctx.strokeStyle=cd>0?'rgba(255,255,255,0.25)':'rgba(118,255,3,0.85)';ctx.lineWidth=2;ctx.strokeRect(px,CH-48,34,34);
      ctx.fillStyle=cd>0?'#666':'#76ff03';ctx.font='800 17px "Russo One"';ctx.textAlign='center';ctx.fillText(label,px+17,CH-24);
      px+=40;
    });
  }
}
function drawHPBar(x,y,w,h,player,leftAligned,time) { ctx.fillStyle='rgba(0,0,0,0.6)';ctx.fillRect(x-2,y-2,w+4,h+4);ctx.fillStyle='rgba(255,50,50,0.4)';ctx.fillRect(x,y,w,h); const hpPct=Math.max(0,player.displayHp/player.maxHp),fillW=w*hpPct,barColor=hpPct>0.5?player.data.color:hpPct>0.25?'#ff9100':'#ff2222'; if(leftAligned){const grad=ctx.createLinearGradient(x,0,x+fillW,0);grad.addColorStop(0,barColor);grad.addColorStop(1,player.data.colorDark);ctx.fillStyle=grad;ctx.fillRect(x,y,fillW,h);} else{const grad=ctx.createLinearGradient(x+w-fillW,0,x+w,0);grad.addColorStop(0,player.data.colorDark);grad.addColorStop(1,barColor);ctx.fillStyle=grad;ctx.fillRect(x+w-fillW,y,fillW,h);} ctx.fillStyle='rgba(255,255,255,0.12)';ctx.fillRect(x,y,w,h/3); }

function handleInput() {
  if(!player1||!player2) return;
  if(player1.canAct()){
    player1.vx=0;player1.blocking=false;
    if(keys['KeyA'])player1.vx=-player1.effSpeed;
    if(keys['KeyD'])player1.vx=player1.effSpeed;
    if(keys['KeyW']&&player1.grounded){player1.vy=-12;player1.grounded=false;player1.y=1;}
    if(keys['KeyS']){player1.blocking=true;player1.vx=0;}
    if(keys['KeyF']){player1.attack('light');keys['KeyF']=false;}
    // G босса-игрока зарезервирована под "шипы", поэтому в этом режиме герой бьёт тяжёлым только на X
    const heavyPressed = isBossFight
      ? (keys['KeyX'] || (!bossIsPlayer && keys['KeyG']))
      : (keys['KeyG'] || keys['KeyX']);
    if(heavyPressed){ player1.attack('heavy'); keys['KeyG']=false; keys['KeyX']=false; }
    if(keys['KeyR']){player1.attack('special');keys['KeyR']=false;}
  }
  if(isBossFight){ bossIsPlayer?bossHumanInput():bossBotLogic(); }
  else if(isP2Bot){handleBotLogic();}
  else{if(player2.canAct()){player2.vx=0;player2.blocking=false;if(keys['ArrowLeft'])player2.vx=-player2.effSpeed;if(keys['ArrowRight'])player2.vx=player2.effSpeed;if(keys['ArrowUp']&&player2.grounded){player2.vy=-12;player2.grounded=false;player2.y=1;}if(keys['ArrowDown']){player2.blocking=true;player2.vx=0;}if(keys['KeyJ']){player2.attack('light');keys['KeyJ']=false;}if(keys['KeyK']){player2.attack('heavy');keys['KeyK']=false;}if(keys['KeyU']){player2.attack('special');keys['KeyU']=false;}}}
}

function bossHumanInput(){
  const b=player2; if(!b.canAct())return;
  b.vx=0;b.blocking=false;
  if(keys['ArrowLeft'])b.vx=-b.effSpeed;
  if(keys['ArrowRight'])b.vx=b.effSpeed;
  if(keys['ArrowUp']&&b.grounded){b.vy=-11;b.grounded=false;b.y=1;}
  if(keys['ArrowDown']){b.blocking=true;b.vx=0;}
  if(keys['KeyT'])b.attack('light');
  if(keys['KeyY'])b.attack('heavy');
  if(keys['KeyG'])b.attack('spikes');
  if(keys['KeyH'])b.attack('wave');
  if(keys['KeyV'])b.attack('rain');
  if(keys['KeyB'])b.attack('clones');
  if(keys['KeyN'])b.attack('ulta');
}

function bossBotLogic(){
  const b=player2,h=player1;if(!b.canAct())return;
  b.vx=0;b.blocking=false;
  const d=Math.abs(h.x-b.x),dir=h.x>b.x?1:-1;
  bossBotTimer++;
  if(bossBotTimer>20+Math.random()*25){
    bossBotTimer=0;const r=Math.random();
    if(b.hp<b.maxHp*0.4&&b.bossCD.ulta<=0)bossBotDecision='ulta';
    // ближняя зона: подогнана под новую дальность ударов (~360px)
    else if(d<360){ if(r<0.35)bossBotDecision='light';else if(r<0.65)bossBotDecision='heavy';else if(r<0.8&&b.bossCD.spikes<=0)bossBotDecision='spikes';else bossBotDecision='block';}
    else if(d<620){ if(r<0.3&&b.bossCD.wave<=0)bossBotDecision='wave';else if(r<0.5&&b.bossCD.rain<=0)bossBotDecision='rain';else if(r<0.65&&b.bossCD.spikes<=0)bossBotDecision='spikes';else if(r<0.87)bossBotDecision='approach';else if(b.bossCD.clones<=0)bossBotDecision='clones';else bossBotDecision='approach';}
    else{ if(r<0.4&&b.bossCD.rain<=0)bossBotDecision='rain';else if(r<0.6&&b.bossCD.clones<=0)bossBotDecision='clones';else if(r<0.7&&b.bossCD.wave<=0)bossBotDecision='wave';else bossBotDecision='approach';}
  }
  switch(bossBotDecision){
    case'approach':b.vx=dir*b.effSpeed;break;
    case'block':b.blocking=true;break;
    default:if(BOSS_MOVES[bossBotDecision]){b.attack(bossBotDecision);bossBotDecision='idle';}
  }
}

function handleBotLogic() { if(!player2.canAct()) return; player2.vx=0; player2.blocking=false; const dist=player2.x-player1.x, absDist=Math.abs(dist), dirToP1=dist>0?-1:1; botActionTimer++;
  if(botActionTimer>12+Math.random()*8){botActionTimer=0;
    if(player2.data.id==='sofya'&&player2.hp<player2.maxHp*0.45&&player2.specialCooldown<=0){botDecision='attack_special';}
    else if(player1.attacking&&absDist<120){botDecision='block';}
    else if(absDist>150){botDecision=player2.data.projectile&&player2.specialCooldown<=0&&Math.random()<0.5?'attack_special':'approach';}
    else if(absDist<90){const r=Math.random();if(r<0.4)botDecision='attack_light';else if(r<0.65)botDecision='attack_heavy';else if(r<0.75&&player2.specialCooldown<=0)botDecision='attack_special';else if(r<0.85)botDecision='block';else botDecision='retreat';}
    else{const r=Math.random();if(r<0.6)botDecision='approach';else if(r<0.8&&player2.specialCooldown<=0&&player2.data.projectile)botDecision='attack_special';else botDecision='attack_light';}}
  switch(botDecision){case'approach':player2.vx=dirToP1*player2.effSpeed;if(player2.grounded&&Math.random()<0.03){player2.vy=-12;player2.grounded=false;player2.y=1;}break;case'retreat':player2.vx=-dirToP1*player2.effSpeed;break;case'block':player2.blocking=true;break;case'attack_light':player2.attack('light');botDecision='idle';break;case'attack_heavy':player2.attack('heavy');botDecision='idle';break;case'attack_special':player2.attack('special');botDecision='idle';break;} }

function checkHit(a,d){const b=a.getAttackBox();if(!b)return;const db={x:d.x-d.bodyW/2,y:d.feetY-d.bodyH,w:d.bodyW,h:d.bodyH};const rb={x:a.facing===1?b.x:b.x-b.w,y:b.y,w:b.w,h:b.h};if(rectsOverlap(rb,db)){a.attackHit=true;d.takeDamage(a.getDamage(),a);
  if(a.data.isBoss){screenShake=Math.min(screenShake+10,20);if(a.attackType==='heavy')spawnParticles(d.x,d.centerY,'#9c27b0',10,'hit');}}}
function checkProjectileHit(a,d){if(!a.projectile||a.projectile.hit)return;const p=a.projectile,db={x:d.x-d.bodyW/2,y:d.feetY-d.bodyH,w:d.bodyW,h:d.bodyH};if(p.x>db.x&&p.x<db.x+db.w&&p.y>db.y&&p.y<db.y+db.h){p.hit=true;a.attackType='special';d.takeDamage(a.getDamage()*0.8,a);
  const big=a.data.bigExplosion || a.data.id==='sergey';
  spawnParticles(p.x,p.y,a.data.color,big?25:15,'hit');
  if(a.data.acidSplash || a.data.id==='grisha')spawnParticles(p.x,p.y,'#a7ffeb',8,'hit');
  screenShake=Math.min(screenShake+(big?12:5),20);}}
function rectsOverlap(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
function pushBodies(){const dist=Math.abs(player1.x-player2.x),minDist=isBossFight?135:80;if(dist<minDist){const push=(minDist-dist)/2;if(player1.x<player2.x){player1.x-=push;player2.x+=push;}else{player1.x+=push;player2.x-=push;}}}

function updateFight(dt) { handleInput();
  if(!player1.attacking)player1.facing=player1.x<player2.x?1:-1;
  if(!player2.attacking)player2.facing=player2.x<player1.x?1:-1;
  player1.update();player2.update();pushBodies();
  checkHit(player1,player2);checkHit(player2,player1);checkProjectileHit(player1,player2);checkProjectileHit(player2,player1);
  if(isBossFight){ updateBossFX(); checkBossFX(); }
  if(!player1.attacking)player1.combo=0;if(!player2.attacking)player2.combo=0;
  updateParticles(); roundTimerAccum+=dt;if(roundTimerAccum>=1){roundTimerAccum=0;roundTimer=Math.max(0,roundTimer-1);}
  if(screenShake>0)screenShake*=0.85;if(screenShake<0.5)screenShake=0;
  if(player1.hp<=0||player2.hp<=0||roundTimer<=0)endRound(); }

function endRound() {
  gameState='ko';
  if(isBossFight){
    if(player1.hp<=0){koText='ВЫ ПОГЛОЩЕНЫ';p2Wins=1;}
    else{koText='БОСС ПОВЕРЖЕН!';p1Wins=1;
      spawnParticles(player2.x,player2.centerY,'#76ff03',60,'hit');spawnParticles(player2.x,player2.centerY,'#9c27b0',40,'hit');screenShake=22;}
    koTimer=140;
    setTimeout(showWinner,3200);return;
  }
  if(player1.hp<=0&&player2.hp<=0)koText='DOUBLE KO';
  else if(player1.hp<=0||(roundTimer<=0&&player2.hp>player1.hp)){koText='KO';p2Wins++;}
  else if(player2.hp<=0||(roundTimer<=0&&player1.hp>player2.hp)){koText='KO';p1Wins++;}
  else koText='DRAW'; koTimer=90;
  if(player1.hp<=0)spawnParticles(player1.x,player1.centerY,player1.data.color,40,'hit');
  if(player2.hp<=0)spawnParticles(player2.x,player2.centerY,player2.data.color,40,'hit');
  setTimeout(()=>{if(p1Wins>=2||p2Wins>=2)showWinner();else{roundNum++;startRound();}},2500); }

function startRound() { gameState='fight';roundTimer=99;roundTimerAccum=0;particles=[];screenShake=0;botActionTimer=0;botDecision='idle';bossBotTimer=0;bossBotDecision='idle';
  [player1,player2].forEach((p,i)=>{p.x=isBossFight?(i===0?CW*0.25:CW*0.72):CW*(i===0?0.3:0.7);p.y=0;p.vx=0;p.vy=0;p.hp=p.maxHp;p.displayHp=p.maxHp;p.grounded=true;p.attacking=false;p.blocking=false;p.hurtTimer=0;p.combo=0;p.specialCooldown=0;p.projectile=null;p.slowTimer=0;
    p.bossCD={light:0,heavy:0,spikes:0,wave:0,rain:0,clones:0,ulta:0};p.bossProjectiles=[];p.bossSpikes=null;p.bossWave=null;});
  koText=isBossFight?(bossIsPlayer?'БОСС ПРОСНУЛСЯ':'БОСС ПРОБУЖДАЕТСЯ...'):`РАУНД ${roundNum}`;koTimer=60; }

function showWinner() {
  gameState='win';
  hideTouchUI();
  document.getElementById('controlsInfo').style.display='none';
  const w=p1Wins>=1?player1:player2;
  document.getElementById('winnerName').textContent=w.data.name+(isP2Bot&&!isBossFight&&w.pi!==1?' (БОТ)':'');
  document.getElementById('winnerName').style.color=w.data.color;
  document.getElementById('winnerLabel').textContent=isBossFight?(p1Wins>=1?'Гигант бездны повержен! Легенда!':'Тёмный Сергей поглотил твою душу...'):'побеждает!';
  document.getElementById('winScreen').classList.remove('hidden');
  document.body.classList.remove('fight-active'); }

let lastTime=0;
function gameLoop(timestamp) { const dt=Math.min((timestamp-lastTime)/1000,0.05);lastTime=timestamp;const time=timestamp/1000; ctx.clearRect(0,0,CW,CH);ctx.save(); if(screenShake>0)ctx.translate((Math.random()-0.5)*screenShake*2,(Math.random()-0.5)*screenShake*2); drawBackground(time); if(gameState==='fight'||gameState==='ko'){if(gameState==='fight')updateFight(dt);else{updateParticles();if(screenShake>0)screenShake*=0.85;if(screenShake<0.5)screenShake=0;}player1.draw(time);player2.draw(time);drawParticles();drawBossFX(time);drawFightUI(time);} ctx.restore();requestAnimationFrame(gameLoop); }

function showSelect(){hideTouchUI();document.getElementById('controlsInfo').style.display='none';document.getElementById('menuScreen').classList.add('hidden');document.getElementById('selectScreen').classList.remove('hidden');selectedP1=null;selectedP2=null;buildCharGrids();}
function buildCharGrids(){document.getElementById('p1Grid').innerHTML='';document.getElementById('p2Grid').innerHTML='';CHARACTERS.forEach(c=>{document.getElementById('p1Grid').appendChild(createCharCard(c,1));document.getElementById('p2Grid').appendChild(createCharCard(c,2));});}
function createCharCard(c,player){const darkIcon=c.id==='sofya';const card=document.createElement('div');card.className='char-card';card.dataset.id=c.id;const avatarHtml=c.avatar?`<img src="${c.avatar}" alt="${c.name}" class="char-avatar-img" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" /><div class="char-avatar-fallback" style="display:none;background:${c.color};color:${darkIcon?'#37474f':'#fff'};font-size:${c.icon.length>1?'13px':'17px'}">${c.icon}</div>`:`<div class="char-avatar-fallback" style="background:${c.color};color:${darkIcon?'#37474f':'#fff'};font-size:${c.icon.length>1?'13px':'17px'}">${c.icon}</div>`;card.innerHTML=`<div class="char-avatar" style="border-color:${c.color};background:${c.colorDark||'#1a1a24'}">${avatarHtml}</div><div class="char-name">${c.name}</div><div class="char-stat" style="font-style:italic;color:${c.color}">${c.style}</div><div class="char-stat">ATK</div><div class="stat-bar"><div class="stat-fill" style="width:${c.statATK}%;background:${c.color}"></div></div><div class="char-stat">DEF</div><div class="stat-bar"><div class="stat-fill" style="width:${c.statDEF}%;background:${c.color}"></div></div><div class="char-stat">SPD</div><div class="stat-bar"><div class="stat-fill" style="width:${c.statSPD}%;background:${c.color}"></div></div><div class="char-stat" style="color:var(--accent2)">${c.special}</div>`;card.addEventListener('click',()=>{const grid=player===1?'#p1Grid':'#p2Grid';document.querySelectorAll(`${grid} .char-card`).forEach(el=>el.classList.remove(player===1?'selected-p1':'selected-p2'));card.classList.add(player===1?'selected-p1':'selected-p2');if(player===1)selectedP1=c;else selectedP2=c;checkReady();});return card;}
function checkReady(){const btn=document.getElementById('startFightBtn');if(selectedP1&&(selectedP2||isBossSel)){btn.style.opacity='1';btn.style.pointerEvents='auto';}else{btn.style.opacity='0.4';btn.style.pointerEvents='none';}}

// НОВОЕ: переключатель "Босс: БОТ / ИГРОК"
function setBossCtrl(asPlayer){
  bossIsPlayer=asPlayer;
  document.getElementById('bossCtrlBot').classList.toggle('active',!asPlayer);
  document.getElementById('bossCtrlPlayer').classList.toggle('active',asPlayer);
}

function setP2Mode(mode) {
  isP2Bot=mode==='bot';isBossSel=mode==='boss';
  document.getElementById('btnP2Player').classList.toggle('active-p2',mode==='player');
  document.getElementById('btnP2Bot').classList.toggle('active-p2',mode==='bot');
  document.getElementById('btnP2Boss').classList.toggle('active-p2',isBossSel);
  document.getElementById('p2Grid').style.display=isBossSel?'none':'grid';
  document.getElementById('bossCard').style.display=isBossSel?'flex':'none';
  // При входе в босс-режим босс по умолчанию — БОТ
  if(isBossSel) setBossCtrl(false);
  const hint=document.getElementById('p2ControlsHint');
  if(hint) hint.style.display=isP2Bot?'none':'inline';
  if(!isBossSel&&isTouchDevice) document.getElementById('p2TouchControls').style.display=isP2Bot?'none':'flex';
  checkReady();
}

function updateControlsInfo(){
  const ci=document.getElementById('controlsInfo');
  if(isBossFight){
    if(bossIsPlayer){
      ci.innerHTML='<span><b style="color:var(--accent)">ГЕРОЙ:</b> <kbd>W</kbd> прыжок <kbd>A</kbd><kbd>D</kbd> ход <kbd>S</kbd> блок <kbd>F</kbd> удар <kbd>X</kbd> тяжёлый <kbd>R</kbd> спец</span><span><b style="color:#76ff03">БОСС:</b> <kbd>←</kbd><kbd>→</kbd> ход <kbd>↑</kbd> прыжок <kbd>↓</kbd> блок <kbd>T</kbd> хлыст <kbd>Y</kbd> пасть <kbd>G</kbd> шипы <kbd>H</kbd> волна <kbd>V</kbd> дождь <kbd>B</kbd> клоны <kbd style="color:#ff1744">N</kbd> УЛЬТА</span>';
    } else {
      ci.innerHTML='<span><b style="color:var(--accent)">ГЕРОЙ:</b> <kbd>W</kbd> прыжок <kbd>A</kbd><kbd>D</kbd> ход <kbd>S</kbd> блок <kbd>F</kbd> удар <kbd>G</kbd> тяжёлый <kbd>R</kbd> спец</span><span><b style="color:#76ff03">БОСС: ИИ</b> — уклоняйся и выживай!</span>';
    }
  } else {
    ci.innerHTML='<span><b style="color:var(--accent)">P1:</b> <kbd>W</kbd> прыжок <kbd>A</kbd><kbd>D</kbd> ход <kbd>S</kbd> блок <kbd>F</kbd> удар <kbd>G</kbd> тяжёлый <kbd>R</kbd> спец</span><span><b style="color:var(--accent2)">P2:</b> <kbd>↑</kbd> прыжок <kbd>←</kbd><kbd>→</kbd> ход <kbd>↓</kbd> блок <kbd>J</kbd> удар <kbd>K</kbd> тяжёлый <kbd>U</kbd> спец</span>';
  }
}

function startFight(){
  if(!selectedP1||(!selectedP2&&!isBossSel))return;
  document.getElementById('selectScreen').classList.add('hidden');
  document.body.classList.add('fight-active');
  if(isBossSel){
    isBossFight=true;
    // На сенсорных экранах босс всегда под управлением ИИ (много клавиш)
    if(isTouchDevice) bossIsPlayer=false;
    player1=new Fighter(selectedP1,CW*0.25,1,0);
    player2=new Fighter(BOSS_DATA,CW*0.72,-1,1);
    if(isTouchDevice){document.getElementById('touchControls').style.display='flex';document.getElementById('p2TouchControls').style.display='none';}
    else{document.getElementById('controlsInfo').style.display='flex';updateControlsInfo();}
  } else {
    isBossFight=false;
    if(isTouchDevice){document.getElementById('touchControls').style.display='flex';document.getElementById('p2TouchControls').style.display=isP2Bot?'none':'flex';}
    else{document.getElementById('controlsInfo').style.display='flex';updateControlsInfo();}
    player1=new Fighter(selectedP1,CW*0.3,1,0);
    player2=new Fighter(selectedP2,CW*0.7,-1,1);
  }
  p1Wins=0;p2Wins=0;roundNum=1;
  startRound();
}

function backToSelect(){ hideTouchUI();document.getElementById('controlsInfo').style.display='none';document.getElementById('winScreen').classList.add('hidden');document.getElementById('selectScreen').classList.remove('hidden'); document.body.classList.remove('fight-active');gameState='menu';isBossFight=false;selectedP1=null;selectedP2=null;buildCharGrids();updateControlsInfo(); }
function backToMenu(){ hideTouchUI();document.getElementById('controlsInfo').style.display='none';document.getElementById('winScreen').classList.add('hidden');document.getElementById('menuScreen').classList.remove('hidden'); document.body.classList.remove('fight-active');gameState='menu';isBossFight=false; }

Object.assign(window, { showSelect, setP2Mode, setBossCtrl, startFight, backToSelect, backToMenu });
updateControlsInfo();
requestAnimationFrame(gameLoop);
