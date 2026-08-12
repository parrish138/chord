import { ScaleDefinition, FretboardNote, NoteRole } from '../types/scale';
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
  {
    id: 'all-notes',
    name: 'All Chromatic Notes (No Scale / Full Neck)',
    category: 'all-notes',
    intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    intervalNames: ['1', 'b2', '2', 'b3', '3', '4', 'b5', '5', 'b6', '6', 'b7', '7'],
    description: 'Shows and enables all 12 chromatic notes across all 24 frets of the fretboard.',
  },
  // --- Diatonic Modes ---
  {
    id: 'major',
    name: 'Major (Ionian)',
    category: 'diatonic',
    intervals: [0, 2, 4, 5, 7, 9, 11],
    intervalNames: ['1', '2', '3', '4', '5', '6', '7'],
    description: 'The foundation of Western music harmony (W-W-H-W-W-W-H).',
    tonicChordQuality: 'maj7',
    chordTones: ['1', '3', '5', '7'],
    characteristicTones: ['4'],
    colourTones: ['2', '6'],
    modalComparison: { referenceMode: 'Lydian', diffLabel: 'Natural 4th (4) instead of ♯4' },
  },
  {
    id: 'dorian',
    name: 'Dorian',
    category: 'diatonic',
    intervals: [0, 2, 3, 5, 7, 9, 10],
    intervalNames: ['1', '2', 'b3', '4', '5', '6', 'b7'],
    description: 'Minor mode with a bright natural 6th. Popular in Jazz and Funk.',
    tonicChordQuality: 'm7',
    chordTones: ['1', 'b3', '5', 'b7'],
    characteristicTones: ['6'],
    colourTones: ['2', '4'],
    modalComparison: { referenceMode: 'Aeolian', diffLabel: 'Natural 6th (6) instead of ♭6' },
  },
  {
    id: 'phrygian',
    name: 'Phrygian',
    category: 'diatonic',
    intervals: [0, 1, 3, 5, 7, 8, 10],
    intervalNames: ['1', 'b2', 'b3', '4', '5', 'b6', 'b7'],
    description: 'Dark, tense minor mode with a flat 2nd. Common in Flamenco & Metal.',
    tonicChordQuality: 'm7',
    chordTones: ['1', 'b3', '5', 'b7'],
    characteristicTones: ['b2'],
    colourTones: ['4', 'b6'],
    modalComparison: { referenceMode: 'Aeolian', diffLabel: 'Flat 2nd (♭2) instead of 2' },
  },
  {
    id: 'lydian',
    name: 'Lydian',
    category: 'diatonic',
    intervals: [0, 2, 4, 6, 7, 9, 11],
    intervalNames: ['1', '2', '3', '#4', '5', '6', '7'],
    description: 'Dreamy major mode with a raised 4th. Used in film scores.',
    tonicChordQuality: 'maj7',
    chordTones: ['1', '3', '5', '7'],
    characteristicTones: ['#4'],
    colourTones: ['2', '6'],
    modalComparison: { referenceMode: 'Ionian', diffLabel: 'Raised 4th (♯4) instead of 4' },
  },
  {
    id: 'mixolydian',
    name: 'Mixolydian',
    category: 'diatonic',
    intervals: [0, 2, 4, 5, 7, 9, 10],
    intervalNames: ['1', '2', '3', '4', '5', '6', 'b7'],
    description: 'Bluesy major mode with a flat 7th. Key scale for Classic Rock & Blues.',
    tonicChordQuality: '7',
    chordTones: ['1', '3', '5', 'b7'],
    characteristicTones: ['b7'],
    colourTones: ['2', '4', '6'],
    modalComparison: { referenceMode: 'Ionian', diffLabel: 'Flat 7th (♭7) instead of 7' },
  },
  {
    id: 'natural-minor',
    name: 'Natural Minor (Aeolian)',
    category: 'diatonic',
    intervals: [0, 2, 3, 5, 7, 8, 10],
    intervalNames: ['1', '2', 'b3', '4', '5', 'b6', 'b7'],
    description: 'Pure minor tonality (W-H-W-W-H-W-W). Introspective & emotional.',
    tonicChordQuality: 'm7',
    chordTones: ['1', 'b3', '5', 'b7'],
    characteristicTones: ['b6'],
    colourTones: ['2', '4'],
    modalComparison: { referenceMode: 'Dorian', diffLabel: 'Flat 6th (♭6) instead of 6' },
  },
  {
    id: 'locrian',
    name: 'Locrian',
    category: 'diatonic',
    intervals: [0, 1, 3, 5, 6, 8, 10],
    intervalNames: ['1', 'b2', 'b3', '4', 'b5', 'b6', 'b7'],
    description: 'Diminished mode with flat 2nd and flat 5th. Unstable & dissonant.',
    tonicChordQuality: 'm7b5',
    chordTones: ['1', 'b3', 'b5', 'b7'],
    characteristicTones: ['b5', 'b2'],
    colourTones: ['4', 'b6'],
    modalComparison: { referenceMode: 'Aeolian', diffLabel: 'Flat 5th (♭5) and Flat 2nd (♭2)' },
  },

  // --- Non-Diatonic & Harmonic Minor Modes (Musical Slide Rule) ---
  {
    id: 'harmonic-minor',
    name: 'Harmonic Minor (Aeolian Maj7)',
    category: 'non-diatonic',
    intervals: [0, 2, 3, 5, 7, 8, 11],
    intervalNames: ['1', '2', 'b3', '4', '5', 'b6', '7'],
    description: '1st mode of Harmonic Minor. Minor scale with a raised 7th leading tone.',
    tonicChordQuality: 'Mmaj7',
    chordTones: ['1', 'b3', '5', '7'],
    characteristicTones: ['7'],
    colourTones: ['2', '4'],
    modalComparison: { referenceMode: 'Aeolian', diffLabel: 'Raised 7th (7) leading tone' },
  },
  {
    id: 'locrian-sharp-6',
    name: 'Locrian #6 (Half Diminished)',
    category: 'non-diatonic',
    intervals: [0, 1, 3, 5, 6, 9, 10],
    intervalNames: ['1', 'b2', 'b3', '4', 'b5', '6', 'b7'],
    description: '2nd mode of Harmonic Minor. Diminished 5th with a natural 6th.',
    tonicChordQuality: 'm7b5',
    chordTones: ['1', 'b3', 'b5', 'b7'],
    characteristicTones: ['6'],
    colourTones: ['4'],
    modalComparison: { referenceMode: 'Locrian', diffLabel: 'Natural 6th (6) instead of ♭6' },
  },
  {
    id: 'ionian-sharp-5',
    name: 'Ionian #5 (Augmented)',
    category: 'non-diatonic',
    intervals: [0, 2, 4, 5, 8, 9, 11],
    intervalNames: ['1', '2', '3', '4', '#5', '6', '7'],
    description: '3rd mode of Harmonic Minor. Major 3rd with an augmented 5th.',
    tonicChordQuality: 'maj7#5',
    chordTones: ['1', '3', '#5', '7'],
    characteristicTones: ['#5'],
    colourTones: ['2', '6'],
    modalComparison: { referenceMode: 'Ionian', diffLabel: 'Augmented 5th (♯5) instead of 5' },
  },
  {
    id: 'dorian-sharp-4',
    name: 'Dorian #4 (Romanian / Minor)',
    category: 'non-diatonic',
    intervals: [0, 2, 3, 6, 7, 9, 10],
    intervalNames: ['1', '2', 'b3', '#4', '5', '6', 'b7'],
    description: '4th mode of Harmonic Minor. Dorian minor with a tritone #4. Folk & Eastern.',
    tonicChordQuality: 'm7',
    chordTones: ['1', 'b3', '5', 'b7'],
    characteristicTones: ['#4'],
    colourTones: ['2', '6'],
    modalComparison: { referenceMode: 'Dorian', diffLabel: 'Raised 4th (♯4) instead of 4' },
  },
  {
    id: 'phrygian-dominant',
    name: 'Phrygian Major (Spanish Gypsy)',
    category: 'non-diatonic',
    intervals: [0, 1, 4, 5, 7, 8, 10],
    intervalNames: ['1', 'b2', '3', '4', '5', 'b6', 'b7'],
    description: '5th mode of Harmonic Minor. Major 3rd with flat 2nd and flat 6th.',
    tonicChordQuality: '7',
    chordTones: ['1', '3', '5', 'b7'],
    characteristicTones: ['b2', '3'],
    colourTones: ['4', 'b6'],
    modalComparison: { referenceMode: 'Phrygian', diffLabel: 'Major 3rd (3) instead of ♭3' },
  },
  {
    id: 'lydian-sharp-2',
    name: 'Lydian #2',
    category: 'non-diatonic',
    intervals: [0, 3, 4, 6, 7, 9, 11],
    intervalNames: ['1', '#2', '3', '#4', '5', '6', '7'],
    description: '6th mode of Harmonic Minor. Lydian major with a raised #2 step.',
    tonicChordQuality: 'maj7',
    chordTones: ['1', '3', '5', '7'],
    characteristicTones: ['#2', '#4'],
    colourTones: ['6'],
    modalComparison: { referenceMode: 'Lydian', diffLabel: 'Raised 2nd (♯2) step' },
  },
  {
    id: 'ultralocrian',
    name: 'Ultralocrian (Diminished 7)',
    category: 'non-diatonic',
    intervals: [0, 1, 3, 4, 6, 8, 9],
    intervalNames: ['1', 'b2', 'b3', 'b4', 'b5', 'b6', 'bb7'],
    description: '7th mode of Harmonic Minor. Fully diminished 7th mode.',
    tonicChordQuality: 'dim7',
    chordTones: ['1', 'b3', 'b5', 'bb7'],
    characteristicTones: ['bb7'],
    colourTones: ['b2', 'b4', 'b6'],
    modalComparison: { referenceMode: 'Locrian', diffLabel: 'Diminished 7th (bb7) instead of ♭7' },
  },
  {
    id: 'melodic-minor',
    name: 'Melodic Minor',
    category: 'non-diatonic',
    intervals: [0, 2, 3, 5, 7, 9, 11],
    intervalNames: ['1', '2', 'b3', '4', '5', '6', '7'],
    description: 'Minor 3rd with major 6th and 7th. Essential for Modern Jazz.',
    tonicChordQuality: 'Mmaj7',
    chordTones: ['1', 'b3', '5', '7'],
    characteristicTones: ['6', '7'],
    colourTones: ['2', '4'],
    modalComparison: { referenceMode: 'Natural Minor', diffLabel: 'Natural 6th and Major 7th' },
  },
  {
    id: 'hungarian-minor',
    name: 'Hungarian Minor (Gypsy)',
    category: 'non-diatonic',
    intervals: [0, 2, 3, 6, 7, 8, 11],
    intervalNames: ['1', '2', 'b3', '#4', '5', 'b6', '7'],
    description: 'Harmonic Minor with a raised 4th. Dramatic Eastern European sound.',
    tonicChordQuality: 'Mmaj7',
    chordTones: ['1', 'b3', '5', '7'],
    characteristicTones: ['#4', '7'],
    colourTones: ['2', 'b6'],
    modalComparison: { referenceMode: 'Harmonic Minor', diffLabel: 'Raised 4th (♯4) tritone' },
  },

  // --- Pentatonic & Blues Scales ---
  {
    id: 'major-pentatonic',
    name: 'Major Pentatonic',
    category: 'pentatonic-blues',
    intervals: [0, 2, 4, 7, 9],
    intervalNames: ['1', '2', '3', '5', '6'],
    description: '5-note major scale omitting 4th and 7th. Bright, melodic Americana.',
    tonicChordQuality: 'maj',
    chordTones: ['1', '3', '5'],
    colourTones: ['2', '6'],
  },
  {
    id: 'minor-pentatonic',
    name: 'Minor Pentatonic',
    category: 'pentatonic-blues',
    intervals: [0, 3, 5, 7, 10],
    intervalNames: ['1', 'b3', '4', '5', 'b7'],
    description: 'The premier 5-note lead guitar scale for Rock, Blues, and Soloing.',
    tonicChordQuality: 'm7',
    chordTones: ['1', 'b3', '5', 'b7'],
    colourTones: ['4'],
  },
  {
    id: 'blues-scale',
    name: 'Blues Scale (Hexatonic)',
    category: 'pentatonic-blues',
    intervals: [0, 3, 5, 6, 7, 10],
    intervalNames: ['1', 'b3', '4', 'b5', '5', 'b7'],
    description: 'Minor Pentatonic plus the chromatic "blue note" (b5 tritone).',
  },

  // --- Exotic & Symmetrical Scales (Slide Rule) ---
  {
    id: 'whole-tone',
    name: 'Whole Tone Scale (Augmented)',
    category: 'exotic',
    intervals: [0, 2, 4, 6, 8, 10],
    intervalNames: ['1', '2', '3', '#4', '#5', 'b7'],
    description: 'Symmetrical 6-note scale composed entirely of whole steps. Floating & mysterious.',
  },
  {
    id: 'diminished-symmetrical',
    name: 'Diminished Symmetrical (Full Dim)',
    category: 'exotic',
    intervals: [0, 1, 3, 4, 6, 7, 9, 10],
    intervalNames: ['1', 'b2', 'b3', '3', 'b5', '5', '6', 'b7'],
    description: 'Symmetrical 8-note half-whole diminished scale. Jazz & Metal tension.',
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
 * Categorizes a note in context into its theoretical role
 */
export function getNoteRoleInContext(scaleId: string, interval: string): NoteRole {
  if (interval === '1') return 'root';
  const scale = SCALE_DEFINITIONS.find(s => s.id === scaleId);

  // 1. Classic tension intervals (4th in Major/Mixolydian, b2, b5, #4, b6, #5)
  if (interval === '4' && (scaleId === 'major' || scaleId === 'mixolydian' || scaleId === 'ionian-sharp-5')) {
    return 'tension';
  }
  if (['b2', 'b5', '#4', '#5', 'b6'].includes(interval)) {
    return 'tension';
  }

  // 2. Mode identity characteristic accents
  if (scale?.characteristicTones && scale.characteristicTones.includes(interval)) {
    return 'characteristic';
  }

  // 3. Chord tones (1, 3, 5, 7 / b3, b5, b7)
  if (scale?.chordTones && scale.chordTones.includes(interval)) {
    return 'chord-tone';
  }

  // 4. Colour extensions (2, 6)
  if (scale?.colourTones && scale.colourTones.includes(interval)) {
    return 'colour';
  }

  return 'colour';
}

/**
 * Calculates scale box position (1 to 5) for a given fretboard note.
 */
export function calculateFretboardPosition(rootNote: string, fret: number): number {
  const rootIdx = NOTES_CHROMATIC.indexOf(rootNote);
  const lowEIdx = NOTES_CHROMATIC.indexOf('E');
  const rootFretLowE = (rootIdx - lowEIdx + 12) % 12;
  const relFret = (fret - rootFretLowE + 24) % 12;

  if (relFret >= 0 && relFret <= 2) return 1;
  if (relFret >= 2 && relFret <= 4) return 2;
  if (relFret >= 4 && relFret <= 7) return 3;
  if (relFret >= 7 && relFret <= 9) return 4;
  return 5;
}

/**
 * Maps scale notes across the entire 6-string 24-fret guitar fretboard
 */
export function generateFretboardScale(
  rootNote: string,
  scaleId: string,
  totalFrets: number = 24,
  includeOffScaleNotes: boolean = true
): FretboardNote[] {
  const scaleNotes = getScaleNotes(rootNote, scaleId);
  const scaleNoteNames = new Set(scaleNotes.map(n => n.noteName));
  const rootIdx = NOTES_CHROMATIC.indexOf(rootNote);
  const fretboardNotes: FretboardNote[] = [];

  for (let s = 1; s <= 6; s++) {
    for (let f = 0; f <= totalFrets; f++) {
      const { noteName, octave } = getNoteForStringAndFret(s, f);
      const isMatch = scaleNoteNames.has(noteName);
      const freq = getFrequencyForStringAndFret(s, f);

      const noteSemis = (NOTES_CHROMATIC.indexOf(noteName) - rootIdx + 12) % 12;
      const matchingScaleItem = scaleNotes.find(n => n.noteName === noteName);

      const interval = matchingScaleItem ? matchingScaleItem.interval : (INTERVAL_LABELS_MAP[noteSemis] || '1');
      const isRoot = noteSemis === 0;
      const noteRole = getNoteRoleInContext(scaleId, interval);
      const position = calculateFretboardPosition(rootNote, f);

      if (isMatch || includeOffScaleNotes) {
        fretboardNotes.push({
          stringNum: s,
          fret: f,
          noteName,
          octave,
          freq,
          interval,
          isRoot,
          isScaleNote: isMatch,
          isEnabled: isMatch || scaleId === 'all-notes',
          noteRole,
          position,
        });
      }
    }
  }

  return fretboardNotes;
}
