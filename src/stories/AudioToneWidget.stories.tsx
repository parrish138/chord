import type { Meta, StoryObj } from '@storybook/react';
import { AudioToneWidget } from '../components/audio/AudioToneWidget';

const meta: Meta<typeof AudioToneWidget> = {
  title: 'Guitar/AudioToneWidget',
  component: AudioToneWidget,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof AudioToneWidget>;

export const DefaultWidget: Story = {};
