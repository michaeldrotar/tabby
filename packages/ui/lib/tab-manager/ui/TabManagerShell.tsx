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
        'flex h-screen w-full overflow-hidden bg-white dark:bg-zinc-950',
        className,
      )}
    >
      <aside className="flex-shrink-0 border-r border-gray-200 dark:border-gray-800">
        {sidebar}
      </aside>
      <ScrollArea className="flex-1" orientation="vertical">
        <main className="h-full">{children}</main>
      </ScrollArea>
    </div>
  )
}
