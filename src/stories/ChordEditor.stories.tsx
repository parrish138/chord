import type { Meta, StoryObj } from '@storybook/react';
import { ChordEditor } from '../components/chord/ChordEditor';
import { PRESET_CHORDS } from '../components/chord/ChordLibrary';

const meta: Meta<typeof ChordEditor> = {
  title: 'Guitar/ChordEditor',
  component: ChordEditor,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ChordEditor>;

export const DefaultEditor: Story = {
  args: {
    initialChord: PRESET_CHORDS[0],
  },
};

export const BarreChordEditor: Story = {
  args: {
    initialChord: PRESET_CHORDS[12], // F Major Barre
  },
};
