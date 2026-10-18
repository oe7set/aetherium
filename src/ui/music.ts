import { audioContext } from './audio';

// Procedural background music: a tiny generative sequencer on WebAudio – no files, a few
// oscillators per beat. Every area has its own theme; changes crossfade. Notes are scheduled a
// fraction of a second ahead by a cheap timer, nothing runs while the tab is hidden or music is off.

export type MusicTheme = 'island' | 'village' | 'hero' | 'rift';

interface ThemeDef {
  bpm: number;
  /** MIDI note of the key's root (around the middle of the keyboard). */
  root: number;
  /** Melody scale in semitones from the root. */
  scale: number[];
  /** Chord progression, one chord per bar, semitones from the root. */
  chords: number[][];
  pad: OscillatorType;
  lead: OscillatorType;
  /** Chance of a melody note on an eighth. */
  density: number;
  /** Filter cutoff of the pad (Hz). */
  cutoff: number;
  /** Driving parts: pulsing bass, arpeggio, soft kick and hats. */
  drive: boolean;
  /** Plucked short lead (village lute) instead of a soft flute. */
  pluck: boolean;
}

const THEMES: Record<MusicTheme, ThemeDef> = {
  // D major, I – vi – IV – V, warm and slow.
  island: {
    bpm: 76,
    root: 62,
    scale: [0, 2, 4, 7, 9],
    chords: [
      [0, 4, 7],
      [-3, 0, 4],
      [-7, -3, 0],
      [-5, -1, 2],
    ],
    pad: 'triangle',
    lead: 'sine',
    density: 0.35,
    cutoff: 1400,
    drive: false,
    pluck: false,
  },
  // G major folk: I – IV – I – V with a plucked lute.
  village: {
    bpm: 100,
    root: 67,
    scale: [0, 2, 4, 5, 7, 9],
    chords: [
      [0, 4, 7],
      [5, 9, 12],
      [0, 4, 7],
      [-5, -1, 2],
    ],
    pad: 'triangle',
    lead: 'triangle',
    density: 0.5,
    cutoff: 1800,
    drive: false,
    pluck: true,
  },
  // D dorian, mysterious: i – IV – i – VII.
  hero: {
    bpm: 84,
    root: 62,
    scale: [0, 2, 3, 5, 7, 9],
    chords: [
      [0, 3, 7],
      [5, 9, 12],
      [0, 3, 7],
      [-2, 2, 5],
    ],
    pad: 'sawtooth',
    lead: 'sine',
    density: 0.3,
    cutoff: 900,
    drive: false,
    pluck: false,
  },
  // A minor, driving: i – VI – III – VII.
  rift: {
    bpm: 126,
    root: 57,
    scale: [0, 3, 5, 7, 10],
    chords: [
      [0, 3, 7],
      [-4, 0, 3],
      [3, 7, 10],
      [-2, 2, 5],
    ],
    pad: 'sawtooth',
    lead: 'square',
    density: 0.25,
    cutoff: 1100,
    drive: true,
    pluck: false,
  },
};

const freq = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

interface MotifNote {
  step: number;
  degree: number;
  len: number;
}

let theme: MusicTheme = 'island';
let wanted = false;
let volume = 0.5;
let timer: number | null = null;
let master: GainNode | null = null;
let bus: GainNode | null = null;
let nextTime = 0;
let step = 0;
let bar = 0;
let motif: MotifNote[] = [];
let seed = 1;

function rand(): number {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 2 ** 32;
}

function makeMotif(def: ThemeDef): MotifNote[] {
  // A two-bar phrase on eighths, walking through the scale; repeated with small variations.
  const out: MotifNote[] = [];
  let degree = Math.floor(rand() * def.scale.length);
  for (let s = 0; s < 32; s += 2) {
    if (rand() > def.density && s % 16 !== 0) continue;
    degree = Math.max(0, Math.min(def.scale.length * 2 - 1, degree + Math.round(rand() * 4 - 2)));
    const len = rand() < 0.3 ? 4 : 2;
    out.push({ step: s, degree, len });
    if (len === 4) s += 2;
  }
  return out;
}

function scaleNote(def: ThemeDef, degree: number): number {
  const n = def.scale.length;
  return def.root + def.scale[degree % n]! + 12 * Math.floor(degree / n);
}

function ensureGraph(a: AudioContext): void {
  if (master && bus) return;
  master = a.createGain();
  // First sound after the browser unlocked audio: swell in gently.
  master.gain.setValueAtTime(0.0001, a.currentTime);
  master.gain.linearRampToValueAtTime(volume * 0.4, a.currentTime + 2.5);
  master.connect(a.destination);
  bus = a.createGain();
  bus.gain.value = 1;
  // A soft echo gives the cheap oscillators some room.
  const delay = a.createDelay(1);
  delay.delayTime.value = 0.33;
  const feedback = a.createGain();
  feedback.gain.value = 0.28;
  const wet = a.createGain();
  wet.gain.value = 0.22;
  bus.connect(master);
  bus.connect(delay);
  delay.connect(feedback).connect(delay);
  delay.connect(wet).connect(master);
}

