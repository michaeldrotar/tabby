import { createTailwindConfig } from '@extension/tailwindcss-config/create-tailwind-config'
import { uiTailwindConfig } from '@extension/ui/ui-tailwind-config'

export default createTailwindConfig(uiTailwindConfig, {
  content: ['src/**/*.{ts,tsx}'],
})
