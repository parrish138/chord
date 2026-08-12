import React from 'react';
import { TabTrack } from '../../types/tab';
import { cn } from '../ui/button';

export interface TabRendererProps {
  track: TabTrack;
  activeColumnIndex?: number;
  onNoteClick?: (columnIndex: number, stringNum: number) => void;
  className?: string;
}

const TAB_STRING_LABELS = ['e', 'B', 'G', 'D', 'A', 'E']; // String 1 to String 6

// Calculate MIDI note number from string (1-6) and fret (0-24)
function getMidiNote(stringNum: number, fret: number): number {
  // Base MIDI pitches for open strings E2, A2, D3, G3, B3, E4
  const openMidi: Record<number, number> = {
    6: 40, // E2
    5: 45, // A2
    4: 50, // D3
    3: 55, // G3
    2: 59, // B3
    1: 64, // E4
  };
  return (openMidi[stringNum] || 40) + fret;
}

// Convert MIDI pitch to vertical Y position on the 5-line Treble Staff
// Treble clef bottom line E4 = MIDI 64
function midiToStaffY(midi: number, staffCenterY: number, lineSpacing: number): { y: number; hasLedger: boolean; ledgerY?: number[] } {
  // Distance in diatonic steps from E4 (MIDI 64)
  // Simple pitch offset approximation
  const semitonesFromE4 = midi - 64;
  
  // Approximate diatonic step offset (2 semitones ~= 1 staff step)
  const diatonicOffset = Math.round(semitonesFromE4 / 1.75);
  
  // Each diatonic step is half a line spacing (between lines/spaces)
  const y = staffCenterY - (diatonicOffset * (lineSpacing / 2));
  
  const ledgers: number[] = [];
  // Add ledger lines if above/below 5-line staff limits
  const staffTopY = staffCenterY - 2 * lineSpacing;
  const staffBottomY = staffCenterY + 2 * lineSpacing;

  if (y > staffBottomY + 4) {
    for (let ly = staffBottomY + lineSpacing; ly <= y + 2; ly += lineSpacing) {
      ledgers.push(ly);
    }
  } else if (y < staffTopY - 4) {
    for (let ly = staffTopY - lineSpacing; ly >= y - 2; ly -= lineSpacing) {
      ledgers.push(ly);
    }
  }

  return { y, hasLedger: ledgers.length > 0, ledgerY: ledgers };
}

