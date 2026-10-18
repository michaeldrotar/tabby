import { Check } from 'lucide-react'
import { useId } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './Select'
import { Slider } from './Slider'
import {
  THEME_ACCENT_PALETTES,
  THEME_MODE_OPTIONS,
  THEME_NEUTRAL_PALETTES,
} from './theme-colors'
import { cn } from './utils/cn'
import type { SelectProps } from './Select'
import type { PreferenceState } from '@extension/core'
import type { KeyboardEvent } from 'react'

type ColorControl = 'background' | 'foreground' | 'accent'
type ControlBindings = (
  control: ColorControl,
) => Pick<SelectProps, 'open' | 'onOpenChange'>
const swatches: Record<string, string> = {
  slate: 'bg-slate-500',
  gray: 'bg-gray-500',
  zinc: 'bg-zinc-500',
  neutral: 'bg-neutral-500',
  stone: 'bg-stone-500',
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  amber: 'bg-amber-500',
  yellow: 'bg-yellow-500',
  lime: 'bg-lime-500',
  green: 'bg-green-500',
  emerald: 'bg-emerald-500',
  teal: 'bg-teal-500',
  cyan: 'bg-cyan-500',
  sky: 'bg-sky-500',
  blue: 'bg-blue-500',
  indigo: 'bg-indigo-500',
  violet: 'bg-violet-500',
  purple: 'bg-purple-500',
  fuchsia: 'bg-fuchsia-500',
  pink: 'bg-pink-500',
  rose: 'bg-rose-500',
}
const titleCase = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1)
const preserveNativeKeys = (event: KeyboardEvent) => {
  if (event.key !== 'Escape' && event.key !== 'Tab') event.stopPropagation()
}

export const ThemeColorSettings = ({
  preferences,
  activeThemeMode,
  onPreferenceChange,
  controlProps,
  compact = false,
  className,
}: {
  preferences: PreferenceState
  activeThemeMode: 'light' | 'dark'
  onPreferenceChange: (patch: Partial<PreferenceState>) => void | Promise<void>
  controlProps?: ControlBindings
  compact?: boolean
  className?: string
}) => {
  const id = useId()
  const prefix = activeThemeMode === 'light' ? 'themeLight' : 'themeDark'
  const strength = preferences[`${prefix}AccentStrength`]
  const setStrength = (value: number) =>
    onPreferenceChange({ [`${prefix}AccentStrength`]: value })
  return (
    <div className={cn('grid min-w-0 gap-4', className)}>
      {compact && (
        <fieldset className="min-w-0">
          <legend className="text-foreground mb-2 text-sm font-medium">
            Theme mode
          </legend>
          <div
            className={`
              border-border bg-input grid grid-cols-2 rounded-md border p-0.5
            `}
          >
            {THEME_MODE_OPTIONS.filter(
              (option) => option.value !== 'system',
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={activeThemeMode === option.value}
                onClick={() => onPreferenceChange({ theme: option.value })}
                onKeyDown={preserveNativeKeys}
                className={cn(
                  `
                    text-muted h-8 min-w-0 rounded-sm text-sm outline-none
                    focus-visible:ring-accent focus-visible:ring-2
                  `,
                  activeThemeMode === option.value &&
                    'bg-popover text-foreground shadow-sm',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>
      )}
      {(['background', 'foreground', 'accent'] as const).map((control) => {
        const suffix =
          control === 'background'
            ? 'Background'
            : control === 'foreground'
              ? 'Foreground'
              : 'Accent'
        const label = titleCase(control)
        const value = preferences[`${prefix}${suffix}`]
        const palettes =
          control === 'accent' ? THEME_ACCENT_PALETTES : THEME_NEUTRAL_PALETTES
        const change = (value: string) =>
          onPreferenceChange({ [`${prefix}${suffix}`]: value })
        return (
          <fieldset key={control} className="min-w-0">
            <legend className="text-foreground mb-2 text-sm font-medium">
              {label}
            </legend>
            {compact ? (
              <div
                role="radiogroup"
                aria-label={label}
                className={cn(
                  'grid gap-1',
                  control === 'accent'
                    ? 'grid-cols-[repeat(auto-fit,minmax(1.5rem,1fr))]'
                    : 'grid-cols-5',
                )}
              >
                {palettes.map((palette) => (
                  <label
                    key={palette}
                    title={titleCase(palette)}
                    className={`
                      relative flex h-7 min-w-0 cursor-pointer items-center
                      justify-center
                    `}
                  >
                    <input
                      type="radio"
                      name={`${id}-${control}`}
                      aria-label={titleCase(palette)}
                      value={palette}
                      checked={value === palette}
                      onChange={() => change(palette)}
                      onKeyDown={preserveNativeKeys}
                      className={`
                        peer absolute inset-0 z-10 h-full w-full cursor-pointer
                        opacity-0
                      `}
                    />
                    <span
                      aria-hidden="true"
                      className={cn(
                        `
                          peer-checked:ring-foreground peer-checked:ring-2
                          peer-checked:ring-inset
                          peer-focus-visible:outline-accent
                          peer-focus-visible:outline-2
                          peer-focus-visible:outline-offset-2
                          absolute inset-0 flex items-center justify-center
                          rounded-md border border-black/10
                        `,
                        swatches[palette],
                      )}
                    >
                      {value === palette && (
                        <Check
                          size={14}
                          className="text-white drop-shadow-sm"
                        />
                      )}
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <Select
                {...controlProps?.(control)}
                value={value}
                onValueChange={change}
              >
                <SelectTrigger aria-label={label} className="w-full">
                  <SelectValue placeholder={`Select ${control}`} />
                </SelectTrigger>
                <SelectContent>
                  {palettes.map((palette) => (
                    <SelectItem key={palette} value={palette}>
                      <div className="flex items-center gap-2">
                        <span
                          aria-hidden="true"
                          className={cn(
                            'h-3.5 w-3.5 rounded-sm',
                            swatches[palette],
                          )}
                        />
                        <span className="capitalize">{palette}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </fieldset>
        )
      })}
      <fieldset
        className={cn(
          'min-w-0',
          !compact && 'group-data-[wide=true]/options:col-span-3',
        )}
      >
        <legend className="text-foreground mb-2 text-sm font-medium">
          Accent strength
        </legend>
        <div
          className={cn(
            'flex gap-4',
            compact ? 'flex-col gap-1' : 'items-center',
          )}
        >
          {compact ? (
            <input
              type="range"
              aria-label="Accent strength"
              min={10}
              max={50}
              step={5}
              value={strength}
              onChange={(event) => setStrength(Number(event.target.value))}
              onKeyDown={preserveNativeKeys}
              className={`
                accent-accent h-9 w-full min-w-0
                focus-visible:outline-accent focus-visible:outline
                focus-visible:outline-2
              `}
            />
          ) : (
            <Slider
              aria-label="Accent strength"
              value={[strength]}
              min={10}
              max={50}
              step={5}
              onValueChange={(value) => setStrength(value[0] ?? strength)}
              className="flex-1"
            />
          )}
          <span
            className={cn(
              'text-muted shrink-0 text-right text-sm tabular-nums',
              !compact && 'w-12',
            )}
          >
            {strength}%
          </span>
        </div>
      </fieldset>
    </div>
  )
}
