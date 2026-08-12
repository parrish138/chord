import React, { useState, useEffect, useRef } from 'react';
import { TabTrack, TabColumn, TabNote } from '../../types/tab';
import { TabRenderer } from '../tab/TabRenderer';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { playPluckedNote, getFrequencyForStringAndFret, getGuitarPreset } from '../../utils/audioSynth';
import { useGlobalBpm } from '../../utils/globalBpmManager';
import { Play, Square, RotateCcw, ChevronUp, ChevronDown, ChevronsUpDown, Sparkles, Dumbbell, Music } from 'lucide-react';
import { Badge } from '../ui/badge';

// ──────────────────────────────────────────────────────────────
// Spider Exercise (Chromatic) Generator
// ──────────────────────────────────────────────────────────────
// The spider exercise plays 4 consecutive chromatic frets (e.g. 1-2-3-4)
// on each string, going from string 6 (low E) to string 1 (high E) — "ascending".
// Then it shifts up one fret position and descends from string 1 back to string 6.
// Repeats across the fretboard.

type SpiderDirection = 'up' | 'down' | 'updown';
type SpiderPattern = '1-2-3-4' | '4-3-2-1' | '1-3-2-4' | '1-4-2-3';

const PATTERN_OFFSETS: Record<SpiderPattern, number[]> = {
  '1-2-3-4': [0, 1, 2, 3],
  '4-3-2-1': [3, 2, 1, 0],
  '1-3-2-4': [0, 2, 1, 3],
  '1-4-2-3': [0, 3, 1, 2],
};

function generateSpiderExercise(
  startFret: number,
  numPositions: number,
  direction: SpiderDirection,
  pattern: SpiderPattern = '1-2-3-4'
): TabTrack {
  const columns: TabColumn[] = [];
  let colId = 0;
  const offsets = PATTERN_OFFSETS[pattern];

  const makeCol = (stringNum: number, fret: number, label?: string): TabColumn => ({
    id: `spider-${colId++}`,
    notes: [{ stringNum, fret }],
    chordLabel: label,
  });

  for (let pos = 0; pos < numPositions; pos++) {
    const baseFret = startFret + pos;
    if (baseFret + 3 > 24) break; // Don't exceed 24 frets

    // Label the start of each position
    const posLabel = `Shift Pos ${baseFret} (Frets ${baseFret}-${baseFret + 3})`;

    if (direction === 'up' || direction === 'updown') {
      // Ascending: String 6 → 1
      for (let s = 6; s >= 1; s--) {
        for (let i = 0; i < offsets.length; i++) {
          const fretOffset = offsets[i];
          const isFirstNote = s === 6 && i === 0;
          columns.push(makeCol(s, baseFret + fretOffset, isFirstNote ? posLabel : undefined));
        }
      }
    }

    if (direction === 'down' || direction === 'updown') {
      // Descending: String 1 → 6
      const descOffsets = [...offsets].reverse();
      for (let s = 1; s <= 6; s++) {
        for (let i = 0; i < descOffsets.length; i++) {
          const fretOffset = descOffsets[i];
          const isFirstNote = direction === 'down' && s === 1 && i === 0;
          columns.push(makeCol(s, baseFret + fretOffset, isFirstNote ? posLabel : undefined));
        }
      }
    }
  }

  return {
    id: 'spider-exercise',
    title: `Spider Exercise (${pattern}) — Fret ${startFret}`,
    tempoBpm: 80,
    timeSignature: '4/4',
    columns,
  };
}

// ──────────────────────────────────────────────────────────────
// Exercise 2: Strumming & Alternate Picking Definitions
// ──────────────────────────────────────────────────────────────
export interface StrumStroke {
  stroke: 'down' | 'up' | 'rest' | 'mute';
  beatLabel: string;
}

export interface StrumPatternDef {
  id: string;
  name: string;
  description: string;
  strokes: StrumStroke[];
}

export const STRUM_PATTERNS: StrumPatternDef[] = [
  {
    id: 'alt-8ths',
    name: 'Strict Alternate Picking (↓ ↑ ↓ ↑)',
    description: 'Constant 8th-note down/up alternate strokes. Master picking hand consistency and timing.',
    strokes: [
      { stroke: 'down', beatLabel: '1 (↓)' },
      { stroke: 'up', beatLabel: '& (↑)' },
      { stroke: 'down', beatLabel: '2 (↓)' },
      { stroke: 'up', beatLabel: '& (↑)' },
      { stroke: 'down', beatLabel: '3 (↓)' },
      { stroke: 'up', beatLabel: '& (↑)' },
      { stroke: 'down', beatLabel: '4 (↓)' },
      { stroke: 'up', beatLabel: '& (↑)' },
    ],
  },
  {
    id: 'pop-rock',
    name: 'Classic Island / Pop Strum (↓ ↓ ↑ ↑ ↓ ↑)',
    description: 'The most popular guitar strumming pattern (D - D U - U D U). Great for syncopated rhythms.',
    strokes: [
      { stroke: 'down', beatLabel: '1 (↓)' },
      { stroke: 'rest', beatLabel: '&' },
      { stroke: 'down', beatLabel: '2 (↓)' },
      { stroke: 'up', beatLabel: '& (↑)' },
      { stroke: 'rest', beatLabel: '3' },
      { stroke: 'up', beatLabel: '& (↑)' },
      { stroke: 'down', beatLabel: '4 (↓)' },
      { stroke: 'up', beatLabel: '& (↑)' },
    ],
  },
  {
    id: 'driving-4-4',
    name: 'Driving Rock 4/4 (↓ ↓ ↑ ↓ ↓ ↑)',
    description: 'Steady 4/4 rhythm with upstroke accents on off-beats.',
    strokes: [
      { stroke: 'down', beatLabel: '1 (↓)' },
      { stroke: 'rest', beatLabel: '&' },
      { stroke: 'down', beatLabel: '2 (↓)' },
      { stroke: 'up', beatLabel: '& (↑)' },
      { stroke: 'down', beatLabel: '3 (↓)' },
      { stroke: 'rest', beatLabel: '&' },
      { stroke: 'down', beatLabel: '4 (↓)' },
      { stroke: 'up', beatLabel: '& (↑)' },
    ],
  },
  {
    id: 'reggae-ska',
    name: 'Reggae / Ska Off-Beat (x ↑ x ↑ x ↑ x ↑)',
    description: 'Muted downbeats with sharp upbeat accents on the "&" beats.',
    strokes: [
      { stroke: 'mute', beatLabel: '1 (x)' },
      { stroke: 'up', beatLabel: '& (↑)' },
      { stroke: 'mute', beatLabel: '2 (x)' },
      { stroke: 'up', beatLabel: '& (↑)' },
      { stroke: 'mute', beatLabel: '3 (x)' },
      { stroke: 'up', beatLabel: '& (↑)' },
      { stroke: 'mute', beatLabel: '4 (x)' },
      { stroke: 'up', beatLabel: '& (↑)' },
    ],
  },
  {
    id: 'gallop',
    name: 'Gallop Rhythm (↓ ↓ ↑ ↓ ↓ ↑)',
    description: 'Heavy metal and rock 16th-note gallop rhythm pattern.',
    strokes: [
      { stroke: 'down', beatLabel: '1 (↓)' },
      { stroke: 'down', beatLabel: 'e (↓)' },
      { stroke: 'up', beatLabel: '& (↑)' },
      { stroke: 'rest', beatLabel: 'a' },
      { stroke: 'down', beatLabel: '2 (↓)' },
      { stroke: 'down', beatLabel: 'e (↓)' },
      { stroke: 'up', beatLabel: '& (↑)' },
      { stroke: 'rest', beatLabel: 'a' },
    ],
  },
];

