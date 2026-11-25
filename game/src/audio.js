// All of Lapar Kilat's sound is synthesized with WebAudio — no audio files.
// Short blips for chops, a hiss for the wok, a ding when food is ready, a
// little arpeggio when a dish is served. Silent until the first gesture.
export function createAudio() {
  return { ctx: null, muted: false };
}

function ensureCtx(audio) {
  if (audio.ctx) return audio.ctx;
  try {
    const Ctx = window.AudioContext ?? window.webkitAudioContext;
    if (!Ctx) return null;
    audio.ctx = new Ctx();
  } catch {
    return null;
  }
  return audio.ctx;
}

function tone(audio, freq, seconds, type = 'sine', volume = 0.12, when = 0) {
  const ctx = ensureCtx(audio);
  if (!ctx || audio.muted) return;
  if (ctx.state === 'suspended') void ctx.resume();
  const t0 = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(volume, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + seconds);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + seconds + 0.02);
}

function noiseBurst(audio, seconds, volume = 0.1) {
  const ctx = ensureCtx(audio);
  if (!ctx || audio.muted) return;
  if (ctx.state === 'suspended') void ctx.resume();
  const len = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.value = volume;
  src.connect(gain).connect(ctx.destination);
  src.start();
}

export function playSound(audio, name) {
  if (audio.muted) return;
  switch (name) {
    case 'chop': noiseBurst(audio, 0.08, 0.22); tone(audio, 180, 0.06, 'square', 0.06); break;
    case 'sizzle': noiseBurst(audio, 0.5, 0.08); break;
    case 'pickup': tone(audio, 520, 0.08, 'triangle', 0.1); break;
    case 'place': tone(audio, 340, 0.09, 'triangle', 0.12); break;
    case 'ding': tone(audio, 880, 0.25, 'sine', 0.14); tone(audio, 1320, 0.2, 'sine', 0.08, 0.08); break;
    case 'serve': tone(audio, 523, 0.1, 'triangle', 0.12); tone(audio, 659, 0.1, 'triangle', 0.12, 0.09); tone(audio, 784, 0.16, 'triangle', 0.12, 0.18); break;
    case 'coin': tone(audio, 988, 0.1, 'square', 0.05); tone(audio, 1319, 0.18, 'square', 0.05, 0.07); break;
    case 'pour': tone(audio, 300, 0.3, 'sine', 0.06); noiseBurst(audio, 0.3, 0.04); break;
    case 'burn': tone(audio, 140, 0.35, 'sawtooth', 0.1); break;
    case 'expire': tone(audio, 220, 0.3, 'sawtooth', 0.08); tone(audio, 165, 0.4, 'sawtooth', 0.08, 0.15); break;
    case 'rush': tone(audio, 392, 0.12, 'square', 0.09); tone(audio, 523, 0.12, 'square', 0.09, 0.12); tone(audio, 659, 0.2, 'square', 0.09, 0.24); break;
    case 'scrape': noiseBurst(audio, 0.15, 0.14); break;
    case 'error': tone(audio, 160, 0.15, 'square', 0.08); break;
    case 'end': tone(audio, 523, 0.2, 'triangle', 0.1); tone(audio, 392, 0.2, 'triangle', 0.1, 0.2); tone(audio, 330, 0.4, 'triangle', 0.1, 0.4); break;
    default: break;
  }
}
