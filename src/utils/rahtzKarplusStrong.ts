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

const bodyIRCache: Record<number, AudioBuffer> = {};

/**
 * Creates synthetic acoustic body impulse response for wood/chamber resonance
 */
export function makeBodyIR(audioCtx: AudioContext, brightness: number): AudioBuffer {
  const roundedKey = Math.round(brightness * 100) / 100;
  if (bodyIRCache[roundedKey]) return bodyIRCache[roundedKey];

  const len = Math.round(audioCtx.sampleRate * 0.2);
  const buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
  const data = buf.getChannelData(0);
  const freq = 95 + brightness * 25;
  let prev = 0;

  for (let i = 0; i < len; i++) {
    const t = i / audioCtx.sampleRate;
    const noise = Math.random() * 2 - 1;
    prev = 0.6 * noise + 0.4 * prev;
    data[i] = prev * Math.exp(-t * 30) * (0.6 + 0.4 * Math.sin(2 * Math.PI * freq * t));
  }
  bodyIRCache[roundedKey] = buf;
  return buf;
}

/**
 * Creates hyperbolic tangent WaveShaper curve for tube overdrive distortion
 */
export function makeDistortionCurve(amount: number): Float32Array {
  const n = 44100;
  const curve = new Float32Array(n);
  const k = amount * 50 + 1;
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = Math.tanh(k * x) / Math.tanh(k);
  }
  return curve;
}

/**
 * Pluck note using physical string synthesis with customizable DSP algorithm modifiers
 */