export interface ChordProgressionDef {
  id: string;
  name: string;
  chords: Array<{ name: string; notes: TabNote[] }>;
}

export const EXERCISE_PROGRESSIONS: ChordProgressionDef[] = [
  {
    id: 'pop-c-am-f-g',
    name: 'Pop Classic (C - Am - F - G)',
    chords: [
      { name: 'C', notes: [{ stringNum: 5, fret: 3 }, { stringNum: 4, fret: 2 }, { stringNum: 3, fret: 0 }, { stringNum: 2, fret: 1 }] },
      { name: 'Am', notes: [{ stringNum: 5, fret: 0 }, { stringNum: 4, fret: 2 }, { stringNum: 3, fret: 2 }, { stringNum: 2, fret: 1 }] },
      { name: 'F', notes: [{ stringNum: 6, fret: 1 }, { stringNum: 5, fret: 3 }, { stringNum: 4, fret: 3 }, { stringNum: 3, fret: 2 }, { stringNum: 2, fret: 1 }, { stringNum: 1, fret: 1 }] },
      { name: 'G', notes: [{ stringNum: 6, fret: 3 }, { stringNum: 5, fret: 2 }, { stringNum: 4, fret: 0 }, { stringNum: 3, fret: 0 }, { stringNum: 2, fret: 0 }, { stringNum: 1, fret: 3 }] },
    ],
  },
  {
    id: 'rock-g-d-em-c',
    name: 'Rock Anthem (G - D - Em - C)',
    chords: [
      { name: 'G', notes: [{ stringNum: 6, fret: 3 }, { stringNum: 5, fret: 2 }, { stringNum: 4, fret: 0 }, { stringNum: 3, fret: 0 }, { stringNum: 2, fret: 0 }, { stringNum: 1, fret: 3 }] },
      { name: 'D', notes: [{ stringNum: 4, fret: 0 }, { stringNum: 3, fret: 2 }, { stringNum: 2, fret: 3 }, { stringNum: 1, fret: 2 }] },
      { name: 'Em', notes: [{ stringNum: 6, fret: 0 }, { stringNum: 5, fret: 2 }, { stringNum: 4, fret: 2 }, { stringNum: 3, fret: 0 }, { stringNum: 2, fret: 0 }, { stringNum: 1, fret: 0 }] },
      { name: 'C', notes: [{ stringNum: 5, fret: 3 }, { stringNum: 4, fret: 2 }, { stringNum: 3, fret: 0 }, { stringNum: 2, fret: 1 }] },
    ],
  },
  {
    id: 'single-string-alt',
    name: 'Single String Alternate Picking (Low E)',
    chords: [
      { name: 'Fret 0', notes: [{ stringNum: 6, fret: 0 }] },
      { name: 'Fret 3', notes: [{ stringNum: 6, fret: 3 }] },
      { name: 'Fret 5', notes: [{ stringNum: 6, fret: 5 }] },
      { name: 'Fret 7', notes: [{ stringNum: 6, fret: 7 }] },
    ],
  },
];

export interface ExtendedTabColumn extends TabColumn {
  strokeType?: 'down' | 'up' | 'rest' | 'mute';
}

function generateStrumExercise(
  patternId: string,
  progressionId: string,
  repeatsPerChord: number = 2
): TabTrack {
  const pattern = STRUM_PATTERNS.find(p => p.id === patternId) || STRUM_PATTERNS[0];
  const progression = EXERCISE_PROGRESSIONS.find(p => p.id === progressionId) || EXERCISE_PROGRESSIONS[0];

  const columns: ExtendedTabColumn[] = [];
  let colId = 0;

  progression.chords.forEach(chord => {
    for (let r = 0; r < repeatsPerChord; r++) {
      pattern.strokes.forEach((strokeInfo, strokeIdx) => {
        let notes: TabNote[] = [];
        const isFirstBeatOfChord = strokeIdx === 0 && r === 0;

        const strokeSymbol = strokeInfo.stroke === 'down' ? '↓' : strokeInfo.stroke === 'up' ? '↑' : strokeInfo.stroke === 'mute' ? 'x' : '–';
        const displayLabel = isFirstBeatOfChord ? `${chord.name} ${strokeSymbol}` : strokeSymbol;

        if (strokeInfo.stroke === 'down' || strokeInfo.stroke === 'up') {
          notes = chord.notes;
        } else if (strokeInfo.stroke === 'mute') {
          notes = chord.notes.map(n => ({ stringNum: n.stringNum, fret: 0 }));
        }

        columns.push({
          id: `strum-${colId++}`,
          notes: strokeInfo.stroke === 'rest' ? [] : notes,
          chordLabel: displayLabel,
          strokeType: strokeInfo.stroke,
        });
      });
    }
  });

  return {
    id: 'strum-exercise',
    title: `Strum Practice: ${pattern.name}`,
    tempoBpm: 90,
    timeSignature: '4/4',
    columns,
  };
}

// ──────────────────────────────────────────────────────────────
// Exercise 3: Modal Characteristic & Modal Shift Generator
// ──────────────────────────────────────────────────────────────
export type ModalShiftPair = 'dorian-aeolian' | 'lydian-ionian' | 'phrygian-aeolian' | 'mixolydian-ionian';

