export type DiatonicCategory = 'all-notes' | 'diatonic' | 'non-diatonic' | 'exotic' | 'pentatonic-blues';

export interface ScaleDefinition {
  id: string;
  name: string;
  category: DiatonicCategory;
  intervals: number[]; // Semitone offsets from root (0 to 11)
  intervalNames: string[]; // ['1', '2', '3', ...]
  description: string;
}

export interface FretboardNote {
  stringNum: number; // 1 to 6 (1 = High E, 6 = Low E)
  fret: number;      // 0 to 22
  noteName: string;  // e.g. "C", "F#"
  octave: number;    // e.g. 2, 3, 4, 5
  freq: number;      // Hz
  interval: string;  // e.g. "1", "b3", "5"
  isRoot: boolean;
  isEnabled: boolean;
}

export interface ScaleProgressionStep {
  id: string;
  stepNumber: number;
  stringNum: number;
  fret: number;
  noteName: string;
  freq: number;
  durationSec: number;
}
