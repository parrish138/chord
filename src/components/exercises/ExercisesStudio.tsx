import React, { useState, useEffect, useRef } from 'react';
import { TabTrack, TabColumn, TabNote } from '../../types/tab';
import { TabRenderer } from '../tab/TabRenderer';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { playPluckedNote, getFrequencyForStringAndFret, getGuitarPreset } from '../../utils/audioSynth';
import { useGlobalBpm } from '../../utils/globalBpmManager';
import { Play, Square, RotateCcw, ChevronUp, ChevronDown, ChevronsUpDown, Sparkles, Dumbbell, Music } from 'lucide-react';
import { Badge } from '../ui/badge';

// ──────────────────────────────────────────────────────────────
// Spider Exercise (Chromatic) Generator
// ──────────────────────────────────────────────────────────────
// The spider exercise plays 4 consecutive chromatic frets (e.g. 1-2-3-4)
// on each string, going from string 6 (low E) to string 1 (high E) — "ascending".
// Then it shifts up one fret position and descends from string 1 back to string 6.
// Repeats across the fretboard.

type SpiderDirection = 'up' | 'down' | 'updown';
type SpiderPattern = '1-2-3-4' | '4-3-2-1' | '1-3-2-4' | '1-4-2-3';

const PATTERN_OFFSETS: Record<SpiderPattern, number[]> = {
  '1-2-3-4': [0, 1, 2, 3],
  '4-3-2-1': [3, 2, 1, 0],
  '1-3-2-4': [0, 2, 1, 3],
  '1-4-2-3': [0, 3, 1, 2],
};

function generateSpiderExercise(
  startFret: number,
  numPositions: number,
  direction: SpiderDirection,
  pattern: SpiderPattern = '1-2-3-4'
): TabTrack {
  const columns: TabColumn[] = [];
  let colId = 0;
  const offsets = PATTERN_OFFSETS[pattern];

  const makeCol = (stringNum: number, fret: number, label?: string): TabColumn => ({
    id: `spider-${colId++}`,
    notes: [{ stringNum, fret }],
    chordLabel: label,
  });

  for (let pos = 0; pos < numPositions; pos++) {
    const baseFret = startFret + pos;
    if (baseFret + 3 > 24) break; // Don't exceed 24 frets

    // Label the start of each position
    const posLabel = `Shift Pos ${baseFret} (Frets ${baseFret}-${baseFret + 3})`;

    if (direction === 'up' || direction === 'updown') {
      // Ascending: String 6 → 1
      for (let s = 6; s >= 1; s--) {
        for (let i = 0; i < offsets.length; i++) {
          const fretOffset = offsets[i];
          const isFirstNote = s === 6 && i === 0;
          columns.push(makeCol(s, baseFret + fretOffset, isFirstNote ? posLabel : undefined));
        }
      }
    }

    if (direction === 'down' || direction === 'updown') {
      // Descending: String 1 → 6
      const descOffsets = [...offsets].reverse();
      for (let s = 1; s <= 6; s++) {
        for (let i = 0; i < descOffsets.length; i++) {
          const fretOffset = descOffsets[i];
          const isFirstNote = direction === 'down' && s === 1 && i === 0;
          columns.push(makeCol(s, baseFret + fretOffset, isFirstNote ? posLabel : undefined));
        }
      }
    }
  }

  return {
    id: 'spider-exercise',
    title: `Spider Exercise (${pattern}) — Fret ${startFret}`,
    tempoBpm: 80,
    timeSignature: '4/4',
    columns,
  };
}

// ──────────────────────────────────────────────────────────────
// Exercise 2: Strumming & Alternate Picking Definitions
// ──────────────────────────────────────────────────────────────
export interface StrumStroke {
  stroke: 'down' | 'up' | 'rest' | 'mute';
  beatLabel: string;
}

export interface StrumPatternDef {
  id: string;
  name: string;
  description: string;
  strokes: StrumStroke[];
}

