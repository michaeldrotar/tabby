import { createTailwindConfig } from './lib/create-tailwind-config'
import { uiTailwindConfig } from './lib/ui-tailwind-config'
import type { Config } from 'tailwindcss'

export default createTailwindConfig(uiTailwindConfig, {
  content: ['./lib/**/*.{js,jsx,ts,tsx}'],
} satisfies Config)
