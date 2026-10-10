import { TabbySurface, TabManagerExperience } from '@extension/app'
import { ChromeTabbyProvider } from '@extension/providers/chrome'

export const Root = () => (
  <ChromeTabbyProvider surface="tab-manager">
    <TabbySurface
      instanceId="extension-tab-manager"
      style={{ height: '100dvh' }}
    >
      <TabManagerExperience focusOnMount />
    </TabbySurface>
  </ChromeTabbyProvider>
)
