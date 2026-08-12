import React, { useState, useRef, useEffect } from 'react';
import { ChordDefinition } from '../../types/chord';
import { NashvilleScaleContext, ScaleDegreeInfo, ScaleType } from '../../types/nashville';
import { getNashvilleContext } from '../../utils/nashvilleEngine';
import { strumChord, getGuitarPreset } from '../../utils/audioSynth';
import { ChordDiagram } from '../chord/ChordDiagram';
import { ChordTheoryCard } from '../chord/ChordTheoryCard';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Music2, Play, Plus, Trash2, ArrowRight, Sparkles, Volume2, BookOpen, Layers } from 'lucide-react';

const ROOT_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const SCALE_TYPES: ScaleType[] = [
  'Major (Ionian)',
  'Natural Minor (Aeolian)',
  'Dorian',
  'Mixolydian',
  'Harmonic Minor',
  'Major Pentatonic',
  'Minor Pentatonic',
];

const COMMON_PROGRESSIONS: { name: string; degrees: number[] }[] = [
  { name: 'Pop-Rock (1 - 5 - 6m - 4)', degrees: [1, 5, 6, 4] },
  { name: '50s Doo-Wop (1 - 6m - 4 - 5)', degrees: [1, 6, 4, 5] },
  { name: 'Jazz Turnaround (1 - 6m - 2m - 5)', degrees: [1, 6, 2, 5] },
  { name: 'Minor Rise (1m - 7 - 6 - 7)', degrees: [1, 7, 6, 7] },
  { name: 'Plagal Rock (1 - 4 - 1 - 5)', degrees: [1, 4, 1, 5] },
];

