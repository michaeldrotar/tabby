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
  const settings = [
    {
      control: 'window-icon' as const,
      title: 'Window identification',
      description: 'Use a tab’s title and icon for unnamed windows.',
      label: 'Window identification',
      value: preferences.tabManagerCompactIconMode,
      change: (value: string) =>
        onPreferenceChange({
          tabManagerCompactIconMode: value as 'active' | 'first',
        }),
      choices: [
        { value: 'active', label: 'Active tab' },
        { value: 'first', label: 'First tab' },
      ],
    },
    {
      control: 'window-click' as const,
      title: 'Window focus',
      description:
        'Choose whether picking a window or moving tabs and groups switches windows. Hold Shift to do the opposite.',
      label: 'Window focus',
      value: preferences.tabManagerWindowClickBehavior,
      change: (value: string) =>
        onPreferenceChange({
          tabManagerWindowClickBehavior: value as 'view' | 'switch',
        }),
      choices: [
        { value: 'view', label: 'Stay in this window' },
        { value: 'switch', label: 'Switch windows' },
      ],
    },
    {
      control: 'stack-windows' as const,
      title: 'Stack windows',
      description:
        'When Tabby switches windows, match the destination window’s size and position to your current window.',
      label: 'Stack windows',
      value: preferences.stackWindows ? 'on' : 'off',
      change: (value: string) =>
        onPreferenceChange({ stackWindows: value === 'on' }),
      choices: [
        { value: 'off', label: 'Off' },
        { value: 'on', label: 'On' },
      ],
    },
  ]
  return (
    <section className="mb-6">
      <h2 className="mb-4 text-2xl font-semibold text-foreground">
        Tab manager
      </h2>
      <div
        className={cn(
          'flex flex-col gap-4 rounded-lg border p-4',
          'border-border bg-card',
        )}
      >
        {settings.map((setting) => (
          <div
            key={setting.control}
            className={`
              grid min-w-0 gap-3
              group-data-[wide=true]/options:grid-cols-[minmax(0,1fr)_200px]
              group-data-[wide=true]/options:items-center
              group-data-[wide=true]/options:gap-6
            `}
          >
            <div>
              <h3 className="text-xl font-medium text-foreground">
                {setting.title}
              </h3>
              <p className="text-base text-muted">{setting.description}</p>
            </div>
            <Select
              {...controlProps(setting.control)}
              value={setting.value}
              onValueChange={setting.change}
            >
              <SelectTrigger
                aria-label={setting.label}
                className="w-full text-base"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {setting.choices.map((choice) => (
                  <SelectItem
                    key={choice.value}
                    className="text-base"
                    value={choice.value}
                  >
                    {choice.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </section>
  )
}
