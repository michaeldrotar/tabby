import { assets } from './content'
import type { ReactNode } from 'react'

export const CatFace = ({
  size,
  children,
}: {
  size: number
  children?: ReactNode
}) => (
  <svg viewBox="0 0 128 128" width={size} height={size} aria-hidden="true">
    <image href={assets.face} width="128" height="128" />
    <path
      d="M27 55h27v10a18 16 0 0 0-27 0Zm49 0h27v10a18 16 0 0 0-27 0Z"
      fill="#fd9630"
    />
    {children}
  </svg>
)
