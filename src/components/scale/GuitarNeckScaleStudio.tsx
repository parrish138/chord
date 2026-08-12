import React, { useState, useEffect, useRef } from 'react';
import { SCALE_DEFINITIONS, NOTES_CHROMATIC, generateFretboardScale, getScaleNotes } from '../../utils/scaleEngine';
import { FretboardNote, ScaleProgressionStep } from '../../types/scale';
import { playPluckedNote, getGuitarPreset } from '../../utils/audioSynth';
import { useGlobalBpm } from '../../utils/globalBpmManager';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Slider } from '../ui/slider';
import { Play, Pause, Sparkles, Plus, Trash2, Music, Eye, Layers, Globe, CheckCircle2, RotateCcw, ArrowUp, ArrowDown, Repeat, Shuffle, Volume2 } from 'lucide-react';

export interface SlideRuleChordDef {
  id: string;
  name: string;
  category: 'triad' | 'seventh' | 'sixth' | 'extended' | 'altered' | 'suspended';
  degreeFormula: string[];
  semitones: number[];
}

export const SLIDE_RULE_CHORDS: SlideRuleChordDef[] = [
  { id: 'maj-triad', name: 'Major Triad', category: 'triad', degreeFormula: ['1', '3', '5'], semitones: [0, 4, 7] },
  { id: 'aug-triad', name: 'Augmented Triad', category: 'triad', degreeFormula: ['1', '3', '#5'], semitones: [0, 4, 8] },
  { id: 'min-triad', name: 'Minor Triad', category: 'triad', degreeFormula: ['1', 'b3', '5'], semitones: [0, 3, 7] },
  { id: 'dim-triad', name: 'Diminished Triad', category: 'triad', degreeFormula: ['1', 'b3', 'b5'], semitones: [0, 3, 6] },

  { id: 'dom-7', name: 'Seven Chord - Dominant 7', category: 'seventh', degreeFormula: ['1', '3', '5', 'b7'], semitones: [0, 4, 7, 10] },
  { id: 'min-7', name: 'Minor Seven - m7', category: 'seventh', degreeFormula: ['1', 'b3', '5', 'b7'], semitones: [0, 3, 7, 10] },
  { id: 'dim-7', name: 'Diminished Seven - dim7', category: 'seventh', degreeFormula: ['1', 'b3', 'b5', 'bb7'], semitones: [0, 3, 6, 9] },
  { id: 'maj-7', name: 'Major Seven - Major 7 (maj7)', category: 'seventh', degreeFormula: ['1', '3', '5', '7'], semitones: [0, 4, 7, 11] },
  { id: 'min-maj-7', name: 'Minor Major Seven - Mmaj7', category: 'seventh', degreeFormula: ['1', 'b3', '5', '7'], semitones: [0, 3, 7, 11] },
  { id: 'm7b5', name: 'Minor Seven Flat Five - m7b5 (half dim)', category: 'seventh', degreeFormula: ['1', 'b3', 'b5', 'b7'], semitones: [0, 3, 6, 10] },

  { id: 'maj-6', name: 'Six Chord - Major 6', category: 'sixth', degreeFormula: ['1', '3', '5', '6'], semitones: [0, 4, 7, 9] },
  { id: 'min-6', name: 'Minor Six - m6', category: 'sixth', degreeFormula: ['1', 'b3', '5', '6'], semitones: [0, 3, 7, 9] },

  { id: 'sus4', name: 'Suspended 4 - sus4', category: 'suspended', degreeFormula: ['1', '4', '5'], semitones: [0, 5, 7] },
  { id: '7sharp5', name: 'Seven Sharp Five - 7#5', category: 'altered', degreeFormula: ['1', '3', '#5', 'b7'], semitones: [0, 4, 8, 10] },
  { id: '7flat5', name: 'Seven Flat Five - 7b5', category: 'altered', degreeFormula: ['1', '3', 'b5', 'b7'], semitones: [0, 4, 6, 10] },

  { id: 'dom-9', name: 'Nine Chord - 9', category: 'extended', degreeFormula: ['1', '3', '5', 'b7', '9'], semitones: [0, 4, 7, 10, 2] },
  { id: 'min-9', name: 'Minor Nine - m9', category: 'extended', degreeFormula: ['1', 'b3', '5', 'b7', '9'], semitones: [0, 3, 7, 10, 2] },
  { id: 'add9', name: 'Add 9 - add9', category: 'extended', degreeFormula: ['1', '3', '5', '9'], semitones: [0, 4, 7, 2] },
  { id: 'six-add9', name: 'Major Six Add Nine - 6/9', category: 'extended', degreeFormula: ['1', '3', '5', '6', '9'], semitones: [0, 4, 7, 9, 2] },

  { id: 'dom-11', name: 'Eleven Chord - 11', category: 'extended', degreeFormula: ['1', '3', '5', 'b7', '9', '11'], semitones: [0, 4, 7, 10, 2, 5] },
  { id: '7sharp9', name: 'Seven Sharp Nine - 7#9 (Hendrix)', category: 'altered', degreeFormula: ['1', '3', '5', 'b7', '#9'], semitones: [0, 4, 7, 10, 3] },
  { id: 'dom-13', name: 'Thirteen Chord - 13', category: 'extended', degreeFormula: ['1', '3', '5', 'b7', '9', '11', '13'], semitones: [0, 4, 7, 10, 2, 5, 9] },
  { id: '7flat9', name: 'Seven Flat Nine - 7b9', category: 'altered', degreeFormula: ['1', '3', '5', 'b7', 'b9'], semitones: [0, 4, 7, 10, 1] },
];

