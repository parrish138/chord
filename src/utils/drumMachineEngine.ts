/**
 * WebAudio Synthesized Acoustic Drum Machine Engine
 * Pure WebAudio synthesis for 8 drum kit instruments:
 * Kick, Snare, Closed Hi-Hat, Open Hi-Hat, High Tom (Up), Low Tom (Down), Crash, Ride.
 */

export type DrumInstrument = 'kick' | 'snare' | 'hihatClosed' | 'hihatOpen' | 'tomHigh' | 'tomLow' | 'crash' | 'ride';

export interface DrumStepPattern {
  [instrument: string]: boolean[]; // 16 boolean steps per instrument
}

export interface DrumPreset {
  id: string;
  name: string;
  bpm: number;
  pattern: DrumStepPattern;
}

let audioCtx: AudioContext | null = null;
let isPlaying = false;
let bpm = 120;
let currentStep = 0; // 0 to 15
let nextStepTime = 0.0;
let timerID: number | null = null;

const scheduleAheadTime = 0.1;
const lookaheadMs = 25.0;

const stateSubscribers = new Set<(step: number, playing: boolean) => void>();

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// ----------------------------------------------------
// WebAudio Drum Sound Generators
// ----------------------------------------------------

export function playDrumSound(inst: DrumInstrument, timeOffset: number = 0): void {
  const ctx = getAudioContext();
  const time = timeOffset > 0 ? (timeOffset < 20 ? ctx.currentTime + timeOffset : timeOffset) : ctx.currentTime;

  switch (inst) {
    case 'kick': {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(150, time);
      osc.frequency.exponentialRampToValueAtTime(35, time + 0.12);

      gain.gain.setValueAtTime(1.0, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + 0.35);
      break;
    }
    case 'snare': {
      // Body tone
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.frequency.setValueAtTime(180, time);
      osc.frequency.exponentialRampToValueAtTime(80, time + 0.1);
      oscGain.gain.setValueAtTime(0.7, time);
      oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.12);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + 0.15);

      // Snare rattle noise
      const bufferSize = ctx.sampleRate * 0.2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1000, time);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.65, time);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.18);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(time);
      noise.stop(time + 0.2);
      break;
    }
    case 'hihatClosed': {
      const bufferSize = ctx.sampleRate * 0.06;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(7000, time);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.4, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(time);
      noise.stop(time + 0.06);
      break;
    }
    case 'hihatOpen': {
      const bufferSize = ctx.sampleRate * 0.3;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(6000, time);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.45, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.25);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(time);
      noise.stop(time + 0.3);
      break;
    }
    case 'tomHigh': {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(220, time);
      osc.frequency.exponentialRampToValueAtTime(110, time + 0.2);

      gain.gain.setValueAtTime(0.8, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + 0.25);
      break;
    }
    case 'tomLow': {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(130, time);
      osc.frequency.exponentialRampToValueAtTime(55, time + 0.25);

      gain.gain.setValueAtTime(0.9, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + 0.3);
      break;
    }
    case 'crash': {
      const bufferSize = ctx.sampleRate * 1.2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(4500, time);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.6, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 1.1);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(time);
      noise.stop(time + 1.2);
      break;
    }
    case 'ride': {
      // Bell ping
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.frequency.setValueAtTime(800, time);
      oscGain.gain.setValueAtTime(0.3, time);
      oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + 0.35);

      // Cymbal wash
      const bufferSize = ctx.sampleRate * 0.8;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(5500, time);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.35, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.75);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(time);
      noise.stop(time + 0.8);
      break;
    }
  }
}

// ----------------------------------------------------
// Preset Drum Beat Patterns (16 steps)
// ----------------------------------------------------

const emptyPattern = (): DrumStepPattern => ({
  kick: Array(16).fill(false),
  snare: Array(16).fill(false),
  hihatClosed: Array(16).fill(false),
  hihatOpen: Array(16).fill(false),
  tomHigh: Array(16).fill(false),
  tomLow: Array(16).fill(false),
  crash: Array(16).fill(false),
  ride: Array(16).fill(false),
});

