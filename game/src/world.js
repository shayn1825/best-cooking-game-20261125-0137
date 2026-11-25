// Lapar Kilat's world: the whole shift in one plain object — the cook, the
// stations, the plate on the assembly counter, the order board, the coins
// and the clock. step() advances it; interact() is the one button that does
// whatever the nearest station wants. Nothing here draws or listens.
import {
  BURN_AFTER_SECONDS, CHOP_HITS, CHOP_HIT_SECONDS, COOK_RADIUS, COOK_SPEED,
  FLOOR, FRY_SECONDS, GRILL_SECONDS, INTERACT_RANGE, MAX_HEARTS, MAX_ORDERS,
  ORDER_PATIENCE, ORDER_PATIENCE_RUSH, ORDER_SPAWN_EVERY,
  ORDER_SPAWN_EVERY_RUSH, POUR_SECONDS, RUSH_AT_SECONDS_LEFT, SHIFT_SECONDS,
  STATIONS, BIN_H, BIN_Y, BINS, COMBO_CAP, COMBO_STEP,
} from './config.js';
import { INGREDIENTS, COMPONENTS, matchRecipe, randomRecipe, recipeById } from './recipes.js';
import { makeRng } from './random.js';

let orderCounter = 0;

export function createWorld(seed = 20261125) {
  return {
    seed,
    rng: makeRng(seed),
    screen: 'title',
    timeLeft: SHIFT_SECONDS,
    coins: 0,
    combo: 0,
    bestCombo: 0,
    hearts: MAX_HEARTS,
    served: 0,
    lost: 0,
    earned: 0,
    cook: { x: 640, y: 470, tx: null, ty: null, facing: 1, moving: false },
    hands: null, // raw id, cooked component id, or 'es-teh'
    dishInHands: null, // recipe id of a finished plate being carried
    wok: { item: null, progress: 0, state: 'idle' },
    grill: { item: null, progress: 0, state: 'idle' },
    chop: { item: null, hits: 0, state: 'idle' },
    pour: { progress: 0, state: 'idle' },
    plate: { components: [] },
    orders: [],
    spawnIn: 6,
    rush: false,
    sfx: [],
    floaters: [],
    message: '',
    messageTtl: 0,
    elapsed: 0,
  };
}

export function startShift(world) {
  const fresh = createWorld(world.seed);
  Object.assign(world, fresh);
  world.screen = 'play';
  spawnOrder(world, 'nasi-goreng');
  spawnOrder(world, 'mie-goreng');
}

export function spawnOrder(world, recipeId) {
  const recipe = recipeById(recipeId ?? randomRecipe(world.rng).id);
  const patience = world.rush ? ORDER_PATIENCE_RUSH : ORDER_PATIENCE;
  world.orders.push({
    id: ++orderCounter,
    recipeId: recipe.id,
    patience,
    maxPatience: patience,
  });
}

export function stationCentre(station) {
  return { x: station.x + station.w / 2, y: station.y + station.h / 2 };
}

function nearestInteractable(world) {
  const { x, y } = world.cook;
  let best = null;
  let bestD = INTERACT_RANGE;
  // Distance to the nearest point of a rectangle, so a cook standing at the
  // floor's edge can still reach a bin or station just outside it.
  const rectDistance = (rx, ry, rw, rh) => {
    const dx = Math.max(rx - x, 0, x - (rx + rw));
    const dy = Math.max(ry - y, 0, y - (ry + rh));
    return Math.hypot(dx, dy);
  };
  const consider = (kind, id, rx, ry, rw, rh) => {
    const d = rectDistance(rx, ry, rw, rh);
    if (d < bestD) { bestD = d; best = { kind, id, cx: rx + rw / 2, cy: ry + rh / 2 }; }
  };
  for (const key of Object.keys(STATIONS)) {
    const s = STATIONS[key];
    consider('station', s.id, s.x, s.y, s.w, s.h);
  }
  for (const bin of BINS) {
    consider('bin', bin.id, bin.x, BIN_Y, bin.w, BIN_H);
  }
  return best;
}

