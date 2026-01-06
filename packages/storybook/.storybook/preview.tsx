import './storybook.css'
import type { Preview } from '@storybook/react'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'dark',
      values: [
        {
          name: 'dark',
          value: '#1a1a1a',
        },
        {
          name: 'light',
          value: '#f5f5f5',
        },
      ],
    },
  },
  decorators: [
    (Story) => (
      <div
        className="min-h-screen bg-background text-foreground antialiased"
        data-theme="dark"
        data-theme-background="slate"
        data-theme-accent="blue"
      >
        <Story />
      </div>
    ),
  ],
}

export default preview
