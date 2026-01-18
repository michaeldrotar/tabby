import { RadialLoadingSpinner } from '@extension/ui/RadialLoadingSpinner'
import type { Meta, StoryObj } from '@storybook/react'

const meta = {
  title: 'Components/RadialLoadingSpinner',
  component: RadialLoadingSpinner,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A radial loading spinner with size-based styling. Features a dynamic arc that grows and shrinks as it rotates, creating an organic feel.',
      },
    },
  },
  tags: [],
  argTypes: {
    size: {
      description: 'Size of the spinner in pixels',
      control: { type: 'range', min: 12, max: 60, step: 2 },
    },
    variant: {
      description: 'Color variant using theme colors',
      control: 'select',
      options: ['accent', 'foreground', 'muted'],
    },
  },
} satisfies Meta<typeof RadialLoadingSpinner>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default radial spinner with interactive controls.
 */
export const Default: Story = {
  args: {
    size: 20,
    variant: 'foreground',
  },
  render: (args) => (
    <div className="flex flex-col items-center gap-4 p-8">
      <RadialLoadingSpinner {...args} />
    </div>
  ),
}

/**
 * Multiple sizes comparison.
 */
export const SizeComparison: Story = {
  parameters: {
    controls: {
      disable: true,
    },
  },
  render: () => (
    <div className="flex items-center gap-8 p-8">
      <div className="flex flex-col items-center gap-2">
        <RadialLoadingSpinner size={16} />
        <span className="text-muted text-xs">16px</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <RadialLoadingSpinner size={20} />
        <span className="text-muted text-xs">20px</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <RadialLoadingSpinner size={24} />
        <span className="text-muted text-xs">24px</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <RadialLoadingSpinner size={32} />
        <span className="text-muted text-xs">32px</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <RadialLoadingSpinner size={40} />
        <span className="text-muted text-xs">40px</span>
      </div>
    </div>
  ),
}

/**
 * Multiple color variants comparison.
 */
export const VariantComparison: Story = {
  parameters: {
    controls: {
      disable: true,
    },
  },
  render: () => (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-center gap-4">
        <span className="text-muted w-24 text-sm">Foreground:</span>
        <RadialLoadingSpinner variant="foreground" />
      </div>
      <div className="flex items-center gap-4">
        <span className="text-muted w-24 text-sm">Accent:</span>
        <RadialLoadingSpinner variant="accent" />
      </div>
      <div className="flex items-center gap-4">
        <span className="text-muted w-24 text-sm">Muted:</span>
        <RadialLoadingSpinner variant="muted" />
      </div>
    </div>
  ),
}

/**
 * Side-by-side comparison of normal animations vs reduced motion.
 */
export const ReducedMotionComparison: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story:
          'Compare normal animations with reduced motion. Left shows full animations, right shows static version for users with motion sensitivity.',
      },
    },
  },
  render: () => (
    <div className="grid grid-cols-2 gap-8 p-8">
      {/* Normal Motion */}
      <div className="flex flex-col gap-4">
        <h2 className="text-foreground mb-2 text-sm font-semibold">
          Normal Motion
        </h2>
        <p className="text-muted mb-4 text-xs">
          Full animations with variable stroke
        </p>
        <div className="flex items-center gap-4">
          <RadialLoadingSpinner size={20} variant="foreground" />
          <RadialLoadingSpinner size={24} variant="accent" />
          <RadialLoadingSpinner size={32} variant="muted" />
        </div>
      </div>

      {/* Reduced Motion */}
      <div className="flex flex-col gap-4">
        <h2 className="text-foreground mb-2 text-sm font-semibold">
          Reduced Motion
        </h2>
        <p className="text-muted mb-4 text-xs">
          Static spinners (no animation)
        </p>
        <div className="flex items-center gap-4">
          <RadialLoadingSpinner
            size={20}
            variant="foreground"
            data-force-reduced-motion="true"
          />
          <RadialLoadingSpinner
            size={24}
            variant="accent"
            data-force-reduced-motion="true"
          />
          <RadialLoadingSpinner
            size={32}
            variant="muted"
            data-force-reduced-motion="true"
          />
        </div>
      </div>
    </div>
  ),
}
