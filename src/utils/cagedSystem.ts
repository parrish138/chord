import { CAGEDForm, CAGEDQuality, CAGEDTemplate, TransposedCAGEDChord } from '../types/caged';
import { ChordDefinition } from '../types/chord';

export const ROOT_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Base fret numbers for open root forms
const FORM_OPEN_ROOT_FRETS: Record<CAGEDForm, { stringNum: number; openFret: number }> = {
  'E Form': { stringNum: 6, openFret: 0 }, // E open root on string 6
  'A Form': { stringNum: 5, openFret: 0 }, // A open root on string 5
  'D Form': { stringNum: 4, openFret: 0 }, // D open root on string 4
  'C Form': { stringNum: 5, openFret: 3 }, // C root is at fret 3 of string 5
  'G Form': { stringNum: 6, openFret: 3 }, // G root is at fret 3 of string 6
};

// Root pitch per string
const STRING_ROOT_INDEX: Record<number, number> = {
  6: 4, // E
  5: 9, // A
  4: 2, // D
};

/**
 * 30 CAGED Shapes Template Library matching the user's reference diagram
 */
export const CAGED_TEMPLATES: CAGEDTemplate[] = [
  // --- E FORM ---
  {
    form: 'E Form', quality: 'Major', rootString: 6, relativeFretOffset: 0,
    positions: [{ string: 6, fret: 0, isRoot: true }, { string: 5, fret: 2, finger: '2' }, { string: 4, fret: 2, finger: '3' }, { string: 3, fret: 1, finger: '1' }],
    openStrings: [1, 2],
  },
  {
    form: 'E Form', quality: 'Minor', rootString: 6, relativeFretOffset: 0,
    positions: [{ string: 6, fret: 0, isRoot: true }, { string: 5, fret: 2, finger: '2' }, { string: 4, fret: 2, finger: '3' }],
    openStrings: [1, 2, 3],
  },
  {
    form: 'E Form', quality: '7', rootString: 6, relativeFretOffset: 0,
    positions: [{ string: 6, fret: 0, isRoot: true }, { string: 5, fret: 2, finger: '2' }, { string: 3, fret: 1, finger: '1' }],
    openStrings: [1, 2, 4],
  },
  {
    form: 'E Form', quality: 'Minor 7', rootString: 6, relativeFretOffset: 0,
    positions: [{ string: 6, fret: 0, isRoot: true }, { string: 5, fret: 2, finger: '2' }],
    openStrings: [1, 2, 3, 4],
  },
  {
    form: 'E Form', quality: 'Major7', rootString: 6, relativeFretOffset: 0,
    positions: [{ string: 6, fret: 0, isRoot: true }, { string: 4, fret: 1, finger: '1' }, { string: 3, fret: 1, finger: '2' }],
    openStrings: [1, 2, 5],
  },
  {
    form: 'E Form', quality: '5 Chords', rootString: 6, relativeFretOffset: 0,
    positions: [{ string: 6, fret: 1, isRoot: true, finger: '1' }, { string: 5, fret: 3, finger: '3' }, { string: 4, fret: 3, finger: '4' }],
    mutedStrings: [1, 2, 3],
  },

  // --- A FORM ---
  {
    form: 'A Form', quality: 'Major', rootString: 5, relativeFretOffset: 0,
    positions: [{ string: 5, fret: 0, isRoot: true }, { string: 4, fret: 2, finger: '1' }, { string: 3, fret: 2, finger: '2' }, { string: 2, fret: 2, finger: '3' }],
    mutedStrings: [6], openStrings: [1],
  },
  {
    form: 'A Form', quality: 'Minor', rootString: 5, relativeFretOffset: 0,
    positions: [{ string: 5, fret: 0, isRoot: true }, { string: 4, fret: 2, finger: '2' }, { string: 3, fret: 2, finger: '3' }, { string: 2, fret: 1, finger: '1' }],
    mutedStrings: [6], openStrings: [1],
  },
  {
    form: 'A Form', quality: '7', rootString: 5, relativeFretOffset: 0,
    positions: [{ string: 5, fret: 0, isRoot: true }, { string: 4, fret: 2, finger: '2' }, { string: 2, fret: 2, finger: '3' }],
    mutedStrings: [6], openStrings: [1, 3],
  },
  {
    form: 'A Form', quality: 'Minor 7', rootString: 5, relativeFretOffset: 0,
    positions: [{ string: 5, fret: 0, isRoot: true }, { string: 4, fret: 2, finger: '2' }, { string: 2, fret: 1, finger: '1' }],
    mutedStrings: [6], openStrings: [1, 3],
  },
  {
    form: 'A Form', quality: 'Major7', rootString: 5, relativeFretOffset: 0,
    positions: [{ string: 5, fret: 0, isRoot: true }, { string: 4, fret: 2, finger: '3' }, { string: 3, fret: 1, finger: '1' }, { string: 2, fret: 2, finger: '2' }],
    mutedStrings: [6], openStrings: [1],
  },
  {
    form: 'A Form', quality: '5 Chords', rootString: 5, relativeFretOffset: 0,
    positions: [{ string: 5, fret: 1, isRoot: true, finger: '1' }, { string: 4, fret: 3, finger: '3' }, { string: 3, fret: 3, finger: '4' }],
    mutedStrings: [1, 2, 6],
  },

  // --- D FORM ---
  {
    form: 'D Form', quality: 'Major', rootString: 4, relativeFretOffset: 0,
    positions: [{ string: 4, fret: 0, isRoot: true }, { string: 3, fret: 2, finger: '1' }, { string: 2, fret: 3, finger: '3' }, { string: 1, fret: 2, finger: '2' }],
    mutedStrings: [5, 6],
  },
  {
    form: 'D Form', quality: 'Minor', rootString: 4, relativeFretOffset: 0,
    positions: [{ string: 4, fret: 0, isRoot: true }, { string: 3, fret: 2, finger: '2' }, { string: 2, fret: 3, finger: '3' }, { string: 1, fret: 1, finger: '1' }],
    mutedStrings: [5, 6],
  },
  {
    form: 'D Form', quality: '7', rootString: 4, relativeFretOffset: 0,
    positions: [{ string: 4, fret: 0, isRoot: true }, { string: 3, fret: 2, finger: '2' }, { string: 2, fret: 1, finger: '1' }, { string: 1, fret: 2, finger: '3' }],
    mutedStrings: [5, 6],
  },
  {
    form: 'D Form', quality: 'Minor 7', rootString: 4, relativeFretOffset: 0,
    positions: [{ string: 4, fret: 0, isRoot: true }, { string: 3, fret: 2, finger: '2' }, { string: 2, fret: 1, finger: '1' }, { string: 1, fret: 1, finger: '1' }],
    mutedStrings: [5, 6],
  },
  {
    form: 'D Form', quality: 'Major7', rootString: 4, relativeFretOffset: 0,
    positions: [{ string: 4, fret: 0, isRoot: true }, { string: 3, fret: 2, finger: '1' }, { string: 2, fret: 2, finger: '1' }, { string: 1, fret: 2, finger: '1' }],
    mutedStrings: [5, 6],
  },
  {
    form: 'D Form', quality: '5 Chords', rootString: 4, relativeFretOffset: 0,
    positions: [{ string: 4, fret: 1, isRoot: true, finger: '1' }, { string: 3, fret: 3, finger: '3' }, { string: 2, fret: 3, finger: '4' }],
    mutedStrings: [1, 5, 6],
  },

  // --- C FORM ---
  {
    form: 'C Form', quality: 'Major', rootString: 5, relativeFretOffset: 3,
    positions: [{ string: 5, fret: 3, isRoot: true, finger: '3' }, { string: 4, fret: 2, finger: '2' }, { string: 2, fret: 1, finger: '1' }],
    mutedStrings: [6], openStrings: [1, 3],
  },
  {
    form: 'C Form', quality: 'Minor', rootString: 5, relativeFretOffset: 3,
    positions: [{ string: 5, fret: 3, isRoot: true, finger: '3' }, { string: 3, fret: 1, finger: '1' }, { string: 2, fret: 1, finger: '1' }],
    mutedStrings: [6], openStrings: [1, 4],
  },
  {
    form: 'C Form', quality: '7', rootString: 5, relativeFretOffset: 3,
    positions: [{ string: 5, fret: 3, isRoot: true, finger: '3' }, { string: 4, fret: 2, finger: '2' }, { string: 3, fret: 3, finger: '4' }, { string: 2, fret: 1, finger: '1' }],
    mutedStrings: [6], openStrings: [1],
  },
  {
    form: 'C Form', quality: 'Minor 7', rootString: 5, relativeFretOffset: 3,
    positions: [{ string: 5, fret: 3, isRoot: true, finger: '3' }, { string: 1, fret: 3, finger: '4' }],
    barres: [{ fret: 3, startString: 2, endString: 3, finger: '3' }],
    mutedStrings: [6],
  },
  {
    form: 'C Form', quality: 'Major7', rootString: 5, relativeFretOffset: 3,
    positions: [{ string: 5, fret: 3, isRoot: true, finger: '3' }, { string: 3, fret: 1, finger: '1' }],
    mutedStrings: [6], openStrings: [1, 2, 4],
  },
  {
    form: 'C Form', quality: '5 Chords', rootString: 5, relativeFretOffset: 3,
    positions: [{ string: 5, fret: 1, isRoot: true, finger: '1' }, { string: 4, fret: 3, finger: '3' }, { string: 3, fret: 3, finger: '4' }],
    mutedStrings: [1, 2, 6],
  },

  // --- G FORM ---
  {
    form: 'G Form', quality: 'Major', rootString: 6, relativeFretOffset: 3,
    positions: [{ string: 6, fret: 3, isRoot: true, finger: '3' }, { string: 5, fret: 2, finger: '2' }, { string: 1, fret: 3, finger: '4' }],
    openStrings: [2, 3, 4],
  },
  {
    form: 'G Form', quality: 'Minor', rootString: 6, relativeFretOffset: 3,
    positions: [{ string: 6, fret: 3, isRoot: true, finger: '3' }, { string: 5, fret: 1, finger: '1' }],
    openStrings: [1, 2, 3, 4],
  },
  {
    form: 'G Form', quality: '7', rootString: 6, relativeFretOffset: 3,
    positions: [{ string: 6, fret: 3, isRoot: true, finger: '3' }, { string: 5, fret: 2, finger: '2' }, { string: 1, fret: 1, finger: '1' }],
    openStrings: [2, 3, 4],
  },
  {
    form: 'G Form', quality: 'Minor 7', rootString: 6, relativeFretOffset: 3,
    positions: [{ string: 6, fret: 3, isRoot: true, finger: '3' }, { string: 5, fret: 1, finger: '1' }, { string: 1, fret: 1, finger: '1' }],
    openStrings: [2, 3, 4],
  },
  {
    form: 'G Form', quality: 'Major7', rootString: 6, relativeFretOffset: 3,
    positions: [{ string: 6, fret: 3, isRoot: true, finger: '3' }, { string: 1, fret: 2, finger: '1' }],
    mutedStrings: [5], openStrings: [2, 3, 4],
  },
  {
    form: 'G Form', quality: '5 Chords', rootString: 6, relativeFretOffset: 3,
    positions: [{ string: 6, fret: 3, isRoot: true, finger: '1' }, { string: 5, fret: 5, finger: '3' }, { string: 4, fret: 5, finger: '4' }],
    mutedStrings: [1, 2, 3],
  },
];

