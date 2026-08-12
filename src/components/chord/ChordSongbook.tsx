import React, { useState } from 'react';
import { ChordDefinition } from '../../types/chord';
import { ChordDiagram } from './ChordDiagram';
import { PRESET_CHORDS } from './ChordLibrary';
import { Button } from '../ui/button';
import { Plus, Trash2, Printer, Music, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';

export const ChordSongbook: React.FC = () => {
  const [songTitle, setSongTitle] = useState('Wonderwall');
  const [artist, setArtist] = useState('Oasis');
  const [songChords, setSongChords] = useState<ChordDefinition[]>([
    PRESET_CHORDS[8], // E Minor
    PRESET_CHORDS[6], // G Major
    PRESET_CHORDS[3], // A Major
    PRESET_CHORDS[10], // D Major
  ]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const handleAddChordToSheet = (chord: ChordDefinition) => {
    setSongChords([...songChords, chord]);
    setIsAddDialogOpen(false);
  };

  const handleRemoveChordFromSheet = (index: number) => {
    const updated = [...songChords];
    updated.splice(index, 1);
    setSongChords(updated);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-6 rounded-2xl glass-panel">
        <div className="space-y-1 text-center sm:text-left w-full sm:w-auto">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <Music className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-xl">Chord Sheet / Songbook Maker</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Arrange chord charts into clean printable sheets for guitar practice & performances.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="default" className="gap-1.5 flex-1 sm:flex-none">
                <Plus className="h-4 w-4" />
                Add Chord
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Select Chord to Add to Sheet</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 py-4 max-h-[60vh] overflow-y-auto">
                {PRESET_CHORDS.map(ch => (
                  <div
                    key={`sheet-add-${ch.id}`}
                    onClick={() => handleAddChordToSheet(ch)}
                    className="p-3 rounded-xl border border-border/60 hover:border-primary/60 cursor-pointer flex flex-col items-center justify-between glass-panel transition-all"
                  >
                    <span className="font-bold text-sm">{ch.name}</span>
                    <ChordDiagram chord={ch} options={{ size: 'sm', theme: 'sleek-dark' }} />
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          <Button size="sm" variant="outline" onClick={handlePrint} className="gap-1.5 flex-1 sm:flex-none">
            <Printer className="h-4 w-4" />
            Print Chord Sheet
          </Button>
        </div>
      </div>

      {/* Sheet Content Card */}
      <div className="p-8 rounded-2xl glass-panel space-y-8 bg-card print:bg-white print:text-black">
        {/* Printable Song Info */}
        <div className="border-b border-border/40 pb-4 text-center sm:text-left flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="space-y-1">
            <input
              type="text"
              value={songTitle}
              onChange={e => setSongTitle(e.target.value)}
              className="text-3xl font-extrabold bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none"
              placeholder="Song Title..."
            />
            <div>
              <span className="text-sm text-muted-foreground">Artist: </span>
              <input
                type="text"
                value={artist}
                onChange={e => setArtist(e.target.value)}
                className="text-sm font-semibold bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none"
                placeholder="Artist Name..."
              />
            </div>
          </div>

          <div className="text-xs text-muted-foreground font-mono">
            {songChords.length} Chords in Sheet
          </div>
        </div>

        {/* Chord Diagrams Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {songChords.map((chord, idx) => (
            <div
              key={`sheet-chord-${idx}`}
              className="relative p-4 rounded-xl border border-border/40 flex flex-col items-center justify-center space-y-2 group hover:border-primary/40 transition-all"
            >
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleRemoveChordFromSheet(idx)}
                className="absolute top-1 right-1 h-6 w-6 p-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity print:hidden"
              >
                ✕
              </Button>

              <ChordDiagram
                chord={chord}
                options={{
                  theme: 'vintage-paper', // Printable paper style
                  size: 'sm',
                  showFingerNumbers: true,
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
