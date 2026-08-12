import React, { useState } from 'react';
import { SCALE_DEFINITIONS, NOTES_CHROMATIC, getScaleNotes } from '../../utils/scaleEngine';
import { playPluckedNote, getGuitarPreset } from '../../utils/audioSynth';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Music, Sparkles, Play, Eye, Globe, Sliders, Volume2, ArrowUp, ArrowDown, Repeat, Shuffle } from 'lucide-react';

export type ArpeggioDirection = 'up' | 'down' | 'updown' | 'random';

export interface ScalePresetsSelectorProps {
  rootNote: string;
  onRootNoteChange: (rootNote: string) => void;
  selectedScaleId: string;
  onSelectedScaleIdChange: (scaleId: string) => void;
  displayMode: 'interval' | 'noteName' | 'fingering';
  onDisplayModeChange: (mode: 'interval' | 'noteName' | 'fingering') => void;
  className?: string;
}

export const ScalePresetsSelector: React.FC<ScalePresetsSelectorProps> = ({
  rootNote,
  onRootNoteChange,
  selectedScaleId,
  onSelectedScaleIdChange,
  displayMode,
  onDisplayModeChange,
  className = '',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isPlayingArpeggio, setIsPlayingArpeggio] = useState<boolean>(false);
  const [arpeggioDirection, setArpeggioDirection] = useState<ArpeggioDirection>('up');
  const [mutedArpeggioNotes, setMutedArpeggioNotes] = useState<Set<string>>(new Set());

  // Active scale definition and notes formula
  const activeScaleDef = SCALE_DEFINITIONS.find(s => s.id === selectedScaleId) || SCALE_DEFINITIONS[0];
  const activeScaleNotes = getScaleNotes(rootNote, selectedScaleId);

  // Filter scale definitions by category
  const filteredScales = SCALE_DEFINITIONS.filter(scale => {
    if (selectedCategory === 'all') return true;
    return scale.category === selectedCategory;
  });

  const toggleMuteArpeggioNote = (noteName: string) => {
    setMutedArpeggioNotes(prev => {
      const next = new Set(prev);
      if (next.has(noteName)) {
        next.delete(noteName);
      } else {
        next.add(noteName);
      }
      return next;
    });
  };

  const getArpeggioSequence = () => {
    const activeNotes = activeScaleNotes.filter(n => !mutedArpeggioNotes.has(n.noteName));
    if (activeNotes.length === 0) return [];
    const base = [...activeNotes];

    if (arpeggioDirection === 'up') {
      return base;
    } else if (arpeggioDirection === 'down') {
      return [...base].reverse();
    } else if (arpeggioDirection === 'updown') {
      const desc = [...base].slice(0, -1).reverse();
      return [...base, ...desc];
    } else if (arpeggioDirection === 'random') {
      const shuffled = [...base];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const r = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[r]] = [shuffled[r], shuffled[i]];
      }
      return shuffled;
    }
    return base;
  };

  const handlePlayScaleArpeggio = () => {
    if (isPlayingArpeggio || activeScaleNotes.length === 0) return;
    setIsPlayingArpeggio(true);

    const sequence = getArpeggioSequence();

    sequence.forEach((item, idx) => {
      setTimeout(() => {
        const rootIdx = NOTES_CHROMATIC.indexOf(rootNote);
        const noteSemis = (NOTES_CHROMATIC.indexOf(item.noteName) - rootIdx + 12) % 12;
        const midiPitch = 60 + noteSemis;
        const freq = 440 * Math.pow(2, (midiPitch - 69) / 12);
        playPluckedNote(freq, 0.8);

        if (idx === sequence.length - 1) {
          setTimeout(() => setIsPlayingArpeggio(false), 500);
        }
      }, idx * 220);
    });
  };

  return (
    <div className={`p-6 rounded-2xl glass-panel space-y-6 border border-border/40 ${className}`}>
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/30 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-400" />
            <h3 className="font-extrabold text-lg tracking-tight">Scale Presets & Tonic Studio</h3>
            <Badge variant="purple" className="text-xs font-mono font-bold">
              {activeScaleNotes.length} Notes Formula
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Select tonic root and scale formula to update fretboard diagrams across the studio timeline.
          </p>
        </div>

        {/* Quick Action Buttons & Arpeggio Pattern Direction Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Arpeggio Pattern Direction Switcher */}
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/40">
            <button
              onClick={() => setArpeggioDirection('up')}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
                arpeggioDirection === 'up'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Ascending Arpeggio (Up)"
            >
              <ArrowUp className="h-3 w-3" />
              Up
            </button>

            <button
              onClick={() => setArpeggioDirection('down')}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
                arpeggioDirection === 'down'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Descending Arpeggio (Down)"
            >
              <ArrowDown className="h-3 w-3" />
              Down
            </button>

            <button
              onClick={() => setArpeggioDirection('updown')}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
                arpeggioDirection === 'updown'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Ascending & Descending Arpeggio (Up/Down)"
            >
              <Repeat className="h-3 w-3" />
              Up/Down
            </button>

            <button
              onClick={() => setArpeggioDirection('random')}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
                arpeggioDirection === 'random'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Randomized Note Pattern (Random)"
            >
              <Shuffle className="h-3 w-3" />
              Random
            </button>
          </div>

          <Button
            size="sm"
            variant="default"
            onClick={handlePlayScaleArpeggio}
            disabled={isPlayingArpeggio}
            className="gap-1.5 text-xs font-bold shadow-md"
          >
            {isPlayingArpeggio ? <Volume2 className="h-3.5 w-3.5 animate-pulse" /> : <Play className="h-3.5 w-3.5" />}
            Preview ({arpeggioDirection.toUpperCase()})
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onDisplayModeChange(displayMode === 'interval' ? 'noteName' : displayMode === 'noteName' ? 'fingering' : 'interval')}
            className="gap-1.5 text-xs font-bold"
          >
            <Eye className="h-3.5 w-3.5 text-primary" />
            Mode: <span className="capitalize text-primary">{displayMode === 'interval' ? 'Intervals' : displayMode === 'noteName' ? 'Note Names' : 'Suggested Fingering'}</span>
          </Button>
        </div>
      </div>

      {/* Main Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. Root Note (Tonic) Selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <span>Root Note (Tonic):</span>
            <span className="text-amber-400 font-mono font-extrabold">{rootNote}</span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 mb-3">
            {NOTES_CHROMATIC.map(n => (
              <button
                key={`preset-root-${n}`}
                onClick={() => onRootNoteChange(n)}
                className={`py-2 rounded-lg font-mono font-bold text-xs transition-all ${
                  rootNote === n
                    ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400/50 font-extrabold scale-105'
                    : 'bg-muted/70 hover:bg-muted text-muted-foreground'
                }`}
              >
                {n}
              </button>
            ))}
          </div>

          {/* Active Scale Triad, Roman Numeral & Description Box */}
          {(() => {
            const diatonicRomans = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];
            const harmonicRomans = ['i', 'iiø', 'III+', 'iV', 'V', 'Vi', 'vii°'];

            let roman = '';
            if (activeScaleDef.category === 'diatonic') {
              const diatonicIdx = SCALE_DEFINITIONS.filter(s => s.category === 'diatonic').findIndex(s => s.id === activeScaleDef.id);
              if (diatonicIdx >= 0 && diatonicIdx < diatonicRomans.length) roman = diatonicRomans[diatonicIdx];
            } else if (activeScaleDef.category === 'non-diatonic') {
              const harmonicIdx = ['harmonic-minor', 'locrian-sharp-6', 'ionian-sharp-5', 'dorian-sharp-4', 'phrygian-dominant', 'lydian-sharp-2', 'ultralocrian'].indexOf(activeScaleDef.id);
              if (harmonicIdx >= 0 && harmonicIdx < harmonicRomans.length) roman = harmonicRomans[harmonicIdx];
            }

            const root = activeScaleNotes.find(n => n.interval === '1');
            const third = activeScaleNotes.find(n => n.interval === '3' || n.interval === 'b3');
            const fifth = activeScaleNotes.find(n => n.interval === '5' || n.interval === 'b5' || n.interval === '#5');
            const seventh = activeScaleNotes.find(n => n.interval === '7' || n.interval === 'b7' || n.interval === 'bb7');

            let triadType = 'Triad';
            let chord7Type = '';

            if (third && fifth) {
              if (third.interval === '3' && fifth.interval === '5') {
                triadType = 'Major Triad';
                chord7Type = seventh?.interval === '7' ? 'Major 7th (Maj7)' : seventh?.interval === 'b7' ? 'Dominant 7th (7)' : '';
              } else if (third.interval === 'b3' && fifth.interval === '5') {
                triadType = 'Minor Triad';
                chord7Type = seventh?.interval === 'b7' ? 'Minor 7th (m7)' : seventh?.interval === '7' ? 'Minor Major 7th (Mmaj7)' : '';
              } else if (third.interval === 'b3' && fifth.interval === 'b5') {
                triadType = 'Diminished Triad';
                chord7Type = seventh?.interval === 'b7' ? 'Half-Diminished 7th (m7b5)' : seventh?.interval === 'bb7' ? 'Diminished 7th (dim7)' : '';
              } else if (third.interval === '3' && fifth.interval === '#5') {
                triadType = 'Augmented Triad';
                chord7Type = seventh?.interval === 'b7' ? 'Augmented Dominant (7#5)' : '';
              }
            }

            const triadNotes = [root?.noteName, third?.noteName, fifth?.noteName].filter(Boolean).join(' - ');
            const chord7Notes = [root?.noteName, third?.noteName, fifth?.noteName, seventh?.noteName].filter(Boolean).join(' - ');

            return (
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-amber-500/30 space-y-2.5 shadow-lg">
                <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    {roman && (
                      <span className="font-serif font-black text-sm text-amber-400 px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30">
                        {roman}
                      </span>
                    )}
                    <span className="font-extrabold text-xs text-foreground">
                      {rootNote} {activeScaleDef.name}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono text-amber-300 border-amber-500/30">
                    {triadType}
                  </Badge>
                </div>

                {/* Triad & 7th Chord Notes */}
                <div className="space-y-1 text-xs font-mono">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-[11px] font-bold text-amber-300">{triadType}:</span>
                    <span className="font-bold text-foreground">{triadNotes || 'N/A'}</span>
                  </div>
                  {chord7Type && (
                    <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                      <span className="font-bold text-purple-300">{chord7Type}:</span>
                      <span className="font-bold text-slate-200">{chord7Notes}</span>
                    </div>
                  )}
                </div>

                {/* Description */}
                <p className="text-[11px] text-muted-foreground leading-relaxed pt-1.5 border-t border-slate-800/60 font-normal">
                  {activeScaleDef.description}
                </p>
              </div>
            );
          })()}
        </div>

        {/* 2. Scale Category Filter & Preset Grid */}
        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Select Scale Formula ({filteredScales.length} Available):
            </label>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1">
              {[
                { id: 'all', label: 'All' },
                { id: 'diatonic', label: 'Diatonic Modes' },
                { id: 'non-diatonic', label: 'Harmonic Minor Modes' },
                { id: 'pentatonic-blues', label: 'Pentatonic/Blues' },
                { id: 'exotic', label: 'Exotic/Symmetrical' },
              ].map(cat => (
                <button
                  key={`cat-filter-${cat.id}`}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted/50 hover:bg-muted text-muted-foreground'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Scale Definition Selector Grid with Roman Numerals for Diatonic & Harmonic Modes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
            {filteredScales.map((scale, idx) => {
              const isSelected = selectedScaleId === scale.id;

              // Roman numeral mapping for Diatonic and Harmonic Minor modes
              const diatonicRomans = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];
              const harmonicRomans = ['i', 'iiø', 'III+', 'iV', 'V', 'Vi', 'vii°'];

              let romanNumeral = '';
              if (scale.category === 'diatonic') {
                const diatonicIdx = SCALE_DEFINITIONS.filter(s => s.category === 'diatonic').findIndex(s => s.id === scale.id);
                if (diatonicIdx >= 0 && diatonicIdx < diatonicRomans.length) {
                  romanNumeral = diatonicRomans[diatonicIdx];
                }
              } else if (scale.category === 'non-diatonic' && (scale.id.includes('harmonic') || scale.id.includes('locrian') || scale.id.includes('ionian') || scale.id.includes('dorian') || scale.id.includes('phrygian') || scale.id.includes('lydian') || scale.id.includes('ultralocrian'))) {
                const harmonicIdx = ['harmonic-minor', 'locrian-sharp-6', 'ionian-sharp-5', 'dorian-sharp-4', 'phrygian-dominant', 'lydian-sharp-2', 'ultralocrian'].indexOf(scale.id);
                if (harmonicIdx >= 0 && harmonicIdx < harmonicRomans.length) {
                  romanNumeral = harmonicRomans[harmonicIdx];
                }
              }

              return (
                <button
                  key={`preset-scale-${scale.id}`}
                  onClick={() => onSelectedScaleIdChange(scale.id)}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-amber-400 bg-amber-500/15 text-amber-200 font-bold shadow-md ring-1 ring-amber-400/30'
                      : 'border-border/60 hover:bg-muted text-muted-foreground'
                  }`}
                >
                  <div className="font-bold flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 line-clamp-1">
                      {romanNumeral && (
                        <span className="font-serif font-extrabold text-amber-400 text-xs px-1 rounded bg-amber-500/10 border border-amber-500/20">
                          {romanNumeral}
                        </span>
                      )}
                      <span>{scale.name}</span>
                    </div>
                    <Badge variant="secondary" className="text-[9px] px-1 py-0 capitalize opacity-80 shrink-0">
                      {scale.category.replace('-', ' ')}
                    </Badge>
                  </div>
                  <p className="text-[10px] opacity-75 line-clamp-1 mt-1 font-normal">{scale.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Scale Formula Notes & Intervals Display */}
      <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-wrap items-center justify-between gap-3 shadow-inner">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs font-bold text-slate-200">
          <div className="flex items-center gap-2">
            <Music className="h-4 w-4 text-amber-400" />
            <span>Active Scale Notes Formula ({rootNote} {activeScaleDef.name}):</span>
          </div>
          <span className="text-[11px] text-muted-foreground font-normal">(Click notes to toggle ON/OFF for arpeggio preview)</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {activeScaleNotes.map((item, idx) => {
            const isMuted = mutedArpeggioNotes.has(item.noteName);

            return (
              <button
                key={`preset-formula-note-${idx}`}
                onClick={() => toggleMuteArpeggioNote(item.noteName)}
                className={`px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 border shadow-sm transition-all cursor-pointer ${
                  isMuted
                    ? 'bg-stone-900/90 text-stone-500 border-stone-800 line-through opacity-40 hover:opacity-80 scale-95'
                    : item.isRoot
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 ring-1 ring-amber-400/30 font-black scale-105 hover:bg-amber-500/30'
                    : 'bg-primary/20 text-primary-foreground border-primary/40 hover:bg-primary/30'
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
  );
};
