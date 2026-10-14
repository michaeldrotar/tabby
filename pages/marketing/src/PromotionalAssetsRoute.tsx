import '../../promotional-assets/src/styles.css'
import { BulkActionsPage } from '../../promotional-assets/src/pages/BulkActionsPage'
import { FindAnythingPage } from '../../promotional-assets/src/pages/FindAnythingPage'
import { OverviewPage } from '../../promotional-assets/src/pages/OverviewPage'
import { PromoGalleryPage } from '../../promotional-assets/src/pages/PromoGalleryPage'
import {
  MarqueePromoPage,
  SmallPromoPage,
} from '../../promotional-assets/src/pages/PromoTilesPage'
import { ScalePage } from '../../promotional-assets/src/pages/ScalePage'
import { ThemesPage } from '../../promotional-assets/src/pages/ThemesPage'
import { SeasonalIconsPage } from '../../promotional-assets/src/pages/SeasonalIconsPage'

const assetPages = {
  overview: OverviewPage,
  'find-anything': FindAnythingPage,
  themes: ThemesPage,
  scale: ScalePage,
  'bulk-actions': BulkActionsPage,
  'small-promo': SmallPromoPage,
  'marquee-promo': MarqueePromoPage,
}

type MarketingReviewPage = 'promotional-assets' | 'seasonal-icons'

export const PromotionalAssetsRoute = ({
  page,
  asset,
}: {
  page: MarketingReviewPage
  asset: string | null
}) => {
  if (page === 'seasonal-icons') return <SeasonalIconsPage />

  const AssetPage = asset ? assetPages[asset as keyof typeof assetPages] : null
  return AssetPage ? <AssetPage /> : <PromoGalleryPage />
}
