import React, { useState, useEffect } from 'react';
import { GuitarPreset, setGuitarPreset, getGuitarPreset, subscribeGuitarPreset, playPluckedNote, strumChord, getFrequencyForStringAndFret, GuitarToneParams, getGuitarToneParams, setGuitarToneParams, subscribeGuitarToneParams } from '../../utils/audioSynth';
import { MetronomeState, getMetronomeState, toggleMetronome, setMetronomeBpm, setBeatsPerMeasure, handleTapTempo, subscribeMetronome } from '../../utils/metronomeEngine';
import { DrumInstrument, PRESET_DRUM_BEATS, playDrumSound, startDrumMachine, stopDrumMachine, toggleDrumMachine, setDrumBpm, getDrumBpm, isDrumMachinePlaying, setActiveDrumPattern, getActiveDrumPattern, subscribeDrumMachine } from '../../utils/drumMachineEngine';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { Switch } from '../ui/switch';
import { Volume2, Music, Zap, Sparkles, ChevronRight, ArrowDown, ArrowUp, Sliders, Waves, SunMedium, Play, Square, Timer, Activity, Disc, Disc3 } from 'lucide-react';
import { PRESET_CHORDS } from '../chord/ChordLibrary';

export const PRESET_LIST: { id: GuitarPreset; label: string; icon: string; desc: string }[] = [
  { id: 'acoustic', label: 'Acoustic Steel', icon: '🎸', desc: 'Warm 2-point averaging KS model with soundboard filter' },
  { id: 'nylon', label: 'Nylon Classical', icon: '🎶', desc: 'Soft 2.8kHz lowpass attack with gentle acoustic decay' },
  { id: 'electric-clean', label: 'Electric Clean', icon: '⚡', desc: 'Crisp single-coil pickup response & wide stereo stage' },
  { id: 'overdrive', label: 'Overdrive Rock', icon: '🤘', desc: 'Harmonic distortion & 3.0kHz tube amp cabinet filter' },
];

export const DRUM_INSTRUMENT_LABELS: { id: DrumInstrument; name: string; badge: string; icon: string }[] = [
  { id: 'kick', name: 'Bass Drum (Kick)', badge: 'K', icon: '🥁' },
  { id: 'snare', name: 'Snare Drum', badge: 'S', icon: '🥁' },
  { id: 'hihatClosed', name: 'Closed Hi-Hat', badge: 'HH', icon: '✨' },
  { id: 'hihatOpen', name: 'Open Hi-Hat', badge: 'OH', icon: '🌟' },
  { id: 'tomHigh', name: 'Up Tom (High)', badge: 'T1', icon: '🥁' },
  { id: 'tomLow', name: 'Down Tom (Low)', badge: 'T2', icon: '🥁' },
  { id: 'crash', name: 'Crash Cymbal', badge: 'CR', icon: '💥' },
  { id: 'ride', name: 'Ride Cymbal', badge: 'RD', icon: '🔔' },
];

