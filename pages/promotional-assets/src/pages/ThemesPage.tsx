import { curatedThemes, themeTokens } from '@extension/ui/theme-colors'
import { PromoFrame } from '../components/PromoFrame'
import {
  promoManagerModel,
  promoTab,
  PromoTabManager,
  promoWindow,
} from '../components/PromoTabManager'
import { PromoBody, PromoEyebrow, PromoHeadline } from '../components/PromoText'

const examples = [
  { preset: 'tabby', mode: 'light' },
  { preset: 'graphite', mode: 'dark' },
  { preset: 'arcade', mode: 'light' },
] as const

const model = promoManagerModel({
  windows: [
    promoWindow(1, 'Design studio', [
      promoTab(901, 'Design system', 'figma.com', { active: true }),
      promoTab(902, 'Product brief', 'notion.so'),
      promoTab(903, 'Team inbox', 'mail.google.com'),
    ]),
  ],
  viewedWindowId: 1,
})

export const ThemesPage = () => (
  <PromoFrame>
    <section className="themes-copy">
      <PromoEyebrow>Your theme, your way</PromoEyebrow>
      <PromoHeadline>Set the tone for every tab.</PromoHeadline>
      <PromoBody>
        Familiar neutrals or something bolder. Choose a complete look for light
        and dark mode.
      </PromoBody>
    </section>
    <section className="themes-preview-stage" aria-label="Tabby theme previews">
      {examples.map(({ preset, mode }) => {
        const theme = curatedThemes.find((theme) => theme.id === preset)!
        return (
          <figure className="theme-manager-example" key={preset}>
            <div className="theme-manager-frame">
              <PromoTabManager
                model={model}
                theme={mode}
                tokens={themeTokens(theme[mode])}
                className="theme-manager-surface"
              />
            </div>
            <figcaption>
              <span>{theme.name}</span>{' '}
              <span>{mode === 'light' ? 'Light' : 'Dark'}</span>
            </figcaption>
          </figure>
        )
      })}
    </section>
  </PromoFrame>
)
