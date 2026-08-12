import React, { useState } from 'react';
import { ChordDefinition } from '../../types/chord';
import { ChordDiagram } from './ChordDiagram';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Search, Play, Edit3, Filter, Volume2, Info } from 'lucide-react';
import { strumChord } from '../../utils/audioSynth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { ChordTheoryCard } from './ChordTheoryCard';

export const PRESET_CHORDS: ChordDefinition[] = [
  // --- Major Chords ---
  {
    id: 'c-major', name: 'C Major', key: 'C', suffix: '', baseFret: 1,
    positions: [{ string: 5, fret: 3, isRoot: true, finger: '3' }, { string: 4, fret: 2, finger: '2' }, { string: 2, fret: 1, finger: '1' }],
    mutedStrings: [6], openStrings: [1, 3],
  },
  {
    id: 'a-major', name: 'A Major', key: 'A', suffix: '', baseFret: 1,
    positions: [{ string: 5, fret: 0, isRoot: true }, { string: 4, fret: 2, finger: '1' }, { string: 3, fret: 2, finger: '2' }, { string: 2, fret: 2, finger: '3' }],
    mutedStrings: [6], openStrings: [1],
  },
  {
    id: 'g-major', name: 'G Major', key: 'G', suffix: '', baseFret: 1,
    positions: [{ string: 6, fret: 3, isRoot: true, finger: '3' }, { string: 5, fret: 2, finger: '2' }, { string: 1, fret: 3, finger: '4' }],
    openStrings: [2, 3, 4],
  },
  {
    id: 'e-major', name: 'E Major', key: 'E', suffix: '', baseFret: 1,
    positions: [{ string: 6, fret: 0, isRoot: true }, { string: 5, fret: 2, finger: '2' }, { string: 4, fret: 2, finger: '3' }, { string: 3, fret: 1, finger: '1' }],
    openStrings: [1, 2],
  },
  {
    id: 'd-major', name: 'D Major', key: 'D', suffix: '', baseFret: 1,
    positions: [{ string: 4, fret: 0, isRoot: true }, { string: 3, fret: 2, finger: '1' }, { string: 2, fret: 3, finger: '3' }, { string: 1, fret: 2, finger: '2' }],
    mutedStrings: [5, 6],
  },
  {
    id: 'f-major-barre', name: 'F Major (Barre)', key: 'F', suffix: '', baseFret: 1,
    positions: [{ string: 6, fret: 1, isRoot: true }, { string: 5, fret: 3, finger: '3' }, { string: 4, fret: 3, finger: '4' }, { string: 3, fret: 2, finger: '2' }],
    barres: [{ fret: 1, startString: 1, endString: 6, finger: '1' }],
  },
  {
    id: 'b-major-barre', name: 'B Major (Barre)', key: 'B', suffix: '', baseFret: 2,
    positions: [{ string: 5, fret: 2, isRoot: true }, { string: 4, fret: 4, finger: '2' }, { string: 3, fret: 4, finger: '3' }, { string: 2, fret: 4, finger: '4' }],
    barres: [{ fret: 2, startString: 1, endString: 5, finger: '1' }],
    mutedStrings: [6],
  },

  // --- Minor Chords ---
  {
    id: 'a-minor', name: 'A Minor', key: 'A', suffix: 'm', baseFret: 1,
    positions: [{ string: 5, fret: 0, isRoot: true }, { string: 4, fret: 2, finger: '2' }, { string: 3, fret: 2, finger: '3' }, { string: 2, fret: 1, finger: '1' }],
    mutedStrings: [6], openStrings: [1],
  },
  {
    id: 'e-minor', name: 'E Minor', key: 'E', suffix: 'm', baseFret: 1,
    positions: [{ string: 6, fret: 0, isRoot: true }, { string: 5, fret: 2, finger: '2' }, { string: 4, fret: 2, finger: '3' }],
    openStrings: [1, 2, 3],
  },
  {
    id: 'd-minor', name: 'D Minor', key: 'D', suffix: 'm', baseFret: 1,
    positions: [{ string: 4, fret: 0, isRoot: true }, { string: 3, fret: 2, finger: '2' }, { string: 2, fret: 3, finger: '3' }, { string: 1, fret: 1, finger: '1' }],
    mutedStrings: [5, 6],
  },
  {
    id: 'b-minor-barre', name: 'B Minor (Barre)', key: 'B', suffix: 'm', baseFret: 2,
    positions: [{ string: 5, fret: 2, isRoot: true }, { string: 4, fret: 4, finger: '3' }, { string: 3, fret: 4, finger: '4' }, { string: 2, fret: 3, finger: '2' }],
    barres: [{ fret: 2, startString: 1, endString: 5, finger: '1' }],
    mutedStrings: [6],
  },
  {
    id: 'f-sharp-minor-barre', name: 'F# Minor (Barre)', key: 'F#', suffix: 'm', baseFret: 2,
    positions: [{ string: 6, fret: 2, isRoot: true }, { string: 5, fret: 4, finger: '3' }, { string: 4, fret: 4, finger: '4' }],
    barres: [{ fret: 2, startString: 1, endString: 6, finger: '1' }],
  },

  // --- 7th & Extension Chords ---
  {
    id: 'c7-dom', name: 'C7', key: 'C', suffix: '7', baseFret: 1,
    positions: [{ string: 5, fret: 3, isRoot: true, finger: '3' }, { string: 4, fret: 2, finger: '2' }, { string: 3, fret: 3, finger: '4' }, { string: 2, fret: 1, finger: '1' }],
    mutedStrings: [6], openStrings: [1],
  },
  {
    id: 'g7-dom', name: 'G7', key: 'G', suffix: '7', baseFret: 1,
    positions: [{ string: 6, fret: 3, isRoot: true, finger: '3' }, { string: 5, fret: 2, finger: '2' }, { string: 1, fret: 1, finger: '1' }],
    openStrings: [2, 3, 4],
  },
  {
    id: 'c-maj7', name: 'Cmaj7', key: 'C', suffix: 'maj7', baseFret: 1,
    positions: [{ string: 5, fret: 3, isRoot: true, finger: '3' }, { string: 4, fret: 2, finger: '2' }],
    mutedStrings: [6], openStrings: [1, 2, 3],
  },
  {
    id: 'a-minor-7', name: 'Am7', key: 'A', suffix: 'm7', baseFret: 1,
    positions: [{ string: 5, fret: 0, isRoot: true }, { string: 4, fret: 2, finger: '2' }, { string: 2, fret: 1, finger: '1' }],
    mutedStrings: [6], openStrings: [1, 3],
  },
  {
    id: 'd-sus4', name: 'Dsus4', key: 'D', suffix: 'sus4', baseFret: 1,
    positions: [{ string: 4, fret: 0, isRoot: true }, { string: 3, fret: 2, finger: '1' }, { string: 2, fret: 3, finger: '2' }, { string: 1, fret: 3, finger: '3' }],
    mutedStrings: [5, 6],
  },
  {
    id: 'c-add9', name: 'Cadd9', key: 'C', suffix: 'add9', baseFret: 1,
    positions: [{ string: 5, fret: 3, isRoot: true, finger: '2' }, { string: 4, fret: 2, finger: '1' }, { string: 2, fret: 3, finger: '3' }, { string: 1, fret: 3, finger: '4' }],
    mutedStrings: [6], openStrings: [3],
  },
];