export const STRUM_PATTERNS: StrumPatternDef[] = [
  {
    id: 'alt-8ths',
    name: 'Strict Alternate Picking (↓ ↑ ↓ ↑)',
    description: 'Constant 8th-note down/up alternate strokes. Master picking hand consistency and timing.',
    strokes: [
      { stroke: 'down', beatLabel: '1 (↓)' },
      { stroke: 'up', beatLabel: '& (↑)' },
      { stroke: 'down', beatLabel: '2 (↓)' },
      { stroke: 'up', beatLabel: '& (↑)' },
      { stroke: 'down', beatLabel: '3 (↓)' },
      { stroke: 'up', beatLabel: '& (↑)' },
      { stroke: 'down', beatLabel: '4 (↓)' },
      { stroke: 'up', beatLabel: '& (↑)' },
    ],
  },
  {
    id: 'pop-rock',
    name: 'Classic Island / Pop Strum (↓ ↓ ↑ ↑ ↓ ↑)',
    description: 'The most popular guitar strumming pattern (D - D U - U D U). Great for syncopated rhythms.',
    strokes: [
      { stroke: 'down', beatLabel: '1 (↓)' },
      { stroke: 'rest', beatLabel: '&' },
      { stroke: 'down', beatLabel: '2 (↓)' },
      { stroke: 'up', beatLabel: '& (↑)' },
      { stroke: 'rest', beatLabel: '3' },
      { stroke: 'up', beatLabel: '& (↑)' },
      { stroke: 'down', beatLabel: '4 (↓)' },
      { stroke: 'up', beatLabel: '& (↑)' },
    ],
  },
  {
    id: 'driving-4-4',
    name: 'Driving Rock 4/4 (↓ ↓ ↑ ↓ ↓ ↑)',
    description: 'Steady 4/4 rhythm with upstroke accents on off-beats.',
    strokes: [
      { stroke: 'down', beatLabel: '1 (↓)' },
      { stroke: 'rest', beatLabel: '&' },
      { stroke: 'down', beatLabel: '2 (↓)' },
      { stroke: 'up', beatLabel: '& (↑)' },
      { stroke: 'down', beatLabel: '3 (↓)' },
      { stroke: 'rest', beatLabel: '&' },
      { stroke: 'down', beatLabel: '4 (↓)' },
      { stroke: 'up', beatLabel: '& (↑)' },
    ],
  },
  {
    id: 'reggae-ska',
    name: 'Reggae / Ska Off-Beat (x ↑ x ↑ x ↑ x ↑)',
    description: 'Muted downbeats with sharp upbeat accents on the "&" beats.',
    strokes: [
      { stroke: 'mute', beatLabel: '1 (x)' },
      { stroke: 'up', beatLabel: '& (↑)' },
      { stroke: 'mute', beatLabel: '2 (x)' },
      { stroke: 'up', beatLabel: '& (↑)' },
      { stroke: 'mute', beatLabel: '3 (x)' },
      { stroke: 'up', beatLabel: '& (↑)' },
      { stroke: 'mute', beatLabel: '4 (x)' },
      { stroke: 'up', beatLabel: '& (↑)' },
    ],
  },
  {
    id: 'gallop',
    name: 'Gallop Rhythm (↓ ↓ ↑ ↓ ↓ ↑)',
    description: 'Heavy metal and rock 16th-note gallop rhythm pattern.',
    strokes: [
      { stroke: 'down', beatLabel: '1 (↓)' },
      { stroke: 'down', beatLabel: 'e (↓)' },
      { stroke: 'up', beatLabel: '& (↑)' },
      { stroke: 'rest', beatLabel: 'a' },
      { stroke: 'down', beatLabel: '2 (↓)' },
      { stroke: 'down', beatLabel: 'e (↓)' },
      { stroke: 'up', beatLabel: '& (↑)' },
      { stroke: 'rest', beatLabel: 'a' },
    ],
  },
];

export interface ChordProgressionDef {
  id: string;
  name: string;
  chords: Array<{ name: string; notes: TabNote[] }>;
}

