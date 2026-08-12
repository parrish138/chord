import { FingerPosition, BarreChord } from '../types/chord';

const CHROMATIC_SCALE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const STRING_ROOT_PITCHES: Record<number, string> = {
  6: 'E',
  5: 'A',
  4: 'D',
  3: 'G',
  2: 'B',
  1: 'E',
};

function getNoteName(stringNum: number, fret: number): string {
  const rootNote = STRING_ROOT_PITCHES[stringNum] || 'E';
  const rootIndex = CHROMATIC_SCALE.indexOf(rootNote);
  return CHROMATIC_SCALE[(rootIndex + fret) % 12];
}

/**
 * Given finger positions, barres, muted strings, and open strings, detect candidate chord names
 */
export function detectChordName(
  positions: FingerPosition[],
  barres: BarreChord[] = [],
  mutedStrings: number[] = [],
  openStrings: number[] = []
): { primaryName: string; alternativeNames: string[]; detectedNotes: string[] } {
  const activeNotesSet = new Set<string>();

  for (let s = 1; s <= 6; s++) {
    if (mutedStrings.includes(s)) continue;

    const pos = positions.find(p => p.string === s);
    const barre = barres.find(b => s >= b.startString && s <= b.endString);

    if (pos) {
      activeNotesSet.add(getNoteName(s, pos.fret));
    } else if (barre) {
      activeNotesSet.add(getNoteName(s, barre.fret));
    } else {
      // Open string
      activeNotesSet.add(getNoteName(s, 0));
    }
  }

  const uniqueNotes = Array.from(activeNotesSet);

  if (uniqueNotes.length === 0) {
    return { primaryName: 'Muted', alternativeNames: [], detectedNotes: [] };
  }

  // Simple heuristic chord matching for common guitar shapes
  const candidates: { name: string; score: number }[] = [];

  for (const rootNote of CHROMATIC_SCALE) {
    const rootIdx = CHROMATIC_SCALE.indexOf(rootNote);
    if (!uniqueNotes.includes(rootNote)) continue;

    // Calculate intervals present relative to this root
    const intervals = uniqueNotes.map(note => (CHROMATIC_SCALE.indexOf(note) - rootIdx + 12) % 12);

    const hasMinor3rd = intervals.includes(3);
    const hasMajor3rd = intervals.includes(4);
    const hasPerfect5th = intervals.includes(7);
    const hasFlat5th = intervals.includes(6);
    const hasAug5th = intervals.includes(8);
    const hasMinor7th = intervals.includes(10);
    const hasMajor7th = intervals.includes(11);
    const hasSus2 = intervals.includes(2);
    const hasSus4 = intervals.includes(5);
    const hasAdd9 = intervals.includes(2) && (hasMajor3rd || hasMinor3rd);

    if (hasMajor3rd && hasPerfect5th && !hasMinor7th && !hasMajor7th && !hasAdd9) {
      candidates.push({ name: `${rootNote}`, score: 10 });
    }
    if (hasMinor3rd && hasPerfect5th && !hasMinor7th && !hasMajor7th) {
      candidates.push({ name: `${rootNote}m`, score: 10 });
    }
    if (hasMajor3rd && hasPerfect5th && hasMinor7th) {
      candidates.push({ name: `${rootNote}7`, score: 9 });
    }
    if (hasMajor3rd && hasPerfect5th && hasMajor7th) {
      candidates.push({ name: `${rootNote}maj7`, score: 9 });
    }
    if (hasMinor3rd && hasPerfect5th && hasMinor7th) {
      candidates.push({ name: `${rootNote}m7`, score: 9 });
    }
    if (hasSus4 && hasPerfect5th && !hasMajor3rd && !hasMinor3rd) {
      candidates.push({ name: `${rootNote}sus4`, score: 8 });
    }
    if (hasSus2 && hasPerfect5th && !hasMajor3rd && !hasMinor3rd) {
      candidates.push({ name: `${rootNote}sus2`, score: 8 });
    }
    if (hasAdd9) {
      candidates.push({ name: `${rootNote}add9`, score: 8 });
    }
    if (hasMinor3rd && hasFlat5th) {
      candidates.push({ name: `${rootNote}dim`, score: 8 });
    }
  }

  candidates.sort((a, b) => b.score - a.score);

  if (candidates.length > 0) {
    return {
      primaryName: candidates[0].name,
      alternativeNames: candidates.slice(1, 4).map(c => c.name),
      detectedNotes: uniqueNotes,
    };
  }

  return {
    primaryName: `${uniqueNotes[0]} Custom`,
    alternativeNames: [],
    detectedNotes: uniqueNotes,
  };
}
