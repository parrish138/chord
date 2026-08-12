import React, { useState, useEffect } from 'react';
import { ChordDefinition } from '../../types/chord';
import { strumChord, playPluckedNote, getFrequencyForStringAndFret, GuitarPreset, setGuitarPreset, getGuitarPreset, subscribeGuitarPreset, GuitarToneParams, getGuitarToneParams, setGuitarToneParams, subscribeGuitarToneParams } from '../../utils/audioSynth';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Volume2, Music, ArrowDown, ArrowUp, Zap, Sparkles, Sliders, Waves, SunMedium } from 'lucide-react';
import { Slider } from '../ui/slider';

export interface AudioStrummerProps {
  chord: ChordDefinition;
  className?: string;
}

export const PRESET_OPTIONS: { id: GuitarPreset; label: string; desc: string }[] = [
  { id: 'acoustic', label: 'Acoustic Steel', desc: 'Warm 2-point averaging KS string model with soundboard body filter' },
  { id: 'nylon', label: 'Nylon Classical', desc: 'Soft 2.8kHz lowpass attack with gentle acoustic decay' },
  { id: 'electric-clean', label: 'Electric Clean', desc: 'Crisp single-coil pickup response with 5.2kHz cutoff & wide stereo stage' },
  { id: 'overdrive', label: 'Overdrive Rock', desc: 'Harmonic distortion & 3.0kHz tube amp cabinet filter' },
];

export const AudioStrummer: React.FC<AudioStrummerProps> = ({ chord, className }) => {
  const [strumSpeed, setStrumSpeed] = useState<number>(35);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedPreset, setSelectedPresetState] = useState<GuitarPreset>(getGuitarPreset());
  const [toneParams, setToneParamsState] = useState<GuitarToneParams>(getGuitarToneParams());

  // Subscribe to global tone preset & parameters
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

  const handlePresetSelect = (preset: GuitarPreset) => {
    setSelectedPresetState(preset);
    setGuitarPreset(preset);
  };

  const handleToneParamChange = (key: keyof GuitarToneParams, value: number | boolean) => {
    setGuitarToneParams({ [key]: value });
  };

  const handleStrum = (direction: 'down' | 'up') => {
    setIsPlaying(true);
    strumChord(chord, direction, strumSpeed, selectedPreset);
    setTimeout(() => setIsPlaying(false), 800);
  };

  const handlePluckString = (stringNum: number) => {
    const pos = chord.positions.find(p => p.string === stringNum);
    const barre = chord.barres?.find(b => stringNum >= b.startString && stringNum <= b.endString);
    const fret = pos ? pos.fret : barre ? barre.fret : 0;

    const freq = getFrequencyForStringAndFret(stringNum, fret);
    playPluckedNote(freq, 0, 2.6, 0.5, stringNum, selectedPreset);
  };

  return (
    <div className={`p-4 rounded-xl glass-panel space-y-4 border border-border/40 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Volume2 className="h-5 w-5 text-primary" />
          <h4 className="font-bold text-sm">Karplus-Strong Audio Tone Engine</h4>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Warm Physical Modeling</span>
        </div>
      </div>

      {/* Guitar Sound Preset Tone Switcher */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
          <span>Guitar Instrument Tone Preset:</span>
          <span className="text-[10px] text-primary font-mono capitalize">{selectedPreset.replace('-', ' ')}</span>
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {PRESET_OPTIONS.map(opt => (
            <button
              key={`preset-${opt.id}`}
              onClick={() => handlePresetSelect(opt.id)}
              className={`p-2 rounded-lg border text-left text-xs transition-all ${
                selectedPreset === opt.id
                  ? 'border-primary bg-primary/15 text-primary font-bold shadow-sm ring-1 ring-primary/30'
                  : 'border-border/60 hover:bg-muted text-muted-foreground'
              }`}
            >
              <div className="font-semibold flex items-center gap-1">
                {opt.id === 'overdrive' ? <Zap className="h-3 w-3 text-amber-400" /> : <Music className="h-3 w-3 text-primary" />}
                {opt.label}
              </div>
              <p className="text-[10px] opacity-75 line-clamp-1">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Tone Tweaker FX Toggle Switch & Sliders */}
      <div className="p-3.5 rounded-xl bg-muted/40 border border-border/40 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
            <Sliders className="h-3.5 w-3.5 text-primary" />
            <span>Enable Tone FX & Custom Controls</span>
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-border/30 animate-in fade-in-0">
            {/* 1. Sustain */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1"><Sparkles className="h-3 w-3 text-amber-400" /> Sustain</span>
                <span className="font-mono font-bold text-foreground">{toneParams.sustain}/10</span>
              </div>
              <Slider
                value={[toneParams.sustain]}
                onValueChange={vals => handleToneParamChange('sustain', vals[0])}
                min={1}
                max={10}
                step={1}
              />
            </div>

            {/* 2. Reverb */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1"><Waves className="h-3 w-3 text-blue-400" /> Reverb</span>
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

            {/* 3. Brightness */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1"><SunMedium className="h-3 w-3 text-yellow-400" /> Brightness</span>
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

      {/* Strum Action Buttons */}
      <div className="flex flex-wrap gap-2 pt-1">
        <Button
          size="sm"
          variant="default"
          onClick={() => handleStrum('down')}
          disabled={isPlaying}
          className="gap-2 flex-1"
        >
          <ArrowDown className="h-4 w-4" />
          Down Strum
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => handleStrum('up')}
          disabled={isPlaying}
          className="gap-2 flex-1"
        >
          <ArrowUp className="h-4 w-4" />
          Up Strum
        </Button>
      </div>

      {/* String Pluck Buttons */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Pluck Strings (6 → 1):</label>
        <div className="grid grid-cols-6 gap-1.5">
          {[6, 5, 4, 3, 2, 1].map(s => {
            const isMuted = chord.mutedStrings?.includes(s);
            return (
              <button
                key={`string-pluck-${s}`}
                onClick={() => handlePluckString(s)}
                className={`py-1.5 rounded text-xs font-mono font-semibold transition-all cursor-pointer ${
                  isMuted
                    ? 'bg-muted/60 text-muted-foreground/60 border border-muted hover:bg-primary/20 hover:text-primary'
                    : 'bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 active:scale-95'
                }`}
                title={`Pluck string ${s} (${s === 6 ? 'E2' : s === 5 ? 'A2' : s === 4 ? 'D3' : s === 3 ? 'G3' : s === 2 ? 'B3' : 'E4'})`}
              >
                {s}: {s === 6 ? 'E2' : s === 5 ? 'A2' : s === 4 ? 'D3' : s === 3 ? 'G3' : s === 2 ? 'B3' : 'E4'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Strum Speed Control */}
      <div className="space-y-2 pt-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Strum Speed</span>
          <span>{strumSpeed} ms</span>
        </div>
        <Slider
          value={[strumSpeed]}
          onValueChange={vals => setStrumSpeed(vals[0])}
          min={10}
          max={120}
          step={5}
        />
      </div>
    </div>
  );
};
