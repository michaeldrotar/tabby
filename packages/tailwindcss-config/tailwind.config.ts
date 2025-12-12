import type { Config } from 'tailwindcss'

const withOpacity =
  (variable: string) =>
  ({ opacityValue }: { opacityValue?: string }) => {
    if (opacityValue) {
      return `rgb(var(${variable}) / ${opacityValue})`
    }
    return `rgb(var(${variable}))`
  }

export default {
  theme: {
    extend: {
      colors: {
        background: withOpacity('--tabby-background'),
        surface: withOpacity('--tabby-surface'),
        'surface-muted': withOpacity('--tabby-muted-surface'),
        border: withOpacity('--tabby-border'),
        foreground: withOpacity('--tabby-foreground'),
        'muted-foreground': withOpacity('--tabby-muted-foreground'),
        accent: withOpacity('--tabby-accent'),
        'accent-soft': withOpacity('--tabby-accent-soft'),
        'accent-foreground': withOpacity('--tabby-accent-foreground'),
        ring: withOpacity('--tabby-ring'),
        input: withOpacity('--tabby-input'),
        overlay: withOpacity('--tabby-overlay'),
      },
      boxShadow: {
        surface:
          '0 10px 25px rgb(var(--tabby-overlay) / 0.2), 0 1px 1px rgb(var(--tabby-overlay) / 0.08)',
      },
    },
  },
  plugins: [],
} as Omit<Config, 'content'>
