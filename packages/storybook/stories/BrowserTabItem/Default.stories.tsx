import { BrowserTabItem } from '@extension/ui/BrowserTabItem'
import type { Meta, StoryObj } from '@storybook/react'

// Simple colored icon for demonstration
const ColoredIcon = ({ color }: { color: string }) => (
  <div
    className={`
      h-5 w-5 rounded transition-transform
      group-hover:scale-110
    `}
    style={{ backgroundColor: color }}
  />
)

const meta = {
  title: 'Tab Manager/BrowserTabItem',
  component: BrowserTabItem,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A presentational component for displaying a browser tab in a list view. This is a "dumb" component with no Chrome API dependencies, receiving all data via props.',
      },
    },
  },
  tags: [],
  argTypes: {
    tabId: {
      description: 'Unique identifier for the browser tab',
      control: 'number',
    },
    title: {
      description: 'Title of the browser tab',
      control: 'text',
    },
    url: {
      description: 'URL of the browser tab',
      control: 'text',
    },
    favicon: {
      description: 'Custom icon/favicon component (overrides default favicon)',
      control: false,
    },
    onClick: {
      action: 'clicked',
      description: 'Called when the tab item is clicked',
    },
  },
  decorators: [
    (Story) => (
      <div className="flex w-96 flex-col gap-2 p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof BrowserTabItem>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default state showing a typical GitHub repository tab
 */
export const Default: Story = {
  args: {
    tabId: 1,
    title: 'GitHub - microsoft/vscode: Visual Studio Code',
    url: 'https://github.com/microsoft/vscode',
    favicon: <ColoredIcon color="#24292e" />,
  },
}

/**
 * Multiple tabs showing different websites
 */
export const MultipleExamples: Partial<Story> = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <>
      <BrowserTabItem
        tabId={1}
        title="GitHub - microsoft/vscode"
        url="https://github.com/microsoft/vscode"
        favicon={<ColoredIcon color="#24292e" />}
      />
      <BrowserTabItem
        tabId={2}
        title="Gmail - Inbox"
        url="https://mail.google.com/mail/u/0/#inbox"
        favicon={<ColoredIcon color="#EA4335" />}
      />
      <BrowserTabItem
        tabId={3}
        title="Google Docs - Project Plan"
        url="https://docs.google.com/document/d/abc123"
        favicon={<ColoredIcon color="#4285F4" />}
      />
      <BrowserTabItem
        tabId={4}
        title="Stack Overflow - How to use React hooks"
        url="https://stackoverflow.com/questions/53945763"
        favicon={<ColoredIcon color="#F48024" />}
      />
      <BrowserTabItem
        tabId={5}
        title="MDN Web Docs"
        url="https://developer.mozilla.org/en-US/"
        favicon={<ColoredIcon color="#000000" />}
      />
    </>
  ),
}

/**
 * Tab with a very long title that gets truncated
 */
export const LongTitle: Story = {
  args: {
    tabId: 1,
    title:
      'This is an extremely long tab title that should be truncated with an ellipsis when it exceeds the available width of the component because we want to ensure clean presentation',
    url: 'https://example.com/very/long/path/to/some/resource',
    favicon: <ColoredIcon color="#10b981" />,
  },
}

/**
 * Tab with a long domain that gets truncated
 */
export const LongDomain: Story = {
  args: {
    tabId: 1,
    title: 'Article Title',
    url: 'https://this-is-a-very-long-subdomain.example-domain-name.co.uk/path',
    favicon: <ColoredIcon color="#6366f1" />,
  },
}

/**
 * Tab without a favicon (shows fallback)
 */
export const NoFavicon: Story = {
  args: {
    tabId: 1,
    title: 'Local Development Server',
    url: 'http://localhost:3000',
    favicon: <ColoredIcon color="#6b7280" />,
  },
}

/**
 * Tab with custom icon instead of favicon
 */
export const CustomIcon: Story = {
  args: {
    tabId: 1,
    title: 'Custom Icon Example',
    url: 'https://example.com',
    favicon: <ColoredIcon color="#8b5cf6" />,
  },
}

/**
 * Tab without a title (shows fallback)
 */
export const NoTitle: Story = {
  args: {
    tabId: 1,
    title: '',
    url: 'https://example.com',
    favicon: <ColoredIcon color="#ef4444" />,
  },
}

/**
 * Tab with a very short domain
 */
export const ShortDomain: Story = {
  args: {
    tabId: 1,
    title: 'Example Page',
    url: 'https://ex.co',
    favicon: <ColoredIcon color="#f59e0b" />,
  },
}

/**
 * Interactive demo showing hover and focus states
 */
export const Interactive: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Try hovering over the tab and using keyboard navigation (Tab key to focus, Enter to activate).',
      },
    },
  },
  args: {
    tabId: 1,
    title: 'Interactive Tab - Hover and Focus',
    url: 'https://example.com',
    favicon: <ColoredIcon color="#3b82f6" />,
    onClick: (e) => {
      console.log('Tab clicked:', e)
    },
  },
}
