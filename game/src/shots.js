// The screenshot scenes behind ?shot=cover|rush|serve|end. Each one builds a
// real mid-game state through the world's own staging helpers — the same
// orders, stations and plate a player would have — then the renderer draws
// it, so every pixel is the game's own code at work, from a fixed seed.
import { stageCoverState, stageRushState, stageServeState, startShift } from './world.js';

export function stageShot(name, world) {
  if (name === 'rush') {
    stageRushState(world);
    return 'play';
  }
  if (name === 'serve') {
    stageServeState(world);
    return 'play';
  }
  if (name === 'end') {
    startShift(world);
    world.timeLeft = 0;
    world.coins = 612;
    world.earned = 612;
    world.served = 11;
    world.lost = 2;
    world.bestCombo = 4;
    world.hearts = 1;
    world.screen = 'over';
    return 'over';
  }
  stageCoverState(world);
  return 'play';
}
