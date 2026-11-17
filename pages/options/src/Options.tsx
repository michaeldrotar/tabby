import '@src/Options.css'
import { OptionsExperience, TabbySurface } from '@extension/app'
import { ChromeTabbyProvider } from '@extension/providers/chrome'

const Options = () => (
  <ChromeTabbyProvider surface="options">
    <TabbySurface style={{ height: '100dvh' }}>
      <OptionsExperience urlSeasonalIcons />
    </TabbySurface>
  </ChromeTabbyProvider>
)
export default Options
