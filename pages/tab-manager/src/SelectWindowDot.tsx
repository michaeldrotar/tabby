import { useBrowserTabsByWindowId } from '@extension/chrome'
import { usePreferenceStorage } from '@extension/shared'
import {
  cn,
  Favicon,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@extension/ui'
import { memo } from 'react'
import type { BrowserWindow } from '@extension/chrome'

export type SelectWindowDotProps = {
  window: BrowserWindow
  isCurrent: boolean
  isSelected: boolean
  onSelect?: (browserWindow: BrowserWindow) => void
}

export const SelectWindowDot = memo(
  ({ window, isCurrent, isSelected, onSelect }: SelectWindowDotProps) => {
    console.count('SelectWindowDot.render')
    const { tabManagerCompactIconMode, tabManagerCompactLayout } =
      usePreferenceStorage()
    const tabs = useBrowserTabsByWindowId(window.id)
    const activeTab = tabs.find((tab) => tab.active)
    const firstTab = tabs[0]
    const displayTab =
      tabManagerCompactIconMode === 'active' ? activeTab : firstTab
    const title =
      (displayTab?.title || `Window ${window.id}`) +
      ` — ${tabs.length} tab${tabs.length === 1 ? '' : 's'}`
    const isList = tabManagerCompactLayout === 'list'

    const ButtonContent = (
      <button
        type="button"
        onClick={() => onSelect?.(window)}
        aria-pressed={isSelected}
        className={cn(
          'group flex items-center text-left transition-all duration-300 focus:outline-none',
          isList
            ? 'h-8 w-44 gap-3 rounded-lg px-1'
            : 'h-8 w-8 justify-center rounded-full',
          isSelected
            ? 'bg-blue-100 ring-2 ring-blue-500 dark:bg-blue-900/30 dark:ring-blue-400'
            : 'hover:bg-gray-200 dark:hover:bg-gray-800',
          isCurrent && !isSelected && 'ring-2 ring-gray-400 dark:ring-gray-500',
        )}
        data-window-button={window.id}
      >
        {/* Favicon or Dot */}
        {displayTab?.url ? (
          <div
            className={cn(
              'flex items-center justify-center overflow-hidden rounded-sm transition-all',
              isList ? 'h-5 w-5' : 'h-5 w-5',
              isSelected ? 'opacity-100' : 'opacity-70 group-hover:opacity-100',
            )}
          >
            <Favicon pageUrl={displayTab.url} size={20} />
          </div>
        ) : (
          <span
            className={cn(
              'rounded-full transition-all',
              isSelected
                ? 'h-3 w-3 bg-blue-600 dark:bg-blue-400'
                : 'h-2 w-2 bg-gray-400 group-hover:bg-gray-500 dark:bg-gray-600 dark:group-hover:bg-gray-500',
            )}
          />
        )}

        {/* List View Text */}
        {isList && (
          <div className="flex min-w-0 flex-1 flex-col items-start">
            <span className="w-full truncate text-xs font-medium text-gray-700 dark:text-gray-200">
              {displayTab?.title || `Window ${window.id}`}
            </span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400">
              {tabs.length} tab{tabs.length === 1 ? '' : 's'}
            </span>
          </div>
        )}
      </button>
    )

    if (isList) {
      return ButtonContent
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>{ButtonContent}</TooltipTrigger>
        <TooltipContent side="right">{title}</TooltipContent>
      </Tooltip>
    )
  },
)
