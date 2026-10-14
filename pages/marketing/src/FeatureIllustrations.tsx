import {
  OmnibarExperience,
  TabbySurface,
  TabManagerExperience,
} from '@extension/app'
import { MemoryTabbyProvider } from '@extension/providers/memory'
import { useState } from 'react'
import { createMarketingDemo, searchExamples } from './demo'
import { ScaledIllustration } from './ScaledIllustration'
import { SeasonalStylePlayground } from './SeasonalStylePlayground'
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
}

const CustomizeIllustration = () => <SeasonalStylePlayground />

const ProductIllustration = ({ feature }: { feature: 'manage' | 'find' }) => {
  const [demo] = useState(() => {
    const instance = createMarketingDemo('light')
    if (feature === 'manage') {
      instance.restore(instance.frames[1]!.state)
      instance.views.tabManager.setState({
        sidebarExpanded: false,
        scrollTop: 0,
      })
    }
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
      >
        <TabbySurface
          inputMode="static"
          motion="reduced"
          className="feature-product-surface"
        >
          {feature === 'manage' ? (
            <TabManagerExperience focusOnMount={false} />
          ) : (
            <OmnibarExperience onDismiss={() => {}} />
          )}
        </TabbySurface>
      </MemoryTabbyProvider>
    </ScaledIllustration>
  )
}

export const FeatureIllustration = ({ feature }: { feature: HomeFeatureId }) =>
  feature === 'customize' ? (
    <CustomizeIllustration />
  ) : (
    <ProductIllustration feature={feature} />
  )
