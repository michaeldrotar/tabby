import './Options.css'
import { t } from '@extension/i18n'
import {
  PROJECT_URL_OBJECT,
  useThemeStorage,
  withErrorBoundary,
  withSuspense,
} from '@extension/shared'
import { exampleThemeStorage } from '@extension/storage'
import { cn, ErrorDisplay, LoadingSpinner, ToggleButton } from '@extension/ui'
import type { ThemeStateType } from '@extension/storage/lib/base'

const Options = () => {
  const { theme } = useThemeStorage()
  const logo = (
    {
      light: 'options/logo_horizontal.svg',
      dark: 'options/logo_horizontal_dark.svg',
    } as Record<Exclude<ThemeStateType['theme'], undefined>, string>
  )[theme || 'light']

  const goGithubSite = () => chrome.tabs.create(PROJECT_URL_OBJECT)

  return (
    <div
      className={cn(
        'App',
        'bg-slate-50 text-gray-900',
        'dark:bg-gray-800 dark:text-gray-100',
      )}
    >
      <button onClick={goGithubSite}>
        <img
          src={chrome.runtime.getURL(logo)}
          className="App-logo"
          alt="logo"
        />
      </button>
      <p>
        Edit <code>pages/options/src/Options.tsx</code>
      </p>
      <ToggleButton onClick={exampleThemeStorage.toggle}>
        {t('toggleTheme')}
      </ToggleButton>
    </div>
  )
}

export default withErrorBoundary(
  withSuspense(Options, <LoadingSpinner />),
  ErrorDisplay,
)
