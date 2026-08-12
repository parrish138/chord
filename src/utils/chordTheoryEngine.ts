import { ChordDefinition } from '../types/chord';

const CHROMATIC_SCALE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const STRING_ROOT_PITCHES: Record<number, string> = {
  6: 'E',
  5: 'A',
  4: 'D',
  3: 'G',
  2: 'B',
  1: 'E',
};

export interface NoteIntervalInfo {
  note: string;
  semitonesFromRoot: number;
  intervalName: string; // e.g. "Root", "Major 3rd", "Perfect 5th", "Minor 7th"
  abbreviation: string; // e.g. "1", "3", "5", "b7"
}

export interface ChordTheoryAnalysis {
  rootNote: string;
  uniqueNotes: string[];
  intervals: NoteIntervalInfo[];
  formula: string;      // e.g. "1 - 3 - 5 - b7"
  explanation: string;  // Plain English music theory explanation
}

const INTERVAL_MAP: Record<number, { name: string; abbr: string }> = {
  0: { name: 'Root', abbr: '1' },
  1: { name: 'Minor 2nd', abbr: 'b2' },
  2: { name: 'Major 2nd', abbr: '2' },
  3: { name: 'Minor 3rd', abbr: 'b3' },
  4: { name: 'Major 3rd', abbr: '3' },
  5: { name: 'Perfect 4th', abbr: '4' },
  6: { name: 'Flat 5th / Tritone', abbr: 'b5' },
  7: { name: 'Perfect 5th', abbr: '5' },
  8: { name: 'Augmented 5th / b6', abbr: '#5' },
  9: { name: 'Major 6th', abbr: '6' },
  10: { name: 'Minor 7th (Flat 7)', abbr: 'b7' },
  11: { name: 'Major 7th', abbr: '7' },
};

function getNoteName(stringNum: number, fret: number): string {
  const rootNote = STRING_ROOT_PITCHES[stringNum] || 'E';
  const rootIndex = CHROMATIC_SCALE.indexOf(rootNote);
  return CHROMATIC_SCALE[(rootIndex + fret) % 12];
}

/**
 * Performs music theory analysis on a chord definition to derive its notes, intervals, formula, and explanation
 */
export function analyzeChordTheory(chord: ChordDefinition): ChordTheoryAnalysis {
  // Extract root note pitch
  let rootNote = chord.key || 'C';
  // Check if root is explicitly marked on finger positions
  const rootPos = chord.positions.find(p => p.isRoot);
  if (rootPos) {
    rootNote = getNoteName(rootPos.string, rootPos.fret);
  }

  const rootIndex = CHROMATIC_SCALE.indexOf(rootNote);

  // Collect notes played on active strings
  const playedNotesSet = new Set<string>();

  for (let s = 1; s <= 6; s++) {
    if (chord.mutedStrings?.includes(s)) continue;

    const pos = chord.positions.find(p => p.string === s);
    const barre = chord.barres?.find(b => s >= b.startString && s <= b.endString);

    if (pos) {
      playedNotesSet.add(getNoteName(s, pos.fret));
    } else if (barre) {
      playedNotesSet.add(getNoteName(s, barre.fret));
    } else {
      playedNotesSet.add(getNoteName(s, 0));
    }
  }

  const uniqueNotes = Array.from(playedNotesSet);

  // Sort notes starting from Root Note
  uniqueNotes.sort((a, b) => {
    const semitonesA = (CHROMATIC_SCALE.indexOf(a) - rootIndex + 12) % 12;
    const semitonesB = (CHROMATIC_SCALE.indexOf(b) - rootIndex + 12) % 12;
    return semitonesA - semitonesB;
  });

  // Calculate interval info for each note
  const intervals: NoteIntervalInfo[] = uniqueNotes.map(note => {
    const semitones = (CHROMATIC_SCALE.indexOf(note) - rootIndex + 12) % 12;
    const info = INTERVAL_MAP[semitones] || { name: 'Interval', abbr: `${semitones}` };
    return {
      note,
      semitonesFromRoot: semitones,
      intervalName: info.name,
      abbreviation: info.abbr,
    };
  });

  const formula = intervals.map(i => i.abbreviation).join(' - ');

  // Generate plain English explanation based on chord quality / suffix
  const explanation = generateTheoryExplanation(chord.name, rootNote, chord.suffix || '', intervals);

  return {
    rootNote,
    uniqueNotes,
    intervals,
    formula,
    explanation,
  };
}