export const PRESET_DRUM_BEATS: DrumPreset[] = [
  {
    id: 'rock-standard',
    name: '4/4 Classic Rock',
    bpm: 120,
    pattern: {
      kick: [true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false],
      snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      hihatClosed: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
      hihatOpen: [false, false, false, false, false, false, false, true, false, false, false, false, false, false, false, false],
      tomHigh: Array(16).fill(false),
      tomLow: Array(16).fill(false),
      crash: [true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      ride: Array(16).fill(false),
    },
  },
  {
    id: 'pop-disco',
    name: 'Four-on-the-Floor Pop',
    bpm: 124,
    pattern: {
      kick: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
      snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      hihatClosed: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
      hihatOpen: [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false],
      tomHigh: Array(16).fill(false),
      tomLow: Array(16).fill(false),
      crash: [true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      ride: Array(16).fill(false),
    },
  },
  {
    id: 'funk-groove',
    name: 'Syncopated Funk Groove',
    bpm: 105,
    pattern: {
      kick: [true, false, false, true, false, false, true, false, false, true, false, false, true, false, false, false],
      snare: [false, false, false, false, true, false, false, true, false, false, true, false, true, false, false, false],
      hihatClosed: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
      hihatOpen: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, true, false],
      tomHigh: Array(16).fill(false),
      tomLow: Array(16).fill(false),
      crash: Array(16).fill(false),
      ride: Array(16).fill(false),
    },
  },
  {
    id: 'country-fill',
    name: 'Country Boom-Chick & Toms',
    bpm: 110,
    pattern: {
      kick: [true, false, false, false, false, false, true, false, true, false, false, false, false, false, false, false],
      snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      hihatClosed: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
      hihatOpen: Array(16).fill(false),
      tomHigh: [false, false, false, false, false, false, false, false, false, false, true, true, false, false, false, false],
      tomLow: [false, false, false, false, false, false, false, false, false, false, false, false, false, true, true, false],
      crash: [true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
      ride: Array(16).fill(false),
    },
  },
];

let activePattern: DrumStepPattern = PRESET_DRUM_BEATS[0].pattern;

export function setActiveDrumPattern(pattern: DrumStepPattern): void {
  activePattern = pattern;
}

export function getActiveDrumPattern(): DrumStepPattern {
  return activePattern;
}

// ----------------------------------------------------
// WebAudio Sequencer Loop Scheduler
// ----------------------------------------------------

function nextStep(): void {
  const secondsPerStep = (60.0 / bpm) / 4; // 16th note steps
  nextStepTime += secondsPerStep;
  currentStep = (currentStep + 1) % 16;
}

function scheduler(): void {
  const ctx = getAudioContext();
  while (nextStepTime < ctx.currentTime + scheduleAheadTime) {
    // Schedule all active drum instruments for this 16th step
    Object.keys(activePattern).forEach(inst => {
      if (activePattern[inst] && activePattern[inst][currentStep]) {
        playDrumSound(inst as DrumInstrument, nextStepTime);
      }
    });

    stateSubscribers.forEach(sub => sub(currentStep, isPlaying));
    nextStep();
  }
  if (isPlaying) {
    timerID = window.setTimeout(scheduler, lookaheadMs);
  }
}

export function startDrumMachine(): void {
  if (isPlaying) return;
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  isPlaying = true;
  currentStep = 0;
  nextStepTime = ctx.currentTime + 0.05;
  stateSubscribers.forEach(sub => sub(currentStep, isPlaying));
  scheduler();
}

export function stopDrumMachine(): void {
  isPlaying = false;
  if (timerID !== null) {
    window.clearTimeout(timerID);
    timerID = null;
  }
  currentStep = 0;
  stateSubscribers.forEach(sub => sub(currentStep, isPlaying));
}

export function toggleDrumMachine(): boolean {
  if (isPlaying) {
    stopDrumMachine();
  } else {
    startDrumMachine();
  }
  return isPlaying;
}

export function setDrumBpm(newBpm: number): void {
  bpm = Math.min(240, Math.max(40, Math.round(newBpm)));
}

export function getDrumBpm(): number {
  return bpm;
}

export function isDrumMachinePlaying(): boolean {
  return isPlaying;
}

export function subscribeDrumMachine(listener: (step: number, playing: boolean) => void): () => void {
  stateSubscribers.add(listener);
  return () => {
    stateSubscribers.delete(listener);
  };
}
