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

export interface NoteDetails {
  pitchClass: string;
  octave: number;
  noteNameWithOctave: string;
  isSharp: boolean;
  totalDiatonicStep: number;
}

const DIATONIC_STEP_MAP: Record<number, { name: string; step: number; isSharp: boolean }> = {
  0:  { name: 'C',  step: 0, isSharp: false },
  1:  { name: 'C#', step: 0, isSharp: true },
  2:  { name: 'D',  step: 1, isSharp: false },
  3:  { name: 'D#', step: 1, isSharp: true },
  4:  { name: 'E',  step: 2, isSharp: false },
  5:  { name: 'F',  step: 3, isSharp: false },
  6:  { name: 'F#', step: 3, isSharp: true },
  7:  { name: 'G',  step: 4, isSharp: false },
  8:  { name: 'G#', step: 4, isSharp: true },
  9:  { name: 'A',  step: 5, isSharp: false },
  10: { name: 'A#', step: 5, isSharp: true },
  11: { name: 'B',  step: 6, isSharp: false },
};

export function getMidiNote(stringNum: number, fret: number): number {
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

export function getNoteDetailsFromMidi(midi: number): NoteDetails {
  const pitchClass = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  const info = DIATONIC_STEP_MAP[pitchClass];
  const totalDiatonicStep = (octave - 4) * 7 + info.step;
  return {
    pitchClass: info.name,
    octave,
    noteNameWithOctave: `${info.name}${octave}`,
    isSharp: info.isSharp,
    totalDiatonicStep,
  };
}

export function midiToStaffY(midi: number, notationTop: number, lineSpacing: number): {
  y: number;
  noteDetails: NoteDetails;
  ledgerY: number[];
} {
  const noteDetails = getNoteDetailsFromMidi(midi);
  const bottomLineY = notationTop + 4 * lineSpacing; // E4 (bottom staff line) = diatonic step 2
  const y = bottomLineY - (noteDetails.totalDiatonicStep - 2) * (lineSpacing / 2);

  const ledgerY: number[] = [];

  // Above staff: top line F5 is diatonic step 10 (y = notationTop)
  if (noteDetails.totalDiatonicStep >= 12) {
    for (let step = 12; step <= noteDetails.totalDiatonicStep; step += 2) {
      const ly = bottomLineY - (step - 2) * (lineSpacing / 2);
      ledgerY.push(ly);
    }
  }
  // Below staff: bottom line E4 is diatonic step 2 (y = bottomLineY)
  else if (noteDetails.totalDiatonicStep <= 0) {
    for (let step = 0; step >= noteDetails.totalDiatonicStep; step -= 2) {
      const ly = bottomLineY - (step - 2) * (lineSpacing / 2);
      ledgerY.push(ly);
    }
  }

  return { y, noteDetails, ledgerY };
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
  const notationTop = 65; // Standard Musical Notation Staff Top (room for high ledger lines up to fret 24)
  const staffCenterY = notationTop + 2 * lineSpacing;
  
  const tabTop = notationTop + 5 * lineSpacing + 55; // TAB Staff Top directly below notation

  const totalWidth = Math.max(760, paddingLeft + track.columns.length * colWidth + 40);
  const totalHeight = tabTop + (numStrings - 1) * lineSpacing + 60;

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
          <text x="12" y={notationTop - 14} fill="#A855F7" fontSize="11" fontWeight="bold">
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
                  y1={notationTop - 25}
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
                  y={notationTop - 30}
                  width={colWidth - 4}
                  height={tabTop + (numStrings - 1) * lineSpacing - notationTop + 38}
                  fill="#A855F7"
                  opacity="0.18"
                  rx="6"
                />
              )}

              {/* Chord Label Header */}
              {col.chordLabel && (
                <text
                  x={x}
                  y={notationTop - 24}
                  textAnchor="middle"
                  fill={isActive ? "#FDE047" : "#F472B6"}
                  fontSize="11"
                  fontWeight="black"
                >
                  {col.chordLabel}
                </text>
              )}

              {/* A. NOTATION STAFF NOTEHEADS, ACCIDENTALS, LEDGER LINES & PITCH HINTS */}
              {col.notes.map(noteObj => {
                const midi = getMidiNote(noteObj.stringNum, noteObj.fret);
                const { y: noteY, noteDetails, ledgerY } = midiToStaffY(midi, notationTop, lineSpacing);

                const isStemUp = noteDetails.totalDiatonicStep < 6;
                const stemX = isStemUp ? x + 5 : x - 5;
                const stemY2 = isStemUp ? noteY - 24 : noteY + 24;

                return (
                  <g key={`notehead-${colIdx}-${noteObj.stringNum}`}>
                    {/* Horizontal Ledger Lines */}
                    {ledgerY && ledgerY.map((ly, lIdx) => (
                      <line
                        key={`ledger-${lIdx}`}
                        x1={x - 11}
                        y1={ly}
                        x2={x + 11}
                        y2={ly}
                        stroke={isActive ? '#E9D5FF' : '#94A3B8'}
                        strokeWidth="1.4"
                      />
                    ))}

                    {/* Sharp Accidental Sign ♯ */}
                    {noteDetails.isSharp && (
                      <text
                        x={x - 13}
                        y={noteY + 3.5}
                        fill="#F472B6"
                        fontSize="12"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        ♯
                      </text>
                    )}

                    {/* Notehead (Filled Oval) */}
                    <ellipse
                      cx={x}
                      cy={noteY}
                      rx="5.5"
                      ry="4"
                      fill={isActive ? '#C084FC' : '#A855F7'}
                      stroke={isActive ? '#F0ABFC' : undefined}
                      strokeWidth={isActive ? '1' : '0'}
                      transform={`rotate(-20 ${x} ${noteY})`}
                    />

                    {/* Note Stem Line */}
                    <line
                      x1={stemX}
                      y1={noteY}
                      x2={stemX}
                      y2={stemY2}
                      stroke={isActive ? '#F0ABFC' : '#C084FC'}
                      strokeWidth="1.5"
                    />

                    {/* Floating Pitch Hint Tag (e.g. "C4", "F#5") */}
                    <text
                      x={x}
                      y={noteY + (isStemUp ? 13 : -13)}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill={isActive ? '#FDE047' : '#94A3B8'}
                      fontSize="9"
                      fontWeight="bold"
                      className="pointer-events-none opacity-90"
                    >
                      {noteDetails.noteNameWithOctave}
                    </text>
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
                          x={x - 10}
                          y={tabY - 9}
                          width="20"
                          height="18"
                          fill="#0F172A"
                          stroke={isActive ? '#F472B6' : '#EC4899'}
                          strokeWidth="1.5"
                          rx="4"
                        />
                        <text
                          x={x}
                          y={tabY}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="#F8FAFC"
                          fontSize="10"
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
