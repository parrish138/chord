import type { Meta, StoryObj } from '@storybook/react';
import { NashvilleStudio } from '../components/nashville/NashvilleStudio';

const meta: Meta<typeof NashvilleStudio> = {
  title: 'Guitar/NashvilleStudio',
  component: NashvilleStudio,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof NashvilleStudio>;

export const DefaultStudio: Story = {};
