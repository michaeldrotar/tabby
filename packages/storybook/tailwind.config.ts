import { createTailwindConfig } from '@extension/ui/create-tailwind-config'
import { uiTailwindConfig } from '@extension/ui/ui-tailwind-config'
import type { Config } from 'tailwindcss'

export default createTailwindConfig(uiTailwindConfig, {
  content: [
    './stories/**/*.{js,jsx,ts,tsx}',
    './.storybook/**/*.{js,jsx,ts,tsx}',
    '../../packages/ui/lib/**/*.{js,jsx,ts,tsx}',
    '../../pages/*/src/**/*.{js,jsx,ts,tsx}',
  ],
} satisfies Config)
