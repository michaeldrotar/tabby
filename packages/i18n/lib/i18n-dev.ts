// Locale import is selected during development preparation.
import localeJSON from '../locales/en/messages.json' with { type: 'json' }
import { createTranslator } from './translator.js'

export const { t } = createTranslator(localeJSON)
