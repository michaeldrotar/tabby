import { cn } from './utils/cn'

export type SettingsNavProps = {
  active: 'options' | 'features'
  optionsHref: string
  featuresHref: string
  hasNewFeatures?: boolean
}

export const SettingsNav = ({
  active,
  optionsHref,
  featuresHref,
  hasNewFeatures,
}: SettingsNavProps) => {
  return (
    <nav aria-label="Settings navigation" className="mb-8">
      <div
        className={cn(
          'inline-flex items-center gap-1 rounded-lg border p-1',
          'border-border bg-card',
        )}
      >
        <a
          href={optionsHref}
          aria-current={active === 'options' ? 'page' : undefined}
          className={cn(
            'rounded-md px-3 py-2 text-sm font-medium transition-colors',
            active === 'options'
              ? 'bg-input text-foreground'
              : 'text-muted hover:bg-input/60 hover:text-foreground',
            'focus-visible:ring-accent/[calc(var(--accent-strength)*1%)] focus-visible:ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          )}
        >
          Options
        </a>

        <a
          href={featuresHref}
          aria-current={active === 'features' ? 'page' : undefined}
          className={cn(
            'relative rounded-md px-3 py-2 text-sm font-medium transition-colors',
            active === 'features'
              ? 'bg-input text-foreground'
              : 'text-muted hover:bg-input/60 hover:text-foreground',
            'focus-visible:ring-accent/[calc(var(--accent-strength)*1%)] focus-visible:ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          )}
        >
          <span className="inline-flex items-center gap-2">
            Features
            {hasNewFeatures && active !== 'features' ? (
              <span
                aria-label="New features"
                className={cn(
                  'h-2 w-2 rounded-full',
                  'bg-accent/[calc(var(--accent-strength)*1%)]',
                )}
              />
            ) : null}
          </span>
        </a>
      </div>
    </nav>
  )
}