export interface ModalShiftDef {
  id: ModalShiftPair;
  name: string;
  tonicChord: string;
  modeNotes: { noteName: string; interval: string; stringNum: number; fret: number }[];
  refNotes: { noteName: string; interval: string; stringNum: number; fret: number }[];
  description: string;
}

export const MODAL_SHIFT_PAIRS: Record<ModalShiftPair, ModalShiftDef> = {
  'dorian-aeolian': {
    id: 'dorian-aeolian',
    name: 'D Dorian vs D Aeolian (6 ↔ ♭6)',
    tonicChord: 'Dm7',
    description: 'Alternates the Dorian characteristic natural 6th (B) with Aeolian flat 6th (B♭) over Dm7.',
    modeNotes: [
      { noteName: 'D', interval: '1', stringNum: 5, fret: 5 },
      { noteName: 'F', interval: 'b3', stringNum: 4, fret: 3 },
      { noteName: 'A', interval: '5', stringNum: 4, fret: 7 },
      { noteName: 'B', interval: '6 (Dorian Accent)', stringNum: 3, fret: 4 },
      { noteName: 'C', interval: 'b7', stringNum: 3, fret: 5 },
    ],
    refNotes: [
      { noteName: 'D', interval: '1', stringNum: 5, fret: 5 },
      { noteName: 'F', interval: 'b3', stringNum: 4, fret: 3 },
      { noteName: 'A', interval: '5', stringNum: 4, fret: 7 },
      { noteName: 'Bb', interval: 'b6 (Aeolian)', stringNum: 3, fret: 3 },
      { noteName: 'C', interval: 'b7', stringNum: 3, fret: 5 },
    ],
  },
  'lydian-ionian': {
    id: 'lydian-ionian',
    name: 'C Lydian vs C Major (♯4 ↔ 4)',
    tonicChord: 'Cmaj7',
    description: 'Alternates Lydian raised 4th (F#) with Ionian natural 4th (F) over Cmaj7.',
    modeNotes: [
      { noteName: 'C', interval: '1', stringNum: 5, fret: 3 },
      { noteName: 'E', interval: '3', stringNum: 4, fret: 2 },
      { noteName: 'F#', interval: '#4 (Lydian Accent)', stringNum: 4, fret: 4 },
      { noteName: 'G', interval: '5', stringNum: 4, fret: 5 },
      { noteName: 'B', interval: '7', stringNum: 3, fret: 4 },
    ],
    refNotes: [
      { noteName: 'C', interval: '1', stringNum: 5, fret: 3 },
      { noteName: 'E', interval: '3', stringNum: 4, fret: 2 },
      { noteName: 'F', interval: '4 (Ionian)', stringNum: 4, fret: 3 },
      { noteName: 'G', interval: '5', stringNum: 4, fret: 5 },
      { noteName: 'B', interval: '7', stringNum: 3, fret: 4 },
    ],
  },
  'phrygian-aeolian': {
    id: 'phrygian-aeolian',
    name: 'E Phrygian vs E Aeolian (♭2 ↔ 2)',
    tonicChord: 'Em7',
    description: 'Alternates Phrygian flat 2nd (F) with Aeolian natural 2nd (F#) over Em7.',
    modeNotes: [
      { noteName: 'E', interval: '1', stringNum: 6, fret: 0 },
      { noteName: 'F', interval: 'b2 (Phrygian Accent)', stringNum: 6, fret: 1 },
      { noteName: 'G', interval: 'b3', stringNum: 6, fret: 3 },
      { noteName: 'B', interval: '5', stringNum: 5, fret: 2 },
      { noteName: 'D', interval: 'b7', stringNum: 4, fret: 0 },
    ],
    refNotes: [
      { noteName: 'E', interval: '1', stringNum: 6, fret: 0 },
      { noteName: 'F#', interval: '2 (Aeolian)', stringNum: 6, fret: 2 },
      { noteName: 'G', interval: 'b3', stringNum: 6, fret: 3 },
      { noteName: 'B', interval: '5', stringNum: 5, fret: 2 },
      { noteName: 'D', interval: 'b7', stringNum: 4, fret: 0 },
    ],
  },
  'mixolydian-ionian': {
    id: 'mixolydian-ionian',
    name: 'G Mixolydian vs G Major (♭7 ↔ 7)',
    tonicChord: 'G7',
    description: 'Alternates Mixolydian flat 7th (F) with Ionian major 7th (F#) over G7.',
    modeNotes: [
      { noteName: 'G', interval: '1', stringNum: 6, fret: 3 },
      { noteName: 'B', interval: '3', stringNum: 5, fret: 2 },
      { noteName: 'D', interval: '5', stringNum: 4, fret: 0 },
      { noteName: 'F', interval: 'b7 (Mixolydian Accent)', stringNum: 4, fret: 3 },
    ],
    refNotes: [
      { noteName: 'G', interval: '1', stringNum: 6, fret: 3 },
      { noteName: 'B', interval: '3', stringNum: 5, fret: 2 },
      { noteName: 'D', interval: '5', stringNum: 4, fret: 0 },
      { noteName: 'F#', interval: '7 (Ionian)', stringNum: 4, fret: 4 },
    ],
  },
};

function generateModalShiftExercise(pairId: ModalShiftPair): TabTrack {
  const pair = MODAL_SHIFT_PAIRS[pairId];
  const columns: TabColumn[] = [];
  let colId = 0;

  // Round 1: Mode Phrase (with Characteristic Note)
  pair.modeNotes.forEach((n, idx) => {
    columns.push({
      id: `modal-m-${colId++}`,
      notes: [{ stringNum: n.stringNum, fret: n.fret }],
      chordLabel: idx === 0 ? `${pair.tonicChord} [Modal Phrase]` : n.interval,
    });
  });

  // Round 2: Reference Phrase (Standard Scale)
  pair.refNotes.forEach((n, idx) => {
    columns.push({
      id: `modal-r-${colId++}`,
      notes: [{ stringNum: n.stringNum, fret: n.fret }],
      chordLabel: idx === 0 ? `${pair.tonicChord} [Reference Phrase]` : n.interval,
    });
  });

  return {
    id: 'modal-shift-exercise',
    title: `Modal Shift Drill: ${pair.name}`,
    tempoBpm: 90,
    timeSignature: '4/4',
    columns,
  };
}

// ──────────────────────────────────────────────────────────────
// Exercise 4: Chord-Tone Landing Targeter Generator
// ──────────────────────────────────────────────────────────────
export type ChordToneProgressionId = 'ii-v-i' | 'i-iv-v' | 'pop-c-am-f-g';