export const TabRenderer: React.FC<TabRendererProps> = ({
  track,
  activeColumnIndex = -1,
  onNoteClick,
  className,
}) => {
  const numStrings = 6;
  const numStaffLines = 5;
  const colWidth = 46;
  const lineSpacing = 16;
  const paddingLeft = 65;

  // Vertical offsets for dual-system layout
  const notationTop = 50; // Standard Musical Notation Staff Top
  const staffCenterY = notationTop + 2 * lineSpacing;
  
  const tabTop = notationTop + 5 * lineSpacing + 45; // TAB Staff Top directly below notation

  const totalWidth = Math.max(760, paddingLeft + track.columns.length * colWidth + 40);
  const totalHeight = tabTop + (numStrings - 1) * lineSpacing + 50;

  return (
    <div className={cn("overflow-x-auto rounded-2xl p-5 glass-panel border border-border/40 space-y-2", className)}>
      {/* Header Info */}
      <div className="flex items-center justify-between text-xs font-bold text-muted-foreground border-b border-border/40 pb-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-primary font-mono uppercase tracking-wider text-[11px] bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
            Notation + TAB Score
          </span>
          <span className="text-foreground">{track.title || 'Guitar Composition'}</span>
        </div>
        <span className="font-mono text-purple-400">{track.timeSignature || '4/4'} Time &bull; {track.tempoBpm || 120} BPM</span>
      </div>

      <svg
        width={totalWidth}
        height={totalHeight}
        viewBox={`0 0 ${totalWidth} ${totalHeight}`}
        className="font-mono select-none"
      >
        {/* ========================================================== */}
        {/* 1. TOP SYSTEM: 5-LINE MUSICAL NOTATION STAFF */}
        {/* ========================================================== */}
        <g id="musical-notation-staff">
          {/* Treble Clef Header Label */}
          <text x="12" y={notationTop - 12} fill="#A855F7" fontSize="11" fontWeight="bold">
            STANDARD NOTATION
          </text>
          
          {/* Treble Clef Icon Symbol */}
          <text x="18" y={staffCenterY + 4} fill="#E2E8F0" fontSize="24" textAnchor="middle" dominantBaseline="central">
            🎼
          </text>

          {/* 5 Horizontal Staff Lines */}
          {Array.from({ length: numStaffLines }).map((_, i) => {
            const y = notationTop + i * lineSpacing;
            return (
              <line
                key={`staff-line-${i}`}
                x1={paddingLeft - 10}
                y1={y}
                x2={totalWidth - 20}
                y2={y}
                stroke="#475569"
                strokeWidth="1.2"
              />
            );
          })}
        </g>

        {/* System Bracket Connecting Musical Staff & TAB */}
        <line
          x1={paddingLeft - 10}
          y1={notationTop}
          x2={paddingLeft - 10}
          y2={tabTop + (numStrings - 1) * lineSpacing}
          stroke="#94A3B8"
          strokeWidth="3"
        />

        {/* ========================================================== */}
        {/* 2. BOTTOM SYSTEM: 6-LINE GUITAR TABLATURE (TAB) */}
        {/* ========================================================== */}
        <g id="tablature-staff">
          <text x="12" y={tabTop - 12} fill="#EC4899" fontSize="11" fontWeight="bold">
            GUITAR TAB
          </text>

          {/* TAB Clef Block */}
          <text x="24" y={tabTop + 1.5 * lineSpacing} fill="#94A3B8" fontSize="11" fontWeight="900" textAnchor="middle">
            T
          </text>
          <text x="24" y={tabTop + 2.5 * lineSpacing} fill="#94A3B8" fontSize="11" fontWeight="900" textAnchor="middle">
            A
          </text>
          <text x="24" y={tabTop + 3.5 * lineSpacing} fill="#94A3B8" fontSize="11" fontWeight="900" textAnchor="middle">
            B
          </text>

          {/* 6 Horizontal TAB String Lines */}
          {Array.from({ length: numStrings }).map((_, i) => {
            const stringNum = i + 1; // 1 (High E) to 6 (Low E)
            const y = tabTop + i * lineSpacing;

            return (
              <g key={`tab-string-${stringNum}`}>
                <text
                  x="42"
                  y={y}
                  dominantBaseline="central"
                  fill="#64748B"
                  fontSize="10"
                  fontWeight="bold"
                >
                  {TAB_STRING_LABELS[i]}
                </text>

                <line
                  x1={paddingLeft - 10}
                  y1={y}
                  x2={totalWidth - 20}
                  y2={y}
                  stroke="#334155"
                  strokeWidth="1.2"
                />
              </g>
            );
          })}
        </g>

        {/* ========================================================== */}
        {/* 3. COLUMNS, NOTES, LEDGER LINES & FRETS */}
        {/* ========================================================== */}
        {track.columns.map((col, colIdx) => {
          const x = paddingLeft + colIdx * colWidth + colWidth / 2;
          const isActive = colIdx === activeColumnIndex;
          const isMeasureBar = colIdx > 0 && colIdx % 4 === 0;

          return (
            <g key={`col-${col.id || colIdx}`}>
              {/* Measure Barline across both notation & TAB */}
              {isMeasureBar && (
                <line
                  x1={x - colWidth / 2}
                  y1={notationTop}
                  x2={x - colWidth / 2}
                  y2={tabTop + (numStrings - 1) * lineSpacing}
                  stroke="#A855F7"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                />
              )}

              {/* Active Column Cursor Box */}
              {isActive && (
                <rect
                  x={x - colWidth / 2 + 2}
                  y={notationTop - 8}
                  width={colWidth - 4}
                  height={tabTop + (numStrings - 1) * lineSpacing - notationTop + 16}
                  fill="#A855F7"
                  opacity="0.2"
                  rx="6"
                />
              )}

              {/* Chord Label Header */}
              {col.chordLabel && (
                <text
                  x={x}
                  y={notationTop - 20}
                  textAnchor="middle"
                  fill="#F472B6"
                  fontSize="11"
                  fontWeight="black"
                >
                  {col.chordLabel}
                </text>
              )}

              {/* A. NOTATION STAFF NOTEHEADS & LEDGER LINES */}
              {col.notes.map(noteObj => {
                const midi = getMidiNote(noteObj.stringNum, noteObj.fret);
                const { y: noteY, ledgerY } = midiToStaffY(midi, staffCenterY, lineSpacing);

                return (
                  <g key={`notehead-${colIdx}-${noteObj.stringNum}`}>
                    {/* Horizontal Ledger Lines */}
                    {ledgerY && ledgerY.map((ly, lIdx) => (
                      <line
                        key={`ledger-${lIdx}`}
                        x1={x - 10}
                        y1={ly}
                        x2={x + 10}
                        y2={ly}
                        stroke="#94A3B8"
                        strokeWidth="1.2"
                      />
                    ))}

                    {/* Notehead (Filled Oval) */}
                    <ellipse
                      cx={x}
                      cy={noteY}
                      rx="5.5"
                      ry="4"
                      fill="#A855F7"
                      transform={`rotate(-20 ${x} ${noteY})`}
                    />

                    {/* Note Stem Line */}
                    <line
                      x1={x + 4.5}
                      y1={noteY}
                      x2={x + 4.5}
                      y2={noteY - 24}
                      stroke="#C084FC"
                      strokeWidth="1.5"
                    />
                  </g>
                );
              })}

              {/* B. TABLATURE FRETS & CLICKABLE TARGETS */}
              {Array.from({ length: numStrings }).map((_, sIdx) => {
                const stringNum = sIdx + 1;
                const tabY = tabTop + sIdx * lineSpacing;

                const noteObj = col.notes.find(n => n.stringNum === stringNum);
                const fretVal = noteObj ? noteObj.fret : null;

                return (
                  <g
                    key={`tab-cell-${colIdx}-${stringNum}`}
                    onClick={() => onNoteClick && onNoteClick(colIdx, stringNum)}
                    className="cursor-pointer hover:opacity-80"
                  >
                    <rect
                      x={x - colWidth / 2}
                      y={tabY - lineSpacing / 2}
                      width={colWidth}
                      height={lineSpacing}
                      fill="transparent"
                    />

                    {fretVal !== null && (
                      <g>
                        <rect
                          x={x - 9}
                          y={tabY - 9}
                          width="18"
                          height="18"
                          fill="#0F172A"
                          stroke="#EC4899"
                          strokeWidth="1.5"
                          rx="4"
                        />
                        <text
                          x={x}
                          y={tabY}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="#F8FAFC"
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
