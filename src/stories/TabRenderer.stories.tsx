import type { Meta, StoryObj } from '@storybook/react';
import { TabRenderer } from '../components/tab/TabRenderer';
import { TabTrack } from '../types/tab';

const sampleTrack: TabTrack = {
  id: 'sample-track',
  title: 'Classic Riff',
  tempoBpm: 120,
  timeSignature: '4/4',
  columns: [
    { id: '1', chordLabel: 'E5', notes: [{ stringNum: 6, fret: 0 }, { stringNum: 5, fret: 2 }] },
    { id: '2', notes: [{ stringNum: 6, fret: 0 }] },
    { id: '3', notes: [{ stringNum: 6, fret: 3 }] },
    { id: '4', notes: [{ stringNum: 6, fret: 0 }] },
    { id: '5', chordLabel: 'G5', notes: [{ stringNum: 6, fret: 3 }, { stringNum: 5, fret: 5 }] },
    { id: '6', notes: [{ stringNum: 6, fret: 0 }] },
    { id: '7', chordLabel: 'A5', notes: [{ stringNum: 5, fret: 0 }, { stringNum: 4, fret: 2 }] },
  ],
};

const meta: Meta<typeof TabRenderer> = {
  title: 'Guitar/TabRenderer',
  component: TabRenderer,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TabRenderer>;

export const DefaultRenderer: Story = {
  args: {
    track: sampleTrack,
    activeColumnIndex: 0,
  },
};
