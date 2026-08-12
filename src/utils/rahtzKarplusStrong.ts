import { GuitarToneParams, getGuitarToneParams } from './audioSynth';

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
let masterHeadroomGain: GainNode | null = null;
let masterLimiterCompressor: DynamicsCompressorNode | null = null;
let masterOutputGain: GainNode | null = null;
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

function getMasterLimiterBus(ctx: AudioContext): { masterHeadroom: GainNode; masterLimiter: DynamicsCompressorNode } {
  if (!masterHeadroomGain || masterHeadroomGain.context !== ctx) {
    // Master Headroom gain (0.95 scales guitar voices to match drum machine amplitude)
    masterHeadroomGain = ctx.createGain();
    masterHeadroomGain.gain.setValueAtTime(0.95, ctx.currentTime);

    // Dynamic RMS Equalizer & Peak Compressor (-8dB threshold, ratio 4:1, soft knee 6dB)
    masterLimiterCompressor = ctx.createDynamicsCompressor();
    masterLimiterCompressor.threshold.setValueAtTime(-8.0, ctx.currentTime);
    masterLimiterCompressor.knee.setValueAtTime(6.0, ctx.currentTime);
    masterLimiterCompressor.ratio.setValueAtTime(4.0, ctx.currentTime);
    masterLimiterCompressor.attack.setValueAtTime(0.003, ctx.currentTime);
    masterLimiterCompressor.release.setValueAtTime(0.080, ctx.currentTime);

    masterOutputGain = ctx.createGain();
    masterOutputGain.gain.setValueAtTime(1.0, ctx.currentTime);

    masterHeadroomGain.connect(masterLimiterCompressor);
    masterLimiterCompressor.connect(masterOutputGain);
    masterOutputGain.connect(ctx.destination);
  }

  // Dynamic master output gain scaling (vol * 2.2 matches drum machine peak dB)
  const activeParams = getGuitarToneParams();
  const vol = activeParams.volume !== undefined ? activeParams.volume : 1.0;
  if (masterOutputGain) {
    masterOutputGain.gain.setValueAtTime(vol * 2.2, ctx.currentTime);
  }

  return { masterHeadroom: masterHeadroomGain, masterLimiter: masterLimiterCompressor! };
}

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

// Per-String Voice Stealing Registry (Strict 6 Polyphony: 1 active voice per string 1..6)
interface ActiveVoice {
  stringNum: number;
  sources: AudioBufferSourceNode[];
  gainNode: GainNode;
  startTime: number;
}

const activeStringVoices = new Map<number, ActiveVoice>();

function stealVoiceForString(ctx: AudioContext, stringNum: number, startTime: number): void {
  const existing = activeStringVoices.get(stringNum);
  if (existing) {
    try {
      // Only steal if previous voice started at or before this new voice
      if (existing.startTime <= startTime + 0.005) {
        existing.gainNode.gain.cancelScheduledValues(startTime);
        existing.gainNode.gain.setValueAtTime(existing.gainNode.gain.value, startTime);
        existing.gainNode.gain.setTargetAtTime(0.0001, startTime, 0.004);

        const oldSources = existing.sources;
        const oldGain = existing.gainNode;
        const delayMs = Math.max(20, Math.round((startTime - ctx.currentTime + 0.02) * 1000));

        setTimeout(() => {
          oldSources.forEach(src => {
            try {
              src.stop();
              src.disconnect();
            } catch {}
          });
          try {
            oldGain.disconnect();
          } catch {}
        }, delayMs);
      }
    } catch {}
    activeStringVoices.delete(stringNum);
  }
}

const bodyIRCache: Record<number, AudioBuffer> = {};

