import type { Config } from 'tailwindcss'

export default {
  theme: {
    extend: {
      colors: {
        background: 'hsl(from var(--background) h s l / <alpha-value>)',
        foreground: 'hsl(from var(--foreground) h s l / <alpha-value>)',
        highlighted: 'hsl(from var(--highlighted) h s l / <alpha-value>)',
        input: 'hsl(from var(--input) h s l / <alpha-value>)',

        card: 'hsl(from var(--card) h s l / <alpha-value>)',
        'card-foreground':
          'hsl(from var(--card-foreground) h s l / <alpha-value>)',

        popover: 'hsl(from var(--popover) h s l / <alpha-value>)',
        'popover-foreground':
          'hsl(from var(--popover-foreground) h s l / <alpha-value>)',

        accent: 'hsl(from var(--accent) h s l / <alpha-value>)',
        muted: 'hsl(from var(--muted) h s l / <alpha-value>)',
        border: 'hsl(from var(--border) h s l / <alpha-value>)',
      },
    },
  },
  plugins: [],
} as Omit<Config, 'content'>
