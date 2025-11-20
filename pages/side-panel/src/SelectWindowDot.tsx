import { useBrowserTabsByWindowId } from '@extension/chrome'
import { cn } from '@extension/ui'
import { memo } from 'react'
import type { BrowserWindow } from '@extension/chrome'

type SelectWindowDotProps = {
  window: BrowserWindow
  isCurrent: boolean
  isLight: boolean
  isSelected: boolean
  onSelect: (browserWindow: BrowserWindow) => void
}

const SelectWindowDot = ({
  window,
  isCurrent,
  isLight,
  isSelected,
  onSelect,
}: SelectWindowDotProps) => {
  console.count('SelectWindowDot.render')
  const tabs = useBrowserTabsByWindowId(window.id)
  const title = `Window ${window.id} — ${tabs.length} tab${tabs.length === 1 ? '' : 's'}`

  return (
    <button
      type="button"
      onClick={() => onSelect(window)}
      title={title}
      aria-pressed={isSelected}
      className={cn(
        'group relative flex h-8 w-8 items-center justify-center rounded-full p-1 focus:outline-none',
        'transition-transform hover:scale-105',
      )}
    >
      {/* Dot */}
      {(() => {
        let dotCls = ''
        if (isSelected) {
          dotCls = isLight ? 'h-3 w-3 bg-blue-600' : 'h-3 w-3 bg-blue-300'
        } else if (isCurrent) {
          dotCls = isLight
            ? 'h-2 w-2 border-2 border-blue-400 bg-transparent'
            : 'h-2 w-2 border-2 border-blue-500 bg-transparent'
        } else {
          dotCls = isLight ? 'h-2 w-2 bg-gray-400' : 'h-2 w-2 bg-gray-500'
        }
        return (
          <span
            className={cn('inline-block rounded-full transition-all', dotCls)}
          />
        )
      })()}

      {/* subtle badge for tab count on hover */}
      <span
        className={cn(
          'absolute -right-2 -top-2 hidden items-center justify-center rounded-full bg-gray-600 px-1 text-[10px] text-white',
          'group-hover:flex',
        )}
      >
        {tabs.length}
      </span>
    </button>
  )
}

const SelectWindowDotMemo = memo(SelectWindowDot)

export { SelectWindowDotMemo as SelectWindowDot, type SelectWindowDotProps }
