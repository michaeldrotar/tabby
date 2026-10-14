import './styles.css'
import { createRoot } from 'react-dom/client'
import { ProductDemo } from './DemoLoader'
import { Landing } from './Landing'
import type { Design } from './content'

const query = new URLSearchParams(location.search)
const path = location.pathname.split('/').filter(Boolean).at(-1)
const reviewPage =
  path === 'promotional-assets' || path === 'seasonal-icons' ? path : undefined
const pathDesign = path
const requested = ['companion', 'focus', 'playground'].includes(
  pathDesign ?? '',
)
  ? pathDesign
  : query.get('design')
const design: Design =
  requested === 'focus' || requested === 'playground' ? requested : 'companion'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Missing marketing app root element.')

const root = createRoot(rootElement)

if (reviewPage) {
  document.body.dataset.promoView =
    reviewPage === 'seasonal-icons'
      ? 'seasonal'
      : query.has('asset')
        ? 'asset'
        : 'gallery'
  document.title =
    reviewPage === 'seasonal-icons'
      ? 'Tabby seasonal icons'
      : 'Tabby promotional assets'
  void import('./PromotionalAssetsRoute').then(({ PromotionalAssetsRoute }) => {
    root.render(
      <PromotionalAssetsRoute page={reviewPage} asset={query.get('asset')} />,
    )
  })
} else {
  root.render(
    query.has('capture') ? (
      <div className="capture-stage">
        <ProductDemo capture />
      </div>
    ) : (
      <Landing design={design} />
    ),
  )
}
