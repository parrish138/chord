import { GuitarToneParams, getGuitarToneParams } from './audioSynth';

/**
 * Rahtz Karplus-Strong Physical String Synthesis Engine
 * Refined guitar DSP physics with in-loop loss filtering, filtered excitation bursts,
 * customizable sustain damping, stereo room reverb convolver, and master dynamics compression.
 */

export interface RahtzKSOptions {
  stringTension: number;
  pluckDamping: number;
  stereoSpread: number;
  bodyResonance: boolean;
}

export const DEFAULT_RAHTZ_OPTIONS: RahtzKSOptions = {
  stringTension: 0.5,
  pluckDamping: 0.5,
  stereoSpread: 0.6,
  bodyResonance: true,
};

let audioCtx: AudioContext | null = null;
let masterCompressor: DynamicsCompressorNode | null = null;
let reverbConvolver: ConvolverNode | null = null;

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

function getMasterCompressor(ctx: AudioContext): DynamicsCompressorNode {
  if (!masterCompressor || masterCompressor.context !== ctx) {
    masterCompressor = ctx.createDynamicsCompressor();
    masterCompressor.threshold.setValueAtTime(-12, ctx.currentTime);
    masterCompressor.knee.setValueAtTime(10, ctx.currentTime);
    masterCompressor.ratio.setValueAtTime(4, ctx.currentTime);
    masterCompressor.attack.setValueAtTime(0.003, ctx.currentTime);
    masterCompressor.release.setValueAtTime(0.15, ctx.currentTime);
    masterCompressor.connect(ctx.destination);
  }
  return masterCompressor;
}

/**
 * Creates synthetic stereo room acoustic impulse response
 */
function getReverbConvolver(ctx: AudioContext): ConvolverNode {
  if (!reverbConvolver || reverbConvolver.context !== ctx) {
    reverbConvolver = ctx.createConvolver();
    const duration = 1.6;
    const decay = 2.2;
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * duration;
    const impulse = ctx.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const t = i / length;
      const factor = Math.exp(-t * decay);
      left[i] = (Math.random() * 2 - 1) * factor;
      right[i] = (Math.random() * 2 - 1) * factor;
    }

    reverbConvolver.buffer = impulse;
  }
  return reverbConvolver;
}