/**
 * Transpose a CAGED shape template to a target root note (e.g. F, G, A, C)
 */
/**
 * Get raw un-transposed CAGED shape for reference map mode (matching textbook CAGED diagrams)
 */
export function getRawCAGEDChord(template: CAGEDTemplate): ChordDefinition {
  const qualitySuffix = template.quality === 'Major' ? '' : template.quality === 'Minor' ? 'm' : template.quality === '5 Chords' ? '5' : template.quality;

  // Calculate baseFret and fret offsets for neat rendering
  const allFrets = template.positions.map(p => p.fret).filter(f => f > 0);
  const minFret = allFrets.length > 0 ? Math.min(...allFrets) : 1;
  const maxFret = allFrets.length > 0 ? Math.max(...allFrets) : 1;

  // Set baseFret: 1 if lowest fret <= 1 or max <= 4
  const baseFret = minFret <= 1 || maxFret <= 4 ? 1 : minFret;

  return {
    id: `raw-caged-${template.form}-${template.quality}`,
    name: `${template.form.split(' ')[0]} ${template.quality}`,
    key: template.form.split(' ')[0],
    suffix: qualitySuffix,
    baseFret: baseFret,
    positions: template.positions,
    barres: template.barres,
    mutedStrings: template.mutedStrings,
    openStrings: template.openStrings,
  };
}

