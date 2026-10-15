import { registerChromeCommands } from '@extension/chrome/registerChromeCommands'
import { registerSeasonalActionIcon } from '@extension/chrome/registerSeasonalActionIcon'
import { registerWindowIdentities } from '@extension/chrome/registerWindowIdentities'

registerChromeCommands(chrome)
registerSeasonalActionIcon(chrome)
registerWindowIdentities(chrome)
