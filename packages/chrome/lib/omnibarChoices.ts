import {
  readOmnibarChoices,
  rememberOmnibarChoices,
} from '@extension/core/omnibarChoices'
import type { OmnibarChoice } from '@extension/core'

type Api = Pick<typeof chrome, 'storage' | 'windows'>
export const OMNIBAR_CHOICES_KEY = 'tabby-omnibar-choices'
export const OMNIBAR_PRIVATE_CHOICES_KEY = 'tabby-omnibar-private-choices'

const readArea = async (
  area: typeof chrome.storage.local,
  key: string,
  now: number,
) => {
  const stored = (await area.get(key))[key]
  const choices = readOmnibarChoices(stored, now)
  if (
    stored !== undefined &&
    JSON.stringify(stored) !== JSON.stringify(choices)
  )
    await area.set({ [key]: choices }).catch(() => undefined)
  return choices
}

export const isPrivateOmnibar = async (api: Api, windowId?: number) =>
  Boolean(
    (
      await (windowId === undefined
        ? api.windows.getLastFocused()
        : api.windows.get(windowId))
    ).incognito,
  )

export const loadChromeOmnibarChoices = async (
  api: Api,
  windowId?: number,
): Promise<OmnibarChoice[]> => {
  try {
    const privateWindow = await isPrivateOmnibar(api, windowId)
    const now = Date.now()
    if (privateWindow) {
      return await readArea(
        api.storage.session,
        OMNIBAR_PRIVATE_CHOICES_KEY,
        now,
      )
    }
    const values = await Promise.all([
      readArea(api.storage.session, OMNIBAR_CHOICES_KEY, now),
      readArea(api.storage.local, OMNIBAR_CHOICES_KEY, now),
    ])
    return readOmnibarChoices(values.flat(), now)
  } catch {
    return []
  }
}

export const saveChromeOmnibarChoices = async (
  api: Api,
  choices: readonly OmnibarChoice[],
  privateWindow: boolean,
) => {
  const key = privateWindow ? OMNIBAR_PRIVATE_CHOICES_KEY : OMNIBAR_CHOICES_KEY
  const areas = privateWindow
    ? [api.storage.session]
    : [api.storage.session, api.storage.local]
  for (const area of areas) {
    const next =
      area === api.storage.local
        ? choices.filter(
            (choice) => !/^(tab|window|group|restore):/.test(choice.target),
          )
        : choices
    if (!next.length) continue
    const stored = await area.get(key)
    const now = Date.now()
    await area.set({
      [key]: rememberOmnibarChoices(
        readOmnibarChoices(stored[key], now),
        next,
        now,
      ),
    })
  }
}