function generateChordToneExercise(progId: ChordToneProgressionId): TabTrack {
  const columns: TabColumn[] = [];
  let colId = 0;

  const progressions: Record<ChordToneProgressionId, { chord: string; tones: { stringNum: number; fret: number; interval: string }[] }[]> = {
    'ii-v-i': [
      { chord: 'Dm7 (ii)', tones: [{ stringNum: 5, fret: 5, interval: '1' }, { stringNum: 4, fret: 3, interval: 'b3' }, { stringNum: 4, fret: 7, interval: '5' }, { stringNum: 3, fret: 5, interval: 'b7' }] },
      { chord: 'G7 (V)', tones: [{ stringNum: 6, fret: 3, interval: '1' }, { stringNum: 5, fret: 2, interval: '3' }, { stringNum: 4, fret: 0, interval: '5' }, { stringNum: 4, fret: 3, interval: 'b7' }] },
      { chord: 'Cmaj7 (I)', tones: [{ stringNum: 5, fret: 3, interval: '1' }, { stringNum: 4, fret: 2, interval: '3' }, { stringNum: 4, fret: 5, interval: '5' }, { stringNum: 3, fret: 4, interval: '7' }] },
    ],
    'i-iv-v': [
      { chord: 'C Major (I)', tones: [{ stringNum: 5, fret: 3, interval: '1' }, { stringNum: 4, fret: 2, interval: '3' }, { stringNum: 4, fret: 5, interval: '5' }] },
      { chord: 'F Major (IV)', tones: [{ stringNum: 6, fret: 1, interval: '1' }, { stringNum: 5, fret: 3, interval: '5' }, { stringNum: 4, fret: 3, interval: '1' }] },
      { chord: 'G Major (V)', tones: [{ stringNum: 6, fret: 3, interval: '1' }, { stringNum: 5, fret: 2, interval: '3' }, { stringNum: 4, fret: 0, interval: '5' }] },
      { chord: 'C Major (I)', tones: [{ stringNum: 5, fret: 3, interval: '1' }, { stringNum: 4, fret: 2, interval: '3' }, { stringNum: 4, fret: 5, interval: '5' }] },
    ],
    'pop-c-am-f-g': [
      { chord: 'C Major', tones: [{ stringNum: 5, fret: 3, interval: '1' }, { stringNum: 4, fret: 2, interval: '3' }, { stringNum: 4, fret: 5, interval: '5' }] },
      { chord: 'A Minor', tones: [{ stringNum: 5, fret: 0, interval: '1' }, { stringNum: 4, fret: 2, interval: '5' }, { stringNum: 3, fret: 2, interval: 'b3' }] },
      { chord: 'F Major', tones: [{ stringNum: 6, fret: 1, interval: '1' }, { stringNum: 5, fret: 3, interval: '5' }, { stringNum: 4, fret: 3, interval: '1' }] },
      { chord: 'G Major', tones: [{ stringNum: 6, fret: 3, interval: '1' }, { stringNum: 5, fret: 2, interval: '3' }, { stringNum: 4, fret: 0, interval: '5' }] },
    ],
  };

  const selectedProg = progressions[progId];
  selectedProg.forEach((step) => {
    step.tones.forEach((t, idx) => {
      columns.push({
        id: `ct-${colId++}`,
        notes: [{ stringNum: t.stringNum, fret: t.fret }],
        chordLabel: idx === 0 ? step.chord : t.interval,
      });
    });
  });

  return {
    id: 'chord-tone-exercise',
    title: `Chord-Tone Landing Targeter: ${progId.toUpperCase()}`,
    tempoBpm: 90,
    timeSignature: '4/4',
    columns,
  };
}

// ──────────────────────────────────────────────────────────────
// Exercise 5: Tension & Resolution Generator
// ──────────────────────────────────────────────────────────────
export type TensionPairId = '4-to-3-major' | 'b2-to-1-phrygian' | 'sharp4-to-5-lydian' | 'b7-to-1-mixolydian';

function generateTensionResolutionExercise(pairId: TensionPairId): TabTrack {
  const columns: TabColumn[] = [];
  let colId = 0;

  const pairs: Record<TensionPairId, { name: string; chord: string; tension: { stringNum: number; fret: number; label: string }; resolution: { stringNum: number; fret: number; label: string } }> = {
    '4-to-3-major': {
      name: '4th Tension → 3rd Major Resolution (F → E)',
      chord: 'C Major',
      tension: { stringNum: 4, fret: 3, label: 'Tension (4: F)' },
      resolution: { stringNum: 4, fret: 2, label: 'Resolve (3: E)' },
    },
    'b2-to-1-phrygian': {
      name: '♭2 Phrygian Tension → 1 Root Resolution (F → E)',
      chord: 'Em7 (Phrygian)',
      tension: { stringNum: 6, fret: 1, label: 'Tension (♭2: F)' },
      resolution: { stringNum: 6, fret: 0, label: 'Resolve (1: E)' },
    },
    'sharp4-to-5-lydian': {
      name: '♯4 Lydian Tension → 5th Resolution (F# → G)',
      chord: 'Cmaj7 (Lydian)',
      tension: { stringNum: 4, fret: 4, label: 'Tension (♯4: F#)' },
      resolution: { stringNum: 4, fret: 5, label: 'Resolve (5: G)' },
    },
    'b7-to-1-mixolydian': {
      name: '♭7 Mixolydian Tension → 1 Root Resolution (F → G)',
      chord: 'G7 (Mixolydian)',
      tension: { stringNum: 4, fret: 3, label: 'Tension (♭7: F)' },
      resolution: { stringNum: 6, fret: 3, label: 'Resolve (1: G)' },
    },
  };

  const selectedPair = pairs[pairId];

  for (let r = 0; r < 3; r++) {
    columns.push({
      id: `tr-t-${colId++}`,
      notes: [{ stringNum: selectedPair.tension.stringNum, fret: selectedPair.tension.fret }],
      chordLabel: `${selectedPair.chord} — ${selectedPair.tension.label}`,
    });

    columns.push({
      id: `tr-r-${colId++}`,
      notes: [{ stringNum: selectedPair.resolution.stringNum, fret: selectedPair.resolution.fret }],
      chordLabel: `${selectedPair.resolution.label}`,
    });
  }

  return {
    id: 'tension-resolution-exercise',
    title: `Tension & Resolution: ${selectedPair.name}`,
    tempoBpm: 80,
    timeSignature: '4/4',
    columns,
  };
}

