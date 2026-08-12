export type DiatonicCategory = 'all-notes' | 'diatonic' | 'non-diatonic' | 'exotic' | 'pentatonic-blues';
export type NoteRole = 'root' | 'chord-tone' | 'characteristic' | 'colour' | 'tension';

export interface ScaleDefinition {
  id: string;
  name: string;
  category: DiatonicCategory;
  intervals: number[]; // Semitone offsets from root (0 to 11)
  intervalNames: string[]; // ['1', '2', '3', ...]
  description: string;
  characteristicTones?: string[]; // e.g. ['6'] for Dorian, ['b2'] for Phrygian, ['#4'] for Lydian
  tonicChordQuality?: string;     // e.g. 'maj7', 'm7', '7', 'm7b5'
  chordTones?: string[];          // e.g. ['1', '3', '5', '7']
  colourTones?: string[];         // e.g. ['2', '4', '6']
  modalComparison?: {
    referenceMode: string;        // e.g. 'Aeolian'
    diffLabel: string;            // e.g. 'Natural 6th (6) instead of ♭6'
  };
}

export interface FretboardNote {
  stringNum: number; // 1 to 6 (1 = High E, 6 = Low E)
  fret: number;      // 0 to 22
  noteName: string;  // e.g. "C", "F#"
  octave: number;    // e.g. 2, 3, 4, 5
  freq: number;      // Hz
  interval: string;  // e.g. "1", "b3", "5"
  isRoot: boolean;
  isScaleNote?: boolean;
  isEnabled: boolean;
  noteRole?: NoteRole;
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
