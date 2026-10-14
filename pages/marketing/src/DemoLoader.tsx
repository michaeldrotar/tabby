import { lazy, Suspense } from 'react'
import { MotionReveal } from './MotionReveal'
import type { HomeFeatureId } from './content'
import type { ProductDemoProps } from './ProductDemo'

const demoModule = import('./ProductDemo').then((module) => ({
  default: module.ProductDemo,
}))
const Demo = lazy(() => demoModule)

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
    fallback={<div className="product-placeholder" aria-hidden="true" />}
  >
    {props.separated ? (
      <MotionReveal className="demo-arrival" threshold={0.18}>
        <Demo {...props} />
      </MotionReveal>
    ) : (
      <Demo {...props} />
    )}
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