/**
 * Creates and caches synthetic acoustic body impulse response buffer
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
 * Pluck note using physical string synthesis with voice stealing, headroom scaling, and per-voice body convolvers
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

  // 1. Voice Stealing: Steal & fade out previous voice on this exact string (max 6 polyphony)
  stealVoiceForString(ctx, stringNum, actualStart);

  const stringGainNode = ctx.createGain();
  stringGainNode.gain.setValueAtTime(1.0, actualStart);

  const { masterHeadroom } = getMasterLimiterBus(ctx);
  stringGainNode.connect(masterHeadroom);

  const detuneCents = activeParams.detune !== undefined ? activeParams.detune : (preset === 'acoustic' ? 3 : 1);
  const detunes = detuneCents > 0 ? [-detuneCents, 0, detuneCents] : [0];
  const createdSources: AudioBufferSourceNode[] = [];

  const loopBlend = activeParams.loopBlend !== undefined ? activeParams.loopBlend : 0.35;
  const exciteCutoff = activeParams.excitationCutoff || 3200;
  const sampleRate = ctx.sampleRate;

  detunes.forEach(cents => {
    const tunedFreq = freq * Math.pow(2, cents / 1200);
    const period = Math.max(2, Math.round(sampleRate / tunedFreq));
    const totalSamples = Math.round(sampleRate * duration);

    const buffer = ctx.createBuffer(1, totalSamples, sampleRate);
    const data = buffer.getChannelData(0);

    const ring = new Float32Array(period);
    let excitePrev = 0;
    const excitationBlend = Math.min(0.9, Math.max(0.1, (exciteCutoff / sampleRate) * 8));

    for (let i = 0; i < period; i++) {
      const rawNoise = Math.random() * 2 - 1;
      excitePrev = excitationBlend * rawNoise + (1 - excitationBlend) * excitePrev;
      ring[i] = excitePrev;
    }

    const pickIdx = Math.max(1, Math.floor(period * 0.15));
    for (let i = 0; i < pickIdx; i++) ring[i] *= 0.35;

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

    // Fade out tail to prevent end clicks
    const fadeLength = Math.min(1024, Math.floor(totalSamples * 0.05));
    for (let i = 0; i < fadeLength; i++) {
      const fadeIdx = totalSamples - 1 - i;
      data[fadeIdx] *= (i / fadeLength);
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    createdSources.push(src);

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

    // Acoustic Body Convolver (Fresh ConvolverNode per voice using cached IR buffer)
    const bodyMix = activeParams.bodyMix !== undefined ? activeParams.bodyMix : (preset === 'acoustic' ? 0.40 : preset === 'nylon' ? 0.50 : 0.05);

    if (bodyMix > 0) {
      const conv = ctx.createConvolver();
      conv.buffer = makeBodyIR(ctx, bodyMix);
      conv.normalize = false;

      const dry = ctx.createGain();
      const wet = ctx.createGain();
      dry.gain.setValueAtTime(1 - bodyMix, actualStart);
      wet.gain.setValueAtTime(bodyMix, actualStart);

      chainEnd.connect(dry);
      chainEnd.connect(conv);
      conv.connect(wet);

      dry.connect(outputFilter);
      wet.connect(outputFilter);
    } else {
      chainEnd.connect(outputFilter);
    }

    // Stereo Panning & Volume Gain
    const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    const panPos = ((stringNum - 3.5) / 2.5) * 0.35; // -0.35 left (Low E) to +0.35 right (High E)

    const voiceGainNode = ctx.createGain();
    const voiceVolume = (0.75 / detunes.length) * volume;
    voiceGainNode.gain.setValueAtTime(voiceVolume, actualStart);

    if (panner) {
      panner.pan.setValueAtTime(panPos, actualStart);
      outputFilter.connect(panner);
      panner.connect(voiceGainNode);
    } else {
      outputFilter.connect(voiceGainNode);
    }

    voiceGainNode.connect(stringGainNode);

    // Reverb Convolver Send (if FX enabled)
    if (activeParams.effectsEnabled && activeParams.reverb > 0) {
      const convolver = getReverbConvolver(ctx);
      const wetGain = ctx.createGain();
      const wetLevel = (activeParams.reverb / 100) * 0.35;
      wetGain.gain.setValueAtTime(wetLevel, actualStart);

      voiceGainNode.connect(convolver);
      convolver.connect(wetGain);
      wetGain.connect(masterHeadroom);
    }

    src.start(actualStart);
    src.stop(actualStart + duration + 0.1);
  });

  // Register active voice for this string in voice stealing registry
  activeStringVoices.set(stringNum, {
    stringNum,
    sources: createdSources,
    gainNode: stringGainNode,
    startTime: actualStart,
  });
}
