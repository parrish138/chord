import { ScaleType, ScaleDegreeInfo, NashvilleScaleContext } from '../types/nashville';
import { ChordDefinition } from '../types/chord';
import { CAGED_TEMPLATES, generateCAGEDChord, ROOT_NOTES } from './cagedSystem';

// Scale interval steps (semitones from root)
const SCALE_INTERVALS: Record<ScaleType, number[]> = {
  'Major (Ionian)': [0, 2, 4, 5, 7, 9, 11],
  'Natural Minor (Aeolian)': [0, 2, 3, 5, 7, 8, 10],
  'Dorian': [0, 2, 3, 5, 7, 9, 10],
  'Mixolydian': [0, 2, 4, 5, 7, 9, 10],
  'Harmonic Minor': [0, 2, 3, 5, 7, 8, 11],
  'Major Pentatonic': [0, 2, 4, 7, 9],
  'Minor Pentatonic': [0, 3, 5, 7, 10],
};

// Nashville numbers and Roman numerals for Major scale
const MAJOR_NASHVILLE_MAP = [
  { num: '1', roman: 'I', quality: 'Major' as const, suffix: '' },
  { num: '2m', roman: 'ii', quality: 'Minor' as const, suffix: 'm' },
  { num: '3m', roman: 'iii', quality: 'Minor' as const, suffix: 'm' },
  { num: '4', roman: 'IV', quality: 'Major' as const, suffix: '' },
  { num: '5', roman: 'V', quality: 'Major' as const, suffix: '' },
  { num: '6m', roman: 'vi', quality: 'Minor' as const, suffix: 'm' },
  { num: '7°', roman: 'vii°', quality: 'Diminished' as const, suffix: 'dim' },
];

// Nashville numbers for Natural Minor scale
const MINOR_NASHVILLE_MAP = [
  { num: '1m', roman: 'i', quality: 'Minor' as const, suffix: 'm' },
  { num: '2°', roman: 'ii°', quality: 'Diminished' as const, suffix: 'dim' },
  { num: '3', roman: 'III', quality: 'Major' as const, suffix: '' },
  { num: '4m', roman: 'iv', quality: 'Minor' as const, suffix: 'm' },
  { num: '5m', roman: 'v', quality: 'Minor' as const, suffix: 'm' },
  { num: '6', roman: 'VI', quality: 'Major' as const, suffix: '' },
  { num: '7', roman: 'VII', quality: 'Major' as const, suffix: '' },
];

/**
 * Calculates scale notes for a given Root Key and Scale Type
 */
export function getScaleNotes(rootKey: string, scaleType: ScaleType): string[] {
  const rootIndex = ROOT_NOTES.indexOf(rootKey);
  if (rootIndex === -1) return [];

  const intervals = SCALE_INTERVALS[scaleType] || SCALE_INTERVALS['Major (Ionian)'];
  return intervals.map(interval => ROOT_NOTES[(rootIndex + interval) % 12]);
}

/**
 * Generates full Nashville Context (degrees, notes, and filtered chord diagrams)
 */
export function getNashvilleContext(rootKey: string, scaleType: ScaleType): NashvilleScaleContext {
  const scaleNotes = getScaleNotes(rootKey, scaleType);
  const isMinorBased = scaleType.includes('Minor');
  const mappingList = isMinorBased ? MINOR_NASHVILLE_MAP : MAJOR_NASHVILLE_MAP;

  const degrees: ScaleDegreeInfo[] = scaleNotes.map((noteName, idx) => {
    const mapInfo = mappingList[idx % mappingList.length] || mappingList[0];

    // Determine primary chord template (E form or A form based on note)
    const tmplQuality = mapInfo.quality === 'Major' ? 'Major' : mapInfo.quality === 'Minor' ? 'Minor' : '7';
    const primaryTmpl = CAGED_TEMPLATES.find(t => t.form === 'E Form' && t.quality === tmplQuality) || CAGED_TEMPLATES[0];

    const primaryChord = generateCAGEDChord(primaryTmpl, noteName);

    // Extensions for this degree (7th, maj7, m7, sus4, add9)
    const extensions: ChordDefinition[] = [];
    if (mapInfo.quality === 'Major') {
      const maj7Tmpl = CAGED_TEMPLATES.find(t => t.form === 'E Form' && t.quality === 'Major7');
      const dom7Tmpl = CAGED_TEMPLATES.find(t => t.form === 'E Form' && t.quality === '7');
      if (maj7Tmpl) extensions.push(generateCAGEDChord(maj7Tmpl, noteName));
      if (dom7Tmpl) extensions.push(generateCAGEDChord(dom7Tmpl, noteName));
    } else if (mapInfo.quality === 'Minor') {
      const m7Tmpl = CAGED_TEMPLATES.find(t => t.form === 'E Form' && t.quality === 'Minor 7');
      if (m7Tmpl) extensions.push(generateCAGEDChord(m7Tmpl, noteName));
    }

    return {
      degreeIndex: idx + 1,
      nashvilleNumber: mapInfo.num,
      romanNumeral: mapInfo.roman,
      noteName: noteName,
      quality: mapInfo.quality,
      primaryChord: primaryChord,
      extensionChords: extensions,
    };
  });

  return {
    rootKey,
    scaleType,
    scaleNotes,
    degrees,
  };
}
