import { ChordDefinition } from './chord';

export type ScaleType = 
  | 'Major (Ionian)' 
  | 'Natural Minor (Aeolian)' 
  | 'Dorian' 
  | 'Mixolydian' 
  | 'Harmonic Minor' 
  | 'Major Pentatonic' 
  | 'Minor Pentatonic';

export type ChordComplexity = 'triad' | '7th' | 'extended';

export interface ScaleDegreeInfo {
  degreeIndex: number;      // 1 to 7
  nashvilleNumber: string;  // e.g. "1", "2m", "3m", "4", "5", "6m", "7°"
  romanNumeral: string;     // e.g. "I", "ii", "iii", "IV", "V", "vi", "vii°"
  noteName: string;         // e.g. "C", "D", "E", "F", "G", "A", "B"
  quality: 'Major' | 'Minor' | 'Diminished' | 'Augmented' | 'Dominant';
  primaryChord: ChordDefinition;
  extensionChords: ChordDefinition[];
}

export interface NashvilleScaleContext {
  rootKey: string;
  scaleType: ScaleType;
  scaleNotes: string[];
  degrees: ScaleDegreeInfo[];
}

export interface ProgressionStep {
  id: string;
  degreeIndex: number;
  nashvilleNumber: string;
  chord: ChordDefinition;
}
