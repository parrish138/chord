/**
 * Rahtz Karplus-Strong Physical String Synthesis Engine (Warm & Deep Bass)
 * Refined for deep, rich acoustic bass on low notes (E2, A2) and crisp response on high notes (E4).
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

function makeDistortionCurve(amount: number = 35): Float32Array {
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
 * Pluck note using Karplus-Strong algorithm with WebAudio timestamp calculation
 */
export function playRahtzPluck(
  freq: number,
  startTime: number = 0,
  duration: number = 2.8,
  volume: number = 0.45,
  stringNum: number = 3,
  preset: string = 'acoustic'
): void {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  // Safe WebAudio start time calculation
  let actualStart = ctx.currentTime;
  if (startTime > 0) {
    if (startTime < 20.0) {
      // Relative offset in seconds (e.g. 0.035s for strum stagger)
      actualStart = ctx.currentTime + startTime;
    } else {
      // Absolute WebAudio timestamp
      actualStart = Math.max(ctx.currentTime, startTime);
    }
  }

  const sampleRate = ctx.sampleRate;

  // 1. Exact Period length N (with fractional delay)
  const period = sampleRate / freq;
  const N = Math.floor(period);
  const frac = period - N;

  const totalSamples = Math.round(sampleRate * duration);
  const buffer = ctx.createBuffer(2, totalSamples, sampleRate);
  const leftChannel = buffer.getChannelData(0);
  const rightChannel = buffer.getChannelData(1);

  const synthesis = new Float32Array(totalSamples);
  const delayLine = new Float32Array(N + 2);

  // 2. Excitation Burst:
  const isLowString = freq < 160;
  const excitationLength = Math.min(N, Math.round(sampleRate * (isLowString ? 0.004 : 0.0025)));

  let noisePrev = 0;
  for (let i = 0; i < excitationLength; i++) {
    const rawNoise = Math.random() * 2 - 1;
    const filteredNoise = isLowString ? 0.6 * rawNoise + 0.4 * noisePrev : rawNoise;
    noisePrev = filteredNoise;

    const envelope = Math.sin((Math.PI * i) / excitationLength);
    delayLine[i] = filteredNoise * envelope * (isLowString ? 0.35 : 0.45);
  }

  // 3. Damping coefficient
  const baseDamping = preset === 'nylon' ? 0.968 : preset === 'overdrive' ? 0.991 : 0.985;
  const damping = isLowString ? Math.min(0.992, baseDamping + 0.004) : baseDamping;

  let readPtr = 0;
  let prevSample = 0;

  // 4. Karplus-Strong Loop
  for (let i = 0; i < totalSamples; i++) {
    const idx0 = readPtr;
    const idx1 = (readPtr + 1) % N;

    const currentSample = delayLine[idx0] * (1 - frac) + delayLine[idx1] * frac;
    synthesis[i] = currentSample;

    const filtered = 0.5 * (currentSample + prevSample) * damping;
    prevSample = currentSample;

    delayLine[readPtr] = filtered;
    readPtr = (readPtr + 1) % N;
  }

  // 5. Fade tails
  const fadeLength = Math.min(1024, Math.floor(totalSamples * 0.1));
  for (let i = 0; i < fadeLength; i++) {
    const fadeIdx = totalSamples - 1 - i;
    synthesis[fadeIdx] *= (i / fadeLength);
  }

  // Stereo Spreading (-0.35 left for Low E to +0.35 right for High E)
  const acousticLocation = (stringNum - 3.5) / 2.5;
  const scaledVolume = isLowString ? volume * 0.8 : volume;

  const gainL = (1 - acousticLocation * 0.35) * 0.5 * scaledVolume;
  const gainR = (1 + acousticLocation * 0.35) * 0.5 * scaledVolume;

  for (let i = 0; i < totalSamples; i++) {
    leftChannel[i] = synthesis[i] * gainL;
    rightChannel[i] = synthesis[i] * gainR;
  }

  // 6. Audio Buffer & Output Filters
  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const cutoffHz = preset === 'nylon' ? 2600 : preset === 'electric-clean' ? 5000 : preset === 'overdrive' ? 3000 : 4000;

  const lowpassFilter = ctx.createBiquadFilter();
  lowpassFilter.type = 'lowpass';
  lowpassFilter.frequency.setValueAtTime(cutoffHz, actualStart);

  const bassFilter = ctx.createBiquadFilter();
  bassFilter.type = 'lowshelf';
  bassFilter.frequency.setValueAtTime(120, actualStart);
  bassFilter.gain.setValueAtTime(isLowString ? 5.0 : 3.0, actualStart);

  const bodyResonance = ctx.createBiquadFilter();
  bodyResonance.type = 'peaking';
  bodyResonance.frequency.setValueAtTime(180, actualStart);
  bodyResonance.Q.setValueAtTime(1.5, actualStart);
  bodyResonance.gain.setValueAtTime(2.5, actualStart);

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(1.0, actualStart);

  if (preset === 'overdrive') {
    const waveShaper = ctx.createWaveShaper();
    waveShaper.curve = makeDistortionCurve(35);
    source.connect(waveShaper);
    waveShaper.connect(lowpassFilter);
  } else {
    source.connect(lowpassFilter);
  }

  lowpassFilter.connect(bassFilter);
  bassFilter.connect(bodyResonance);
  bodyResonance.connect(gainNode);
  gainNode.connect(ctx.destination);

  source.start(actualStart);
}
