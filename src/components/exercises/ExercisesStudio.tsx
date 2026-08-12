import React, { useState, useEffect, useRef } from 'react';
import { TabTrack, TabColumn, TabNote } from '../../types/tab';
import { TabRenderer } from '../tab/TabRenderer';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { playPluckedNote, getFrequencyForStringAndFret, getGuitarPreset } from '../../utils/audioSynth';
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

function generateSpiderExercise(
  startFret: number,
  numPositions: number,
  direction: SpiderDirection
): TabTrack {
  const columns: TabColumn[] = [];
  let colId = 0;

  const makeCol = (stringNum: number, fret: number, label?: string): TabColumn => ({
    id: `spider-${colId++}`,
    notes: [{ stringNum, fret }],
    chordLabel: label,
  });

  for (let pos = 0; pos < numPositions; pos++) {
    const baseFret = startFret + pos;
    if (baseFret + 3 > 24) break; // Don't exceed 24 frets

    // Label the start of each position
    const posLabel = `Pos ${baseFret}`;

    if (direction === 'up' || direction === 'updown') {
      // Ascending: String 6 → 1, frets baseFret to baseFret+3
      for (let s = 6; s >= 1; s--) {
        for (let f = 0; f < 4; f++) {
          columns.push(makeCol(s, baseFret + f, s === 6 && f === 0 ? posLabel : undefined));
        }
      }
    }

    if (direction === 'down' || direction === 'updown') {
      // Descending: String 1 → 6, frets baseFret+3 to baseFret
      for (let s = 1; s <= 6; s++) {
        for (let f = 3; f >= 0; f--) {
          const label = direction === 'down' && s === 1 && f === 3 ? posLabel : undefined;
          columns.push(makeCol(s, baseFret + f, label));
        }
      }
    }
  }

  return {
    id: 'spider-exercise',
    title: `Spider Exercise — Chromatic (Fret ${startFret})`,
    tempoBpm: 80,
    timeSignature: '4/4',
    columns,
  };
}

// ──────────────────────────────────────────────────────────────
// Exercises Studio Component
// ──────────────────────────────────────────────────────────────
export const ExercisesStudio: React.FC = () => {
  const [startFret, setStartFret] = useState<number>(1);
  const [numPositions, setNumPositions] = useState<number>(4);
  const [direction, setDirection] = useState<SpiderDirection>('updown');
  const [bpm, setBpm] = useState<number>(80);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeColIndex, setActiveColIndex] = useState<number>(-1);

  const playbackRef = useRef<number>(-1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const track = React.useMemo(
    () => {
      const t = generateSpiderExercise(startFret, numPositions, direction);
      t.tempoBpm = bpm;
      return t;
    },
    [startFret, numPositions, direction, bpm]
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

        const col = track.columns[idx];
        if (col?.notes?.length > 0) {
          col.notes.forEach((note, noteIdx) => {
            const freq = getFrequencyForStringAndFret(note.stringNum, note.fret);
            playPluckedNote(freq, noteIdx * 0.01, 1.6, 0.35, note.stringNum, getGuitarPreset());
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
      {/* Header */}
      <div className="p-6 rounded-2xl glass-panel border border-border/40 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-amber-400" />
              <h3 className="text-2xl font-extrabold tracking-tight">Guitar Exercises</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Practice fundamental technique exercises with interactive tablature playback.
            </p>
          </div>
        </div>

        {/* Exercise 1: Spider */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-lg tracking-tight">Exercise 1: Spider Exercise (Chromatic)</h4>
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

            {/* Direction */}
            <div className="p-4 rounded-xl bg-muted/30 border border-border/40 space-y-3">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Direction</label>
              <div className="flex gap-1.5">
                {directionOptions.map(opt => (
                  <Button
                    key={opt.value}
                    size="sm"
                    variant={direction === opt.value ? 'default' : 'outline'}
                    onClick={() => { setIsPlaying(false); setDirection(opt.value); }}
                    className="flex-1 gap-1 text-[11px] font-bold"
                  >
                    {opt.icon}
                    {opt.label}
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
              <Music className="h-4 w-4" />
              <span className="font-mono font-bold">{track.columns.length} notes</span>
              <span>•</span>
              <span className="font-mono">
                ~{Math.round(track.columns.length * (60000 / bpm / 2) / 1000)}s
              </span>
            </div>
          </div>

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
