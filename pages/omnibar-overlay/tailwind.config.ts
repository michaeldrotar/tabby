import { omnibarTailwindConfig } from '@extension/omnibar/omnibar-tailwind-config'
import { createTailwindConfig } from '@extension/tailwindcss-config/create-tailwind-config'
import { uiTailwindConfig } from '@extension/ui/ui-tailwind-config'

export default createTailwindConfig(uiTailwindConfig, omnibarTailwindConfig, {
  content: ['index.html', 'src/**/*.{ts,tsx}'],
})