export interface GuitarNeckScaleStudioProps {
  rootNote?: string;
  onRootNoteChange?: (rootNote: string) => void;
  selectedScaleId?: string;
  onSelectedScaleIdChange?: (scaleId: string) => void;
  displayMode?: 'interval' | 'noteName' | 'fingering';
  onDisplayModeChange?: (mode: 'interval' | 'noteName' | 'fingering') => void;
  showPresetSelectorHeader?: boolean;
}

export const GuitarNeckScaleStudio: React.FC<GuitarNeckScaleStudioProps> = ({
  rootNote: propRootNote,
  onRootNoteChange,
  selectedScaleId: propSelectedScaleId,
  onSelectedScaleIdChange,
  displayMode: propDisplayMode,
  onDisplayModeChange,
  showPresetSelectorHeader = true,
}) => {
  const [internalRootNote, setInternalRootNote] = useState<string>('C');
  const [internalSelectedScaleId, setInternalSelectedScaleId] = useState<string>('major');
  const [internalDisplayMode, setInternalDisplayMode] = useState<'interval' | 'noteName' | 'fingering'>('interval');

  const rootNote = propRootNote !== undefined ? propRootNote : internalRootNote;
  const setRootNote = (note: string) => {
    if (onRootNoteChange) onRootNoteChange(note);
    setInternalRootNote(note);
  };

  const selectedScaleId = propSelectedScaleId !== undefined ? propSelectedScaleId : internalSelectedScaleId;
  const setSelectedScaleId = (scaleId: string) => {
    if (onSelectedScaleIdChange) onSelectedScaleIdChange(scaleId);
    setInternalSelectedScaleId(scaleId);
  };

  const displayMode = propDisplayMode !== undefined ? propDisplayMode : internalDisplayMode;
  const setDisplayMode = (mode: 'interval' | 'noteName' | 'fingering') => {
    if (onDisplayModeChange) onDisplayModeChange(mode);
    setInternalDisplayMode(mode);
  };

  const [fretboardNotes, setFretboardNotes] = useState<FretboardNote[]>([]);
  const [showOffScaleNotes, setShowOffScaleNotes] = useState<boolean>(false);
  const [progression, setProgression] = useState<ScaleProgressionStep[]>([]);
  const [isPlayingSeq, setIsPlayingSeq] = useState<boolean>(false);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(-1);
  const [activePlayingFretKey, setActivePlayingFretKey] = useState<string | null>(null);
  const [bpm, setBpm] = useGlobalBpm();

  // Slide Rule State
  const [slideRuleTab, setSlideRuleTab] = useState<'diatonic' | 'harmonic' | 'chords'>('diatonic');
  const [isPlayingArpeggio, setIsPlayingArpeggio] = useState<boolean>(false);
  const [arpeggioDirection, setArpeggioDirection] = useState<'up' | 'down' | 'updown' | 'random'>('up');
  const [mutedArpeggioNotes, setMutedArpeggioNotes] = useState<Set<string>>(new Set());

  const triggerNoteHighlight = (stringNum: number, fret: number, durationMs: number = 300) => {
    setActivePlayingFretKey(`${stringNum}-${fret}`);
    setTimeout(() => setActivePlayingFretKey(null), durationMs);
  };

  const toggleMuteArpeggioNote = (noteName: string) => {
    setMutedArpeggioNotes(prev => {
      const next = new Set(prev);
      if (next.has(noteName)) next.delete(noteName);
      else next.add(noteName);
      return next;
    });
  };

  const handlePlayScaleArpeggio = () => {
    if (isPlayingArpeggio) return;
    const notes = getScaleNotes(rootNote, selectedScaleId).filter(n => !mutedArpeggioNotes.has(n.noteName));
    if (notes.length === 0) return;

    setIsPlayingArpeggio(true);
    let sequence = [...notes];
    if (arpeggioDirection === 'down') sequence.reverse();
    else if (arpeggioDirection === 'updown') sequence = [...sequence, ...[...sequence].slice(0, -1).reverse()];
    else if (arpeggioDirection === 'random') {
      for (let i = sequence.length - 1; i > 0; i--) {
        const r = Math.floor(Math.random() * (i + 1));
        [sequence[i], sequence[r]] = [sequence[r], sequence[i]];
      }
    }

    sequence.forEach((item, idx) => {
      setTimeout(() => {
        const rootIdx = NOTES_CHROMATIC.indexOf(rootNote);
        const noteSemis = (NOTES_CHROMATIC.indexOf(item.noteName) - rootIdx + 12) % 12;
        const midiPitch = 60 + noteSemis;
        const freq = 440 * Math.pow(2, (midiPitch - 69) / 12);
        playPluckedNote(freq, 0.8);

        // Find one representative fret position for this note on the fretboard
        const rep = fretboardNotes.find(n => n.noteName === item.noteName && n.isEnabled);
        if (rep) triggerNoteHighlight(rep.stringNum, rep.fret, 250);

        if (idx === sequence.length - 1) {
          setTimeout(() => setIsPlayingArpeggio(false), 500);
        }
      }, idx * 220);
    });
  };

  const seqTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Re-generate fretboard notes across all 24 frets whenever rootNote, selectedScaleId, or showOffScaleNotes changes
  useEffect(() => {
    const notes = generateFretboardScale(rootNote, selectedScaleId, 24, true);
    const scaleNoteNames = new Set(getScaleNotes(rootNote, selectedScaleId).map(n => n.noteName));

    setFretboardNotes(
      notes.map(n => {
        const isInScale = scaleNoteNames.has(n.noteName);
        return {
          ...n,
          isScaleNote: isInScale,
          isEnabled: isInScale || showOffScaleNotes,
        };
      })
    );
  }, [rootNote, selectedScaleId, showOffScaleNotes]);

  // Toggle off-scale notes visibility
  const handleToggleOffScaleNotes = () => {
    setShowOffScaleNotes(prev => !prev);
  };

  // Musical Slide Rule: Play custom chord arpeggio
  const handlePlayChordArpeggio = (chordDef: SlideRuleChordDef) => {
    if (isPlayingArpeggio) return;
    setIsPlayingArpeggio(true);

    const rootIdx = NOTES_CHROMATIC.indexOf(rootNote);

    chordDef.semitones.forEach((semi, idx) => {
      setTimeout(() => {
        const midiPitch = 60 + semi;
        const freq = 440 * Math.pow(2, (midiPitch - 69) / 12);
        playPluckedNote(freq, 0.8);

        const noteName = NOTES_CHROMATIC[(rootIdx + semi) % 12];
        const match = fretboardNotes.find(n => n.noteName === noteName && n.isEnabled);
        if (match) {
          triggerNoteHighlight(match.stringNum, match.fret, 250);
        }

        if (idx === chordDef.semitones.length - 1) {
          setTimeout(() => setIsPlayingArpeggio(false), 500);
        }
      }, idx * 240);
    });
  };

  // Musical Slide Rule: Load custom chord formula on fretboard
  const handleLoadChordOnNeck = (chordDef: SlideRuleChordDef) => {
    const rootIdx = NOTES_CHROMATIC.indexOf(rootNote);
    const chordNoteNames = new Set(chordDef.semitones.map(semi => NOTES_CHROMATIC[(rootIdx + semi) % 12]));

    setFretboardNotes(prev =>
      prev.map(n => ({
        ...n,
        isScaleNote: chordNoteNames.has(n.noteName),
        isEnabled: chordNoteNames.has(n.noteName),
      }))
    );
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
    triggerNoteHighlight(note.stringNum, note.fret, 350);

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
          triggerNoteHighlight(currentStep.stringNum, currentStep.fret, Math.min(350, intervalMs * 0.8));
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
      {showPresetSelectorHeader && (
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
                variant={showOffScaleNotes ? 'default' : 'outline'}
                onClick={handleToggleOffScaleNotes}
                className="gap-1.5 text-xs font-bold transition-all"
              >
                {showOffScaleNotes ? (
                  <>
                    <RotateCcw className="h-4 w-4 text-amber-300" />
                    Revert to Scale
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 text-blue-400" />
                    Show Off-Scale Notes
                  </>
                )}
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setDisplayMode(displayMode === 'interval' ? 'noteName' : displayMode === 'noteName' ? 'fingering' : 'interval')}
                className="gap-2 text-xs"
              >
                <Eye className="h-4 w-4" />
                Display: <span className="font-bold capitalize">{displayMode === 'interval' ? 'Intervals' : displayMode === 'noteName' ? 'Note Names' : 'Suggested Fingering'}</span>
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
                {SCALE_DEFINITIONS.filter(s => s.id !== 'all-notes').map(scale => (
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
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs font-semibold">
              <div className="flex items-center gap-2">
                <Music className="h-4 w-4 text-primary" />
                <span>Scale Notes Formula ({scaleFormulaNotes.length} notes):</span>
              </div>
              <span className="text-[11px] text-muted-foreground font-normal">(Click notes to toggle ON/OFF for arpeggio preview)</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {scaleFormulaNotes.map((item, idx) => {
                const isMuted = mutedArpeggioNotes.has(item.noteName);

                return (
                  <button
                    key={`scale-note-formula-${idx}`}
                    onClick={() => toggleMuteArpeggioNote(item.noteName)}
                    className={`px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 border shadow-sm transition-all cursor-pointer ${
                      isMuted
                        ? 'bg-stone-900/90 text-stone-500 border-stone-800 line-through opacity-40 hover:opacity-80 scale-95'
                        : item.isRoot
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 ring-1 ring-amber-400/30'
                        : 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'
                    }`}
                    title={`Click to ${isMuted ? 'ENABLE' : 'DISABLE'} ${item.noteName} in arpeggio preview`}
                  >
                    <span>{item.noteName}</span>
                    <span className="text-[10px] opacity-70">({item.interval})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SVG Interactive 24-Fret Guitar Fretboard */}
      <div className="p-6 rounded-2xl glass-panel border border-border/40 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/30 pb-3">
          <h4 className="font-bold text-sm flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            24-Fret Full Guitar Neck Diagram ({rootNote} {currentScaleDef.name})
          </h4>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant={showOffScaleNotes ? 'default' : 'outline'}
              onClick={handleToggleOffScaleNotes}
              className="gap-1 text-[11px] h-7 font-bold transition-all"
            >
              {showOffScaleNotes ? (
                <>
                  <RotateCcw className="h-3.5 w-3.5 text-amber-300" />
                  Revert to Scale
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5 text-blue-400" />
                  Show Off-Scale
                </>
              )}
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setDisplayMode(displayMode === 'interval' ? 'noteName' : displayMode === 'noteName' ? 'fingering' : 'interval')}
              className="gap-1 text-[11px] h-7 font-bold"
            >
              <Eye className="h-3.5 w-3.5" />
              {displayMode === 'interval' ? 'Intervals' : displayMode === 'noteName' ? 'Note Names' : 'Fingering'}
            </Button>
          </div>
        </div>

        {/* Color Legend for Neck Notes */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono bg-muted/20 px-3 py-1.5 rounded-lg border border-border/30">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Note Key:</span>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 ring-1 ring-amber-300" />
            <span className="text-amber-300 font-bold">Root</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-purple-600 border border-purple-400" />
            <span className="text-purple-300 font-bold">In-Scale</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-blue-600 border border-blue-400" />
            <span className="text-blue-300 font-bold">Off-Scale (Blue)</span>
          </div>
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
                            {matchingNote && (() => {
                              const isInScale = matchingNote.isScaleNote !== undefined
                                ? matchingNote.isScaleNote
                                : scaleFormulaNotes.some(n => n.noteName === matchingNote.noteName);

                              const isPlayingThisNote =
                                activePlayingFretKey === `${matchingNote.stringNum}-${matchingNote.fret}`;

                              let colorStyle = '';
                              if (!matchingNote.isEnabled) {
                                colorStyle = 'bg-stone-800/80 text-stone-500 border border-stone-700/60 opacity-30 hover:opacity-75 hover:border-amber-400/50';
                              } else if (matchingNote.isRoot) {
                                colorStyle = 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 ring-2 ring-amber-300 shadow-amber-500/40 font-extrabold scale-105 active:scale-95';
                              } else if (isInScale) {
                                colorStyle = 'bg-purple-600 hover:bg-purple-500 text-white border border-purple-400/60 shadow-md shadow-purple-900/40 active:scale-95';
                              } else {
                                colorStyle = 'bg-blue-600 hover:bg-blue-500 text-white border border-blue-400/80 shadow-md shadow-blue-900/40 active:scale-95';
                              }

                              // Subtle highlight overlay when this exact position is being played
                              const playingHighlight = isPlayingThisNote
                                ? 'ring-2 ring-white/70 shadow-lg shadow-white/20 scale-110 z-20'
                                : '';

                              const badgeText = displayMode === 'noteName'
                                ? matchingNote.noteName
                                : displayMode === 'interval'
                                ? matchingNote.interval
                                : (matchingNote.fret === 0 ? 'O' : `${((matchingNote.fret - 1) % 4) + 1}`);

                              return (
                                <button
                                  onClick={() => handleNeckNoteClick(matchingNote)}
                                  onContextMenu={e => {
                                    e.preventDefault();
                                    handleToggleNoteOnNeck(stringNum, fret);
                                  }}
                                  className={`h-7 w-7 rounded-full text-[11px] font-mono font-bold flex items-center justify-center transition-all duration-200 shadow-md ${colorStyle} ${playingHighlight}`}
                                  title={`String ${stringNum}, Fret ${fret}: ${matchingNote.noteName} (${matchingNote.interval}) — ${isInScale ? 'In Scale' : 'Off Scale Chromatic'}`}
                                >
                                  {badgeText}
                                </button>
                              );
                            })()}
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

      {/* ========================================================== */}
      {/* SCOTTY'S FAMOUS MUSICAL SLIDE RULE & HARMONIZER MATRIX */}
      {/* ========================================================== */}
      <div className="p-6 rounded-2xl glass-panel border border-border/40 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-400" />
              <h3 className="text-xl font-extrabold tracking-tight">Musical Slide Rule & Harmonizer Matrix</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Complete modal harmonization degree map, Roman numerals, and 23 chord/arpeggio formula matrices for Key of <span className="font-bold text-amber-400 font-mono">{rootNote}</span>.
            </p>
          </div>

          {/* 3-Way Sub-Tabs */}
          <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/50">
            <Button
              size="sm"
              variant={slideRuleTab === 'diatonic' ? 'default' : 'ghost'}
              onClick={() => setSlideRuleTab('diatonic')}
              className="text-xs font-bold gap-1.5"
            >
              Major Diatonic Modes
            </Button>
            <Button
              size="sm"
              variant={slideRuleTab === 'harmonic' ? 'default' : 'ghost'}
              onClick={() => setSlideRuleTab('harmonic')}
              className="text-xs font-bold gap-1.5"
            >
              Harmonic Minor Modes
            </Button>
            <Button
              size="sm"
              variant={slideRuleTab === 'chords' ? 'default' : 'ghost'}
              onClick={() => setSlideRuleTab('chords')}
              className="text-xs font-bold gap-1.5"
            >
              23 Chord & Arpeggio Formulas
            </Button>
          </div>
        </div>

        {/* VIEW 1: MAJOR DIATONIC MODES (Scotty's Slide Rule Top-Left) */}
        {slideRuleTab === 'diatonic' && (
          <div className="space-y-4">
            <div className="text-xs text-muted-foreground font-medium">
              Click any mode or Roman numeral below to set the active scale and map its notes across all 24 frets:
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { roman: 'I', name: 'IONIAN - Major Diatonic Scale', scaleId: 'major', degree: '1 2 3 4 5 6 7', type: 'Major Triad / Maj7' },
                { roman: 'ii', name: 'DORIAN - Minor', scaleId: 'dorian', degree: '1 2 b3 4 5 6 b7', type: 'Minor Triad / m7' },
                { roman: 'iii', name: 'PHRYGIAN - Minor', scaleId: 'phrygian', degree: '1 b2 b3 4 5 b6 b7', type: 'Minor Triad / m7' },
                { roman: 'IV', name: 'LYDIAN - Major', scaleId: 'lydian', degree: '1 2 3 #4 5 6 7', type: 'Major Triad / Maj7' },
                { roman: 'V', name: 'MIXOLYDIAN - Major', scaleId: 'mixolydian', degree: '1 2 3 4 5 6 b7', type: 'Major Triad / Dom7' },
                { roman: 'Vi', name: 'AEOLIAN - Natural Minor (relative minor)', scaleId: 'natural-minor', degree: '1 2 b3 4 5 b6 b7', type: 'Minor Triad / m7' },
                { roman: 'Vii°', name: 'LOCRIAN - Half Diminished', scaleId: 'locrian', degree: '1 b2 b3 4 b5 b6 b7', type: 'Diminished Triad / m7b5' },
              ].map((m) => {
                const notes = getScaleNotes(rootNote, m.scaleId);
                const isSelected = selectedScaleId === m.scaleId;

                return (
                  <button
                    key={`diatonic-mode-${m.roman}`}
                    onClick={() => setSelectedScaleId(m.scaleId)}
                    className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 ${
                      isSelected
                        ? 'border-amber-400 bg-amber-500/15 text-amber-200 ring-1 ring-amber-400/40 shadow-lg'
                        : 'border-border/60 bg-slate-950/40 hover:bg-muted/50 text-muted-foreground'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-extrabold text-base text-amber-400 w-8">{m.roman}</span>
                        <span className="font-bold text-xs text-foreground">{m.name}</span>
                      </div>
                      <Badge variant="secondary" className="text-[10px] font-mono">{m.type}</Badge>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {notes.map((n, idx) => (
                        <span
                          key={`note-${idx}`}
                          className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${
                            n.isRoot
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-black'
                              : 'bg-slate-900 text-slate-200 border-slate-800'
                          }`}
                        >
                          {n.noteName} <span className="text-[9px] opacity-70">({n.interval})</span>
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 2: HARMONIC MINOR MODES (Scotty's Slide Rule Top-Right) */}
        {slideRuleTab === 'harmonic' && (
          <div className="space-y-4">
            <div className="text-xs text-muted-foreground font-medium">
              Click any Harmonic Minor mode to map its exotic interval formula to the fretboard:
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { roman: 'i', name: 'HARMONIC MINOR - Aeolian Major 7', scaleId: 'harmonic-minor', degree: '1 2 b3 4 5 b6 7' },
                { roman: 'iiø', name: 'LOCRIAN #6 - Half Diminished', scaleId: 'locrian-sharp-6', degree: '1 b2 b3 4 b5 6 b7' },
                { roman: 'III+', name: 'IONIAN #5 - Augmented', scaleId: 'ionian-sharp-5', degree: '1 2 3 4 #5 6 7' },
                { roman: 'iV', name: 'DORIAN #4 - Romanian / Minor', scaleId: 'dorian-sharp-4', degree: '1 2 b3 #4 5 6 b7' },
                { roman: 'V', name: 'PHRYGIAN MAJOR - Spanish Gypsy', scaleId: 'phrygian-dominant', degree: '1 b2 3 4 5 b6 b7' },
                { roman: 'Vi', name: 'LYDIAN #2 - Major', scaleId: 'lydian-sharp-2', degree: '1 #2 3 #4 5 6 7' },
                { roman: 'Vii°', name: 'ULTRALOCRIAN - Diminished 7', scaleId: 'ultralocrian', degree: '1 b2 b3 b4 b5 b6 bb7' },
              ].map((m) => {
                const notes = getScaleNotes(rootNote, m.scaleId);
                const isSelected = selectedScaleId === m.scaleId;

                return (
                  <button
                    key={`harmonic-mode-${m.roman}`}
                    onClick={() => setSelectedScaleId(m.scaleId)}
                    className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 ${
                      isSelected
                        ? 'border-purple-400 bg-purple-500/15 text-purple-200 ring-1 ring-purple-400/40 shadow-lg'
                        : 'border-border/60 bg-slate-950/40 hover:bg-muted/50 text-muted-foreground'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-extrabold text-base text-purple-400 w-10">{m.roman}</span>
                        <span className="font-bold text-xs text-foreground">{m.name}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-mono text-purple-300 border-purple-400/30">Harmonic Minor Mode</Badge>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {notes.map((n, idx) => (
                        <span
                          key={`note-h-${idx}`}
                          className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${
                            n.isRoot
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-black'
                              : 'bg-purple-950/40 text-purple-200 border-purple-800/60'
                          }`}
                        >
                          {n.noteName} <span className="text-[9px] opacity-70">({n.interval})</span>
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 3: 23 CHORD & ARPEGGIO FORMULAS (Scotty's Slide Rule Bottom Matrix) */}
        {slideRuleTab === 'chords' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-muted-foreground font-medium">
              <span>23 Chord & Arpeggio Formulas from Musical Slide Rule for root note <strong className="text-amber-400 font-mono">{rootNote}</strong>:</span>
              <span className="text-[11px] opacity-70">Click "Load on Neck" to map arpeggio notes across all 24 frets, or "Play Arpeggio" to hear audio preview.</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {SLIDE_RULE_CHORDS.map((chord) => {
                const rootIdx = NOTES_CHROMATIC.indexOf(rootNote);
                const chordNotes = chord.semitones.map((semi, idx) => ({
                  noteName: NOTES_CHROMATIC[(rootIdx + semi) % 12],
                  interval: chord.degreeFormula[idx] || `${semi}`,
                  isRoot: semi === 0,
                }));

                return (
                  <div
                    key={`slide-chord-${chord.id}`}
                    className="p-3.5 rounded-xl border border-border/60 bg-slate-950/50 hover:bg-slate-950/80 transition-all flex flex-col justify-between gap-3 shadow-md"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-xs text-amber-300">{rootNote} {chord.name}</span>
                        <Badge variant="secondary" className="text-[9px] font-mono capitalize opacity-80">{chord.category}</Badge>
                      </div>

                      {/* Note Pills */}
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {chordNotes.map((cn, idx) => (
                          <span
                            key={`cn-${idx}`}
                            className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${
                              cn.isRoot
                                ? 'bg-amber-500/25 text-amber-300 border-amber-500/40 ring-1 ring-amber-400/30'
                                : 'bg-slate-900 text-slate-200 border-slate-800'
                            }`}
                          >
                            {cn.noteName} <span className="text-[9px] opacity-70">({cn.interval})</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-2 border-t border-border/30">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleLoadChordOnNeck(chord)}
                        className="flex-1 gap-1 text-[10px] h-7 font-bold border-amber-500/30 hover:bg-amber-500/10 text-amber-300"
                      >
                        <Layers className="h-3 w-3" />
                        Load on Neck
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePlayChordArpeggio(chord)}
                        className="flex-1 gap-1 text-[10px] h-7 font-bold border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-300"
                      >
                        <Play className="h-3 w-3" />
                        Play Arpeggio
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
