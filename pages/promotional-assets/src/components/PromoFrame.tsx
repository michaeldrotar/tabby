import tabbyFace from '../../../../chrome-extension/public/tabby-face.png'
import type { ReactNode } from 'react'

export type PromoAssetSize = 'screenshot' | 'small' | 'marquee'

export const PromoFrame = ({
  children,
  size = 'screenshot',
}: {
  children: ReactNode
  size?: PromoAssetSize
}) => (
  <main
    className={`
      promo-canvas
      promo-canvas--${size}
    `}
    aria-label="Tabby promotional asset"
  >
    <div className="promo-frame">
      <header className="promo-brand">
        <img className="promo-brand-icon" src={tabbyFace} alt="" />
        <span className="promo-brand-name">Tabby</span>
      </header>
      {children}
    </div>
  </main>
)
