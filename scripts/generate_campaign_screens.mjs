import fs from 'fs';
import path from 'path';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
import { characters } from './generate_svgs.mjs';

const outDir = path.resolve('docs/screenshots');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const charMap = new Map(characters.map(c => [c.id, c]));

// Extra boss SVGs for intermediate school bosses
const schoolBosses = {
  teacher: {
    id: 'teacher',
    name: 'МАРЬ ИВАННА',
    subtitle: 'ZOOM-ИНКВИЗИТОР • КЛАССНЫЙ РУКОВОДИТЕЛЬ',
    color: '#ff1744',
    colorDark: '#880e4f',
    colorLight: '#ff80ab',
    svg: `
      <!-- Hair Bun with Red Pen stuck inside -->
      <circle cx="256" cy="115" r="42" fill="#5d4037"/>
      <line x1="210" y1="95" x2="300" y2="135" stroke="#ff1744" stroke-width="6" stroke-linecap="round"/>
      <polygon points="302,136 312,141 306,131" fill="#d50000"/>
      <!-- Head -->
      <circle cx="256" cy="180" r="54" fill="#ffd5b5"/>
      <path d="M 205 160 Q 256 120 307 160 Q 256 145 205 160 Z" fill="#4e342e"/>
      <!-- Horn-rimmed Cat-eye Glasses -->
      <rect x="220" y="165" width="30" height="20" rx="4" fill="none" stroke="#d50000" stroke-width="4"/>
      <rect x="262" y="165" width="30" height="20" rx="4" fill="none" stroke="#d50000" stroke-width="4"/>
      <line x1="250" y1="174" x2="262" y2="174" stroke="#d50000" stroke-width="4"/>
      <line x1="216" y1="168" x2="220" y2="168" stroke="#d50000" stroke-width="3"/>
      <line x1="292" y1="168" x2="296" y2="168" stroke="#d50000" stroke-width="3"/>
      <!-- Strict Eyes and Eyebrows -->
      <line x1="220" y1="158" x2="250" y2="166" stroke="#212121" stroke-width="3"/>
      <line x1="292" y1="158" x2="262" y2="166" stroke="#212121" stroke-width="3"/>
      <circle cx="235" cy="175" r="4" fill="#ff1744"/>
      <circle cx="277" cy="175" r="4" fill="#ff1744"/>
      <!-- Strict Mouth -->
      <line x1="240" y1="208" x2="272" y2="208" stroke="#b71c1c" stroke-width="4" stroke-linecap="round"/>
      <!-- Strict Teacher Blazer and Blouse -->
      <path d="M 210 230 L 256 265 L 302 230 L 335 340 L 177 340 Z" fill="#880e4f"/>
      <polygon points="256,232 238,280 274,280" fill="#ffffff"/>
      <!-- Pointer in Hand -->
      <line x1="170" y1="260" x2="110" y2="120" stroke="#ffd600" stroke-width="5" stroke-linecap="round"/>
      <circle cx="108" cy="116" r="6" fill="#ff1744"/>
    `
  },
  guard: {
    id: 'guard',
    name: 'ПЕТРОВИЧ',
    subtitle: 'СТРАЖ ТУРНИКЕТА • ВАХТА №1',
    color: '#3d5afe',
    colorDark: '#0d47a1',
    colorLight: '#82b1ff',
    svg: `
      <!-- Security Cap -->
      <path d="M 210 135 L 302 135 L 315 155 L 197 155 Z" fill="#0d47a1"/>
      <path d="M 188 153 Q 256 142 324 153 L 332 165 Q 256 150 180 165 Z" fill="#1565c0"/>
      <!-- Head & Mustache -->
      <circle cx="256" cy="188" r="54" fill="#e0a899"/>
      <!-- Bushy Eyebrows -->
      <rect x="220" y="168" width="28" height="7" rx="3" fill="#616161"/>
      <rect x="264" y="168" width="28" height="7" rx="3" fill="#616161"/>
      <!-- Suspicious Eyes looking down at shoes -->
      <circle cx="234" cy="182" r="4" fill="#212121"/>
      <circle cx="278" cy="182" r="4" fill="#212121"/>
      <!-- Epic Mustache -->
      <path d="M 225 208 Q 256 215 287 208 Q 295 224 256 226 Q 217 224 225 208 Z" fill="#424242"/>
      <!-- Security Uniform Shirt -->
      <path d="M 195 238 L 317 238 L 340 340 L 172 340 Z" fill="#1a237e"/>
      <!-- Badge "ОХРАНА" -->
      <rect x="226" y="258" width="60" height="24" rx="4" fill="#ffd600" stroke="#ffab00" stroke-width="2"/>
      <text x="256" y="274" font-family="'Russo One', sans-serif" font-size="9" font-weight="900" fill="#000000" text-anchor="middle">ОХРАНА</text>
      <!-- Handheld Metal Detector wand -->
      <rect x="310" y="210" width="18" height="90" rx="9" fill="#212121" stroke="#3d5afe" stroke-width="3"/>
      <circle cx="319" cy="225" r="5" fill="#76ff03"/>
    `
  },
  headteacher: {
    id: 'headteacher',
    name: 'ТАМАРА ИВАНОВНА',
    subtitle: 'ГРОЗА ПЕДСОВЕТА • ЗАВУЧ ПО УВР',
    color: '#ab47bc',
    colorDark: '#4a148c',
    colorLight: '#ea80fc',
    svg: `
      <!-- Towering Voluminous Hairstyle -->
      <ellipse cx="256" cy="130" rx="68" ry="46" fill="#7e57c2"/>
      <circle cx="215" cy="140" r="28" fill="#7e57c2"/>
      <circle cx="297" cy="140" r="28" fill="#7e57c2"/>
      <!-- Face -->
      <circle cx="256" cy="190" r="50" fill="#f8bbd0"/>
      <!-- Golden Chain Glasses -->
      <circle cx="236" cy="185" r="14" fill="none" stroke="#ffd700" stroke-width="3"/>
      <circle cx="276" cy="185" r="14" fill="none" stroke="#ffd700" stroke-width="3"/>
      <line x1="250" y1="185" x2="262" y2="185" stroke="#ffd700" stroke-width="3"/>
      <path d="M 222 185 Q 205 220 220 250" fill="none" stroke="#ffd700" stroke-width="1.5" stroke-dasharray="3,3"/>
      <path d="M 290 185 Q 307 220 292 250" fill="none" stroke="#ffd700" stroke-width="1.5" stroke-dasharray="3,3"/>
      <circle cx="236" cy="185" r="4" fill="#311b92"/>
      <circle cx="276" cy="185" r="4" fill="#311b92"/>
      <!-- Stern Expression -->
      <line x1="242" y1="214" x2="270" y2="214" stroke="#880e4f" stroke-width="3.5" stroke-linecap="round"/>
      <!-- Formal Suit Jacket with Giant Pearl Brooch -->
      <path d="M 195 238 L 317 238 L 340 340 L 172 340 Z" fill="#4a148c"/>
      <circle cx="256" cy="254" r="9" fill="#ffffff" stroke="#ffd700" stroke-width="2.5"/>
      <!-- Thick Red Folder labeled ВПР -->
      <rect x="290" y="235" width="55" height="75" rx="4" fill="#d50000" stroke="#ff8a80" stroke-width="2" transform="rotate(-10 290 235)"/>
      <text x="312" y="278" font-family="'Russo One', sans-serif" font-size="11" font-weight="900" fill="#ffffff" transform="rotate(-10 290 235)">ВПР</text>
    `
  },
  principal: {
    id: 'principal',
    name: 'ПАЛЫЧ',
    subtitle: 'ХОЗЯИН ГОСЗАКУПОК • ДИРЕКТОР ШКОЛЫ',
    color: '#ffd600',
    colorDark: '#ff6f00',
    colorLight: '#fff9c4',
    svg: `
      <!-- Bold Polished Head with Grey Temple Tufts -->
      <ellipse cx="256" cy="175" rx="56" ry="60" fill="#fed5b2"/>
      <path d="M 198 170 Q 192 195 204 215 Z" fill="#9e9e9e"/>
      <path d="M 314 170 Q 320 195 308 215 Z" fill="#9e9e9e"/>
      <!-- Glasses -->
      <rect x="222" y="165" width="28" height="18" rx="3" fill="none" stroke="#212121" stroke-width="3.5"/>
      <rect x="262" y="165" width="28" height="18" rx="3" fill="none" stroke="#212121" stroke-width="3.5"/>
      <line x1="250" y1="174" x2="262" y2="174" stroke="#212121" stroke-width="3.5"/>
      <!-- Heavy Jowls & Confident Smile -->
      <circle cx="236" cy="174" r="4" fill="#212121"/>
      <circle cx="276" cy="174" r="4" fill="#212121"/>
      <path d="M 238 210 Q 256 224 274 210" fill="none" stroke="#b71c1c" stroke-width="4" stroke-linecap="round"/>
      <!-- Posh Business Suit with Red Silk Tie & Golden Lapel Pin -->
      <path d="M 185 235 L 327 235 L 350 340 L 162 340 Z" fill="#263238"/>
      <polygon points="256,242 242,285 270,285" fill="#ffffff"/>
      <polygon points="256,260 250,335 256,345 262,335" fill="#d50000"/>
      <!-- Golden Scissors for Ribbon Cutting -->
      <circle cx="318" cy="250" r="8" fill="none" stroke="#ffd600" stroke-width="3"/>
      <circle cx="330" cy="260" r="8" fill="none" stroke="#ffd600" stroke-width="3"/>
      <line x1="318" y1="242" x2="295" y2="215" stroke="#ffd600" stroke-width="3.5"/>
      <line x1="326" y1="254" x2="305" y2="225" stroke="#ffd600" stroke-width="3.5"/>
      <!-- Golden Key to Gym -->
      <path d="M 170 240 L 195 240 L 195 248 L 188 248 L 188 254 L 182 254 L 182 260 L 170 260 Z" fill="#ffd600" stroke="#ffab00" stroke-width="1.5"/>
      <circle cx="166" cy="245" r="8" fill="none" stroke="#ffd600" stroke-width="3"/>
    `
  }
};

