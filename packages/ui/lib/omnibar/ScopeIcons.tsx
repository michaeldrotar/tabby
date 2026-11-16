import type { SVGProps } from 'react'

const IconFrame = ({ children, ...props }: SVGProps<SVGSVGElement>) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {children}
  </svg>
)

export const WindowsIcon = (props: SVGProps<SVGSVGElement>) => (
  <IconFrame {...props}>
    <path d="M6 18H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2" />
    <path d="M2 7h3" />
    <rect x="8" y="8" width="14" height="13" rx="2" />
    <path d="M8 12h14" />
  </IconFrame>
)

export const TabIcon = (props: SVGProps<SVGSVGElement>) => (
  <IconFrame {...props}>
    <path d="M2 18h20" />
    <path d="m3 18 2.2-9.5A2 2 0 0 1 7.2 7h9.6a2 2 0 0 1 2 1.5L21 18" />
    <path d="m14 10 3 3m0-3-3 3" />
  </IconFrame>
)
