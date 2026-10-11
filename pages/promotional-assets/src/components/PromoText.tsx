import type { ReactNode } from 'react'

export const PromoEyebrow = ({ children }: { children: ReactNode }) => (
  <p className="promo-eyebrow">{children}</p>
)

export const PromoHeadline = ({ children }: { children: ReactNode }) => (
  <h1 className="promo-headline">{children}</h1>
)

export const PromoBody = ({ children }: { children: ReactNode }) => (
  <p className="promo-body">{children}</p>
)

export const PromoFootnote = ({ children }: { children: ReactNode }) => (
  <p className="promo-footnote">{children}</p>
)