const commonDefs = `
  <defs>
    <filter id="neonGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="5" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="superGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="12" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#000000" flood-opacity="0.85"/>
    </filter>
    <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#000000" flood-opacity="0.85"/>
    </filter>
    <linearGradient id="metalGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#37474f"/>
      <stop offset="50%" stop-color="#212121"/>
      <stop offset="100%" stop-color="#101015"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fff59d"/>
      <stop offset="40%" stop-color="#ffd600"/>
      <stop offset="100%" stop-color="#ff6f00"/>
    </linearGradient>
    <linearGradient id="flameGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ff1744"/>
      <stop offset="50%" stop-color="#ff9100"/>
      <stop offset="100%" stop-color="#ffd600"/>
    </linearGradient>
    <linearGradient id="voidGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#76ff03"/>
      <stop offset="50%" stop-color="#00e5ff"/>
      <stop offset="100%" stop-color="#d500f9"/>
    </linearGradient>
  </defs>
`;

// Helper to render high-res SVG and save as PNG
async function renderSvgToPng(svgString, fileName) {
  const resvg = new Resvg(svgString, {
    fitTo: { mode: 'width', value: 1280 },
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
  const dest = path.join(outDir, fileName);
  fs.writeFileSync(dest, pngBuffer);
  console.log(`[GENERATED] ${dest} (${(pngBuffer.length / 1024).toFixed(1)} KB)`);
}

// -------------------------------------------------------------
// SCREEN 1: 01_zoom_intro.png (Пародийное Zoom-интро)
// -------------------------------------------------------------
async function generateScreen1() {
  const dima = charMap.get('dima');
  const lexa = charMap.get('lexa');
  const artem = charMap.get('artem');
  const ilya = charMap.get('ilya');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
    ${commonDefs}
    <!-- Zoom Background -->
    <rect width="1280" height="720" fill="#12151c"/>

    <!-- Top Zoom Bar -->
    <rect width="1280" height="42" fill="#1c202a"/>
    <circle cx="24" cy="21" r="6" fill="#ff5f56"/>
    <circle cx="44" cy="21" r="6" fill="#ffbd2e"/>
    <circle cx="64" cy="21" r="6" fill="#27c93f"/>
    <text x="120" y="26" font-family="'Exo 2', sans-serif" font-size="14" font-weight="600" fill="#90a4ae">Zoom Конференция: 11-Б • Внеплановый Сбор (Организатор: Администрация)</text>
    <rect x="1110" y="8" width="150" height="26" rx="4" fill="#d50000"/>
    <text x="1185" y="25" font-family="'Russo One', sans-serif" font-size="12" fill="#ffffff" text-anchor="middle">ПОКИНУТЬ ЗУМ</text>

    <!-- Main Zoom Tiles Grid (4x2 tiles + Chat sidebar) -->
    <!-- Grid Area: x: 20 to 920, y: 55 to 640 -->

    <!-- Tile 1: Училка (Speaker) -->
    <g transform="translate(25, 55)">
      <rect width="285" height="185" rx="8" fill="#1a1d26" stroke="#ff1744" stroke-width="3" filter="url(#dropShadow)"/>
      <g transform="translate(18, 5) scale(0.48)">${schoolBosses.teacher.svg}</g>
      <rect x="8" y="152" width="150" height="24" rx="4" fill="rgba(0,0,0,0.75)"/>
      <text x="16" y="168" font-family="'Russo One', sans-serif" font-size="12" fill="#ff1744">МАРЬ ИВАННА (Говорит...)</text>
      <!-- Mic Icon -->
      <circle cx="265" cy="164" r="10" fill="#2e7d32"/>
      <text x="265" y="168" font-family="sans-serif" font-size="11" fill="#fff" text-anchor="middle">🎙</text>
    </g>

    <!-- Tile 2: Дима -->
    <g transform="translate(325, 55)">
      <rect width="285" height="185" rx="8" fill="#1a1d26" stroke="#2a3040" stroke-width="2"/>
      <g transform="translate(18, 5) scale(0.48)">${dima.svg}</g>
      <rect x="8" y="152" width="120" height="24" rx="4" fill="rgba(0,0,0,0.75)"/>
      <text x="16" y="168" font-family="'Russo One', sans-serif" font-size="12" fill="#ff9100">ДИМА (Без звука)</text>
      <circle cx="265" cy="164" r="10" fill="#c62828"/>
      <text x="265" y="168" font-family="sans-serif" font-size="11" fill="#fff" text-anchor="middle">🔇</text>
    </g>

    <!-- Tile 3: Лёха (Лагает) -->
    <g transform="translate(625, 55)">
      <rect width="285" height="185" rx="8" fill="#1a1d26" stroke="#2a3040" stroke-width="2"/>
      <g transform="translate(18, 5) scale(0.48)">${lexa.svg}</g>
      <rect x="8" y="152" width="165" height="24" rx="4" fill="rgba(0,0,0,0.75)"/>
      <text x="16" y="168" font-family="'Russo One', sans-serif" font-size="12" fill="#ea80fc">ЛЁХА (Пинг: 999 ms...)</text>
      <circle cx="265" cy="164" r="10" fill="#c62828"/>
      <text x="265" y="168" font-family="sans-serif" font-size="11" fill="#fff" text-anchor="middle">🔇</text>
    </g>

    <!-- Tile 4: Охранник Петрович (Подключился с телефона) -->
    <g transform="translate(25, 255)">
      <rect width="285" height="185" rx="8" fill="#1a1d26" stroke="#3d5afe" stroke-width="2"/>
      <g transform="translate(18, 5) scale(0.48)">${schoolBosses.guard.svg}</g>
      <rect x="8" y="152" width="180" height="24" rx="4" fill="rgba(0,0,0,0.75)"/>
      <text x="16" y="168" font-family="'Russo One', sans-serif" font-size="12" fill="#82b1ff">ВАХТА_ТЕЛЕФОН_2 (Петрович)</text>
      <circle cx="265" cy="164" r="10" fill="#2e7d32"/>
      <text x="265" y="168" font-family="sans-serif" font-size="11" fill="#fff" text-anchor="middle">🎙</text>
    </g>

    <!-- Tile 5: Артём -->
    <g transform="translate(325, 255)">
      <rect width="285" height="185" rx="8" fill="#1a1d26" stroke="#2a3040" stroke-width="2"/>
      <g transform="translate(18, 5) scale(0.48)">${artem.svg}</g>
      <rect x="8" y="152" width="140" height="24" rx="4" fill="rgba(0,0,0,0.75)"/>
      <text x="16" y="168" font-family="'Russo One', sans-serif" font-size="12" fill="#00e5ff">АРТЁМ (Пьёт чай)</text>
      <circle cx="265" cy="164" r="10" fill="#c62828"/>
      <text x="265" y="168" font-family="sans-serif" font-size="11" fill="#fff" text-anchor="middle">🔇</text>
    </g>

    <!-- Tile 6: Илья (Камера выключена) -->
    <g transform="translate(625, 255)">
      <rect width="285" height="185" rx="8" fill="#10121a" stroke="#2a3040" stroke-width="2"/>
      <circle cx="142" cy="80" r="38" fill="#263238"/>
      <text x="142" y="90" font-family="'Russo One', sans-serif" font-size="28" fill="#78909c" text-anchor="middle">И</text>
      <text x="142" y="135" font-family="'Exo 2', sans-serif" font-size="12" fill="#546e7a" text-anchor="middle">Камера отключена пользователем</text>
      <rect x="8" y="152" width="130" height="24" rx="4" fill="rgba(0,0,0,0.75)"/>
      <text x="16" y="168" font-family="'Russo One', sans-serif" font-size="12" fill="#90a4ae">ИЛЬЯ (Спит на уроке)</text>
      <circle cx="265" cy="164" r="10" fill="#c62828"/>
      <text x="265" y="168" font-family="sans-serif" font-size="11" fill="#fff" text-anchor="middle">🔇</text>
    </g>

    <!-- Tile 7 & 8 Combined Banner: СРОЧНАЯ НОВОСТЬ ОТ ДИРЕКТОРА -->
    <g transform="translate(25, 455)">
      <rect width="885" height="180" rx="10" fill="linear-gradient(135deg, #1b0a20, #0a101f)" stroke="#ffd600" stroke-width="3" filter="url(#dropShadow)"/>
      <!-- Glowing Breaking News Badge -->
      <rect x="25" y="20" width="180" height="30" rx="6" fill="#ffd600"/>
      <text x="115" y="41" font-family="'Russo One', sans-serif" font-size="15" fill="#000000" text-anchor="middle">⚡ СРОЧНАЯ НОВОСТЬ</text>

      <text x="25" y="85" font-family="'Russo One', sans-serif" font-size="26" fill="#ffffff" letter-spacing="1">
        В ШКОЛЕ ПОСТРОЕН НОВЫЙ СПОРТЗАЛ!
      </text>
      <text x="25" y="118" font-family="'Exo 2', sans-serif" font-size="16" font-weight="600" fill="#b0bec5">
        Директор Палыч: «Блестящий паркет и новые канаты ждут! Но дистант окончен не для всех...»
      </text>
      <text x="25" y="145" font-family="'Exo 2', sans-serif" font-size="15" font-weight="600" fill="#ff80ab">
        «Право войти получат только победители Башни Школы! Остальным — сидеть в зуме до лета!»
      </text>

      <!-- Key Badge -->
      <g transform="translate(740, 20)">
        <circle cx="60" cy="70" r="50" fill="#ffd600" opacity="0.15" filter="url(#superGlow)"/>
        <circle cx="60" cy="70" r="42" fill="#212121" stroke="#ffd600" stroke-width="3"/>
        <text x="60" y="80" font-family="sans-serif" font-size="38" text-anchor="middle">🔑</text>
        <text x="60" y="130" font-family="'Russo One', sans-serif" font-size="11" fill="#ffd600" text-anchor="middle">КЛЮЧ ОТ СПОРТЗАЛА</text>
      </g>
    </g>

    <!-- Zoom Chat Panel (Right Sidebar) -->
    <g transform="translate(930, 55)">
      <rect width="325" height="580" rx="8" fill="#181c24" stroke="#2a3040" stroke-width="2"/>
      <!-- Chat Header -->
      <rect width="325" height="42" rx="8" fill="#222733"/>
      <text x="18" y="27" font-family="'Russo One', sans-serif" font-size="14" fill="#ffffff">ЧАТ КОНФЕРЕНЦИИ</text>
      <circle cx="295" cy="21" r="10" fill="#37474f"/>
      <text x="295" y="25" font-family="sans-serif" font-size="11" fill="#fff" text-anchor="middle">✖</text>

      <!-- Messages list -->
      <!-- Msg 1 -->
      <g transform="translate(15, 60)">
        <text x="0" y="0" font-family="'Russo One', sans-serif" font-size="12" fill="#ff9100">Дима:</text>
        <text x="50" y="0" font-family="'Exo 2', sans-serif" font-size="13" fill="#cfd8dc">Скиньте ссылку на дз по физике!</text>
      </g>
      <!-- Msg 2 -->
      <g transform="translate(15, 100)">
        <text x="0" y="0" font-family="'Russo One', sans-serif" font-size="12" fill="#ff1744">Марь Иванна:</text>
        <text x="0" y="18" font-family="'Exo 2', sans-serif" font-size="13" fill="#ff8a80">Дима, включи камеру! Я кому объясняю?!</text>
      </g>
      <!-- Msg 3 -->
      <g transform="translate(15, 155)">
        <text x="0" y="0" font-family="'Russo One', sans-serif" font-size="12" fill="#82b1ff">Петрович (Вахта):</text>
        <text x="0" y="18" font-family="'Exo 2', sans-serif" font-size="13" fill="#b0bec5">Кто сменку не возьмет — в спортзал</text>
        <text x="0" y="36" font-family="'Exo 2', sans-serif" font-size="13" fill="#b0bec5">даже на порог не пущу, понял?!</text>
      </g>
      <!-- Msg 4 -->
      <g transform="translate(15, 225)">
        <text x="0" y="0" font-family="'Russo One', sans-serif" font-size="12" fill="#ea80fc">Лёха:</text>
        <text x="0" y="18" font-family="'Exo 2', sans-serif" font-size="13" fill="#cfd8dc">Петрович, я в носках пройду 🥊</text>
      </g>
      <!-- Msg 5 (Glitch / Dark Sergey) -->
      <g transform="translate(15, 280)">
        <rect x="-6" y="-12" width="305" height="65" rx="6" fill="#140a1c" stroke="#76ff03" stroke-width="1.5"/>
        <text x="0" y="6" font-family="'Russo One', sans-serif" font-size="12" fill="#76ff03">☠ [СИСТЕМА / ROOT]:</text>
        <text x="0" y="26" font-family="'Exo 2', sans-serif" font-size="12" font-weight="600" fill="#b39ddb">ТЁМНЫЙ СЕРГЕЙ захватил пароль!</text>
        <text x="0" y="42" font-family="'Exo 2', sans-serif" font-size="11" fill="#e1bee7">«Никто не выйдет из Zoom без боя...»</text>
      </g>

      <!-- Bottom Chat Input -->
      <g transform="translate(15, 520)">
        <rect width="295" height="38" rx="6" fill="#10121a" stroke="#37474f" stroke-width="1.5"/>
        <text x="12" y="24" font-family="'Exo 2', sans-serif" font-size="12" fill="#546e7a">Написать сообщение в 11-Б...</text>
        <rect x="235" y="6" width="52" height="26" rx="4" fill="#3d5afe"/>
        <text x="261" y="23" font-family="'Russo One', sans-serif" font-size="11" fill="#ffffff" text-anchor="middle">ОТПР</text>
      </g>
    </g>

    <!-- Bottom Zoom Controls Bar -->
    <rect y="660" width="1280" height="60" fill="#161a22"/>
    <g transform="translate(420, 672)">
      <rect x="0" y="0" width="440" height="38" rx="6" fill="linear-gradient(135deg, #ff4d2a, #f50057)" filter="url(#superGlow)"/>
      <text x="220" y="25" font-family="'Russo One', sans-serif" font-size="18" fill="#ffffff" text-anchor="middle" letter-spacing="2">
        ВОРВАТЬСЯ В КАМПАНИЮ (SPACE / ENTER) ▶
      </text>
    </g>
  </svg>`;

  await renderSvgToPng(svg, '01_zoom_intro.png');
}

// -------------------------------------------------------------
// SCREEN 2: 02_dossier_select.png (Выбор бойца: Zoom-досье)
// -------------------------------------------------------------
async function generateScreen2() {
  const dima = charMap.get('dima');
  const lexa = charMap.get('lexa');
  const artem = charMap.get('artem');
  const maks = charMap.get('maks');
  const sanya = charMap.get('sanya');
  const ilya = charMap.get('ilya');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
    ${commonDefs}
    <!-- Dark Tech Classroom Backdrop -->
    <rect width="1280" height="720" fill="#0c0e14"/>
    <line x1="0" y1="80" x2="1280" y2="80" stroke="#1f2533" stroke-width="2"/>

    <!-- Header -->
    <text x="640" y="48" font-family="'Russo One', sans-serif" font-size="32" fill="#ffd600" text-anchor="middle" letter-spacing="3" filter="url(#superGlow)">
      ВЫБОР ГЕРОЯ: ДОСЬЕ ОДНОКЛАССНИКА
    </text>
    <text x="640" y="70" font-family="'Exo 2', sans-serif" font-size="13" font-weight="600" fill="#78909c" text-anchor="middle">
      Выбери того, кто поведёт 11-Б на штурм реальной школы и спортзала!
    </text>

    <!-- LEFT: 6 Fighter Pick Cards (2 rows of 3) -->
    <g transform="translate(60, 110)">
      <!-- Selected Card: DIMA -->
      <g transform="translate(0, 0)">
        <rect width="210" height="240" rx="10" fill="#1b171c" stroke="#ff4d2a" stroke-width="3.5" filter="url(#superGlow)"/>
        <g transform="translate(15, 10) scale(0.35)">${dima.svg}</g>
        <rect x="0" y="195" width="210" height="45" rx="0 0 10 10" fill="#ff4d2a"/>
        <text x="105" y="218" font-family="'Russo One', sans-serif" font-size="16" fill="#ffffff" text-anchor="middle">ДИМА</text>
        <text x="105" y="233" font-family="'Exo 2', sans-serif" font-size="10" font-weight="800" fill="#ffe0b2" text-anchor="middle">ВЫБРАН (1P)</text>
      </g>

      <!-- LEXA -->
      <g transform="translate(230, 0)">
        <rect width="210" height="240" rx="10" fill="#13141f" stroke="#2a3040" stroke-width="2"/>
        <g transform="translate(15, 10) scale(0.35)">${lexa.svg}</g>
        <rect x="0" y="195" width="210" height="45" rx="0 0 10 10" fill="#1e1828"/>
        <text x="105" y="222" font-family="'Russo One', sans-serif" font-size="16" fill="#e040fb" text-anchor="middle">ЛЁХА</text>
      </g>

      <!-- ARTEM -->
      <g transform="translate(460, 0)">
        <rect width="210" height="240" rx="10" fill="#13141f" stroke="#2a3040" stroke-width="2"/>
        <g transform="translate(15, 10) scale(0.35)">${artem.svg}</g>
        <rect x="0" y="195" width="210" height="45" rx="0 0 10 10" fill="#12252e"/>
        <text x="105" y="222" font-family="'Russo One', sans-serif" font-size="16" fill="#00e5ff" text-anchor="middle">АРТЁМ</text>
      </g>

      <!-- Row 2 -->
      <!-- MAKS -->
      <g transform="translate(0, 260)">
        <rect width="210" height="240" rx="10" fill="#13141f" stroke="#2a3040" stroke-width="2"/>
        <g transform="translate(15, 10) scale(0.35)">${maks.svg}</g>
        <rect x="0" y="195" width="210" height="45" rx="0 0 10 10" fill="#162612"/>
        <text x="105" y="222" font-family="'Russo One', sans-serif" font-size="16" fill="#76ff03" text-anchor="middle">МАКС</text>
      </g>

      <!-- SANYA -->
      <g transform="translate(230, 260)">
        <rect width="210" height="240" rx="10" fill="#13141f" stroke="#2a3040" stroke-width="2"/>
        <g transform="translate(15, 10) scale(0.35)">${sanya.svg}</g>
        <rect x="0" y="195" width="210" height="45" rx="0 0 10 10" fill="#291a0c"/>
        <text x="105" y="222" font-family="'Russo One', sans-serif" font-size="16" fill="#ff9100" text-anchor="middle">САНЯ</text>
      </g>

      <!-- ILYA -->
      <g transform="translate(460, 260)">
        <rect width="210" height="240" rx="10" fill="#13141f" stroke="#2a3040" stroke-width="2"/>
        <g transform="translate(15, 10) scale(0.35)">${ilya.svg}</g>
        <rect x="0" y="195" width="210" height="45" rx="0 0 10 10" fill="#121d2e"/>
        <text x="105" y="222" font-family="'Russo One', sans-serif" font-size="16" fill="#448aff" text-anchor="middle">ИЛЬЯ</text>
      </g>
    </g>

    <!-- RIGHT: Zoom Student Dossier / Personal File -->
    <g transform="translate(760, 110)">
      <rect width="460" height="500" rx="12" fill="#151821" stroke="#ff4d2a" stroke-width="2" filter="url(#dropShadow)"/>
      <!-- Dossier Header -->
      <rect width="460" height="50" rx="12 12 0 0" fill="#202432"/>
      <text x="25" y="32" font-family="'Russo One', sans-serif" font-size="16" fill="#ff4d2a">ЛИЧНОЕ ДЕЛО №67 • ДИМА</text>
      <text x="435" y="32" font-family="'Exo 2', sans-serif" font-size="12" font-weight="800" fill="#81c784" text-anchor="end">СТАТУС: В СЕТИ</text>

      <!-- Zoom Profile Details -->
      <g transform="translate(25, 75)">
        <!-- Zoom Quote -->
        <rect width="410" height="44" rx="6" fill="#0d1017" stroke="#37474f" stroke-width="1"/>
        <text x="15" y="20" font-family="'Exo 2', sans-serif" font-size="12" fill="#90a4ae">Статус в Zoom:</text>
        <text x="15" y="35" font-family="'Exo 2', sans-serif" font-size="13" font-weight="700" fill="#ffab91">«Микрофон фонит, но кулаки работают стабильно!»</text>

        <!-- Stats Grid -->
        <g transform="translate(0, 65)">
          <text x="0" y="15" font-family="'Russo One', sans-serif" font-size="13" fill="#cfd8dc">СИЛА АТАКИ (ATK)</text>
          <rect x="0" y="25" width="410" height="10" rx="5" fill="#263238"/>
          <rect x="0" y="25" width="280" height="10" rx="5" fill="#ff4d2a"/>

          <text x="0" y="55" font-family="'Russo One', sans-serif" font-size="13" fill="#cfd8dc">ЗАЩИТА ОТ ДВОЕК (DEF)</text>
          <rect x="0" y="65" width="410" height="10" rx="5" fill="#263238"/>
          <rect x="0" y="65" width="240" height="10" rx="5" fill="#ff9100"/>

          <text x="0" y="95" font-family="'Russo One', sans-serif" font-size="13" fill="#cfd8dc">СКОРОСТЬ СПИСЫВАНИЯ (SPD)</text>
          <rect x="0" y="105" width="410" height="10" rx="5" fill="#263238"/>
          <rect x="0" y="105" width="310" height="10" rx="5" fill="#ffd600"/>
        </g>

        <!-- Parody School Bio -->
        <g transform="translate(0, 205)">
          <text x="0" y="15" font-family="'Russo One', sans-serif" font-size="14" fill="#ffd600">ШКОЛЬНАЯ ХАРАКТЕРИСТИКА:</text>
          <text x="0" y="40" font-family="'Exo 2', sans-serif" font-size="13" fill="#eceff1">• Любимый предмет: Физкультура (когда она очная)</text>
          <text x="0" y="62" font-family="'Exo 2', sans-serif" font-size="13" fill="#eceff1">• Особые приметы: Включает камеру только ради переклички</text>
          <text x="0" y="84" font-family="'Exo 2', sans-serif" font-size="13" fill="#eceff1">• Цель в турнире: Первым занять баскетбольное кольцо в спортзале</text>
          <text x="0" y="106" font-family="'Exo 2', sans-serif" font-size="13" fill="#eceff1">• Спецприём: «Огненный Кулак» (пробивает даже школьный дневник!)</text>
        </g>

        <!-- Ready Button -->
        <g transform="translate(0, 355)">
          <rect width="410" height="46" rx="8" fill="linear-gradient(135deg, #ff4d2a, #d50000)" filter="url(#superGlow)"/>
          <text x="205" y="30" font-family="'Russo One', sans-serif" font-size="18" fill="#ffffff" text-anchor="middle" letter-spacing="2">
            ВЫБРАТЬ И НАЧАТЬ ТУРНИР ▶
          </text>
        </g>
      </g>
    </g>

    <!-- Bottom Navigation Hint -->
    <rect y="665" width="1280" height="55" fill="#080a0e"/>
    <text x="640" y="698" font-family="'Exo 2', sans-serif" font-size="14" fill="#78909c" text-anchor="middle">
      Используйте [A] [D] / Стрелки для выбора бойца • [SPACE] для подтверждения • [ESC] в главное меню
    </text>
  </svg>`;

  await renderSvgToPng(svg, '02_dossier_select.png');
}

// -------------------------------------------------------------
// SCREEN 3: 03_mortal_kombat_tower.png (Башня Школы MK Ladder)
// -------------------------------------------------------------
async function generateScreen3() {
  const dima = charMap.get('dima');
  const lexa = charMap.get('lexa');
  const artem = charMap.get('artem');
  const darksergey = charMap.get('darksergey');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
    ${commonDefs}
    <!-- Dark Mortal Kombat Dungeon / School Basement Wall Background -->
    <rect width="1280" height="720" fill="#08070d"/>
    <!-- Brickwork Texture Lines -->
    <g stroke="#161224" stroke-width="2" opacity="0.6">
      <line x1="0" y1="120" x2="1280" y2="120"/>
      <line x1="0" y1="240" x2="1280" y2="240"/>
      <line x1="0" y1="360" x2="1280" y2="360"/>
      <line x1="0" y1="480" x2="1280" y2="480"/>
      <line x1="0" y1="600" x2="1280" y2="600"/>
    </g>

    <!-- Blood / Fire Torches on Columns -->
    <circle cx="280" cy="220" r="80" fill="#ff4d2a" opacity="0.1" filter="url(#superGlow)"/>
    <circle cx="1000" cy="220" r="80" fill="#76ff03" opacity="0.1" filter="url(#superGlow)"/>

    <!-- Left Header Banner: Mortal Kombat Style Title -->
    <g transform="translate(100, 60)">
      <text x="0" y="40" font-family="'Russo One', sans-serif" font-size="38" fill="url(#flameGrad)" letter-spacing="4" filter="url(#dropShadow)">
        БАШНЯ ТУРНИРА
      </text>
      <text x="0" y="70" font-family="'Russo One', sans-serif" font-size="20" fill="#ffd600" letter-spacing="2">
        ПУТЬ В НОВЫЙ СПОРТЗАЛ
      </text>
      <text x="0" y="110" font-family="'Exo 2', sans-serif" font-size="14" fill="#90a4ae">
        Одолей одноклассников на дистанте,
      </text>
      <text x="0" y="130" font-family="'Exo 2', sans-serif" font-size="14" fill="#90a4ae">
        прорвись через администрацию школы
      </text>
      <text x="0" y="150" font-family="'Exo 2', sans-serif" font-size="14" fill="#ff80ab">
        и отбей спортзал у Тёмного Сергея!
      </text>

      <!-- Player Status Card -->
      <g transform="translate(0, 200)">
        <rect width="250" height="150" rx="10" fill="#14111f" stroke="#ff4d2a" stroke-width="2"/>
        <text x="20" y="32" font-family="'Russo One', sans-serif" font-size="14" fill="#ff4d2a">ТВОЙ БОЕЦ: ДИМА</text>
        <text x="20" y="60" font-family="'Exo 2', sans-serif" font-size="13" fill="#cfd8dc">Текущий этаж: 1 из 6</text>
        <text x="20" y="85" font-family="'Exo 2', sans-serif" font-size="13" fill="#76ff03">Побед подряд: 0</text>
        <text x="20" y="110" font-family="'Exo 2', sans-serif" font-size="13" fill="#ffd600">Счёт турнира: 0000 PTS</text>
      </g>
    </g>

    <!-- CENTER: THE GRAND MORTAL KOMBAT TOWER LADDER -->
    <!-- Tower Pillar: x: 420 to 860 (width 440px) -->
    <g transform="translate(410, 25)">
      <!-- Stone Pillar Backdrop -->
      <rect width="460" height="670" rx="16" fill="url(#metalGrad)" stroke="#ffb800" stroke-width="3" filter="url(#dropShadow)"/>

      <!-- TOWER FLOOR 6 (TOP BOSS): ТЁМНЫЙ СЕРГЕЙ (СПОРТЗАЛ) -->
      <g transform="translate(15, 15)">
        <rect width="430" height="95" rx="8" fill="#0d140a" stroke="#76ff03" stroke-width="3" filter="url(#superGlow)"/>
        <!-- Boss Icon -->
        <g transform="translate(10, 8) scale(0.24)">${darksergey.svg}</g>
        <text x="105" y="36" font-family="'Russo One', sans-serif" font-size="18" fill="#76ff03">ЭТАЖ 6: ТЁМНЫЙ СЕРГЕЙ</text>
        <text x="105" y="58" font-family="'Exo 2', sans-serif" font-size="11" font-weight="700" fill="#b39ddb">ФИНАЛ • 420 HP • НОВЫЙ СПОРТЗАЛ</text>
        <text x="105" y="78" font-family="'Exo 2', sans-serif" font-size="11" fill="#76ff03">«Пароль от зала останется у меня!»</text>
      </g>

      <!-- TOWER FLOOR 5: ДИРЕКТОР ПАЛЫЧ -->
      <g transform="translate(15, 120)">
        <rect width="430" height="95" rx="8" fill="#1c1912" stroke="#ffd600" stroke-width="2.5"/>
        <g transform="translate(10, 8) scale(0.24)">${schoolBosses.principal.svg}</g>
        <text x="105" y="36" font-family="'Russo One', sans-serif" font-size="17" fill="#ffd600">ЭТАЖ 5: ДИРЕКТОР ПАЛЫЧ</text>
        <text x="105" y="58" font-family="'Exo 2', sans-serif" font-size="11" font-weight="700" fill="#ffecb3">СУБ-БОСС • ПРИЁМНАЯ ДИРЕКТОРА</text>
        <text x="105" y="78" font-family="'Exo 2', sans-serif" font-size="11" fill="#fff9c4">«Сначала подпишите акт приёмки!»</text>
      </g>

      <!-- TOWER FLOOR 4: ЗАВУЧ ТАМАРА ИВАНОВНА -->
      <g transform="translate(15, 225)">
        <rect width="430" height="95" rx="8" fill="#1b1022" stroke="#ea80fc" stroke-width="2"/>
        <g transform="translate(10, 8) scale(0.24)">${schoolBosses.headteacher.svg}</g>
        <text x="105" y="36" font-family="'Russo One', sans-serif" font-size="16" fill="#ea80fc">ЭТАЖ 4: ЗАВУЧ ТАМАРА ИВАНОВНА</text>
        <text x="105" y="58" font-family="'Exo 2', sans-serif" font-size="11" font-weight="700" fill="#e1bee7">СУБ-БОСС • КАБИНЕТ УВР &amp; ВПР</text>
        <text x="105" y="78" font-family="'Exo 2', sans-serif" font-size="11" fill="#f3e5f5">«Родителей в школу за такое!»</text>
      </g>

      <!-- TOWER FLOOR 3: ОХРАННИК ПЕТРОВИЧ -->
      <g transform="translate(15, 330)">
        <rect width="430" height="95" rx="8" fill="#101524" stroke="#3d5afe" stroke-width="2"/>
        <g transform="translate(10, 8) scale(0.24)">${schoolBosses.guard.svg}</g>
        <text x="105" y="36" font-family="'Russo One', sans-serif" font-size="17" fill="#82b1ff">ЭТАЖ 3: ОХРАННИК ПЕТРОВИЧ</text>
        <text x="105" y="58" font-family="'Exo 2', sans-serif" font-size="11" font-weight="700" fill="#bbdefb">МИНИ-БОСС • ВАХТА &amp; ТУРНИКЕТЫ</text>
        <text x="105" y="78" font-family="'Exo 2', sans-serif" font-size="11" fill="#e3f2fd">«ГДЕ СМЕНКА?! Без бахил не пущу!»</text>
      </g>

      <!-- TOWER FLOOR 2: ЗЛАЯ УЧИЛКА МАРЬ ИВАННА -->
      <g transform="translate(15, 435)">
        <rect width="430" height="95" rx="8" fill="#241014" stroke="#ff1744" stroke-width="2"/>
        <g transform="translate(10, 8) scale(0.24)">${schoolBosses.teacher.svg}</g>
        <text x="105" y="36" font-family="'Russo One', sans-serif" font-size="17" fill="#ff5252">ЭТАЖ 2: МАРЬ ИВАННА</text>
        <text x="105" y="58" font-family="'Exo 2', sans-serif" font-size="11" font-weight="700" fill="#ffcdd2">МИНИ-БОСС • ZOOM-ИНКВИЗИЦИЯ</text>
        <text x="105" y="78" font-family="'Exo 2', sans-serif" font-size="11" fill="#ffebee">«А голову ты дома не забыл?!»</text>
      </g>

      <!-- TOWER FLOOR 1 (CURRENT MATCH): АРТЁМ -->
      <g transform="translate(15, 540)">
        <!-- Highlighted Active Floor Pulse -->
        <rect width="430" height="100" rx="8" fill="#1b120c" stroke="#ff4d2a" stroke-width="3.5" filter="url(#superGlow)"/>
        <g transform="translate(10, 10) scale(0.24)">${artem.svg}</g>
        <text x="105" y="38" font-family="'Russo One', sans-serif" font-size="18" fill="#ff9100">ЭТАЖ 1: АРТЁМ (ДИСТАНТ)</text>
        <text x="105" y="60" font-family="'Exo 2', sans-serif" font-size="12" font-weight="800" fill="#76ff03">▶ ТЕКУЩИЙ БОЙ В ZOOM</text>
        <text x="105" y="80" font-family="'Exo 2', sans-serif" font-size="11" fill="#ffccbc">«Я быстрее всех бегаю за пирожками!»</text>

        <!-- Animated Marker "FIGHT HERE" -->
        <polygon points="400,50 420,40 420,60" fill="#ff4d2a" filter="url(#superGlow)"/>
      </g>
    </g>

    <!-- RIGHT: Fight Prompt & Kombat Dragon Logo Accent -->
    <g transform="translate(930, 480)">
      <rect width="280" height="90" rx="10" fill="linear-gradient(135deg, #ff4d2a, #d50000)" stroke="#ffd600" stroke-width="2" filter="url(#superGlow)"/>
      <text x="140" y="42" font-family="'Russo One', sans-serif" font-size="22" fill="#ffffff" text-anchor="middle">НАЧАТЬ БОЙ!</text>
      <text x="140" y="68" font-family="'Exo 2', sans-serif" font-size="13" font-weight="700" fill="#fff9c4" text-anchor="middle">[ПРОБЕЛ / НАЖАТИЕ]</text>
    </g>
  </svg>`;

  await renderSvgToPng(svg, '03_mortal_kombat_tower.png');
}

// -------------------------------------------------------------
// SCREEN 4: 04_street_fighter_vs.png (Прематч VS Диалоги SF Style)
// -------------------------------------------------------------
async function generateScreen4() {
  const dima = charMap.get('dima');
  const guard = schoolBosses.guard;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
    ${commonDefs}
    <!-- Dynamic Split Background -->
    <!-- Left Fighter BG: Fiery Orange/Red -->
    <path d="M 0 0 L 700 0 L 580 720 L 0 720 Z" fill="linear-gradient(135deg, #3e0e08, #180504)"/>
    <!-- Right Fighter BG: Cold Cyber Security Blue -->
    <path d="M 700 0 L 1280 0 L 1280 720 L 580 720 Z" fill="linear-gradient(135deg, #071536, #020714)"/>

    <!-- Dynamic Diagonal Lightning Slash -->
    <polygon points="695,0 715,0 595,720 575,720" fill="#ffd600" filter="url(#superGlow)"/>
    <polygon points="698,0 706,0 588,720 580,720" fill="#ffffff"/>

    <!-- Top Match Info -->
    <rect x="440" y="20" width="400" height="50" rx="8" fill="#0e0f17" stroke="#ffd600" stroke-width="2"/>
    <text x="640" y="45" font-family="'Russo One', sans-serif" font-size="18" fill="#ffd600" text-anchor="middle">
      БАШНЯ ШКОЛЫ • ЭТАЖ 3: ВАХТА
    </text>
    <text x="640" y="62" font-family="'Exo 2', sans-serif" font-size="11" font-weight="700" fill="#90a4ae" text-anchor="middle">
      СПОНСОР БОЯ: СТОЛОВАЯ №1 И СОСИСКА В ТЕСТЕ
    </text>

    <!-- LEFT FIGHTER: DIMA (PLAYER 1) -->
    <g transform="translate(60, 90)">
      <!-- Large Character Avatar -->
      <g transform="translate(40, 20) scale(0.85)">${dima.svg}</g>
      <!-- Name Plate -->
      <rect x="0" y="470" width="440" height="60" rx="8" fill="#ff4d2a" filter="url(#dropShadow)"/>
      <text x="20" y="512" font-family="'Russo One', sans-serif" font-size="34" fill="#ffffff">ДИМА</text>
      <text x="420" y="510" font-family="'Exo 2', sans-serif" font-size="14" font-weight="800" fill="#ffe0b2" text-anchor="end">ИГРОК 1</text>

      <!-- Comic Dialogue Bubble -->
      <g transform="translate(20, 545)">
        <rect width="440" height="75" rx="8" fill="#1b1016" stroke="#ff4d2a" stroke-width="2.5"/>
        <text x="18" y="30" font-family="'Russo One', sans-serif" font-size="16" fill="#ffab91">
          «Петрович, пусти в спортзал!
        </text>
        <text x="18" y="55" font-family="'Exo 2', sans-serif" font-size="14" font-weight="600" fill="#ffffff">
          Я сменку в рюкзаке забыл, честно говорю!»
        </text>
      </g>
    </g>

    <!-- CENTER GIANT "VS" LOGO -->
    <g transform="translate(640, 360)">
      <circle cx="0" cy="0" r="75" fill="#120c1f" stroke="#ffd600" stroke-width="4" filter="url(#superGlow)"/>
      <text x="0" y="24" font-family="'Russo One', sans-serif" font-size="64" fill="url(#flameGrad)" text-anchor="middle" font-style="italic" letter-spacing="4">
        VS
      </text>
    </g>

    <!-- RIGHT FIGHTER: PETROVICH (BOSS 2) -->
    <g transform="translate(740, 90)">
      <!-- Large Character Avatar -->
      <g transform="translate(40, 20) scale(0.85)">${guard.svg}</g>
      <!-- Name Plate -->
      <rect x="40" y="470" width="440" height="60" rx="8" fill="#1565c0" filter="url(#dropShadow)"/>
      <text x="60" y="512" font-family="'Russo One', sans-serif" font-size="30" fill="#ffffff">ПЕТРОВИЧ</text>
      <text x="460" y="510" font-family="'Exo 2', sans-serif" font-size="14" font-weight="800" fill="#82b1ff" text-anchor="end">СТРАЖ ВАХТЫ</text>

      <!-- Comic Dialogue Bubble -->
      <g transform="translate(40, 545)">
        <rect width="440" height="75" rx="8" fill="#0d1424" stroke="#3d5afe" stroke-width="2.5"/>
        <text x="18" y="30" font-family="'Russo One', sans-serif" font-size="16" fill="#82b1ff">
          «Не пущу без бахил, щегол!
        </text>
        <text x="18" y="55" font-family="'Exo 2', sans-serif" font-size="14" font-weight="600" fill="#ffffff">
          Турникет закрыт, металлодетектор заряжен!»
        </text>
      </g>
    </g>

    <!-- Bottom Action Banner -->
    <g transform="translate(490, 650)">
      <rect width="300" height="46" rx="8" fill="#ffd600" filter="url(#superGlow)"/>
      <text x="150" y="30" font-family="'Russo One', sans-serif" font-size="18" fill="#000000" text-anchor="middle" letter-spacing="2">
        РАУНД 1: К БОЮ! ▶
      </text>
    </g>
  </svg>`;

  await renderSvgToPng(svg, '04_street_fighter_vs.png');
}

// -------------------------------------------------------------
// SCREEN 5: 05_gym_victory_ending.png (Школьный триумф в спортзале)
// -------------------------------------------------------------
async function generateScreen5() {
  const dima = charMap.get('dima');
  const principal = schoolBosses.principal;
  const teacher = schoolBosses.teacher;
  const guard = schoolBosses.guard;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
    ${commonDefs}
    <!-- Brand New Gym Floor (Shiny Wood Parquet) -->
    <rect width="1280" height="420" fill="linear-gradient(180deg, #0a1124, #131d38)"/>
    <!-- Shiny Parquet Floor -->
    <rect y="420" width="1280" height="300" fill="#c67d34"/>
    <!-- Parquet Wood Plank Lines -->
    <g stroke="#9d5b1d" stroke-width="2" opacity="0.6">
      <line x1="0" y1="470" x2="1280" y2="470"/>
      <line x1="0" y1="520" x2="1280" y2="520"/>
      <line x1="0" y1="570" x2="1280" y2="570"/>
      <line x1="0" y1="620" x2="1280" y2="620"/>
      <line x1="0" y1="670" x2="1280" y2="670"/>
      <!-- Court Marking Lines -->
      <ellipse cx="640" cy="560" rx="140" ry="60" fill="none" stroke="#ffffff" stroke-width="4" opacity="0.8"/>
      <line x1="640" y1="420" x2="640" y2="720" stroke="#ffffff" stroke-width="4" opacity="0.8"/>
    </g>

    <!-- Confetti & Celebration Streamers -->
    <g opacity="0.8">
      <circle cx="200" cy="180" r="8" fill="#ff1744"/>
      <circle cx="350" cy="120" r="10" fill="#ffd600"/>
      <circle cx="500" cy="220" r="7" fill="#76ff03"/>
      <circle cx="680" cy="150" r="9" fill="#00e5ff"/>
      <circle cx="850" cy="190" r="8" fill="#e040fb"/>
      <circle cx="1020" cy="130" r="11" fill="#ff9100"/>
      <path d="M 150 80 Q 250 140 350 90" fill="none" stroke="#ffd600" stroke-width="4"/>
      <path d="M 700 80 Q 800 160 920 100" fill="none" stroke="#00e5ff" stroke-width="4"/>
      <path d="M 980 90 Q 1080 150 1180 80" fill="none" stroke="#ff1744" stroke-width="4"/>
    </g>

    <!-- Red Ribbon Cut in Half -->
    <path d="M 120 400 Q 300 420 480 390" fill="none" stroke="#d50000" stroke-width="12"/>
    <path d="M 800 390 Q 980 420 1160 400" fill="none" stroke="#d50000" stroke-width="12"/>

    <!-- Central Trophy Winner: Dima Holding the Golden Gym Key -->
    <g transform="translate(460, 100)">
      <!-- Golden Key floating in Winner's Hand -->
      <circle cx="180" cy="50" r="55" fill="#ffd600" opacity="0.25" filter="url(#superGlow)"/>
      <text x="180" y="65" font-family="sans-serif" font-size="64" text-anchor="middle">🔑</text>

      <g transform="scale(0.72)">${dima.svg}</g>
    </g>

    <!-- Defeated Bosses in Parody Roles (Left & Right) -->
    <!-- Left: Guard Petrovich with Mop washing floor -->
    <g transform="translate(80, 240) scale(0.52)">
      ${guard.svg}
      <rect x="50" y="470" width="420" height="48" rx="8" fill="rgba(10,15,30,0.9)" stroke="#3d5afe" stroke-width="2"/>
      <text x="260" y="501" font-family="'Exo 2', sans-serif" font-size="21" font-weight="700" fill="#82b1ff" text-anchor="middle">
        Петрович: Моет паркет со шваброй
      </text>
    </g>

    <!-- Right: Principal & Teacher Applauding -->
    <g transform="translate(880, 240) scale(0.52)">
      ${principal.svg}
      <rect x="50" y="470" width="420" height="48" rx="8" fill="rgba(25,20,10,0.9)" stroke="#ffd600" stroke-width="2"/>
      <text x="260" y="501" font-family="'Exo 2', sans-serif" font-size="21" font-weight="700" fill="#ffd600" text-anchor="middle">
        Палыч: Вручает грамоту за спорт
      </text>
    </g>

    <!-- Top Victory Title -->
    <g transform="translate(640, 50)">
      <text x="0" y="0" font-family="'Russo One', sans-serif" font-size="42" fill="url(#goldGrad)" text-anchor="middle" letter-spacing="4" filter="url(#superGlow)">
        ДИСТАНТ ОКОНЧЕН! ПОБЕДА!
      </text>
      <text x="0" y="32" font-family="'Exo 2', sans-serif" font-size="17" font-weight="700" fill="#ffffff" text-anchor="middle">
        Школа освобождена от цифрового застоя • Спортзал открыт для 11-Б!
      </text>
    </g>

    <!-- Epilogue Dialogue Box -->
    <g transform="translate(240, 570)">
      <rect width="800" height="120" rx="10" fill="#10131d" stroke="#ffd600" stroke-width="2" filter="url(#dropShadow)"/>
      <text x="25" y="34" font-family="'Russo One', sans-serif" font-size="17" fill="#ffd600">
        ШКОЛЬНЫЙ ЭПИЛОГ ДИМЫ:
      </text>
      <text x="25" y="64" font-family="'Exo 2', sans-serif" font-size="14" fill="#eceff1">
        Дима забрал золотой ключ, первым забил трехочковый в новенькое кольцо и отменил Zoom-уроки по субботам.
      </text>
      <text x="25" y="90" font-family="'Exo 2', sans-serif" font-size="14" font-weight="700" fill="#76ff03">
        А Тёмный Сергей был разбанен и назначен главным сисадмином школьного спорткомплекса!
      </text>
    </g>
  </svg>`;

  await renderSvgToPng(svg, '05_gym_victory_ending.png');
}

// Run All
async function main() {
  console.log('Generating Campaign Screenshots (1280x720 HD)...');
  await generateScreen1();
  await generateScreen2();
  await generateScreen3();
  await generateScreen4();
  await generateScreen5();
  console.log('All 5 Campaign Screenshots successfully generated in docs/screenshots/!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
