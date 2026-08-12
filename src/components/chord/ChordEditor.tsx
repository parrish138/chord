import React, { useState, useEffect } from 'react';
import { ChordDefinition, FingerPosition, FingerNumber, DiagramTheme, BarreChord } from '../../types/chord';
import { ChordDiagram } from './ChordDiagram';
import { detectChordName } from '../../utils/chordDetector';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { AudioStrummer } from './AudioStrummer';
import { ChordTheoryCard } from './ChordTheoryCard';
import { Trash2, Plus, Sparkles, Layers, Sliders } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';

export interface ChordEditorProps {
  initialChord?: ChordDefinition;
  onSaveChord?: (chord: ChordDefinition) => void;
}

const DEFAULT_CHORD: ChordDefinition = {
  id: 'custom-1',
  name: 'C Major',
  key: 'C',
  suffix: 'maj',
  baseFret: 1,
  positions: [
    { string: 2, fret: 1, finger: '1' },
    { string: 4, fret: 2, finger: '2' },
    { string: 5, fret: 3, finger: '3' },
  ],
  mutedStrings: [6],
  openStrings: [1, 3],
  barres: [],
};

export const ChordEditor: React.FC<ChordEditorProps> = ({ initialChord, onSaveChord }) => {
  const [chord, setChord] = useState<ChordDefinition>(initialChord || DEFAULT_CHORD);
  const [activeFinger, setActiveFinger] = useState<FingerNumber>('1');
  const [selectedTheme, setSelectedTheme] = useState<DiagramTheme>('sleek-dark');
  const [detected, setDetected] = useState<{ primaryName: string; alternativeNames: string[]; detectedNotes: string[] }>({
    primaryName: chord.name,
    alternativeNames: [],
    detectedNotes: [],
  });

  // Barre state controls
  const [barreFret, setBarreFret] = useState<number>(1);
  const [barreStart, setBarreStart] = useState<number>(1);
  const [barreEnd, setBarreEnd] = useState<number>(6);
  const [barreFinger, setBarreFinger] = useState<FingerNumber>('1');
  const [isBarreDialogOpen, setIsBarreDialogOpen] = useState<boolean>(false);

  // Update chord detection whenever positions/barres/mutes change
  useEffect(() => {
    const det = detectChordName(chord.positions, chord.barres, chord.mutedStrings, chord.openStrings);
    setDetected(det);
  }, [chord.positions, chord.barres, chord.mutedStrings, chord.openStrings]);

  // Handle clicking on the interactive fret grid
  const handleFretClick = (stringNum: number, fret: number) => {
    const existingIndex = chord.positions.findIndex(p => p.string === stringNum && p.fret === fret);

    let updatedPositions = [...chord.positions];

    if (existingIndex >= 0) {
      // Remove position if clicked again
      updatedPositions.splice(existingIndex, 1);
    } else {
      // Filter out any existing finger on the same string
      updatedPositions = updatedPositions.filter(p => p.string !== stringNum);
      // Add new finger position
      updatedPositions.push({
        string: stringNum,
        fret: fret,
        finger: activeFinger,
      });
    }

    // Remove string from muted or open if a finger position is set
    const updatedMuted = (chord.mutedStrings || []).filter(s => s !== stringNum);
    const updatedOpen = (chord.openStrings || []).filter(s => s !== stringNum);

    setChord({
      ...chord,
      positions: updatedPositions,
      mutedStrings: updatedMuted,
      openStrings: updatedOpen,
    });
  };

  // Toggle Muted / Open string status at top header
  const handleHeaderClick = (stringNum: number) => {
    const isMuted = chord.mutedStrings?.includes(stringNum);
    let updatedMuted = [...(chord.mutedStrings || [])];

    if (isMuted) {
      // Unmute string
      updatedMuted = updatedMuted.filter(s => s !== stringNum);
    } else {
      // Mute string & remove finger on that string
      updatedMuted.push(stringNum);
    }

    const updatedPositions = chord.positions.filter(p => p.string !== stringNum);

    setChord({
      ...chord,
      mutedStrings: updatedMuted,
      positions: updatedPositions,
    });
  };

  const handleAddBarre = () => {
    const newBarre: BarreChord = {
      fret: barreFret,
      startString: Math.min(barreStart, barreEnd),
      endString: Math.max(barreStart, barreEnd),
      finger: barreFinger,
    };

    setChord({
      ...chord,
      barres: [...(chord.barres || []), newBarre],
    });

    setIsBarreDialogOpen(false);
  };

  const handleRemoveBarre = (index: number) => {
    const updated = [...(chord.barres || [])];
    updated.splice(index, 1);
    setChord({ ...chord, barres: updated });
  };

  const handleClear = () => {
    setChord({
      ...chord,
      positions: [],
      barres: [],
      mutedStrings: [],
      openStrings: [1, 2, 3, 4, 5, 6],
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Visual Diagram Preview */}
      <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 rounded-2xl glass-panel space-y-6">
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2">
            <h3 className="text-2xl font-bold tracking-tight">{chord.name || 'Untitled Chord'}</h3>
            <Badge variant="purple" className="gap-1">
              <Sparkles className="h-3 w-3" />
              {detected.primaryName}
            </Badge>
          </div>
          {detected.detectedNotes.length > 0 && (
            <p className="text-xs text-muted-foreground font-mono">
              Notes: {detected.detectedNotes.join(' - ')}
            </p>
          )}
        </div>

        {/* Interactive SVG Diagram */}
        <ChordDiagram
          chord={chord}
          options={{
            theme: selectedTheme,
            showFingerNumbers: true,
            showStringNames: true,
            showFretNumbers: true,
            size: 'lg',
            interactive: true,
          }}
          onFretClick={handleFretClick}
          onHeaderClick={handleHeaderClick}
        />

        <p className="text-xs text-muted-foreground text-center">
          💡 Click on the fretboard to add/remove finger dots. Click header (top) to toggle Mute (✕).
        </p>

        {/* Real-time Audio Preview */}
        <AudioStrummer chord={chord} className="w-full" />

        {/* Live Theory & Notes Breakdown */}
        <ChordTheoryCard chord={chord} className="w-full" />
      </div>

      {/* Right Column: Interactive Editor Controls */}
      <div className="lg:col-span-7 space-y-6">
        {/* Chord Properties Card */}
        <div className="p-6 rounded-2xl glass-panel space-y-5">
          <div className="flex items-center justify-between border-b border-border/40 pb-4">
            <div className="flex items-center gap-2">
              <Sliders className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">Chord Parameters</h3>
            </div>

            <Button size="sm" variant="destructive" onClick={handleClear} className="gap-1.5">
              <Trash2 className="h-4 w-4" />
              Reset Fretboard
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Chord Name Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Chord Name</label>
              <input
                type="text"
                value={chord.name}
                onChange={e => setChord({ ...chord, name: e.target.value })}
                className="w-full px-3 py-2 rounded-md border border-input bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g. Cmaj7"
              />
            </div>

            {/* Base Fret Position */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Base Fret Position</label>
              <Select
                value={`${chord.baseFret || 1}`}
                onValueChange={val => setChord({ ...chord, baseFret: parseInt(val, 10) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Fret" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 15 }).map((_, i) => (
                    <SelectItem key={`fret-select-${i + 1}`} value={`${i + 1}`}>
                      Fret {i + 1} {i === 0 ? '(Open / Nut)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Finger Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">Finger Marker to Place</label>
            <div className="flex flex-wrap gap-2">
              {(['1', '2', '3', '4', 'T', ''] as FingerNumber[]).map(finger => (
                <Button
                  key={`finger-btn-${finger || 'blank'}`}
                  size="sm"
                  variant={activeFinger === finger ? 'default' : 'outline'}
                  onClick={() => setActiveFinger(finger)}
                  className="font-bold min-w-[2.5rem]"
                >
                  {finger === 'T' ? 'Thumb (T)' : finger === '' ? 'Dot' : `Finger ${finger}`}
                </Button>
              ))}
            </div>
          </div>

          {/* Color Theme Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">Visual Theme Style</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(['sleek-dark', 'classic-wood', 'neon-cyber', 'vintage-paper', 'minimal-light'] as DiagramTheme[]).map(th => (
                <button
                  key={`theme-btn-${th}`}
                  onClick={() => setSelectedTheme(th)}
                  className={`p-2.5 rounded-lg border text-xs font-medium capitalize transition-all ${
                    selectedTheme === th
                      ? 'border-primary bg-primary/10 text-primary font-bold ring-2 ring-primary/20'
                      : 'border-border/60 hover:bg-muted text-muted-foreground'
                  }`}
                >
                  {th.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Barre Chord Manager */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                <label className="text-sm font-semibold">Barre Chords</label>
              </div>

              <Dialog open={isBarreDialogOpen} onOpenChange={setIsBarreDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                    <Plus className="h-3.5 w-3.5" />
                    Add Barre
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Barre Chord Bar</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold">Fret Number</label>
                      <input
                        type="number"
                        min="1"
                        max="24"
                        value={barreFret}
                        onChange={e => setBarreFret(parseInt(e.target.value, 10))}
                        className="w-full px-3 py-2 rounded-md border border-input text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold">Start String (1=High E, 6=Low E)</label>
                        <input
                          type="number"
                          min="1"
                          max="6"
                          value={barreStart}
                          onChange={e => setBarreStart(parseInt(e.target.value, 10))}
                          className="w-full px-3 py-2 rounded-md border border-input text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold">End String</label>
                        <input
                          type="number"
                          min="1"
                          max="6"
                          value={barreEnd}
                          onChange={e => setBarreEnd(parseInt(e.target.value, 10))}
                          className="w-full px-3 py-2 rounded-md border border-input text-sm"
                        />
                      </div>
                    </div>
                    <Button onClick={handleAddBarre} className="w-full">
                      Confirm Barre Bar
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {chord.barres && chord.barres.length > 0 ? (
              <div className="space-y-2">
                {chord.barres.map((b, idx) => (
                  <div
                    key={`barre-item-${idx}`}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-muted/60 text-xs font-mono border"
                  >
                    <span>
                      Fret {b.fret} across strings {b.startString} to {b.endString}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveBarre(idx)}
                      className="h-7 w-7 p-0 text-destructive"
                    >
                      ✕
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">No barre bars added yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
