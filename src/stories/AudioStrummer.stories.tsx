import type { Meta, StoryObj } from '@storybook/react';
import { AudioStrummer } from '../components/chord/AudioStrummer';
import { PRESET_CHORDS } from '../components/chord/ChordLibrary';

const meta: Meta<typeof AudioStrummer> = {
  title: 'Guitar/AudioStrummer',
  component: AudioStrummer,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof AudioStrummer>;

export const DefaultStrummer: Story = {
  args: {
    chord: PRESET_CHORDS[0], // C Major
  },
};