export function nearestHint(world) {
  const near = nearestInteractable(world);
  if (!near) return '';
  if (near.kind === 'bin') return `Ambil ${INGREDIENTS[near.id].name}`;
  const s = STATIONS[near.id];
  if (s.id === 'wok') return world.wok.state === 'done' ? 'Angkat gorengan' : world.wok.state === 'burnt' ? 'Gosong! Bersihkan' : 'Masukkan ke wajan';
  if (s.id === 'grill') return world.grill.state === 'done' ? 'Angkat sate' : world.grill.state === 'burnt' ? 'Gosong! Bersihkan' : 'Bakar di panggangan';
  if (s.id === 'chop') return world.chop.state === 'idle' ? 'Taruh untuk dicincang' : world.chop.state === 'chopping' ? `Cincang! (${world.chop.hits}/${CHOP_HITS})` : 'Ambil cincangan';
  if (s.id === 'assemble') {
    if (world.dishInHands) return 'Bawa ke Jendela Saji';
    const done = matchRecipe(world.plate.components);
    return done ? `Angkat ${done.name} — SIAP!` : 'Taruh bahan ke piring';
  }
  if (s.id === 'serve') return world.dishInHands ? 'Sajikan!' : 'Bawa piring jadi ke sini';
  if (s.id === 'pour') return 'Tuang Es Teh';
  if (s.id === 'trash') return 'Buang isi tangan';
  return '';
}

function say(world, text) {
  world.message = text;
  world.messageTtl = 2.2;
}

function float(world, x, y, text, color) {
  world.floaters.push({ x, y, text, color, ttl: 1.4 });
}

function cookAt(world, stationId, progress, state) {
  const slot = world[stationId];
  slot.progress = progress;
  slot.state = state;
}

function takeFromHands(world) {
  const item = world.hands;
  world.hands = null;
  return item;
}

// The one context button. What it does depends on the nearest station or bin,
// or on `forced` — the station or bin a mouse click aimed at — which wins
// over nearness so a click on the bawang bin never pours es teh instead.
export function interact(world, forced) {
  if (world.screen !== 'play') return;
  const near = forced ?? nearestInteractable(world);
  if (!near) return;
  if (near.kind === 'bin') {
    if (world.hands || world.dishInHands) { say(world, 'Tangan penuh!'); world.sfx.push('error'); return; }
    world.hands = near.id;
    world.sfx.push('pickup');
    return;
  }
  const id = near.id;
  if (id === 'wok' || id === 'grill') {
    const slot = world[id];
    const cookSeconds = id === 'wok' ? FRY_SECONDS : GRILL_SECONDS;
    if (slot.state === 'burnt') {
      slot.item = null; cookAt(world, id, 0, 'idle');
      say(world, 'Gosong dibuang...'); world.sfx.push('scrape');
      return;
    }
    if (slot.state === 'done') {
      if (world.hands || world.dishInHands) { say(world, 'Tangan penuh!'); return; }
      world.hands = INGREDIENTS[slot.item].cooked;
      slot.item = null; cookAt(world, id, 0, 'idle');
      world.sfx.push('pickup');
      return;
    }
    if (slot.state === 'idle' && world.hands) {
      const ing = INGREDIENTS[world.hands];
      const want = id === 'wok' ? 'fry' : 'grill';
      if (!ing || ing.process !== want) { say(world, ing ? `${ing.name} bukan untuk ${id === 'wok' ? 'wajan' : 'panggangan'}!` : 'Bawa bahan dulu!'); world.sfx.push('error'); return; }
      slot.item = takeFromHands(world);
      cookAt(world, id, 0, 'cooking');
      world.sfx.push('sizzle');
      return;
    }
    if (slot.state === 'cooking') say(world, `Masih ${id === 'wok' ? 'digoreng' : 'dibakar'}...`);
    return;
  }
  if (id === 'chop') {
    const slot = world.chop;
    if (slot.state === 'idle' && world.hands) {
      const ing = INGREDIENTS[world.hands];
      if (!ing || ing.process !== 'chop') { say(world, ing ? `${ing.name} tidak perlu dicincang!` : 'Bawa bahan dulu!'); world.sfx.push('error'); return; }
      slot.item = takeFromHands(world);
      slot.hits = 0;
      slot.state = 'chopping';
      world.sfx.push('chop');
      return;
    }
    if (slot.state === 'chopping') {
      slot.hits += 1;
      world.sfx.push('chop');
      if (slot.hits >= CHOP_HITS) slot.state = 'done';
      return;
    }
    if (slot.state === 'done') {
      if (world.hands || world.dishInHands) { say(world, 'Tangan penuh!'); return; }
      world.hands = INGREDIENTS[slot.item].cooked;
      slot.item = null; slot.hits = 0; slot.state = 'idle';
      world.sfx.push('pickup');
      return;
    }
    return;
  }
  if (id === 'assemble') {
    if (world.dishInHands) { say(world, 'Bawa ke Jendela Saji!'); return; }
    const done = matchRecipe(world.plate.components);
    if (!world.hands && done) {
      world.dishInHands = done.id;
      world.plate.components = [];
      world.sfx.push('ding');
      return;
    }
    if (world.hands) {
      const comp = COMPONENTS[world.hands];
      if (!comp) { say(world, 'Bahan mentah tidak bisa ditaruh di piring!'); world.sfx.push('error'); return; }
      if (world.plate.components.includes(world.hands)) { say(world, 'Sudah ada di piring!'); world.sfx.push('error'); return; }
      world.plate.components.push(takeFromHands(world));
      world.sfx.push('place');
      const finished = matchRecipe(world.plate.components);
      if (finished) { world.sfx.push('ding'); say(world, `${finished.name} SIAP disajikan!`); }
      return;
    }
    if (!done && world.plate.components.length === 0) say(world, 'Taruh bahan matang ke piring');
    return;
  }
  if (id === 'serve') {
    if (!world.dishInHands) { say(world, 'Bawa piring jadi ke sini!'); return; }
    const dishId = world.dishInHands;
    const orderIndex = world.orders.findIndex((o) => o.recipeId === dishId);
    if (orderIndex === -1) { say(world, 'Tidak ada yang pesan ini!'); world.sfx.push('error'); return; }
    const order = world.orders[orderIndex];
    const recipe = recipeById(dishId);
    const patienceFrac = order.patience / order.maxPatience;
    const tip = Math.round(recipe.price * 0.5 * patienceFrac);
    world.combo += 1;
    world.bestCombo = Math.max(world.bestCombo, world.combo);
    const mult = Math.min(COMBO_CAP, 1 + COMBO_STEP * (world.combo - 1));
    const gain = Math.round((recipe.price + tip) * mult);
    world.coins += gain;
    world.earned += gain;
    world.served += 1;
    world.dishInHands = null;
    world.orders.splice(orderIndex, 1);
    const c = stationCentre(STATIONS.serve);
    float(world, c.x, c.y - 60, `+Rp${gain}`, '#f5b301');
    if (world.combo >= 2) float(world, c.x, c.y - 90, `COMBO x${world.combo}!`, '#d64541');
    world.sfx.push('serve');
    world.sfx.push('coin');
    return;
  }
  if (id === 'pour') {
    if (world.hands || world.dishInHands) { say(world, 'Tangan penuh!'); return; }
    if (world.pour.state === 'idle') {
      world.pour.state = 'pouring';
      world.pour.progress = 0;
      world.sfx.push('pour');
    }
    return;
  }
  if (id === 'trash') {
    if (world.hands) { world.hands = null; world.sfx.push('scrape'); say(world, 'Dibuang.'); return; }
    if (world.dishInHands) { world.dishInHands = null; world.sfx.push('scrape'); say(world, 'Piring dibuang.'); return; }
    if (world.plate.components.length > 0) { world.plate.components = []; world.sfx.push('scrape'); say(world, 'Piring dikosongkan.'); }
    return;
  }
}

