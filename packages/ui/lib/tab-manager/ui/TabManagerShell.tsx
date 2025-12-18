import { ScrollArea } from '../../ScrollArea'
import { cn } from '../../utils/cn'

export type TabManagerShellProps = {
  sidebar: React.ReactNode
  children: React.ReactNode
  className?: string
}

export const TabManagerShell = ({
  sidebar,
  children,
  className,
}: TabManagerShellProps) => {
  return (
    <div
      className={cn(
        'bg-background flex h-screen w-full overflow-hidden',
        className,
      )}
    >
      <aside className="border-border flex-shrink-0 border-r">{sidebar}</aside>
      <ScrollArea className="flex-1" orientation="vertical">
        <main className="h-full">{children}</main>
      </ScrollArea>
    </div>
  )
}
