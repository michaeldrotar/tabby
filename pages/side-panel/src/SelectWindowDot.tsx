import { useBrowserTabsByWindowId } from '@extension/chrome'
import { cn } from '@extension/ui'
import { memo } from 'react'
import type { BrowserWindow } from '@extension/chrome'

type SelectWindowDotProps = {
  window: BrowserWindow
  isCurrent: boolean
  isSelected: boolean
  onSelect: (browserWindow: BrowserWindow) => void
}

const SelectWindowDot = ({
  window,
  isCurrent,
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
        'group relative flex h-8 w-8 items-center justify-center rounded-full transition-all focus:outline-none',
        isSelected
          ? 'bg-blue-100 dark:bg-blue-900/30'
          : 'hover:bg-gray-200 dark:hover:bg-gray-800',
      )}
    >
      {/* Dot */}
      <span
        className={cn(
          'rounded-full transition-all',
          isSelected
            ? 'h-3 w-3 bg-blue-600 dark:bg-blue-400'
            : isCurrent
              ? 'h-2.5 w-2.5 border-2 border-blue-500 bg-transparent'
              : 'h-2 w-2 bg-gray-400 group-hover:bg-gray-500 dark:bg-gray-600 dark:group-hover:bg-gray-500',
        )}
      />

      {/* Tooltip-like badge on hover (optional, maybe just rely on title) */}
    </button>
  )
}

const SelectWindowDotMemo = memo(SelectWindowDot)

export { SelectWindowDotMemo as SelectWindowDot, type SelectWindowDotProps }
