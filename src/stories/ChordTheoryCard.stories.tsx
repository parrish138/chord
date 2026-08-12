import type { Meta, StoryObj } from '@storybook/react';
import { ChordTheoryCard } from '../components/chord/ChordTheoryCard';
import { PRESET_CHORDS } from '../components/chord/ChordLibrary';

const meta: Meta<typeof ChordTheoryCard> = {
  title: 'Guitar/ChordTheoryCard',
  component: ChordTheoryCard,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ChordTheoryCard>;

export const CMajorTheory: Story = {
  args: {
    chord: PRESET_CHORDS[0], // C Major
  },
};

export const C7DominantTheory: Story = {
  args: {
    chord: PRESET_CHORDS[2], // C7
  },
};

export const CMajor7Theory: Story = {
  args: {
    chord: PRESET_CHORDS[3], // Cmaj7
  },
};

export const AMinor7Theory: Story = {
  args: {
    chord: PRESET_CHORDS[6], // Am7
  },
};
