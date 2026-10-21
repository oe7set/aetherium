import type { GameEvent } from '../engine';

// Tiny WebAudio synth – no audio files, no copyright, a few hundred bytes.
// The AudioContext is created lazily on the first user gesture (browser autoplay rules).

let ctx: AudioContext | null = null;
let lastPlayed: Record<string, number> = {};

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** Shared context for the music module (null until the browser allows audio). */
export function audioContext(): AudioContext | null {
  return audio();
}

/** Call from a user gesture once so iOS allows sound. */
export function unlockAudio(): void {
  audio();
}

function tone(
  freq: number,
  start: number,
  duration: number,
  type: OscillatorType = 'sine',
  gain = 0.08,
): void {
  const a = audio();
  if (!a) return;
  const t0 = a.currentTime + start;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(g).connect(a.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

function noise(start: number, duration: number, gain = 0.05): void {
  const a = audio();
  if (!a) return;
  const t0 = a.currentTime + start;
  const buffer = a.createBuffer(1, Math.ceil(a.sampleRate * duration), a.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = a.createBufferSource();
  const g = a.createGain();
  g.gain.value = gain;
  src.buffer = buffer;
  src.connect(g).connect(a.destination);
  src.start(t0);
}

export const SOUNDS = {
  click: () => tone(660, 0, 0.05, 'triangle', 0.04),
  item: () => tone(880, 0, 0.07, 'sine', 0.035),
  chop: () => noise(0, 0.08, 0.06),
  levelUp: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.25, 'triangle', 0.07)),
  rare: () => [1318, 1568, 2093].forEach((f, i) => tone(f, i * 0.06, 0.3, 'sine', 0.05)),
  achievement: () =>
    [784, 988, 1175, 1568].forEach((f, i) => tone(f, i * 0.08, 0.35, 'square', 0.03)),
  hit: () => tone(140, 0, 0.12, 'sawtooth', 0.05),
  hurt: () => tone(90, 0, 0.18, 'square', 0.05),
  bad: () => tone(200, 0, 0.2, 'sawtooth', 0.04),
  coin: () => [988, 1319].forEach((f, i) => tone(f, i * 0.05, 0.12, 'square', 0.025)),
  dice: () => {
    noise(0, 0.05, 0.05);
    noise(0.07, 0.05, 0.04);
    noise(0.15, 0.04, 0.03);
  },
  build: () => [392, 523].forEach((f, i) => tone(f, i * 0.07, 0.15, 'triangle', 0.05)),
  fanfare: () => {
    [392, 523, 659, 784].forEach((f, i) => tone(f, i * 0.11, 0.3, 'triangle', 0.06));
    [1047, 1319].forEach((f, i) => tone(f, 0.5 + i * 0.02, 0.6, 'sine', 0.05));
  },
  event: () => [659, 880, 659, 1047].forEach((f, i) => tone(f, i * 0.09, 0.18, 'sine', 0.045)),
  prestige: () =>
    [262, 330, 392, 523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.6, 'sine', 0.06)),
};

/** Maps a batch of engine events to at most a few sounds (throttled per kind). */
export function playEventSounds(events: GameEvent[]): void {
  const kinds = new Set<keyof typeof SOUNDS>();
  for (const e of events) {
    switch (e.type) {
      case 'levelUp':
        kinds.add('levelUp');
        break;
      case 'rareDrop':
      case 'albumFound':
      case 'petFound':
      case 'elementDiscovered':
        kinds.add('rare');
        break;
      case 'mastery':
        if (e.level % 10 === 0) kinds.add('rare');
        break;
      case 'achievement':
      case 'questCompleted':
      case 'techResearched':
        kinds.add('achievement');
        break;
      case 'actionComplete':
        kinds.add('item');
        break;
      case 'hit':
        kinds.add(e.target === 'monster' ? 'hit' : 'hurt');
        break;
      case 'special':
        kinds.add('rare');
        break;
      case 'gold':
      case 'taskCompleted':
        kinds.add('coin');
        break;
      case 'actionStopped':
        if (e.reason !== 'manual') kinds.add('bad');
        break;
      case 'prestige':
        kinds.add('prestige');
        break;
      case 'villageBuilt':
        kinds.add('build');
        break;
      case 'villageReport':
        kinds.add(e.won ? 'coin' : 'bad');
        break;
      case 'heroLevel':
        kinds.add('levelUp');
        break;
      case 'heroDied':
        kinds.add('hurt');
        break;
      case 'heroAdventure':
        kinds.add(e.success ? 'rare' : 'bad');
        break;
      case 'projectStage':
        kinds.add('fanfare');
        break;
      case 'worldBoss':
        if (e.event === 'killed') kinds.add('fanfare');
        else if (e.event === 'spawn') kinds.add('event');
        break;
      case 'islandEvent':
        if (e.phase === 'start') kinds.add('event');
        break;
      case 'forged':
        kinds.add(e.result === 'ok' ? 'rare' : 'bad');
        break;
      case 'villageFounded':
      case 'villageResearched':
        kinds.add('achievement');
        break;
      default:
        break;
    }
  }
  const now = performance.now();
  for (const k of kinds) {
    if (now - (lastPlayed[k] ?? 0) < 90) continue;
    lastPlayed[k] = now;
    SOUNDS[k]();
  }
  if (Object.keys(lastPlayed).length > 32) lastPlayed = {};
}
