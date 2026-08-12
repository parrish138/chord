import type { Meta, StoryObj } from '@storybook/react';
import { CAGEDMatrix } from '../components/chord/CAGEDMatrix';

const meta: Meta<typeof CAGEDMatrix> = {
  title: 'Guitar/CAGEDMatrix',
  component: CAGEDMatrix,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CAGEDMatrix>;

export const DefaultMatrix: Story = {};
