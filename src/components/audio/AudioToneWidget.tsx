import React, { useState, useEffect } from 'react';
import { GuitarPreset, setGuitarPreset, getGuitarPreset, subscribeGuitarPreset, playPluckedNote, strumChord, getFrequencyForStringAndFret } from '../../utils/audioSynth';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { Volume2, Music, Zap, Sparkles, ChevronRight, ChevronLeft, ArrowDown, ArrowUp } from 'lucide-react';
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
  const [strumSpeed, setStrumSpeed] = useState<number>(35);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Subscribe to global tone preset changes across all components
  useEffect(() => {
    const unsubscribe = subscribeGuitarPreset(newPreset => {
      setSelectedPresetState(newPreset);
    });
    return unsubscribe;
  }, []);

  const handleSelectPreset = (preset: GuitarPreset) => {
    setSelectedPresetState(preset);
    setGuitarPreset(preset);
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
        <div className="w-80 p-5 rounded-2xl glass-panel border border-border/60 shadow-2xl space-y-4 animate-in slide-in-from-right-5 fade-in-0">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <div className="flex items-center gap-2">
              <Volume2 className="h-5 w-5 text-primary" />
              <div>
                <h4 className="font-extrabold text-sm tracking-tight">Audio Tone Engine</h4>
                <p className="text-[10px] text-muted-foreground">Global Physical Guitar Synth</p>
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
            <div className="grid grid-cols-1 gap-2">
              {PRESET_LIST.map(opt => (
                <button
                  key={`widget-preset-${opt.id}`}
                  onClick={() => handleSelectPreset(opt.id)}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-start gap-2.5 ${
                    selectedPreset === opt.id
                      ? 'border-primary bg-primary/20 text-primary font-bold shadow-md ring-1 ring-primary/40'
                      : 'border-border/60 hover:bg-muted/80 text-muted-foreground'
                  }`}
                >
                  <span className="text-base leading-none">{opt.icon}</span>
                  <div className="space-y-0.5">
                    <div className="font-semibold text-xs flex items-center gap-1">
                      {opt.label}
                    </div>
                    <p className="text-[10px] opacity-75 leading-tight">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
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
