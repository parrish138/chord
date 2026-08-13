import React, { useState } from 'react';
import { CAGEDForm, CAGEDQuality } from '../../types/caged';
import { CAGED_TEMPLATES, generateCAGEDChord, getRawCAGEDChord, ROOT_NOTES } from '../../utils/cagedSystem';
import { ChordDiagram } from './ChordDiagram';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { strumChord } from '../../utils/audioSynth';
import { Layers, Volume2, BookOpen, Sliders, Info } from 'lucide-react';
import { ChordDefinition } from '../../types/chord';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { ChordTheoryCard } from './ChordTheoryCard';

export interface CAGEDMatrixProps {
  onSelectChord?: (chord: ChordDefinition) => void;
}

const CAGED_FORMS: CAGEDForm[] = ['E Form', 'A Form', 'D Form', 'C Form', 'G Form'];
const CAGED_QUALITIES: CAGEDQuality[] = ['Major', 'Minor', '7', 'Minor 7', 'Major7', '5 Chords'];

export const CAGEDMatrix: React.FC<CAGEDMatrixProps> = ({ onSelectChord }) => {
  const [mode, setMode] = useState<'reference' | 'transposed'>('transposed');
  const [selectedRoot, setSelectedRoot] = useState<string>('F');
  const [selectedTheoryChord, setSelectedTheoryChord] = useState<ChordDefinition | null>(null);

  const FORM_ROOT_STRINGS: Record<CAGEDForm, string> = {
    'E Form': 'Root Str 6 (Low E)',
    'A Form': 'Root Str 5 (A)',
    'D Form': 'Root Str 4 (D)',
    'C Form': 'Root Str 5 (A)',
    'G Form': 'Root Str 6 (Low E)',
  };

  return (
    <div className="space-y-6">
      {/* Header & Mode Switcher */}
      <div className="p-6 rounded-2xl glass-panel space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-border/40 pb-4">
          <div className="space-y-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <Layers className="h-5 w-5 text-primary" />
              <h3 className="font-extrabold text-xl tracking-tight">CAGED System Movable Barre Chords Matrix</h3>
              <Badge variant={mode === 'transposed' ? 'emerald' : 'purple'}>
                {mode === 'transposed' ? `Movable Barre Chords (${selectedRoot})` : 'Open Position Reference Map'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {mode === 'transposed'
                ? `All 30 CAGED shapes rendered as movable barre chords (index finger barre) transposed to key of ${selectedRoot}.`
                : 'Fundamental open string CAGED base shapes at nut position.'}
            </p>
          </div>

          {/* Mode Switch Buttons */}
          <div className="flex items-center gap-2 bg-muted/60 p-1 rounded-xl border border-border/40 shrink-0">
            <Button
              size="sm"
              variant={mode === 'transposed' ? 'default' : 'ghost'}
              onClick={() => setMode('transposed')}
              className="gap-1.5 text-xs font-bold"
            >
              <Sliders className="h-3.5 w-3.5" />
              Movable Barre Chords
            </Button>
            <Button
              size="sm"
              variant={mode === 'reference' ? 'default' : 'ghost'}
              onClick={() => setMode('reference')}
              className="gap-1.5 text-xs font-semibold"
            >
              <BookOpen className="h-3.5 w-3.5" />
              Open Position Shapes
            </Button>
          </div>
        </div>

        {/* Transposer Root Note Picker (Visible in transposed mode) */}
        {mode === 'transposed' && (
          <div className="space-y-2 pt-1 animate-in fade-in-0">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-muted-foreground">Select Target Barre Chord Root Key:</label>
              <span className="text-xs font-mono text-primary font-bold">Target Key: {selectedRoot}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ROOT_NOTES.map(note => (
                <Button
                  key={`root-btn-${note}`}
                  size="sm"
                  variant={selectedRoot === note ? 'default' : 'outline'}
                  onClick={() => setSelectedRoot(note)}
                  className="font-bold px-3 py-1 text-xs"
                >
                  {note}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Responsive Matrix Grid */}
      <div className="text-[10px] text-muted-foreground font-mono flex items-center justify-between sm:hidden px-1 pb-1">
        <span>← Swipe matrix horizontally →</span>
        <span className="text-primary font-bold">30 CAGED Barre Shapes</span>
      </div>
      <div className="overflow-x-auto scrollbar-none rounded-2xl glass-panel p-3.5 sm:p-6 border border-border/40">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-3 text-left font-bold text-sm text-muted-foreground border-b border-border/40 min-w-[130px]">
                CAGED Form / Quality
              </th>
              {CAGED_QUALITIES.map(q => (
                <th key={`col-${q}`} className="p-3 text-center font-bold text-sm text-foreground border-b border-border/40 min-w-[140px]">
                  {q}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CAGED_FORMS.map(form => (
              <tr key={`row-${form}`} className="border-b border-border/30 hover:bg-white/5 transition-colors">
                <td className="p-3 align-middle whitespace-nowrap">
                  <div className="font-extrabold text-sm text-primary">{form}</div>
                  <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{FORM_ROOT_STRINGS[form]}</div>
                </td>

                {CAGED_QUALITIES.map(quality => {
                  const tmpl = CAGED_TEMPLATES.find(t => t.form === form && t.quality === quality);
                  if (!tmpl) return <td key={`cell-${form}-${quality}`} />;

                  const chordToDisplay = mode === 'reference' 
                    ? getRawCAGEDChord(tmpl) 
                    : generateCAGEDChord(tmpl, selectedRoot);

                  return (
                    <td key={`cell-${form}-${quality}`} className="p-3 text-center align-middle">
                      <div className="inline-flex flex-col items-center p-2 rounded-xl border border-transparent hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 group">
                        <div
                          onClick={() => strumChord(chordToDisplay, 'down')}
                          className="cursor-pointer"
                        >
                          <ChordDiagram
                            chord={chordToDisplay}
                            options={{
                              theme: 'sleek-dark',
                              size: 'sm',
                              showFingerNumbers: true,
                              showStringNames: false,
                            }}
                          />
                        </div>

                        <div className="mt-2 flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => strumChord(chordToDisplay, 'down')}
                            className="h-6 px-1.5 text-[10px] gap-1"
                          >
                            <Volume2 className="h-3 w-3 text-primary" />
                            Strum
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedTheoryChord(chordToDisplay)}
                            className="h-6 px-1.5 text-[10px] gap-1"
                            title="View constructed notes and theory breakdown"
                          >
                            <Info className="h-3 w-3 text-amber-400" />
                            Theory
                          </Button>
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Theory & Notes Dialog Modal */}
      {selectedTheoryChord && (
        <Dialog open={!!selectedTheoryChord} onOpenChange={() => setSelectedTheoryChord(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-amber-400" />
                <span>Music Theory & Note Formula</span>
              </DialogTitle>
              <DialogDescription>
                Detailed breakdown of constructed notes and chord intervals.
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
