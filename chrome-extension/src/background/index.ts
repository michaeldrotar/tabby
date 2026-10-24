import { registerChromeCommands } from '@extension/chrome/registerChromeCommands'
import { registerClosingWindowMoves } from '@extension/chrome/registerClosingWindowMoves'
import { registerOmnibarActions } from '@extension/chrome/registerOmnibarActions'
import { registerSeasonalActionIcon } from '@extension/chrome/registerSeasonalActionIcon'
import { registerThemeDefaults } from '@extension/chrome/registerThemeDefaults'
import { registerWindowIdentities } from '@extension/chrome/registerWindowIdentities'

registerChromeCommands(chrome)
registerThemeDefaults(chrome)
registerSeasonalActionIcon(chrome)
registerWindowIdentities(chrome)

registerClosingWindowMoves(chrome)
registerOmnibarActions(chrome)
