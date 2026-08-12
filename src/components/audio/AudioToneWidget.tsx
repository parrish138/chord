import React, { useState, useEffect } from 'react';
import { GuitarPreset, setGuitarPreset, getGuitarPreset, subscribeGuitarPreset, playPluckedNote, strumChord, getFrequencyForStringAndFret, GuitarToneParams, getGuitarToneParams, setGuitarToneParams, subscribeGuitarToneParams } from '../../utils/audioSynth';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { Switch } from '../ui/switch';
import { Volume2, Music, Zap, Sparkles, ChevronRight, ArrowDown, ArrowUp, Sliders, Waves, SunMedium } from 'lucide-react';
import { PRESET_CHORDS } from '../chord/ChordLibrary';

export const PRESET_LIST: { id: GuitarPreset; label: string; icon: string; desc: string }[] = [
  { id: 'acoustic', label: 'Acoustic Steel', icon: '🎸', desc: 'Warm 2-point averaging KS model with soundboard filter' },
  { id: 'nylon', label: 'Nylon Classical', icon: '🎶', desc: 'Soft 2.8kHz lowpass attack with gentle acoustic decay' },
  { id: 'electric-clean', label: 'Electric Clean', icon: '⚡', desc: 'Crisp single-coil pickup response & wide stereo stage' },
  { id: 'overdrive', label: 'Overdrive Rock', icon: '🤘', desc: 'Harmonic distortion & 3.0kHz tube amp cabinet filter' },
];

export const AudioToneWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectedPreset, setSelectedPresetState] = useState<GuitarPreset>(getGuitarPreset());
  const [toneParams, setToneParamsState] = useState<GuitarToneParams>(getGuitarToneParams());
  const [strumSpeed, setStrumSpeed] = useState<number>(35);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Subscribe to global tone preset & parameter changes across all components
  useEffect(() => {
    const unsubPreset = subscribeGuitarPreset(newPreset => {
      setSelectedPresetState(newPreset);
    });
    const unsubParams = subscribeGuitarToneParams(newParams => {
      setToneParamsState({ ...newParams });
    });
    return () => {
      unsubPreset();
      unsubParams();
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
    setIsPlaying(true);
    const testChord = PRESET_CHORDS[0]; // C Major
    strumChord(testChord, direction, strumSpeed, selectedPreset);
    setTimeout(() => setIsPlaying(false), 800);
  };

  const handleTestPluck = (stringNum: number) => {
    const freq = getFrequencyForStringAndFret(stringNum, 0);
    playPluckedNote(freq, 0, 2.6, 0.45, stringNum, selectedPreset);
  };

  return (
    <div className="fixed right-4 bottom-6 z-50 flex items-end gap-2">
      {/* Expanded Tone Control Panel */}
      {isOpen && (
        <div className="w-84 p-5 rounded-2xl glass-panel border border-border/60 shadow-2xl space-y-4 animate-in slide-in-from-right-5 fade-in-0 max-h-[85vh] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <div className="flex items-center gap-2">
              <Volume2 className="h-5 w-5 text-primary" />
              <div>
                <h4 className="font-extrabold text-sm tracking-tight">Audio Tone Engine</h4>
                <p className="text-[10px] text-muted-foreground">Global Physical Guitar Synth & FX</p>
              </div>
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

            {/* Sliders panel visible when FX toggle is ON */}
            {toneParams.effectsEnabled && (
              <div className="space-y-3 pt-2 border-t border-border/30 animate-in fade-in-0">
                {/* 1. Sustain Control */}
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

                {/* 2. Stereo Room Reverb Wet Mix */}
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

                {/* 3. Tone Brightness Cutoff */}
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
              disabled={isPlaying}
              className="flex-1 gap-1.5 text-xs font-bold"
            >
              <ArrowDown className="h-3.5 w-3.5" />
              Down Strum
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleStrum('up')}
              disabled={isPlaying}
              className="flex-1 gap-1.5 text-xs font-bold"
            >
              <ArrowUp className="h-3.5 w-3.5" />
              Up Strum
            </Button>
          </div>
        </div>
      )}

      {/* Floating Toggle Button Badge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-12 px-4 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold shadow-xl shadow-purple-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 border border-white/20"
      >
        <Volume2 className="h-5 w-5" />
        <span className="text-xs font-extrabold uppercase tracking-wider hidden sm:inline">
          Tone Engine
        </span>
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 font-mono capitalize">
          {selectedPreset.split('-')[0]}
        </span>
      </button>
    </div>
  );
};
