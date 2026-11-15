import { BROWSER_TAB_GROUP_COLORS } from './browser.js'
import {
  defaultWindowIcon,
  getWindowIconChoices,
  getWindowIconKind,
  getWindowIconValue,
  initializeWindowIconChoices,
  isWindowIcon,
  SUGGESTED_WINDOW_ICONS,
} from './windowIconChoice.js'
import type { BrowserTabGroupColor, BrowserWindow } from './browser.js'
import type { WindowIconChoices, WindowIconKind } from './windowIconChoice.js'

type IdentityFields = Pick<
  BrowserWindow,
  'name' | 'icon' | 'iconColor' | 'iconChoices' | 'useCustom'
>
export type StoredWindowIdentity = {
  version: 2
  name: string
  useCustom: boolean
  icon: WindowIconKind
  iconColor: BrowserTabGroupColor
  iconChoices: WindowIconChoices
}

const kinds: WindowIconKind[] = [
  'icon',
  'emoji',
  'monogram',
  'upload',
  'favicon',
]
const assertVersion = (value: { version?: unknown }) => {
  if (value.version !== undefined && value.version !== 1 && value.version !== 2)
    throw new Error('This window settings version is not supported.')
}

/** Encode settings once at the storage boundary; each choice stores only its value. */
export const serializeWindowIdentity = <T extends IdentityFields>(
  value: T,
  random: () => number = Math.random,
): Omit<T, keyof IdentityFields> & StoredWindowIdentity => {
  const name =
    typeof value.name === 'string'
      ? value.name
      : `Window ${1000 + Math.floor(random() * 9000)}`
  const icon = isWindowIcon(value.icon)
    ? value.icon
    : SUGGESTED_WINDOW_ICONS[
        Math.floor(random() * SUGGESTED_WINDOW_ICONS.length)
      ]!
  const choices = initializeWindowIconChoices(
    icon,
    name,
    value.iconChoices,
    random,
  )
  const iconChoices: WindowIconChoices = {}
  for (const kind of kinds) {
    const choice = choices[kind]
    if (choice && choice !== 'favicon:auto' && choice !== 'upload:empty')
      iconChoices[kind] = getWindowIconValue(choice)
  }
  return {
    ...value,
    version: 2,
    name,
    useCustom: value.useCustom !== false,
    icon: getWindowIconKind(icon),
    iconColor: BROWSER_TAB_GROUP_COLORS.includes(value.iconColor!)
      ? value.iconColor!
      : BROWSER_TAB_GROUP_COLORS[
          Math.floor(random() * BROWSER_TAB_GROUP_COLORS.length)
        ]!,
    iconChoices,
  }
}

/** Missing version means version 1, including icon names that match a type name. */
export const migrateWindowIdentity = <
  T extends IdentityFields & { key?: string; version?: unknown },
>(
  value: T,
  random: () => number = Math.random,
): T | (Omit<T, keyof IdentityFields> & StoredWindowIdentity) => {
  assertVersion(value)
  return value.version === 2 ? value : serializeWindowIdentity(value, random)
}

export const deserializeWindowIdentity = (
  value: IdentityFields & { version?: unknown },
): IdentityFields => {
  assertVersion(value)
  if (value.version !== 2)
    return {
      name: value.name,
      useCustom: value.useCustom,
      icon: value.icon,
      iconColor: value.iconColor,
      iconChoices: value.iconChoices,
    }
  const kind = kinds.includes(value.icon as WindowIconKind)
    ? (value.icon as WindowIconKind)
    : 'icon'
  const choices: WindowIconChoices = {}
  for (const type of kinds) {
    const raw = value.iconChoices?.[type]
    if (typeof raw !== 'string') continue
    const choice = type === 'icon' ? raw : `${type}:${raw}`
    if (isWindowIcon(choice) && getWindowIconKind(choice) === type)
      choices[type] = choice
  }
  const icon = choices[kind] ?? defaultWindowIcon(kind, value.name ?? '')
  return {
    name: value.name,
    useCustom: value.useCustom,
    icon,
    iconColor: value.iconColor,
    iconChoices: getWindowIconChoices(icon, choices),
  }
}
