import type { Meta, StoryObj } from '@storybook/react';
import { ChordDiagram } from '../components/chord/ChordDiagram';
import { PRESET_CHORDS } from '../components/chord/ChordLibrary';

const meta: Meta<typeof ChordDiagram> = {
  title: 'Guitar/ChordDiagram',
  component: ChordDiagram,
  tags: ['autodocs'],
  argTypes: {
    options: {
      control: 'object',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ChordDiagram>;

export const CMajor: Story = {
  args: {
    chord: PRESET_CHORDS[0], // C Major
    options: {
      theme: 'sleek-dark',
      showFingerNumbers: true,
      size: 'md',
    },
  },
};

export const FMajorBarre: Story = {
  args: {
    chord: PRESET_CHORDS[12], // F Major Barre
    options: {
      theme: 'sleek-dark',
      showFingerNumbers: true,
      size: 'md',
    },
  },
};

export const NeonCyberTheme: Story = {
  args: {
    chord: PRESET_CHORDS[1], // C7
    options: {
      theme: 'neon-cyber',
      showFingerNumbers: true,
      size: 'lg',
    },
  },
};

export const ClassicWoodTheme: Story = {
  args: {
    chord: PRESET_CHORDS[6], // G Major
    options: {
      theme: 'classic-wood',
      showFingerNumbers: true,
      size: 'lg',
    },
  },
};

export const VintagePaperTheme: Story = {
  args: {
    chord: PRESET_CHORDS[4], // A Minor
    options: {
      theme: 'vintage-paper',
      showFingerNumbers: true,
      size: 'md',
    },
  },
};