export const NashvilleStudio: React.FC = () => {
  const [selectedKey, setSelectedKey] = useState<string>('C');
  const [selectedScale, setSelectedScale] = useState<ScaleType>('Major (Ionian)');
  const [progression, setProgression] = useState<{ id: string; nashvilleNumber: string; chord: ChordDefinition }[]>([]);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(-1);
  const [isPlayingProgression, setIsPlayingProgression] = useState<boolean>(false);
  const [activeModalChord, setActiveModalChord] = useState<ChordDefinition | null>(null);

  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  // Compute diatonic scale degrees and chords
  const context: NashvilleScaleContext = getNashvilleContext(selectedKey, selectedScale);

  const handleAddDegreeToProgression = (deg: ScaleDegreeInfo) => {
    const newStep = {
      id: `step-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      nashvilleNumber: deg.nashvilleNumber,
      chord: deg.primaryChord,
    };
    setProgression(prev => [...prev, newStep]);
  };

  const handleLoadPresetProgression = (degreesList: number[]) => {
    const steps = degreesList.map((d, i) => {
      const deg = context.degrees.find((item: ScaleDegreeInfo) => item.degreeIndex === d) || context.degrees[0];
      return {
        id: `preset-step-${i}-${Date.now()}`,
        nashvilleNumber: deg.nashvilleNumber,
        chord: deg.primaryChord,
      };
    });
    setProgression(steps);
  };

  const handleRemoveStep = (index: number) => {
    const updated = [...progression];
    updated.splice(index, 1);
    setProgression(updated);
  };

  // Stop sequence audio playback & clear timeouts
  const handleClearProgression = () => {
    timeoutsRef.current.forEach(t => clearTimeout(t));
    timeoutsRef.current = [];
    setIsPlayingProgression(false);
    setActiveStepIndex(-1);
    setProgression([]);
  };

  const handlePlayProgression = () => {
    if (progression.length === 0) return;

    // Clear any active timeouts first
    timeoutsRef.current.forEach(t => clearTimeout(t));
    timeoutsRef.current = [];

    setIsPlayingProgression(true);

    progression.forEach((step, idx) => {
      const t1 = setTimeout(() => {
        setActiveStepIndex(idx);
        // Strum chord honoring the current global tone engine selection!
        strumChord(step.chord, 'down', 35, getGuitarPreset());

        if (idx === progression.length - 1) {
          const t2 = setTimeout(() => {
            setIsPlayingProgression(false);
            setActiveStepIndex(-1);
          }, 1200);
          timeoutsRef.current.push(t2);
        }
      }, idx * 1000);
      timeoutsRef.current.push(t1);
    });
  };

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(t => clearTimeout(t));
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Key & Scale Control Panel */}
      <div className="p-6 rounded-2xl glass-panel space-y-5">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-border/40 pb-4">
          <div className="space-y-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <Music2 className="h-5 w-5 text-primary" />
              <h3 className="font-extrabold text-xl tracking-tight">Nashville Number System Studio</h3>
              <Badge variant="purple">Diatonic Scale Filter</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Select a Key and Scale to filter all diatonic chords mapped to Nashville numbers (1 through 7).
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span>Key of <strong className="text-primary text-base">{selectedKey}</strong> ({selectedScale.split(' ')[0]})</span>
          </div>
        </div>

        {/* Root Key Selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">Select Root Key:</label>
          <div className="flex flex-wrap gap-1.5">
            {ROOT_NOTES.map(key => (
              <Button
                key={`nns-key-${key}`}
                size="sm"
                variant={selectedKey === key ? 'default' : 'outline'}
                onClick={() => setSelectedKey(key)}
                className="font-bold px-3 py-1 text-xs"
              >
                {key}
              </Button>
            ))}
          </div>
        </div>

        {/* Scale Type Selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">Select Scale / Mode:</label>
          <div className="flex flex-wrap gap-2">
            {SCALE_TYPES.map(st => (
              <button
                key={`scale-type-${st}`}
                onClick={() => setSelectedScale(st)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                  selectedScale === st
                    ? 'border-primary bg-primary/20 text-primary font-bold shadow-sm'
                    : 'border-border/60 hover:bg-muted text-muted-foreground'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Diatonic Scale Degree Card Grid (1 through 7) */}
      <div className="space-y-3">
        <h4 className="font-bold text-sm text-muted-foreground flex items-center justify-between">
          <span>Diatonic Chord Filter ({context.degrees.length} Degrees in {selectedKey} {selectedScale.split(' ')[0]}):</span>
          <span className="text-xs font-mono text-primary">Click + to add to progression builder</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {context.degrees.map((deg: ScaleDegreeInfo) => (
            <div
              key={`degree-card-${deg.degreeIndex}`}
              className="p-4 rounded-2xl glass-panel border border-border/40 hover:border-primary/40 transition-all space-y-3 flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/15 border border-primary/30 text-primary font-black flex items-center justify-center text-sm font-mono">
                    {deg.nashvilleNumber}
                  </div>
                  <div>
                    <h5 className="font-bold text-sm">{deg.primaryChord.name}</h5>
                    <span className="text-[10px] text-muted-foreground font-mono">{deg.romanNumeral}</span>
                  </div>
                </div>

                <Badge variant={deg.quality === 'Major' ? 'default' : deg.quality === 'Minor' ? 'purple' : 'outline'} className="text-[10px]">
                  {deg.quality}
                </Badge>
              </div>

              {/* Chord Diagram Preview */}
              <div className="flex justify-center py-2 bg-slate-950/40 rounded-xl border border-slate-800/60">
                <ChordDiagram chord={deg.primaryChord} options={{ size: 'sm', theme: 'sleek-dark' }} />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => strumChord(deg.primaryChord, 'down', 35, getGuitarPreset())}
                  className="flex-1 gap-1 text-xs"
                >
                  <Volume2 className="h-3.5 w-3.5" />
                  Strum
                </Button>

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setActiveModalChord(deg.primaryChord)}
                  className="gap-1 text-xs px-2"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  Theory
                </Button>

                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleAddDegreeToProgression(deg)}
                  className="gap-1 text-xs px-2"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Progression Builder Timeline */}
      <div className="p-6 rounded-2xl glass-panel space-y-4 border border-border/40">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 border-b border-border/40 pb-4">
          <div>
            <h4 className="font-extrabold text-lg flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              Nashville Progression Builder
            </h4>
            <p className="text-xs text-muted-foreground">
              Build custom song progressions using Nashville numbers (e.g. 1 - 5 - 6m - 4).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={handlePlayProgression}
              disabled={progression.length === 0 || isPlayingProgression}
              className="gap-2 text-xs font-bold"
            >
              <Play className="h-4 w-4" />
              Play Progression
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

        {/* Preset Common Progressions Buttons */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">Load Common Progressions:</label>
          <div className="flex flex-wrap gap-2">
            {COMMON_PROGRESSIONS.map(preset => (
              <Button
                key={`preset-${preset.name}`}
                size="sm"
                variant="outline"
                onClick={() => handleLoadPresetProgression(preset.degrees)}
                className="text-xs gap-1.5"
              >
                <span>{preset.name}</span>
                <Badge variant="secondary" className="text-[10px] py-0">
                  {preset.degrees.map(d => context.degrees.find((deg: ScaleDegreeInfo) => deg.degreeIndex === d)?.nashvilleNumber).join(' - ')}
                </Badge>
              </Button>
            ))}
          </div>
        </div>

        {/* Active Progression Sequence Ribbon */}
        {progression.length > 0 ? (
          <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-background/50 border border-border/40 overflow-x-auto">
            {progression.map((step, idx) => (
              <React.Fragment key={step.id}>
                <div
                  className={`p-3 rounded-xl border glass-panel flex flex-col items-center space-y-1 transition-all duration-300 ${
                    idx === activeStepIndex
                      ? 'border-primary bg-primary/20 glow-primary scale-105'
                      : 'border-border/60'
                  }`}
                >
                  <div className="flex items-center justify-between w-full gap-3">
                    <Badge variant="purple" className="font-extrabold text-sm">
                      {step.nashvilleNumber}
                    </Badge>
                    <button
                      onClick={() => handleRemoveStep(idx)}
                      className="text-muted-foreground hover:text-destructive text-xs"
                    >
                      ✕
                    </button>
                  </div>
                  <span className="font-bold text-sm">{step.chord.name}</span>
                  <ChordDiagram chord={step.chord} options={{ size: 'sm', theme: 'sleek-dark' }} />
                </div>
                {idx < progression.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center border border-dashed border-border/60 rounded-xl text-muted-foreground text-sm italic">
            Click scale degree cards above or select a preset to build a Nashville chord progression!
          </div>
        )}
      </div>

      {/* Theory Explainer Modal */}
      {activeModalChord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-0">
          <div className="w-full max-w-lg p-6 rounded-2xl glass-panel border border-border/60 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h3 className="font-extrabold text-lg">{activeModalChord.name} Theory Breakdown</h3>
              <Button size="sm" variant="ghost" onClick={() => setActiveModalChord(null)}>
                Close
              </Button>
            </div>
            <ChordTheoryCard chord={activeModalChord} />
          </div>
        </div>
      )}
    </div>
  );
};
