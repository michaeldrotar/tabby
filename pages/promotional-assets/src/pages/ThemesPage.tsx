import { BrowserTabItem } from '@extension/ui/BrowserTabItem'
import { Surface } from '@extension/ui/Surface'
import {
  curatedThemes,
  themeCollections,
  themeTokens,
} from '@extension/ui/theme-colors'
import { PromoFrame } from '../components/PromoFrame'
import { PromoBody, PromoEyebrow, PromoHeadline } from '../components/PromoText'

const examples = [
  {
    title: 'Product brief',
    url: 'https://notion.so/product-brief',
    preset: 'matcha',
    mode: 'light',
    letter: 'P',
    favicon: '#e47a3f',
    position: 'one',
  },
  {
    title: 'Design system',
    url: 'https://figma.com/design/system',
    preset: 'tidal',
    mode: 'dark',
    letter: 'D',
    favicon: '#a85bc9',
    position: 'two',
  },
  {
    title: 'Team inbox',
    url: 'https://mail.google.com/mail/inbox',
    preset: 'rose',
    mode: 'light',
    letter: 'T',
    favicon: '#4778d1',
    position: 'three',
  },
  {
    title: 'Launch checklist',
    url: 'https://github.com/tabby/launch',
    preset: 'arcade',
    mode: 'dark',
    letter: 'L',
    favicon: '#39a87c',
    position: 'four',
  },
  {
    title: 'Reading list',
    url: 'https://read.amazon.com',
    preset: 'reef',
    mode: 'light',
    letter: 'R',
    favicon: '#d15461',
    position: 'five',
  },
] as const

export const ThemesPage = () => (
  <PromoFrame>
    <section className="themes-copy">
      <PromoEyebrow>Your theme, your way</PromoEyebrow>
      <PromoHeadline>Set the tone for every tab.</PromoHeadline>
      <PromoBody>
        Choose a complete colorful or tonal look, with colors that belong
        together in light and dark mode.
      </PromoBody>
    </section>
    <section className="themes-palette" aria-label="Theme choices">
      {themeCollections.map((collection) => (
        <div className="theme-swatch-group" key={collection}>
          <h2>{collection}</h2>
          <div className="theme-preset-grid">
            {curatedThemes
              .filter((theme) => theme.collection === collection)
              .map((theme) => (
                <div className="theme-preset-swatch" key={theme.id}>
                  <span
                    style={{
                      background: `linear-gradient(90deg, ${theme.dark.canvas} 0% 45%, ${theme.dark.selection} 45% 80%, ${theme.dark.accent} 80%)`,
                    }}
                  />
                  {theme.name}
                </div>
              ))}
          </div>
        </div>
      ))}
    </section>
    <section
      className="themes-preview-stage"
      aria-label="Tabs in coordinated themes"
    >
      {examples.map((example, index) => {
        const theme = curatedThemes.find(
          (theme) => theme.id === example.preset,
        )!
        return (
          <div
            className={`
              theme-tab-example
              theme-tab-example--${example.position}
            `}
            key={example.title}
          >
            <Surface
              theme={example.mode}
              tokens={themeTokens(theme[example.mode])}
              inputMode="static"
              motion="reduced"
              className="theme-tab-surface"
            >
              <BrowserTabItem
                tabId={901 + index}
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
      })}
    </section>
  </PromoFrame>
)
