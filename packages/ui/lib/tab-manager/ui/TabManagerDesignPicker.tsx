import * as Menu from '@radix-ui/react-menu'
import { Check, Palette } from 'lucide-react'
import { useRef, useState } from 'react'
import { useSurface } from '../../Surface'
import { cn } from '../../utils/cn'
import { windowControlClass } from './WindowNavigation'
import type { ReactNode } from 'react'

const designs = [
  {
    id: 'layered',
    name: 'Layered',
    detail: 'Raised header, quiet group wells',
  },
  {
    id: 'accent-frame',
    name: 'Accent frame',
    detail: 'Color-led header, outlined groups',
  },
  {
    id: 'ledger',
    name: 'Ledger',
    detail: 'Compact rows, clear dividing lines',
  },
  {
    id: 'soft-canvas',
    name: 'Soft canvas',
    detail: 'Lighter canvas, recessed group wells',
  },
  {
    id: 'islands',
    name: 'Islands',
    detail: 'Floating bars, separated tab blocks',
  },
  {
    id: 'refined',
    name: 'Refined',
    detail: 'Current layout with matching raised window bars',
  },
] as const
export type TabManagerDesign = (typeof designs)[number]['id'] | 'current'
export type TabManagerContrast = 'soft' | 'balanced' | 'crisp'
const menuClass =
  'bg-popover text-popover-foreground border-border z-[90] max-h-[var(--radix-menu-content-available-height)] max-w-[calc(100vw-1rem)] overflow-y-auto rounded-xl border p-1.5 shadow-xl outline-none'
const itemClass =
  'relative flex min-h-8 cursor-default select-none items-center gap-2 rounded-md py-1.5 pl-6 pr-1 text-sm outline-none data-[highlighted]:bg-highlighted/50 data-[disabled]:opacity-50'
const keepOpen = (event: Event) => event.preventDefault()

export const TabManagerDesignPicker = ({
  design,
  onDesignChange,
  contrast,
  onContrastChange,
  settings,
}: {
  design: TabManagerDesign
  onDesignChange: (design: TabManagerDesign) => void
  contrast: TabManagerContrast
  onContrastChange: (contrast: TabManagerContrast) => void
  settings?: ReactNode
}) => {
  const surface = useSurface()
  const [open, setOpen] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const choices = useRef<HTMLDivElement>(null)
  const settingsColumn = useRef<HTMLDivElement>(null)
  const name = designs.find((option) => option.id === design)?.name ?? 'Current'
  return (
    <Menu.Root open={open} onOpenChange={setOpen} modal={false}>
      <Menu.Anchor asChild>
        <button
          ref={trigger}
          type="button"
          aria-label={`Try Tab Manager designs: ${name}`}
          title="Try Tab Manager designs"
          className={windowControlClass}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <Palette size={18} aria-hidden="true" />
          <span className="text-xs">Design</span>
        </button>
      </Menu.Anchor>
      <Menu.Portal container={surface?.portalHost ?? undefined}>
        <Menu.Content
          ref={content}
          data-manager-action-menu
          role={settings ? 'dialog' : 'menu'}
          aria-label="Tab Manager designs"
          side="top"
          align="end"
          sideOffset={8}
          collisionBoundary={surface?.root}
          collisionPadding={8}
          className={cn(menuClass, settings && 'w-[28rem]')}
          onKeyDown={(event) => {
            if (!settings || event.key !== 'Tab') return
            event.preventDefault()
            const controls = [
              choices.current?.querySelector<HTMLElement>(
                '[role="menuitemradio"][aria-checked="true"]',
              ),
              ...Array.from(
                settingsColumn.current?.querySelectorAll<HTMLElement>(
                  'button,select,input:not([type="radio"]),input[type="radio"]:checked',
                ) ?? [],
              ),
            ].filter((element): element is HTMLElement => !!element)
            const index = Math.max(
              0,
              controls.indexOf(event.target as HTMLElement),
            )
            controls[
              (index + (event.shiftKey ? -1 : 1) + controls.length) %
                controls.length
            ]?.focus()
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            const document = trigger.current?.ownerDocument
            const active = document?.activeElement
            if (
              active === document?.body ||
              content.current?.contains(active ?? null)
            )
              trigger.current?.focus()
          }}
          onInteractOutside={(event) => {
            if (trigger.current?.contains(event.target as Node))
              event.preventDefault()
          }}
        >
          <div
            className={cn(
              settings &&
                'grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-3',
            )}
          >
            <div
              ref={choices}
              role={settings ? 'menu' : undefined}
              aria-label={settings ? 'Tab Manager designs' : undefined}
            >
              <Menu.Label className="text-muted px-2 pb-2 pt-1 text-xs">
                Design preview
              </Menu.Label>
              <Menu.RadioGroup
                value={design}
                onValueChange={(value) =>
                  onDesignChange(value as TabManagerDesign)
                }
              >
                {designs.map((option) => (
                  <Menu.RadioItem
                    key={option.id}
                    value={option.id}
                    title={option.detail}
                    className={itemClass}
                    onSelect={keepOpen}
                  >
                    <Menu.ItemIndicator className="text-accent absolute left-1">
                      <Check size={16} aria-hidden="true" />
                    </Menu.ItemIndicator>
                    <span className="font-medium">{option.name}</span>
                  </Menu.RadioItem>
                ))}
                <Menu.Separator className="bg-border my-1.5 h-px" />
                <Menu.RadioItem
                  value="current"
                  className={itemClass}
                  onSelect={keepOpen}
                >
                  <Menu.ItemIndicator className="text-accent absolute left-1">
                    <Check size={16} aria-hidden="true" />
                  </Menu.ItemIndicator>
                  Current design
                </Menu.RadioItem>
              </Menu.RadioGroup>
              <Menu.Separator className="bg-border my-1.5 h-px" />
              <Menu.Label className="text-muted px-2 pb-1 text-xs">
                Surface contrast
              </Menu.Label>
              <Menu.RadioGroup
                value={contrast}
                onValueChange={(value) =>
                  onContrastChange(value as TabManagerContrast)
                }
                className={cn('flex', settings && 'flex-col')}
              >
                {(['soft', 'balanced', 'crisp'] as const).map((value) => (
                  <Menu.RadioItem
                    key={value}
                    value={value}
                    disabled={design === 'current'}
                    className={itemClass}
                    onSelect={keepOpen}
                  >
                    <Menu.ItemIndicator className="text-accent absolute left-1">
                      <Check size={16} aria-hidden="true" />
                    </Menu.ItemIndicator>
                    {value.charAt(0).toUpperCase() + value.slice(1)}
                  </Menu.RadioItem>
                ))}
              </Menu.RadioGroup>
              <p className="text-muted px-2 pb-1 pt-2 text-xs">
                Design previews reset on reload.
              </p>
            </div>
            {settings && (
              <div
                ref={settingsColumn}
                role="group"
                aria-label="Theme colors"
                className="min-w-0 px-1 pt-1"
              >
                {settings}
              </div>
            )}
          </div>
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  )
}
