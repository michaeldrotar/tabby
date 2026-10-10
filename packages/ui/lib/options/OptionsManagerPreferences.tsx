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
  const { tabManagerCompactIconMode, tabManagerCompactLayout } = preferences
  return (
    <section className="mb-6">
      <h2 className="text-foreground mb-4 text-lg font-semibold">
        Tab Manager
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
            <h3 className="text-foreground font-medium">
              Window Identification
            </h3>
            <p className="text-muted text-sm">
              Choose which tab supplies a window's name and icon in the sidebar
              and move menus
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
                className={`
                  w-full
                  group-data-[wide=true]/options:w-[160px]
                `}
              >
                <SelectValue placeholder="Select tab" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active Tab</SelectItem>
                <SelectItem value="first">First Tab</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div
          className={`
            border-border flex flex-col gap-3 border-t pt-4
            group-data-[wide=true]/options:flex-row
            group-data-[wide=true]/options:items-center
            group-data-[wide=true]/options:justify-between
          `}
        >
          <div>
            <h3 className="text-foreground font-medium">Sidebar Layout</h3>
            <p className="text-muted text-sm">
              Toggle between collapsed (icon only) and expanded (list) views
            </p>
          </div>
          <div className="flex items-center">
            <label
              className={`relative inline-flex cursor-pointer items-center`}
            >
              <input
                type="checkbox"
                className="peer sr-only"
                checked={tabManagerCompactLayout === 'list'}
                onChange={(e) =>
                  onPreferenceChange({
                    tabManagerCompactLayout: e.target.checked ? 'list' : 'icon',
                  })
                }
              />
              <div
                className={`
                  border-border bg-input peer h-6 w-11 rounded-full border
                  after:border-border after:bg-background after:absolute
                  after:left-[2px] after:top-[2px] after:h-5 after:w-5
                  after:rounded-full after:border after:transition-all
                  after:content-['']
                  peer-checked:bg-accent/[calc(var(--accent-strength)*1%)]
                  peer-checked:after:border-accent/[calc(var(--accent-strength)*1%)]
                  peer-checked:after:translate-x-full
                  peer-checked:hover:bg-accent/[calc((var(--accent-strength)+5)*1%)]
                  peer-checked:hover:after:border-accent/[calc((var(--accent-strength)+5)*1%)]
                  peer-focus-visible:ring-accent/[calc(var(--accent-strength)*1%)]
                  peer-focus-visible:outline-none peer-focus-visible:ring-4
                `}
              ></div>
              <span className="text-foreground ml-3 text-sm font-medium">
                {tabManagerCompactLayout === 'list' ? 'Expanded' : 'Collapsed'}
              </span>
            </label>
          </div>
        </div>
      </div>
    </section>
  )
}