export const EXERCISE_PROGRESSIONS: ChordProgressionDef[] = [
  {
    id: 'pop-c-am-f-g',
    name: 'Pop Classic (C - Am - F - G)',
    chords: [
      { name: 'C', notes: [{ stringNum: 5, fret: 3 }, { stringNum: 4, fret: 2 }, { stringNum: 3, fret: 0 }, { stringNum: 2, fret: 1 }] },
      { name: 'Am', notes: [{ stringNum: 5, fret: 0 }, { stringNum: 4, fret: 2 }, { stringNum: 3, fret: 2 }, { stringNum: 2, fret: 1 }] },
      { name: 'F', notes: [{ stringNum: 6, fret: 1 }, { stringNum: 5, fret: 3 }, { stringNum: 4, fret: 3 }, { stringNum: 3, fret: 2 }, { stringNum: 2, fret: 1 }, { stringNum: 1, fret: 1 }] },
      { name: 'G', notes: [{ stringNum: 6, fret: 3 }, { stringNum: 5, fret: 2 }, { stringNum: 4, fret: 0 }, { stringNum: 3, fret: 0 }, { stringNum: 2, fret: 0 }, { stringNum: 1, fret: 3 }] },
    ],
  },
  {
    id: 'rock-g-d-em-c',
    name: 'Rock Anthem (G - D - Em - C)',
    chords: [
      { name: 'G', notes: [{ stringNum: 6, fret: 3 }, { stringNum: 5, fret: 2 }, { stringNum: 4, fret: 0 }, { stringNum: 3, fret: 0 }, { stringNum: 2, fret: 0 }, { stringNum: 1, fret: 3 }] },
      { name: 'D', notes: [{ stringNum: 4, fret: 0 }, { stringNum: 3, fret: 2 }, { stringNum: 2, fret: 3 }, { stringNum: 1, fret: 2 }] },
      { name: 'Em', notes: [{ stringNum: 6, fret: 0 }, { stringNum: 5, fret: 2 }, { stringNum: 4, fret: 2 }, { stringNum: 3, fret: 0 }, { stringNum: 2, fret: 0 }, { stringNum: 1, fret: 0 }] },
      { name: 'C', notes: [{ stringNum: 5, fret: 3 }, { stringNum: 4, fret: 2 }, { stringNum: 3, fret: 0 }, { stringNum: 2, fret: 1 }] },
    ],
  },
  {
    id: 'single-string-alt',
    name: 'Single String Alternate Picking (Low E)',
    chords: [
      { name: 'Fret 0', notes: [{ stringNum: 6, fret: 0 }] },
      { name: 'Fret 3', notes: [{ stringNum: 6, fret: 3 }] },
      { name: 'Fret 5', notes: [{ stringNum: 6, fret: 5 }] },
      { name: 'Fret 7', notes: [{ stringNum: 6, fret: 7 }] },
    ],
  },
];

export interface ExtendedTabColumn extends TabColumn {
  strokeType?: 'down' | 'up' | 'rest' | 'mute';
}

function generateStrumExercise(
  patternId: string,
  progressionId: string,
  repeatsPerChord: number = 2
): TabTrack {
  const pattern = STRUM_PATTERNS.find(p => p.id === patternId) || STRUM_PATTERNS[0];
  const progression = EXERCISE_PROGRESSIONS.find(p => p.id === progressionId) || EXERCISE_PROGRESSIONS[0];

  const columns: ExtendedTabColumn[] = [];
  let colId = 0;

  progression.chords.forEach(chord => {
    for (let r = 0; r < repeatsPerChord; r++) {
      pattern.strokes.forEach((strokeInfo, strokeIdx) => {
        let notes: TabNote[] = [];
        const isFirstBeatOfChord = strokeIdx === 0 && r === 0;

        const strokeSymbol = strokeInfo.stroke === 'down' ? '↓' : strokeInfo.stroke === 'up' ? '↑' : strokeInfo.stroke === 'mute' ? 'x' : '–';
        const displayLabel = isFirstBeatOfChord ? `${chord.name} ${strokeSymbol}` : strokeSymbol;

        if (strokeInfo.stroke === 'down' || strokeInfo.stroke === 'up') {
          notes = chord.notes;
        } else if (strokeInfo.stroke === 'mute') {
          notes = chord.notes.map(n => ({ stringNum: n.stringNum, fret: 0 }));
        }

        columns.push({
          id: `strum-${colId++}`,
          notes: strokeInfo.stroke === 'rest' ? [] : notes,
          chordLabel: displayLabel,
          strokeType: strokeInfo.stroke,
        });
      });
    }
  });

  return {
    id: 'strum-exercise',
    title: `Strum Practice: ${pattern.name}`,
    tempoBpm: 90,
    timeSignature: '4/4',
    columns,
  };
}

