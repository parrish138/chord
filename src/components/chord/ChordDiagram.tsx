import React, { useState } from 'react';
import { ChordDefinition, DiagramOptions, DiagramTheme } from '../../types/chord';
import { getIntervalAbbreviation } from '../../utils/chordTheoryEngine';
import { getNoteForStringAndFret } from '../../utils/scaleEngine';
import { cn } from '../ui/button';
import { Layers, Fingerprint, Music, Sparkles, Settings } from 'lucide-react';

export interface ChordDiagramProps {
  chord: ChordDefinition;
  options?: DiagramOptions;
  className?: string;
  onFretClick?: (stringNum: number, fret: number) => void;
  onHeaderClick?: (stringNum: number) => void;
}

const THEME_STYLES: Record<DiagramTheme, {
  bg: string;
  stringColor: string;
  fretColor: string;
  nutColor: string;
  dotFill: string;
  dotStroke: string;
  dotText: string;
  barreFill: string;
  textColor: string;
  muteColor: string;
  openColor: string;
}> = {
  'sleek-dark': {
    bg: '#121218',
    stringColor: '#64748B',
    fretColor: '#334155',
    nutColor: '#F8FAFC',
    dotFill: '#A855F7',
    dotStroke: '#C084FC',
    dotText: '#FFFFFF',
    barreFill: '#9333EA',
    textColor: '#F1F5F9',
    muteColor: '#EF4444',
    openColor: '#10B981',
  },
  'classic-wood': {
    bg: '#2A1810',
    stringColor: '#D1D5DB',
    fretColor: '#B45309',
    nutColor: '#F59E0B',
    dotFill: '#F59E0B',
    dotStroke: '#FBBF24',
    dotText: '#18181B',
    barreFill: '#D97706',
    textColor: '#FEF3C7',
    muteColor: '#F87171',
    openColor: '#34D399',
  },
  'neon-cyber': {
    bg: '#09090B',
    stringColor: '#06B6D4',
    fretColor: '#1E293B',
    nutColor: '#EC4899',
    dotFill: '#EC4899',
    dotStroke: '#F472B6',
    dotText: '#FFFFFF',
    barreFill: '#D946EF',
    textColor: '#F472B6',
    muteColor: '#FF0055',
    openColor: '#00FFCC',
  },
  'vintage-paper': {
    bg: '#FDFBF7',
    stringColor: '#475569',
    fretColor: '#94A3B8',
    nutColor: '#1E293B',
    dotFill: '#1E293B',
    dotStroke: '#0F172A',
    dotText: '#F8FAFC',
    barreFill: '#334155',
    textColor: '#0F172A',
    muteColor: '#DC2626',
    openColor: '#059669',
  },
  'minimal-light': {
    bg: '#FFFFFF',
    stringColor: '#94A3B8',
    fretColor: '#CBD5E1',
    nutColor: '#0284C7',
    dotFill: '#0284C7',
    dotStroke: '#38BDF8',
    dotText: '#FFFFFF',
    barreFill: '#0369A1',
    textColor: '#0F172A',
    muteColor: '#E11D48',
    openColor: '#10B981',
  },
};

const STRING_NAMES = ['E', 'B', 'G', 'D', 'A', 'E']; // High E (1) to Low E (6)

