export type CanvasWidgetId =
  | 'scale-presets'
  | 'neck-diagram'
  | 'guitar-sequencer'
  | 'tablature'
  | 'metronome'
  | 'tone-engine'
  | 'drum-machine'
  | 'nashville'
  | 'caged';

export interface CanvasWidgetConfig {
  id: CanvasWidgetId;
  name: string;
  category: 'neck' | 'audio' | 'rhythm' | 'chords';
  iconName: string;
  description: string;
  isEnabled: boolean;
  isExpanded: boolean;
  order: number;
}