function voice(
  a: AudioContext,
  f: number,
  t: number,
  dur: number,
  type: OscillatorType,
  gain: number,
  attack: number,
  cutoff = 0,
  detune = 0,
): void {
  if (!bus) return;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(f, t);
  osc.detune.setValueAtTime(detune, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  if (cutoff > 0) {
    const lp = a.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = cutoff;
    osc.connect(lp).connect(g);
  } else osc.connect(g);
  g.connect(bus);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

function kick(a: AudioContext, t: number): void {
  if (!bus) return;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.frequency.setValueAtTime(120, t);
  osc.frequency.exponentialRampToValueAtTime(40, t + 0.15);
  g.gain.setValueAtTime(0.5, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
  osc.connect(g).connect(bus);
  osc.start(t);
  osc.stop(t + 0.25);
}

let hatBuffer: AudioBuffer | null = null;
function hat(a: AudioContext, t: number, gain: number): void {
  if (!bus) return;
  if (!hatBuffer) {
    hatBuffer = a.createBuffer(1, Math.ceil(a.sampleRate * 0.05), a.sampleRate);
    const d = hatBuffer.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  }
  const src = a.createBufferSource();
  const hp = a.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 7000;
  const g = a.createGain();
  g.gain.value = gain;
  src.buffer = hatBuffer;
  src.connect(hp).connect(g).connect(bus);
  src.start(t);
}

function playStep(a: AudioContext, def: ThemeDef, t: number, sixteenth: number): void {
  const inBar = step % 16;
  const chord = def.chords[bar % def.chords.length]!;
  const barLen = sixteenth * 16;
  if (inBar === 0) {
    // Pad: the chord, two detuned voices per note, swelling over the bar.
    for (const n of chord)
      for (const det of [-7, 7])
        voice(
          a,
          freq(def.root + n),
          t,
          barLen * 1.05,
          def.pad,
          0.028,
          barLen * 0.35,
          def.cutoff,
          det,
        );
    if (!def.drive) voice(a, freq(def.root + chord[0]! - 24), t, barLen * 0.9, 'sine', 0.12, 0.05);
    if (bar % 4 === 0) motif = makeMotif(def);
  }
  if (!def.drive && inBar === 8)
    voice(a, freq(def.root + chord[0]! - 24 + 7), t, barLen * 0.45, 'sine', 0.08, 0.05);
  if (def.drive) {
    if (inBar % 2 === 0)
      voice(a, freq(def.root + chord[0]! - 24), t, sixteenth * 1.6, 'sawtooth', 0.07, 0.01, 500);
    const arp = chord[Math.floor(inBar / 2) % chord.length]! + 12;
    if (inBar % 2 === 1)
      voice(a, freq(def.root + arp), t, sixteenth * 1.2, 'square', 0.018, 0.005, 2400);
    if (inBar % 4 === 0) kick(a, t);
    if (inBar % 4 === 2) hat(a, t, 0.05);
  }
  // Melody: the current two-bar motif; every second repeat lifts its last note.
  const phrase = (bar % 2) * 16 + inBar;
  for (const m of motif) {
    if (m.step !== phrase) continue;
    const lift = bar % 4 >= 2 && m === motif[motif.length - 1] ? 1 : 0;
    const note = scaleNote(def, m.degree + lift) + (def.drive ? 12 : 0);
    const dur = def.pluck ? sixteenth * 2.2 : sixteenth * m.len * 1.1;
    voice(a, freq(note), t, dur, def.lead, def.pluck ? 0.07 : 0.05, def.pluck ? 0.005 : 0.06, 3200);
  }
  step++;
  if (step % 16 === 0) bar++;
}

function tick(): void {
  const a = audioContext();
  if (!a || a.state !== 'running') return;
  ensureGraph(a);
  const def = THEMES[theme];
  const sixteenth = 60 / def.bpm / 4;
  if (nextTime < a.currentTime) nextTime = a.currentTime + 0.05;
  while (nextTime < a.currentTime + 0.4) {
    playStep(a, def, nextTime, sixteenth);
    nextTime += sixteenth;
  }
}

function fadeTo(target: number, seconds: number): void {
  const a = audioContext();
  if (!a || !master) return;
  const g = master.gain;
  g.cancelScheduledValues(a.currentTime);
  g.setValueAtTime(g.value, a.currentTime);
  g.linearRampToValueAtTime(target, a.currentTime + seconds);
}

function start(): void {
  if (timer !== null) return;
  timer = window.setInterval(tick, 150);
  tick();
  fadeTo(volume * 0.4, 1.5);
}

function stop(): void {
  if (timer === null) return;
  window.clearInterval(timer);
  timer = null;
  fadeTo(0, 0.6);
}

function apply(): void {
  const active = wanted && !document.hidden;
  if (active) start();
  else stop();
}

/** Called by the UI whenever settings, the area or visibility change. */
export function setMusic(opts: { enabled: boolean; volume: number; theme: MusicTheme }): void {
  volume = Math.max(0, Math.min(1, opts.volume));
  if (opts.theme !== theme) {
    // Crossfade: dip, switch, swell – and start the new theme on a fresh bar.
    theme = opts.theme;
    step = 0;
    bar = 0;
    motif = [];
    seed = (seed + 7919) >>> 0;
    if (timer !== null) {
      fadeTo(0.0001, 0.4);
      const a = audioContext();
      if (a) nextTime = a.currentTime + 0.45;
      window.setTimeout(() => {
        if (timer !== null) fadeTo(volume * 0.4, 1.2);
      }, 450);
    }
  } else if (timer !== null) fadeTo(volume * 0.4, 0.3);
  wanted = opts.enabled;
  apply();
}

if (typeof document !== 'undefined') document.addEventListener('visibilitychange', apply);