export const AudioToneWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'tone' | 'metronome' | 'drums'>('tone');

  // Tone State
  const [selectedPreset, setSelectedPresetState] = useState<GuitarPreset>(getGuitarPreset());
  const [toneParams, setToneParamsState] = useState<GuitarToneParams>(getGuitarToneParams());
  const [strumSpeed, setStrumSpeed] = useState<number>(35);
  const [isPlayingStrum, setIsPlayingStrum] = useState<boolean>(false);

  // Metronome State
  const [metronomeState, setMetronomeState] = useState<MetronomeState>(getMetronomeState());

  // Drum Machine State
  const [isDrumsPlaying, setIsDrumsPlaying] = useState<boolean>(isDrumMachinePlaying());
  const [drumBpm, setDrumBpmState] = useState<number>(getDrumBpm());
  const [drumStep, setDrumStep] = useState<number>(0);
  const [drumPattern, setDrumPatternState] = useState(getActiveDrumPattern());
  const [selectedPresetBeatId, setSelectedPresetBeatId] = useState<string>(PRESET_DRUM_BEATS[0].id);

  // Subscribe to global tone preset, parameters, metronome, and drum machine
  useEffect(() => {
    const unsubPreset = subscribeGuitarPreset(newPreset => setSelectedPresetState(newPreset));
    const unsubParams = subscribeGuitarToneParams(newParams => setToneParamsState({ ...newParams }));
    const unsubMetronome = subscribeMetronome(newState => setMetronomeState({ ...newState }));
    const unsubDrums = subscribeDrumMachine((step, playing) => {
      setDrumStep(step);
      setIsDrumsPlaying(playing);
    });
    return () => {
      unsubPreset();
      unsubParams();
      unsubMetronome();
      unsubDrums();
    };
  }, []);

  const handleSelectPreset = (preset: GuitarPreset) => {
    setSelectedPresetState(preset);
    setGuitarPreset(preset);
  };

  const handleToneParamChange = (key: keyof GuitarToneParams, value: number | boolean) => {
    setGuitarToneParams({ [key]: value });
  };

  const handleStrum = (direction: 'down' | 'up') => {
    setIsPlayingStrum(true);
    const testChord = PRESET_CHORDS[0]; // C Major
    strumChord(testChord, direction, strumSpeed, selectedPreset);
    setTimeout(() => setIsPlayingStrum(false), 800);
  };

  const handleTestPluck = (stringNum: number) => {
    const freq = getFrequencyForStringAndFret(stringNum, 0);
    playPluckedNote(freq, 0, 2.6, 0.45, stringNum, selectedPreset);
  };

  // Drum Machine Handlers
  const handleSelectPresetBeat = (beatId: string) => {
    const preset = PRESET_DRUM_BEATS.find(b => b.id === beatId);
    if (preset) {
      setSelectedPresetBeatId(beatId);
      setActiveDrumPattern(preset.pattern);
      setDrumPatternState({ ...preset.pattern });
      setDrumBpm(preset.bpm);
      setDrumBpmState(preset.bpm);
    }
  };

  const handleToggleDrumStep = (inst: DrumInstrument, stepIdx: number) => {
    const updated = { ...drumPattern };
    if (!updated[inst]) updated[inst] = Array(16).fill(false);
    updated[inst][stepIdx] = !updated[inst][stepIdx];
    setActiveDrumPattern(updated);
    setDrumPatternState({ ...updated });
  };

  const handleDrumBpmChange = (newBpm: number) => {
    setDrumBpm(newBpm);
    setDrumBpmState(newBpm);
  };

  return (
    <div className="fixed right-4 bottom-6 z-50 flex items-end gap-2">
      {/* Expanded Control Panel */}
      {isOpen && (
        <div className="w-96 p-5 rounded-2xl glass-panel border border-border/60 shadow-2xl space-y-4 animate-in slide-in-from-right-5 fade-in-0 max-h-[90vh] overflow-y-auto">
          {/* Header & Sub-Tab Switcher */}
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/60 border border-border/40 text-xs">
              <button
                onClick={() => setActiveTab('tone')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                  activeTab === 'tone'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Volume2 className="h-3.5 w-3.5" />
                Tone
              </button>
              <button
                onClick={() => setActiveTab('metronome')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                  activeTab === 'metronome'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Timer className="h-3.5 w-3.5" />
                Tempo
              </button>
              <button
                onClick={() => setActiveTab('drums')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                  activeTab === 'drums'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Disc className="h-3.5 w-3.5" />
                Drums
              </button>
            </div>

            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              className="h-7 w-7 rounded-full"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* TAB 1: Guitar Tone Engine */}
          {activeTab === 'tone' && (
            <div className="space-y-4">
              {/* Instrument Presets Grid */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
                  <span>Select Tone Preset:</span>
                  <span className="text-[10px] text-primary font-mono capitalize">{selectedPreset.replace('-', ' ')}</span>
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {PRESET_LIST.map(opt => (
                    <button
                      key={`widget-preset-${opt.id}`}
                      onClick={() => handleSelectPreset(opt.id)}
                      className={`p-2 rounded-xl border text-left text-xs transition-all flex flex-col justify-between ${
                        selectedPreset === opt.id
                          ? 'border-primary bg-primary/20 text-primary font-bold shadow-md ring-1 ring-primary/40'
                          : 'border-border/60 hover:bg-muted/80 text-muted-foreground'
                      }`}
                    >
                      <div className="font-semibold text-xs flex items-center gap-1">
                        <span>{opt.icon}</span>
                        <span className="line-clamp-1">{opt.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* FX Enable Toggle Switch & Sliders */}
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <Sliders className="h-3.5 w-3.5 text-primary" />
                    <span>Custom FX & Tone Tweaker</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-muted-foreground">
                      {toneParams.effectsEnabled ? 'ON' : 'OFF'}
                    </span>
                    <Switch
                      checked={toneParams.effectsEnabled}
                      onCheckedChange={checked => handleToneParamChange('effectsEnabled', checked)}
                    />
                  </div>
                </div>

                {toneParams.effectsEnabled && (
                  <div className="space-y-3 pt-2 border-t border-border/30 animate-in fade-in-0">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1"><Sparkles className="h-3 w-3 text-amber-400" /> Sustain Ring</span>
                        <span className="font-mono font-bold text-foreground">{toneParams.sustain} / 10</span>
                      </div>
                      <Slider
                        value={[toneParams.sustain]}
                        onValueChange={vals => handleToneParamChange('sustain', vals[0])}
                        min={1}
                        max={10}
                        step={1}
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1"><Waves className="h-3 w-3 text-blue-400" /> Room Reverb</span>
                        <span className="font-mono font-bold text-foreground">{toneParams.reverb}%</span>
                      </div>
                      <Slider
                        value={[toneParams.reverb]}
                        onValueChange={vals => handleToneParamChange('reverb', vals[0])}
                        min={0}
                        max={100}
                        step={5}
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1"><SunMedium className="h-3 w-3 text-yellow-400" /> Tone Brightness</span>
                        <span className="font-mono font-bold text-foreground">{toneParams.brightness} Hz</span>
                      </div>
                      <Slider
                        value={[toneParams.brightness]}
                        onValueChange={vals => handleToneParamChange('brightness', vals[0])}
                        min={1200}
                        max={8000}
                        step={200}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Pluck Test Buttons */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-medium text-muted-foreground">Test String Plucks (6 → 1):</label>
                <div className="grid grid-cols-6 gap-1">
                  {[6, 5, 4, 3, 2, 1].map(s => (
                    <button
                      key={`widget-pluck-${s}`}
                      onClick={() => handleTestPluck(s)}
                      className="py-1 rounded text-[11px] font-mono font-semibold bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 active:scale-95 transition-all"
                    >
                      {s}: {s === 6 ? 'E2' : s === 5 ? 'A2' : s === 4 ? 'D3' : s === 3 ? 'G3' : s === 2 ? 'B3' : 'E4'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dual Down & Up Strum Test Buttons */}
              <div className="pt-2 border-t border-border/30 flex gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleStrum('down')}
                  disabled={isPlayingStrum}
                  className="flex-1 gap-1.5 text-xs font-bold"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                  Down Strum
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleStrum('up')}
                  disabled={isPlayingStrum}
                  className="flex-1 gap-1.5 text-xs font-bold"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                  Up Strum
                </Button>
              </div>
            </div>
          )}

          {/* TAB 2: Precision Metronome Tool */}
          {activeTab === 'metronome' && (
            <div className="space-y-5 animate-in fade-in-0">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-purple-950/40 to-slate-950 border border-purple-500/30 text-center space-y-3 shadow-xl">
                <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                  <span className="flex items-center gap-1"><Activity className="h-3.5 w-3.5 text-purple-400" /> Precision Clock</span>
                  <span>{metronomeState.beatsPerMeasure}/4 Time</span>
                </div>

                <div className="space-y-0.5">
                  <div className="text-4xl font-black font-mono tracking-tight bg-gradient-to-r from-purple-300 via-pink-300 to-amber-300 bg-clip-text text-transparent">
                    {metronomeState.bpm}
                  </div>
                  <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                    BEATS PER MINUTE
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 pt-1">
                  {Array.from({ length: metronomeState.beatsPerMeasure }).map((_, idx) => {
                    const beatNum = idx + 1;
                    const isActive = metronomeState.isPlaying && metronomeState.currentBeat === beatNum;
                    const isAccentBeat = beatNum === 1;

                    return (
                      <div
                        key={`metronome-led-${beatNum}`}
                        className={`h-4 rounded-full transition-all duration-100 flex items-center justify-center text-[9px] font-mono font-extrabold ${
                          isActive
                            ? isAccentBeat
                              ? 'w-10 bg-amber-400 text-slate-950 ring-4 ring-amber-400/40 scale-110 shadow-lg shadow-amber-400/50'
                              : 'w-8 bg-purple-400 text-slate-950 ring-4 ring-purple-400/40 scale-105 shadow-lg shadow-purple-400/50'
                            : 'w-6 bg-slate-800 text-slate-500 border border-slate-700'
                        }`}
                      >
                        {beatNum}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="default"
                  variant={metronomeState.isPlaying ? 'destructive' : 'default'}
                  onClick={toggleMetronome}
                  className="flex-1 gap-2 font-extrabold text-sm py-5 shadow-lg shadow-primary/25"
                >
                  {metronomeState.isPlaying ? <Square className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}
                  {metronomeState.isPlaying ? 'Stop Metronome' : 'Start Metronome'}
                </Button>

                <Button
                  size="default"
                  variant="outline"
                  onClick={handleTapTempo}
                  className="gap-1.5 font-bold text-xs py-5 border-purple-500/40 text-purple-300 hover:bg-purple-500/20 active:scale-95"
                >
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  Tap Tempo
                </Button>
              </div>

              <div className="space-y-2 p-3 rounded-xl bg-muted/40 border border-border/40">
                <div className="flex justify-between text-xs text-muted-foreground font-semibold">
                  <span>Tempo Speed</span>
                  <span className="font-mono text-primary font-bold">{metronomeState.bpm} BPM</span>
                </div>
                <Slider
                  value={[metronomeState.bpm]}
                  onValueChange={vals => setMetronomeBpm(vals[0])}
                  min={30}
                  max={240}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Beats per Measure (Time Sig):</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[2, 3, 4, 6].map(b => (
                    <Button
                      key={`time-sig-${b}`}
                      size="sm"
                      variant={metronomeState.beatsPerMeasure === b ? 'default' : 'outline'}
                      onClick={() => setBeatsPerMeasure(b)}
                      className="font-bold text-xs"
                    >
                      {b}/4
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Acoustic Drum Kit Machine */}
          {activeTab === 'drums' && (
            <div className="space-y-4 animate-in fade-in-0">
              {/* Preset Beats Dropdown Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
                  <span>Load Preset Drum Groove:</span>
                  <span className="text-[10px] font-mono text-primary">{drumBpm} BPM</span>
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {PRESET_DRUM_BEATS.map(preset => (
                    <button
                      key={`drum-preset-${preset.id}`}
                      onClick={() => handleSelectPresetBeat(preset.id)}
                      className={`p-2 rounded-xl border text-left text-xs transition-all ${
                        selectedPresetBeatId === preset.id
                          ? 'border-pink-500 bg-pink-500/15 text-pink-300 font-bold ring-1 ring-pink-500/30'
                          : 'border-border/60 hover:bg-muted text-muted-foreground'
                      }`}
                    >
                      <div className="font-semibold line-clamp-1 flex items-center gap-1">
                        <Disc3 className="h-3 w-3 text-pink-400" />
                        {preset.name}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Start / Stop Drum Machine & BPM Slider */}
              <div className="flex items-center gap-3">
                <Button
                  size="default"
                  variant={isDrumsPlaying ? 'destructive' : 'default'}
                  onClick={toggleDrumMachine}
                  className="flex-1 gap-2 font-extrabold text-sm py-4 shadow-lg bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500"
                >
                  {isDrumsPlaying ? <Square className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
                  {isDrumsPlaying ? 'Stop Drum Beat' : 'Play Drum Beat'}
                </Button>

                <div className="w-1/2 space-y-1">
                  <div className="flex justify-between text-[10px] font-semibold text-muted-foreground">
                    <span>Tempo</span>
                    <span className="font-mono text-pink-400">{drumBpm} BPM</span>
                  </div>
                  <Slider
                    value={[drumBpm]}
                    onValueChange={vals => handleDrumBpmChange(vals[0])}
                    min={50}
                    max={200}
                    step={1}
                  />
                </div>
              </div>

              {/* Interactive Pad Triggers Grid */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Test Drum Pads (Click to Play):</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {DRUM_INSTRUMENT_LABELS.map(inst => (
                    <button
                      key={`pad-${inst.id}`}
                      onClick={() => playDrumSound(inst.id)}
                      className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-left transition-all active:scale-95 group"
                    >
                      <div className="text-xs font-bold text-slate-100 flex items-center gap-1">
                        <span>{inst.icon}</span>
                        <span>{inst.badge}</span>
                      </div>
                      <div className="text-[9px] text-slate-400 line-clamp-1 opacity-80">{inst.name.split(' ')[0]}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 16-Step Interactive Grid Matrix */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
                  <span>16-Step Pattern Sequencer Grid:</span>
                  <span className="text-[10px] font-mono text-amber-400">Step #{drumStep + 1}</span>
                </label>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 overflow-x-auto">
                  {/* Step Header Numbers (1-16) */}
                  <div className="grid grid-cols-17 gap-1 text-center text-[9px] font-mono text-slate-500">
                    <span className="col-span-1 text-left font-bold text-slate-400">Inst</span>
                    {Array.from({ length: 16 }).map((_, i) => (
                      <span
                        key={`hdr-step-${i}`}
                        className={`py-0.5 rounded ${
                          isDrumsPlaying && drumStep === i ? 'bg-pink-500 text-slate-950 font-bold' : ''
                        }`}
                      >
                        {i + 1}
                      </span>
                    ))}
                  </div>

                  {/* Instrument Step Rows */}
                  {DRUM_INSTRUMENT_LABELS.map(inst => {
                    const rowSteps = drumPattern[inst.id] || Array(16).fill(false);

                    return (
                      <div key={`seq-row-${inst.id}`} className="grid grid-cols-17 gap-1 items-center">
                        <span className="col-span-1 text-[10px] font-mono font-bold text-slate-300 truncate" title={inst.name}>
                          {inst.badge}
                        </span>

                        <div className="col-span-16 grid grid-cols-16 gap-1">
                          {rowSteps.map((active, stepIdx) => {
                            const isCurrentStep = isDrumsPlaying && drumStep === stepIdx;

                            return (
                              <button
                                key={`cell-${inst.id}-${stepIdx}`}
                                onClick={() => handleToggleDrumStep(inst.id, stepIdx)}
                                className={`h-5 rounded text-[8px] font-mono transition-all ${
                                  active
                                    ? isCurrentStep
                                      ? 'bg-amber-400 border border-amber-300 shadow-md shadow-amber-400/50 scale-110 z-10'
                                      : 'bg-pink-500 hover:bg-pink-400 border border-pink-400/50 shadow-sm'
                                    : isCurrentStep
                                    ? 'bg-slate-700 border border-slate-500'
                                    : 'bg-slate-900 hover:bg-slate-800 border border-slate-800/80'
                                }`}
                              />
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Toggle Button Badge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-12 px-4 rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white font-bold shadow-xl shadow-purple-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 border border-white/20"
      >
        {isDrumsPlaying ? (
          <Disc3 className="h-5 w-5 text-pink-300 animate-spin" />
        ) : metronomeState.isPlaying ? (
          <Activity className="h-5 w-5 text-amber-300 animate-pulse" />
        ) : (
          <Volume2 className="h-5 w-5" />
        )}
        <span className="text-xs font-extrabold uppercase tracking-wider hidden sm:inline">
          {isDrumsPlaying ? `${drumBpm} BPM Drums` : metronomeState.isPlaying ? `${metronomeState.bpm} BPM` : 'Tone, Tempo & Drums'}
        </span>
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 font-mono capitalize">
          {isDrumsPlaying ? 'Groove' : metronomeState.isPlaying ? 'Tempo' : selectedPreset.split('-')[0]}
        </span>
      </button>
    </div>
  );
};
