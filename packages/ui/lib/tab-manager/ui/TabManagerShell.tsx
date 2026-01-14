import { ScrollArea } from '../../ScrollArea'
import { cn } from '../../utils/cn'

export type TabManagerShellProps = {
  sidebar: React.ReactNode
  children: React.ReactNode
  /** Optional overlay content (e.g., animation effects) that should cover the entire shell */
  overlay?: React.ReactNode
  className?: string
  /** Selection mode for visual styling of focus vs selection */
  selectionMode?: 'default' | 'multi-select'
}

export const TabManagerShell = ({
  sidebar,
  children,
  overlay,
  className,
  selectionMode = 'default',
}: TabManagerShellProps) => {
  return (
    <div
      data-selection-mode={selectionMode}
      className={cn(
        'bg-background relative flex h-screen w-full overflow-hidden',
        className,
      )}
    >
      <aside className="border-border flex-shrink-0 border-r">{sidebar}</aside>
      <ScrollArea className="flex-1" orientation="vertical">
        <main className="h-full">{children}</main>
      </ScrollArea>
      {/* Overlay slot for effects that need to cover the entire shell */}
      {overlay}
    </div>
  )
}