export function generateCAGEDChord(template: CAGEDTemplate, targetRootNote: string): ChordDefinition {
  const targetRootIndex = ROOT_NOTES.indexOf(targetRootNote);
  const openRootInfo = FORM_OPEN_ROOT_FRETS[template.form];
  const stringBasePitchIndex = STRING_ROOT_INDEX[openRootInfo.stringNum];

  // Target fret of the root note on the root string (0 to 11)
  const targetRootFret = (targetRootIndex - stringBasePitchIndex + 12) % 12;

  // Calculate fretShift from the template's open root fret
  let fretShift = targetRootFret - openRootInfo.openFret;
  if (fretShift < 0) {
    fretShift += 12;
  }

  const isMovableBarre = fretShift > 0;

  // Calculate shifted finger positions
  const transposedPositions = template.positions.map(pos => {
    const newFret = pos.fret === 0 ? (isMovableBarre ? fretShift : 0) : pos.fret + fretShift;
    return {
      ...pos,
      fret: newFret,
    };
  });

  // Calculate shifted barres
  const transposedBarres = template.barres?.map(barre => ({
    ...barre,
    fret: barre.fret + fretShift,
  })) || [];

  let finalBarres = [...transposedBarres];
  let finalOpen: number[] = [];
  let finalMuted = template.mutedStrings ? [...template.mutedStrings] : [];

  if (!isMovableBarre) {
    // Open position (fretShift === 0)
    finalOpen = template.openStrings ? [...template.openStrings] : [];
  } else {
    // Movable position: Convert open strings to a barre at fretShift (index finger barre)
    if (template.openStrings && template.openStrings.length > 0) {
      const minString = Math.min(...template.openStrings);
      const maxString = Math.max(...template.openStrings);
      if (!finalBarres.some(b => b.fret === fretShift)) {
        finalBarres.push({
          fret: fretShift,
          startString: minString,
          endString: maxString,
          finger: '1',
        });
      }
    }
  }

  // Calculate baseFret for the SVG diagram
  const allFrets = [
    ...transposedPositions.map(p => p.fret),
    ...finalBarres.map(b => b.fret),
  ].filter(f => f > 0);

  const minFret = allFrets.length > 0 ? Math.min(...allFrets) : 1;
  const maxFret = allFrets.length > 0 ? Math.max(...allFrets) : 1;

  const baseFret = minFret <= 1 || maxFret <= 4 ? 1 : minFret;

  const qualitySuffix = template.quality === 'Major' ? '' : template.quality === 'Minor' ? 'm' : template.quality === '5 Chords' ? '5' : template.quality;

  return {
    id: `caged-${template.form}-${template.quality}-${targetRootNote}`,
    name: `${targetRootNote}${qualitySuffix}`,
    key: targetRootNote,
    suffix: qualitySuffix,
    baseFret: baseFret,
    positions: transposedPositions,
    barres: finalBarres.length > 0 ? finalBarres : undefined,
    mutedStrings: finalMuted.length > 0 ? finalMuted : undefined,
    openStrings: finalOpen.length > 0 ? finalOpen : undefined,
  };
}
