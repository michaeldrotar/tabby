import './styles.css'
import { createRoot } from 'react-dom/client'
import { BulkActionsPage } from './pages/BulkActionsPage'
import { FindAnythingPage } from './pages/FindAnythingPage'
import { OverviewPage } from './pages/OverviewPage'
import { PromoGalleryPage } from './pages/PromoGalleryPage'
import { SeasonalIconsPage } from './pages/SeasonalIconsPage'
import { MarqueePromoPage, SmallPromoPage } from './pages/PromoTilesPage'
import { ScalePage } from './pages/ScalePage'
import { ThemesPage } from './pages/ThemesPage'

const root = document.getElementById('root')

if (!root) throw new Error('Missing promotional asset root element.')

const pages = {
  overview: OverviewPage,
  'find-anything': FindAnythingPage,
  themes: ThemesPage,
  scale: ScalePage,
  'bulk-actions': BulkActionsPage,
  'small-promo': SmallPromoPage,
  'marquee-promo': MarqueePromoPage,
  'seasonal-icons': SeasonalIconsPage,
}
const asset = new URLSearchParams(window.location.search).get('asset')
const Page = asset ? pages[asset as keyof typeof pages] : undefined
document.body.dataset.promoView =
  asset === 'seasonal-icons' ? 'seasonal' : Page ? 'asset' : 'gallery'
document.title =
  asset === 'seasonal-icons'
    ? 'Tabby seasonal icon concepts'
    : 'Tabby promotional assets'

createRoot(root).render(Page ? <Page /> : <PromoGalleryPage />)
