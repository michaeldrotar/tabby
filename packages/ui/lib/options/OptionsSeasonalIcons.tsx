import { SEASONAL_HOLIDAYS } from '@extension/core'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../Select'
import { cn } from '../utils/cn'
import type { OptionsProps } from './Options'
import type {
  PreferenceState,
  SeasonalHolidayId,
  SeasonalIconId,
} from '@extension/core'

type SeasonalIconChoice = SeasonalIconId | 'off'

type ChoiceCardProps = {
  holidayId: SeasonalHolidayId
  selected: SeasonalIconChoice
  iconId: SeasonalIconChoice
  label: string
  onSelect: (holidayId: SeasonalHolidayId, iconId: SeasonalIconChoice) => void
}

const ChoiceCard = ({
  holidayId,
  selected,
  iconId,
  label,
  onSelect,
}: ChoiceCardProps) => (
  <label className="cursor-pointer">
    <input
      type="radio"
      name={`seasonal-icon-${holidayId}`}
      value={iconId}
      checked={selected === iconId}
      onChange={() => onSelect(holidayId, iconId)}
      className="peer sr-only"
    />
    <span
      className={cn(
        `
          border-border bg-background flex h-full min-h-28 flex-col items-center
          justify-between gap-2 rounded-lg border p-3 text-center
          transition-colors
          hover:border-accent/[calc(var(--accent-strength)*1%)]
          peer-focus-visible:ring-accent/[calc(var(--accent-strength)*1%)]
          peer-focus-visible:ring-offset-background peer-focus-visible:ring-2
          peer-focus-visible:ring-offset-2
        `,
        selected === iconId &&
          `
            border-accent/[calc(var(--accent-strength)*1%)]
            bg-accent/[calc(var(--accent-strength)*1%)]
          `,
      )}
    >
      <img
        src={
          iconId === 'off'
            ? '/tabby-face-128.png'
            : `/seasonal-icons/${iconId}-128.png`
        }
        width={64}
        height={64}
        loading="lazy"
        alt=""
        className="h-16 w-16 object-contain"
      />
      <span className="text-foreground text-sm font-medium">{label}</span>
      {iconId === 'off' && (
        <span className="text-muted text-xs">Use Tabby’s regular icon</span>
      )}
    </span>
  </label>
)

const updateSelection = (
  preferences: PreferenceState,
  holidayId: SeasonalHolidayId,
  iconId: SeasonalIconChoice,
) => ({
  seasonalIconSelections: {
    ...preferences.seasonalIconSelections,
    [holidayId]: iconId,
  },
})

export const OptionsSeasonalIcons = ({
  preferences,
  onPreferenceChange,
}: Pick<OptionsProps, 'preferences' | 'onPreferenceChange'>) => {
  const selectIcon = (
    holidayId: SeasonalHolidayId,
    iconId: SeasonalIconChoice,
  ) => {
    void onPreferenceChange(updateSelection(preferences, holidayId, iconId))
  }

  return (
    <section className="mb-8">
      <h2 className="text-foreground mb-2 text-lg font-semibold">
        Seasonal icons
      </h2>
      <p className="text-muted mb-4 text-sm">
        Choose Tabby’s look for each holiday. The closest selected holiday takes
        over for the seven days before it and on the holiday itself.
      </p>
      <div className={cn('rounded-lg border p-4', 'border-border bg-card')}>
        <div
          className={`
            flex flex-col gap-3
            group-data-[wide=true]/options:flex-row
            group-data-[wide=true]/options:items-center
            group-data-[wide=true]/options:justify-between
          `}
        >
          <div>
            <h3 className="text-foreground font-medium">
              Seasonal toolbar looks
            </h3>
            <p className="text-muted text-sm">
              Your choices stay saved when seasonal icons are paused.
            </p>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              role="switch"
              aria-label="Show seasonal icons"
              checked={preferences.seasonalIconsEnabled}
              onChange={(event) =>
                void onPreferenceChange({
                  seasonalIconsEnabled: event.target.checked,
                })
              }
              className="peer sr-only"
            />
            <span
              aria-hidden="true"
              className={`
                border-border bg-input relative h-6 w-11 rounded-full border
                transition-colors
                after:border-border after:bg-background after:absolute
                after:left-[2px] after:top-[2px] after:h-5 after:w-5
                after:rounded-full after:border after:transition-transform
                after:content-['']
                peer-checked:bg-accent/[calc(var(--accent-strength)*1%)]
                peer-checked:after:border-accent/[calc(var(--accent-strength)*1%)]
                peer-checked:after:translate-x-full
                peer-focus-visible:ring-accent/[calc(var(--accent-strength)*1%)]
                peer-focus-visible:outline-none peer-focus-visible:ring-4
              `}
            />
            <span className="text-foreground ml-3 text-sm font-medium">
              {preferences.seasonalIconsEnabled ? 'On' : 'Off'}
            </span>
          </label>
        </div>

        <div
          className={`
            border-border mt-4 grid gap-4 border-t pt-4
            group-data-[wide=true]/options:grid-cols-2
          `}
        >
          <div className="text-foreground flex flex-col gap-2 text-sm">
            <span>Easter date</span>
            <Select
              value={preferences.seasonalEasterCalendar}
              onValueChange={(value) =>
                void onPreferenceChange({
                  seasonalEasterCalendar:
                    value as PreferenceState['seasonalEasterCalendar'],
                })
              }
            >
              <SelectTrigger aria-label="Easter date">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="local">Use browser region</SelectItem>
                <SelectItem value="western">Western Easter</SelectItem>
                <SelectItem value="orthodox">Orthodox Easter</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-foreground flex flex-col gap-2 text-sm">
            <span>Thanksgiving date</span>
            <Select
              value={preferences.seasonalThanksgivingRegion}
              onValueChange={(value) =>
                void onPreferenceChange({
                  seasonalThanksgivingRegion:
                    value as PreferenceState['seasonalThanksgivingRegion'],
                })
              }
            >
              <SelectTrigger aria-label="Thanksgiving date">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="local">Use browser region</SelectItem>
                <SelectItem value="us">United States</SelectItem>
                <SelectItem value="canada">Canada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="text-muted mt-2 text-xs">
          Browser-region defaults follow Chrome’s language. Change them if your
          holiday dates differ.
        </p>
      </div>

      <div className="mt-4 space-y-4">
        {SEASONAL_HOLIDAYS.map((holiday) => (
          <fieldset
            key={holiday.id}
            className={cn('rounded-lg border p-4', 'border-border bg-card')}
          >
            <legend className="text-foreground px-1 font-medium">
              {holiday.name}
            </legend>
            <p className="text-muted mb-3 text-xs">{holiday.dateLabel}</p>
            <div
              className={`
                grid grid-cols-2 gap-2
                group-data-[wide=true]/options:grid-cols-4
              `}
            >
              {holiday.iconOptions.map((option) => (
                <ChoiceCard
                  key={option.id}
                  holidayId={holiday.id}
                  selected={preferences.seasonalIconSelections[holiday.id]}
                  iconId={option.id}
                  label={option.name}
                  onSelect={selectIcon}
                />
              ))}
              <ChoiceCard
                holidayId={holiday.id}
                selected={preferences.seasonalIconSelections[holiday.id]}
                iconId="off"
                label="Off"
                onSelect={selectIcon}
              />
            </div>
          </fieldset>
        ))}
      </div>
    </section>
  )
}