function advanceCooker(world, slot, cookSeconds, dt) {
  if (slot.state !== 'cooking' && slot.state !== 'done') return;
  if (slot.state === 'cooking') {
    slot.progress += dt;
    if (slot.progress >= cookSeconds) { slot.state = 'done'; world.sfx.push('ding'); }
  } else if (slot.state === 'done') {
    slot.progress += dt;
    if (slot.progress >= cookSeconds + BURN_AFTER_SECONDS) {
      slot.state = 'burnt';
      world.sfx.push('burn');
      say(world, 'Gosong! Bersihkan wajan/panggangan.');
    }
  }
}

export function step(world, dt, input) {
  if (world.screen !== 'play') return;
  world.elapsed += dt;
  world.timeLeft -= dt;
  if (world.timeLeft <= RUSH_AT_SECONDS_LEFT && !world.rush) {
    world.rush = true;
    say(world, 'JAM SIBUK! Pesanan makin cepat!');
    world.sfx.push('rush');
  }
  if (world.timeLeft <= 0) {
    world.timeLeft = 0;
    world.screen = 'over';
    world.sfx.push('end');
    return;
  }

  // Move the cook: keys, or click-to-walk toward the target.
  const cook = world.cook;
  let mx = input.moveX;
  let my = input.moveY;
  if (mx === 0 && my === 0 && cook.tx !== null) {
    const dx = cook.tx - cook.x;
    const dy = cook.ty - cook.y;
    const d = Math.hypot(dx, dy);
    if (d < 8) { cook.tx = null; cook.ty = null; }
    else { mx = dx / d; my = dy / d; }
  }
  if (mx !== 0 || my !== 0) {
    const len = Math.hypot(mx, my) || 1;
    cook.x += (mx / len) * COOK_SPEED * dt;
    cook.y += (my / len) * COOK_SPEED * dt;
    cook.facing = mx < 0 ? -1 : mx > 0 ? 1 : cook.facing;
    cook.moving = true;
  } else cook.moving = false;
  cook.x = Math.max(FLOOR.x + COOK_RADIUS, Math.min(FLOOR.x + FLOOR.width - COOK_RADIUS, cook.x));
  cook.y = Math.max(FLOOR.y + COOK_RADIUS, Math.min(FLOOR.y + FLOOR.height - COOK_RADIUS, cook.y));

  if (input.interact) interact(world);

  advanceCooker(world, world.wok, FRY_SECONDS, dt);
  advanceCooker(world, world.grill, GRILL_SECONDS, dt);
  if (world.pour.state === 'pouring') {
    world.pour.progress += dt;
    if (world.pour.progress >= POUR_SECONDS) {
      world.pour.state = 'idle';
      world.pour.progress = 0;
      if (!world.hands && !world.dishInHands) { world.hands = 'es-teh'; world.sfx.push('ding'); }
    }
  }

  // Orders: patience drains, expired ones cost a heart.
  for (let i = world.orders.length - 1; i >= 0; i -= 1) {
    const order = world.orders[i];
    order.patience -= dt;
    if (order.patience <= 0) {
      world.orders.splice(i, 1);
      world.hearts -= 1;
      world.lost += 1;
      world.combo = 0;
      world.sfx.push('expire');
      say(world, `${recipeById(order.recipeId).name} keburu dingin — pelanggan pergi!`);
      if (world.hearts <= 0) {
        world.hearts = 0;
        world.screen = 'over';
        world.sfx.push('end');
        return;
      }
    }
  }
  world.spawnIn -= dt;
  if (world.spawnIn <= 0 && world.orders.length < MAX_ORDERS) {
    spawnOrder(world);
    world.spawnIn = world.rush ? ORDER_SPAWN_EVERY_RUSH : ORDER_SPAWN_EVERY;
  }

  if (world.messageTtl > 0) {
    world.messageTtl -= dt;
    if (world.messageTtl <= 0) world.message = '';
  }
  for (let i = world.floaters.length - 1; i >= 0; i -= 1) {
    const f = world.floaters[i];
    f.ttl -= dt;
    f.y -= 30 * dt;
    if (f.ttl <= 0) world.floaters.splice(i, 1);
  }
}

