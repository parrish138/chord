import React, { useState, useEffect, useRef } from 'react';
import { ChordDefinition } from '../../types/chord';
import { FretboardNote } from '../../types/scale';
import { PRESET_CHORDS } from '../chord/ChordLibrary';
import { strumChord, playPluckedNote, getGuitarPreset } from '../../utils/audioSynth';
import { useGlobalBpm } from '../../utils/globalBpmManager';
import { ChordDiagram } from '../chord/ChordDiagram';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Slider } from '../ui/slider';
import { Play, Pause, Trash2, Plus, Music, Layers, Repeat, Volume2, Sparkles, ArrowRight } from 'lucide-react';

export interface UnifiedSequenceStep {
  id: string;
  type: 'note' | 'chord';
  noteName?: string;
  stringNum?: number;
  fret?: number;
  freq?: number;
  chord?: ChordDefinition;
  durationMs: number;
}

export interface UnifiedGuitarSequencerProps {
  className?: string;
}

export const UnifiedGuitarSequencer: React.FC<UnifiedGuitarSequencerProps> = ({ className }) => {
  // Preset default sequence (C Major - G Major - Am - F Major progression)
  const [sequence, setSequence] = useState<UnifiedSequenceStep[]>([
    { id: 'seq-1', type: 'chord', chord: PRESET_CHORDS[0], durationMs: 1000 }, // C Major
    { id: 'seq-2', type: 'chord', chord: PRESET_CHORDS[1], durationMs: 1000 }, // G Major
    { id: 'seq-3', type: 'chord', chord: PRESET_CHORDS[2], durationMs: 1000 }, // A Minor
    { id: 'seq-4', type: 'chord', chord: PRESET_CHORDS[3], durationMs: 1000 }, // F Major
  ]);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(-1);
  const [bpm, setBpm] = useGlobalBpm();
  const [isLooping, setIsLooping] = useState<boolean>(true);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Reactive Playback Loop: Dynamically updates step interval whenever BPM, sequence, or looping changes
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    if (sequence.length === 0) {
      setIsPlaying(false);
      setActiveStepIndex(-1);
      return;
    }

    const stepIntervalMs = Math.max(100, Math.round((60 / bpm) * 1000));
    let stepIdx = activeStepIndex >= 0 ? activeStepIndex : 0;

    const playStep = () => {
      if (stepIdx >= sequence.length) {
        if (!isLooping) {
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = null;
          setIsPlaying(false);
          setActiveStepIndex(-1);
          return;
        }
        stepIdx = 0;
      }

      setActiveStepIndex(stepIdx);
      const currentStep = sequence[stepIdx];

      if (currentStep) {
        if (currentStep.type === 'chord' && currentStep.chord) {
          strumChord(currentStep.chord, 'down', 35, getGuitarPreset());
        } else if (currentStep.type === 'note' && currentStep.freq) {
          playPluckedNote(currentStep.freq, 0, 2.4, 0.45, currentStep.stringNum || 3, getGuitarPreset());
        }
      }

      stepIdx++;
    };

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Run step immediately and set interval
    playStep();
    timerRef.current = setInterval(playStep, stepIntervalMs);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPlaying, bpm, isLooping, sequence]);

  const togglePlaySequence = () => {
    if (isPlaying) {
      setIsPlaying(false);
      setActiveStepIndex(-1);
    } else {
      if (sequence.length === 0) return;
      setActiveStepIndex(0);
      setIsPlaying(true);
    }
  };

  const handleClearSequence = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setIsPlaying(false);
    setActiveStepIndex(-1);
    setSequence([]);
  };

  const handleAddChordStep = (chord: ChordDefinition) => {
    const newStep: UnifiedSequenceStep = {
      id: `step-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: 'chord',
      chord,
      durationMs: 1000,
    };
    setSequence(prev => [...prev, newStep]);
  };

  const handleRemoveStep = (id: string) => {
    setSequence(prev => prev.filter(s => s.id !== id));
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className={`p-6 rounded-2xl glass-panel border border-border/40 space-y-6 ${className}`}>
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-400" />
            <h3 className="font-extrabold text-xl tracking-tight">Main Unified Guitar Sequencer</h3>
            <Badge variant="purple" className="text-xs">Master Timeline</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Consolidated timeline combining guitar chords and single neck notes with real-time audio playback.
          </p>
        </div>

        {/* Master Controls: Play, Loop, Clear, BPM */}
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant={isLooping ? 'default' : 'outline'}
            onClick={() => setIsLooping(!isLooping)}
            className="gap-1.5 text-xs font-bold"
          >
            <Repeat className="h-4 w-4" />
            Loop: {isLooping ? 'ON' : 'OFF'}
          </Button>

          <Button
            size="sm"
            variant={isPlaying ? 'destructive' : 'default'}
            onClick={togglePlaySequence}
            disabled={sequence.length === 0}
            className="gap-2 font-bold px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
          >
            {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
            {isPlaying ? 'Pause' : 'Play Sequence'}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleClearSequence}
            disabled={sequence.length === 0}
            className="gap-1.5 text-xs text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </Button>
        </div>
      </div>

      {/* Preset Chord Quick-Add Ribbon */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Quick Add Chord to Sequence:</label>
        <div className="flex flex-wrap gap-2">
          {PRESET_CHORDS.slice(0, 8).map(c => (
            <button
              key={`quick-chord-${c.id}`}
              onClick={() => handleAddChordStep(c)}
              className="px-3 py-1.5 rounded-xl border border-border/60 bg-muted/40 hover:bg-primary/15 hover:border-primary/40 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
            >
              <Plus className="h-3.5 w-3.5 text-primary" />
              <span>{c.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Steps Display */}
      {sequence.length === 0 ? (
        <div className="p-8 text-center border-2 border-dashed border-border/40 rounded-xl text-xs text-muted-foreground space-y-1">
          <Plus className="h-6 w-6 mx-auto text-primary/40" />
          <p className="font-semibold text-foreground">Sequencer timeline is empty</p>
          <p>Click quick-add chords above or notes on the neck diagram to populate your guitar sequence!</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 overflow-x-auto">
            {sequence.map((step, idx) => {
              const isActive = isPlaying && activeStepIndex === idx;

              return (
                <React.Fragment key={step.id}>
                  <div
                    className={`p-3 rounded-2xl border flex flex-col items-center space-y-2 transition-all duration-200 min-w-[110px] relative ${
                      isActive
                        ? 'border-amber-400 bg-amber-500/20 ring-2 ring-amber-400/40 scale-105 shadow-xl shadow-amber-400/20'
                        : 'border-slate-800 bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full text-[10px] font-mono text-muted-foreground">
                      <span className="font-bold text-amber-400">Step #{idx + 1}</span>
                      <button
                        onClick={() => handleRemoveStep(step.id)}
                        className="hover:text-destructive text-xs leading-none"
                      >
                        &times;
                      </button>
                    </div>

                    {step.type === 'chord' && step.chord ? (
                      <div className="flex flex-col items-center space-y-1">
                        <span className="font-extrabold text-sm text-foreground">{step.chord.name}</span>
                        <div className="p-1 rounded bg-slate-950/80 border border-slate-800">
                          <ChordDiagram chord={step.chord} options={{ size: 'sm', theme: 'sleek-dark' }} />
                        </div>
                      </div>
                    ) : (
                      <div className="py-4 text-center space-y-1">
                        <div className="text-xl font-black font-mono text-primary">{step.noteName}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">
                          Str {step.stringNum}, Fret {step.fret}
                        </div>
                      </div>
                    )}
                  </div>

                  {idx < sequence.length - 1 && (
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* BPM Tempo Slider */}
          <div className="flex items-center gap-4 pt-2 max-w-xs">
            <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Tempo: {bpm} BPM</span>
            <Slider
              value={[bpm]}
              onValueChange={vals => setBpm(vals[0])}
              min={40}
              max={240}
              step={2}
            />
          </div>
        </div>
      )}
    </div>
  );
};
