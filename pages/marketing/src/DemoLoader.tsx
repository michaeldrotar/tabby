import { lazy, Suspense } from 'react'
import type { ProductDemoProps } from './ProductDemo'

const Demo = lazy(() =>
  import('./ProductDemo').then((module) => ({ default: module.ProductDemo })),
)

export const ProductDemo = (props: ProductDemoProps) => (
  <Suspense
    fallback={<div className="product-placeholder">Loading Tabby…</div>}
  >
    <Demo {...props} />
  </Suspense>
)
