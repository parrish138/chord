export type StringStatus = 'played' | 'muted' | 'open';

export type FingerNumber = '1' | '2' | '3' | '4' | 'T' | '';

export interface FingerPosition {
  string: number; // 1 (high E) to 6 (low E)
  fret: number;   // 1 to 24
  finger?: FingerNumber;
  label?: string; // e.g. "C", "R", "3rd", "5th"
  isRoot?: boolean;
}

export interface BarreChord {
  fret: number;
  startString: number; // 1 to 6
  endString: number;   // 1 to 6
  finger?: FingerNumber;
}

export type TuningPreset = 
  | 'Standard' 
  | 'Drop D' 
  | 'DADGAD' 
  | 'Open G' 
  | 'Open D' 
  | 'Half Step Down' 
  | 'Full Step Down';

export interface TuningConfig {
  name: TuningPreset;
  notes: string[]; // High E (string 1) to Low E (string 6)
}

export interface ChordDefinition {
  id: string;
  name: string;
  key: string;       // e.g. "C", "G", "A", "F#"
  suffix: string;    // e.g. "maj", "m", "7", "maj7", "m7", "sus4", "add9", "dim7"
  baseFret: number;  // Default 1
  fretsCount?: number; // How many frets to draw (default 4 or 5)
  // String state array from String 6 (low E) to String 1 (high E) or 1 to 6.
  // We use string 1 = high E, string 6 = low E for consistency.
  positions: FingerPosition[];
  barres?: BarreChord[];
  mutedStrings?: number[]; // Array of string numbers (1 to 6) muted ('X')
  openStrings?: number[];  // Array of string numbers (1 to 6) open ('O')
  tuning?: TuningConfig;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  tags?: string[];
  notes?: string; // Optional user notes
}

export type DiagramTheme = 
  | 'sleek-dark' 
  | 'classic-wood' 
  | 'neon-cyber' 
  | 'vintage-paper' 
  | 'minimal-light';

export interface DiagramOptions {
  theme?: DiagramTheme;
  showFingerNumbers?: boolean;
  showNoteNames?: boolean;
  showStringNames?: boolean;
  showFretNumbers?: boolean;
  orientation?: 'vertical' | 'horizontal';
  numStrings?: number;
  numFrets?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  interactive?: boolean;
  labelMode?: 'fingering' | 'interval';
}
