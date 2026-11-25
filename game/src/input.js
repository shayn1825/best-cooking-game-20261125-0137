// Keyboard and mouse for Lapar Kilat: WASD/arrows to walk, E or Space to
// use the nearest station, Q to toss what is in hand, P to pause, M to mute,
// R to restart. Clicking the floor walks the cook there; clicking a station
// walks there and uses it on arrival.
import { FLOOR } from './config.js';

export function createInput() {
  return {
    keys: new Set(),
    moveX: 0,
    moveY: 0,
    interact: false,
    clickX: null,
    clickY: null,
    paused: false,
    muted: false,
    restart: false,
  };
}

const MOVE_KEYS = {
  ArrowUp: [0, -1], KeyW: [0, -1],
  ArrowDown: [0, 1], KeyS: [0, 1],
  ArrowLeft: [-1, 0], KeyA: [-1, 0],
  ArrowRight: [1, 0], KeyD: [1, 0],
};

export function attachInput(input, canvas, callbacks) {
  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    input.keys.add(event.code);
    if (event.code === 'KeyE' || event.code === 'Space') {
      input.interact = true;
      event.preventDefault();
    }
    if (event.code === 'KeyQ') callbacks.onTrash?.();
    if (event.code === 'KeyP') { input.paused = !input.paused; callbacks.onPause?.(input.paused); }
    if (event.code === 'KeyM') { input.muted = !input.muted; callbacks.onMute?.(input.muted); }
    if (event.code === 'KeyR') input.restart = true;
    if (event.code === 'Enter') callbacks.onConfirm?.();
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) event.preventDefault();
  });
  window.addEventListener('keyup', (event) => input.keys.delete(event.code));
  window.addEventListener('blur', () => input.keys.clear());

  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    input.clickX = x;
    input.clickY = y;
    callbacks.onClick?.(x, y);
  });
}

/** Read the held keys into a movement vector for this frame. */
export function pollKeys(input) {
  let x = 0;
  let y = 0;
  for (const code of input.keys) {
    const dir = MOVE_KEYS[code];
    if (dir) { x += dir[0]; y += dir[1]; }
  }
  input.moveX = x;
  input.moveY = y;
}

/** Turn a floor click into a walk target, clamped to the walkable floor. */
export function clickToTarget(x, y) {
  return {
    x: Math.max(FLOOR.x + 30, Math.min(FLOOR.x + FLOOR.width - 30, x)),
    y: Math.max(FLOOR.y + 30, Math.min(FLOOR.y + FLOOR.height - 30, y)),
  };
}
