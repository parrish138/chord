import React, { useState, useEffect, useRef } from 'react';
import { SCALE_DEFINITIONS, NOTES_CHROMATIC, generateFretboardScale, getScaleNotes } from '../../utils/scaleEngine';
import { FretboardNote, ScaleProgressionStep } from '../../types/scale';
import { playPluckedNote, getGuitarPreset } from '../../utils/audioSynth';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Slider } from '../ui/slider';
import { Play, Pause, Sparkles, Plus, Trash2, Music, Eye, Layers, Globe, CheckCircle2 } from 'lucide-react';

export const GuitarNeckScaleStudio: React.FC = () => {
  const [rootNote, setRootNote] = useState<string>('C');
  const [selectedScaleId, setSelectedScaleId] = useState<string>('all-notes');
  const [displayMode, setDisplayMode] = useState<'noteName' | 'interval'>('interval');
  const [fretboardNotes, setFretboardNotes] = useState<FretboardNote[]>([]);

  // Sequence Progression State
  const [progression, setProgression] = useState<ScaleProgressionStep[]>([]);
  const [isPlayingSeq, setIsPlayingSeq] = useState<boolean>(false);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(-1);
  const [bpm, setBpm] = useState<number>(100);

  const seqTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Re-generate fretboard notes across all 24 frets whenever rootNote or selectedScaleId changes
  useEffect(() => {
    const notes = generateFretboardScale(rootNote, selectedScaleId, 24, true);
    setFretboardNotes(notes);
  }, [rootNote, selectedScaleId]);

  // Enable all notes across the neck
  const handleEnableAllNotes = () => {
    setFretboardNotes(prev => prev.map(n => ({ ...n, isEnabled: true })));
  };

  // Selected scale definition object
  const currentScaleDef = SCALE_DEFINITIONS.find(s => s.id === selectedScaleId) || SCALE_DEFINITIONS[0];
  const scaleFormulaNotes = getScaleNotes(rootNote, selectedScaleId);

  // Toggle individual note enabled state on the neck
  const handleToggleNoteOnNeck = (stringNum: number, fret: number) => {
    setFretboardNotes(prev =>
      prev.map(n => {
        if (n.stringNum === stringNum && n.fret === fret) {
          return { ...n, isEnabled: !n.isEnabled };
        }
        return n;
      })
    );
  };

  // Click a note on the neck to test audio & optionally add to progression
  const handleNeckNoteClick = (note: FretboardNote) => {
    playPluckedNote(note.freq, 0, 2.4, 0.45, note.stringNum, getGuitarPreset());

    // Enable note if disabled
    if (!note.isEnabled) {
      handleToggleNoteOnNeck(note.stringNum, note.fret);
    }

    // Add note to sequence progression
    const newStep: ScaleProgressionStep = {
      id: `step-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      stepNumber: progression.length + 1,
      stringNum: note.stringNum,
      fret: note.fret,
      noteName: note.noteName,
      freq: note.freq,
      durationSec: 0.5,
    };
    setProgression(prev => [...prev, newStep]);
  };

  // Play Sequence Loop
  const togglePlayProgression = () => {
    if (isPlayingSeq) {
      if (seqTimerRef.current) clearInterval(seqTimerRef.current);
      setIsPlayingSeq(false);
      setActiveStepIndex(-1);
    } else {
      if (progression.length === 0) return;
      setIsPlayingSeq(true);
      let stepIdx = 0;
      setActiveStepIndex(0);

      const intervalMs = (60 / bpm) * 1000;

      const playCurrentStep = () => {
        if (stepIdx >= progression.length) {
          stepIdx = 0; // Loop back
        }
        setActiveStepIndex(stepIdx);
        const currentStep = progression[stepIdx];
        if (currentStep) {
          playPluckedNote(currentStep.freq, 0, 2.4, 0.45, currentStep.stringNum, getGuitarPreset());
        }
        stepIdx++;
      };

      playCurrentStep();
      seqTimerRef.current = setInterval(playCurrentStep, intervalMs);
    }
  };

  // Clean up sequence timer on unmount
  useEffect(() => {
    return () => {
      if (seqTimerRef.current) clearInterval(seqTimerRef.current);
    };
  }, []);

  const handleClearProgression = () => {
    if (seqTimerRef.current) {
      clearInterval(seqTimerRef.current);
      seqTimerRef.current = null;
    }
    setIsPlayingSeq(false);
    setActiveStepIndex(-1);
    setProgression([]);
  };

  // Fret markers (dots) for standard 24-fret neck (double dots on 12 and 24)
  const FRET_MARKERS = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header & Control Selectors */}
      <div className="p-6 rounded-2xl glass-panel border border-border/40 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-400" />
              <h3 className="text-2xl font-extrabold tracking-tight">Full 24-Fret Guitar Neck Scale Studio</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Interactive 24-fret neck mapping all notes and scales. Click any fret to play or program custom melodies!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant={selectedScaleId === 'all-notes' ? 'default' : 'outline'}
              onClick={() => setSelectedScaleId('all-notes')}
              className="gap-1.5 text-xs font-bold"
            >
              <Globe className="h-4 w-4" />
              All Notes Mode
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleEnableAllNotes}
              className="gap-1.5 text-xs text-muted-foreground hover:text-primary"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Enable All Frets
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setDisplayMode(displayMode === 'interval' ? 'noteName' : 'interval')}
              className="gap-2 text-xs"
            >
              <Eye className="h-4 w-4" />
              Display: <span className="font-bold capitalize">{displayMode}</span>
            </Button>
          </div>
        </div>

        {/* Root Note & Scale Mode Selector Grids */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. Root Note Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Root Note (Tonic):</label>
            <div className="grid grid-cols-6 gap-1.5">
              {NOTES_CHROMATIC.map(n => (
                <button
                  key={`root-select-${n}`}
                  onClick={() => setRootNote(n)}
                  className={`py-2 rounded-lg font-mono font-bold text-xs transition-all ${
                    rootNote === n
                      ? 'bg-primary text-primary-foreground shadow-md ring-2 ring-primary/40'
                      : 'bg-muted/70 hover:bg-muted text-muted-foreground'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Scale Category & Definition Selector */}
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Scale / Fretboard Preset:</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SCALE_DEFINITIONS.map(scale => (
                <button
                  key={`scale-select-${scale.id}`}
                  onClick={() => setSelectedScaleId(scale.id)}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all flex flex-col justify-between ${
                    selectedScaleId === scale.id
                      ? 'border-primary bg-primary/15 text-primary font-bold shadow-md ring-1 ring-primary/30'
                      : 'border-border/60 hover:bg-muted text-muted-foreground'
                  }`}
                >
                  <div className="font-bold flex items-center justify-between">
                    <span className="line-clamp-1">{scale.name}</span>
                    <Badge variant="secondary" className="text-[9px] px-1 py-0 capitalize opacity-80">
                      {scale.category.replace('-', ' ')}
                    </Badge>
                  </div>
                  <p className="text-[10px] opacity-75 line-clamp-1 mt-1 font-normal">{scale.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Scale Notes Formula Badges */}
        <div className="p-3.5 rounded-xl bg-muted/30 border border-border/40 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <Music className="h-4 w-4 text-primary" />
            <span>Scale Notes Formula ({scaleFormulaNotes.length} notes):</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {scaleFormulaNotes.map((item, idx) => (
              <div
                key={`scale-note-formula-${idx}`}
                className={`px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 border shadow-sm ${
                  item.isRoot
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 ring-1 ring-amber-400/30'
                    : 'bg-primary/10 text-primary border-primary/20'
                }`}
              >
                <span>{item.noteName}</span>
                <span className="text-[10px] opacity-70">({item.interval})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SVG Interactive 24-Fret Guitar Fretboard */}
      <div className="p-6 rounded-2xl glass-panel border border-border/40 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-sm flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            24-Fret Full Guitar Neck Diagram
          </h4>
          <span className="text-xs text-muted-foreground">Click any note to play or toggle state (Left-click play/add, Right-click toggle)</span>
        </div>

        {/* Horizontal Fretboard Canvas Scroll Container (25 Columns for Frets 0 to 24) */}
        <div className="overflow-x-auto pb-4">
          <div className="min-w-[1200px] relative bg-stone-900 rounded-xl p-5 border border-stone-800 shadow-2xl">
            {/* Fret Numbers Header (25 Columns for Fret 0 through 24) */}
            <div 
              className="text-center text-[11px] font-mono text-muted-foreground border-b border-stone-800 pb-2 mb-2"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(25, minmax(44px, 1fr))' }}
            >
              <span className="font-bold text-amber-400">Open (0)</span>
              {Array.from({ length: 24 }, (_, i) => i + 1).map(fretNum => (
                <span key={`fret-hdr-${fretNum}`} className={FRET_MARKERS.includes(fretNum) ? 'font-bold text-amber-300' : ''}>
                  {fretNum}
                </span>
              ))}
            </div>

            {/* 6 Guitar Strings Grid */}
            <div className="space-y-4 relative">
              {[1, 2, 3, 4, 5, 6].map(stringNum => {
                const gaugePx = Math.max(1, (7 - stringNum) * 0.8 + 1);

                return (
                  <div key={`string-row-${stringNum}`} className="relative flex items-center min-h-[40px]">
                    {/* String Physical Wire Line */}
                    <div
                      className="absolute left-0 right-0 bg-gradient-to-r from-stone-400 via-stone-300 to-stone-500 z-0 opacity-75"
                      style={{ height: `${gaugePx}px` }}
                    />

                    {/* Fret Cells (0 to 24) - 25 Grid Columns */}
                    <div 
                      className="w-full relative z-10"
                      style={{ display: 'grid', gridTemplateColumns: 'repeat(25, minmax(44px, 1fr))' }}
                    >
                      {Array.from({ length: 25 }, (_, fret) => {
                        const matchingNote = fretboardNotes.find(n => n.stringNum === stringNum && n.fret === fret);

                        return (
                          <div
                            key={`cell-${stringNum}-${fret}`}
                            className={`h-10 flex items-center justify-center relative border-r ${
                              fret === 0 ? 'border-r-4 border-amber-600/90 bg-stone-950/70' : 'border-stone-800'
                            }`}
                          >
                            {/* Fret Dot Markers on 3rd, 5th, 7th, 9th, 12th (double dot), 15, 17, 19, 21, 24 (double dot) */}
                            {stringNum === 3 && FRET_MARKERS.includes(fret) && (
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-25">
                                <div className={`rounded-full bg-amber-200 ${fret === 12 || fret === 24 ? 'h-3.5 w-3.5 shadow-glow' : 'h-2.5 w-2.5'}`} />
                              </div>
                            )}

                            {/* Note Badge for fretboard position */}
                            {matchingNote && (
                              <button
                                onClick={() => handleNeckNoteClick(matchingNote)}
                                onContextMenu={e => {
                                  e.preventDefault();
                                  handleToggleNoteOnNeck(stringNum, fret);
                                }}
                                className={`h-7 w-7 rounded-full text-[11px] font-mono font-bold flex items-center justify-center transition-all duration-200 shadow-md ${
                                  !matchingNote.isEnabled
                                    ? 'bg-stone-800/80 text-stone-500 border border-stone-700/60 opacity-30 hover:opacity-75 hover:border-amber-400/50'
                                    : matchingNote.isRoot
                                    ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 ring-2 ring-amber-300 shadow-amber-500/40 font-extrabold scale-105 active:scale-95'
                                    : 'bg-primary/90 hover:bg-primary text-primary-foreground border border-primary/40 active:scale-95'
                                }`}
                                title={`String ${stringNum}, Fret ${fret}: ${matchingNote.noteName} (${matchingNote.interval}) — Left click to play, Right click to toggle ON/OFF`}
                              >
                                {displayMode === 'noteName' ? matchingNote.noteName : matchingNote.interval}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Neck Melodic Sequence Progression Builder */}
      <div className="p-6 rounded-2xl glass-panel border border-border/40 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
          <div>
            <h4 className="font-bold text-base flex items-center gap-2">
              <Music className="h-5 w-5 text-primary" />
              Scale Melody & Progression Builder
            </h4>
            <p className="text-xs text-muted-foreground">Click notes on the fretboard above to add them to your custom step sequence!</p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant={isPlayingSeq ? 'destructive' : 'default'}
              onClick={togglePlayProgression}
              disabled={progression.length === 0}
              className="gap-2 font-bold px-4"
            >
              {isPlayingSeq ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isPlayingSeq ? 'Pause Sequence' : 'Play Sequence'}
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleClearProgression}
              disabled={progression.length === 0}
              className="gap-1.5 text-xs text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear
            </Button>
          </div>
        </div>

        {/* Progression Steps Timeline */}
        {progression.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-border/40 rounded-xl text-xs text-muted-foreground space-y-1">
            <Plus className="h-6 w-6 mx-auto text-primary/40" />
            <p className="font-semibold text-foreground">No notes in progression yet</p>
            <p>Click any note on the fretboard diagram above to build your sequence!</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {progression.map((step, idx) => (
                <div
                  key={step.id}
                  className={`p-3 rounded-xl border transition-all text-xs font-mono space-y-1 ${
                    activeStepIndex === idx
                      ? 'border-amber-400 bg-amber-500/20 text-amber-200 ring-2 ring-amber-400/40 font-bold scale-105 shadow-lg'
                      : 'border-border/60 bg-muted/40 text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-[10px] opacity-75">
                    <span>Step #{idx + 1}</span>
                    <button
                      onClick={() => setProgression(prev => prev.filter(p => p.id !== step.id))}
                      className="hover:text-destructive"
                    >
                      &times;
                    </button>
                  </div>
                  <div className="text-sm font-bold text-foreground">
                    {step.noteName} <span className="text-[10px] font-normal text-muted-foreground">(Str {step.stringNum}, Fret {step.fret})</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Tempo BPM Slider */}
            <div className="flex items-center gap-4 pt-2 max-w-xs">
              <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Tempo: {bpm} BPM</span>
              <Slider
                value={[bpm]}
                onValueChange={vals => setBpm(vals[0])}
                min={50}
                max={200}
                step={5}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
