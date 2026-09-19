import fs from 'fs';
import path from 'path';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
import { characters } from './generate_svgs.mjs';

const charMap = new Map(characters.map(c => [c.id, c]));

const darksergey = charMap.get('darksergey');
const dima = charMap.get('dima');
const artem = charMap.get('artem');
const lexa = charMap.get('lexa');
const ilya = charMap.get('ilya');

// Sparks generator for epic combat atmosphere
function generateSparks() {
  const sparks = [
    // Center clash sparks
    { x: 580, y: 295, r: 5, c: '#ffd600' },
    { x: 625, y: 310, r: 6, c: '#ff9100' },
    { x: 550, y: 345, r: 4, c: '#ffffff' },
    { x: 640, y: 365, r: 5, c: '#ff3d00' },
    { x: 595, y: 245, r: 4, c: '#ffd600' },
    { x: 615, y: 415, r: 4, c: '#00e5ff' },
    { x: 545, y: 275, r: 3.5, c: '#ff8a65' },
    { x: 655, y: 330, r: 4.5, c: '#76ff03' },
    { x: 575, y: 385, r: 3.5, c: '#ffeb3b' },
    { x: 620, y: 265, r: 3.5, c: '#ff5722' },
    // Hero side embers
    { x: 390, y: 220, r: 4, c: '#ff4d2a' },
    { x: 440, y: 180, r: 3.5, c: '#ff9100' },
    { x: 470, y: 260, r: 3, c: '#ffab40' },
    { x: 210, y: 330, r: 3.5, c: '#00e5ff' },
    { x: 140, y: 190, r: 4, c: '#448aff' },
    { x: 330, y: 160, r: 3.5, c: '#e040fb' },
    { x: 260, y: 390, r: 3, c: '#ff5722' },
    { x: 380, y: 410, r: 3, c: '#ffd54f' },
    { x: 100, y: 210, r: 3, c: '#b3e5fc' },
    { x: 180, y: 440, r: 2.5, c: '#00e5ff' },
    { x: 330, y: 460, r: 2.5, c: '#ff7043' },
    { x: 450, y: 340, r: 3.5, c: '#ff3d00' },
    // Boss side void embers
    { x: 740, y: 220, r: 4.5, c: '#76ff03' },
    { x: 805, y: 155, r: 3.5, c: '#b39ddb' },
    { x: 710, y: 335, r: 4, c: '#76ff03' },
    { x: 865, y: 185, r: 4.5, c: '#9c27b0' },
    { x: 990, y: 210, r: 3.5, c: '#76ff03' },
    { x: 1060, y: 310, r: 4, c: '#69f0ae' },
    { x: 765, y: 425, r: 3.5, c: '#76ff03' },
    { x: 920, y: 440, r: 3, c: '#b39ddb' },
    { x: 1110, y: 250, r: 3, c: '#76ff03' },
    { x: 1040, y: 170, r: 3.5, c: '#9c27b0' },
    { x: 730, y: 480, r: 2.5, c: '#64dd17' },
    { x: 685, y: 280, r: 3.5, c: '#76ff03' }
  ];

  return sparks.map(s => 
    `<circle cx="${s.x}" cy="${s.y}" r="${s.r * 1.8}" fill="${s.c}" opacity="0.3" filter="url(#superGlow)"/>
     <circle cx="${s.x}" cy="${s.y}" r="${s.r}" fill="${s.c}" filter="url(#neonGlow)"/>
     <circle cx="${s.x}" cy="${s.y}" r="${Math.max(1, s.r * 0.4)}" fill="#ffffff"/>`
  ).join('\n');
}

