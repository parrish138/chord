import React, { useState, useEffect } from 'react';
import { TabTrack, TabColumn } from '../../types/tab';
import { TabRenderer, getMidiNote, getNoteDetailsFromMidi } from './TabRenderer';
import { Button } from '../ui/button';
import { playPluckedNote, getFrequencyForStringAndFret, getGuitarPreset } from '../../utils/audioSynth';
import { detectChordName } from '../../utils/chordDetector';
import { getNoteForStringAndFret } from '../../utils/scaleEngine';
import { Play, Square, Plus, Trash2, Copy, Check, Music, Sliders, Sparkles, Music2, Hash } from 'lucide-react';
import { Slider } from '../ui/slider';

const INITIAL_TRACK: TabTrack = {
  id: 'track-1',
  title: 'Intro Riff / Fingerpicking',
  tempoBpm: 120,
  timeSignature: '4/4',
  columns: [
    { id: 'c1', chordLabel: 'C', notes: [{ stringNum: 5, fret: 3 }, { stringNum: 2, fret: 1 }] },
    { id: 'c2', notes: [{ stringNum: 4, fret: 2 }] },
    { id: 'c3', notes: [{ stringNum: 3, fret: 0 }] },
    { id: 'c4', notes: [{ stringNum: 2, fret: 1 }] },
    { id: 'c5', chordLabel: 'Am', notes: [{ stringNum: 5, fret: 0 }, { stringNum: 2, fret: 1 }] },
    { id: 'c6', notes: [{ stringNum: 4, fret: 2 }] },
    { id: 'c7', notes: [{ stringNum: 3, fret: 2 }] },
    { id: 'c8', notes: [{ stringNum: 2, fret: 1 }] },
    { id: 'c9', chordLabel: 'G', notes: [{ stringNum: 6, fret: 3 }, { stringNum: 1, fret: 3 }] },
    { id: 'c10', notes: [{ stringNum: 4, fret: 0 }] },
    { id: 'c11', notes: [{ stringNum: 3, fret: 0 }] },
    { id: 'c12', notes: [{ stringNum: 2, fret: 0 }] },
  ],
};

