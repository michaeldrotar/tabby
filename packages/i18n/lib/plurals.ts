import { t } from './i18n.js'
import type { LocalesJSONType } from './types.js'

const locale =
  typeof chrome !== 'undefined' ? chrome.i18n.getUILanguage() : 'en'
const pluralRules = new Intl.PluralRules(locale)

export const tt = (baseKey: keyof LocalesJSONType, count: number) => {
  const pluralCategory = pluralRules.select(count) // e.g., "other"
  const substitution = count.toString()
  const specificValue = t(
    `${baseKey}_${pluralCategory}` as keyof LocalesJSONType,
    substitution,
  )
  if (specificValue) {
    return specificValue
  }
  if (pluralCategory !== 'other') {
    const otherValue = t(
      `${baseKey}_other` as keyof LocalesJSONType,
      substitution,
    )
    if (otherValue) {
      return otherValue
    }
  }
  return t(baseKey, substitution)
}
