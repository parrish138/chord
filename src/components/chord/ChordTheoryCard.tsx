import React from 'react';
import { ChordDefinition } from '../../types/chord';
import { analyzeChordTheory } from '../../utils/chordTheoryEngine';
import { Badge } from '../ui/badge';
import { BookOpen, HelpCircle, Sparkles, Music } from 'lucide-react';
import { cn } from '../ui/button';

export interface ChordTheoryCardProps {
  chord: ChordDefinition;
  className?: string;
  compact?: boolean;
}

export const ChordTheoryCard: React.FC<ChordTheoryCardProps> = ({ chord, className, compact = false }) => {
  const analysis = analyzeChordTheory(chord);

  return (
    <div className={cn("p-5 rounded-xl glass-panel space-y-4 border border-border/50", className)}>
      {/* Header: Chord Name & Scale Formula Badge */}
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <div className="flex items-center gap-2">
          <Music className="h-4 w-4 text-primary" />
          <h4 className="font-extrabold text-base tracking-tight">{chord.name}</h4>
        </div>
        <Badge variant="purple" className="font-mono text-xs font-bold gap-1">
          <Sparkles className="h-3 w-3" />
          Formula: {analysis.formula}
        </Badge>
      </div>

      {/* Constructed Notes & Interval Badges */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
          <span>Constructed Notes ({analysis.uniqueNotes.length}):</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {analysis.intervals.map((item, idx) => {
            const isRoot = item.semitonesFromRoot === 0;
            const isThird = item.semitonesFromRoot === 3 || item.semitonesFromRoot === 4;
            const isFifth = item.semitonesFromRoot === 7 || item.semitonesFromRoot === 6;
            const isSeventh = item.semitonesFromRoot === 10 || item.semitonesFromRoot === 11;

            const badgeVariant = isRoot
              ? 'default'
              : isThird
              ? 'purple'
              : isFifth
              ? 'emerald'
              : isSeventh
              ? 'amber'
              : 'secondary';

            return (
              <div
                key={`note-pill-${idx}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background/60 border border-border/60 text-xs font-mono"
              >
                <span className="font-extrabold text-primary text-sm">{item.note}</span>
                <Badge variant={badgeVariant} className="text-[10px] py-0 px-1.5 font-sans font-bold">
                  {item.abbreviation} ({item.intervalName})
                </Badge>
              </div>
            );
          })}
        </div>
      </div>

      {/* Why it makes this chord - Educational Breakdown */}
      {!compact && (
        <div className="p-3.5 rounded-lg bg-primary/5 border border-primary/20 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Why is this a {chord.name}?</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {analysis.explanation}
          </p>
        </div>
      )}
    </div>
  );
};
