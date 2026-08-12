import { ScaleDefinition, FretboardNote } from '../types/scale';
import { getFrequencyForStringAndFret } from './audioSynth';

export const NOTES_CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const INTERVAL_LABELS_MAP: Record<number, string> = {
  0: '1',
  1: 'b2',
  2: '2',
  3: 'b3',
  4: '3',
  5: '4',
  6: 'b5',
  7: '5',
  8: 'b6',
  9: '6',
  10: 'b7',
  11: '7',
};

// 16 Diatonic, Non-Diatonic, Pentatonic & Exotic Scales (ToneGym Reference)
export const SCALE_DEFINITIONS: ScaleDefinition[] = [
  // --- Diatonic Modes ---
  {
    id: 'major',
    name: 'Major (Ionian)',
    category: 'diatonic',
    intervals: [0, 2, 4, 5, 7, 9, 11],
    intervalNames: ['1', '2', '3', '4', '5', '6', '7'],
    description: 'The foundation of Western music harmony (W-W-H-W-W-W-H).',
  },
  {
    id: 'dorian',
    name: 'Dorian',
    category: 'diatonic',
    intervals: [0, 2, 3, 5, 7, 9, 10],
    intervalNames: ['1', '2', 'b3', '4', '5', '6', 'b7'],
    description: 'Minor mode with a bright natural 6th. Popular in Jazz and Funk.',
  },
  {
    id: 'phrygian',
    name: 'Phrygian',
    category: 'diatonic',
    intervals: [0, 1, 3, 5, 7, 8, 10],
    intervalNames: ['1', 'b2', 'b3', '4', '5', 'b6', 'b7'],
    description: 'Dark, tense minor mode with a flat 2nd. Common in Flamenco & Metal.',
  },
  {
    id: 'lydian',
    name: 'Lydian',
    category: 'diatonic',
    intervals: [0, 2, 4, 6, 7, 9, 11],
    intervalNames: ['1', '2', '3', '#4', '5', '6', '7'],
    description: 'Dreamy major mode with a raised 4th. Used in film scores.',
  },
  {
    id: 'mixolydian',
    name: 'Mixolydian',
    category: 'diatonic',
    intervals: [0, 2, 4, 5, 7, 9, 10],
    intervalNames: ['1', '2', '3', '4', '5', '6', 'b7'],
    description: 'Bluesy major mode with a flat 7th. Key scale for Classic Rock & Blues.',
  },
  {
    id: 'natural-minor',
    name: 'Natural Minor (Aeolian)',
    category: 'diatonic',
    intervals: [0, 2, 3, 5, 7, 8, 10],
    intervalNames: ['1', '2', 'b3', '4', '5', 'b6', 'b7'],
    description: 'Pure minor tonality (W-H-W-W-H-W-W). Introspective & emotional.',
  },
  {
    id: 'locrian',
    name: 'Locrian',
    category: 'diatonic',
    intervals: [0, 1, 3, 5, 6, 8, 10],
    intervalNames: ['1', 'b2', 'b3', '4', 'b5', 'b6', 'b7'],
    description: 'Diminished mode with flat 2nd and flat 5th. Unstable & dissonant.',
  },

  // --- Non-Diatonic Scales ---
  {
    id: 'harmonic-minor',
    name: 'Harmonic Minor',
    category: 'non-diatonic',
    intervals: [0, 2, 3, 5, 7, 8, 11],
    intervalNames: ['1', '2', 'b3', '4', '5', 'b6', '7'],
    description: 'Minor scale with a raised natural 7th leading tone. Classical & Neoclassical.',
  },
  {
    id: 'melodic-minor',
    name: 'Melodic Minor',
    category: 'non-diatonic',
    intervals: [0, 2, 3, 5, 7, 9, 11],
    intervalNames: ['1', '2', 'b3', '4', '5', '6', '7'],
    description: 'Minor 3rd with major 6th and 7th. Essential for Modern Jazz.',
  },
  {
    id: 'phrygian-dominant',
    name: 'Phrygian Dominant (Spanish)',
    category: 'non-diatonic',
    intervals: [0, 1, 4, 5, 7, 8, 10],
    intervalNames: ['1', 'b2', '3', '4', '5', 'b6', 'b7'],
    description: '5th mode of Harmonic Minor. Exotic Spanish Flamenco & Middle Eastern tone.',
  },
  {
    id: 'hungarian-minor',
    name: 'Hungarian Minor (Gypsy)',
    category: 'non-diatonic',
    intervals: [0, 2, 3, 6, 7, 8, 11],
    intervalNames: ['1', '2', 'b3', '#4', '5', 'b6', '7'],
    description: 'Harmonic Minor with a raised 4th. Dramatic Eastern European sound.',
  },

  // --- Pentatonic & Blues Scales ---
  {
    id: 'major-pentatonic',
    name: 'Major Pentatonic',
    category: 'pentatonic-blues',
    intervals: [0, 2, 4, 7, 9],
    intervalNames: ['1', '2', '3', '5', '6'],
    description: '5-note major scale omitting 4th and 7th. Bright, melodic Americana.',
  },
  {
    id: 'minor-pentatonic',
    name: 'Minor Pentatonic',
    category: 'pentatonic-blues',
    intervals: [0, 3, 5, 7, 10],
    intervalNames: ['1', 'b3', '4', '5', 'b7'],
    description: 'The premier 5-note lead guitar scale for Rock, Blues, and Soloing.',
  },
  {
    id: 'blues-scale',
    name: 'Blues Scale (Hexatonic)',
    category: 'pentatonic-blues',
    intervals: [0, 3, 5, 6, 7, 10],
    intervalNames: ['1', 'b3', '4', 'b5', '5', 'b7'],
    description: 'Minor Pentatonic plus the chromatic "blue note" (b5 tritone).',
  },

  // --- Exotic Scales ---
  {
    id: 'whole-tone',
    name: 'Whole Tone Scale',
    category: 'exotic',
    intervals: [0, 2, 4, 6, 8, 10],
    intervalNames: ['1', '2', '3', '#4', '#5', 'b7'],
    description: 'Symmetrical 6-note scale composed entirely of whole steps. Floating & mysterious.',
  },
  {
    id: 'hirajoshi',
    name: 'Hirajoshi (Japanese)',
    category: 'exotic',
    intervals: [0, 2, 3, 7, 8],
    intervalNames: ['1', '2', 'b3', '5', 'b6'],
    description: 'Traditional Japanese pentatonic scale. Introspective & atmospheric.',
  },
];

