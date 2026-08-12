export interface TabNote {
  stringNum: number; // 1 (High E) to 6 (Low E)
  fret: number;      // 0 to 24
}

export interface TabColumn {
  id: string;
  notes: TabNote[];
  chordLabel?: string;
  durationMs?: number; // Beat step duration
}

export interface TabTrack {
  id: string;
  title: string;
  tempoBpm: number;
  timeSignature: string; // e.g. "4/4"
  columns: TabColumn[];
}