// Floor grid lines in perspective
function generatePerspectiveGrid() {
  const lines = [];
  const horizonY = 380;
  const vpX = 595;

  // Horizontal receding lines
  for (let y = 475; y <= 630; y += 24) {
    const opacity = ((y - 460) / 170) * 0.28;
    lines.push(`<line x1="0" y1="${y}" x2="1200" y2="${y}" stroke="#00e5ff" stroke-width="1.2" opacity="${opacity.toFixed(2)}"/>`);
  }

  // Perspective rays radiating from center horizon
  for (let x = -300; x <= 1500; x += 85) {
    lines.push(`<line x1="${vpX}" y1="${horizonY}" x2="${x}" y2="630" stroke="#76ff03" stroke-width="1" opacity="0.07"/>`);
  }

  return lines.join('\n');
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <!-- Standard Glow and Shadow Filters used across all characters -->
    <filter id="neonGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="5" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#000000" flood-opacity="0.85"/>
    </filter>

    <filter id="superGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="14" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <filter id="titleGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="12" result="b1"/>
      <feGaussianBlur stdDeviation="28" result="b2"/>
      <feMerge>
        <feMergeNode in="b2"/>
        <feMergeNode in="b1"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <filter id="titleShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000000" flood-opacity="0.95"/>
    </filter>

    <filter id="bigShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.95"/>
    </filter>

    <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.85"/>
    </filter>

    <!-- Background abyss gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#05040a"/>
      <stop offset="35%" stop-color="#0d0818"/>
      <stop offset="70%" stop-color="#07120d"/>
      <stop offset="100%" stop-color="#040607"/>
    </linearGradient>

    <!-- Floor dark fade gradient -->
    <linearGradient id="floorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#040308" stop-opacity="0.95"/>
    </linearGradient>

    <!-- Left hero fiery radial glow -->
    <radialGradient id="heroAura" cx="28%" cy="50%" r="42%">
      <stop offset="0%" stop-color="#ff4d2a" stop-opacity="0.4"/>
      <stop offset="50%" stop-color="#ff7043" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#ff4d2a" stop-opacity="0"/>
    </radialGradient>

    <!-- Cyan electric sub-glow -->
    <radialGradient id="cyanAura" cx="16%" cy="58%" r="35%">
      <stop offset="0%" stop-color="#00e5ff" stop-opacity="0.25"/>
      <stop offset="60%" stop-color="#00e5ff" stop-opacity="0.05"/>
      <stop offset="100%" stop-color="#00e5ff" stop-opacity="0"/>
    </radialGradient>

    <!-- Right boss toxic abyss radial glow -->
    <radialGradient id="bossAura" cx="78%" cy="48%" r="48%">
      <stop offset="0%" stop-color="#76ff03" stop-opacity="0.35"/>
      <stop offset="35%" stop-color="#9c27b0" stop-opacity="0.3"/>
      <stop offset="75%" stop-color="#0a140a" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#76ff03" stop-opacity="0"/>
    </radialGradient>

    <!-- Central clash explosive burst -->
    <radialGradient id="clashAura" cx="50%" cy="54%" r="28%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.65"/>
      <stop offset="25%" stop-color="#ffd54f" stop-opacity="0.45"/>
      <stop offset="60%" stop-color="#ff5722" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#ff5722" stop-opacity="0"/>
    </radialGradient>

    <!-- Title Metallic Fire Gradient -->
    <linearGradient id="titleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="18%" stop-color="#fff9c4"/>
      <stop offset="42%" stop-color="#ffd54f"/>
      <stop offset="70%" stop-color="#ff6d00"/>
      <stop offset="92%" stop-color="#e64a19"/>
      <stop offset="100%" stop-color="#b71c1c"/>
    </linearGradient>

    <!-- Title Bevel Stroke Gradient -->
    <linearGradient id="titleStrokeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="40%" stop-color="#ffe082"/>
      <stop offset="80%" stop-color="#ff3d00"/>
      <stop offset="100%" stop-color="#4a0000"/>
    </linearGradient>

    <!-- Gold Accent Gradient -->
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fffde7"/>
      <stop offset="40%" stop-color="#ffd54f"/>
      <stop offset="80%" stop-color="#ff8f00"/>
      <stop offset="100%" stop-color="#e65100"/>
    </linearGradient>

    <!-- VS V Gradient (Fire) -->
    <linearGradient id="vsVGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="30%" stop-color="#ffab91"/>
      <stop offset="65%" stop-color="#ff3d00"/>
      <stop offset="100%" stop-color="#b71c1c"/>
    </linearGradient>

    <!-- VS S Gradient (Gold/Cyan) -->
    <linearGradient id="vsSGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="30%" stop-color="#ffe082"/>
      <stop offset="70%" stop-color="#ff9100"/>
      <stop offset="100%" stop-color="#00e5ff"/>
    </linearGradient>

    <!-- Boss HP Bar Gradient -->
    <linearGradient id="bossHpGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#76ff03"/>
      <stop offset="50%" stop-color="#00e676"/>
      <stop offset="100%" stop-color="#00b0ff"/>
    </linearGradient>

    <!-- Play Now Button Gradient -->
    <linearGradient id="btnGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ff8f00"/>
      <stop offset="45%" stop-color="#ff3d00"/>
      <stop offset="100%" stop-color="#c62828"/>
    </linearGradient>
  </defs>

  <!-- ==================== BACKGROUND LAYER ==================== -->
  <rect width="1200" height="630" fill="url(#bgGrad)"/>

  <!-- Arena Ambient Lights -->
  <rect width="1200" height="630" fill="url(#heroAura)"/>
  <rect width="1200" height="630" fill="url(#cyanAura)"/>
  <rect width="1200" height="630" fill="url(#bossAura)"/>
  <rect width="1200" height="630" fill="url(#clashAura)"/>

  <!-- Perspective Arena Grid -->
  <g>${generatePerspectiveGrid()}</g>

  <!-- Floor darkening shadow -->
  <rect y="460" width="1200" height="170" fill="url(#floorGrad)"/>

  <!-- Atmospheric fighting arena energy pillars -->
  <polygon points="80,0 240,0 360,630 140,630" fill="#ff5722" opacity="0.05"/>
  <polygon points="980,0 1150,0 1050,630 820,630" fill="#76ff03" opacity="0.05"/>
  <polygon points="570,0 620,0 650,630 540,630" fill="#ffd54f" opacity="0.04"/>

  <!-- Arena Floor Clashing Energy Rings -->
  <ellipse cx="595" cy="520" rx="460" ry="80" fill="none" stroke="#ff9100" stroke-width="1.5" opacity="0.25" stroke-dasharray="16,8"/>
  <ellipse cx="595" cy="520" rx="350" ry="60" fill="none" stroke="#76ff03" stroke-width="2" opacity="0.2" stroke-dasharray="24,12"/>
  <ellipse cx="595" cy="520" rx="180" ry="32" fill="none" stroke="#00e5ff" stroke-width="2.5" opacity="0.35"/>


  <!-- ==================== BOSS SIDE (RIGHT) ==================== -->
  <!-- Dark Sergey Character Avatar Sprite -->
  <g transform="translate(680, 50) scale(1.10)" filter="url(#bigShadow)">
    ${darksergey.svg}
  </g>

  <!-- Boss Cyber Tag / Nameplate -->
  <g transform="translate(935, 485)" filter="url(#cardShadow)">
    <path d="M -180 -24 L 180 -24 L 160 26 L -160 26 Z" fill="#09100a" stroke="#76ff03" stroke-width="2.5"/>
    <path d="M -173 -19 L 173 -19 L 155 21 L -155 21 Z" fill="none" stroke="#b39ddb" stroke-width="1" opacity="0.4"/>
    <text x="0" y="-3" text-anchor="middle" font-family="Russo One" font-size="19" fill="#76ff03" letter-spacing="2" filter="url(#neonGlow)">
      ТЁМНЫЙ СЕРГЕЙ
    </text>
    <text x="0" y="17" text-anchor="middle" font-family="Exo 2" font-weight="800" font-size="11" fill="#b39ddb" letter-spacing="2.5">
      ☠ ГИГА-БОСС БЕЗДНЫ • 420 HP
    </text>
  </g>

  <!-- Boss Health Bar -->
  <g transform="translate(935, 532)" filter="url(#cardShadow)">
    <rect x="-140" y="-8" width="280" height="17" rx="8.5" fill="#0a120c" stroke="#76ff03" stroke-width="1.8"/>
    <rect x="-137" y="-5" width="274" height="11" rx="5.5" fill="url(#bossHpGrad)" filter="url(#neonGlow)"/>
    <text x="0" y="4" text-anchor="middle" font-family="Russo One" font-size="10" fill="#041005" font-weight="900" letter-spacing="1">
      420 / 420 HP • ФИНАЛЬНЫЙ РАУНД
    </text>
  </g>


  <!-- ==================== HERO SQUAD SIDE (LEFT) ==================== -->
  
  <!-- Character 1: Ilya (Frost Knight, Back-Left) -->
  <g transform="translate(-15, 65) scale(0.72)" filter="url(#cardShadow)">
    ${ilya.svg}
  </g>

  <!-- Character 2: Lexa (Heavyweight Bruiser, Back-Center) -->
  <g transform="translate(160, 65) scale(0.72)" filter="url(#cardShadow)">
    ${lexa.svg}
  </g>

  <!-- Character 3: Artem (Cyber Speedster, Front-Left) -->
  <g transform="translate(20, 185) scale(0.80)" filter="url(#bigShadow)">
    ${artem.svg}
  </g>

  <!-- Character 4: Dima (Fire Fist Brawler, Front-Leader) -->
  <g transform="translate(190, 165) scale(0.90)" filter="url(#bigShadow)">
    ${dima.svg}
  </g>

  <!-- Hero Squad Badge Plate -->
  <g transform="translate(290, 508)" filter="url(#cardShadow)">
    <path d="M -180 -18 L 180 -18 L 158 20 L -158 20 Z" fill="#130a1b" stroke="#ff4d2a" stroke-width="2.5"/>
    <path d="M -172 -13 L 172 -13 L 152 15 L -152 15 Z" fill="none" stroke="#ff8a65" stroke-width="1" opacity="0.4"/>
    <text x="0" y="3" text-anchor="middle" font-family="Russo One" font-size="14" fill="#ffffff" letter-spacing="2">
      ⚔ КОМАНДА ГЕРОЕВ • 15 БОЙЦОВ
    </text>
    <text x="0" y="16" text-anchor="middle" font-family="Exo 2" font-weight="800" font-size="10" fill="#ff8a65" letter-spacing="2">
      ДИМА • АРТЁМ • ИЛЬЯ • ЛЁХА И ДР.
    </text>
  </g>


  <!-- ==================== CENTER CLASH: "VS" IMPACT ==================== -->
  <g transform="translate(595, 345)" filter="url(#bigShadow)">
    <!-- Shockwave Burst Rays -->
    <g stroke="url(#goldGrad)" stroke-width="2" opacity="0.65" filter="url(#neonGlow)">
      <line x1="0" y1="0" x2="-80" y2="-50"/>
      <line x1="0" y1="0" x2="80" y2="-50"/>
      <line x1="0" y1="0" x2="-80" y2="50"/>
      <line x1="0" y1="0" x2="80" y2="50"/>
      <line x1="0" y1="0" x2="0" y2="-90"/>
      <line x1="0" y1="0" x2="0" y2="90"/>
    </g>

    <!-- Shockwave Rings -->
    <circle cx="0" cy="0" r="88" fill="none" stroke="#ffd600" stroke-width="2.5" opacity="0.75" stroke-dasharray="14,8" filter="url(#neonGlow)"/>
    <circle cx="0" cy="0" r="68" fill="none" stroke="#ff3d00" stroke-width="3.5" opacity="0.85" filter="url(#neonGlow)"/>
    <circle cx="0" cy="0" r="50" fill="#0e0816" stroke="url(#goldGrad)" stroke-width="4"/>

    <!-- Lightning collision bolt -->
    <path d="M -65 -50 L -20 -15 L 0 5 L -10 25 L 20 50" fill="none" stroke="#00e5ff" stroke-width="4" filter="url(#neonGlow)"/>
    <path d="M 60 -45 L 20 -10 L 0 5 L 12 30 L -15 55" fill="none" stroke="#76ff03" stroke-width="4" filter="url(#neonGlow)"/>

    <!-- Center Clash Flare -->
    <circle cx="0" cy="0" r="26" fill="#ffffff" filter="url(#neonGlow)" opacity="0.85"/>

    <!-- "VS" Text -->
    <!-- Drop Shadow -->
    <text x="0" y="21" text-anchor="middle" font-family="Russo One" font-size="56" fill="#000000" letter-spacing="2">
      VS
    </text>
    <!-- Main Letter V (Fire) -->
    <text x="-18" y="19" text-anchor="middle" font-family="Russo One" font-size="54" fill="url(#vsVGrad)" stroke="#ff3d00" stroke-width="1.8">
      V
    </text>
    <!-- Main Letter S (Gold/Cyan) -->
    <text x="20" y="19" text-anchor="middle" font-family="Russo One" font-size="54" fill="url(#vsSGrad)" stroke="#ffd54f" stroke-width="1.8">
      S
    </text>
  </g>


  <!-- ==================== SPARKS & COMBAT PARTICLES ==================== -->
  <g>${generateSparks()}</g>


  <!-- ==================== TOP TITLE & BRANDING ==================== -->
  <!-- Header Backdrop Glow -->
  <rect x="220" y="20" width="760" height="106" rx="28" fill="#06050e" opacity="0.88" filter="url(#titleGlow)"/>

  <g transform="translate(600, 78)" filter="url(#titleShadow)">
    <!-- Decorative side brackets -->
    <g stroke="url(#goldGrad)" stroke-width="3" fill="none" filter="url(#neonGlow)">
      <path d="M -365 -22 L -405 -22 L -425 6 L -405 32 L -365 32"/>
      <path d="M 365 -22 L 405 -22 L 425 6 L 405 32 L 365 32"/>
    </g>
    <!-- Accent jewels -->
    <polygon points="-420,6 -410,-4 -400,6 -410,16" fill="#ff4d2a" filter="url(#neonGlow)"/>
    <polygon points="420,6 410,-4 400,6 410,16" fill="#76ff03" filter="url(#neonGlow)"/>

    <!-- Sharp Drop Shadow -->
    <text x="0" y="5" text-anchor="middle" font-family="Russo One" font-size="62" font-weight="900" fill="#140202" letter-spacing="5">
      ДРУЗЬЯ ФАЙТИНГ
    </text>
    <!-- Main Title Front Face with crisp gradient and border -->
    <text x="0" y="0" text-anchor="middle" font-family="Russo One" font-size="62" font-weight="900" fill="url(#titleGrad)" stroke="url(#titleStrokeGrad)" stroke-width="2" letter-spacing="5">
      ДРУЗЬЯ ФАЙТИНГ
    </text>
  </g>

  <!-- Subtitle Pill Ribbon -->
  <g transform="translate(600, 118)" filter="url(#cardShadow)">
    <rect x="-265" y="-14" width="530" height="28" rx="14" fill="#0e0a17" stroke="url(#goldGrad)" stroke-width="1.8"/>
    <text x="0" y="5" text-anchor="middle" font-family="Russo One" font-size="13" fill="#ffe082" letter-spacing="2.5">
      ★ 15 БОЙЦОВ + ГИГА-БОСС • БИТВА В БРАУЗЕРЕ ★
    </text>
  </g>


  <!-- ==================== BOTTOM FEATURE PILLS ==================== -->
  <g transform="translate(600, 588)" filter="url(#cardShadow)">
    <!-- Pill 1: 1 vs 1 -->
    <g transform="translate(-420, 0)">
      <rect x="-95" y="-17" width="190" height="34" rx="17" fill="#0d101c" stroke="#448aff" stroke-width="1.8"/>
      <text x="0" y="5" text-anchor="middle" font-family="Russo One" font-size="12" fill="#b3e5fc" letter-spacing="1">
        ⚔ 1 VS 1 И БОТ
      </text>
    </g>

    <!-- Pill 2: 15 Fighters -->
    <g transform="translate(-140, 0)">
      <rect x="-105" y="-17" width="210" height="34" rx="17" fill="#150e1c" stroke="#e040fb" stroke-width="1.8"/>
      <text x="0" y="5" text-anchor="middle" font-family="Russo One" font-size="12" fill="#f48fb1" letter-spacing="1">
        ⚡ 15 УНИКАЛЬНЫХ БОЙЦОВ
      </text>
    </g>

    <!-- Pill 3: Boss Raid -->
    <g transform="translate(140, 0)">
      <rect x="-100" y="-17" width="200" height="34" rx="17" fill="#0d170e" stroke="#76ff03" stroke-width="1.8"/>
      <text x="0" y="5" text-anchor="middle" font-family="Russo One" font-size="12" fill="#b9f6ca" letter-spacing="1">
        ☠ РЕЙД НА БОССА
      </text>
    </g>

    <!-- Pill 4: Play Now CTA Button -->
    <g transform="translate(420, 0)">
      <rect x="-95" y="-18" width="190" height="36" rx="18" fill="url(#btnGrad)" stroke="#ffe082" stroke-width="2" filter="url(#neonGlow)"/>
      <text x="0" y="5" text-anchor="middle" font-family="Russo One" font-size="13" fill="#ffffff" letter-spacing="1.5">
        ▶ ИГРАТЬ СЕЙЧАС
      </text>
    </g>
  </g>


  <!-- ==================== ARCADE TECH BORDER & CORNERS ==================== -->
  <!-- Subtle Outer Border -->
  <rect x="12" y="12" width="1176" height="606" rx="18" fill="none" stroke="#1c162e" stroke-width="3"/>
  <rect x="16" y="16" width="1168" height="598" rx="14" fill="none" stroke="#ff4d2a" stroke-width="1.5" opacity="0.4"/>

  <!-- High-Tech Glowing Corner Brackets -->
  <g stroke="url(#goldGrad)" stroke-width="4" fill="none" filter="url(#neonGlow)">
    <!-- Top-Left -->
    <path d="M 22 64 L 22 22 L 64 22"/>
    <!-- Top-Right -->
    <path d="M 1136 22 L 1178 22 L 1178 64"/>
    <!-- Bottom-Left -->
    <path d="M 22 566 L 22 608 L 64 608"/>
    <!-- Bottom-Right -->
    <path d="M 1136 608 L 1178 608 L 1178 566"/>
  </g>

  <!-- Corner Tech Dots -->
  <circle cx="30" cy="30" r="4" fill="#ffd54f" filter="url(#neonGlow)"/>
  <circle cx="1170" cy="30" r="4" fill="#76ff03" filter="url(#neonGlow)"/>
  <circle cx="30" cy="600" r="4" fill="#00e5ff" filter="url(#neonGlow)"/>
  <circle cx="1170" cy="600" r="4" fill="#ffd54f" filter="url(#neonGlow)"/>

</svg>`;

console.log('Rendering high-res SVG with Resvg...');
const resvg = new Resvg(svg, {
  fitTo: { mode: 'width', value: 1200 },
  font: {
    fontFiles: [
      path.resolve('scripts/RussoOne-Regular.ttf'),
      path.resolve('scripts/Exo2.ttf')
    ],
    loadSystemFonts: true,
    defaultFontFamily: 'Russo One'
  }
});

const pngData = resvg.render();
const pngBuffer = pngData.asPng();

// 1. Save PNG to public directory
const publicCoverPath = path.resolve('public/og-cover.png');
fs.writeFileSync(publicCoverPath, pngBuffer);
console.log(`Saved PNG cover to ${publicCoverPath} (${(pngBuffer.length / 1024).toFixed(1)} KB)`);

// 2. Save alias og-image.png
const publicImagePath = path.resolve('public/og-image.png');
fs.writeFileSync(publicImagePath, pngBuffer);

// 3. Save optimized JPEG with sharp for maximum messenger compatibility
const publicJpgCoverPath = path.resolve('public/og-cover.jpg');
const publicJpgImagePath = path.resolve('public/og-image.jpg');

const jpegBuffer = await sharp(pngBuffer)
  .jpeg({ quality: 92, chromaSubsampling: '4:4:4' })
  .toBuffer();

fs.writeFileSync(publicJpgCoverPath, jpegBuffer);
fs.writeFileSync(publicJpgImagePath, jpegBuffer);
console.log(`Saved JPEG cover to ${publicJpgCoverPath} (${(jpegBuffer.length / 1024).toFixed(1)} KB)`);

// 4. Save SVG source
fs.writeFileSync(path.resolve('public/og-cover.svg'), svg, 'utf-8');
console.log('All OG images generated successfully!');
