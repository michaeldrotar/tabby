import {
  THEME_ACCENT_PALETTES,
  THEME_ACCENT_STRENGTH_OPTIONS,
  THEME_NEUTRAL_PALETTES,
} from '@extension/ui/theme-colors'
import type { Meta, StoryObj } from '@storybook/react'

const ColorSwatch = ({ label, cssVar }: { label: string; cssVar: string }) => (
  <div className="flex items-center gap-2">
    <div
      className="h-6 w-24 flex-shrink-0 rounded border"
      style={{ backgroundColor: `var(${cssVar})` }}
    />
    <span className="text-foreground text-xs">{label}</span>
  </div>
)

const ThemeModeColumn = ({ mode }: { mode: 'light' | 'dark' }) => (
  <div
    data-theme={mode}
    data-theme-background="slate"
    data-theme-foreground="zinc"
    data-theme-accent="blue"
    className="bg-background space-y-8 p-8"
  >
    <div className="text-muted mb-8 text-xs uppercase tracking-wider">
      {mode} mode
    </div>

    {/* Foreground Section */}
    <section className="space-y-6">
      <h2
        className={`
          text-foreground text-sm font-semibold uppercase tracking-wider
        `}
      >
        Foreground
      </h2>
      {THEME_NEUTRAL_PALETTES.map((palette) => (
        <div key={palette}>
          <h3 className="text-foreground mb-3 text-xs font-medium capitalize">
            {palette}
          </h3>
          <div
            data-theme={mode}
            data-theme-foreground={palette}
            data-theme-background="slate"
            data-theme-accent="blue"
            className={`
              grid grid-cols-1 space-y-2
              lg:grid-cols-2
            `}
          >
            <ColorSwatch label="foreground" cssVar="--foreground" />
            <ColorSwatch label="card-foreground" cssVar="--card-foreground" />
            <ColorSwatch label="popover-fg" cssVar="--popover-foreground" />
            <ColorSwatch label="muted" cssVar="--muted" />
            <ColorSwatch label="tooltip" cssVar="--tooltip" />
          </div>
        </div>
      ))}
    </section>

    {/* Background Section */}
    <section className="space-y-6">
      <h2
        className={`
          text-foreground text-sm font-semibold uppercase tracking-wider
        `}
      >
        Background
      </h2>
      {THEME_NEUTRAL_PALETTES.map((palette) => (
        <div key={palette}>
          <h3 className="text-foreground mb-3 text-xs font-medium capitalize">
            {palette}
          </h3>
          <div
            data-theme={mode}
            data-theme-background={palette}
            data-theme-foreground="zinc"
            data-theme-accent="blue"
            className={`
              grid grid-cols-1 space-y-2
              lg:grid-cols-2
            `}
          >
            <ColorSwatch label="background" cssVar="--background" />
            <ColorSwatch label="card" cssVar="--card" />
            <ColorSwatch label="popover" cssVar="--popover" />
            <ColorSwatch label="input" cssVar="--input" />
            <ColorSwatch label="border" cssVar="--border" />
            <ColorSwatch label="highlighted" cssVar="--highlighted" />
            <ColorSwatch label="tooltip-fg" cssVar="--tooltip-foreground" />
          </div>
        </div>
      ))}
    </section>

    {/* Accent Section */}
    <section className="space-y-6">
      <h2
        className={`
          text-foreground text-sm font-semibold uppercase tracking-wider
        `}
      >
        Accents
      </h2>
      {THEME_ACCENT_PALETTES.map((palette) => (
        <div key={palette}>
          <h3 className="text-foreground mb-3 text-xs font-medium capitalize">
            {palette}
          </h3>
          <div
            data-theme={mode}
            data-theme-accent={palette}
            data-theme-background="slate"
            data-theme-foreground="zinc"
            className="space-y-2"
          >
            <div className="grid grid-cols-3 gap-2">
              {THEME_ACCENT_STRENGTH_OPTIONS.map((strength) => (
                <div
                  key={strength}
                  style={{ ['--accent-strength' as string]: strength }}
                  className="flex flex-col items-center gap-1.5"
                >
                  <div
                    className={`
                      bg-accent/[calc(var(--accent-strength)*1%)] h-8 w-full
                      rounded border
                    `}
                  />
                  <span className="text-foreground text-xs">{strength}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </section>
  </div>
)

const ColorShowcaseComponent = () => <div />

const meta = {
  title: 'Theme/Colors',
  component: ColorShowcaseComponent,
  parameters: {
    layout: 'fullscreen',
  },
  render: (_args, _context) => {
    return (
      <div className="min-h-screen">
        <div className="mx-auto max-w-7xl px-8 py-12">
          <h1
            className={`
              text-foreground mb-12 text-center text-3xl font-bold
              tracking-tight
            `}
          >
            Colors
          </h1>

          <div
            className={`
              grid grid-cols-2 gap-0 overflow-hidden rounded-lg border
            `}
          >
            {/* Left side - LIGHT mode */}
            <div className="border-r">
              <ThemeModeColumn mode="light" />
            </div>

            {/* Right side - DARK mode */}
            <div>
              <ThemeModeColumn mode="dark" />
            </div>
          </div>
        </div>
      </div>
    )
  },
} satisfies Meta<typeof ColorShowcaseComponent>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
