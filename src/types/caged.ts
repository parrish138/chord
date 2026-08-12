import { FingerPosition, BarreChord } from './chord';

export type CAGEDForm = 'E Form' | 'A Form' | 'D Form' | 'C Form' | 'G Form';

export type CAGEDQuality = 'Major' | 'Minor' | '7' | 'Minor 7' | 'Major7' | '5 Chords';

export interface CAGEDTemplate {
  form: CAGEDForm;
  quality: CAGEDQuality;
  rootString: number; // 6 for E & G forms, 5 for A & C forms, 4 for D form
  relativeFretOffset: number; // Base offset from root note fret
  positions: FingerPosition[]; // Relative fret numbers from base
  barres?: BarreChord[];        // Relative fret barres
  mutedStrings?: number[];
  openStrings?: number[];
}

export interface TransposedCAGEDChord {
  id: string;
  form: CAGEDForm;
  quality: CAGEDQuality;
  rootNote: string;
  chordName: string;
  baseFret: number;
  positions: FingerPosition[];
  barres?: BarreChord[];
  mutedStrings?: number[];
  openStrings?: number[];
}
