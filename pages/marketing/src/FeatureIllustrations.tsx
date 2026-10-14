import {
  OmnibarExperience,
  OptionsExperience,
  TabbySurface,
  TabManagerExperience,
} from '@extension/app'
import { MemoryTabbyProvider } from '@extension/providers/memory'
import { useState } from 'react'
import { assets } from './content'
import { createMarketingDemo, searchExamples } from './demo'
import { ScaledIllustration } from './ScaledIllustration'
import type { HomeFeatureId } from './content'

const illustrationSearch = { results: searchExamples }
const dimensions = {
  manage: {
    width: 560,
    height: 500,
    label:
      'Tabby’s real tab manager showing all windows and three selected tabs',
  },
  find: {
    width: 560,
    height: 440,
    label:
      'Tabby’s real search finding pages across open windows, bookmarks, history, and recently closed pages',
  },
  customize: {
    width: 740,
    height: 560,
    label:
      'Tabby’s real appearance settings in a dark theme, with theme, palette, accent, and accent strength controls',
  },
}

export const FeatureIllustration = ({
  feature,
}: {
  feature: HomeFeatureId
}) => {
  const [demo] = useState(() => {
    const instance = createMarketingDemo(
      feature === 'customize' ? 'dark' : 'light',
    )
    if (feature === 'manage') {
      instance.restore(instance.frames[1]!.state)
      instance.views.tabManager.setState({
        sidebarExpanded: false,
        scrollTop: 0,
      })
    }
    if (feature === 'customize')
      instance.views.options.setState({ scrollTop: 150 })
    return instance
  })
  return (
    <ScaledIllustration
      {...dimensions[feature]}
      className={`
        feature-art
        feature-art--${feature}
      `}
    >
      <MemoryTabbyProvider
        resources={{ backend: demo.backend, preferences: demo.preferences }}
        views={demo.views}
        omnibar={illustrationSearch}
        optionsMetadata={{ logoUrl: assets.face }}
      >
        <TabbySurface
          inputMode="static"
          motion="reduced"
          className="feature-product-surface"
        >
          {feature === 'manage' ? (
            <TabManagerExperience focusOnMount={false} />
          ) : feature === 'find' ? (
            <OmnibarExperience onDismiss={() => {}} />
          ) : (
            <OptionsExperience />
          )}
        </TabbySurface>
      </MemoryTabbyProvider>
    </ScaledIllustration>
  )
}