export const ChordDiagram: React.FC<ChordDiagramProps> = ({
  chord,
  options = {},
  className,
  onFretClick,
  onHeaderClick,
}) => {
  const {
    theme = 'sleek-dark',
    showFingerNumbers = true,
    showNoteNames = false,
    showStringNames = true,
    showFretNumbers = true,
    numStrings = 6,
    numFrets = 4,
    size = 'md',
    interactive = false,
  } = options;

  // Local state for Pop-Out Label Mode (Fingering vs Interval vs Note)
  const [activeLabelMode, setActiveLabelMode] = useState<'fingering' | 'interval' | 'note'>(options.labelMode || 'fingering');
  const [showPopout, setShowPopout] = useState<boolean>(false);

  const style = THEME_STYLES[theme] || THEME_STYLES['sleek-dark'];

  // Dimensions setup
  const sizeMap = {
    sm: { width: 160, height: 200, marginX: 32, marginTop: 38, marginBottom: 25 },
    md: { width: 230, height: 280, marginX: 44, marginTop: 48, marginBottom: 35 },
    lg: { width: 310, height: 370, marginX: 58, marginTop: 58, marginBottom: 45 },
    xl: { width: 390, height: 460, marginX: 72, marginTop: 68, marginBottom: 55 },
  };

  const dims = sizeMap[size] || sizeMap.md;
  const gridWidth = dims.width - dims.marginX * 2;
  const gridHeight = dims.height - dims.marginTop - dims.marginBottom;

  const stringSpacing = gridWidth / (numStrings - 1);
  const fretSpacing = gridHeight / numFrets;

  const baseFret = chord.baseFret || 1;

  // Helper X / Y coordinate calculators
  const getStringX = (stringNum: number) => {
    const index = numStrings - stringNum;
    return dims.marginX + index * stringSpacing;
  };

  const getFretY = (fretNum: number) => {
    const fretIndex = fretNum - baseFret + 1;
    return dims.marginTop + (fretIndex - 0.5) * fretSpacing;
  };

  const getFretLineY = (fretIndex: number) => {
    return dims.marginTop + fretIndex * fretSpacing;
  };

  return (
    <div className={cn("inline-block select-none relative group", className)}>
      {/* Pop-out UI Controller Badge */}
      <div className="absolute top-2 right-2 z-20">
        <button
          onClick={() => setShowPopout(!showPopout)}
          className="p-1.5 rounded-full bg-background/80 hover:bg-background border border-border/60 shadow-md text-xs font-semibold text-muted-foreground hover:text-primary transition-all flex items-center gap-1 backdrop-blur-md"
          title="Toggle Note Label Display Mode"
        >
          <Settings className="h-3.5 w-3.5" />
        </button>

        {/* Pop-Out Menu */}
        {showPopout && (
          <div className="absolute right-0 top-8 w-44 p-2 rounded-xl glass-panel border border-border/60 shadow-xl space-y-1 z-30 animate-in fade-in-0 zoom-in-95">
            <label className="text-[10px] font-bold text-muted-foreground uppercase px-2">Label Mode:</label>
            <button
              onClick={() => {
                setActiveLabelMode('fingering');
                setShowPopout(false);
              }}
              className={`w-full p-1.5 rounded-lg text-left text-xs flex items-center gap-2 transition-all ${
                activeLabelMode === 'fingering'
                  ? 'bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30'
                  : 'hover:bg-muted text-muted-foreground'
              }`}
            >
              <Fingerprint className="h-3.5 w-3.5" />
              Suggested Fingering
            </button>
            <button
              onClick={() => {
                setActiveLabelMode('interval');
                setShowPopout(false);
              }}
              className={`w-full p-1.5 rounded-lg text-left text-xs flex items-center gap-2 transition-all ${
                activeLabelMode === 'interval'
                  ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                  : 'hover:bg-muted text-muted-foreground'
              }`}
            >
              <Music className="h-3.5 w-3.5" />
              Interval Representation
            </button>
            <button
              onClick={() => {
                setActiveLabelMode('note');
                setShowPopout(false);
              }}
              className={`w-full p-1.5 rounded-lg text-left text-xs flex items-center gap-2 transition-all ${
                activeLabelMode === 'note'
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                  : 'hover:bg-muted text-muted-foreground'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Note Name Representation
            </button>
          </div>
        )}
      </div>

      <svg
        width={dims.width}
        height={dims.height}
        viewBox={`0 0 ${dims.width} ${dims.height}`}
        className="rounded-xl shadow-lg"
        style={{ backgroundColor: style.bg }}
      >
        {/* Chord Title */}
        <text
          x={dims.width / 2}
          y={dims.marginTop - 22}
          textAnchor="middle"
          fill={style.textColor}
          fontSize={size === 'sm' ? 14 : size === 'lg' ? 22 : 18}
          fontWeight="bold"
          fontFamily="system-ui, sans-serif"
        >
          {chord.name}
        </text>

        {/* Base Fret Indicator (if > 1) */}
        {baseFret > 1 && showFretNumbers && (
          <text
            x={dims.marginX - 14}
            y={getFretY(baseFret)}
            textAnchor="end"
            dominantBaseline="middle"
            fill={style.textColor}
            fontSize={size === 'sm' ? 11 : 13}
            fontWeight="600"
            fontFamily="monospace"
          >
            {baseFret}fr
          </text>
        )}

        {/* String Header Status (Behind the Nut: Open Strings / Muted X / Interval Badges) */}
        {Array.from({ length: numStrings }).map((_, i) => {
          const stringNum = numStrings - i; // 6 to 1
          const stringX = getStringX(stringNum);
          const isMuted = chord.mutedStrings?.includes(stringNum);

          const posOnString = chord.positions.find(p => p.string === stringNum);
          const isPosRoot = posOnString?.isRoot;
          const isPosOpen = posOnString && posOnString.fret === 0;

          const isOpen = chord.openStrings?.includes(stringNum) || isPosOpen ||
            (!isMuted && !posOnString && !chord.barres?.some(b => stringNum >= b.startString && stringNum <= b.endString));

          // Calculate open string interval for notes behind the nut
          const openInterval = getIntervalAbbreviation(chord.name, stringNum, 0);

          return (
            <g 
              key={`header-${stringNum}`} 
              onClick={() => interactive && onHeaderClick && onHeaderClick(stringNum)}
              className={interactive ? "cursor-pointer hover:opacity-80" : ""}
            >
              {isMuted && (
                <text
                  x={stringX}
                  y={dims.marginTop - 8}
                  textAnchor="middle"
                  fill={style.muteColor}
                  fontSize={size === 'sm' ? 12 : 15}
                  fontWeight="bold"
                >
                  ✕
                </text>
              )}

              {/* Behind the Nut Open Notes in INTERVAL mode */}
              {isOpen && !isMuted && activeLabelMode === 'interval' && (
                <g>
                  <circle
                    cx={stringX}
                    cy={dims.marginTop - 11}
                    r={size === 'sm' ? 7.5 : 9.5}
                    fill={openInterval === '1' ? style.nutColor : style.dotFill}
                    stroke={style.dotStroke}
                    strokeWidth="1.5"
                  />
                  <text
                    x={stringX}
                    y={dims.marginTop - 11}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={openInterval === '1' ? style.bg : style.dotText}
                    fontSize={size === 'sm' ? 8 : 10}
                    fontWeight="extrabold"
                    fontFamily="monospace"
                  >
                    {openInterval === '1' ? 'R' : openInterval}
                  </text>
                </g>
              )}

              {/* Behind the Nut Open Notes in FINGERING mode (Root Badge R) */}
              {isOpen && !isMuted && activeLabelMode === 'fingering' && isPosRoot && (
                <g>
                  <circle
                    cx={stringX}
                    cy={dims.marginTop - 11}
                    r={size === 'sm' ? 7.5 : 9.5}
                    fill="none"
                    stroke={style.nutColor}
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                  />
                  <circle
                    cx={stringX}
                    cy={dims.marginTop - 11}
                    r={size === 'sm' ? 5.5 : 7}
                    fill={style.nutColor}
                    stroke={style.dotStroke}
                    strokeWidth="1.5"
                  />
                  <text
                    x={stringX}
                    y={dims.marginTop - 11}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={style.bg}
                    fontSize={size === 'sm' ? 8 : 10}
                    fontWeight="extrabold"
                    fontFamily="system-ui, sans-serif"
                  >
                    R
                  </text>
                </g>
              )}

              {/* Behind the Nut Open Notes in FINGERING mode (Normal Open O) */}
              {isOpen && !isMuted && activeLabelMode === 'fingering' && !isPosRoot && (
                <circle
                  cx={stringX}
                  cy={dims.marginTop - 10}
                  r={size === 'sm' ? 4 : 5.5}
                  fill="none"
                  stroke={style.openColor}
                  strokeWidth="2"
                />
              )}
            </g>
          );
        })}

        {/* Fretboard Nut / Top Bar */}
        <line
          x1={dims.marginX}
          y1={dims.marginTop}
          x2={dims.width - dims.marginX}
          y2={dims.marginTop}
          stroke={style.nutColor}
          strokeWidth={baseFret === 1 ? 5 : 2}
          strokeLinecap="round"
        />

        {/* Horizontal Fret Lines */}
        {Array.from({ length: numFrets + 1 }).map((_, f) => {
          if (f === 0) return null;
          const y = getFretLineY(f);
          return (
            <line
              key={`fret-${f}`}
              x1={dims.marginX}
              y1={y}
              x2={dims.width - dims.marginX}
              y2={y}
              stroke={style.fretColor}
              strokeWidth="1.5"
            />
          );
        })}

        {/* Vertical Strings */}
        {Array.from({ length: numStrings }).map((_, i) => {
          const stringNum = numStrings - i;
          const x = getStringX(stringNum);
          const strokeWidth = 1 + (stringNum - 1) * 0.45;
          return (
            <line
              key={`string-${stringNum}`}
              x1={x}
              y1={dims.marginTop}
              x2={x}
              y2={dims.marginTop + gridHeight}
              stroke={style.stringColor}
              strokeWidth={strokeWidth}
            />
          );
        })}

        {/* Interactive Clickable Grid Overlay */}
        {interactive && Array.from({ length: numStrings }).map((_, sIdx) => {
          const stringNum = numStrings - sIdx;
          const x = getStringX(stringNum);
          return Array.from({ length: numFrets }).map((_, fIdx) => {
            const fretNum = baseFret + fIdx;
            const y = getFretY(fretNum);
            return (
              <rect
                key={`click-${stringNum}-${fretNum}`}
                x={x - stringSpacing / 2}
                y={y - fretSpacing / 2}
                width={stringSpacing}
                height={fretSpacing}
                fill="transparent"
                className="cursor-pointer hover:fill-white/10"
                onClick={() => onFretClick && onFretClick(stringNum, fretNum)}
              />
            );
          });
        })}

        {/* Barre Chords */}
        {chord.barres?.map((barre, idx) => {
          const fretIndex = barre.fret - baseFret + 1;
          if (fretIndex < 1 || fretIndex > numFrets) return null;

          const startX = getStringX(barre.startString);
          const endX = getStringX(barre.endString);
          const barreHeight = size === 'sm' ? 14 : size === 'lg' ? 22 : 18;
          const paddingX = barreHeight / 2;
          const minX = Math.min(startX, endX) - paddingX;
          const maxX = Math.max(startX, endX) + paddingX;
          const y = getFretY(barre.fret);

          const minString = Math.min(barre.startString, barre.endString);
          const maxString = Math.max(barre.startString, barre.endString);

          return (
            <g key={`barre-${idx}`}>
              <rect
                x={minX}
                y={y - barreHeight / 2}
                width={maxX - minX}
                height={barreHeight}
                rx={barreHeight / 2}
                fill={style.barreFill}
                opacity="0.9"
              />
              {barre.finger && showFingerNumbers && activeLabelMode === 'fingering' && (
                <text
                  x={minX - 6}
                  y={y}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fill={style.textColor}
                  fontSize={size === 'sm' ? 10 : 12}
                  fontWeight="bold"
                >
                  {barre.finger}
                </text>
              )}

              {/* Interval Badges on Barre Notes in Interval Mode */}
              {activeLabelMode === 'interval' &&
                Array.from({ length: maxString - minString + 1 }).map((_, sOffset) => {
                  const s = minString + sOffset;
                  // If string has a separate finger position in chord.positions on top of barre, don't duplicate
                  const hasOverlayPos = chord.positions.some(p => p.string === s && p.fret > barre.fret);
                  if (hasOverlayPos) return null;

                  const cx = getStringX(s);
                  const intervalAbbr = getIntervalAbbreviation(chord.name, s, barre.fret);
                  const radius = size === 'sm' ? 6.5 : size === 'lg' ? 10.5 : 8.5;
                  const isRoot = intervalAbbr === '1';

                  return (
                    <g key={`barre-interval-${idx}-${s}`}>
                      <circle
                        cx={cx}
                        cy={y}
                        r={radius}
                        fill={isRoot ? style.nutColor : style.dotFill}
                        stroke={isRoot ? style.dotFill : style.dotStroke}
                        strokeWidth="1.5"
                      />
                      <text
                        x={cx}
                        y={y}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill={isRoot ? style.bg : style.dotText}
                        fontSize={radius * 0.9}
                        fontWeight="extrabold"
                        fontFamily="monospace"
                      >
                        {isRoot ? 'R' : intervalAbbr}
                      </text>
                    </g>
                  );
                })}

              {/* Note Badges on Barre Notes in Note Mode */}
              {activeLabelMode === 'note' &&
                Array.from({ length: maxString - minString + 1 }).map((_, sOffset) => {
                  const s = minString + sOffset;
                  const hasOverlayPos = chord.positions.some(p => p.string === s && p.fret > barre.fret);
                  if (hasOverlayPos) return null;

                  const cx = getStringX(s);
                  const noteName = getNoteForStringAndFret(s, barre.fret).noteName;
                  const radius = size === 'sm' ? 6.5 : size === 'lg' ? 10.5 : 8.5;

                  return (
                    <g key={`barre-note-${idx}-${s}`}>
                      <circle
                        cx={cx}
                        cy={y}
                        r={radius}
                        fill={style.dotFill}
                        stroke={style.dotStroke}
                        strokeWidth="1.5"
                      />
                      <text
                        x={cx}
                        y={y}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill={style.dotText}
                        fontSize={radius * 0.85}
                        fontWeight="extrabold"
                        fontFamily="monospace"
                      >
                        {noteName}
                      </text>
                    </g>
                  );
                })}
            </g>
          );
        })}

        {/* Finger Dots */}
        {chord.positions.map((pos, idx) => {
          const fretIndex = pos.fret - baseFret + 1;
          if (fretIndex < 1 || fretIndex > numFrets) return null;

          const cx = getStringX(pos.string);
          const cy = getFretY(pos.fret);
          const radius = size === 'sm' ? 8 : size === 'lg' ? 13 : 10.5;
          const isRoot = pos.isRoot;

          // Calculate interval badge label for fretted note
          const intervalAbbr = getIntervalAbbreviation(chord.name, pos.string, pos.fret);
          const noteName = getNoteForStringAndFret(pos.string, pos.fret).noteName;

          return (
            <g key={`dot-${idx}`} className="transition-transform duration-150">
              <circle
                cx={cx}
                cy={cy}
                r={radius}
                fill={isRoot ? style.nutColor : style.dotFill}
                stroke={isRoot ? style.dotFill : style.dotStroke}
                strokeWidth={isRoot ? "3" : "2"}
              />
              {/* Outer halo for root note */}
              {isRoot && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={radius + 3}
                  fill="none"
                  stroke={style.nutColor}
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                />
              )}
              {showFingerNumbers && (
                <text
                  x={cx}
                  y={cy}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={isRoot ? style.bg : style.dotText}
                  fontSize={radius * (activeLabelMode === 'interval' || activeLabelMode === 'note' ? 0.9 : 1.05)}
                  fontWeight="bold"
                  fontFamily={activeLabelMode === 'interval' || activeLabelMode === 'note' ? "monospace" : "system-ui, sans-serif"}
                >
                  {activeLabelMode === 'interval'
                    ? (intervalAbbr === '1' ? 'R' : intervalAbbr)
                    : activeLabelMode === 'note'
                    ? noteName
                    : (isRoot ? 'R' : pos.finger || '')}
                </text>
              )}
            </g>
          );
        })}

        {/* Bottom String Names */}
        {showStringNames && Array.from({ length: numStrings }).map((_, i) => {
          const stringNum = numStrings - i;
          const x = getStringX(stringNum);
          const name = STRING_NAMES[i] || `${stringNum}`;
          return (
            <text
              key={`string-name-${stringNum}`}
              x={x}
              y={dims.height - 10}
              textAnchor="middle"
              fill={style.textColor}
              opacity="0.6"
              fontSize={size === 'sm' ? 9 : 11}
              fontWeight="500"
            >
              {name}
            </text>
          );
        })}
      </svg>
    </div>
  );
};