export function playRahtzPluck(
  freq: number,
  startTime: number = 0,
  duration: number = 2.6,
  volume: number = 0.45,
  stringNum: number = 3,
  preset: string = 'acoustic',
  customParams?: Partial<GuitarToneParams>
): void {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  // Active tone & DSP params
  const activeParams: GuitarToneParams = {
    ...getGuitarToneParams(),
    ...customParams,
  };

  let actualStart = ctx.currentTime;
  if (startTime > 0) {
    if (startTime < 20.0) {
      actualStart = ctx.currentTime + startTime;
    } else {
      actualStart = Math.max(ctx.currentTime, startTime);
    }
  }

  const sampleRate = ctx.sampleRate;
  const detuneCents = activeParams.detune !== undefined ? activeParams.detune : (preset === 'acoustic' ? 3 : 1);
  const detunes = detuneCents > 0 ? [-detuneCents, 0, detuneCents] : [0];

  const masterCompressor = getMasterCompressor(ctx);

  detunes.forEach(cents => {
    const tunedFreq = freq * Math.pow(2, cents / 1200);
    const period = Math.max(2, Math.round(sampleRate / tunedFreq));
    const totalSamples = Math.round(sampleRate * duration);

    const buffer = ctx.createBuffer(1, totalSamples, sampleRate);
    const data = buffer.getChannelData(0);

    const ring = new Float32Array(period);
    let excitePrev = 0;

    // Pick attack noise burst filter (excitationCutoff)
    const exciteCutoff = activeParams.excitationCutoff || 3200;
    const excitationBlend = Math.min(0.9, Math.max(0.1, (exciteCutoff / sampleRate) * 8));

    for (let i = 0; i < period; i++) {
      const rawNoise = Math.random() * 2 - 1;
      excitePrev = excitationBlend * rawNoise + (1 - excitationBlend) * excitePrev;
      ring[i] = excitePrev;
    }

    const pickIdx = Math.max(1, Math.floor(period * 0.15));
    for (let i = 0; i < pickIdx; i++) ring[i] *= 0.35;

    // In-loop feedback loss filter & decay damping
    const loopBlend = activeParams.loopBlend !== undefined ? activeParams.loopBlend : 0.35;
    const sustainOffset = activeParams.effectsEnabled ? (activeParams.sustain - 5) * 0.0008 : 0;
    const baseDamping = preset === 'nylon' ? 0.992 : preset === 'electric-clean' ? 0.997 : preset === 'overdrive' ? 0.996 : 0.995;
    const damping = Math.min(0.999, Math.max(0.950, baseDamping + sustainOffset));

    let idx = 0;
    let prev = ring[period - 1];

    for (let i = 0; i < totalSamples; i++) {
      const cur = ring[idx];
      const filtered = loopBlend * cur + (1 - loopBlend) * prev;
      const decayed = filtered * damping;
      data[i] = cur;
      ring[idx] = decayed;
      prev = decayed;
      idx = (idx + 1) % period;
    }

    // Audio Graph
    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const toneVal = activeParams.tone !== undefined ? activeParams.tone : 0.35;
    const baseOutputCutoff = activeParams.outputCutoff || (preset === 'nylon' ? 3200 : preset === 'electric-clean' ? 7000 : preset === 'overdrive' ? 6000 : 4500);
    const effectiveCutoff = activeParams.effectsEnabled ? activeParams.brightness : (baseOutputCutoff * (0.5 + toneVal));

    const outputFilter = ctx.createBiquadFilter();
    outputFilter.type = 'lowpass';
    outputFilter.frequency.setValueAtTime(Math.min(20000, effectiveCutoff), actualStart);
    outputFilter.Q.setValueAtTime(0.7, actualStart);

    let chainEnd: AudioNode = src;

    // WaveShaper Overdrive Distortion
    if (activeParams.distortion && activeParams.distortion > 0) {
      const shaper = ctx.createWaveShaper();
      shaper.curve = makeDistortionCurve(activeParams.distortion);
      shaper.oversample = '4x';

      const postGain = ctx.createGain();
      postGain.gain.setValueAtTime(0.5, actualStart);

      chainEnd.connect(shaper);
      shaper.connect(postGain);
      chainEnd = postGain;
    }

    // Acoustic Body Convolver IR Mix
    const bodyMix = activeParams.bodyMix !== undefined ? activeParams.bodyMix : (preset === 'acoustic' ? 0.40 : preset === 'nylon' ? 0.50 : 0.05);
    const bodyGain = ctx.createGain();
    bodyGain.gain.setValueAtTime(1.0, actualStart);

    if (bodyMix > 0) {
      const conv = ctx.createConvolver();
      conv.buffer = makeBodyIR(ctx, bodyMix);
      conv.normalize = true;

      const dry = ctx.createGain();
      const wet = ctx.createGain();
      dry.gain.setValueAtTime(1 - bodyMix, actualStart);
      wet.gain.setValueAtTime(bodyMix, actualStart);

      chainEnd.connect(dry);
      chainEnd.connect(conv);
      conv.connect(wet);

      dry.connect(bodyGain);
      wet.connect(bodyGain);
    } else {
      chainEnd.connect(bodyGain);
    }

    bodyGain.connect(outputFilter);

    // Stereo Panning & Volume Gain
    const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    const panPos = ((stringNum - 3.5) / 2.5) * 0.35; // -0.35 left (Low E) to +0.35 right (High E)

    const masterGain = ctx.createGain();
    const voiceGain = (0.32 / detunes.length) * volume;
    masterGain.gain.setValueAtTime(voiceGain, actualStart);

    if (panner) {
      panner.pan.setValueAtTime(panPos, actualStart);
      outputFilter.connect(panner);
      panner.connect(masterGain);
    } else {
      outputFilter.connect(masterGain);
    }

    masterGain.connect(masterCompressor);

    // Reverb Convolver Send (if FX enabled)
    if (activeParams.effectsEnabled && activeParams.reverb > 0) {
      const convolver = getReverbConvolver(ctx);
      const wetGain = ctx.createGain();
      const wetLevel = (activeParams.reverb / 100) * 0.35;
      wetGain.gain.setValueAtTime(wetLevel, actualStart);

      masterGain.connect(convolver);
      convolver.connect(wetGain);
      wetGain.connect(masterCompressor);
    }

    src.start(actualStart);
    src.stop(actualStart + duration + 0.2);
  });
}
