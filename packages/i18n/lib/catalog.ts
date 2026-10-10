import catalog from '../locales/en/messages.json' with { type: 'json' }
import { createTranslator } from './translator.js'

export const { t, tt } = createTranslator(catalog)
