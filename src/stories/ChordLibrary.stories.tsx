import type { Meta, StoryObj } from '@storybook/react';
import { ChordLibrary } from '../components/chord/ChordLibrary';

const meta: Meta<typeof ChordLibrary> = {
  title: 'Guitar/ChordLibrary',
  component: ChordLibrary,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ChordLibrary>;

export const DefaultLibrary: Story = {};
