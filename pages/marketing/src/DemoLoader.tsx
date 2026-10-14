import { lazy, Suspense } from 'react'
import type { HomeFeatureId } from './content'
import type { ProductDemoProps } from './ProductDemo'

const Demo = lazy(() =>
  import('./ProductDemo').then((module) => ({ default: module.ProductDemo })),
)

const Illustration = lazy(() =>
  import('./BrowserIllustration').then((module) => ({
    default: module.BrowserIllustration,
  })),
)

export const BrowserIllustration = () => (
  <Suspense
    fallback={<div className="browser-placeholder">Loading browser view…</div>}
  >
    <Illustration />
  </Suspense>
)

export const ProductDemo = (props: ProductDemoProps) => (
  <Suspense
    fallback={<div className="product-placeholder">Loading Tabby…</div>}
  >
    <Demo {...props} />
  </Suspense>
)

const FeatureArt = lazy(() =>
  import('./FeatureIllustrations').then((module) => ({
    default: module.FeatureIllustration,
  })),
)

export const FeatureIllustration = ({
  feature,
}: {
  feature: HomeFeatureId
}) => (
  <Suspense
    fallback={
      <div
        className={`
          feature-art
          feature-art--${feature}
        `}
      />
    }
  >
    <FeatureArt feature={feature} />
  </Suspense>
)