// Open string base pitch semitones from C0
const STRING_OPEN_NOTES: Record<number, { note: string; octave: number }> = {
  1: { note: 'E', octave: 4 }, // High E
  2: { note: 'B', octave: 3 },
  3: { note: 'G', octave: 3 },
  4: { note: 'D', octave: 3 },
  5: { note: 'A', octave: 2 },
  6: { note: 'E', octave: 2 }, // Low E
};

/**
 * Returns note name and octave for a string and fret
 */
export function getNoteForStringAndFret(stringNum: number, fret: number): { noteName: string; octave: number } {
  const base = STRING_OPEN_NOTES[stringNum] || { note: 'E', octave: 2 };
  const baseIdx = NOTES_CHROMATIC.indexOf(base.note);
  const totalIdx = baseIdx + fret;

  const noteIdx = totalIdx % 12;
  const octaveOffset = Math.floor(totalIdx / 12);
  const noteName = NOTES_CHROMATIC[noteIdx];
  const octave = base.octave + octaveOffset;

  return { noteName, octave };
}

/**
 * Returns all notes in a scale starting from a given root
 */
export function getScaleNotes(rootNote: string, scaleId: string): { noteName: string; interval: string; isRoot: boolean }[] {
  const scale = SCALE_DEFINITIONS.find(s => s.id === scaleId) || SCALE_DEFINITIONS[0];
  const rootIdx = NOTES_CHROMATIC.indexOf(rootNote);

  return scale.intervals.map((semitones, i) => {
    const noteIdx = (rootIdx + semitones) % 12;
    const noteName = NOTES_CHROMATIC[noteIdx];
    const interval = scale.intervalNames[i] || INTERVAL_LABELS_MAP[semitones] || '1';
    return {
      noteName,
      interval,
      isRoot: semitones === 0,
    };
  });
}

/**
 * Maps scale notes across the entire 6-string 22-fret guitar fretboard
 */
export function generateFretboardScale(
  rootNote: string,
  scaleId: string,
  totalFrets: number = 21
): FretboardNote[] {
  const scaleNotes = getScaleNotes(rootNote, scaleId);
  const scaleNoteNames = new Set(scaleNotes.map(n => n.noteName));
  const fretboardNotes: FretboardNote[] = [];

  for (let s = 1; s <= 6; s++) {
    for (let f = 0; f <= totalFrets; f++) {
      const { noteName, octave } = getNoteForStringAndFret(s, f);
      const isMatch = scaleNoteNames.has(noteName);

      if (isMatch) {
        const matchingScaleItem = scaleNotes.find(n => n.noteName === noteName)!;
        const freq = getFrequencyForStringAndFret(s, f);

        fretboardNotes.push({
          stringNum: s,
          fret: f,
          noteName,
          octave,
          freq,
          interval: matchingScaleItem.interval,
          isRoot: matchingScaleItem.isRoot,
          isEnabled: true, // Enabled by default
        });
      }
    }
  }

  return fretboardNotes;
}
