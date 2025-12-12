import type { Config } from 'tailwindcss'

export default {
  theme: {
    extend: {
      colors: {
        // Custom color palette inspired by Zen Browser
        primary: {
          // Red highlights/accents
          light: '#ef4444', // red-500 - medium red for light mode
          DEFAULT: '#dc2626', // red-600 - standard red
          dark: '#fca5a5', // red-300 - light red for dark mode
        },
      },
    },
  },
  plugins: [],
} as Omit<Config, 'content'>
