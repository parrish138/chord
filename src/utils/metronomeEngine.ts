/**
 * WebAudio Precision Metronome Engine
 * Implements a rock-solid look-ahead scheduler using WebAudio currentTime to eliminate timer jitter.
 */

export interface MetronomeState {
  isPlaying: boolean;
  bpm: number;
  beatsPerMeasure: number; // 2, 3, 4, 6
  currentBeat: number;     // 1 to beatsPerMeasure
}

let audioCtx: AudioContext | null = null;
let isPlaying = false;
let bpm = 120;
let beatsPerMeasure = 4;
let currentBeat = 0; // 0-indexed count

let nextNoteTime = 0.0;
let timerID: number | null = null;
const scheduleAheadTime = 0.1; // seconds
const lookaheadMs = 25.0;      // ms

const stateSubscribers = new Set<(state: MetronomeState) => void>();
let tapTimes: number[] = [];

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

function notifySubscribers(): void {
  const state: MetronomeState = {
    isPlaying,
    bpm,
    beatsPerMeasure,
    currentBeat: currentBeat + 1,
  };
  stateSubscribers.forEach(sub => sub(state));
}

function scheduleClick(beatNumber: number, time: number): void {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  const isAccent = beatNumber === 0;
  osc.frequency.setValueAtTime(isAccent ? 1200 : 800, time);
  osc.type = isAccent ? 'triangle' : 'sine';

  gain.gain.setValueAtTime(isAccent ? 0.6 : 0.35, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(time);
  osc.stop(time + 0.05);
}

function nextNote(): void {
  const secondsPerBeat = 60.0 / bpm;
  nextNoteTime += secondsPerBeat;
  currentBeat = (currentBeat + 1) % beatsPerMeasure;
}

function scheduler(): void {
  const ctx = getAudioContext();
  while (nextNoteTime < ctx.currentTime + scheduleAheadTime) {
    scheduleClick(currentBeat, nextNoteTime);
    notifySubscribers();
    nextNote();
  }
  if (isPlaying) {
    timerID = window.setTimeout(scheduler, lookaheadMs);
  }
}

export function startMetronome(): void {
  if (isPlaying) return;
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  isPlaying = true;
  currentBeat = 0;
  nextNoteTime = ctx.currentTime + 0.05;
  notifySubscribers();
  scheduler();
}

export function stopMetronome(): void {
  isPlaying = false;
  if (timerID !== null) {
    window.clearTimeout(timerID);
    timerID = null;
  }
  currentBeat = 0;
  notifySubscribers();
}

export function toggleMetronome(): boolean {
  if (isPlaying) {
    stopMetronome();
  } else {
    startMetronome();
  }
  return isPlaying;
}

export function setMetronomeBpm(newBpm: number): void {
  bpm = Math.min(260, Math.max(30, Math.round(newBpm)));
  notifySubscribers();
}

export function setBeatsPerMeasure(beats: number): void {
  beatsPerMeasure = beats;
  if (currentBeat >= beatsPerMeasure) {
    currentBeat = 0;
  }
  notifySubscribers();
}

export function handleTapTempo(): number {
  const now = Date.now();
  tapTimes.push(now);

  // Keep last 4 taps within 3 seconds
  tapTimes = tapTimes.filter(t => now - t <= 3000);

  if (tapTimes.length >= 2) {
    const intervals: number[] = [];
    for (let i = 1; i < tapTimes.length; i++) {
      intervals.push(tapTimes[i] - tapTimes[i - 1]);
    }
    const avgMs = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const calculatedBpm = Math.round(60000 / avgMs);
    setMetronomeBpm(calculatedBpm);
  }

  return bpm;
}

export function getMetronomeState(): MetronomeState {
  return {
    isPlaying,
    bpm,
    beatsPerMeasure,
    currentBeat: currentBeat + 1,
  };
}

export function subscribeMetronome(listener: (state: MetronomeState) => void): () => void {
  stateSubscribers.add(listener);
  return () => {
    stateSubscribers.delete(listener);
  };
}
