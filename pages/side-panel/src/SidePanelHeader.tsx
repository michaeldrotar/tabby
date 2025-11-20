import { useBrowserWindows } from '@extension/chrome'
import { t } from '@extension/i18n'
import { useThemeStorage } from '@extension/shared'
import { exampleThemeStorage } from '@extension/storage'
import { cn } from '@extension/ui'

export const SidePanelHeader = () => {
  const { theme } = useThemeStorage()
  const browserWindows = useBrowserWindows()

  return (
    <div
      className={cn(
        'flex flex-shrink-0 items-center justify-between p-3 shadow-md',
        'bg-gray-50 text-gray-800',
        'dark:bg-gray-800 dark:text-gray-100',
      )}
    >
      <h2 className="text-xl font-semibold">
        Tabby ({browserWindows.length} Windows)
      </h2>
      <div className="flex items-center gap-2">
        <button
          type="button"
          title="Scroll to active tab"
          aria-label="Scroll to active tab"
          onClick={() => {
            console.log('TODO: implement a new scroller')
          }}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-md border p-1 transition hover:scale-105',
            'border-gray-200 bg-white text-gray-700',
            'dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100',
          )}
        >
          <svg
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
            <g
              id="SVGRepo_tracerCarrier"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></g>
            <g id="SVGRepo_iconCarrier">
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M8 4C5.79086 4 4 5.79086 4 8C4 10.2091 5.79086 12 8 12C10.2091 12 12 10.2091 12 8C12 5.79086 10.2091 4 8 4ZM6 8C6 6.89543 6.89543 6 8 6C9.10457 6 10 6.89543 10 8C10 9.10457 9.10457 10 8 10C6.89543 10 6 9.10457 6 8Z"
                fill="#000000"
              ></path>
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0ZM2 8C2 4.68629 4.68629 2 8 2C11.3137 2 14 4.68629 14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8Z"
                fill="#000000"
              ></path>
            </g>
          </svg>
        </button>
        <button
          type="button"
          title={t('toggleTheme')}
          aria-label={t('toggleTheme')}
          onClick={() => exampleThemeStorage.toggle()}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-md border p-1 transition-all duration-150 hover:scale-105',
            'border border-gray-200 bg-white text-gray-800 hover:ring-blue-200',
            'dark:border dark:border-gray-700 dark:bg-gray-800 dark:text-yellow-200 dark:hover:ring-yellow-400',
          )}
        >
          {theme === 'light' ? (
            // Sun icon
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="currentColor"
              aria-hidden
            >
              <path d="M6.76 4.84l-1.8-1.79L3.17 4.84l1.79 1.8 1.8-1.8zM1 13h3v-2H1v2zm10 9h2v-3h-2v3zm7.24-2.16l1.79 1.79 1.79-1.79-1.79-1.8-1.79 1.8zM20 11v2h3v-2h-3zM11 1h2v3h-2V1zm4.24 3.76l1.79-1.8-1.79-1.79-1.8 1.79 1.8 1.8zM12 6a6 6 0 100 12 6 6 0 000-12z" />
            </svg>
          ) : (
            // Moon icon
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="currentColor"
              aria-hidden
            >
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