function makeDistortionCurve(amount: number = 25): Float32Array {
  const n_samples = 44100;
  const curve = new Float32Array(n_samples);
  const deg = Math.PI / 180;
  for (let i = 0; i < n_samples; ++i) {
    const x = (i * 2) / n_samples - 1;
    curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}

/**
 * Pluck note using refined Karplus-Strong physical modeling algorithm
 */
export function playRahtzPluck(
  freq: number,
  startTime: number = 0,
  duration: number = 2.8,
  volume: number = 0.45,
  stringNum: number = 3,
  preset: string = 'acoustic',
  customParams?: Partial<GuitarToneParams>
): void {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  // Active tone params (merge default tone params with any custom overrides)
  const activeParams: GuitarToneParams = {
    ...getGuitarToneParams(),
    ...customParams,
  };

  // Safe WebAudio start time calculation for staggered strumming
  let actualStart = ctx.currentTime;
  if (startTime > 0) {
    if (startTime < 20.0) {
      actualStart = ctx.currentTime + startTime;
    } else {
      actualStart = Math.max(ctx.currentTime, startTime);
    }
  }

  const sampleRate = ctx.sampleRate;

  // 1. Period length N with linear fractional delay
  const period = sampleRate / freq;
  const N = Math.floor(period);
  const frac = period - N;

  const totalSamples = Math.round(sampleRate * duration);
  const buffer = ctx.createBuffer(2, totalSamples, sampleRate);
  const leftChannel = buffer.getChannelData(0);
  const rightChannel = buffer.getChannelData(1);

  const synthesis = new Float32Array(totalSamples);
  const delayLine = new Float32Array(N + 2);

  // 2. Filtered Excitation Burst for ALL strings (removes harsh white noise burst)
  const isLowString = freq < 160;
  const excitationLength = Math.min(N, Math.round(sampleRate * (isLowString ? 0.004 : 0.0025)));

  let noisePrev = 0;
  for (let i = 0; i < excitationLength; i++) {
    const rawNoise = Math.random() * 2 - 1;
    // 1-pole lowpass filter applied to excitation for every string
    const filteredNoise = 0.75 * noisePrev + 0.25 * rawNoise;
    noisePrev = filteredNoise;

    const envelope = Math.sin((Math.PI * i) / excitationLength);
    delayLine[i] = filteredNoise * envelope * (isLowString ? 0.28 : 0.32);
  }

  // 3. Tuned Damping & Sustain Coefficients (sustain ranges 1 to 10)
  const sustainOffset = (activeParams.sustain - 5) * 0.0025;
  const baseDamping =
    preset === 'nylon' ? 0.965 :
    preset === 'electric-clean' ? 0.980 :
    preset === 'overdrive' ? 0.975 :
    0.975; // acoustic

  const damping = Math.min(0.994, Math.max(0.920, baseDamping + sustainOffset + (isLowString ? 0.003 : 0)));

  // In-loop loss filter coefficient (frequency-dependent loss inside string feedback loop)
  const lossCoeff =
    preset === 'nylon' ? 0.30 :
    preset === 'electric-clean' ? 0.45 :
    preset === 'overdrive' ? 0.40 :
    0.36;

  let readPtr = 0;
  let loopPrev = 0;

  // 4. Karplus-Strong Loop with In-Loop Loss Filter
  for (let i = 0; i < totalSamples; i++) {
    const idx0 = readPtr;
    const idx1 = (readPtr + 1) % N;

    // Linear fractional interpolation on read side
    const currentSample = delayLine[idx0] * (1 - frac) + delayLine[idx1] * frac;
    synthesis[i] = currentSample;

    // 1-pole lowpass feedback loss filter: H(z) = (1 - S) + S * z^-1
    const filtered = (lossCoeff * currentSample + (1 - lossCoeff) * loopPrev) * damping;
    loopPrev = currentSample;

    delayLine[readPtr] = filtered;
    readPtr = (readPtr + 1) % N;
  }

  // 5. Fade tails at end of buffer
  const fadeLength = Math.min(1024, Math.floor(totalSamples * 0.1));
  for (let i = 0; i < fadeLength; i++) {
    const fadeIdx = totalSamples - 1 - i;
    synthesis[fadeIdx] *= (i / fadeLength);
  }

  // Stereo Spreading (-0.35 left for Low E to +0.35 right for High E)
  const acousticLocation = (stringNum - 3.5) / 2.5;
  const scaledVolume = isLowString ? volume * 0.75 : volume;

  const gainL = (1 - acousticLocation * 0.35) * 0.5 * scaledVolume;
  const gainR = (1 + acousticLocation * 0.35) * 0.5 * scaledVolume;

  for (let i = 0; i < totalSamples; i++) {
    leftChannel[i] = synthesis[i] * gainL;
    rightChannel[i] = synthesis[i] * gainR;
  }

  // 6. Audio Buffer & Output Cabinet Filters
  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const cutoffHz = activeParams.brightness;

  const lowpassFilter = ctx.createBiquadFilter();
  lowpassFilter.type = 'lowpass';
  lowpassFilter.frequency.setValueAtTime(cutoffHz, actualStart);

  const bassFilter = ctx.createBiquadFilter();
  bassFilter.type = 'lowshelf';
  bassFilter.frequency.setValueAtTime(100, actualStart);
  bassFilter.gain.setValueAtTime(isLowString ? 2.5 : 1.0, actualStart);

  const bodyResonance = ctx.createBiquadFilter();
  bodyResonance.type = 'peaking';
  bodyResonance.frequency.setValueAtTime(180, actualStart);
  bodyResonance.Q.setValueAtTime(1.2, actualStart);
  bodyResonance.gain.setValueAtTime(1.5, actualStart);

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(1.0, actualStart);

  const compressor = getMasterCompressor(ctx);

  if (preset === 'overdrive') {
    const waveShaper = ctx.createWaveShaper();
    waveShaper.curve = makeDistortionCurve(25);
    source.connect(waveShaper);
    waveShaper.connect(lowpassFilter);
  } else {
    source.connect(lowpassFilter);
  }

  lowpassFilter.connect(bassFilter);
  bassFilter.connect(bodyResonance);
  bodyResonance.connect(gainNode);

  // Direct dry signal to compressor
  gainNode.connect(compressor);

  // Wet Reverb Convolver Node
  if (activeParams.reverb > 0) {
    const convolver = getReverbConvolver(ctx);
    const wetGain = ctx.createGain();
    const wetLevel = (activeParams.reverb / 100) * 0.35;
    wetGain.gain.setValueAtTime(wetLevel, actualStart);

    gainNode.connect(convolver);
    convolver.connect(wetGain);
    wetGain.connect(compressor);
  }

  source.start(actualStart);
}
