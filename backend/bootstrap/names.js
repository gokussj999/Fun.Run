const ADJ = [
  "Turbo", "Cosmic", "Neon", "Lucky", "Spicy", "Silent", "Atomic", "Golden",
  "Pixel", "Hyper", "Chill", "Rapid", "Solar", "Frost", "Wild", "Mighty",
  "Quantum", "Blazing", "Tiny", "Ultra", "Soft", "Iron", "Crystal", "Nova",
];

const NOUN = [
  "Fox", "Pepe", "Duck", "Cat", "Wolf", "Frog", "Ape", "Bear",
  "Orb", "Rocket", "Wave", "Bean", "Coin", "Pup", "Dragon", "Moon",
  "Bolt", "Ghost", "Shark", "Panda", "Giga", "Ninja", "King", "Byte",
];

const SUFFIX = ["", "", "", "Inu", "Fi", "AI", "X", "DAO", "Labs", "Run"];

const STORIES = [
  "Community memecoin with chaotic energy and zero roadmap promises.",
  "Built for the timeline. Trade the vibe, not the whitepaper.",
  "A silly launchpad experiment that somehow got serious holders.",
  "Fast chart, loud community, soft landing optional.",
  "Just a coin that showed up and started moving.",
  "For degen hours and quiet overnight dips alike.",
];

function pick(arr, rnd) {
  return arr[Math.floor(rnd() * arr.length)];
}

function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * @param {Set<string>} [usedSymbols]
 * @returns {{ name: string, symbol: string, story: string }}
 */
export function generateCoinIdentity(usedSymbols = new Set(), seed = Date.now()) {
  const rnd = mulberry32(seed >>> 0);
  for (let attempt = 0; attempt < 40; attempt++) {
    const adj = pick(ADJ, rnd);
    const noun = pick(NOUN, rnd);
    const suf = pick(SUFFIX, rnd);
    const name = `${adj} ${noun}${suf ? " " + suf : ""}`.trim();
    let symbol = (adj.slice(0, 1) + noun.slice(0, 2) + (suf ? suf.slice(0, 1) : "")).toUpperCase();
    if (symbol.length < 3) symbol = (noun.slice(0, 3) + adj.slice(0, 1)).toUpperCase();
    symbol = symbol.replace(/[^A-Z0-9]/g, "").slice(0, 8);
    if (!symbol || usedSymbols.has(symbol)) {
      symbol = `${symbol}${(Math.floor(rnd() * 90) + 10)}`.slice(0, 10);
    }
    if (!usedSymbols.has(symbol)) {
      usedSymbols.add(symbol);
      return {
        name: name.slice(0, 60),
        symbol,
        story: pick(STORIES, rnd),
      };
    }
  }
  const fallback = `Coin${String(seed).slice(-5)}`;
  return { name: fallback, symbol: `C${String(seed).slice(-4)}`, story: pick(STORIES, rnd) };
}