export interface ChordLibraryProps {
  onSelectChord?: (chord: ChordDefinition) => void;
}

export const ChordLibrary: React.FC<ChordLibraryProps> = ({ onSelectChord }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [selectedSuffix, setSelectedSuffix] = useState<string | null>(null);
  const [selectedTheoryChord, setSelectedTheoryChord] = useState<ChordDefinition | null>(null);

  const keys = ['C', 'D', 'E', 'F', 'F#', 'G', 'A', 'B'];

  const filteredChords = PRESET_CHORDS.filter(chord => {
    const matchesSearch = chord.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          chord.key.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesKey = selectedKey === null || chord.key === selectedKey;
    const matchesSuffix = selectedSuffix === null || 
                          (selectedSuffix === 'Major' && chord.suffix === '') ||
                          (selectedSuffix === 'Minor' && chord.suffix === 'm') ||
                          (selectedSuffix === '7th/Ext' && chord.suffix !== '' && chord.suffix !== 'm');
    return matchesSearch && matchesKey && matchesSuffix;
  });

  return (
    <div className="space-y-6">
      {/* Search & Filter Header */}
      <div className="p-6 rounded-2xl glass-panel space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search chord name (e.g. C7, Am)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-background/50 border border-border/60 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto justify-end">
            <Button
              size="sm"
              variant={selectedKey === null ? 'default' : 'outline'}
              onClick={() => setSelectedKey(null)}
              className="text-xs"
            >
              All Keys
            </Button>
            {keys.map(k => (
              <Button
                key={k}
                size="sm"
                variant={selectedKey === k ? 'default' : 'outline'}
                onClick={() => setSelectedKey(selectedKey === k ? null : k)}
                className="text-xs font-bold px-2.5"
              >
                {k}
              </Button>
            ))}
          </div>
        </div>

        {/* Quality Filter Bar */}
        <div className="flex items-center gap-2 pt-2 border-t border-border/40 text-xs">
          <span className="text-muted-foreground flex items-center gap-1">
            <Filter className="h-3.5 w-3.5" /> Type:
          </span>
          {['All', 'Major', 'Minor', '7th/Ext'].map(type => {
            const isSelected = (type === 'All' && selectedSuffix === null) || selectedSuffix === type;
            return (
              <button
                key={type}
                onClick={() => setSelectedSuffix(type === 'All' ? null : type)}
                className={`px-3 py-1 rounded-lg border transition-all ${
                  isSelected ? 'bg-primary/20 border-primary text-primary font-bold' : 'border-border/60 hover:bg-muted text-muted-foreground'
                }`}
              >
                {type}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Chord Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredChords.map(chord => (
          <div
            key={chord.id}
            className="p-5 rounded-2xl glass-panel flex flex-col items-center justify-between space-y-4 border border-border/40 hover:border-primary/40 hover:glow-primary transition-all duration-300 group"
          >
            <div className="flex items-center justify-between w-full">
              <h4 className="font-extrabold text-lg">{chord.name}</h4>
              <Badge variant="purple" className="text-xs font-bold">
                {chord.key}
              </Badge>
            </div>

            <div
              onClick={() => strumChord(chord, 'down')}
              className="cursor-pointer"
            >
              <ChordDiagram chord={chord} options={{ size: 'md', theme: 'sleek-dark' }} />
            </div>

            <div className="flex items-center justify-between gap-1.5 w-full pt-2 border-t border-border/30">
              <Button
                size="sm"
                variant="outline"
                onClick={() => strumChord(chord, 'down')}
                className="flex-1 h-8 text-xs gap-1.5"
              >
                <Volume2 className="h-3.5 w-3.5 text-primary" />
                Strum
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedTheoryChord(chord)}
                className="h-8 px-2 text-xs gap-1 text-amber-400"
                title="View notes and theory explanation"
              >
                <Info className="h-3.5 w-3.5" />
                Theory
              </Button>

              {onSelectChord && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => onSelectChord(chord)}
                  className="h-8 px-2 text-xs gap-1"
                  title="Open in Designer"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Theory & Notes Modal */}
      {selectedTheoryChord && (
        <Dialog open={!!selectedTheoryChord} onOpenChange={() => setSelectedTheoryChord(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-amber-400" />
                <span>Music Theory & Note Formula</span>
              </DialogTitle>
              <DialogDescription>
                Detailed breakdown of constructed notes and chord intervals for {selectedTheoryChord.name}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div className="flex justify-center">
                <ChordDiagram chord={selectedTheoryChord} options={{ size: 'md', theme: 'sleek-dark' }} />
              </div>

              <ChordTheoryCard chord={selectedTheoryChord} />

              <div className="flex justify-end pt-2">
                <Button variant="default" onClick={() => setSelectedTheoryChord(null)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
