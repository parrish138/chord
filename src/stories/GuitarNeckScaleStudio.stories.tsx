import type { Meta, StoryObj } from '@storybook/react';
import { GuitarNeckScaleStudio } from '../components/scale/GuitarNeckScaleStudio';

const meta: Meta<typeof GuitarNeckScaleStudio> = {
  title: 'Guitar/GuitarNeckScaleStudio',
  component: GuitarNeckScaleStudio,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GuitarNeckScaleStudio>;

export const DefaultStudio: Story = {};
