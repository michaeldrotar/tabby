import baseConfig from '../../packages/ui/lib/base-tailwind-config'
import type { Config } from 'tailwindcss'

export default {
  presets: [baseConfig],
  content: [
    './product-preview.html',
    './src/**/*.{ts,tsx}',
    '../../packages/ui/lib/**/*.{ts,tsx}',
    '../../packages/shared/lib/**/*.{ts,tsx}',
  ],
} satisfies Config
