// Lapar Kilat's renderer: one canvas, everything drawn in code — the teal
// warung walls, the wood counters, the food, the cook, the order board and
// the clock. Nothing is loaded from a file, so the screenshots are the game.
import { BIN_H, BIN_Y, BINS, FLOOR, PALETTE, STATIONS, VIEW } from './config.js';
import { COMPONENTS, INGREDIENTS, matchRecipe, recipeById } from './recipes.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, weight = 'bold', align = 'center') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

// --- food icons: every ingredient and finished component, drawn in code ---

export function drawFoodIcon(ctx, id, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  switch (id) {
    case 'nasi':
      ctx.fillStyle = '#f7f3e6';
      ctx.beginPath(); ctx.ellipse(0, 2, 15 * s, 9 * s, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#e8e0c8';
      for (const [dx, dy] of [[-8, -2], [0, -6], [8, -2], [-4, 2], [5, 3]]) { ctx.beginPath(); ctx.arc(dx * s, dy * s, 1.6 * s, 0, 7); ctx.fill(); }
      break;
    case 'mie':
      ctx.strokeStyle = '#f2c14e'; ctx.lineWidth = 3 * s; ctx.lineCap = 'round';
      for (let i = -1; i <= 1; i += 1) {
        ctx.beginPath();
        ctx.moveTo(-13 * s, i * 6 * s);
        ctx.quadraticCurveTo(-5 * s, i * 6 * s - 6 * s, 3 * s, i * 6 * s);
        ctx.quadraticCurveTo(9 * s, i * 6 * s + 5 * s, 13 * s, i * 6 * s);
        ctx.stroke();
      }
      break;
    case 'ayam':
      ctx.fillStyle = '#f2a594';
      ctx.beginPath(); ctx.arc(-2 * s, 0, 10 * s, 0, 7); ctx.fill();
      ctx.strokeStyle = '#f7f3e6'; ctx.lineWidth = 4 * s; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(6 * s, 4 * s); ctx.lineTo(13 * s, 11 * s); ctx.stroke();
      ctx.fillStyle = '#f7f3e6';
      ctx.beginPath(); ctx.arc(14 * s, 12 * s, 3 * s, 0, 7); ctx.fill();
      break;
    case 'telur':
      ctx.fillStyle = '#fdfdf6';
      ctx.beginPath(); ctx.ellipse(0, 0, 14 * s, 10 * s, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#f7c948';
      ctx.beginPath(); ctx.arc(0, 0, 6 * s, 0, 7); ctx.fill();
      break;
    case 'sayur':
      ctx.fillStyle = '#58a34a';
      for (const a of [0, 1.2, 2.4, 3.6, 4.8]) {
        ctx.beginPath(); ctx.ellipse(Math.cos(a) * 7 * s, Math.sin(a) * 6 * s, 7 * s, 4 * s, a, 0, 7); ctx.fill();
      }
      ctx.fillStyle = '#7cc46a';
      ctx.beginPath(); ctx.arc(0, 0, 4 * s, 0, 7); ctx.fill();
      break;
    case 'cabai':
      ctx.strokeStyle = '#d64541'; ctx.lineWidth = 6 * s; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-11 * s, -8 * s); ctx.quadraticCurveTo(8 * s, -10 * s, 11 * s, 8 * s); ctx.stroke();
      ctx.strokeStyle = '#3d7a33'; ctx.lineWidth = 3 * s;
      ctx.beginPath(); ctx.moveTo(-11 * s, -8 * s); ctx.lineTo(-15 * s, -13 * s); ctx.stroke();
      break;
    case 'kacang':
      ctx.fillStyle = '#8a5a2b';
      ctx.beginPath(); ctx.ellipse(0, 2, 14 * s, 8 * s, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#c98f4e';
      for (const [dx, dy] of [[-6, -1], [1, -4], [7, 0]]) { ctx.beginPath(); ctx.arc(dx * s, dy * s, 2.4 * s, 0, 7); ctx.fill(); }
      break;
    case 'bawang':
      ctx.fillStyle = '#c9a7d6';
      ctx.beginPath(); ctx.arc(0, 0, 11 * s, 0, 7); ctx.fill();
      ctx.strokeStyle = '#efe6f5'; ctx.lineWidth = 2 * s;
      ctx.beginPath(); ctx.arc(0, 0, 7 * s, 0, 7); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, 3 * s, 0, 7); ctx.stroke();
      break;
    case 'nasi-goreng':
      ctx.fillStyle = '#e8b64c';
      ctx.beginPath(); ctx.ellipse(0, 3, 15 * s, 9 * s, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#c0392b';
      ctx.beginPath(); ctx.arc(-6 * s, -3 * s, 2 * s, 0, 7); ctx.fill();
      ctx.fillStyle = '#4c9a3f';
      ctx.beginPath(); ctx.arc(4 * s, -4 * s, 2 * s, 0, 7); ctx.fill();
      break;
    case 'mie-goreng':
      ctx.strokeStyle = '#e09a2b'; ctx.lineWidth = 3.4 * s; ctx.lineCap = 'round';
      for (let i = -1; i <= 1; i += 1) {
        ctx.beginPath(); ctx.moveTo(-13 * s, i * 6 * s);
        ctx.quadraticCurveTo(-4 * s, i * 6 * s - 7 * s, 4 * s, i * 6 * s);
        ctx.quadraticCurveTo(10 * s, i * 6 * s + 6 * s, 13 * s, i * 6 * s); ctx.stroke();
      }
      ctx.fillStyle = '#d64541';
      ctx.beginPath(); ctx.arc(8 * s, -7 * s, 2 * s, 0, 7); ctx.fill();
      break;
    case 'sate-ayam':
      ctx.strokeStyle = '#8a5a2b'; ctx.lineWidth = 2.4 * s;
      ctx.beginPath(); ctx.moveTo(-14 * s, 6 * s); ctx.lineTo(14 * s, -6 * s); ctx.stroke();
      ctx.fillStyle = '#b4552d';
      for (const t of [0.25, 0.5, 0.75]) {
        ctx.beginPath(); ctx.arc((-14 + 28 * t) * s, (6 - 12 * t) * s, 5 * s, 0, 7); ctx.fill();
      }
      break;
    case 'telur-goreng':
      ctx.fillStyle = '#fdfdf6';
      ctx.beginPath(); ctx.ellipse(0, 0, 14 * s, 10 * s, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#f7c948';
      ctx.beginPath(); ctx.arc(1 * s, -1 * s, 6.5 * s, 0, 7); ctx.fill();
      ctx.fillStyle = '#e8a33d';
      ctx.beginPath(); ctx.arc(1 * s, -1 * s, 3 * s, 0, 7); ctx.fill();
      break;
    case 'sayur-cincang':
      ctx.strokeStyle = '#4c9a3f'; ctx.lineWidth = 3 * s; ctx.lineCap = 'round';
      for (const [x1, y1, x2, y2] of [[-12, -6, -2, -8], [-8, 0, 4, -2], [-10, 6, 2, 8], [0, -4, 12, -6], [-2, 4, 12, 6]]) {
        ctx.beginPath(); ctx.moveTo(x1 * s, y1 * s); ctx.lineTo(x2 * s, y2 * s); ctx.stroke();
      }
      break;
    case 'cabai-cincang':
      ctx.fillStyle = '#c0392b';
      for (const [dx, dy] of [[-8, -4], [0, -7], [8, -3], [-4, 4], [6, 5]]) { ctx.beginPath(); ctx.arc(dx * s, dy * s, 3 * s, 0, 7); ctx.fill(); }
      break;
    case 'bawang-cincang':
      ctx.fillStyle = '#b48ec9';
      for (const [dx, dy] of [[-9, -3], [-1, -6], [7, -2], [-5, 5], [5, 5]]) { ctx.beginPath(); ctx.arc(dx * s, dy * s, 3.2 * s, 0, 7); ctx.fill(); }
      break;
    case 'es-teh':
      ctx.fillStyle = '#e8eef2';
      ctx.fillRect(-7 * s, -11 * s, 14 * s, 22 * s);
      ctx.fillStyle = '#c97b2d';
      ctx.fillRect(-5 * s, -4 * s, 10 * s, 13 * s);
      ctx.fillStyle = '#fff';
      ctx.fillRect(-4 * s, -8 * s, 3 * s, 3 * s); ctx.fillRect(1 * s, -9 * s, 3 * s, 3 * s);
      ctx.strokeStyle = '#d64541'; ctx.lineWidth = 2.4 * s;
      ctx.beginPath(); ctx.moveTo(4 * s, -11 * s); ctx.lineTo(9 * s, -16 * s); ctx.stroke();
      break;
    default: break;
  }
  ctx.restore();
}

function drawProgressRing(ctx, x, y, r, frac, color) {
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 6;
  ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke();
  ctx.strokeStyle = color;
  ctx.beginPath(); ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2); ctx.stroke();
}

function drawStationBase(ctx, s, glow) {
  if (glow) {
    ctx.save();
    ctx.shadowColor = glow;
    ctx.shadowBlur = 22;
    ctx.fillStyle = PALETTE.wood;
    rr(ctx, s.x, s.y, s.w, s.h, 12);
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = PALETTE.wood;
  rr(ctx, s.x, s.y, s.w, s.h, 12);
  ctx.fill();
  ctx.fillStyle = PALETTE.woodDark;
  rr(ctx, s.x, s.y + s.h - 14, s.w, 14, 7);
  ctx.fill();
  text(ctx, s.label, s.x + s.w / 2, s.y + 16, 15, '#fff8e7');
  if (s.sub) text(ctx, s.sub, s.x + s.w / 2, s.y + 33, 11, '#e8cfa8', 'normal');
}

function drawCooker(ctx, world, id, station, cookSeconds) {
  const slot = world[id];
  const cx = station.x + station.w / 2;
  const cy = station.y + station.h / 2 + 16;
  let glow = null;
  if (slot.state === 'done') glow = '#f5b301';
  if (slot.state === 'burnt') glow = '#d64541';
  drawStationBase(ctx, station, glow);
  // The pan / grill grate.
  ctx.fillStyle = id === 'wok' ? '#2b2b2b' : '#3a3a3a';
  ctx.beginPath(); ctx.ellipse(cx, cy, 52, 26, 0, 0, 7); ctx.fill();
  if (id === 'grill') {
    ctx.strokeStyle = '#8a8a8a'; ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i += 1) {
      ctx.beginPath(); ctx.moveTo(cx - 44, cy + i * 9); ctx.lineTo(cx + 44, cy + i * 9); ctx.stroke();
    }
  }
  if (slot.state === 'cooking') {
    // Flames under the pan, food inside, a progress ring.
    ctx.fillStyle = '#e8762b';
    for (const [dx, dy, r] of [[-34, 26, 9], [-12, 30, 11], [12, 30, 10], [32, 26, 8]]) {
      ctx.beginPath(); ctx.arc(cx + dx, cy + dy, r, 0, 7); ctx.fill();
    }
    ctx.fillStyle = '#f5b301';
    for (const [dx, dy, r] of [[-22, 28, 5], [0, 32, 6], [20, 28, 5]]) {
      ctx.beginPath(); ctx.arc(cx + dx, cy + dy, r, 0, 7); ctx.fill();
    }
    if (slot.item) drawFoodIcon(ctx, slot.item, cx, cy - 2, 0.9);
    drawProgressRing(ctx, cx, cy, 30, Math.min(1, slot.progress / cookSeconds), '#f5b301');
  } else if (slot.state === 'done') {
    if (slot.item) drawFoodIcon(ctx, INGREDIENTS[slot.item].cooked, cx, cy - 2, 1.0);
    text(ctx, 'SIAP!', cx, cy + 38, 13, '#f5b301');
  } else if (slot.state === 'burnt') {
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.ellipse(cx, cy, 30, 12, 0, 0, 7); ctx.fill();
    text(ctx, 'GOSONG!', cx, cy + 38, 13, '#ff8a80');
  }
}

function drawChopBoard(ctx, world, station) {
  const slot = world.chop;
  const glow = slot.state === 'done' ? '#f5b301' : null;
  drawStationBase(ctx, station, glow);
  const cx = station.x + station.w / 2;
  const cy = station.y + station.h / 2 + 16;
  ctx.fillStyle = '#e8cfa8';
  rr(ctx, cx - 62, cy - 22, 124, 44, 8);
  ctx.fill();
  if (slot.state === 'chopping' || slot.state === 'done') {
    drawFoodIcon(ctx, slot.state === 'done' ? INGREDIENTS[slot.item].cooked : slot.item, cx, cy, 1.0);
    // Knife.
    ctx.save();
    ctx.translate(cx + 44, cy - 14);
    ctx.rotate(-0.5);
    ctx.fillStyle = '#cfd8dc';
    ctx.fillRect(0, -4, 30, 8);
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(-12, -4, 12, 8);
    ctx.restore();
    if (slot.state === 'chopping') {
      text(ctx, `CINCANG ${slot.hits}/3`, cx, cy + 38, 13, '#fff8e7');
      drawProgressRing(ctx, cx, cy, 30, slot.hits / 3, '#58a34a');
    } else {
      text(ctx, 'SIAP!', cx, cy + 38, 13, '#f5b301');
    }
  }
}

function drawAssembly(ctx, world, station) {
  const done = matchRecipe(world.plate.components);
  drawStationBase(ctx, station, done ? '#f5b301' : null);
  const cx = station.x + station.w / 2;
  const cy = station.y + station.h / 2 + 16;
  // The plate.
  ctx.fillStyle = '#fdfdf6';
  ctx.beginPath(); ctx.ellipse(cx, cy, 62, 26, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = '#d7ccc8'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(cx, cy, 62, 26, 0, 0, 7); ctx.stroke();
  const parts = world.plate.components;
  parts.forEach((comp, i) => {
    drawFoodIcon(ctx, comp, cx - 34 + i * 34, cy - 6, 0.85);
  });
  if (done) {
    text(ctx, `${done.name.toUpperCase()} — SIAP!`, cx, cy + 38, 13, '#f5b301');
  } else if (parts.length > 0) {
    text(ctx, `${parts.length} bahan di piring`, cx, cy + 38, 12, '#e8cfa8', 'normal');
  }
}

function drawServeWindow(ctx, world, station) {
  drawStationBase(ctx, station, world.dishInHands ? '#f5b301' : null);
  const cx = station.x + station.w / 2;
  const cy = station.y + station.h / 2 + 16;
  // Serving bell.
  ctx.fillStyle = '#f5b301';
  ctx.beginPath(); ctx.arc(cx, cy, 20, Math.PI, 0); ctx.fill();
  ctx.fillRect(cx - 20, cy - 2, 40, 5);
  ctx.fillStyle = '#8a5a2b';
  ctx.beginPath(); ctx.arc(cx, cy - 22, 4, 0, 7); ctx.fill();
  ctx.fillRect(cx - 2, cy - 22, 4, 8);
  if (world.dishInHands) {
    const recipe = recipeById(world.dishInHands);
    text(ctx, recipe.name, cx, cy + 36, 13, '#fff8e7');
  }
}

function drawPour(ctx, world, station) {
  const pouring = world.pour.state === 'pouring';
  drawStationBase(ctx, station, pouring ? '#f5b301' : null);
  const cx = station.x + station.w / 2;
  const cy = station.y + station.h / 2 + 16;
  drawFoodIcon(ctx, 'es-teh', cx - 18, cy, 1.1);
  drawFoodIcon(ctx, 'es-teh', cx + 18, cy, 1.1);
  if (pouring) drawProgressRing(ctx, cx, cy, 32, world.pour.progress / 1.2, '#f5b301');
}

function drawTrash(ctx, station) {
  drawStationBase(ctx, station, null);
  const cx = station.x + station.w / 2;
  const cy = station.y + station.h / 2 + 8;
  ctx.fillStyle = '#546e7a';
  rr(ctx, cx - 22, cy - 16, 44, 34, 5);
  ctx.fill();
  ctx.fillStyle = '#37474f';
  ctx.fillRect(cx - 26, cy - 22, 52, 8);
}

function drawBins(ctx, world) {
  ctx.fillStyle = PALETTE.counter;
  rr(ctx, 240, BIN_Y - 12, 1056, BIN_H + 24, 14);
  ctx.fill();
  text(ctx, 'BAHAN — klik / tekan E di dekat bin', 768, BIN_Y + 4, 12, '#e8cfa8', 'normal');
  for (const bin of BINS) {
    const ing = INGREDIENTS[bin.id];
    const cx = bin.x + bin.w / 2;
    const cy = BIN_Y + BIN_H / 2 + 8;
    ctx.fillStyle = '#f3e3c3';
    rr(ctx, bin.x, BIN_Y + 14, bin.w, BIN_H - 14, 10);
    ctx.fill();
    drawFoodIcon(ctx, bin.id, cx, cy - 8, 1.15);
    text(ctx, ing.name, cx, BIN_Y + BIN_H - 12, 13, PALETTE.ink);
  }
}

function drawCook(ctx, world) {
  const { x, y, facing, moving } = world.cook;
  const bob = moving ? Math.sin(world.elapsed * 14) * 2 : 0;
  ctx.save();
  ctx.translate(x, y + bob);
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath(); ctx.ellipse(0, 24 - bob, 24, 7, 0, 0, 7); ctx.fill();
  // Body + apron.
  ctx.fillStyle = '#f5f5f5';
  rr(ctx, -18, -6, 36, 34, 12);
  ctx.fill();
  ctx.fillStyle = '#d64541';
  ctx.fillRect(-18, 12, 36, 6);
  // Head.
  ctx.fillStyle = '#f2c89b';
  ctx.beginPath(); ctx.arc(0, -18, 15, 0, 7); ctx.fill();
  // Chef hat.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(-9, -30, 9, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -34, 10, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(9, -30, 9, 0, 7); ctx.fill();
  ctx.fillRect(-14, -32, 28, 8);
  // Face.
  ctx.fillStyle = '#2b1d12';
  ctx.beginPath(); ctx.arc(-5 * facing, -19, 1.8, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(5 * facing, -19, 1.8, 0, 7); ctx.fill();
  ctx.strokeStyle = '#2b1d12'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.arc(0, -15, 4, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  // What is in hand, carried above the head.
  if (world.hands) {
    ctx.fillStyle = 'rgba(255,248,231,0.95)';
    ctx.beginPath(); ctx.arc(0, -52, 20, 0, 7); ctx.fill();
    ctx.strokeStyle = '#d7ccc8'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, -52, 20, 0, 7); ctx.stroke();
    drawFoodIcon(ctx, world.hands, 0, -52, 1.0);
  }
  if (world.dishInHands) {
    const recipe = recipeById(world.dishInHands);
    ctx.fillStyle = '#fdfdf6';
    ctx.beginPath(); ctx.ellipse(0, -48, 26, 10, 0, 0, 7); ctx.fill();
    recipe.components.forEach((comp, i) => {
      drawFoodIcon(ctx, comp, -16 + i * 16, -52, 0.6);
    });
  }
  ctx.restore();
}

function formatTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function drawTopBar(ctx, world) {
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(0, 0, VIEW.width, 88);
  ctx.fillStyle = PALETTE.wallDark;
  ctx.fillRect(0, 84, VIEW.width, 4);
  text(ctx, 'LAPAR KILAT', 24, 30, 30, '#fff8e7', 'bold', 'left');
  text(ctx, 'Warung Nasi Goreng — masak cepat, sajikan hangat!', 24, 62, 14, '#bfe3de', 'normal', 'left');
  // Shift timer, big in the middle.
  const urgent = world.timeLeft <= 30;
  const timerColor = urgent ? '#ff8a80' : '#fff8e7';
  text(ctx, '⏱ ' + formatTime(world.timeLeft), 640, 34, 34, timerColor);
  text(ctx, world.rush ? 'JAM SIBUK!' : 'SHIFT BERJALAN', 640, 66, 13, world.rush ? '#ffb74d' : '#bfe3de');
  // Coins, combo, hearts.
  text(ctx, `Rp ${world.coins}`, 1256, 30, 26, '#f5b301', 'bold', 'right');
  const hearts = '♥'.repeat(world.hearts) + '♡'.repeat(3 - world.hearts);
  text(ctx, hearts, 1256, 62, 18, '#ff8a80', 'bold', 'right');
  if (world.combo >= 2) text(ctx, `COMBO x${world.combo}`, 1000, 30, 20, '#ffb74d', 'bold', 'right');
}

function drawOrderBoard(ctx, world) {
  ctx.fillStyle = '#5d4037';
  rr(ctx, 24, 96, VIEW.width - 48, 120, 12);
  ctx.fill();
  text(ctx, 'PAPAN PESANAN', 44, 112, 13, '#e8cfa8', 'bold', 'left');
  for (let i = 0; i < 4; i += 1) {
    const x = 180 + i * 272;
    const order = world.orders[i];
    ctx.fillStyle = order ? '#fff8e7' : 'rgba(255,248,231,0.14)';
    rr(ctx, x, 104, 256, 104, 10);
    ctx.fill();
    if (!order) {
      text(ctx, '— kosong —', x + 128, 156, 14, '#cbb59a', 'normal');
      continue;
    }
    const recipe = recipeById(order.recipeId);
    const frac = Math.max(0, order.patience / order.maxPatience);
    const urgent = frac < 0.3;
    if (urgent && Math.floor(world.elapsed * 4) % 2 === 0) {
      ctx.strokeStyle = '#d64541';
      ctx.lineWidth = 3;
      rr(ctx, x, 104, 256, 104, 10);
      ctx.stroke();
    }
    text(ctx, recipe.name, x + 12, 124, 17, PALETTE.ink, 'bold', 'left');
    text(ctx, `Rp ${recipe.price}`, x + 244, 124, 15, '#8a5a2b', 'bold', 'right');
    recipe.components.forEach((comp, j) => {
      drawFoodIcon(ctx, comp, x + 30 + j * 44, 156, 0.95);
    });
    // Patience bar.
    ctx.fillStyle = '#e0d3b8';
    rr(ctx, x + 12, 184, 232, 12, 6);
    ctx.fill();
    ctx.fillStyle = frac > 0.5 ? PALETTE.green : frac > 0.25 ? '#e8a33d' : '#d64541';
    rr(ctx, x + 12, 184, 232 * frac, 12, 6);
    ctx.fill();
    text(ctx, `${Math.ceil(order.patience)} dtk`, x + 244, 170, 11, urgent ? '#d64541' : '#8a7a5f', 'normal', 'right');
  }
}

function drawFloaters(ctx, world) {
  for (const f of world.floaters) {
    ctx.globalAlpha = Math.min(1, f.ttl);
    text(ctx, f.text, f.x, f.y, 22, f.color);
    ctx.globalAlpha = 1;
  }
}

function drawMessage(ctx, world) {
  if (!world.message) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, world.messageTtl);
  const w = ctx.measureText(world.message).width + 40;
  ctx.fillStyle = 'rgba(43,29,18,0.85)';
  rr(ctx, 640 - 260, 612, 520, 34, 17);
  ctx.fill();
  text(ctx, world.message, 640, 630, 15, '#fff8e7');
  ctx.restore();
}

export function drawWorld(ctx, world, hint) {
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  // Wall + floor.
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(0, 88, VIEW.width, 140);
  ctx.fillStyle = PALETTE.wallDark;
  for (let x = 0; x < VIEW.width; x += 64) {
    ctx.fillRect(x, 88, 2, 140);
    ctx.fillRect(x, 88, 64, 2);
  }
  ctx.fillStyle = PALETTE.floorA;
  ctx.fillRect(0, 228, VIEW.width, 572);
  ctx.fillStyle = PALETTE.floorB;
  for (let y = 228; y < 800; y += 64) {
    for (let x = ((y / 64) % 2 === 0 ? 0 : 64); x < VIEW.width; x += 128) {
      ctx.fillRect(x, y, 64, 64);
    }
  }
  drawTopBar(ctx, world);
  drawOrderBoard(ctx, world);
  drawCooker(ctx, world, 'wok', STATIONS.wok, 4.5);
  drawCooker(ctx, world, 'grill', STATIONS.grill, 5.5);
  drawChopBoard(ctx, world, STATIONS.chop);
  drawAssembly(ctx, world, STATIONS.assemble);
  drawServeWindow(ctx, world, STATIONS.serve);
  drawPour(ctx, world, STATIONS.pour);
  drawTrash(ctx, STATIONS.trash);
  drawBins(ctx, world);
  drawCook(ctx, world);
  drawFloaters(ctx, world);
  drawMessage(ctx, world);
  // Bottom hint bar.
  if (hint) text(ctx, hint, 640, 780, 14, '#6b4420', 'normal');
  else text(ctx, 'WASD / panah jalan · E pakai stasiun · klik lantai untuk jalan · Q buang · P jeda · M suara', 640, 780, 13, '#8a7a5f', 'normal');
}

function drawTitle(ctx, world) {
  drawWorld(ctx, world, '');
  ctx.fillStyle = 'rgba(15,60,55,0.82)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  text(ctx, 'LAPAR KILAT', 640, 240, 72, '#f5b301');
  text(ctx, 'Warung Nasi Goreng — masak cepat, sajikan hangat!', 640, 300, 24, '#fff8e7', 'normal');
  text(ctx, 'Pelanggan pesan di papan — ambil bahan, goreng / bakar / cincang,', 640, 380, 19, '#e8cfa8', 'normal');
  text(ctx, 'susun di Meja Racik, sajikan di Jendela Saji sebelum waktunya habis.', 640, 410, 19, '#e8cfa8', 'normal');
  text(ctx, 'WASD / panah + E, atau klik. Shift 2,5 menit — jam sibuk di akhir!', 640, 460, 19, '#fff8e7', 'normal');
  const pulse = 0.65 + 0.35 * Math.sin(world.elapsed * 4);
  ctx.globalAlpha = pulse;
  text(ctx, 'TEKAN ENTER / KLIK UNTUK MULAI', 640, 540, 26, '#f5b301');
  ctx.globalAlpha = 1;
}

function drawGameOver(ctx, world) {
  drawWorld(ctx, world, '');
  ctx.fillStyle = 'rgba(43,29,18,0.85)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  const title = world.hearts <= 0 ? 'WARUNG TUTUP!' : 'SHIFT SELESAI!';
  text(ctx, title, 640, 250, 56, '#f5b301');
  text(ctx, `Pendapatan: Rp ${world.earned}`, 640, 330, 28, '#fff8e7');
  text(ctx, `Pesanan disajikan: ${world.served}   ·   Hangus / pergi: ${world.lost}   ·   Combo terbaik: x${world.bestCombo}`, 640, 380, 20, '#e8cfa8', 'normal');
  text(ctx, world.served >= 8 ? 'Koki andalan warung! Pelanggan pulang kenyang.' : world.served >= 4 ? 'Lumayan! Besok lebih cepat lagi.' : 'Dapur masih berantakan — coba lagi, lebih cepat!', 640, 430, 19, '#fff8e7', 'normal');
  text(ctx, 'TEKAN R UNTUK MAIN LAGI', 640, 520, 24, '#f5b301');
}

export function render(ctx, world, hint) {
  if (world.screen === 'title') drawTitle(ctx, world);
  else if (world.screen === 'over') drawGameOver(ctx, world);
  else drawWorld(ctx, world, hint);
}