// ──────────────────────────────────────────────────────────────
// Exercises Studio Component
// ──────────────────────────────────────────────────────────────
export const ExercisesStudio: React.FC = () => {
  const [selectedExercise, setSelectedExercise] = useState<'spider' | 'strum'>('spider');

  // Exercise 1: Spider state
  const [startFret, setStartFret] = useState<number>(1);
  const [numPositions, setNumPositions] = useState<number>(4);
  const [direction, setDirection] = useState<SpiderDirection>('updown');
  const [pattern, setPattern] = useState<SpiderPattern>('1-2-3-4');

  // Exercise 2: Strumming state
  const [strumPatternId, setStrumPatternId] = useState<string>('alt-8ths');
  const [strumProgressionId, setStrumProgressionId] = useState<string>('pop-c-am-f-g');
  const [repeatsPerChord, setRepeatsPerChord] = useState<number>(2);

  const [bpm, setBpm] = useGlobalBpm();
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeColIndex, setActiveColIndex] = useState<number>(-1);

  const playbackRef = useRef<number>(-1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const track = React.useMemo(
    () => {
      let t: TabTrack;
      if (selectedExercise === 'spider') {
        t = generateSpiderExercise(startFret, numPositions, direction, pattern);
      } else {
        t = generateStrumExercise(strumPatternId, strumProgressionId, repeatsPerChord);
      }
      t.tempoBpm = bpm;
      return t;
    },
    [selectedExercise, startFret, numPositions, direction, pattern, strumPatternId, strumProgressionId, repeatsPerChord, bpm]
  );

  // Playback engine
  useEffect(() => {
    if (isPlaying) {
      playbackRef.current = -1;
      const stepMs = Math.round((60000 / bpm) / 2); // 8th notes

      const tick = () => {
        playbackRef.current += 1;
        if (playbackRef.current >= track.columns.length) {
          // Stop at end (no loop for exercises)
          setIsPlaying(false);
          setActiveColIndex(-1);
          return;
        }

        const idx = playbackRef.current;
        setActiveColIndex(idx);

        const col = track.columns[idx] as ExtendedTabColumn;
        if (col?.notes?.length > 0) {
          const isUpstroke = col.strokeType === 'up';
          col.notes.forEach((note, noteIdx) => {
            const freq = getFrequencyForStringAndFret(note.stringNum, note.fret);
            // Stagger direction: Downstroke strums low-to-high (6->1), Upstroke strums high-to-low (1->6)
            const staggerSec = isUpstroke ? (6 - note.stringNum) * 0.012 : (note.stringNum - 1) * 0.012;
            playPluckedNote(freq, Math.max(0, staggerSec), 1.6, 0.35, note.stringNum, getGuitarPreset());
          });
        }
      };

      tick();
      intervalRef.current = setInterval(tick, stepMs);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setActiveColIndex(-1);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, bpm, track]);

  const handleStop = () => setIsPlaying(false);
  const handlePlay = () => {
    if (isPlaying) return;
    playbackRef.current = -1;
    setIsPlaying(true);
  };
  const handleRestart = () => {
    setIsPlaying(false);
    setTimeout(() => {
      playbackRef.current = -1;
      setIsPlaying(true);
    }, 50);
  };

  const directionOptions: { value: SpiderDirection; label: string; icon: React.ReactNode }[] = [
    { value: 'up', label: 'Ascending', icon: <ChevronUp className="h-4 w-4" /> },
    { value: 'down', label: 'Descending', icon: <ChevronDown className="h-4 w-4" /> },
    { value: 'updown', label: 'Up & Down', icon: <ChevronsUpDown className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Exercise Selection Switcher Header */}
      <div className="p-6 rounded-2xl glass-panel border border-border/40 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-amber-400" />
              <h3 className="text-2xl font-extrabold tracking-tight">Guitar Technical Exercises</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Master finger independence, alternate picking, and rhythm strumming patterns with interactive score playback.
            </p>
          </div>

          {/* 2-Way Prominent Exercise Selection Tabs */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800 shadow-inner">
            <Button
              size="sm"
              variant={selectedExercise === 'spider' ? 'default' : 'ghost'}
              onClick={() => { setIsPlaying(false); setSelectedExercise('spider'); }}
              className={`gap-2 text-xs font-bold transition-all ${selectedExercise === 'spider' ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Sparkles className="h-4 w-4" />
              <span>Exercise 1: Spider Drill (Chromatic)</span>
            </Button>
            <Button
              size="sm"
              variant={selectedExercise === 'strum' ? 'default' : 'ghost'}
              onClick={() => { setIsPlaying(false); setSelectedExercise('strum'); }}
              className={`gap-2 text-xs font-bold transition-all ${selectedExercise === 'strum' ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md font-black' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <ChevronsUpDown className="h-4 w-4" />
              <span>Exercise 2: Up/Down Strum & Pick Practicer</span>
            </Button>
          </div>
        </div>

        {/* ========================================================== */}
        {/* EXERCISE 1: SPIDER DRILL */}
        {/* ========================================================== */}
        {selectedExercise === 'spider' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-lg tracking-tight">Exercise 1: Spider Exercise (Chromatic Finger Independence)</h4>
                <p className="text-xs text-muted-foreground">
                  The classic 1-2-3-4 finger independence drill. Play 4 consecutive chromatic frets per string,
                  shifting across all 6 strings, then move up one fret position and repeat.
                </p>
              </div>
            </div>

            {/* Controls Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* Starting Fret */}
              <div className="p-4 rounded-xl bg-muted/30 border border-border/40 space-y-3">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Starting Fret</label>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[startFret]}
                    onValueChange={(v) => { setIsPlaying(false); setStartFret(v[0]); }}
                    min={1}
                    max={12}
                    step={1}
                    className="flex-1"
                  />
                  <Badge variant="secondary" className="font-mono text-sm min-w-[2rem] justify-center">{startFret}</Badge>
                </div>
              </div>

              {/* Number of Positions */}
              <div className="p-4 rounded-xl bg-muted/30 border border-border/40 space-y-3">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Positions (Shifts)</label>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[numPositions]}
                    onValueChange={(v) => { setIsPlaying(false); setNumPositions(v[0]); }}
                    min={1}
                    max={8}
                    step={1}
                    className="flex-1"
                  />
                  <Badge variant="secondary" className="font-mono text-sm min-w-[2rem] justify-center">{numPositions}</Badge>
                </div>
              </div>

              {/* BPM */}
              <div className="p-4 rounded-xl bg-muted/30 border border-border/40 space-y-3">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tempo (BPM)</label>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[bpm]}
                    onValueChange={(v) => setBpm(v[0])}
                    min={40}
                    max={200}
                    step={5}
                    className="flex-1"
                  />
                  <Badge variant="secondary" className="font-mono text-sm min-w-[3rem] justify-center">{bpm}</Badge>
                </div>
              </div>

              {/* Finger Pattern Permutation */}
              <div className="p-4 rounded-xl bg-muted/30 border border-border/40 space-y-3">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Finger Pattern</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['1-2-3-4', '4-3-2-1', '1-3-2-4', '1-4-2-3'] as SpiderPattern[]).map(pat => (
                    <Button
                      key={pat}
                      size="sm"
                      variant={pattern === pat ? 'default' : 'outline'}
                      onClick={() => { setIsPlaying(false); setPattern(pat); }}
                      className="gap-1 text-[11px] font-mono font-bold h-7"
                    >
                      {pat}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center gap-3 border-t border-border/30 pt-4">
              <Button
                onClick={isPlaying ? handleStop : handlePlay}
                className={`gap-2 font-bold ${isPlaying ? 'bg-red-600 hover:bg-red-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}
              >
                {isPlaying ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isPlaying ? 'Stop' : 'Play Exercise'}
              </Button>

              <Button variant="outline" onClick={handleRestart} className="gap-2 font-bold">
                <RotateCcw className="h-4 w-4" />
                Restart
              </Button>

              <div className="flex items-center gap-2 ml-auto text-xs text-muted-foreground">
                <Music className="h-4 w-4 text-amber-400" />
                <span className="font-mono font-bold">{track.columns.length} notes</span>
                <span>•</span>
                <span className="font-mono">
                  ~{Math.round(track.columns.length * (60000 / bpm / 2) / 1000)}s
                </span>
              </div>
            </div>

            {/* Live Playback Active Note HUD */}
            {activeColIndex >= 0 && track.columns[activeColIndex] && (() => {
              const col = track.columns[activeColIndex];
              const note = col.notes[0];
              const stringNames = ['', '1 (High E)', '2 (B)', '3 (G)', '4 (D)', '5 (A)', '6 (Low E)'];

              return (
                <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-emerald-500/10 border border-amber-500/30 flex items-center justify-between shadow-lg animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black font-mono text-lg shadow-md">
                      {note ? `${note.fret}` : '-'}
                    </div>
                    <div>
                      <div className="font-extrabold text-sm flex items-center gap-2 text-foreground">
                        <span>String {stringNames[note?.stringNum || 1]}</span>
                        <Badge variant="secondary" className="font-mono text-[10px] bg-primary/20 text-primary border-primary/30">
                          Fret {note?.fret}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Step {activeColIndex + 1} of {track.columns.length} &bull; {col.chordLabel || 'Moving in sequence'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">Active Fingering</span>
                    <span className="font-mono font-black text-base text-emerald-400">
                      Finger {note ? `${((note.fret - 1) % 4) + 1}` : '-'}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Fingering Guide */}
            <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 space-y-2">
              <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Fingering Guide</h5>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-mono font-bold text-sm">1</span>
                  <span className="text-muted-foreground">Index finger → Fret {startFret}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-blue-500 text-white flex items-center justify-center font-mono font-bold text-sm">2</span>
                  <span className="text-muted-foreground">Middle finger → Fret {startFret + 1}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-purple-500 text-white flex items-center justify-center font-mono font-bold text-sm">3</span>
                  <span className="text-muted-foreground">Ring finger → Fret {startFret + 2}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-pink-500 text-white flex items-center justify-center font-mono font-bold text-sm">4</span>
                  <span className="text-muted-foreground">Pinky finger → Fret {startFret + 3}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* EXERCISE 2: UP/DOWN STRUM & ALTERNATE PICKING PRACTICER */}
        {/* ========================================================== */}
        {selectedExercise === 'strum' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center shadow-lg">
                <ChevronsUpDown className="h-4 w-4 text-slate-950 font-bold" />
              </div>
              <div>
                <h4 className="font-bold text-lg tracking-tight">Exercise 2: Up/Down Strum & Alternate Picking Practicer</h4>
                <p className="text-xs text-muted-foreground">
                  Select a strumming pattern and progression to practice strict downstrokes (↓), upstrokes (↑), and syncopated rhythmic feels.
                </p>
              </div>
            </div>

            {/* Pattern & Progression Selector Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. Strum Pattern Picker */}
              <div className="p-4 rounded-xl bg-muted/30 border border-border/40 space-y-3">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Select Strumming / Picking Pattern:</label>
                <div className="space-y-2">
                  {STRUM_PATTERNS.map(pat => (
                    <button
                      key={`pat-${pat.id}`}
                      onClick={() => { setIsPlaying(false); setStrumPatternId(pat.id); }}
                      className={`w-full p-3 rounded-xl border text-left transition-all ${
                        strumPatternId === pat.id
                          ? 'border-amber-400 bg-amber-400/10 text-amber-300 font-bold shadow-md ring-1 ring-amber-400/30'
                          : 'border-border/60 hover:bg-muted text-muted-foreground'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span>{pat.name}</span>
                      </div>
                      <p className="text-[11px] opacity-80 mt-1 font-normal">{pat.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Progression & Settings Picker */}
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-muted/30 border border-border/40 space-y-3">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Select Chord Progression / Drill:</label>
                  <div className="space-y-2">
                    {EXERCISE_PROGRESSIONS.map(prog => (
                      <button
                        key={`prog-${prog.id}`}
                        onClick={() => { setIsPlaying(false); setStrumProgressionId(prog.id); }}
                        className={`w-full p-3 rounded-xl border text-left transition-all ${
                          strumProgressionId === prog.id
                            ? 'border-primary bg-primary/15 text-primary font-bold shadow-md ring-1 ring-primary/30'
                            : 'border-border/60 hover:bg-muted text-muted-foreground'
                        }`}
                      >
                        <div className="text-xs font-bold">{prog.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tempo & Repeats Sliders */}
                <div className="p-4 rounded-xl bg-muted/30 border border-border/40 space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tempo (BPM)</label>
                    <div className="flex items-center gap-3">
                      <Slider
                        value={[bpm]}
                        onValueChange={(v) => setBpm(v[0])}
                        min={40}
                        max={200}
                        step={5}
                        className="flex-1"
                      />
                      <Badge variant="secondary" className="font-mono text-sm min-w-[3rem] justify-center">{bpm}</Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Repeats Per Chord</label>
                    <div className="flex items-center gap-3">
                      <Slider
                        value={[repeatsPerChord]}
                        onValueChange={(v) => { setIsPlaying(false); setRepeatsPerChord(v[0]); }}
                        min={1}
                        max={4}
                        step={1}
                        className="flex-1"
                      />
                      <Badge variant="secondary" className="font-mono text-sm min-w-[2rem] justify-center">{repeatsPerChord}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center gap-3 border-t border-border/30 pt-4">
              <Button
                onClick={isPlaying ? handleStop : handlePlay}
                className={`gap-2 font-bold ${isPlaying ? 'bg-red-600 hover:bg-red-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}
              >
                {isPlaying ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isPlaying ? 'Stop Strum Practice' : 'Start Strum Practice'}
              </Button>

              <Button variant="outline" onClick={handleRestart} className="gap-2 font-bold">
                <RotateCcw className="h-4 w-4" />
                Restart
              </Button>

              <div className="flex items-center gap-2 ml-auto text-xs text-muted-foreground">
                <Music className="h-4 w-4 text-amber-400" />
                <span className="font-mono font-bold">{track.columns.length} beats</span>
              </div>
            </div>

            {/* Real-time Pick Direction & Strum HUD */}
            {activeColIndex >= 0 && track.columns[activeColIndex] && (() => {
              const col = track.columns[activeColIndex] as ExtendedTabColumn;
              const stroke = col.strokeType || 'down';
              const strokeName = stroke === 'down' ? 'DOWNSTROKE (↓)' : stroke === 'up' ? 'UPSTROKE (↑)' : stroke === 'mute' ? 'MUTED SCRATCH (x)' : 'REST (–)';
              const strokeColor = stroke === 'down' ? 'bg-amber-400 text-slate-950 border-amber-300' : stroke === 'up' ? 'bg-sky-400 text-slate-950 border-sky-300' : 'bg-emerald-500 text-white border-emerald-400';

              return (
                <div className="p-5 rounded-xl bg-gradient-to-r from-amber-500/15 via-purple-500/15 to-emerald-500/15 border border-amber-400/40 flex items-center justify-between shadow-xl animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black font-mono text-2xl shadow-lg border ${strokeColor}`}>
                      {stroke === 'down' ? '↓' : stroke === 'up' ? '↑' : stroke === 'mute' ? 'x' : '–'}
                    </div>
                    <div>
                      <div className="font-extrabold text-base flex items-center gap-2 text-foreground">
                        <span>{strokeName}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Beat Step {activeColIndex + 1} of {track.columns.length} &bull; Label: {col.chordLabel || 'Strumming'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">Stroke Direction</span>
                    <span className="font-mono font-black text-lg text-amber-300">
                      {stroke.toUpperCase()}
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Tab Score Renderer */}
      <TabRenderer
        track={track}
        activeColumnIndex={activeColIndex}
        className="shadow-2xl"
      />
    </div>
  );
};