export const TabEditor: React.FC = () => {
  const [track, setTrack] = useState<TabTrack>(INITIAL_TRACK);
  const [selectedColumnIndex, setSelectedColumnIndex] = useState<number>(0);
  const [selectedFret, setSelectedFret] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activePlaybackIndex, setActivePlaybackIndex] = useState<number>(-1);
  const [copiedAscii, setCopiedAscii] = useState<boolean>(false);
  const playbackRef = React.useRef<number>(-1);
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  // Start / stop playback
  useEffect(() => {
    if (isPlaying) {
      playbackRef.current = -1; // reset to start

      const stepMs = Math.round((60000 / track.tempoBpm) / 2); // 8th note duration

      const tick = () => {
        playbackRef.current += 1;
        if (playbackRef.current >= track.columns.length) {
          playbackRef.current = 0;
        }

        const idx = playbackRef.current;
        setActivePlaybackIndex(idx);

        // Play notes in current column with realistic acoustic string stagger
        const col = track.columns[idx];
        if (col && col.notes && col.notes.length > 0) {
          col.notes.forEach((note, noteIdx) => {
            const freq = getFrequencyForStringAndFret(note.stringNum, note.fret);
            playPluckedNote(freq, noteIdx * 0.015, 1.8, 0.35, note.stringNum, getGuitarPreset());
          });
        }
      };

      // Play the first beat immediately
      tick();

      // Then schedule the rest on an interval
      intervalRef.current = setInterval(tick, stepMs);
    } else {
      // Stop
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setActivePlaybackIndex(-1);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, track.tempoBpm, track.columns]);

  // Click on string cell in renderer to set or remove fret
  const handleNoteClick = (colIdx: number, stringNum: number) => {
    setSelectedColumnIndex(colIdx);
    const updatedCols = [...track.columns];
    const targetCol = { ...updatedCols[colIdx], notes: [...updatedCols[colIdx].notes] };

    const existingNoteIdx = targetCol.notes.findIndex(n => n.stringNum === stringNum);

    if (existingNoteIdx >= 0) {
      if (targetCol.notes[existingNoteIdx].fret === selectedFret) {
        // Toggle OFF if clicking string with same fret
        targetCol.notes.splice(existingNoteIdx, 1);
      } else {
        // Update fret to selectedFret
        targetCol.notes[existingNoteIdx] = { stringNum, fret: selectedFret };
        const freq = getFrequencyForStringAndFret(stringNum, selectedFret);
        playPluckedNote(freq, 0, 1.5, 0.4, stringNum, getGuitarPreset());
      }
    } else {
      // Add note with selected fret
      targetCol.notes.push({ stringNum: stringNum, fret: selectedFret });
      const freq = getFrequencyForStringAndFret(stringNum, selectedFret);
      playPluckedNote(freq, 0, 1.5, 0.4, stringNum, getGuitarPreset());
    }

    // Dynamic Auto-Detection of Chord Label & Standard Notation Hints
    if (targetCol.notes.length > 0) {
      const positions = targetCol.notes.map(n => ({ string: n.stringNum, fret: n.fret }));
      const detection = detectChordName(positions, [], [], []);
      if (targetCol.notes.length >= 2 && detection.primaryName && !detection.primaryName.includes('Muted')) {
        targetCol.chordLabel = detection.primaryName;
      } else {
        const singleNote = getNoteForStringAndFret(targetCol.notes[0].stringNum, targetCol.notes[0].fret);
        targetCol.chordLabel = singleNote.noteName;
      }
    } else {
      targetCol.chordLabel = undefined;
    }

    updatedCols[colIdx] = targetCol;
    setTrack({ ...track, columns: updatedCols });
  };

  const handleAddColumn = () => {
    const newCol: TabColumn = {
      id: `c-${Date.now()}`,
      notes: [],
    };
    setTrack({ ...track, columns: [...track.columns, newCol] });
    setSelectedColumnIndex(track.columns.length);
  };

  const handleRemoveColumn = () => {
    if (track.columns.length <= 1) return;
    const updated = [...track.columns];
    updated.splice(selectedColumnIndex, 1);
    setTrack({ ...track, columns: updated });
    setSelectedColumnIndex(Math.max(0, selectedColumnIndex - 1));
  };

  // Convert Tab track into ASCII text string
  const generateAsciiTab = (): string => {
    const stringNames = ['e', 'B', 'G', 'D', 'A', 'E'];
    const lines: string[] = stringNames.map(name => `${name}|`);

    track.columns.forEach((col, colIdx) => {
      // Add measure divider every 4 columns
      if (colIdx > 0 && colIdx % 4 === 0) {
        for (let i = 0; i < 6; i++) lines[i] += '|';
      }

      for (let s = 1; s <= 6; s++) {
        const lineIdx = s - 1;
        const noteObj = col.notes.find(n => n.stringNum === s);
        if (noteObj) {
          const fretStr = `${noteObj.fret}`;
          lines[lineIdx] += `-${fretStr.padStart(2, '-')}-`;
        } else {
          lines[lineIdx] += '----';
        }
      }
    });

    for (let i = 0; i < 6; i++) lines[i] += '|';
    return lines.join('\n');
  };

  const handleCopyAscii = () => {
    navigator.clipboard.writeText(generateAsciiTab());
    setCopiedAscii(true);
    setTimeout(() => setCopiedAscii(false), 2000);
  };

  const activeInspectCol = track.columns[selectedColumnIndex] || track.columns[0];

  return (
    <div className="space-y-6">
      {/* Top Toolbar */}
      <div className="p-4 sm:p-6 rounded-2xl glass-panel space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-border/40 pb-4">
          <div className="space-y-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <Music className="h-5 w-5 text-primary" />
              <h3 className="font-extrabold text-xl tracking-tight">Interactive Tablature Studio & Player</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Click string lines to add fret numbers (0 to 24), play back sequence audio, and view dynamic standard notation hints.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={isPlaying ? 'destructive' : 'default'}
              onClick={() => setIsPlaying(!isPlaying)}
              className="gap-2 font-bold"
            >
              {isPlaying ? <Square className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
              {isPlaying ? 'Stop Playback' : 'Play TAB Sequence'}
            </Button>
          </div>
        </div>

        {/* Editing Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* Fret Input Selector (Supports Frets 0 to 24) */}
          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
              <span>Active Fret Number to Insert (Range 0 - 24):</span>
              <span className="font-mono text-purple-400 font-bold">Selected Fret: #{selectedFret}</span>
            </div>

            <div className="flex overflow-x-auto scrollbar-none items-center gap-1.5 pb-1 sm:pb-0">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 17, 19, 21, 24].map(fret => (
                <Button
                  key={`fret-picker-${fret}`}
                  size="sm"
                  variant={selectedFret === fret ? 'default' : 'outline'}
                  onClick={() => setSelectedFret(fret)}
                  className="font-bold h-8 px-2 min-w-[2.1rem] text-xs shrink-0"
                >
                  {fret}
                </Button>
              ))}

              {/* Direct Numeric Fret Input Stepper (0 to 24) */}
              <div className="flex items-center gap-1 ml-2 bg-muted/40 p-1 rounded-lg border border-border/40 shrink-0">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-xs"
                  onClick={() => setSelectedFret(prev => Math.max(0, prev - 1))}
                >
                  -
                </Button>
                <input
                  type="number"
                  min={0}
                  max={24}
                  value={selectedFret}
                  onChange={e => setSelectedFret(Math.min(24, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="w-10 h-6 text-center font-mono font-bold text-xs bg-background border border-border/60 rounded"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-xs"
                  onClick={() => setSelectedFret(prev => Math.min(24, prev + 1))}
                >
                  +
                </Button>
              </div>
            </div>
          </div>

          {/* Tempo Controls & Beat Operations */}
          <div className="space-y-4 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                <span>Tempo (BPM)</span>
                <span>{track.tempoBpm} BPM</span>
              </div>
              <Slider
                value={[track.tempoBpm]}
                min={60}
                max={200}
                step={5}
                onValueChange={([val]) => setTrack({ ...track, tempoBpm: val })}
              />
            </div>

            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleAddColumn} className="gap-1 flex-1 text-xs font-bold">
                <Plus className="h-3.5 w-3.5" />
                Add Beat
              </Button>
              <Button size="sm" variant="destructive" onClick={handleRemoveColumn} className="gap-1 flex-1 text-xs font-bold">
                <Trash2 className="h-3.5 w-3.5" />
                Delete Beat
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Visual TAB Renderer Component */}
      <TabRenderer
        track={track}
        activeColumnIndex={activePlaybackIndex >= 0 ? activePlaybackIndex : selectedColumnIndex}
        onNoteClick={handleNoteClick}
      />

      {/* Dynamic Standard Notation Hints & Pitch Inspector */}
      {activeInspectCol && (
        <div className="p-5 rounded-2xl glass-panel border border-border/40 space-y-3">
          <div className="flex items-center justify-between border-b border-border/40 pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <h4 className="font-bold text-sm">
                Selected Beat #{selectedColumnIndex + 1} &bull; Standard Notation & Pitch Inspector
              </h4>
            </div>
            {activeInspectCol.chordLabel && (
              <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30">
                {activeInspectCol.chordLabel}
              </span>
            )}
          </div>

          {activeInspectCol.notes.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No notes in this beat column yet. Click string lines on the staff above to insert fret numbers!</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {activeInspectCol.notes.map((nObj, nIdx) => {
                const midi = getMidiNote(nObj.stringNum, nObj.fret);
                const details = getNoteDetailsFromMidi(midi);
                const freq = getFrequencyForStringAndFret(nObj.stringNum, nObj.fret);

                return (
                  <div
                    key={`inspect-note-${nIdx}`}
                    className="p-3 rounded-xl border border-border/40 bg-muted/30 space-y-1 text-xs font-mono"
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-primary text-sm">{details.noteNameWithOctave}</span>
                      <span className="text-muted-foreground text-[11px]">String {nObj.stringNum} &bull; Fret {nObj.fret}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>Frequency:</span>
                      <span className="font-bold text-foreground">{freq.toFixed(1)} Hz</span>
                    </div>

                    <div className="text-[10px] text-purple-400 font-sans">
                      {details.totalDiatonicStep === 6 ? 'Middle line B4 (Treble Clef)' : details.totalDiatonicStep > 10 ? `${Math.floor((details.totalDiatonicStep - 10)/2) || 1} Ledger lines above staff` : details.totalDiatonicStep < 2 ? `${Math.floor((2 - details.totalDiatonicStep)/2) || 1} Ledger lines below staff` : 'Standard 5-Line Treble Staff'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ASCII Export Box */}
      <div className="p-6 rounded-2xl glass-panel space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-primary" />
            <h4 className="font-semibold text-sm">Plain Text ASCII TAB Output</h4>
          </div>
          <Button size="sm" variant="secondary" onClick={handleCopyAscii} className="gap-1.5 text-xs">
            {copiedAscii ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            {copiedAscii ? 'Copied ASCII!' : 'Copy ASCII Tab'}
          </Button>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto border border-border/40">
          <pre>{generateAsciiTab()}</pre>
        </div>
      </div>
    </div>
  );
};
