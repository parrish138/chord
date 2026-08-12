import React from 'react';
import { TabTrack } from '../../types/tab';
import { cn } from '../ui/button';

export interface TabRendererProps {
  track: TabTrack;
  activeColumnIndex?: number;
  onNoteClick?: (columnIndex: number, stringNum: number) => void;
  className?: string;
}

const STRING_LABELS = ['e', 'B', 'G', 'D', 'A', 'E']; // String 1 to String 6

export const TabRenderer: React.FC<TabRendererProps> = ({
  track,
  activeColumnIndex = -1,
  onNoteClick,
  className,
}) => {
  const numStrings = 6;
  const colWidth = 42;
  const lineSpacing = 22;
  const paddingLeft = 50;
  const paddingTop = 30;

  const totalWidth = Math.max(700, paddingLeft + track.columns.length * colWidth + 40);
  const totalHeight = paddingTop + (numStrings - 1) * lineSpacing + 40;

  return (
    <div className={cn("overflow-x-auto rounded-xl p-4 glass-panel border border-border/40", className)}>
      <svg
        width={totalWidth}
        height={totalHeight}
        viewBox={`0 0 ${totalWidth} ${totalHeight}`}
        className="font-mono select-none"
      >
        {/* Track Info Header */}
        <text x="10" y="18" fill="#F8FAFC" fontSize="13" fontWeight="bold">
          {track.title || 'Guitar Tablature'} ({track.timeSignature || '4/4'}, {track.tempoBpm || 120} BPM)
        </text>

        {/* 6 Horizontal String Lines */}
        {Array.from({ length: numStrings }).map((_, i) => {
          const stringNum = i + 1; // 1 (High E) to 6 (Low E)
          const y = paddingTop + i * lineSpacing;

          return (
            <g key={`tab-string-${stringNum}`}>
              {/* String Name Header (e, B, G, D, A, E) */}
              <text
                x="15"
                y={y}
                dominantBaseline="central"
                fill="#94A3B8"
                fontSize="12"
                fontWeight="bold"
              >
                {STRING_LABELS[i]}
              </text>

              {/* Horizontal Line */}
              <line
                x1={paddingLeft}
                y1={y}
                x2={totalWidth - 20}
                y2={y}
                stroke="#334155"
                strokeWidth="1.5"
              />
            </g>
          );
        })}

        {/* Vertical Measure / Column Dividers and Notes */}
        {track.columns.map((col, colIdx) => {
          const x = paddingLeft + colIdx * colWidth + colWidth / 2;
          const isActive = colIdx === activeColumnIndex;

          // Measure barline every 4 columns
          const isMeasureBar = colIdx > 0 && colIdx % 4 === 0;

          return (
            <g key={`tab-col-${col.id || colIdx}`}>
              {/* Measure Barline */}
              {isMeasureBar && (
                <line
                  x1={x - colWidth / 2}
                  y1={paddingTop}
                  x2={x - colWidth / 2}
                  y2={paddingTop + (numStrings - 1) * lineSpacing}
                  stroke="#A855F7"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                />
              )}

              {/* Active Column Highlight Box */}
              {isActive && (
                <rect
                  x={x - colWidth / 2 + 2}
                  y={paddingTop - 10}
                  width={colWidth - 4}
                  height={(numStrings - 1) * lineSpacing + 20}
                  fill="#A855F7"
                  opacity="0.25"
                  rx="6"
                />
              )}

              {/* Optional Chord Name Label at top */}
              {col.chordLabel && (
                <text
                  x={x}
                  y={paddingTop - 12}
                  textAnchor="middle"
                  fill="#C084FC"
                  fontSize="11"
                  fontWeight="bold"
                >
                  {col.chordLabel}
                </text>
              )}

              {/* Clickable String Cells & Fret Numbers */}
              {Array.from({ length: numStrings }).map((_, sIdx) => {
                const stringNum = sIdx + 1; // 1 to 6
                const y = paddingTop + sIdx * lineSpacing;

                const noteObj = col.notes.find(n => n.stringNum === stringNum);
                const fretVal = noteObj ? noteObj.fret : null;

                return (
                  <g
                    key={`cell-${colIdx}-${stringNum}`}
                    onClick={() => onNoteClick && onNoteClick(colIdx, stringNum)}
                    className="cursor-pointer hover:opacity-80"
                  >
                    {/* Transparent Click Target */}
                    <rect
                      x={x - colWidth / 2}
                      y={y - lineSpacing / 2}
                      width={colWidth}
                      height={lineSpacing}
                      fill="transparent"
                    />

                    {/* Fret Number Badge */}
                    {fretVal !== null && (
                      <g>
                        <rect
                          x={x - 9}
                          y={y - 9}
                          width="18"
                          height="18"
                          fill="#1E1B4B"
                          stroke="#A855F7"
                          strokeWidth="1.5"
                          rx="4"
                        />
                        <text
                          x={x}
                          y={y}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="#FFFFFF"
                          fontSize="11"
                          fontWeight="bold"
                        >
                          {fretVal}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
};
