export type PromoAsset = {
  id: string
  title: string
  width: number
  height: number
  screenshotNumber?: number
}

export const screenshotAssets: PromoAsset[] = [
  {
    id: 'overview',
    title: 'Overview',
    width: 1280,
    height: 800,
    screenshotNumber: 1,
  },
  {
    id: 'find-anything',
    title: 'Find anything',
    width: 1280,
    height: 800,
    screenshotNumber: 2,
  },
  {
    id: 'themes',
    title: 'Themes',
    width: 1280,
    height: 800,
    screenshotNumber: 3,
  },
  {
    id: 'scale',
    title: 'Scale to fit',
    width: 1280,
    height: 800,
    screenshotNumber: 4,
  },
  {
    id: 'bulk-actions',
    title: 'Bulk actions',
    width: 1280,
    height: 800,
    screenshotNumber: 5,
  },
]

export const promoTileAssets: PromoAsset[] = [
  {
    id: 'small-promo',
    title: 'Small promo tile',
    width: 440,
    height: 280,
  },
  {
    id: 'marquee-promo',
    title: 'Marquee promo tile',
    width: 1400,
    height: 560,
  },
]
