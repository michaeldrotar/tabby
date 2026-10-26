import { Search, Settings } from 'lucide-react'
import { SummerMotionControl, SummerToolbarArt } from '../../SummerTheme'
import { cn } from '../../utils/cn'
import { windowControlClass } from './WindowNavigation'
import type { TabManagerIntent } from '../TabManager'
import type { ReactNode } from 'react'

export const TabManagerTools = ({
  onIntent,
  children,
}: {
  onIntent: (intent: TabManagerIntent) => void
  children?: ReactNode
}) => (
  <nav
    aria-label="Tab Manager tools"
    data-keyboard-section="tools"
    className={`
      border-border relative flex h-12 shrink-0 items-center justify-between
      gap-1 border-t bg-[var(--manager-chrome)] px-2
    `}
  >
    <SummerToolbarArt />
    <div className="flex items-center gap-1">
      <button
        aria-label="Search everything"
        title="Search everything"
        className={cn(windowControlClass, 'size-10 px-0')}
        onClick={() => onIntent({ type: 'open-search' })}
      >
        <Search size={18} />
      </button>
      <button
        aria-label="Options"
        title="Options"
        className={cn(windowControlClass, 'size-10 px-0')}
        onClick={() => onIntent({ type: 'open-settings' })}
      >
        <Settings size={18} />
      </button>
      <SummerMotionControl />
    </div>
    {children}
  </nav>
)
