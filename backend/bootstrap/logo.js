/**
 * Thematic coin logos — SVG mascot from name keywords (ghost, cat, duck…).
 * No external assets; output is data:image/svg+xml;base64,...
 */

function hashStr(s) {
  let h = 2166136261;
  const str = String(s || "");
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function hsl(h, s, l) {
  return `hsl(${((h % 360) + 360) % 360} ${s}% ${l}%)`;
}

const PALETTES = [
  [210, 280, 320],
  [28, 12, 45],
  [160, 190, 220],
  [340, 20, 50],
  [250, 300, 40],
  [90, 140, 200],
  [15, 35, 200],
  [180, 220, 280],
];

/** keyword -> drawer. Matched against name (case-insensitive). */
const THEMES = [
  ["ghost", drawGhost],
  ["duck", drawDuck],
  ["cat", drawCat],
  ["fox", drawFox],
  ["wolf", drawWolf],
  ["frog", drawFrog],
  ["ape", drawApe],
  ["bear", drawBear],
  ["pepe", drawFrog],
  ["pup", drawPup],
  ["panda", drawPanda],
  ["shark", drawShark],
  ["dragon", drawDragon],
  ["rocket", drawRocket],
  ["moon", drawMoon],
  ["bolt", drawBolt],
  ["orb", drawOrb],
  ["wave", drawWave],
  ["bean", drawBean],
  ["coin", drawCoin],
  ["ninja", drawNinja],
  ["king", drawCrown],
  ["byte", drawByte],
  ["giga", drawBolt],
];

function detectTheme(name) {
  const n = String(name || "").toLowerCase();
  for (const [key, draw] of THEMES) {
    if (n.includes(key)) return { key, draw };
  }
  return { key: "coin", draw: drawCoin };
}

function drawGhost(c) {
  return `
  <ellipse cx="64" cy="58" rx="28" ry="30" fill="${c.fg}"/>
  <path d="M36 58 V88 Q42 78 48 88 Q56 78 64 88 Q72 78 80 88 Q86 78 92 88 V58 Z" fill="${c.fg}"/>
  <circle cx="54" cy="52" r="6" fill="${c.bg}"/>
  <circle cx="74" cy="52" r="6" fill="${c.bg}"/>
  <circle cx="55.5" cy="51" r="2.2" fill="${c.ink}"/>
  <circle cx="75.5" cy="51" r="2.2" fill="${c.ink}"/>
  <ellipse cx="64" cy="68" rx="7" ry="4" fill="${c.accent}" opacity="0.85"/>
  <path d="M40 34 Q50 22 64 28 Q78 22 88 34" fill="none" stroke="${c.hi}" stroke-width="3" stroke-linecap="round" opacity="0.55"/>
`;
}

function drawCat(c) {
  return `
  <path d="M40 78 Q40 42 64 38 Q88 42 88 78 Q88 96 64 98 Q40 96 40 78 Z" fill="${c.fg}"/>
  <path d="M42 48 L34 22 L54 40 Z" fill="${c.fg}"/>
  <path d="M86 48 L94 22 L74 40 Z" fill="${c.fg}"/>
  <path d="M44 46 L38 28 L52 40 Z" fill="${c.accent}" opacity="0.7"/>
  <path d="M84 46 L90 28 L76 40 Z" fill="${c.accent}" opacity="0.7"/>
  <ellipse cx="54" cy="62" rx="5" ry="6" fill="${c.ink}"/>
  <ellipse cx="74" cy="62" rx="5" ry="6" fill="${c.ink}"/>
  <circle cx="55.5" cy="60.5" r="1.8" fill="${c.hi}"/>
  <circle cx="75.5" cy="60.5" r="1.8" fill="${c.hi}"/>
  <path d="M64 68 L60 76 L64 74 L68 76 Z" fill="${c.accent}"/>
  <path d="M48 78 Q64 86 80 78" fill="none" stroke="${c.ink}" stroke-width="2" stroke-linecap="round"/>
`;
}

function drawDuck(c) {
  return `
  <ellipse cx="64" cy="72" rx="30" ry="24" fill="${c.fg}"/>
  <circle cx="78" cy="48" r="18" fill="${c.fg}"/>
  <ellipse cx="94" cy="50" rx="12" ry="6" fill="${c.accent}"/>
  <circle cx="84" cy="44" r="3.2" fill="${c.ink}"/>
  <circle cx="85" cy="43" r="1.1" fill="${c.hi}"/>
  <path d="M48 78 Q40 92 52 94 Q64 90 58 78" fill="${c.hi}" opacity="0.5"/>
  <ellipse cx="50" cy="86" rx="8" ry="4" fill="${c.accent}" opacity="0.8"/>
`;
}

function drawFox(c) {
  return `
  <path d="M64 96 L28 78 L40 40 L64 52 L88 40 L100 78 Z" fill="${c.fg}"/>
  <path d="M40 40 L28 18 L54 44 Z" fill="${c.fg}"/>
  <path d="M88 40 L100 18 L74 44 Z" fill="${c.fg}"/>
  <path d="M52 70 L64 86 L76 70 Z" fill="${c.hi}"/>
  <circle cx="52" cy="62" r="4.5" fill="${c.ink}"/>
  <circle cx="76" cy="62" r="4.5" fill="${c.ink}"/>
  <path d="M64 70 L61 76 L64 75 L67 76 Z" fill="${c.ink}"/>
`;
}

function drawWolf(c) {
  return `
  <path d="M64 98 L30 70 L38 36 L64 48 L90 36 L98 70 Z" fill="${c.fg}"/>
  <path d="M38 36 L30 12 L54 40 Z" fill="${c.fg}"/>
  <path d="M90 36 L98 12 L74 40 Z" fill="${c.fg}"/>
  <circle cx="52" cy="58" r="4" fill="${c.accent}"/>
  <circle cx="76" cy="58" r="4" fill="${c.accent}"/>
  <path d="M64 64 L58 74 L64 72 L70 74 Z" fill="${c.ink}"/>
  <path d="M48 80 Q64 90 80 80" fill="none" stroke="${c.ink}" stroke-width="2"/>
`;
}

function drawFrog(c) {
  return `
  <ellipse cx="64" cy="72" rx="32" ry="26" fill="${c.fg}"/>
  <circle cx="46" cy="48" r="14" fill="${c.fg}"/>
  <circle cx="82" cy="48" r="14" fill="${c.fg}"/>
  <circle cx="46" cy="48" r="7" fill="${c.hi}"/>
  <circle cx="82" cy="48" r="7" fill="${c.hi}"/>
  <circle cx="46" cy="48" r="3.5" fill="${c.ink}"/>
  <circle cx="82" cy="48" r="3.5" fill="${c.ink}"/>
  <path d="M48 78 Q64 92 80 78" fill="none" stroke="${c.ink}" stroke-width="3" stroke-linecap="round"/>
`;
}

function drawApe(c) {
  return `
  <ellipse cx="64" cy="70" rx="30" ry="28" fill="${c.fg}"/>
  <ellipse cx="64" cy="78" rx="18" ry="14" fill="${c.hi}"/>
  <circle cx="48" cy="58" r="7" fill="${c.ink}"/>
  <circle cx="80" cy="58" r="7" fill="${c.ink}"/>
  <circle cx="50" cy="56" r="2" fill="${c.hi}"/>
  <circle cx="82" cy="56" r="2" fill="${c.hi}"/>
  <ellipse cx="64" cy="72" rx="8" ry="6" fill="${c.accent}"/>
  <path d="M52 86 Q64 94 76 86" fill="none" stroke="${c.ink}" stroke-width="2"/>
`;
}

function drawBear(c) {
  return `
  <circle cx="40" cy="42" r="12" fill="${c.fg}"/>
  <circle cx="88" cy="42" r="12" fill="${c.fg}"/>
  <circle cx="40" cy="42" r="6" fill="${c.accent}"/>
  <circle cx="88" cy="42" r="6" fill="${c.accent}"/>
  <ellipse cx="64" cy="70" rx="34" ry="30" fill="${c.fg}"/>
  <circle cx="52" cy="66" r="5" fill="${c.ink}"/>
  <circle cx="76" cy="66" r="5" fill="${c.ink}"/>
  <ellipse cx="64" cy="80" rx="9" ry="7" fill="${c.accent}"/>
`;
}

function drawPup(c) {
  return `
  <ellipse cx="64" cy="72" rx="28" ry="26" fill="${c.fg}"/>
  <ellipse cx="34" cy="58" rx="10" ry="16" fill="${c.fg}" transform="rotate(-20 34 58)"/>
  <ellipse cx="94" cy="58" rx="10" ry="16" fill="${c.fg}" transform="rotate(20 94 58)"/>
  <circle cx="54" cy="68" r="4.5" fill="${c.ink}"/>
  <circle cx="74" cy="68" r="4.5" fill="${c.ink}"/>
  <ellipse cx="64" cy="80" rx="6" ry="4" fill="${c.accent}"/>
  <circle cx="96" cy="88" r="8" fill="${c.fg}"/>
`;
}

function drawPanda(c) {
  return `
  <circle cx="40" cy="40" r="14" fill="${c.ink}"/>
  <circle cx="88" cy="40" r="14" fill="${c.ink}"/>
  <ellipse cx="64" cy="70" rx="34" ry="30" fill="${c.hi}"/>
  <ellipse cx="50" cy="64" rx="10" ry="12" fill="${c.ink}"/>
  <ellipse cx="78" cy="64" rx="10" ry="12" fill="${c.ink}"/>
  <circle cx="52" cy="64" r="3.5" fill="${c.hi}"/>
  <circle cx="80" cy="64" r="3.5" fill="${c.hi}"/>
  <ellipse cx="64" cy="80" rx="8" ry="6" fill="${c.ink}"/>
`;
}

function drawShark(c) {
  return `
  <path d="M20 70 Q48 40 96 58 Q110 64 96 78 Q48 100 20 70 Z" fill="${c.fg}"/>
  <path d="M58 48 L70 22 L78 52 Z" fill="${c.fg}"/>
  <path d="M40 78 L32 98 L52 84 Z" fill="${c.fg}"/>
  <circle cx="88" cy="62" r="4" fill="${c.ink}"/>
  <path d="M96 70 L108 66 L96 74 Z" fill="${c.hi}"/>
`;
}

function drawDragon(c) {
  return `
  <path d="M30 80 Q40 40 70 48 Q98 54 100 78 Q90 100 60 96 Q34 92 30 80 Z" fill="${c.fg}"/>
  <path d="M70 48 L86 22 L90 50" fill="${c.accent}"/>
  <circle cx="82" cy="68" r="5" fill="${c.ink}"/>
  <circle cx="83.5" cy="66.5" r="1.8" fill="${c.hi}"/>
  <path d="M96 78 Q108 72 112 84 Q100 86 96 78 Z" fill="${c.accent}"/>
  <path d="M40 70 Q50 60 58 72" fill="none" stroke="${c.hi}" stroke-width="2"/>
`;
}

function drawRocket(c) {
  return `
  <path d="M64 18 L84 70 L64 60 L44 70 Z" fill="${c.fg}"/>
  <circle cx="64" cy="48" r="8" fill="${c.hi}"/>
  <circle cx="64" cy="48" r="4" fill="${c.accent}"/>
  <path d="M44 70 L34 90 L52 78 Z" fill="${c.accent}"/>
  <path d="M84 70 L94 90 L76 78 Z" fill="${c.accent}"/>
  <path d="M58 78 L64 108 L70 78 Z" fill="${c.hi}"/>
  <circle cx="56" cy="100" r="3" fill="${c.accent}" opacity="0.7"/>
  <circle cx="72" cy="106" r="2.5" fill="${c.accent}" opacity="0.6"/>
`;
}

function drawMoon(c) {
  return `
  <circle cx="64" cy="64" r="34" fill="${c.fg}"/>
  <circle cx="78" cy="54" r="28" fill="${c.bg}"/>
  <circle cx="48" cy="70" r="4" fill="${c.accent}" opacity="0.45"/>
  <circle cx="58" cy="48" r="3" fill="${c.accent}" opacity="0.35"/>
  <circle cx="40" cy="50" r="2" fill="${c.hi}" opacity="0.8"/>
`;
}

function drawBolt(c) {
  return `
  <path d="M72 18 L42 68 L60 68 L52 110 L90 52 L70 52 Z" fill="${c.fg}"/>
  <path d="M72 18 L54 52 L68 52 Z" fill="${c.hi}" opacity="0.45"/>
`;
}

function drawOrb(c) {
  return `
  <circle cx="64" cy="64" r="34" fill="url(#orbG)"/>
  <ellipse cx="52" cy="48" rx="14" ry="8" fill="${c.hi}" opacity="0.45"/>
  <circle cx="64" cy="64" r="34" fill="none" stroke="${c.accent}" stroke-width="3" opacity="0.5"/>
`;
}

function drawWave(c) {
  return `
  <path d="M18 70 Q36 40 54 70 Q72 100 90 70 Q108 40 118 60" fill="none" stroke="${c.fg}" stroke-width="10" stroke-linecap="round"/>
  <path d="M18 86 Q36 56 54 86 Q72 116 90 86 Q108 56 118 76" fill="none" stroke="${c.accent}" stroke-width="7" stroke-linecap="round" opacity="0.7"/>
  <circle cx="40" cy="40" r="4" fill="${c.hi}"/>
`;
}

function drawBean(c) {
  return `
  <ellipse cx="64" cy="64" rx="26" ry="36" fill="${c.fg}" transform="rotate(-18 64 64)"/>
  <ellipse cx="56" cy="52" rx="8" ry="12" fill="${c.hi}" opacity="0.35" transform="rotate(-18 56 52)"/>
  <path d="M58 40 Q70 64 60 92" fill="none" stroke="${c.accent}" stroke-width="3" opacity="0.5"/>
`;
}

function drawCoin(c) {
  return `
  <circle cx="64" cy="64" r="36" fill="${c.fg}"/>
  <circle cx="64" cy="64" r="28" fill="none" stroke="${c.hi}" stroke-width="4"/>
  <text x="64" y="74" text-anchor="middle" font-family="Arial Black,Arial,sans-serif"
    font-size="28" font-weight="800" fill="${c.ink}">◎</text>
`;
}

function drawNinja(c) {
  return `
  <circle cx="64" cy="64" r="34" fill="${c.fg}"/>
  <rect x="30" y="54" width="68" height="18" rx="4" fill="${c.ink}"/>
  <circle cx="50" cy="63" r="4" fill="${c.accent}"/>
  <circle cx="78" cy="63" r="4" fill="${c.accent}"/>
  <path d="M64 20 L70 40 L58 40 Z" fill="${c.hi}"/>
`;
}

function drawCrown(c) {
  return `
  <path d="M28 78 L36 40 L52 60 L64 32 L76 60 L92 40 L100 78 Z" fill="${c.fg}"/>
  <rect x="28" y="78" width="72" height="14" rx="3" fill="${c.accent}"/>
  <circle cx="36" cy="40" r="5" fill="${c.hi}"/>
  <circle cx="64" cy="32" r="6" fill="${c.hi}"/>
  <circle cx="92" cy="40" r="5" fill="${c.hi}"/>
`;
}

function drawByte(c) {
  return `
  <rect x="30" y="36" width="68" height="56" rx="10" fill="${c.fg}"/>
  <rect x="40" y="48" width="20" height="8" rx="2" fill="${c.hi}"/>
  <rect x="68" y="48" width="20" height="8" rx="2" fill="${c.hi}"/>
  <rect x="40" y="64" width="48" height="8" rx="2" fill="${c.accent}"/>
  <circle cx="64" cy="100" r="6" fill="${c.fg}"/>
`;
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * @param {{ name?: string, symbol?: string, salt?: string }} opts
 * @returns {string} data:image/svg+xml;base64,...
 */
export function generateCoinLogoDataUrl(opts = {}) {
  const name = String(opts.name || "COIN").trim() || "COIN";
  const symbol = String(opts.symbol || "X").trim().toUpperCase() || "X";
  const salt = String(opts.salt || Date.now());
  const seed = hashStr(`${name}|${symbol}|${salt}`);

  const palette = PALETTES[seed % PALETTES.length];
  const h1 = palette[0] + (seed % 25);
  const h2 = palette[1] + ((seed >> 7) % 30);
  const h3 = palette[2] + ((seed >> 14) % 35);

  const bg = hsl((h1 + 160) % 360, 22, 11);
  const fg = hsl(h1, 70, 58);
  const accent = hsl(h2, 75, 52);
  const hi = hsl(h3, 40, 88);
  const ink = hsl(h1, 30, 12);

  const theme = detectTheme(name);
  const art = theme.draw({ bg, fg, accent, hi, ink });

  const letters = symbol.replace(/[^A-Z0-9]/g, "").slice(0, 3) || "X";
  // Tiny ticker chip — mascot stays the hero
  const chip = `
  <rect x="78" y="92" width="38" height="20" rx="8" fill="rgba(0,0,0,.45)"/>
  <text x="97" y="106" text-anchor="middle" font-family="Arial Black,Arial,sans-serif"
    font-size="9" font-weight="800" fill="#fff">${escapeXml(letters)}</text>`;

  const stars =
    seed % 3 === 0
      ? `<circle cx="22" cy="28" r="1.5" fill="${hi}" opacity="0.7"/>
         <circle cx="108" cy="36" r="2" fill="${hi}" opacity="0.55"/>
         <circle cx="100" cy="22" r="1.2" fill="${hi}" opacity="0.8"/>`
      : "";

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="bgG" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${hsl(h1, 35, 16)}"/>
      <stop offset="100%" stop-color="${hsl(h2, 40, 10)}"/>
    </linearGradient>
    <linearGradient id="orbG" x1="20%" y1="15%" x2="85%" y2="90%">
      <stop offset="0%" stop-color="${hi}"/>
      <stop offset="55%" stop-color="${fg}"/>
      <stop offset="100%" stop-color="${accent}"/>
    </linearGradient>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-opacity="0.35"/>
    </filter>
  </defs>
  <rect width="128" height="128" rx="28" fill="url(#bgG)"/>
  ${stars}
  <g filter="url(#soft)">
    ${art}
  </g>
  ${chip}
</svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}