function generateTheoryExplanation(
  chordName: string,
  rootNote: string,
  suffix: string,
  intervals: NoteIntervalInfo[]
): string {
  const hasMajor3rd = intervals.some(i => i.semitonesFromRoot === 4);
  const hasMinor3rd = intervals.some(i => i.semitonesFromRoot === 3);
  const hasPerfect5th = intervals.some(i => i.semitonesFromRoot === 7);
  const hasMinor7th = intervals.some(i => i.semitonesFromRoot === 10);
  const hasMajor7th = intervals.some(i => i.semitonesFromRoot === 11);
  const hasPerfect4th = intervals.some(i => i.semitonesFromRoot === 5);

  const lowerName = chordName.toLowerCase();
  const lowerSuffix = suffix.toLowerCase();

  // 1. Check Minor 7th first (e.g., "Minor 7", "m7", "min7")
  if (
    lowerSuffix === 'minor 7' ||
    lowerSuffix === 'm7' ||
    lowerSuffix === 'min7' ||
    lowerName.includes('minor 7') ||
    lowerName.includes('m7') ||
    (hasMinor3rd && hasMinor7th)
  ) {
    return `${chordName} is a Minor 7th chord (formula: 1 - b3 - 5 - b7). The Minor 3rd (b3) gives it a dark, soulful mood, while the Minor 7th (b7) adds smooth jazz depth without harsh dissonance.`;
  }

  // 2. Check Major 7th (e.g., "Major7", "maj7")
  if (
    lowerSuffix === 'major7' ||
    lowerSuffix === 'maj7' ||
    lowerName.includes('major7') ||
    lowerName.includes('maj7 font') ||
    lowerName.includes('major 7') ||
    (hasMajor3rd && hasMajor7th)
  ) {
    return `${chordName} is a Major 7th chord (formula: 1 - 3 - 5 - 7). It pairs a Major triad (${rootNote}, 3rd, 5th) with a natural Major 7th interval (just 1 semitone below the octave root). This creates a warm, dreamy, lush jazz harmony.`;
  }

  // 3. Check Dominant 7th (e.g., "7")
  if (
    lowerSuffix === '7' ||
    lowerName.endsWith('7') ||
    (hasMajor3rd && hasMinor7th)
  ) {
    return `${chordName} is a Dominant 7th chord (formula: 1 - 3 - 5 - b7). It combines a bright Major triad (${rootNote}, 3rd, 5th) with a tense Minor 7th (b7) interval. This flat-7 interval creates a strong bluesy tension that wants to resolve down a 5th.`;
  }

  // 4. Check Minor Triad
  if (
    lowerSuffix === 'm' ||
    lowerSuffix === 'minor' ||
    lowerName.includes('minor') ||
    (hasMinor3rd && !hasMajor3rd)
  ) {
    const min3Note = intervals.find(i => i.semitonesFromRoot === 3)?.note || '';
    return `${chordName} is a Minor triad (formula: 1 - b3 - 5). The Minor 3rd interval (${min3Note}) is 3 semitones above the root ${rootNote}, giving the chord its sad or serious musical color.`;
  }

  // 5. Check Suspended 4th
  if (
    lowerSuffix === 'sus4' ||
    lowerName.includes('sus4') ||
    (hasPerfect4th && !hasMajor3rd && !hasMinor3rd)
  ) {
    const p4Note = intervals.find(i => i.semitonesFromRoot === 5)?.note || '';
    return `${chordName} is a Suspended 4th chord (formula: 1 - 4 - 5). It replaces the usual 3rd with a Perfect 4th (${p4Note}), creating an open, floating tension that typically resolves back to the Major triad.`;
  }

  // 6. Check Power Chord (5-chord)
  if (
    lowerSuffix === '5' ||
    lowerName.includes('5') ||
    (!hasMajor3rd && !hasMinor3rd && hasPerfect5th)
  ) {
    const p5Note = intervals.find(i => i.semitonesFromRoot === 7)?.note || '';
    return `${chordName} is a 5-Chord / Power Chord (formula: 1 - 5). It omits the 3rd entirely, leaving only the Root (${rootNote}) and Perfect 5th (${p5Note}). Because it has no 3rd, it is neutral, making it ideal for heavy distortion in rock & metal.`;
  }

  // Default Major Triad
  const maj3Note = intervals.find(i => i.semitonesFromRoot === 4)?.note || '';
  const p5Note = intervals.find(i => i.semitonesFromRoot === 7)?.note || '';
  return `${chordName} is a Major triad (formula: 1 - 3 - 5). Built with the Root (${rootNote}), Major 3rd (${maj3Note}), and Perfect 5th (${p5Note}), it forms the bright, stable foundation of Western music harmony.`;
}

/**
 * Calculates interval abbreviation (e.g. "1", "b3", "3", "5", "b7") for a string and fret relative to chord root
 */
export function getIntervalAbbreviation(chordKeyOrName: string, stringNum: number, fret: number): string {
  const match = chordKeyOrName.match(/^[A-G][#b]?/);
  const root = match ? match[0] : 'C';

  const stringBase = STRING_ROOT_PITCHES[stringNum] || 'E';
  const stringBaseIdx = CHROMATIC_SCALE.indexOf(stringBase.replace('b', '#'));
  const noteIdx = (stringBaseIdx + fret) % 12;

  const rootIdx = CHROMATIC_SCALE.indexOf(root.replace('b', '#'));
  const semitones = (noteIdx - rootIdx + 12) % 12;

  return INTERVAL_MAP[semitones]?.abbr || '1';
}
