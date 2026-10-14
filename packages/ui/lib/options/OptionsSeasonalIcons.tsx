import { SEASONAL_HOLIDAYS } from '@extension/core'
import { useId } from 'react'
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
  groupName: string
  holidayId: SeasonalHolidayId
  selected: SeasonalIconChoice
  iconId: SeasonalIconChoice
  label: string
  onSelect: (holidayId: SeasonalHolidayId, iconId: SeasonalIconChoice) => void
}

const ChoiceCard = ({
  groupName,
  holidayId,
  selected,
  iconId,
  label,
  onSelect,
}: ChoiceCardProps) => (
  <label className="group cursor-pointer">
    <input
      type="radio"
      aria-label={label}
      name={`${groupName}-${holidayId}`}
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
        className={`
          h-16 w-16 object-contain transition-transform duration-300 ease-out
          group-focus-within:-translate-y-1 group-focus-within:rotate-[-4deg]
          group-focus-within:scale-110
          group-hover:-translate-y-1 group-hover:rotate-[-4deg]
          group-hover:scale-110
          motion-reduce:transform-none motion-reduce:transition-none
        `}
      />
      <span className="text-foreground text-sm font-medium">{label}</span>
    </span>
  </label>
)

type HolidayDateControlProps = Pick<
  OptionsProps,
  'preferences' | 'onPreferenceChange'
> & {
  holidayId: SeasonalHolidayId
  dateLabel?: string
}

const HolidayDateControl = ({
  holidayId,
  dateLabel,
  preferences,
  onPreferenceChange,
}: HolidayDateControlProps) => {
  const dateClassName = cn(
    `
      text-foreground flex h-10 w-full items-center justify-end px-3 py-2
      text-right text-sm
    `,
  )

  if (holidayId === 'easter') {
    return (
      <Select
        value={preferences.seasonalEasterCalendar}
        onValueChange={(value) =>
          void onPreferenceChange({
            seasonalEasterCalendar:
              value as PreferenceState['seasonalEasterCalendar'],
          })
        }
      >
        <SelectTrigger aria-label="Easter date" className="text-right">
          <SelectValue className="min-w-0 flex-1 text-right" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="local">Use browser region</SelectItem>
          <SelectItem value="western">Western Easter</SelectItem>
          <SelectItem value="orthodox">Orthodox Easter</SelectItem>
        </SelectContent>
      </Select>
    )
  }

  if (holidayId === 'thanksgiving') {
    return (
      <Select
        value={preferences.seasonalThanksgivingRegion}
        onValueChange={(value) =>
          void onPreferenceChange({
            seasonalThanksgivingRegion:
              value as PreferenceState['seasonalThanksgivingRegion'],
          })
        }
      >
        <SelectTrigger aria-label="Thanksgiving date" className="text-right">
          <SelectValue className="min-w-0 flex-1 text-right" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="local">Use browser region</SelectItem>
          <SelectItem value="us">United States</SelectItem>
          <SelectItem value="canada">Canada</SelectItem>
        </SelectContent>
      </Select>
    )
  }

  return <span className={dateClassName}>{dateLabel}</span>
}

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

export const OptionsSeasonalIconsOverview = ({
  preferences,
  onPreferenceChange,
  onOpen,
}: Pick<OptionsProps, 'preferences' | 'onPreferenceChange'> & {
  onOpen: () => void
}) => (
  <section className="mb-8">
    <h2 className="text-foreground mb-4 text-lg font-semibold">
      Seasonal icons
    </h2>
    <div className={cn('rounded-lg border p-4', 'border-border bg-card')}>
      <div
        className={`
          flex flex-col gap-4
          group-data-[wide=true]/options:flex-row
          group-data-[wide=true]/options:items-center
          group-data-[wide=true]/options:justify-between
        `}
      >
        <label className="relative inline-flex cursor-pointer items-center">
          <span className="text-foreground mr-3 text-sm font-medium">
            Show seasonal icons
          </span>
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
        <button
          type="button"
          onClick={onOpen}
          className={cn(
            `
              bg-accent/[calc(var(--accent-strength)*1%)] text-foreground flex
              shrink-0 items-center justify-center gap-2 rounded-lg px-3 py-2
              text-sm font-medium transition-colors
              hover:bg-accent/[calc((var(--accent-strength)+5)*1%)]
              focus-visible:ring-accent/[calc(var(--accent-strength)*1%)]
              focus-visible:ring-offset-background focus-visible:outline-none
              focus-visible:ring-2 focus-visible:ring-offset-2
            `,
          )}
        >
          Choose seasonal icons
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  </section>
)

export const OptionsSeasonalIcons = ({
  preferences,
  onPreferenceChange,
}: Pick<OptionsProps, 'preferences' | 'onPreferenceChange'>) => {
  const groupName = useId()
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
      <div className="space-y-4">
        {SEASONAL_HOLIDAYS.map((holiday) => {
          const dateLabel =
            'dateLabel' in holiday ? holiday.dateLabel : undefined
          const headingId = `${groupName}-${holiday.id}-heading`
          return (
            <div
              key={holiday.id}
              role="group"
              aria-labelledby={headingId}
              className={cn('rounded-lg border p-4', 'border-border bg-card')}
            >
              <div
                className={`
                  flex flex-col gap-2
                  group-data-[wide=true]/options:flex-row
                  group-data-[wide=true]/options:items-center
                  group-data-[wide=true]/options:justify-between
                `}
              >
                <h3 id={headingId} className="text-foreground font-medium">
                  {holiday.name}
                </h3>
                <div
                  className={`
                    w-full
                    group-data-[wide=true]/options:w-52
                  `}
                >
                  <HolidayDateControl
                    holidayId={holiday.id}
                    dateLabel={dateLabel}
                    preferences={preferences}
                    onPreferenceChange={onPreferenceChange}
                  />
                </div>
              </div>
              <div
                className={`
                  mt-3 grid grid-cols-2 gap-2
                  group-data-[wide=true]/options:grid-cols-4
                `}
              >
                {holiday.iconOptions.map((option) => (
                  <ChoiceCard
                    key={option.id}
                    groupName={groupName}
                    holidayId={holiday.id}
                    selected={preferences.seasonalIconSelections[holiday.id]}
                    iconId={option.id}
                    label={option.name}
                    onSelect={selectIcon}
                  />
                ))}
                <ChoiceCard
                  groupName={groupName}
                  holidayId={holiday.id}
                  selected={preferences.seasonalIconSelections[holiday.id]}
                  iconId="off"
                  label="Off"
                  onSelect={selectIcon}
                />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
