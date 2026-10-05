import type { ReactNode } from 'react'

export type ActionBarItem = {
  id: string
  icon: ReactNode
  label: string
  shortcut?: string
  kind: 'primary' | 'secondary'
  execute: () => void
  disabled?: boolean
  disabledReason?: string
  destructive?: boolean
  panel?: (props: { onClose: () => void }) => ReactNode
}

export type SelectionContext = 'tab' | 'group' | 'window' | 'none'
