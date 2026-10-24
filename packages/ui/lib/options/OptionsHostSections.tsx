import { ExternalLinkIcon } from '../icons'
import { SummerMotionControl } from '../SummerTheme'
import { cn } from '../utils/cn'
import type { OptionsProps } from './Options'

export const OptionsHeader = ({ logoUrl }: Pick<OptionsProps, 'logoUrl'>) => (
  <header className="mb-8 flex items-center gap-3">
    {logoUrl && (
      <img
        src={logoUrl}
        width={36}
        height={36}
        className="h-9 w-9"
        alt="Tabby"
      />
    )}
    <h1 className="text-foreground text-2xl font-semibold tracking-tight">
      Settings
    </h1>
    <span className="ml-auto">
      <SummerMotionControl nightOnly />
    </span>
  </header>
)
export const OptionsSidePanelSettings = ({
  openSidePanelSettings,
}: Pick<OptionsProps, 'openSidePanelSettings'>) => (
  <section className="mb-6">
    <h2 className="text-foreground mb-4 text-lg font-semibold">
      Side panel position
    </h2>
    <div className={cn('rounded-lg border p-4', 'border-border bg-card')}>
      <div
        className={`
          flex flex-col gap-3
          group-data-[wide=true]/options:flex-row
          group-data-[wide=true]/options:items-start
          group-data-[wide=true]/options:justify-between
        `}
      >
        <p className="text-muted text-sm">
          Move the Tab manager between the left and right sides of your browser.
        </p>
        <button
          onClick={openSidePanelSettings}
          className={cn(
            `
              bg-accent-selected text-foreground flex shrink-0 items-center
              gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium
              transition-colors
              hover:bg-accent-selected-hover
              focus-visible:ring-accent focus-visible:ring-offset-background
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-offset-2
            `,
          )}
        >
          <ExternalLinkIcon className="h-4 w-4" />
          Open appearance settings
        </button>
      </div>
      <div className={cn('mt-4 rounded-md p-4', 'bg-input/40')}>
        <h3 className="text-foreground mb-2 text-sm font-medium">
          How to change the side panel position:
        </h3>
        <ol className={`text-muted list-inside list-decimal space-y-2 text-sm`}>
          <li>Scroll down to the "Side panel" section</li>
          <li>
            Choose{' '}
            <strong className="text-foreground">"Show on left side"</strong> or{' '}
            <strong className="text-foreground">"Show on right side"</strong>
          </li>
          <li>The Tab manager will move to your chosen side</li>
        </ol>
      </div>
    </div>
  </section>
)
export const OptionsReset = ({
  resetPreferences,
}: Pick<OptionsProps, 'resetPreferences'>) => (
  <section>
    <h2 className="text-foreground mb-4 text-lg font-semibold">Reset</h2>
    <div
      className={cn(
        `border-accent-border bg-accent-selected rounded-lg border p-4`,
      )}
    >
      <div
        className={`
          flex flex-col gap-3
          group-data-[wide=true]/options:flex-row
          group-data-[wide=true]/options:items-start
          group-data-[wide=true]/options:justify-between
        `}
      >
        <div>
          <h3 className="text-foreground font-medium">Preferences</h3>
          <p className="text-foreground/70 text-sm">
            Restores default settings for Tabby.
          </p>
        </div>
        <button
          type="button"
          onClick={resetPreferences}
          className={cn(
            `
              bg-accent-selected text-foreground shrink-0 whitespace-nowrap
              rounded-lg px-4 py-2 text-sm font-medium transition-colors
              hover:bg-accent-selected-hover
              focus-visible:ring-accent focus-visible:ring-offset-background
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-offset-2
            `,
          )}
        >
          Reset preferences
        </button>
      </div>
    </div>
  </section>
)
