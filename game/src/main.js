// Lapar Kilat — entry point. Wires the canvas, the input, the sound and the
// loop together, and stages a deterministic screenshot scene when the page
// is opened with ?shot=cover|rush|serve|end.
import { VIEW, STATIONS, BINS, BIN_Y, BIN_H } from './config.js';
import { createWorld, startShift, step, interact, nearestHint } from './world.js';
import { render } from './render.js';
import { createInput, attachInput, pollKeys, clickToTarget } from './input.js';
import { createAudio, playSound } from './audio.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const statusLine = document.getElementById('status');
canvas.width = VIEW.width;
canvas.height = VIEW.height;
const ctx = canvas.getContext('2d');

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') || '20261125');

const world = createWorld(seed);
const input = createInput();
const audio = createAudio();
let useOnArrival = null; // {kind, id} of the station/bin a click aimed at

function drainSounds() {
  while (world.sfx.length > 0) playSound(audio, world.sfx.shift());
}

function announce() {
  const hint = world.screen === 'play' ? nearestHint(world) : '';
  statusLine.textContent = world.screen === 'play'
    ? `Waktu ${Math.ceil(world.timeLeft)} detik, Rp ${world.coins}, ${world.served} pesanan disajikan. ${hint}`
    : world.screen === 'over'
      ? `Shift selesai. Pendapatan Rp ${world.earned}, ${world.served} pesanan disajikan.`
      : 'Lapar Kilat, game memasak warung. Tekan Enter untuk mulai.';
}

// A click on a station or a bin walks the cook to it and uses it on arrival;
// a click on open floor just walks there.
function clickTarget(x, y) {
  // Walk to the nearest floor point of the station or bin, then use it.
  const toFloorPoint = (cx, cy, kind, id) => {
    const floor = clickToTarget(cx, cy);
    return { x: floor.x, y: floor.y, use: { kind, id } };
  };
  for (const key of Object.keys(STATIONS)) {
    const s = STATIONS[key];
    if (x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) {
      return toFloorPoint(s.x + s.w / 2, s.y + s.h / 2, 'station', s.id);
    }
  }
  for (const bin of BINS) {
    if (x >= bin.x && x <= bin.x + bin.w && y >= BIN_Y && y <= BIN_Y + BIN_H) {
      return toFloorPoint(bin.x + bin.w / 2, BIN_Y + BIN_H / 2, 'bin', bin.id);
    }
  }
  const floor = clickToTarget(x, y);
  return { x: floor.x, y: floor.y, use: null };
}

attachInput(input, canvas, {
  onClick(x, y) {
    if (world.screen === 'title') { startShift(world); return; }
    if (world.screen === 'over') return;
    if (input.paused) return;
    const target = clickTarget(x, y);
    world.cook.tx = target.x;
    world.cook.ty = target.y;
    useOnArrival = target.use;
  },
  onTrash() {
    if (world.screen !== 'play') return;
    if (world.hands || world.dishInHands) {
      world.hands = null;
      world.dishInHands = null;
      world.sfx.push('scrape');
    }
  },
  onPause(paused) {
    if (world.screen === 'play') statusLine.textContent = paused ? 'Jeda.' : '';
  },
  onMute(muted) { audio.muted = muted; },
  onConfirm() {
    if (world.screen === 'title' || world.screen === 'over') startShift(world);
  },
});

if (shot) {
  // Screenshot mode: stage the scene, draw one frame, stop. No stepping, so
  // the frame is exactly the staged state every time.
  stageShot(shot, world);
  render(ctx, world, nearestHint(world));
  announce();
  window.__laparKilat = { world, ready: true, shot };
} else {
  // Exposed for debugging and automated playtests; the game itself never reads it.
  window.__laparKilat = { world, ready: true, shot: null };
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (input.restart) {
      input.restart = false;
      startShift(world);
    }
    if (!input.paused && world.screen === 'play') {
      pollKeys(input);
      step(world, dt, input);
      if (input.interact) input.interact = false;
      if (useOnArrival && world.cook.tx === null) {
        const use = useOnArrival;
        useOnArrival = null;
        interact(world, use);
      }
    }
    render(ctx, world, world.screen === 'play' ? nearestHint(world) : '');
    drainSounds();
    announce();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
