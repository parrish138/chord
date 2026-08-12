import type { Meta, StoryObj } from '@storybook/react';
import { TabEditor } from '../components/tab/TabEditor';

const meta: Meta<typeof TabEditor> = {
  title: 'Guitar/TabEditor',
  component: TabEditor,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TabEditor>;

export const DefaultEditor: Story = {};
