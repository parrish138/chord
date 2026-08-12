import React, { useState, useEffect } from 'react';
import { TabTrack, TabColumn } from '../../types/tab';
import { TabRenderer } from './TabRenderer';
import { Button } from '../ui/button';
import { playPluckedNote, getFrequencyForStringAndFret, getGuitarPreset } from '../../utils/audioSynth';
import { Play, Square, Plus, Trash2, Copy, Check, Music, Sliders } from 'lucide-react';
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
    const targetCol = { ...updatedCols[colIdx] };

    const existingNoteIdx = targetCol.notes.findIndex(n => n.stringNum === stringNum);

    if (existingNoteIdx >= 0) {
      // Remove note
      targetCol.notes.splice(existingNoteIdx, 1);
    } else {
      // Add note with selected fret
      targetCol.notes.push({ stringNum: stringNum, fret: selectedFret });
      // Play audio sample honoring active tone preset
      const freq = getFrequencyForStringAndFret(stringNum, selectedFret);
      playPluckedNote(freq, 0, 1.5, 0.4, stringNum, getGuitarPreset());
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

  return (
    <div className="space-y-6">
      {/* Top Toolbar */}
      <div className="p-6 rounded-2xl glass-panel space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-border/40 pb-4">
          <div className="space-y-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <Music className="h-5 w-5 text-primary" />
              <h3 className="font-extrabold text-xl tracking-tight">Interactive Tablature Studio & Player</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Click string lines to add fret numbers, play back sequence audio, and export ASCII tabs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={isPlaying ? 'destructive' : 'default'}
              onClick={() => setIsPlaying(!isPlaying)}
              className="gap-2"
            >
              {isPlaying ? <Square className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
              {isPlaying ? 'Stop Playback' : 'Play TAB Sequence'}
            </Button>
          </div>
        </div>

        {/* Editing Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Fret Input Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">Active Fret Number to Insert</label>
            <div className="flex flex-wrap gap-1.5">
              {[0, 1, 2, 3, 4, 5, 7, 8, 10, 12].map(fret => (
                <Button
                  key={`fret-picker-${fret}`}
                  size="sm"
                  variant={selectedFret === fret ? 'default' : 'outline'}
                  onClick={() => setSelectedFret(fret)}
                  className="font-bold h-8 min-w-[2.2rem] text-xs"
                >
                  {fret}
                </Button>
              ))}
            </div>
          </div>

          {/* Tempo Controls */}
          <div className="space-y-2">
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

          {/* Column Operations */}
          <div className="space-y-2 flex flex-col justify-end">
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleAddColumn} className="gap-1 flex-1 text-xs">
                <Plus className="h-3.5 w-3.5" />
                Add Beat
              </Button>
              <Button size="sm" variant="destructive" onClick={handleRemoveColumn} className="gap-1 flex-1 text-xs">
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
