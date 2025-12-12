import type { Config } from 'tailwindcss'

export default {
  theme: {
    extend: {
      colors: {
        background: 'hsl(from var(--background) h s l / <alpha-value>)',
        foreground: 'hsl(from var(--foreground) h s l / <alpha-value>)',

        card: 'hsl(from var(--card) h s l / <alpha-value>)',
        'card-foreground':
          'hsl(from var(--card-foreground) h s l / <alpha-value>)',

        popover: 'hsl(from var(--popover) h s l / <alpha-value>)',
        'popover-foreground':
          'hsl(from var(--popover-foreground) h s l / <alpha-value>)',

        muted: 'hsl(from var(--muted) h s l / <alpha-value>)',
        'muted-foreground':
          'hsl(from var(--muted-foreground) h s l / <alpha-value>)',

        accent: 'hsl(from var(--accent) h s l / <alpha-value>)',
        'accent-foreground':
          'hsl(from var(--accent-foreground) h s l / <alpha-value>)',

        border: 'hsl(from var(--border) h s l / <alpha-value>)',
        input: 'hsl(from var(--input) h s l / <alpha-value>)',
        ring: 'hsl(from var(--ring) h s l / <alpha-value>)',

        primary: 'hsl(from var(--primary) h s l / <alpha-value>)',
        'primary-foreground':
          'hsl(from var(--primary-foreground) h s l / <alpha-value>)',

        destructive: 'hsl(from var(--destructive) h s l / <alpha-value>)',
        'destructive-foreground':
          'hsl(from var(--destructive-foreground) h s l / <alpha-value>)',
      },
    },
  },
  plugins: [],
} as Omit<Config, 'content'>
