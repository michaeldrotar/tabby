import { ExternalLinkIcon } from '../icons'
import { cn } from '../utils/cn'
import type { OptionsProps } from './Options'

export const OptionsHeader = ({ logoUrl }: Pick<OptionsProps, 'logoUrl'>) => (
  <div className="mb-10 text-center">
    <div className="mb-4 flex items-center justify-center gap-3">
      {logoUrl && <img src={logoUrl} className="h-12 w-12" alt="Tabby logo" />}
      <h1 className={cn('text-3xl font-bold', 'text-foreground')}>Tabby</h1>
    </div>
    <p className="text-muted">Your friendly tab manager for Chrome</p>
  </div>
)
export const OptionsSidePanelSettings = ({
  openSidePanelSettings,
}: Pick<OptionsProps, 'openSidePanelSettings'>) => (
  <section className="mb-6">
    <h2 className="text-foreground mb-4 text-lg font-semibold">
      Side Panel Position
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
          Move the Tab Manager between the left and right sides of your browser.
        </p>
        <button
          onClick={openSidePanelSettings}
          className={cn(
            `
              bg-accent/[calc(var(--accent-strength)*1%)] text-foreground flex
              shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2
              text-sm font-medium transition-colors
              hover:bg-accent/[calc((var(--accent-strength)+5)*1%)]
              focus-visible:ring-accent/[calc(var(--accent-strength)*1%)]
              focus-visible:ring-offset-background focus-visible:outline-none
              focus-visible:ring-2 focus-visible:ring-offset-2
            `,
          )}
        >
          <ExternalLinkIcon className="h-4 w-4" />
          Open Appearance Settings
        </button>
      </div>
      <div className={cn('mt-4 rounded-md p-4', 'bg-input/40')}>
        <h4 className="text-foreground mb-2 text-sm font-medium">
          How to change the side panel position:
        </h4>
        <ol className={`text-muted list-inside list-decimal space-y-2 text-sm`}>
          <li>Scroll down to the "Side panel" section</li>
          <li>
            Choose{' '}
            <strong className="text-foreground">"Show on left side"</strong> or{' '}
            <strong className="text-foreground">"Show on right side"</strong>
          </li>
          <li>The Tab Manager will move to your chosen side</li>
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
        `
          border-accent/[calc(var(--accent-strength)*1%)]
          bg-accent/[calc(var(--accent-strength)*1%)] rounded-lg border p-4
        `,
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
              bg-accent/[calc(var(--accent-strength)*1%)] text-foreground
              shrink-0 whitespace-nowrap rounded-lg px-4 py-2 text-sm
              font-medium transition-colors
              hover:bg-accent/[calc((var(--accent-strength)+5)*1%)]
              focus-visible:ring-accent/[calc(var(--accent-strength)*1%)]
              focus-visible:ring-offset-background focus-visible:outline-none
              focus-visible:ring-2 focus-visible:ring-offset-2
            `,
          )}
        >
          Reset preferences
        </button>
      </div>
    </div>
  </section>
)
