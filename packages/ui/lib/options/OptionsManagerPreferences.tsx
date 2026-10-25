import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../Select'
import { cn } from '../utils/cn'
import type { OptionsControlBindings, OptionsProps } from './Options'

export const OptionsManagerPreferences = ({
  preferences,
  onPreferenceChange,
  controlProps,
}: Pick<OptionsProps, 'preferences' | 'onPreferenceChange'> & {
  controlProps: OptionsControlBindings
}) => {
  const { tabManagerCompactIconMode } = preferences
  return (
    <section className="mb-6">
      <h2 className="text-foreground mb-4 text-2xl font-semibold">
        Tab manager
      </h2>
      <div
        className={cn(
          'flex flex-col gap-4 rounded-lg border p-4',
          'border-border bg-card',
        )}
      >
        <div
          className={`
            flex flex-col gap-3
            group-data-[wide=true]/options:flex-row
            group-data-[wide=true]/options:items-center
            group-data-[wide=true]/options:justify-between
          `}
        >
          <div>
            <h3 className="text-foreground text-xl font-medium">
              Window identification
            </h3>
            <p className="text-muted text-base">
              Use a tab’s title and icon for unnamed windows.
            </p>
          </div>
          <div
            className={`
              flex gap-2
              group-data-[wide=true]/options:justify-end
            `}
          >
            <Select
              {...controlProps('window-icon')}
              value={tabManagerCompactIconMode}
              onValueChange={(value) =>
                onPreferenceChange({
                  tabManagerCompactIconMode: value as 'active' | 'first',
                })
              }
            >
              <SelectTrigger
                aria-label="Window identification"
                className={`
                  w-full text-base
                  group-data-[wide=true]/options:w-[160px]
                `}
              >
                <SelectValue placeholder="Select tab" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem className="text-base" value="active">
                  Active tab
                </SelectItem>
                <SelectItem className="text-base" value="first">
                  First tab
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </section>
  )
}
