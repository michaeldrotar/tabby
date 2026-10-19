import { BrowserTabItem } from '@extension/ui/BrowserTabItem'
import { Surface } from '@extension/ui/Surface'
import {
  additionalNeutralColors,
  THEME_ACCENT_PALETTES,
  THEME_NEUTRAL_PALETTES,
} from '@extension/ui/theme-colors'
import { PromoFrame } from '../components/PromoFrame'
import { PromoBody, PromoEyebrow, PromoHeadline } from '../components/PromoText'
import type { PromoPalette } from '../components/PromoTabManager'
import type {
  ThemeAccentPalette,
  ThemeNeutralPalette,
} from '@extension/ui/theme-colors'

const neutralToneColors = {
  slate: { light: '#e2e8f0', dark: '#1e293b' },
  gray: { light: '#e5e7eb', dark: '#1f2937' },
  zinc: { light: '#e4e4e7', dark: '#27272a' },
  neutral: { light: '#e5e5e5', dark: '#262626' },
  stone: { light: '#e7e5e4', dark: '#292524' },
  taupe: {
    light: additionalNeutralColors.taupe[200],
    dark: additionalNeutralColors.taupe[800],
  },
  mauve: {
    light: additionalNeutralColors.mauve[200],
    dark: additionalNeutralColors.mauve[800],
  },
  mist: {
    light: additionalNeutralColors.mist[200],
    dark: additionalNeutralColors.mist[800],
  },
  olive: {
    light: additionalNeutralColors.olive[200],
    dark: additionalNeutralColors.olive[800],
  },
} satisfies Record<ThemeNeutralPalette, { light: string; dark: string }>

const accentColors = {
  red: '#ef4444',
  orange: '#f97316',
  amber: '#f59e0b',
  yellow: '#eab308',
  lime: '#84cc16',
  green: '#22c55e',
  emerald: '#10b981',
  teal: '#14b8a6',
  cyan: '#06b6d4',
  sky: '#0ea5e9',
  blue: '#3b82f6',
  indigo: '#6366f1',
  violet: '#8b5cf6',
  purple: '#a855f7',
  fuchsia: '#d946ef',
  pink: '#ec4899',
  rose: '#f43f5e',
} satisfies Record<ThemeAccentPalette, string>

const examples: {
  id: number
  title: string
  url: string
  letter: string
  favicon: string
  theme: 'light' | 'dark'
  palette: PromoPalette
  className: string
}[] = [
  {
    id: 901,
    title: 'Product brief',
    url: 'https://notion.so/product-brief',
    letter: 'P',
    favicon: '#e47a3f',
    theme: 'light',
    palette: {
      background: 'stone',
      foreground: 'neutral',
      accent: 'rose',
    },
    className: 'theme-tab-example--one',
  },
  {
    id: 902,
    title: 'Design system',
    url: 'https://figma.com/design/system',
    letter: 'D',
    favicon: '#a85bc9',
    theme: 'dark',
    palette: {
      background: 'zinc',
      foreground: 'slate',
      accent: 'blue',
    },
    className: 'theme-tab-example--two',
  },
  {
    id: 903,
    title: 'Team inbox',
    url: 'https://mail.google.com/mail/inbox',
    letter: 'T',
    favicon: '#4778d1',
    theme: 'light',
    palette: {
      background: 'gray',
      foreground: 'slate',
      accent: 'violet',
    },
    className: 'theme-tab-example--three',
  },
  {
    id: 904,
    title: 'Launch checklist',
    url: 'https://github.com/tabby/launch',
    letter: 'L',
    favicon: '#39a87c',
    theme: 'dark',
    palette: {
      background: 'neutral',
      foreground: 'stone',
      accent: 'orange',
    },
    className: 'theme-tab-example--four',
  },
  {
    id: 905,
    title: 'Reading list',
    url: 'https://read.amazon.com',
    letter: 'R',
    favicon: '#d15461',
    theme: 'light',
    palette: {
      background: 'slate',
      foreground: 'gray',
      accent: 'teal',
    },
    className: 'theme-tab-example--five',
  },
]

const ToneSwatches = ({
  label,
  mode,
}: {
  label: string
  mode: 'light' | 'dark'
}) => (
  <div className="theme-swatch-group">
    <h2>{label}</h2>
    <div className="theme-swatch-row">
      {THEME_NEUTRAL_PALETTES.map((palette) => (
        <span
          className="theme-swatch theme-swatch--tone"
          key={`${mode}-${palette}`}
          style={{ backgroundColor: neutralToneColors[palette][mode] }}
          title={`${palette} ${mode} tone`}
          aria-label={`${palette} ${mode} tone`}
        />
      ))}
    </div>
  </div>
)

const AccentSwatches = () => (
  <div className="theme-swatch-group">
    <h2>Accent colors</h2>
    <div className="theme-swatch-row theme-swatch-row--accents">
      {THEME_ACCENT_PALETTES.map((accent) => (
        <span
          className="theme-swatch theme-swatch--accent"
          key={accent}
          style={{ backgroundColor: accentColors[accent] }}
          title={accent}
          aria-label={`${accent} accent`}
        />
      ))}
    </div>
  </div>
)

const ThemeTabExample = ({
  example,
}: {
  example: (typeof examples)[number]
}) => (
  <div
    className={`
      theme-tab-example
      ${example.className}
    `}
  >
    <Surface
      theme={example.theme}
      palette={example.palette}
      inputMode="static"
      motion="reduced"
      className="theme-tab-surface"
    >
      <BrowserTabItem
        tabId={example.id}
        title={example.title}
        url={example.url}
        active
        selected
        favicon={
          <span
            className="theme-tab-favicon"
            style={{ backgroundColor: example.favicon }}
          >
            {example.letter}
          </span>
        }
      />
    </Surface>
  </div>
)

export const ThemesPage = () => (
  <PromoFrame>
    <section className="themes-copy">
      <PromoEyebrow>Your theme, your way</PromoEyebrow>
      <PromoHeadline>Set the tone for every tab.</PromoHeadline>
      <PromoBody>
        Choose a look for light and dark mode, then make it yours with a bold
        accent.
      </PromoBody>
    </section>

    <section className="themes-palette" aria-label="Theme color choices">
      <ToneSwatches label="Light tones" mode="light" />
      <ToneSwatches label="Dark tones" mode="dark" />
      <AccentSwatches />
    </section>

    <section
      className="themes-preview-stage"
      aria-label="Tabs in different theme combinations"
    >
      {examples.map((example) => (
        <ThemeTabExample example={example} key={example.id} />
      ))}
    </section>
  </PromoFrame>
)
