/**
 * MEXC-style shareable 24h pump card (canvas → PNG).
 * Layout mirrors MEXC futures share: big % + right sparkline + white promo footer + QR.
 */

import { fmtUsd, safeNum } from "./coin-display.js";

function pad(n) {
  return String(n).padStart(2, "0");
}

function stampNow() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image load failed"));
    img.src = src;
  });
}

async function loadQrImage(data) {
  const encoded = encodeURIComponent(String(data || "https://fun.run").slice(0, 500));
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encoded}`;
  try {
    return await loadImage(url);
  } catch {
    return null;
  }
}

function drawSparkline(ctx, points, x, y, w, h, up) {
  const vals = (points || [])
    .map((p) => safeNum(p?.p ?? p?.price ?? p, 0))
    .filter((v) => v > 0);

  const color = up ? "#00C087" : "#F6465D";
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 3.5;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();

  if (vals.length < 2) {
    ctx.moveTo(x, y + h * 0.72);
    ctx.quadraticCurveTo(x + w * 0.32, y + h * (up ? 0.78 : 0.28), x + w * 0.55, y + h * 0.42);
    ctx.quadraticCurveTo(x + w * 0.78, y + h * (up ? 0.12 : 0.82), x + w, y + h * (up ? 0.08 : 0.88));
    ctx.stroke();

    const bx = x;
    const by = y + h * 0.72;
    drawBuyMarker(ctx, bx, by, color);
    return;
  }

  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = Math.max(1e-12, max - min);

  vals.forEach((v, i) => {
    const px = x + (i / (vals.length - 1)) * w;
    const py = y + h - ((v - min) / span) * h * 0.92 - h * 0.04;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.stroke();

  const bx = x;
  const by = y + h - ((vals[0] - min) / span) * h * 0.92 - h * 0.04;
  drawBuyMarker(ctx, bx, by, color);
}

function drawBuyMarker(ctx, bx, by, color) {
  // Speech-bubble "B" like MEXC
  const cx = bx + 2;
  const cy = by - 18;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx - 5, cy + 10);
  ctx.lineTo(cx + 6, cy + 8);
  ctx.lineTo(cx, cy + 20);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#04140f";
  ctx.font = "bold 13px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("B", cx, cy + 0.5);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

/**
 * @returns {Promise<Blob>}
 */
export async function renderPumpShareCard({
  coin,
  move24h = 0,
  marketCap = 0,
  price = 0,
  chartPoints = [],
  brand = "Fun.Run",
  shareUrl = "",
  referralCode = "",
}) {
  const W = 750;
  const H = 1334;
  const FOOTER = 250;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  const up = move24h >= 0;
  const accent = up ? "#00C087" : "#F6465D";
  const symbol = String(coin?.symbol || "COIN").toUpperCase();
  const link =
    String(shareUrl || (typeof window !== "undefined" ? window.location.href : "") || "https://fun.run").trim() ||
    "https://fun.run";

  // Approx entry from 24h move (MEXC "Entry" / current "Fair")
  const moveFrac = move24h / 100;
  const entryPrice = moveFrac > -0.999 && Math.abs(moveFrac) > 1e-9 ? price / (1 + moveFrac) : price;

  // Dark body
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, W, H - FOOTER);

  // Brand (yellow like Fun.Run accent / MEXC logo spot)
  ctx.fillStyle = "#FCD535";
  ctx.font = "bold 44px Arial Black, Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(brand, 40, 44);

  ctx.fillStyle = "#848E9C";
  ctx.font = "24px Arial";
  ctx.fillText(`Shared on ${stampNow()}`, 40, 104);

  // Pair
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 48px Arial Black, Arial, sans-serif";
  ctx.fillText(`${symbol}/SOL`, 40, 180);

  // Long | 24H  (MEXC: Long | 100X)
  ctx.font = "bold 28px Arial";
  ctx.fillStyle = accent;
  ctx.fillText(up ? "Long" : "Short", 40, 250);
  const sideW = ctx.measureText(up ? "Long" : "Short").width;
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText("  |  24H", 40 + sideW, 250);

  // Huge % LEFT + sparkline RIGHT (same band as MEXC)
  const pctText = `${up ? "+" : ""}${Number(move24h).toFixed(2)}%`;
  ctx.fillStyle = accent;
  ctx.font = "bold 96px Arial Black, Arial, sans-serif";
  ctx.fillText(pctText, 40, 330);

  drawSparkline(ctx, chartPoints, W - 310, 300, 250, 200, up);

  // Entry / Fair (MEXC labels) + Market Cap
  const statsY = 620;
  ctx.font = "26px Arial";
  ctx.fillStyle = "#848E9C";
  ctx.textAlign = "left";
  ctx.fillText("Entry Price", 40, statsY);
  ctx.fillText("Fair Price", 40, statsY + 64);
  ctx.fillText("Market Cap", 40, statsY + 128);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 28px Arial";
  ctx.textAlign = "right";
  ctx.fillText(fmtUsd(entryPrice), W - 40, statsY);
  ctx.fillText(fmtUsd(price), W - 40, statsY + 64);
  ctx.fillText(fmtUsd(marketCap), W - 40, statsY + 128);
  ctx.textAlign = "left";

  // White footer
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, H - FOOTER, W, FOOTER);

  const qr = await loadQrImage(link);
  const qrSize = 150;
  const qrX = W - 40 - qrSize;
  const qrY = H - FOOTER + (FOOTER - qrSize) / 2;

  if (qr) {
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(qrX - 6, qrY - 6, qrSize + 12, qrSize + 12);
    ctx.drawImage(qr, qrX, qrY, qrSize, qrSize);
  } else {
    // Fallback badge if QR CDN blocked
    ctx.fillStyle = "#F1F1F1";
    ctx.fillRect(qrX, qrY, qrSize, qrSize);
    ctx.fillStyle = "#0B0E11";
    ctx.font = "bold 22px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Scan", qrX + qrSize / 2, qrY + qrSize / 2);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  }

  const textMax = qrX - 56;
  ctx.fillStyle = "#0B0E11";
  ctx.font = "bold 28px Arial";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  wrapText(ctx, `Join ${brand} and catch the next meme pump early.`, 40, H - FOOTER + 42, textMax, 36);

  ctx.fillStyle = "#848E9C";
  ctx.font = "22px Arial";
  const code = String(referralCode || "").trim();
  if (code) {
    ctx.fillText(`Referral Code  ${code}`, 40, H - 70);
  } else {
    const short = link.replace(/^https?:\/\//, "").slice(0, 36);
    ctx.fillText(short, 40, H - 70);
  }

  return await new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error("Failed to render share card"));
      else resolve(blob);
    }, "image/png");
  });
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = String(text).split(/\s+/);
  let line = "";
  let yy = y;
  for (let i = 0; i < words.length; i++) {
    const test = line ? `${line} ${words[i]}` : words[i];
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, yy);
      line = words[i];
      yy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, yy);
}

export async function downloadPumpShareCard(opts) {
  const blob = await renderPumpShareCard(opts);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${String(opts?.coin?.symbol || "coin").toUpperCase()}-24h-pump.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
  return blob;
}

export async function sharePumpShareCard(opts) {
  const blob = await renderPumpShareCard(opts);
  const file = new File([blob], `${String(opts?.coin?.symbol || "coin").toUpperCase()}-24h-pump.png`, {
    type: "image/png",
  });
  const title = `${opts?.coin?.symbol || "Coin"} 24h ${opts?.move24h >= 0 ? "+" : ""}${Number(opts?.move24h || 0).toFixed(2)}%`;
  const text = `${title} · MC ${fmtUsd(opts?.marketCap || 0)} on Fun.Run`;

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title, text });
    return { shared: true };
  }

  await downloadPumpShareCard(opts);
  return { shared: false, downloaded: true };
}
