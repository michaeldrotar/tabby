import { SearchButton } from './SearchButton'
import {
  useBrowserTabsByWindowId,
  useBrowserWindows,
  useCurrentBrowserWindow,
  useSetSelectedWindowId,
} from '@extension/chrome'
import { t } from '@extension/i18n'
import { useThemeStorage } from '@extension/shared'
import { exampleThemeStorage } from '@extension/storage'
import { cn, Tooltip } from '@extension/ui'

type TabManagerHeaderProps = {
  onOpenSearch?: () => void
}

const openShortcutsSettings = () => {
  chrome.tabs.create({ url: 'chrome://extensions/shortcuts' })
}

export const TabManagerHeader = ({ onOpenSearch }: TabManagerHeaderProps) => {
  const { theme } = useThemeStorage()
  const browserWindows = useBrowserWindows()
  const currentBrowserWindow = useCurrentBrowserWindow()
  const tabs = useBrowserTabsByWindowId(currentBrowserWindow?.id)
  const activeTab = tabs.find((t) => t.active)
  const setSelectedWindowId = useSetSelectedWindowId()

  return (
    <div
      className={cn(
        'flex flex-shrink-0 items-center justify-between border-b px-4 py-3',
        'border-gray-200 bg-white',
        'dark:border-gray-800 dark:bg-gray-900',
      )}
    >
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
          Tabby
        </h2>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
          {browserWindows.length} Windows
        </span>
      </div>
      <div className="flex items-center gap-1">
        {/* Search Button */}
        <SearchButton onClick={onOpenSearch} />

        {/* Keyboard Shortcuts Settings Button */}
        <Tooltip content="Keyboard shortcuts">
          <button
            type="button"
            aria-label="Keyboard shortcuts"
            onClick={openShortcutsSettings}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-md transition-colors',
              'text-gray-500 hover:bg-gray-100 hover:text-gray-700',
              'dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200',
            )}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </button>
        </Tooltip>

        {/* Scroll to Active Tab Button */}
        <Tooltip content="Scroll to active tab">
          <button
            type="button"
            aria-label="Scroll to active tab"
            onClick={() => {
              const targetWindowId = currentBrowserWindow?.id || -1
              const targetTabId = activeTab?.id || -1

              if (targetWindowId !== -1) {
                setSelectedWindowId(targetWindowId)
              }

              // Small timeout to allow React to render the new window's tabs if we switched windows
              requestAnimationFrame(() => {
                document
                  .querySelectorAll(
                    [
                      `[data-window-button="${targetWindowId}"]`,
                      `[data-tab-button="${targetTabId}"]`,
                    ].join(','),
                  )
                  .forEach((element) => {
                    element.scrollIntoView({
                      block: 'center',
                      behavior: 'smooth',
                    })
                  })
              })
            }}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-md transition-colors',
              'text-gray-500 hover:bg-gray-100 hover:text-gray-700',
              'dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200',
            )}
          >
            <svg
              viewBox="0 0 16 16"
              fill="currentColor"
              className="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M8 4C5.79086 4 4 5.79086 4 8C4 10.2091 5.79086 12 8 12C10.2091 12 12 10.2091 12 8C12 5.79086 10.2091 4 8 4ZM6 8C6 6.89543 6.89543 6 8 6C9.10457 6 10 6.89543 10 8C10 9.10457 9.10457 10 8 10C6.89543 10 6 9.10457 6 8Z"
              />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0ZM2 8C2 4.68629 4.68629 2 8 2C11.3137 2 14 4.68629 14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8Z"
              />
            </svg>
          </button>
        </Tooltip>

        {/* Toggle Theme Button */}
        <Tooltip content={t('toggleTheme')}>
          <button
            type="button"
            aria-label={t('toggleTheme')}
            onClick={() => exampleThemeStorage.toggle()}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-md transition-colors',
              'text-gray-500 hover:bg-gray-100 hover:text-gray-700',
              'dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200',
            )}
          >
            {theme === 'light' ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="currentColor"
                aria-hidden
              >
                <path d="M6.76 4.84l-1.8-1.79L3.17 4.84l1.79 1.8 1.8-1.8zM1 13h3v-2H1v2zm10 9h2v-3h-2v3zm7.24-2.16l1.79 1.79 1.79-1.79-1.79-1.8-1.79 1.8zM20 11v2h3v-2h-3zM11 1h2v3h-2V1zm4.24 3.76l1.79-1.8-1.79-1.79-1.8 1.79 1.8 1.8zM12 6a6 6 0 100 12 6 6 0 000-12z" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="currentColor"
                aria-hidden
              >
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            )}
          </button>
        </Tooltip>
      </div>
    </div>
  )
}
