import fs from 'fs';
import path from 'path';

const outDir = path.resolve('public/avatars');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

function frameWrapper(name, title, colorPrimary, colorDark, colorLight, innerContent, extraDefs = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#14141e"/>
      <stop offset="50%" stop-color="#0b0b12"/>
      <stop offset="100%" stop-color="#050508"/>
    </linearGradient>
    <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${colorLight}"/>
      <stop offset="50%" stop-color="${colorPrimary}"/>
      <stop offset="100%" stop-color="${colorDark}"/>
    </linearGradient>
    <radialGradient id="glowGrad" cx="50%" cy="45%" r="55%">
      <stop offset="0%" stop-color="${colorPrimary}" stop-opacity="0.38"/>
      <stop offset="60%" stop-color="${colorPrimary}" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="${colorPrimary}" stop-opacity="0"/>
    </radialGradient>
    <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#000" flood-opacity="0.75"/>
    </filter>
    ${extraDefs}
  </defs>

  <!-- Background -->
  <rect x="0" y="0" width="512" height="512" rx="32" fill="url(#bgGrad)"/>
  <circle cx="256" cy="230" r="180" fill="url(#glowGrad)"/>

  <!-- Subtle Cyber Grid -->
  <g opacity="0.12" stroke="${colorPrimary}" stroke-width="1">
    <line x1="60" y1="120" x2="452" y2="120"/>
    <line x1="60" y1="200" x2="452" y2="200"/>
    <line x1="60" y1="280" x2="452" y2="280"/>
    <line x1="60" y1="360" x2="452" y2="360"/>
    <line x1="140" y1="60" x2="140" y2="420"/>
    <line x1="256" y1="60" x2="256" y2="420"/>
    <line x1="372" y1="60" x2="372" y2="420"/>
  </g>

  <!-- Character Illustration -->
  <g filter="url(#shadow)">
    ${innerContent}
  </g>

  <!-- Arcade Tech Frame -->
  <rect x="18" y="18" width="476" height="476" rx="24" fill="none" stroke="${colorDark}" stroke-width="3" opacity="0.6"/>
  <rect x="24" y="24" width="464" height="464" rx="20" fill="none" stroke="url(#borderGrad)" stroke-width="3.5"/>

  <!-- Corner Tech Brackets -->
  <g stroke="${colorLight}" stroke-width="4" fill="none" filter="url(#neonGlow)">
    <path d="M 28 64 L 28 32 L 64 32"/>
    <path d="M 448 32 L 484 32 L 484 64"/>
    <path d="M 28 448 L 28 480 L 64 480"/>
    <path d="M 448 480 L 484 480 L 484 448"/>
  </g>

  <!-- Tech Dots / Accents -->
  <circle cx="36" cy="36" r="3" fill="${colorLight}"/>
  <circle cx="476" cy="36" r="3" fill="${colorLight}"/>
  <circle cx="36" cy="476" r="3" fill="${colorLight}"/>
  <circle cx="476" cy="476" r="3" fill="${colorLight}"/>

  <!-- Bottom Name Banner -->
  <g transform="translate(256, 436)" filter="url(#shadow)">
    <!-- Banner Plate -->
    <path d="M -160 -24 L 160 -24 L 140 22 L -140 22 Z" fill="#0c0c16" stroke="${colorPrimary}" stroke-width="2.5"/>
    <path d="M -152 -20 L 152 -20 L 134 18 L -134 18 Z" fill="none" stroke="${colorLight}" stroke-width="1" opacity="0.4"/>
    <!-- Hero Name -->
    <text x="0" y="-1" text-anchor="middle" font-family="'Russo One', 'Impact', sans-serif" font-size="24" font-weight="900" fill="#ffffff" letter-spacing="2">
      ${name}
    </text>
    <!-- Archetype / Style Subtitle -->
    <text x="0" y="15" text-anchor="middle" font-family="'Exo 2', 'Arial', sans-serif" font-size="11" font-weight="800" fill="${colorLight}" letter-spacing="3">
      ${title.toUpperCase()}
    </text>
  </g>
</svg>`;
}

export const characters = [
  {
    id: 'dima',
    name: 'DIMA',
    title: 'ОГНЕННЫЙ ВОИН • FIRE FIST',
    color: '#ff4d2a',
    colorDark: '#8b0000',
    colorLight: '#ff8a65',
    svg: `
      <!-- Dima Fire Fist Brawler -->
      <!-- Fiery Flame Aura -->
      <path d="M 80 200 Q 120 120 160 170 Q 180 90 230 140 Q 256 60 282 140 Q 332 90 352 170 Q 392 120 432 200" fill="none" stroke="#ff4d2a" stroke-width="4" filter="url(#neonGlow)"/>
      <circle cx="110" cy="190" r="6" fill="#ff8a65" filter="url(#neonGlow)"/>
      <circle cx="402" cy="190" r="6" fill="#ff8a65" filter="url(#neonGlow)"/>

      <!-- Jacket / Brawler Vest -->
      <path d="M 120 400 L 150 280 L 210 268 L 256 295 L 302 268 L 362 280 L 392 400 Z" fill="#2c3e50" stroke="#8b0000" stroke-width="3"/>
      <!-- Red Fire Flame Emblem on Chest -->
      <polygon points="256,290 280,350 256,335 232,350" fill="#ff4d2a" filter="url(#neonGlow)"/>
      <polygon points="256,305 270,345 256,335 242,345" fill="#ffd600"/>

      <!-- Fiery Hands / Fist Glow -->
      <circle cx="140" cy="340" r="24" fill="#ff4d2a" opacity="0.8" filter="url(#neonGlow)"/>
      <circle cx="372" cy="340" r="24" fill="#ff4d2a" opacity="0.8" filter="url(#neonGlow)"/>

      <!-- Face -->
      <ellipse cx="256" cy="185" rx="52" ry="58" fill="#e8b89d"/>

      <!-- Fiery Red-Orange Spiky Hair -->
      <path d="M 180 160 L 170 100 L 210 120 L 230 70 L 256 110 L 282 65 L 302 115 L 342 95 L 332 165 Z" fill="#ff4d2a" stroke="#8b0000" stroke-width="2.5"/>
      <path d="M 195 145 L 215 110 L 235 130 L 256 90 L 277 125 L 297 100 L 317 145 Z" fill="#ff8a65"/>

      <!-- Fiery Headband -->
      <rect x="198" y="152" width="116" height="18" rx="3" fill="#ff8a65" stroke="#8b0000" stroke-width="2"/>

      <!-- Intense Burning Eyes -->
      <ellipse cx="230" cy="182" rx="9" ry="6" fill="#ffffff"/>
      <ellipse cx="282" cy="182" rx="9" ry="6" fill="#ffffff"/>
      <circle cx="230" cy="182" r="4" fill="#ff4d2a"/>
      <circle cx="282" cy="182" r="4" fill="#ff4d2a"/>
      <circle cx="231" cy="181" r="1.5" fill="#ffffff"/>
      <circle cx="283" cy="181" r="1.5" fill="#ffffff"/>

      <!-- Confident Smile -->
      <path d="M 242 220 Q 256 228 272 220" fill="none" stroke="#8b0000" stroke-width="3" stroke-linecap="round"/>
    `
  },
  {
    id: 'lexa',
    name: 'LEXA',
    title: 'ТЯЖЕЛОВЕС • MEGA PUNCH',
    color: '#e040fb',
    colorDark: '#7b1fa2',
    colorLight: '#f48fb1',
    svg: `
      <!-- Lexa Heavyweight Brawler -->
      <!-- Violet Lightning Shockwaves -->
      <path d="M 90 190 L 130 160 L 115 140 L 155 110" fill="none" stroke="#e040fb" stroke-width="3" filter="url(#neonGlow)"/>
      <path d="M 422 190 L 382 160 L 397 140 L 357 110" fill="none" stroke="#e040fb" stroke-width="3" filter="url(#neonGlow)"/>

      <!-- Muscular Brawler Vest & Broad Shoulders -->
      <path d="M 100 400 L 130 270 L 205 260 L 256 290 L 307 260 L 382 270 L 412 400 Z" fill="#1a1a2a" stroke="#7b1fa2" stroke-width="4"/>
      <!-- Gold Chain around Thick Neck -->
      <path d="M 205 260 Q 256 315 307 260" fill="none" stroke="#ffd600" stroke-width="8" stroke-dasharray="14,4"/>
      <circle cx="256" cy="298" r="8" fill="#ffd600"/>

      <!-- Massive Face with Beard -->
      <ellipse cx="256" cy="185" rx="60" ry="64" fill="#d7a98c"/>
      <!-- Dark Purple Headband -->
      <rect x="190" y="140" width="132" height="22" rx="4" fill="#7b1fa2" stroke="#e040fb" stroke-width="2"/>

      <!-- Short Spiky Buzz Hair -->
      <path d="M 194 145 C 194 95 318 95 318 145 Z" fill="#212121"/>

      <!-- Heavy Brow & Furious Purple Eyes -->
      <path d="M 215 168 L 245 174" stroke="#212121" stroke-width="5" stroke-linecap="round"/>
      <path d="M 297 168 L 267 174" stroke="#212121" stroke-width="5" stroke-linecap="round"/>
      <ellipse cx="230" cy="180" rx="9" ry="6" fill="#ffffff"/>
      <ellipse cx="282" cy="180" rx="9" ry="6" fill="#ffffff"/>
      <circle cx="230" cy="180" r="4" fill="#e040fb" filter="url(#neonGlow)"/>
      <circle cx="282" cy="180" r="4" fill="#e040fb" filter="url(#neonGlow)"/>

      <!-- Beard & Intimidating Grin with Gold Tooth -->
      <path d="M 215 200 C 215 255 297 255 297 200 Z" fill="#212121"/>
      <path d="M 234 214 Q 256 226 278 214 L 274 226 Q 256 234 238 226 Z" fill="#ffffff"/>
      <rect x="252" y="217" width="8" height="10" fill="#ffd600"/>
    `
  },
  {
    id: 'artem',
    name: 'ARTEM',
    title: 'СКОРОСТНОЙ • CYBER SPEED',
    color: '#00e5ff',
    colorDark: '#006064',
    colorLight: '#80deea',
    svg: `
      <!-- Artem Cyber Speedster Ninja -->
      <!-- Light-speed Neon Cyan Energy Rings -->
      <circle cx="256" cy="200" r="160" fill="none" stroke="#00e5ff" stroke-width="2" stroke-dasharray="25,15" opacity="0.6" filter="url(#neonGlow)"/>
      <path d="M 60 260 L 140 230 L 100 300" fill="none" stroke="#00e5ff" stroke-width="3" filter="url(#neonGlow)"/>
      <path d="M 452 260 L 372 230 L 412 300" fill="none" stroke="#00e5ff" stroke-width="3" filter="url(#neonGlow)"/>

      <!-- Tech Hoodie & Armor Body -->
      <path d="M 120 400 L 150 280 L 210 268 L 256 295 L 302 268 L 362 280 L 392 400 Z" fill="#1c252a" stroke="#006064" stroke-width="3"/>
      <!-- Glowing Cyan Circuit Lines on Suit -->
      <path d="M 175 285 L 210 275 L 225 385" fill="none" stroke="#00e5ff" stroke-width="3.5" filter="url(#neonGlow)"/>
      <path d="M 337 285 L 302 275 L 287 385" fill="none" stroke="#00e5ff" stroke-width="3.5" filter="url(#neonGlow)"/>

      <!-- High Tech Face & Mask -->
      <ellipse cx="256" cy="185" rx="50" ry="56" fill="#ffe0bd"/>
      <!-- Dark Lower Half Face Mask -->
      <path d="M 215 195 L 256 210 L 297 195 L 290 245 L 256 258 L 222 245 Z" fill="#263238" stroke="#00e5ff" stroke-width="2"/>
      <line x1="256" y1="215" x2="256" y2="252" stroke="#00e5ff" stroke-width="2"/>

      <!-- Spiky Wind-swept Hair -->
      <path d="M 190 160 L 175 110 L 215 125 L 245 75 L 265 115 L 305 85 L 315 130 L 335 115 L 325 165 Z" fill="#212121" stroke="#006064" stroke-width="2"/>

      <!-- Glowing Cyan Cyber Visor -->
      <rect x="196" y="160" width="120" height="30" rx="8" fill="#002b36" stroke="#00e5ff" stroke-width="3"/>
      <rect x="204" y="166" width="104" height="18" rx="4" fill="#00e5ff" filter="url(#neonGlow)"/>
      <line x1="210" y1="175" x2="298" y2="175" stroke="#ffffff" stroke-width="3"/>
      <circle cx="256" cy="175" r="4" fill="#ffffff"/>
    `
  },
  {
    id: 'maks',
    name: 'MAKS',
    title: 'ТАНК • EARTH SHAKER',
    color: '#76ff03',
    colorDark: '#33691e',
    colorLight: '#c5e1a5',
    svg: `
      <!-- Maks Earth Shaker Juggernaut -->
      <!-- Energy Aura / Seismic Wave -->
      <path d="M 120 320 Q 256 270 392 320 Q 256 360 120 320" fill="none" stroke="#76ff03" stroke-width="5" opacity="0.6" filter="url(#neonGlow)"/>
      <path d="M 90 350 Q 256 290 422 350" fill="none" stroke="#76ff03" stroke-width="3" opacity="0.4"/>
      
      <!-- Heavy Pauldrons / Armor Body -->
      <path d="M 110 390 L 140 280 L 210 270 L 256 295 L 302 270 L 372 280 L 402 390 Z" fill="#263238" stroke="#33691e" stroke-width="4"/>
      <path d="M 130 285 L 185 275 L 210 330 L 145 340 Z" fill="#37474f" stroke="#76ff03" stroke-width="2"/>
      <path d="M 382 285 L 327 275 L 302 330 L 367 340 Z" fill="#37474f" stroke="#76ff03" stroke-width="2"/>
      
      <!-- Chest Core Reactor -->
      <polygon points="256,310 280,345 256,380 232,345" fill="#1b241c" stroke="#76ff03" stroke-width="3"/>
      <polygon points="256,322 270,345 256,368 242,345" fill="#76ff03" filter="url(#neonGlow)"/>
      <circle cx="256" cy="345" r="5" fill="#fff"/>

      <!-- Neck Guard -->
      <rect x="220" y="240" width="72" height="36" rx="6" fill="#1b252a" stroke="#455a64" stroke-width="2"/>

      <!-- Head / Tactical Juggernaut Helmet -->
      <path d="M 180 180 C 180 110 332 110 332 180 L 328 245 C 328 265 306 275 256 275 C 206 275 184 265 184 245 Z" fill="#37474f" stroke="#263238" stroke-width="4"/>
      <!-- Helmet Brow Plate -->
      <path d="M 174 150 L 256 125 L 338 150 L 332 185 L 256 170 L 180 185 Z" fill="#455a64" stroke="#76ff03" stroke-width="2"/>
      <!-- Helmet Forehead Crest / Earth Emblem -->
      <polygon points="256,120 274,152 256,160 238,152" fill="#76ff03" filter="url(#neonGlow)"/>
      <polygon points="256,128 266,148 256,154 246,148" fill="#ffffff"/>

      <!-- Glowing Toxic Green Visor Slit -->
      <rect x="196" y="186" width="120" height="22" rx="4" fill="#0d1f10" stroke="#33691e" stroke-width="2"/>
      <rect x="202" y="191" width="108" height="12" rx="2" fill="#76ff03" filter="url(#neonGlow)"/>
      <rect x="236" y="193" width="40" height="8" rx="2" fill="#ffffff"/>

      <!-- Armored Respirator / Jaw Mask -->
      <path d="M 210 220 L 256 238 L 302 220 L 298 260 L 256 272 L 214 260 Z" fill="#212121" stroke="#33691e" stroke-width="3"/>
      <!-- Vents on Jaw -->
      <line x1="230" y1="235" x2="230" y2="255" stroke="#76ff03" stroke-width="3"/>
      <line x1="243" y1="240" x2="243" y2="260" stroke="#76ff03" stroke-width="3"/>
      <line x1="256" y1="242" x2="256" y2="263" stroke="#76ff03" stroke-width="3"/>
      <line x1="269" y1="240" x2="269" y2="260" stroke="#76ff03" stroke-width="3"/>
      <line x1="282" y1="235" x2="282" y2="255" stroke="#76ff03" stroke-width="3"/>

      <!-- Massive Shoulders Spike Accents -->
      <polygon points="120,290 85,260 135,270" fill="#76ff03" opacity="0.9"/>
      <polygon points="392,290 427,260 377,270" fill="#76ff03" opacity="0.9"/>
    `
  },
  {
    id: 'sanya',
    name: 'SANYA',
    title: 'ХИТРЕЦ • SHARPSHOOTER',
    color: '#ff9100',
    colorDark: '#e65100',
    colorLight: '#ffcc80',
    svg: `
      <!-- Sanya Sly Tech Marksman -->
      <!-- Laser Aim Sight Line -->
      <line x1="228" y1="184" x2="460" y2="130" stroke="#ff1744" stroke-width="3" filter="url(#neonGlow)"/>
      <circle cx="420" cy="138" r="14" fill="none" stroke="#ff1744" stroke-width="2"/>
      <circle cx="420" cy="138" r="4" fill="#ff1744"/>

      <!-- Tactical Jacket / High Collar Body -->
      <path d="M 120 400 L 150 280 L 200 270 L 256 310 L 312 270 L 362 280 L 392 400 Z" fill="#263238" stroke="#e65100" stroke-width="3"/>
      <!-- Orange Tactical Straps & Vest Accents -->
      <path d="M 160 280 L 210 272 L 230 380 L 170 380 Z" fill="#ff9100" opacity="0.9"/>
      <path d="M 352 280 L 302 272 L 282 380 L 342 380 Z" fill="#e65100" opacity="0.9"/>
      <rect x="238" y="320" width="36" height="60" rx="4" fill="#37474f" stroke="#ff9100" stroke-width="2"/>

      <!-- High Tech Collar -->
      <path d="M 195 240 L 256 270 L 317 240 L 310 280 L 256 300 L 202 280 Z" fill="#1c252a" stroke="#ff9100" stroke-width="2"/>

      <!-- Head / Face -->
      <ellipse cx="256" cy="195" rx="52" ry="58" fill="#f3d5b5"/>

      <!-- Smirk Mouth -->
      <path d="M 245 228 Q 262 234 278 224" fill="none" stroke="#6d4c41" stroke-width="3.5" stroke-cap="round"/>
      <polygon points="274,223 282,223 277,227" fill="#fff"/>

      <!-- Hair / Undercut -->
      <path d="M 196 175 C 196 130 220 115 256 112 C 295 112 320 130 320 175 C 320 160 300 130 256 128 C 215 130 196 160 196 175 Z" fill="#3e2723"/>

      <!-- Tactical Beret / Sniper Cap -->
      <path d="M 180 155 C 180 95 290 85 330 125 C 345 140 335 160 315 165 L 180 155 Z" fill="#e65100" stroke="#ff9100" stroke-width="3"/>
      <circle cx="215" cy="140" r="7" fill="#ffd600"/>

      <!-- Cybernetic Targeting Monocle / Eyepiece (Right Eye) -->
      <rect x="210" y="172" width="34" height="24" rx="6" fill="#212121" stroke="#ff9100" stroke-width="2.5"/>
      <circle cx="227" cy="184" r="8" fill="#ff1744" filter="url(#neonGlow)"/>
      <circle cx="227" cy="184" r="3" fill="#ffffff"/>
      <line x1="210" y1="184" x2="190" y2="175" stroke="#ff9100" stroke-width="2.5"/>

      <!-- Left Eye (Sly Gaze) -->
      <path d="M 270 180 Q 284 175 298 182" fill="none" stroke="#263238" stroke-width="3.5"/>
      <circle cx="284" cy="184" r="6" fill="#e65100"/>
      <circle cx="285" cy="183" r="2.5" fill="#fff"/>

      <!-- Headset & Mic -->
      <rect x="306" y="180" width="12" height="26" rx="4" fill="#37474f" stroke="#ff9100" stroke-width="2"/>
      <path d="M 312 206 Q 308 230 286 234" fill="none" stroke="#ff9100" stroke-width="2.5"/>
      <circle cx="284" cy="234" r="4" fill="#e65100"/>
    `
  },
  {
    id: 'kostya',
    name: 'KOSTYA',
    title: 'ТЕХНАРЬ • CYBER TECH',
    color: '#ffd600',
    colorDark: '#f57f17',
    colorLight: '#fff9c4',
    svg: `
      <!-- Kostya High-Tech Engineer -->
      <!-- Floating Cyber Hologram Nodes -->
      <polygon points="100,160 120,150 140,160 140,180 120,190 100,180" fill="none" stroke="#ffd600" stroke-width="2" opacity="0.8" filter="url(#neonGlow)"/>
      <polygon points="380,180 400,170 420,180 420,200 400,210 380,200" fill="none" stroke="#ffd600" stroke-width="2" opacity="0.8" filter="url(#neonGlow)"/>
      
      <!-- Tech Circuit Traces in Air -->
      <path d="M 70 240 L 110 240 L 130 210 L 160 210" fill="none" stroke="#ffd600" stroke-width="2" opacity="0.5"/>
      <path d="M 440 250 L 400 250 L 380 220 L 350 220" fill="none" stroke="#ffd600" stroke-width="2" opacity="0.5"/>

      <!-- Tech Suit Body -->
      <path d="M 120 400 L 150 280 L 210 268 L 256 295 L 302 268 L 362 280 L 392 400 Z" fill="#263238" stroke="#f57f17" stroke-width="3"/>
      <!-- Glowing Yellow Power Conduits -->
      <path d="M 190 275 L 215 375" stroke="#ffd600" stroke-width="5" filter="url(#neonGlow)"/>
      <path d="M 322 275 L 297 375" stroke="#ffd600" stroke-width="5" filter="url(#neonGlow)"/>
      <rect x="236" y="300" width="40" height="40" rx="8" fill="#1a1a24" stroke="#ffd600" stroke-width="2.5"/>
      <circle cx="256" cy="320" r="10" fill="#ffd600" filter="url(#neonGlow)"/>
      <circle cx="256" cy="320" r="4" fill="#ffffff"/>

      <!-- Collar & Tech Choker -->
      <rect x="216" y="240" width="80" height="30" rx="4" fill="#1c252a" stroke="#ffd600" stroke-width="2"/>

      <!-- Face -->
      <ellipse cx="256" cy="190" rx="52" ry="56" fill="#fce4ec"/>

      <!-- Cybernetic Hair -->
      <path d="M 196 160 C 196 95 316 95 316 160 L 320 180 C 310 135 295 120 256 120 C 217 120 200 135 192 180 Z" fill="#263238"/>
      <!-- Glowing hair streaks -->
      <path d="M 230 118 Q 245 138 240 160" stroke="#ffd600" stroke-width="3" fill="none"/>
      <path d="M 270 120 Q 280 140 274 160" stroke="#ffd600" stroke-width="2" fill="none"/>

      <!-- Dual Cyber Visor (VR Glasses) -->
      <rect x="190" y="165" width="132" height="34" rx="8" fill="#1a1a24" stroke="#f57f17" stroke-width="3"/>
      <!-- Glowing Dual Visor Panels -->
      <rect x="198" y="171" width="52" height="22" rx="4" fill="#ffd600" filter="url(#neonGlow)"/>
      <rect x="262" y="171" width="52" height="22" rx="4" fill="#ffd600" filter="url(#neonGlow)"/>
      <!-- Visor Data HUD scanlines -->
      <line x1="202" y1="182" x2="246" y2="182" stroke="#fff" stroke-width="2"/>
      <line x1="266" y1="182" x2="310" y2="182" stroke="#fff" stroke-width="2"/>

      <!-- Smart Confident Mouth -->
      <path d="M 242 224 Q 256 230 270 224" fill="none" stroke="#455a64" stroke-width="3" stroke-linecap="round"/>
    `
  },
  {
    id: 'grisha',
    name: 'GRISHA',
    title: 'ТОКСИКОЛОГ • BIO-ACID',
    color: '#1de9b6',
    colorDark: '#00875a',
    colorLight: '#a7ffeb',
    svg: `
      <!-- Grisha Toxicologist Mad Scientist -->
      <!-- Toxic Acid Bubbles / Droplets -->
      <circle cx="100" cy="200" r="8" fill="#1de9b6" opacity="0.7" filter="url(#neonGlow)"/>
      <circle cx="120" cy="160" r="5" fill="#a7ffeb" opacity="0.6"/>
      <circle cx="395" cy="180" r="10" fill="#1de9b6" opacity="0.7" filter="url(#neonGlow)"/>
      <circle cx="415" cy="220" r="6" fill="#a7ffeb" opacity="0.5"/>

      <!-- Biohazard Hazard Vest & Lab Coat -->
      <path d="M 120 400 L 150 280 L 210 268 L 256 295 L 302 268 L 362 280 L 392 400 Z" fill="#1b2e24" stroke="#00875a" stroke-width="3"/>
      <!-- Lab Apron / Chemical Vest -->
      <path d="M 175 275 L 210 270 L 225 380 L 160 380 Z" fill="#004d40" stroke="#1de9b6" stroke-width="2"/>
      <path d="M 337 275 L 302 270 L 287 380 L 352 380 Z" fill="#004d40" stroke="#1de9b6" stroke-width="2"/>

      <!-- Chemical Flasks on Bandolier -->
      <rect x="200" y="325" width="16" height="32" rx="4" fill="#1de9b6" stroke="#fff" stroke-width="1.5" filter="url(#neonGlow)"/>
      <rect x="296" y="325" width="16" height="32" rx="4" fill="#1de9b6" stroke="#fff" stroke-width="1.5" filter="url(#neonGlow)"/>

      <!-- Toxic Vapor Mist -->
      <ellipse cx="256" cy="260" rx="90" ry="25" fill="#1de9b6" opacity="0.25" filter="url(#neonGlow)"/>

      <!-- Head / Hood Base -->
      <path d="M 180 180 C 180 100 332 100 332 180 L 332 250 C 332 270 300 285 256 285 C 212 285 180 270 180 250 Z" fill="#16251c" stroke="#00875a" stroke-width="3"/>
      <ellipse cx="256" cy="180" rx="55" ry="58" fill="#d7a98c"/>

      <!-- Biohazard Respirator / Twin-Filter Gas Mask -->
      <!-- Mask Base -->
      <path d="M 210 180 L 256 160 L 302 180 L 310 240 L 256 265 L 202 240 Z" fill="#263238" stroke="#004d40" stroke-width="3"/>

      <!-- Glowing Acid Eyes / Respirator Goggles -->
      <circle cx="228" cy="165" r="22" fill="#1a2e22" stroke="#00875a" stroke-width="3"/>
      <circle cx="228" cy="165" r="16" fill="#1de9b6" filter="url(#neonGlow)"/>
      <circle cx="224" cy="161" r="5" fill="#ffffff"/>

      <circle cx="284" cy="165" r="22" fill="#1a2e22" stroke="#00875a" stroke-width="3"/>
      <circle cx="284" cy="165" r="16" fill="#1de9b6" filter="url(#neonGlow)"/>
      <circle cx="280" cy="161" r="5" fill="#ffffff"/>

      <!-- Twin Canister Filters -->
      <rect x="180" y="215" width="34" height="40" rx="8" fill="#37474f" stroke="#1de9b6" stroke-width="2"/>
      <line x1="184" y1="228" x2="210" y2="228" stroke="#1de9b6" stroke-width="2"/>
      <line x1="184" y1="238" x2="210" y2="238" stroke="#1de9b6" stroke-width="2"/>

      <rect x="298" y="215" width="34" height="40" rx="8" fill="#37474f" stroke="#1de9b6" stroke-width="2"/>
      <line x1="302" y1="228" x2="328" y2="228" stroke="#1de9b6" stroke-width="2"/>
      <line x1="302" y1="238" x2="328" y2="238" stroke="#1de9b6" stroke-width="2"/>

      <!-- Center Exhaust Valve / Drip -->
      <circle cx="256" cy="226" r="14" fill="#212121" stroke="#1de9b6" stroke-width="2.5"/>
      <path d="M 254 240 Q 256 256 256 268" stroke="#1de9b6" stroke-width="3" fill="none" filter="url(#neonGlow)"/>
      <circle cx="256" cy="270" r="3.5" fill="#a7ffeb"/>
    `
  },
  {
    id: 'ilya',
    name: 'ILYA',
    title: 'ЛЕДЯНОЙ РЫЦАРЬ • FROST KNIGHT',
    color: '#448aff',
    colorDark: '#0d47a1',
    colorLight: '#b3e5fc',
    svg: `
      <!-- Ilya Frost Knight -->
      <!-- Snow / Ice Crystals Background Aura -->
      <polygon points="100,180 110,165 100,150 90,165" fill="#b3e5fc" filter="url(#neonGlow)"/>
      <polygon points="400,160 415,145 400,130 385,145" fill="#b3e5fc" filter="url(#neonGlow)"/>
      <path d="M 80 280 L 130 260 L 100 310 Z" fill="none" stroke="#448aff" stroke-width="2" opacity="0.6"/>
      <path d="M 432 280 L 382 260 L 412 310 Z" fill="none" stroke="#448aff" stroke-width="2" opacity="0.6"/>

      <!-- Heavy Ice Plate Armor -->
      <path d="M 110 400 L 140 280 L 210 265 L 256 295 L 302 265 L 372 280 L 402 400 Z" fill="#1c2c44" stroke="#0d47a1" stroke-width="3"/>
      <!-- Glacial Shoulder Pauldrons -->
      <path d="M 120 280 L 175 255 L 195 320 L 135 330 Z" fill="#2c4c70" stroke="#b3e5fc" stroke-width="2.5"/>
      <path d="M 392 280 L 337 255 L 317 320 L 377 330 Z" fill="#2c4c70" stroke="#b3e5fc" stroke-width="2.5"/>
      <!-- Ice Spikes on Shoulders -->
      <polygon points="150,260 140,215 165,255" fill="#b3e5fc" stroke="#448aff" stroke-width="2" filter="url(#neonGlow)"/>
      <polygon points="362,260 372,215 347,255" fill="#b3e5fc" stroke="#448aff" stroke-width="2" filter="url(#neonGlow)"/>

      <!-- Chestplate Frost Emblem -->
      <polygon points="256,315 285,350 256,385 227,350" fill="#0d47a1" stroke="#b3e5fc" stroke-width="3"/>
      <polygon points="256,325 275,350 256,375 237,350" fill="#448aff" filter="url(#neonGlow)"/>

      <!-- Head Base -->
      <ellipse cx="256" cy="190" rx="50" ry="56" fill="#f0d5c0"/>

      <!-- Ice Crown / Spiked Silver-Frost Hair -->
      <path d="M 190 170 L 205 110 L 225 150 L 256 95 L 287 150 L 307 110 L 322 170 Z" fill="#e1f5fe" stroke="#448aff" stroke-width="3" filter="url(#neonGlow)"/>
      <!-- Crown Circlet -->
      <path d="M 195 160 Q 256 180 317 160 L 317 172 Q 256 192 195 172 Z" fill="#0d47a1" stroke="#b3e5fc" stroke-width="2"/>
      <polygon points="256,160 264,174 256,184 248,174" fill="#b3e5fc"/>

      <!-- Cold Piercing Blue Glowing Eyes -->
      <ellipse cx="230" cy="188" rx="10" ry="6" fill="#448aff" filter="url(#neonGlow)"/>
      <ellipse cx="282" cy="188" rx="10" ry="6" fill="#448aff" filter="url(#neonGlow)"/>
      <circle cx="230" cy="188" r="3" fill="#ffffff"/>
      <circle cx="282" cy="188" r="3" fill="#ffffff"/>

      <!-- Determined Knight Mouth -->
      <line x1="242" y1="225" x2="270" y2="225" stroke="#455a64" stroke-width="3.5" stroke-linecap="round"/>
    `
  },
  {
    id: 'david',
    name: 'DAVID',
    title: 'БОКСЁР • PUNCH MASTER',
    color: '#ff4081',
    colorDark: '#a00037',
    colorLight: '#ff80ab',
    svg: `
      <!-- David Boxer Champion -->
      <!-- Knockout Impact Stars -->
      <polygon points="90,170 96,185 112,185 98,195 104,210 90,200 76,210 82,195 68,185 84,185" fill="#ffd600" filter="url(#neonGlow)"/>
      <polygon points="420,150 424,162 438,162 426,170 431,182 420,174 409,182 414,170 402,162 416,162" fill="#ff4081" filter="url(#neonGlow)"/>

      <!-- Athletic Boxer Torso & Tank Top -->
      <path d="M 120 400 L 150 280 L 210 270 L 256 295 L 302 270 L 362 280 L 392 400 Z" fill="#c68642"/>
      <!-- White/Pink Boxing Vest -->
      <path d="M 180 275 L 215 270 L 256 310 L 297 270 L 332 275 L 345 400 L 167 400 Z" fill="#fafafa" stroke="#a00037" stroke-width="3"/>
      <!-- Pink Trim on Vest -->
      <path d="M 215 270 L 256 310 L 297 270" fill="none" stroke="#ff4081" stroke-width="5"/>

      <!-- Raised Boxing Gloves (Guard Stance) -->
      <!-- Left Glove -->
      <circle cx="170" cy="270" r="38" fill="#ff4081" stroke="#a00037" stroke-width="4"/>
      <path d="M 145 255 Q 170 240 195 255" fill="none" stroke="#ffffff" stroke-width="4" opacity="0.6"/>
      <rect x="150" y="295" width="40" height="18" rx="4" fill="#fafafa" stroke="#a00037" stroke-width="2"/>
      <!-- Right Glove -->
      <circle cx="342" cy="270" r="38" fill="#ff4081" stroke="#a00037" stroke-width="4"/>
      <path d="M 317 255 Q 342 240 367 255" fill="none" stroke="#ffffff" stroke-width="4" opacity="0.6"/>
      <rect x="322" y="295" width="40" height="18" rx="4" fill="#fafafa" stroke="#a00037" stroke-width="2"/>

      <!-- Strong Jaw & Face -->
      <ellipse cx="256" cy="185" rx="52" ry="58" fill="#c68642"/>

      <!-- Pink Fighter Bandana / Headband -->
      <rect x="195" y="142" width="122" height="22" rx="4" fill="#ff4081" stroke="#a00037" stroke-width="2"/>
      <!-- Bandana Tails Fluttering -->
      <path d="M 195 152 Q 165 140 145 155 Q 160 168 195 160 Z" fill="#ff4081" stroke="#a00037" stroke-width="2"/>

      <!-- Short Athletic Hair -->
      <path d="M 200 145 C 200 110 312 110 312 145 Z" fill="#212121"/>

      <!-- Fierce Confident Eyes -->
      <ellipse cx="232" cy="180" rx="9" ry="6" fill="#ffffff"/>
      <ellipse cx="280" cy="180" rx="9" ry="6" fill="#ffffff"/>
      <circle cx="233" cy="180" r="4" fill="#212121"/>
      <circle cx="279" cy="180" r="4" fill="#212121"/>
      <!-- Angry Brows -->
      <path d="M 220 170 L 244 175" stroke="#212121" stroke-width="4" stroke-linecap="round"/>
      <path d="M 292 170 L 268 175" stroke="#212121" stroke-width="4" stroke-linecap="round"/>

      <!-- Gritted Teeth / Fierce Boxer Grin with Mouthguard -->
      <path d="M 235 215 Q 256 226 277 215 L 274 228 Q 256 236 238 228 Z" fill="#ffffff" stroke="#212121" stroke-width="2"/>
      <line x1="245" y1="218" x2="245" y2="228" stroke="#ff4081" stroke-width="1.5"/>
      <line x1="256" y1="219" x2="256" y2="231" stroke="#ff4081" stroke-width="1.5"/>
      <line x1="267" y1="218" x2="267" y2="228" stroke="#ff4081" stroke-width="1.5"/>
    `
  },
  {
    id: 'matvey',
    name: 'MATVEY',
    title: 'СТРАТЕГ • CHESS MASTER',
    color: '#a1887f',
    colorDark: '#5d4037',
    colorLight: '#d7ccc8',
    svg: `
      <!-- Matvey Chess Master Tactician -->
      <!-- Holographic Chess Knight (♞) Aura -->
      <g transform="translate(100, 160)" fill="${'#d7ccc8'}" filter="url(#neonGlow)">
        <text font-family="'Segoe UI Symbol', sans-serif" font-size="64" opacity="0.85">♞</text>
      </g>
      <!-- Chessboard Grid Lines Aura -->
      <g stroke="#d7ccc8" stroke-width="1.5" opacity="0.3">
        <line x1="370" y1="140" x2="430" y2="140"/>
        <line x1="370" y1="165" x2="430" y2="165"/>
        <line x1="370" y1="190" x2="430" y2="190"/>
        <line x1="390" y1="120" x2="390" y2="210"/>
        <line x1="410" y1="120" x2="410" y2="210"/>
      </g>

      <!-- Trenchcoat / Vest Suit Body -->
      <path d="M 120 400 L 150 280 L 210 268 L 256 295 L 302 268 L 362 280 L 392 400 Z" fill="#2b2b33"/>
      <!-- Brown Tweed Vest -->
      <path d="M 175 275 L 220 270 L 256 380 L 165 380 Z" fill="#5d4037" stroke="#a1887f" stroke-width="2"/>
      <path d="M 337 275 L 292 270 L 256 380 L 347 380 Z" fill="#5d4037" stroke="#a1887f" stroke-width="2"/>
      <!-- Crisp White Shirt & Tie -->
      <polygon points="256,270 270,300 256,380 242,300" fill="#ffffff"/>
      <polygon points="256,285 264,300 256,350 248,300" fill="#a1887f"/>

      <!-- Face -->
      <ellipse cx="256" cy="185" rx="50" ry="56" fill="#f3d5b5"/>

      <!-- Stylish Parted Hair -->
      <path d="M 198 160 C 198 100 270 95 314 125 C 314 165 295 130 256 125 C 220 120 200 145 198 160 Z" fill="#4e342e"/>

      <!-- Intellectual Glasses with Golden Glow Glint -->
      <rect x="208" y="170" width="38" height="24" rx="4" fill="none" stroke="#d7ccc8" stroke-width="3"/>
      <rect x="266" y="170" width="38" height="24" rx="4" fill="none" stroke="#d7ccc8" stroke-width="3"/>
      <line x1="246" y1="180" x2="266" y2="180" stroke="#d7ccc8" stroke-width="3"/>
      <!-- Glass Lens Reflection -->
      <line x1="214" y1="174" x2="238" y2="190" stroke="#ffffff" stroke-width="2" opacity="0.8"/>
      <line x1="272" y1="174" x2="296" y2="190" stroke="#ffffff" stroke-width="2" opacity="0.8"/>

      <!-- Calculating Eyes Behind Glasses -->
      <circle cx="227" cy="182" r="4.5" fill="#3e2723"/>
      <circle cx="285" cy="182" r="4.5" fill="#3e2723"/>

      <!-- Smug Strategic Smile -->
      <path d="M 242 222 Q 256 230 274 220" fill="none" stroke="#3e2723" stroke-width="3" stroke-linecap="round"/>
    `
  },
  {
    id: 'nikita',
    name: 'NIKITA',
    title: 'РОКЕР • GUITAR HERO',
    color: '#b0bec5',
    colorDark: '#546e7a',
    colorLight: '#eceff1',
    svg: `
      <!-- Nikita Heavy Metal Rocker -->
      <!-- Electric Guitar Headstock on Back -->
      <g transform="translate(100, 150) rotate(-25)">
        <rect x="0" y="0" width="22" height="110" rx="4" fill="#b71c1c" stroke="#fff" stroke-width="2"/>
        <polygon points="-8,0 30,0 22,-20 -2,-20" fill="#7f0000"/>
        <circle cx="5" cy="-10" r="3" fill="#ffd600"/>
        <circle cx="17" cy="-10" r="3" fill="#ffd600"/>
      </g>
      <!-- Sonic Waves & Musical Notes -->
      <path d="M 370 170 Q 400 150 430 170 Q 400 190 370 170" fill="none" stroke="#eceff1" stroke-width="2.5" filter="url(#neonGlow)"/>
      <text x="390" y="210" font-size="28" fill="#eceff1" filter="url(#neonGlow)">♪</text>
      <text x="420" y="190" font-size="34" fill="#b0bec5" filter="url(#neonGlow)">♫</text>

      <!-- Studded Leather Biker Jacket -->
      <path d="M 120 400 L 150 280 L 210 268 L 256 295 L 302 268 L 362 280 L 392 400 Z" fill="#1c1c24" stroke="#546e7a" stroke-width="3"/>
      <!-- Silver Studs on Lapels -->
      <circle cx="175" cy="300" r="3.5" fill="#eceff1"/>
      <circle cx="185" cy="325" r="3.5" fill="#eceff1"/>
      <circle cx="195" cy="350" r="3.5" fill="#eceff1"/>
      <circle cx="337" cy="300" r="3.5" fill="#eceff1"/>
      <circle cx="327" cy="325" r="3.5" fill="#eceff1"/>
      <circle cx="317" cy="350" r="3.5" fill="#eceff1"/>

      <!-- Rock Skull T-Shirt -->
      <circle cx="256" cy="340" r="14" fill="#eceff1"/>
      <ellipse cx="251" cy="338" rx="3.5" ry="5" fill="#1c1c24"/>
      <ellipse cx="261" cy="338" rx="3.5" ry="5" fill="#1c1c24"/>
      <rect x="250" y="348" width="12" height="6" fill="#1c1c24"/>

      <!-- Face & Studded Choker -->
      <ellipse cx="256" cy="185" rx="50" ry="56" fill="#e8b89d"/>
      <rect x="220" y="235" width="72" height="16" rx="3" fill="#111" stroke="#eceff1" stroke-width="1.5"/>
      <circle cx="236" cy="243" r="2.5" fill="#ffd600"/>
      <circle cx="256" cy="243" r="2.5" fill="#ffd600"/>
      <circle cx="276" cy="243" r="2.5" fill="#ffd600"/>

      <!-- Wild Spiky Rocker Hair -->
      <path d="M 180 160 L 160 110 L 205 130 L 220 80 L 256 120 L 285 75 L 305 125 L 345 105 L 325 165 Z" fill="#263238" stroke="#546e7a" stroke-width="2"/>

      <!-- Dark Eyeliner & Rebel Eyes -->
      <ellipse cx="230" cy="180" rx="9" ry="5.5" fill="#ffffff"/>
      <ellipse cx="282" cy="180" rx="9" ry="5.5" fill="#ffffff"/>
      <circle cx="230" cy="180" r="4" fill="#111"/>
      <circle cx="282" cy="180" r="4" fill="#111"/>
      <!-- Eyeliner wings -->
      <path d="M 218 180 L 240 180" stroke="#111" stroke-width="4"/>
      <path d="M 272 180 L 294 180" stroke="#111" stroke-width="4"/>

      <!-- Earring (Left Ear) -->
      <circle cx="198" cy="195" r="4.5" fill="none" stroke="#ffd600" stroke-width="2"/>

      <!-- Confident Rocker Smirk -->
      <path d="M 242 218 Q 256 226 272 218" fill="none" stroke="#212121" stroke-width="3" stroke-linecap="round"/>
    `
  },
  {
    id: 'varya',
    name: 'VARYA',
    title: 'ОХОТНИЦА • ARCHER',
    color: '#ef5350',
    colorDark: '#b71c1c',
    colorLight: '#ffcdd2',
    svg: `
      <!-- Varya Master Huntress Archer -->
      <!-- Energy Arrow Aura -->
      <g transform="translate(100, 160) rotate(35)">
        <line x1="0" y1="0" x2="80" y2="0" stroke="#ef5350" stroke-width="4" filter="url(#neonGlow)"/>
        <polygon points="80,-8 95,0 80,8" fill="#ffffff" filter="url(#neonGlow)"/>
      </g>
      <!-- Quiver Arrows on Back -->
      <g transform="translate(370, 150) rotate(20)">
        <rect x="0" y="0" width="18" height="90" rx="4" fill="#4e342e" stroke="#ef5350" stroke-width="2"/>
        <polygon points="3,-15 9,-5 15,-15" fill="#ef5350"/>
        <polygon points="-3,-10 3,0 9,-10" fill="#ffffff"/>
      </g>

      <!-- Crimson Leather Archer Armor -->
      <path d="M 120 400 L 150 280 L 210 268 L 256 295 L 302 268 L 362 280 L 392 400 Z" fill="#3e2723"/>
      <!-- Crimson Tunic & Leather Straps -->
      <path d="M 170 275 L 210 268 L 256 380 L 155 380 Z" fill="#b71c1c" stroke="#ef5350" stroke-width="2"/>
      <path d="M 342 275 L 302 268 L 256 380 L 357 380 Z" fill="#b71c1c" stroke="#ef5350" stroke-width="2"/>
      <rect x="238" y="310" width="36" height="40" rx="4" fill="#5d4037" stroke="#ffd600" stroke-width="2"/>

      <!-- Neck & Collar -->
      <rect x="224" y="240" width="64" height="26" rx="4" fill="#3e2723"/>

      <!-- Face -->
      <ellipse cx="256" cy="185" rx="48" ry="54" fill="#f0d5c0"/>

      <!-- Sleek Dark Ponytail & Archer Hood -->
      <path d="M 202 165 C 202 105 310 105 310 165 L 316 195 C 300 135 285 125 256 125 C 227 125 212 135 196 195 Z" fill="#4a2c2a"/>
      <!-- Ponytail flowing out left -->
      <path d="M 204 150 Q 150 170 140 230 Q 160 210 200 175 Z" fill="#4a2c2a"/>
      <!-- Crimson Archer Bandana / Headband -->
      <path d="M 202 152 Q 256 166 310 152 L 312 164 Q 256 178 200 164 Z" fill="#ef5350" stroke="#b71c1c" stroke-width="1.5"/>

      <!-- Keen Sharpshooter Eyes -->
      <ellipse cx="232" cy="180" rx="8" ry="5" fill="#ffffff"/>
      <ellipse cx="280" cy="180" rx="8" ry="5" fill="#ffffff"/>
      <circle cx="233" cy="180" r="4" fill="#b71c1c"/>
      <circle cx="279" cy="180" r="4" fill="#b71c1c"/>
      <circle cx="234" cy="179" r="1.5" fill="#ffffff"/>
      <circle cx="280" cy="179" r="1.5" fill="#ffffff"/>

      <!-- Determined Lips -->
      <path d="M 244 218 Q 256 224 268 218" fill="none" stroke="#8d6e63" stroke-width="3" stroke-linecap="round"/>
    `
  },
  {
    id: 'alisa',
    name: 'ALISA',
    title: 'ВСАДНИЦА • HORSE RIDER',
    color: '#f48fb1',
    colorDark: '#c2185b',
    colorLight: '#fce4ec',
    svg: `
      <!-- Alisa the Horsewoman, rearing warhorse striking with its front hooves -->
      <!-- Hoof-strike impact sparks flanking the raised legs -->
      <g stroke="#f48fb1" stroke-width="3.5" filter="url(#neonGlow)">
        <line x1="150" y1="72" x2="120" y2="46"/>
        <line x1="160" y1="92" x2="128" y2="68"/>
        <line x1="172" y1="110" x2="140" y2="90"/>
      </g>
      <g stroke="#f48fb1" stroke-width="3.5" filter="url(#neonGlow)">
        <line x1="362" y1="72" x2="392" y2="46"/>
        <line x1="352" y1="92" x2="384" y2="68"/>
        <line x1="340" y1="110" x2="372" y2="90"/>
      </g>

      <!-- Hind legs, planted on the ground -->
      <rect x="186" y="300" width="42" height="130" rx="10" fill="#241914" stroke="#150e0a" stroke-width="2"/>
      <rect x="284" y="300" width="42" height="130" rx="10" fill="#1a120e" stroke="#150e0a" stroke-width="2"/>
      <rect x="182" y="414" width="50" height="18" rx="5" fill="#161616"/>
      <rect x="280" y="414" width="50" height="18" rx="5" fill="#161616"/>

      <!-- Front legs raised, striking upward -->
      <path d="M 236 300 Q 190 250 176 170 Q 172 140 190 108 L 214 118 Q 202 148 208 174 Q 218 232 260 280 Z" fill="#2a1e1a" stroke="#150e0a" stroke-width="2"/>
      <ellipse cx="194" cy="100" rx="20" ry="14" transform="rotate(-30 194 100)" fill="#161616"/>
      <path d="M 276 300 Q 322 250 336 170 Q 340 140 322 108 L 298 118 Q 310 148 304 174 Q 294 232 252 280 Z" fill="#241914" stroke="#150e0a" stroke-width="2"/>
      <ellipse cx="318" cy="100" rx="20" ry="14" transform="rotate(30 318 100)" fill="#161616"/>

      <!-- Horse body, rearing upright -->
      <path d="M 200 320 Q 190 230 240 190 Q 256 178 272 190 Q 322 230 312 320 Z" fill="#3a2a26" stroke="#1c1310" stroke-width="3"/>

      <!-- Saddle -->
      <path d="M 224 232 L 288 232 L 282 264 L 230 264 Z" fill="#c2185b" stroke="#4a2545" stroke-width="2"/>
      <rect x="228" y="232" width="56" height="8" fill="#f48fb1"/>

      <!-- Horse neck & head -->
      <path d="M 264 196 Q 270 150 306 122 L 340 132 Q 316 162 300 202 Z" fill="#241914" stroke="#150e0a" stroke-width="2.5"/>
      <ellipse cx="330" cy="118" rx="30" ry="21" transform="rotate(-20 330 118)" fill="#241914"/>
      <ellipse cx="356" cy="112" rx="14" ry="10" transform="rotate(-15 356 112)" fill="#1a120e"/>
      <circle cx="362" cy="110" r="2.4" fill="#000"/>
      <!-- Ears -->
      <polygon points="316,102 310,78 330,90" fill="#241914"/>
      <polygon points="330,92 328,68 346,84" fill="#241914"/>
      <!-- Eye -->
      <ellipse cx="334" cy="112" rx="5.5" ry="4" transform="rotate(-15 334 112)" fill="#fff"/>
      <circle cx="336" cy="113" r="2.2" fill="#1a1a1a"/>
      <!-- Mane streaming back -->
      <path d="M 300 118 Q 262 128 240 158 Q 274 140 302 132 Z" fill="#f48fb1"/>
      <path d="M 292 148 Q 258 164 244 194 Q 272 172 296 160 Z" fill="#fce4ec"/>

      <!-- Alisa's legs gripping the horse -->
      <path d="M 228 240 L 214 276 L 236 282 L 248 244 Z" fill="#c2185b"/>
      <path d="M 284 240 L 298 276 L 276 282 L 264 244 Z" fill="#c2185b"/>

      <!-- Alisa's torso -->
      <path d="M 230 246 L 256 168 L 282 246 L 270 222 L 242 222 Z" fill="#4a2545" stroke="#c2185b" stroke-width="3"/>
      <path d="M 242 216 L 256 182 L 270 216 L 264 240 L 248 240 Z" fill="#c2185b"/>

      <!-- Arms gripping the reins forward -->
      <path d="M 246 196 L 224 168 L 236 158 L 256 184 Z" fill="#ffe0bd"/>
      <path d="M 266 196 L 288 168 L 276 158 L 258 184 Z" fill="#ffe0bd"/>
      <line x1="230" y1="162" x2="296" y2="128" stroke="#4a2545" stroke-width="2.5"/>
      <line x1="236" y1="166" x2="302" y2="132" stroke="#4a2545" stroke-width="2.5"/>

      <!-- Face -->
      <ellipse cx="256" cy="140" rx="28" ry="32" fill="#ffe0bd"/>
      <path d="M 228 130 C 228 98 284 98 284 130 L 288 148 C 274 116 266 108 256 108 C 246 108 238 116 224 148 Z" fill="#c2185b"/>
      <!-- Hair streaming back -->
      <path d="M 226 120 Q 182 130 164 166 Q 200 142 230 134 Z" fill="#c2185b"/>
      <path d="M 228 134 Q 192 150 180 182 Q 208 160 232 148 Z" fill="#fce4ec"/>

      <!-- Determined eyes -->
      <ellipse cx="244" cy="136" rx="6.5" ry="5.5" fill="#ffffff"/>
      <ellipse cx="268" cy="136" rx="6.5" ry="5.5" fill="#ffffff"/>
      <circle cx="245" cy="136" r="3.2" fill="#c2185b"/>
      <circle cx="269" cy="136" r="3.2" fill="#c2185b"/>
      <circle cx="246" cy="135" r="1.1" fill="#ffffff"/>
      <circle cx="270" cy="135" r="1.1" fill="#ffffff"/>

      <!-- Focused mouth -->
      <path d="M 246 156 Q 256 161 266 156" fill="none" stroke="#4a2545" stroke-width="2" stroke-linecap="round"/>
    `
  },
  {
    id: 'sofya',
    name: 'SOFYA',
    title: 'МЕДИК • COMBAT MEDIC',
    color: '#eceff1',
    colorDark: '#90a4ae',
    colorLight: '#ffffff',
    svg: `
      <!-- Sofya Field Combat Medic -->
      <!-- Green Healing Plus Crosses Aura -->
      <g fill="#69f0ae" filter="url(#neonGlow)">
        <path d="M 90 170 H 110 V 180 H 90 Z M 95 165 H 105 V 185 H 95 Z" transform="scale(1.3) translate(-10,-10)"/>
        <path d="M 400 170 H 420 V 180 H 400 Z M 405 165 H 415 V 185 H 405 Z" transform="scale(1.2) translate(-60,-10)"/>
      </g>
      <!-- Vital Sign Pulse Line -->
      <path d="M 70 240 L 110 240 L 120 220 L 130 260 L 140 240 L 170 240" fill="none" stroke="#69f0ae" stroke-width="2.5" opacity="0.6"/>

      <!-- Medical Lab Coat & Uniform -->
      <path d="M 120 400 L 150 280 L 210 268 L 256 295 L 302 268 L 362 280 L 392 400 Z" fill="#ffffff" stroke="#90a4ae" stroke-width="3"/>
      <!-- Red Cross Badge on Uniform -->
      <rect x="246" y="325" width="20" height="6" rx="1.5" fill="#e53935"/>
      <rect x="253" y="318" width="6" height="20" rx="1.5" fill="#e53935"/>

      <!-- Stethoscope around Neck -->
      <path d="M 220 245 Q 210 320 256 340 Q 302 320 292 245" fill="none" stroke="#37474f" stroke-width="3.5"/>
      <circle cx="256" cy="342" r="7" fill="#b0bec5" stroke="#37474f" stroke-width="2"/>

      <!-- Face -->
      <ellipse cx="256" cy="185" rx="48" ry="54" fill="#f3d5b5"/>

      <!-- Medic Cap with Red Cross -->
      <path d="M 200 145 C 200 100 312 100 312 145 Z" fill="#ffffff" stroke="#90a4ae" stroke-width="2"/>
      <rect x="248" y="120" width="16" height="5" rx="1" fill="#e53935"/>
      <rect x="253.5" y="114.5" width="5" height="16" rx="1" fill="#e53935"/>

      <!-- Neat Brown Hair Bun -->
      <path d="M 202 165 C 202 125 310 125 310 165 L 314 195 C 290 135 280 130 256 130 C 232 130 222 135 198 195 Z" fill="#6d4c41"/>

      <!-- Gentle Caring Eyes -->
      <ellipse cx="232" cy="180" rx="8" ry="6" fill="#ffffff"/>
      <ellipse cx="280" cy="180" rx="8" ry="6" fill="#ffffff"/>
      <circle cx="233" cy="180" r="4" fill="#4e342e"/>
      <circle cx="279" cy="180" r="4" fill="#4e342e"/>
      <circle cx="234" cy="178" r="1.5" fill="#ffffff"/>
      <circle cx="280" cy="178" r="1.5" fill="#ffffff"/>

      <!-- Calm Determined Smile -->
      <path d="M 244 218 Q 256 225 268 218" fill="none" stroke="#6d4c41" stroke-width="2.5" stroke-linecap="round"/>
    `
  },
  {
    id: 'sergey',
    name: 'SERGEY',
    title: 'КОМАНДОС • ELITE SOLDIER',
    color: '#7cb342',
    colorDark: '#33691e',
    colorLight: '#dcedc8',
    svg: `
      <!-- Sergey Commando Soldier -->
      <!-- Grenade Pin / Smoke Sparks Aura -->
      <circle cx="95" cy="175" r="12" fill="none" stroke="#7cb342" stroke-width="3" filter="url(#neonGlow)"/>
      <line x1="95" y1="163" x2="95" y2="155" stroke="#7cb342" stroke-width="3"/>
      <circle cx="410" cy="160" r="6" fill="#ff7043" filter="url(#neonGlow)"/>
      <circle cx="430" cy="185" r="4" fill="#ffab91"/>

      <!-- Camouflage Tactical Combat Vest -->
      <path d="M 120 400 L 150 280 L 210 268 L 256 295 L 302 268 L 362 280 L 392 400 Z" fill="#33691e" stroke="#1b3810" stroke-width="3"/>
      <!-- Ammo Pouches on Chest -->
      <rect x="175" y="315" width="28" height="38" rx="4" fill="#558b2f" stroke="#1b3810" stroke-width="2"/>
      <rect x="215" y="315" width="28" height="38" rx="4" fill="#558b2f" stroke="#1b3810" stroke-width="2"/>
      <rect x="269" y="315" width="28" height="38" rx="4" fill="#558b2f" stroke="#1b3810" stroke-width="2"/>
      <rect x="309" y="315" width="28" height="38" rx="4" fill="#558b2f" stroke="#1b3810" stroke-width="2"/>

      <!-- Dog Tags -->
      <path d="M 235 250 L 250 280 L 256 275 L 245 250" stroke="#cfd8dc" stroke-width="2" fill="none"/>
      <rect x="246" y="278" width="12" height="18" rx="3" fill="#cfd8dc" stroke="#90a4ae" stroke-width="1.5"/>

      <!-- Face with Battle Scar -->
      <ellipse cx="256" cy="185" rx="52" ry="58" fill="#d7a98c"/>
      <!-- Scar across Right Cheek -->
      <line x1="275" y1="170" x2="285" y2="210" stroke="#8d6e63" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="272" y1="185" x2="282" y2="183" stroke="#8d6e63" stroke-width="1.5"/>
      <line x1="276" y1="198" x2="286" y2="196" stroke="#8d6e63" stroke-width="1.5"/>

      <!-- Olive Military Beret / Bandana -->
      <path d="M 195 150 C 195 95 315 95 325 145 L 320 162 L 195 150 Z" fill="#33691e" stroke="#1b3810" stroke-width="2.5"/>
      <rect x="290" y="130" width="14" height="14" rx="2" fill="#cfd8dc"/>

      <!-- Hardened Grit Eyes -->
      <ellipse cx="230" cy="180" rx="8" ry="5" fill="#ffffff"/>
      <ellipse cx="282" cy="180" rx="8" ry="5" fill="#ffffff"/>
      <circle cx="230" cy="180" r="3.5" fill="#212121"/>
      <circle cx="282" cy="180" r="3.5" fill="#212121"/>
      <!-- Tough Brow Lines -->
      <line x1="220" y1="172" x2="242" y2="175" stroke="#212121" stroke-width="3.5"/>
      <line x1="292" y1="172" x2="270" y2="175" stroke="#212121" stroke-width="3.5"/>

      <!-- Rugged Stubble & Gritted Mouth -->
      <ellipse cx="256" cy="225" rx="24" ry="12" fill="#212121" opacity="0.15"/>
      <line x1="240" y1="224" x2="272" y2="224" stroke="#212121" stroke-width="3.5" stroke-linecap="round"/>
    `
  },
  {
    id: 'darksergey',
    name: 'DARK SERGEY',
    title: 'ГИГА-БОСС БЕЗДНЫ',
    color: '#76ff03',
    colorDark: '#0a140a',
    colorLight: '#b39ddb',
    svg: `
      <!-- Dark Sergey Abyss Giga-Boss -->
      <!-- Writhing Eldritch Tentacles -->
      <path d="M 120 280 Q 50 200 40 120 Q 80 150 130 220" fill="#0f1a12" stroke="#76ff03" stroke-width="3" filter="url(#neonGlow)"/>
      <path d="M 392 280 Q 462 200 472 120 Q 432 150 382 220" fill="#0f1a12" stroke="#76ff03" stroke-width="3" filter="url(#neonGlow)"/>
      <path d="M 160 360 Q 60 330 30 390 Q 90 390 180 370" fill="#0f1a12" stroke="#9c27b0" stroke-width="2.5"/>
      <path d="M 352 360 Q 452 330 482 390 Q 422 390 332 370" fill="#0f1a12" stroke="#9c27b0" stroke-width="2.5"/>

      <!-- Void Purple Abyss Core Aura -->
      <circle cx="256" cy="340" r="50" fill="#9c27b0" opacity="0.4" filter="url(#neonGlow)"/>
      <circle cx="256" cy="340" r="28" fill="#76ff03" opacity="0.7" filter="url(#neonGlow)"/>

      <!-- Massive Demonic Torso -->
      <path d="M 100 400 L 130 250 L 210 240 L 256 270 L 302 240 L 382 250 L 412 400 Z" fill="#0a120c" stroke="#76ff03" stroke-width="4"/>
      <!-- Rib-like Void Carvings -->
      <path d="M 180 290 Q 256 310 332 290" fill="none" stroke="#76ff03" stroke-width="3" opacity="0.8"/>
      <path d="M 190 325 Q 256 345 322 325" fill="none" stroke="#76ff03" stroke-width="3" opacity="0.8"/>
      <path d="M 200 360 Q 256 380 312 360" fill="none" stroke="#76ff03" stroke-width="3" opacity="0.8"/>

      <!-- Monstrous Head -->
      <ellipse cx="256" cy="175" rx="72" ry="64" fill="#0d150e" stroke="#1f3324" stroke-width="4"/>
      <!-- Dark Horns / Crest -->
      <path d="M 190 140 Q 150 70 200 90 Q 220 120 215 140 Z" fill="#0a120c" stroke="#76ff03" stroke-width="2"/>
      <path d="M 322 140 Q 362 70 312 90 Q 292 120 297 140 Z" fill="#0a120c" stroke="#76ff03" stroke-width="2"/>

      <!-- THREE GLOWING BLOOD-RED EYES -->
      <!-- Left Eye -->
      <circle cx="218" cy="155" r="11" fill="#ff1744" filter="url(#neonGlow)"/>
      <circle cx="218" cy="155" r="4" fill="#ffffff"/>
      <!-- Right Eye -->
      <circle cx="294" cy="155" r="11" fill="#ff1744" filter="url(#neonGlow)"/>
      <circle cx="294" cy="155" r="4" fill="#ffffff"/>
      <!-- Third Forehead Eye (Bigger) -->
      <circle cx="256" cy="135" r="14" fill="#ff1744" filter="url(#neonGlow)"/>
      <circle cx="256" cy="135" r="5" fill="#ffffff"/>

      <!-- Gaping Fanged Maw filled with Purple Abyss Void -->
      <ellipse cx="256" cy="205" rx="46" ry="24" fill="#030503" stroke="#76ff03" stroke-width="3"/>
      <ellipse cx="256" cy="205" rx="38" ry="16" fill="#4a148c" opacity="0.9"/>

      <!-- Razor Sharp Upper Fangs -->
      <polygon points="222,192 228,206 234,192" fill="#e8f5e9"/>
      <polygon points="234,190 240,208 246,190" fill="#e8f5e9"/>
      <polygon points="248,189 256,212 264,189" fill="#e8f5e9"/>
      <polygon points="266,190 272,208 278,190" fill="#e8f5e9"/>
      <polygon points="278,192 284,206 290,192" fill="#e8f5e9"/>

      <!-- Razor Sharp Lower Fangs -->
      <polygon points="228,218 234,204 240,218" fill="#e8f5e9"/>
      <polygon points="242,220 250,202 258,220" fill="#e8f5e9"/>
      <polygon points="260,220 268,202 276,220" fill="#e8f5e9"/>
      <polygon points="278,218 284,204 290,218" fill="#e8f5e9"/>
    `
  }
];

for (const c of characters) {
  const svgContent = frameWrapper(c.name, c.title, c.color, c.colorDark, c.colorLight, c.svg);
  const target = path.join(outDir, `${c.id}.svg`);
  fs.writeFileSync(target, svgContent, 'utf-8');
  console.log(`Generated ${target}`);
}

console.log('All character avatars successfully generated!');