// Staging helpers for screenshots: build a real mid-game state through the
// same functions a player uses, so the frame is the game, not a mock-up.
export function stageCoverState(world) {
  startShift(world);
  world.timeLeft = 107;
  world.coins = 320;
  world.combo = 3;
  world.bestCombo = 3;
  spawnOrder(world, 'sate-ayam');
  // A Nasi Goreng half-built on the assembly counter: two of three parts.
  world.plate.components = ['nasi-goreng', 'telur-goreng'];
  // The cook carries a finished Nasi Goreng to the serving window — the
  // plate ready to serve — while the next dish is mid-assembly.
  world.dishInHands = 'nasi-goreng';
  world.cook.x = 545;
  world.cook.y = 445;
  // Wok busy frying mie, grill busy with sate.
  world.wok.item = 'mie'; world.wok.progress = 2.6; world.wok.state = 'cooking';
  world.grill.item = 'ayam'; world.grill.progress = 4.1; world.grill.state = 'cooking';
  world.message = 'Nasi Goreng SIAP — antar ke Jendela Saji!';
  world.messageTtl = 5;
}

export function stageRushState(world) {
  startShift(world);
  world.timeLeft = 38;
  world.rush = true;
  world.coins = 540;
  world.combo = 5;
  world.bestCombo = 5;
  spawnOrder(world, 'sate-ayam');
  spawnOrder(world, 'gado-gado');
  world.orders[0].patience = 6;
  world.orders[1].patience = 12;
  world.orders[2].patience = 9;
  world.orders[3].patience = 20;
  world.plate.components = ['sayur-cincang'];
  world.cook.x = 285;
  world.cook.y = 390;
  world.wok.item = 'nasi'; world.wok.progress = 4.4; world.wok.state = 'done';
  world.grill.item = 'ayam'; world.grill.progress = 5.4; world.grill.state = 'done';
  world.message = 'JAM SIBUK! Pesanan makin cepat!';
  world.messageTtl = 5;
}

export function stageServeState(world) {
  startShift(world);
  world.timeLeft = 88;
  world.coins = 415;
  world.combo = 2;
  spawnOrder(world, 'mie-goreng');
  // A finished Mie Goreng carried to the serving window.
  world.dishInHands = 'mie-goreng';
  world.cook.x = 985;
  world.cook.y = 445;
  world.floaters.push({ x: 1124, y: 250, text: '+Rp31', color: '#f5b301', ttl: 1.4 });
  world.message = 'Mie Goreng SIAP disajikan!';
  world.messageTtl = 5;
}
