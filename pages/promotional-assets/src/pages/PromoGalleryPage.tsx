import { useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import tabbyFace from '../../../../chrome-extension/public/tabby-face.png'
import { promoTileAssets, screenshotAssets } from '../data/promoAssets'
import type { PromoAsset } from '../data/promoAssets'

const assetUrl = (id: string) => `/?asset=${encodeURIComponent(id)}&embedded=1`

const IframePreview = ({ asset }: { asset: PromoAsset }) => {
  const frameRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(340 / asset.width)

  useLayoutEffect(() => {
    const frame = frameRef.current
    if (!frame) return

    const resizeObserver = new ResizeObserver(([entry]) => {
      if (!entry) return
      setScale(entry.contentRect.width / asset.width)
    })
    resizeObserver.observe(frame)
    return () => resizeObserver.disconnect()
  }, [asset.width])

  return (
    <div
      className="promo-gallery-preview"
      ref={frameRef}
      style={{ aspectRatio: `${asset.width} / ${asset.height}` }}
    >
      <iframe
        title={`${asset.title} preview`}
        src={assetUrl(asset.id)}
        width={asset.width}
        height={asset.height}
        loading="lazy"
        scrolling="no"
        style={{ transform: `scale(${scale})` }}
      />
    </div>
  )
}

const PromoAssetCard = ({
  asset,
  onExpand,
}: {
  asset: PromoAsset
  onExpand: (asset: PromoAsset) => void
}) => (
  <article className="promo-gallery-card">
    <button
      className="promo-gallery-expand"
      type="button"
      onClick={() => onExpand(asset)}
      aria-label={`View ${asset.title} at full resolution`}
    >
      <IframePreview asset={asset} />
      <span className="promo-gallery-expand-label">View full resolution</span>
    </button>
    <div className="promo-gallery-card-caption">
      <h3>
        {asset.screenshotNumber
          ? `Screenshot ${asset.screenshotNumber} · ${asset.title}`
          : asset.title}
      </h3>
      <span>
        {asset.width} × {asset.height}
      </span>
    </div>
  </article>
)

const FullResolutionDialog = ({
  asset,
  onClose,
}: {
  asset: PromoAsset
  onClose: () => void
}) => {
  useLayoutEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="promo-gallery-backdrop" role="presentation">
      <section
        className="promo-gallery-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={`${asset.title}, full resolution`}
      >
        <header className="promo-gallery-dialog-header">
          <div>
            <h2>{asset.title}</h2>
            <span>
              {asset.width} × {asset.height} px
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close full resolution"
          >
            Close
          </button>
        </header>
        <div className="promo-gallery-dialog-canvas">
          <iframe
            title={`${asset.title} at full resolution`}
            src={assetUrl(asset.id)}
            width={asset.width}
            height={asset.height}
            scrolling="no"
          />
        </div>
      </section>
    </div>
  )
}

export const PromoGalleryPage = () => {
  const [expandedAsset, setExpandedAsset] = useState<PromoAsset | null>(null)

  return (
    <>
      <main className="promo-gallery-page">
        <header className="promo-gallery-header">
          <div className="promo-gallery-brand">
            <img src={tabbyFace} alt="" />
            <span>Tabby</span>
          </div>
          <div>
            <p>Promotional assets</p>
            <h1>Seven component-built images</h1>
            <span>Five Web Store screenshots and two promo tiles.</span>
          </div>
        </header>

        <section
          className="promo-gallery-section"
          aria-labelledby="screenshots-title"
        >
          <div className="promo-gallery-section-heading">
            <h2 id="screenshots-title">Web Store screenshots</h2>
            <span>5 images · 1280 × 800</span>
          </div>
          <div className="promo-gallery-grid promo-gallery-grid--screenshots">
            {screenshotAssets.map((asset) => (
              <PromoAssetCard
                key={asset.id}
                asset={asset}
                onExpand={setExpandedAsset}
              />
            ))}
          </div>
        </section>

        <section
          className="promo-gallery-section"
          aria-labelledby="tiles-title"
        >
          <div className="promo-gallery-section-heading">
            <h2 id="tiles-title">Promotional tiles</h2>
            <span>Small and marquee sizes</span>
          </div>
          <div className="promo-gallery-grid promo-gallery-grid--tiles">
            {promoTileAssets.map((asset) => (
              <PromoAssetCard
                key={asset.id}
                asset={asset}
                onExpand={setExpandedAsset}
              />
            ))}
          </div>
        </section>
      </main>
      {expandedAsset &&
        createPortal(
          <FullResolutionDialog
            asset={expandedAsset}
            onClose={() => setExpandedAsset(null)}
          />,
          document.body,
        )}
    </>
  )
}