// ──────────────────────────────────────────────────────────────
// Exercises Studio Component
// ──────────────────────────────────────────────────────────────
export type ExerciseType = 'spider' | 'strum' | 'modal-shift' | 'chord-tone' | 'tension-resolution';

export const ExercisesStudio: React.FC = () => {
  const [selectedExercise, setSelectedExercise] = useState<ExerciseType>('spider');

  // Exercise 1: Spider state
  const [startFret, setStartFret] = useState<number>(1);
  const [numPositions, setNumPositions] = useState<number>(4);
  const [direction, setDirection] = useState<SpiderDirection>('updown');
  const [pattern, setPattern] = useState<SpiderPattern>('1-2-3-4');

  // Exercise 2: Strumming state
  const [strumPatternId, setStrumPatternId] = useState<string>('alt-8ths');
  const [strumProgressionId, setStrumProgressionId] = useState<string>('pop-c-am-f-g');
  const [repeatsPerChord, setRepeatsPerChord] = useState<number>(2);

  // Exercise 3: Modal Characteristic Shift state
  const [modalPairId, setModalPairId] = useState<ModalShiftPair>('dorian-aeolian');

  // Exercise 4: Chord Tone Targeter state
  const [chordToneProgId, setChordToneProgId] = useState<ChordToneProgressionId>('ii-v-i');

  // Exercise 5: Tension & Resolution state
  const [tensionPairId, setTensionPairId] = useState<TensionPairId>('4-to-3-major');

  const [bpm, setBpm] = useGlobalBpm();
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeColIndex, setActiveColIndex] = useState<number>(-1);

  const playbackRef = useRef<number>(-1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const track = React.useMemo(
    () => {
      let t: TabTrack;
      if (selectedExercise === 'spider') {
        t = generateSpiderExercise(startFret, numPositions, direction, pattern);
      } else if (selectedExercise === 'strum') {
        t = generateStrumExercise(strumPatternId, strumProgressionId, repeatsPerChord);
      } else if (selectedExercise === 'modal-shift') {
        t = generateModalShiftExercise(modalPairId);
      } else if (selectedExercise === 'chord-tone') {
        t = generateChordToneExercise(chordToneProgId);
      } else {
        t = generateTensionResolutionExercise(tensionPairId);
      }
      t.tempoBpm = bpm;
      return t;
    },
    [
      selectedExercise,
      startFret,
      numPositions,
      direction,
      pattern,
      strumPatternId,
      strumProgressionId,
      repeatsPerChord,
      modalPairId,
      chordToneProgId,
      tensionPairId,
      bpm,
    ]
  );

  // Playback engine
  useEffect(() => {
    if (isPlaying) {
      playbackRef.current = -1;
      const stepMs = Math.round((60000 / bpm) / 2); // 8th notes

      const tick = () => {
        playbackRef.current += 1;
        if (playbackRef.current >= track.columns.length) {
          // Stop at end (no loop for exercises)
          setIsPlaying(false);
          setActiveColIndex(-1);
          return;
        }

        const idx = playbackRef.current;
        setActiveColIndex(idx);

        const col = track.columns[idx] as ExtendedTabColumn;
        if (col?.notes?.length > 0) {
          const isUpstroke = col.strokeType === 'up';
          col.notes.forEach((note, noteIdx) => {
            const freq = getFrequencyForStringAndFret(note.stringNum, note.fret);
            // Stagger direction: Downstroke strums low-to-high (6->1), Upstroke strums high-to-low (1->6)
            const staggerSec = isUpstroke ? (6 - note.stringNum) * 0.012 : (note.stringNum - 1) * 0.012;
            playPluckedNote(freq, Math.max(0, staggerSec), 1.6, 0.35, note.stringNum, getGuitarPreset());
          });
        }
      };

      tick();
      intervalRef.current = setInterval(tick, stepMs);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setActiveColIndex(-1);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, bpm, track]);

  const handleStop = () => setIsPlaying(false);
  const handlePlay = () => {
    if (isPlaying) return;
    playbackRef.current = -1;
    setIsPlaying(true);
  };
  const handleRestart = () => {
    setIsPlaying(false);
    setTimeout(() => {
      playbackRef.current = -1;
      setIsPlaying(true);
    }, 50);
  };

  const directionOptions: { value: SpiderDirection; label: string; icon: React.ReactNode }[] = [
    { value: 'up', label: 'Ascending', icon: <ChevronUp className="h-4 w-4" /> },
    { value: 'down', label: 'Descending', icon: <ChevronDown className="h-4 w-4" /> },
    { value: 'updown', label: 'Up & Down', icon: <ChevronsUpDown className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Exercise Selection Switcher Header */}
      <div className="p-6 rounded-2xl glass-panel border border-border/40 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-amber-400" />
              <h3 className="text-2xl font-extrabold tracking-tight">Guitar Technical Exercises</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Master finger independence, alternate picking, and rhythm strumming patterns with interactive score playback.
            </p>
          </div>

          {/* 5-Way Prominent Exercise Selection Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800 shadow-inner">
            <Button
              size="sm"
              variant={selectedExercise === 'spider' ? 'default' : 'ghost'}
              onClick={() => { setIsPlaying(false); setSelectedExercise('spider'); }}
              className={`gap-1.5 text-xs font-bold transition-all ${selectedExercise === 'spider' ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>1. Spider Drill</span>
            </Button>
            <Button
              size="sm"
              variant={selectedExercise === 'strum' ? 'default' : 'ghost'}
              onClick={() => { setIsPlaying(false); setSelectedExercise('strum'); }}
              className={`gap-1.5 text-xs font-bold transition-all ${selectedExercise === 'strum' ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md font-black' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <ChevronsUpDown className="h-3.5 w-3.5" />
              <span>2. Strum & Pick</span>
            </Button>
            <Button
              size="sm"
              variant={selectedExercise === 'modal-shift' ? 'default' : 'ghost'}
              onClick={() => { setIsPlaying(false); setSelectedExercise('modal-shift'); }}
              className={`gap-1.5 text-xs font-bold transition-all ${selectedExercise === 'modal-shift' ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-md font-black' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Music className="h-3.5 w-3.5" />
              <span>3. Modal Shift (Characteristic)</span>
            </Button>
            <Button
              size="sm"
              variant={selectedExercise === 'chord-tone' ? 'default' : 'ghost'}
              onClick={() => { setIsPlaying(false); setSelectedExercise('chord-tone'); }}
              className={`gap-1.5 text-xs font-bold transition-all ${selectedExercise === 'chord-tone' ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-md font-black' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Dumbbell className="h-3.5 w-3.5" />
              <span>4. Chord-Tone Targeter</span>
            </Button>
            <Button
              size="sm"
              variant={selectedExercise === 'tension-resolution' ? 'default' : 'ghost'}
              onClick={() => { setIsPlaying(false); setSelectedExercise('tension-resolution'); }}
              className={`gap-1.5 text-xs font-bold transition-all ${selectedExercise === 'tension-resolution' ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-md font-black' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>5. Tension & Resolution</span>
            </Button>
          </div>
        </div>

        {/* ========================================================== */}
        {/* EXERCISE 1: SPIDER DRILL */}
        {/* ========================================================== */}
        {selectedExercise === 'spider' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-lg tracking-tight">Exercise 1: Spider Exercise (Chromatic Finger Independence)</h4>
                <p className="text-xs text-muted-foreground">
                  The classic 1-2-3-4 finger independence drill. Play 4 consecutive chromatic frets per string,
                  shifting across all 6 strings, then move up one fret position and repeat.
                </p>
              </div>
            </div>

            {/* Controls Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* Starting Fret */}
              <div className="p-4 rounded-xl bg-muted/30 border border-border/40 space-y-3">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Starting Fret</label>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[startFret]}
                    onValueChange={(v) => { setIsPlaying(false); setStartFret(v[0]); }}
                    min={1}
                    max={12}
                    step={1}
                    className="flex-1"
                  />
                  <Badge variant="secondary" className="font-mono text-sm min-w-[2rem] justify-center">{startFret}</Badge>
                </div>
              </div>

              {/* Number of Positions */}
              <div className="p-4 rounded-xl bg-muted/30 border border-border/40 space-y-3">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Positions (Shifts)</label>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[numPositions]}
                    onValueChange={(v) => { setIsPlaying(false); setNumPositions(v[0]); }}
                    min={1}
                    max={8}
                    step={1}
                    className="flex-1"
                  />
                  <Badge variant="secondary" className="font-mono text-sm min-w-[2rem] justify-center">{numPositions}</Badge>
                </div>
              </div>

              {/* BPM */}
              <div className="p-4 rounded-xl bg-muted/30 border border-border/40 space-y-3">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tempo (BPM)</label>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[bpm]}
                    onValueChange={(v) => setBpm(v[0])}
                    min={40}
                    max={200}
                    step={5}
                    className="flex-1"
                  />
                  <Badge variant="secondary" className="font-mono text-sm min-w-[3rem] justify-center">{bpm}</Badge>
                </div>
              </div>

              {/* Finger Pattern Permutation */}
              <div className="p-4 rounded-xl bg-muted/30 border border-border/40 space-y-3">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Finger Pattern</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['1-2-3-4', '4-3-2-1', '1-3-2-4', '1-4-2-3'] as SpiderPattern[]).map(pat => (
                    <Button
                      key={pat}
                      size="sm"
                      variant={pattern === pat ? 'default' : 'outline'}
                      onClick={() => { setIsPlaying(false); setPattern(pat); }}
                      className="gap-1 text-[11px] font-mono font-bold h-7"
                    >
                      {pat}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center gap-3 border-t border-border/30 pt-4">
              <Button
                onClick={isPlaying ? handleStop : handlePlay}
                className={`gap-2 font-bold ${isPlaying ? 'bg-red-600 hover:bg-red-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}
              >
                {isPlaying ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isPlaying ? 'Stop' : 'Play Exercise'}
              </Button>

              <Button variant="outline" onClick={handleRestart} className="gap-2 font-bold">
                <RotateCcw className="h-4 w-4" />
                Restart
              </Button>

              <div className="flex items-center gap-2 ml-auto text-xs text-muted-foreground">
                <Music className="h-4 w-4 text-amber-400" />
                <span className="font-mono font-bold">{track.columns.length} notes</span>
                <span>•</span>
                <span className="font-mono">
                  ~{Math.round(track.columns.length * (60000 / bpm / 2) / 1000)}s
                </span>
              </div>
            </div>

            {/* Live Playback Active Note HUD */}
            {activeColIndex >= 0 && track.columns[activeColIndex] && (() => {
              const col = track.columns[activeColIndex];
              const note = col.notes[0];
              const stringNames = ['', '1 (High E)', '2 (B)', '3 (G)', '4 (D)', '5 (A)', '6 (Low E)'];

              return (
                <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-emerald-500/10 border border-amber-500/30 flex items-center justify-between shadow-lg animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black font-mono text-lg shadow-md">
                      {note ? `${note.fret}` : '-'}
                    </div>
                    <div>
                      <div className="font-extrabold text-sm flex items-center gap-2 text-foreground">
                        <span>String {stringNames[note?.stringNum || 1]}</span>
                        <Badge variant="secondary" className="font-mono text-[10px] bg-primary/20 text-primary border-primary/30">
                          Fret {note?.fret}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Step {activeColIndex + 1} of {track.columns.length} &bull; {col.chordLabel || 'Moving in sequence'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">Active Fingering</span>
                    <span className="font-mono font-black text-base text-emerald-400">
                      Finger {note ? `${((note.fret - 1) % 4) + 1}` : '-'}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Fingering Guide */}
            <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 space-y-2">
              <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Fingering Guide</h5>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-mono font-bold text-sm">1</span>
                  <span className="text-muted-foreground">Index finger → Fret {startFret}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-blue-500 text-white flex items-center justify-center font-mono font-bold text-sm">2</span>
                  <span className="text-muted-foreground">Middle finger → Fret {startFret + 1}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-purple-500 text-white flex items-center justify-center font-mono font-bold text-sm">3</span>
                  <span className="text-muted-foreground">Ring finger → Fret {startFret + 2}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-pink-500 text-white flex items-center justify-center font-mono font-bold text-sm">4</span>
                  <span className="text-muted-foreground">Pinky finger → Fret {startFret + 3}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* EXERCISE 2: UP/DOWN STRUM & ALTERNATE PICKING PRACTICER */}
        {/* ========================================================== */}
        {selectedExercise === 'strum' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center shadow-lg">
                <ChevronsUpDown className="h-4 w-4 text-slate-950 font-bold" />
              </div>
              <div>
                <h4 className="font-bold text-lg tracking-tight">Exercise 2: Up/Down Strum & Alternate Picking Practicer</h4>
                <p className="text-xs text-muted-foreground">
                  Select a strumming pattern and progression to practice strict downstrokes (↓), upstrokes (↑), and syncopated rhythmic feels.
                </p>
              </div>
            </div>

            {/* Pattern & Progression Selector Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. Strum Pattern Picker */}
              <div className="p-4 rounded-xl bg-muted/30 border border-border/40 space-y-3">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Select Strumming / Picking Pattern:</label>
                <div className="space-y-2">
                  {STRUM_PATTERNS.map(pat => (
                    <button
                      key={`pat-${pat.id}`}
                      onClick={() => { setIsPlaying(false); setStrumPatternId(pat.id); }}
                      className={`w-full p-3 rounded-xl border text-left transition-all ${
                        strumPatternId === pat.id
                          ? 'border-amber-400 bg-amber-400/10 text-amber-300 font-bold shadow-md ring-1 ring-amber-400/30'
                          : 'border-border/60 hover:bg-muted text-muted-foreground'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span>{pat.name}</span>
                      </div>
                      <p className="text-[11px] opacity-80 mt-1 font-normal">{pat.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Progression & Settings Picker */}
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-muted/30 border border-border/40 space-y-3">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Select Chord Progression / Drill:</label>
                  <div className="space-y-2">
                    {EXERCISE_PROGRESSIONS.map(prog => (
                      <button
                        key={`prog-${prog.id}`}
                        onClick={() => { setIsPlaying(false); setStrumProgressionId(prog.id); }}
                        className={`w-full p-3 rounded-xl border text-left transition-all ${
                          strumProgressionId === prog.id
                            ? 'border-primary bg-primary/15 text-primary font-bold shadow-md ring-1 ring-primary/30'
                            : 'border-border/60 hover:bg-muted text-muted-foreground'
                        }`}
                      >
                        <div className="text-xs font-bold">{prog.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tempo & Repeats Sliders */}
                <div className="p-4 rounded-xl bg-muted/30 border border-border/40 space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tempo (BPM)</label>
                    <div className="flex items-center gap-3">
                      <Slider
                        value={[bpm]}
                        onValueChange={(v) => setBpm(v[0])}
                        min={40}
                        max={200}
                        step={5}
                        className="flex-1"
                      />
                      <Badge variant="secondary" className="font-mono text-sm min-w-[3rem] justify-center">{bpm}</Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Repeats Per Chord</label>
                    <div className="flex items-center gap-3">
                      <Slider
                        value={[repeatsPerChord]}
                        onValueChange={(v) => { setIsPlaying(false); setRepeatsPerChord(v[0]); }}
                        min={1}
                        max={4}
                        step={1}
                        className="flex-1"
                      />
                      <Badge variant="secondary" className="font-mono text-sm min-w-[2rem] justify-center">{repeatsPerChord}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center gap-3 border-t border-border/30 pt-4">
              <Button
                onClick={isPlaying ? handleStop : handlePlay}
                className={`gap-2 font-bold ${isPlaying ? 'bg-red-600 hover:bg-red-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}
              >
                {isPlaying ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isPlaying ? 'Stop Strum Practice' : 'Start Strum Practice'}
              </Button>

              <Button variant="outline" onClick={handleRestart} className="gap-2 font-bold">
                <RotateCcw className="h-4 w-4" />
                Restart
              </Button>

              <div className="flex items-center gap-2 ml-auto text-xs text-muted-foreground">
                <Music className="h-4 w-4 text-amber-400" />
                <span className="font-mono font-bold">{track.columns.length} beats</span>
              </div>
            </div>

            {/* Real-time Pick Direction & Strum HUD */}
            {activeColIndex >= 0 && track.columns[activeColIndex] && (() => {
              const col = track.columns[activeColIndex] as ExtendedTabColumn;
              const stroke = col.strokeType || 'down';
              const strokeName = stroke === 'down' ? 'DOWNSTROKE (↓)' : stroke === 'up' ? 'UPSTROKE (↑)' : stroke === 'mute' ? 'MUTED SCRATCH (x)' : 'REST (–)';
              const strokeColor = stroke === 'down' ? 'bg-amber-400 text-slate-950 border-amber-300' : stroke === 'up' ? 'bg-sky-400 text-slate-950 border-sky-300' : 'bg-emerald-500 text-white border-emerald-400';

              return (
                <div className="p-5 rounded-xl bg-gradient-to-r from-amber-500/15 via-purple-500/15 to-emerald-500/15 border border-amber-400/40 flex items-center justify-between shadow-xl animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black font-mono text-2xl shadow-lg border ${strokeColor}`}>
                      {stroke === 'down' ? '↓' : stroke === 'up' ? '↑' : stroke === 'mute' ? 'x' : '–'}
                    </div>
                    <div>
                      <div className="font-extrabold text-base flex items-center gap-2 text-foreground">
                        <span>{strokeName}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Beat Step {activeColIndex + 1} of {track.columns.length} &bull; Label: {col.chordLabel || 'Strumming'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">Stroke Direction</span>
                    <span className="font-mono font-black text-lg text-amber-300">
                      {stroke.toUpperCase()}
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ========================================================== */}
        {/* EXERCISE 3: MODAL CHARACTERISTIC & MODAL SHIFT DRILL */}
        {/* ========================================================== */}
        {selectedExercise === 'modal-shift' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-purple-500 to-indigo-400 flex items-center justify-center shadow-lg">
                <Music className="h-4 w-4 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-lg tracking-tight">Exercise 3: Modal Characteristic & Modal Shift Drill</h4>
                <p className="text-xs text-muted-foreground">
                  Hear and see the exact mode-defining characteristic note (e.g. Dorian natural 6th vs Aeolian flat 6th).
                  Compare the modal color shift directly against the reference scale over a tonic chord.
                </p>
              </div>
            </div>

            {/* Pair Selector Buttons Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {(Object.keys(MODAL_SHIFT_PAIRS) as ModalShiftPair[]).map(pairKey => {
                const pair = MODAL_SHIFT_PAIRS[pairKey];
                const isSel = modalPairId === pairKey;

                return (
                  <button
                    key={`modal-pair-${pairKey}`}
                    onClick={() => { setIsPlaying(false); setModalPairId(pairKey); }}
                    className={`p-3.5 rounded-xl border text-left text-xs transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                      isSel
                        ? 'border-purple-400 bg-purple-500/20 text-purple-200 ring-2 ring-purple-400/40 font-bold shadow-lg'
                        : 'border-border/60 bg-slate-950/40 hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-foreground">{pair.name}</span>
                      <Badge variant="outline" className="text-[10px] font-mono text-purple-300 border-purple-400/30">{pair.tonicChord}</Badge>
                    </div>
                    <p className="text-[11px] opacity-80 font-normal">{pair.description}</p>
                  </button>
                );
              })}
            </div>

            {/* Playback Controls */}
            <div className="flex items-center gap-3 border-t border-border/30 pt-4">
              <Button
                onClick={isPlaying ? handleStop : handlePlay}
                className={`gap-2 font-bold ${isPlaying ? 'bg-red-600 hover:bg-red-500' : 'bg-purple-600 hover:bg-purple-500'}`}
              >
                {isPlaying ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isPlaying ? 'Stop Modal Drill' : 'Start Modal Shift Drill'}
              </Button>

              <Button variant="outline" onClick={handleRestart} className="gap-2 font-bold">
                <RotateCcw className="h-4 w-4" />
                Restart
              </Button>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* EXERCISE 4: CHORD-TONE LANDING TARGETER */}
        {/* ========================================================== */}
        {selectedExercise === 'chord-tone' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-sky-500 to-blue-400 flex items-center justify-center shadow-lg">
                <Dumbbell className="h-4 w-4 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-lg tracking-tight">Exercise 4: Chord-Tone Landing Targeter</h4>
                <p className="text-xs text-muted-foreground">
                  Train your fingers and ear to target stable chord tones (1, 3, 5, 7) on chord changes.
                  Master harmonic voice leading across ii - V - I and standard progression shifts.
                </p>
              </div>
            </div>

            {/* Progression Selector Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'ii-v-i' as ChordToneProgressionId, name: 'ii - V - I Jazz Standard (Dm7 → G7 → Cmaj7)', desc: 'Land on 1, 3, 5, 7 over minor 7th, dominant 7th, and major 7th chords.' },
                { id: 'i-iv-v' as ChordToneProgressionId, name: 'I - IV - V Rock/Blues (C → F → G)', desc: 'Classic triad targeting across major chord progression shifts.' },
                { id: 'pop-c-am-f-g' as ChordToneProgressionId, name: 'Pop Progression (C → Am → F → G)', desc: 'Four-chord chord-tone targeting pattern.' },
              ].map(prog => {
                const isSel = chordToneProgId === prog.id;

                return (
                  <button
                    key={`ct-prog-${prog.id}`}
                    onClick={() => { setIsPlaying(false); setChordToneProgId(prog.id); }}
                    className={`p-3.5 rounded-xl border text-left text-xs transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                      isSel
                        ? 'border-sky-400 bg-sky-500/20 text-sky-200 ring-2 ring-sky-400/40 font-bold shadow-lg'
                        : 'border-border/60 bg-slate-950/40 hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    <span className="font-extrabold text-foreground">{prog.name}</span>
                    <p className="text-[11px] opacity-80 font-normal">{prog.desc}</p>
                  </button>
                );
              })}
            </div>

            {/* Playback Controls */}
            <div className="flex items-center gap-3 border-t border-border/30 pt-4">
              <Button
                onClick={isPlaying ? handleStop : handlePlay}
                className={`gap-2 font-bold ${isPlaying ? 'bg-red-600 hover:bg-red-500' : 'bg-sky-600 hover:bg-sky-500'}`}
              >
                {isPlaying ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isPlaying ? 'Stop Chord-Tone Drill' : 'Start Chord-Tone Drill'}
              </Button>

              <Button variant="outline" onClick={handleRestart} className="gap-2 font-bold">
                <RotateCcw className="h-4 w-4" />
                Restart
              </Button>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* EXERCISE 5: TENSION & RESOLUTION TRAINER */}
        {/* ========================================================== */}
        {selectedExercise === 'tension-resolution' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-rose-500 to-pink-400 flex items-center justify-center shadow-lg">
                <RotateCcw className="h-4 w-4 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-lg tracking-tight">Exercise 5: Tension & Resolution Trainer</h4>
                <p className="text-xs text-muted-foreground">
                  Learn how unstable tension notes (e.g. 4th, ♭2, ♯4) resolve into stable target chord tones (3rd, root, 5th).
                </p>
              </div>
            </div>

            {/* Tension Pair Selector Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { id: '4-to-3-major' as TensionPairId, name: '4 → 3 Major (F → E)', desc: '4th scale degree resolving to Major 3rd over C Major.' },
                { id: 'b2-to-1-phrygian' as TensionPairId, name: '♭2 → 1 Phrygian (F → E)', desc: 'Tense Phrygian flat 2nd resolving to Root over Em7.' },
                { id: 'sharp4-to-5-lydian' as TensionPairId, name: '♯4 → 5 Lydian (F# → G)', desc: 'Floating Lydian raised 4th resolving to 5th over Cmaj7.' },
                { id: 'b7-to-1-mixolydian' as TensionPairId, name: '♭7 → 1 Mixolydian (F → G)', desc: 'Dominant flat 7th resolving to Root over G7.' },
              ].map(pair => {
                const isSel = tensionPairId === pair.id;

                return (
                  <button
                    key={`tr-pair-${pair.id}`}
                    onClick={() => { setIsPlaying(false); setTensionPairId(pair.id); }}
                    className={`p-3.5 rounded-xl border text-left text-xs transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                      isSel
                        ? 'border-rose-400 bg-rose-500/20 text-rose-200 ring-2 ring-rose-400/40 font-bold shadow-lg'
                        : 'border-border/60 bg-slate-950/40 hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    <span className="font-extrabold text-foreground">{pair.name}</span>
                    <p className="text-[11px] opacity-80 font-normal">{pair.desc}</p>
                  </button>
                );
              })}
            </div>

            {/* Playback Controls */}
            <div className="flex items-center gap-3 border-t border-border/30 pt-4">
              <Button
                onClick={isPlaying ? handleStop : handlePlay}
                className={`gap-2 font-bold ${isPlaying ? 'bg-red-600 hover:bg-red-500' : 'bg-rose-600 hover:bg-rose-500'}`}
              >
                {isPlaying ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isPlaying ? 'Stop Resolution Drill' : 'Start Tension & Resolution Drill'}
              </Button>

              <Button variant="outline" onClick={handleRestart} className="gap-2 font-bold">
                <RotateCcw className="h-4 w-4" />
                Restart
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Tab Score Renderer */}
      <TabRenderer
        track={track}
        activeColumnIndex={activeColIndex}
        className="shadow-2xl"
      />
    </div>
  );
};
