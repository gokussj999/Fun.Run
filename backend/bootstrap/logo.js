/**
 * Procedural coin logos as SVG data URLs — no external assets required.
 * Each call produces a unique-looking mark from name/symbol + salt.
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
  return `hsl(${h % 360} ${s}% ${l}%)`;
}

const PALETTES = [
  [12, 28, 195],
  [38, 165, 92],
  [200, 48, 18],
  [280, 140, 55],
  [160, 210, 40],
  [320, 25, 190],
  [75, 185, 25],
  [240, 90, 120],
];

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
  const h1 = (palette[0] + (seed % 40)) % 360;
  const h2 = (palette[1] + ((seed >> 8) % 50)) % 360;
  const h3 = (palette[2] + ((seed >> 16) % 60)) % 360;

  const letters = symbol.replace(/[^A-Z0-9]/g, "").slice(0, 3) || name.slice(0, 2).toUpperCase();
  const shape = seed % 4; // 0 circle, 1 rounded square, 2 diamond, 3 hex-ish
  const ring = (seed >> 4) % 2 === 0;
  const dots = 3 + (seed % 5);
  const rot = (seed % 360);

  let badge = "";
  if (shape === 0) {
    badge = `<circle cx="64" cy="64" r="46" fill="url(#g)"/>`;
  } else if (shape === 1) {
    badge = `<rect x="18" y="18" width="92" height="92" rx="22" fill="url(#g)"/>`;
  } else if (shape === 2) {
    badge = `<path d="M64 14 L114 64 L64 114 L14 64 Z" fill="url(#g)"/>`;
  } else {
    badge = `<path d="M64 12 L108 38 L108 90 L64 116 L20 90 L20 38 Z" fill="url(#g)"/>`;
  }

  let accents = "";
  if (ring) {
    accents += `<circle cx="64" cy="64" r="52" fill="none" stroke="${hsl(h3, 55, 72)}" stroke-width="3" opacity="0.55"/>`;
  }
  for (let i = 0; i < dots; i++) {
    const a = ((seed + i * 47) % 360) * (Math.PI / 180);
    const r = 38 + ((seed >> (i + 2)) % 14);
    const cx = 64 + Math.cos(a) * r;
    const cy = 64 + Math.sin(a) * r;
    accents += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${2 + (i % 3)}" fill="${hsl(h2 + i * 20, 70, 78)}" opacity="0.7"/>`;
  }

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${hsl(h1, 72, 48)}"/>
      <stop offset="100%" stop-color="${hsl(h2, 68, 38)}"/>
    </linearGradient>
    <filter id="s" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.25"/>
    </filter>
  </defs>
  <rect width="128" height="128" rx="28" fill="${hsl((h1 + 180) % 360, 18, 12)}"/>
  <g filter="url(#s)" transform="rotate(${rot} 64 64)">
    ${badge}
    ${accents}
  </g>
  <text x="64" y="72" text-anchor="middle" font-family="Arial Black, Arial, sans-serif"
    font-size="${letters.length > 2 ? 28 : 36}" font-weight="800" fill="#fff"
    style="letter-spacing:1px">${escapeXml(letters)}</text>
</svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
