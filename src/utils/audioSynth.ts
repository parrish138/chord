import { ChordDefinition, FingerPosition, BarreChord } from '../types/chord';
import { playRahtzPluck } from './rahtzKarplusStrong';

export type GuitarPreset = 'acoustic' | 'nylon' | 'electric-clean' | 'overdrive';

export interface GuitarToneParams {
  sustain: number;    // 1 to 10 (default 5)
  reverb: number;     // 0 to 100 (% wet mix level)
  brightness: number; // 1000 to 8000 (Hz lowpass cutoff)
}

// Standard guitar string base pitches (string 6 to string 1)
const STANDARD_OPEN_FREQUENCIES: Record<number, number> = {
  6: 82.41,  // E2 (Low E)
  5: 110.00, // A2
  4: 146.83, // D3
  3: 196.00, // G3
  2: 246.94, // B3
  1: 329.63, // E4 (High E)
};

let audioCtx: AudioContext | null = null;
let currentPreset: GuitarPreset = 'acoustic';

let currentToneParams: GuitarToneParams = {
  sustain: 5,
  reverb: 25,
  brightness: 3600,
};

const presetListeners = new Set<(preset: GuitarPreset) => void>();
const toneParamsListeners = new Set<(params: GuitarToneParams) => void>();

export function setGuitarPreset(preset: GuitarPreset): void {
  currentPreset = preset;
  // Set default preset brightness
  const defaultBrightness = preset === 'nylon' ? 2600 : preset === 'electric-clean' ? 5200 : preset === 'overdrive' ? 3200 : 3600;
  currentToneParams.brightness = defaultBrightness;

  presetListeners.forEach(listener => listener(preset));
  toneParamsListeners.forEach(listener => listener(currentToneParams));
}

export function getGuitarPreset(): GuitarPreset {
  return currentPreset;
}

export function subscribeGuitarPreset(listener: (preset: GuitarPreset) => void): () => void {
  presetListeners.add(listener);
  return () => {
    presetListeners.delete(listener);
  };
}

export function setGuitarToneParams(params: Partial<GuitarToneParams>): void {
  currentToneParams = { ...currentToneParams, ...params };
  toneParamsListeners.forEach(listener => listener(currentToneParams));
}

export function getGuitarToneParams(): GuitarToneParams {
  return currentToneParams;
}

export function subscribeGuitarToneParams(listener: (params: GuitarToneParams) => void): () => void {
  toneParamsListeners.add(listener);
  return () => {
    toneParamsListeners.delete(listener);
  };
}

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

/**
 * Calculates frequency for a given string (1-6) and fret (0-24)
 */
export function getFrequencyForStringAndFret(stringNum: number, fret: number): number {
  const baseFreq = STANDARD_OPEN_FREQUENCIES[stringNum] || 220;
  return baseFreq * Math.pow(2, fret / 12);
}

/**
 * Play a warm, physically modeled plucked guitar string note with custom tone settings
 */
export function playPluckedNote(
  freq: number, 
  startTime: number = 0, 
  duration: number = 2.6, 
  volume: number = 0.45,
  stringNum: number = 3,
  preset: GuitarPreset = currentPreset,
  customParams?: Partial<GuitarToneParams>
): void {
  playRahtzPluck(freq, startTime, duration, volume, stringNum, preset, customParams);
}

/**
 * Play a full guitar chord with customizable strum speed, direction, and physical modeling
 */
export function strumChord(
  chord: ChordDefinition, 
  direction: 'down' | 'up' = 'down', 
  strumSpeedMs: number = 35,
  preset: GuitarPreset = currentPreset,
  customParams?: Partial<GuitarToneParams>
): void {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const stringNotes: { stringNum: number; fret: number }[] = [];

  for (let s = 1; s <= 6; s++) {
    const isMuted = chord.mutedStrings?.includes(s);
    if (isMuted) continue;

    const pos = chord.positions.find((p: FingerPosition) => p.string === s);
    const barre = chord.barres?.find((b: BarreChord) => s >= b.startString && s <= b.endString);

    let fret = 0;
    if (pos) {
      fret = pos.fret;
    } else if (barre) {
      fret = barre.fret;
    } else if (chord.openStrings?.includes(s)) {
      fret = 0;
    } else {
      fret = 0;
    }

    stringNotes.push({ stringNum: s, fret });
  }

  if (direction === 'down') {
    stringNotes.sort((a, b) => b.stringNum - a.stringNum); // Low E (6) to High E (1)
  } else {
    stringNotes.sort((a, b) => a.stringNum - b.stringNum); // High E (1) to Low E (6)
  }

  const delaySec = strumSpeedMs / 1000;
  stringNotes.forEach((item, index) => {
    const freq = getFrequencyForStringAndFret(item.stringNum, item.fret);
    playPluckedNote(freq, index * delaySec, 2.6, 0.45, item.stringNum, preset, customParams);
  });
}
