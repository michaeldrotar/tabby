import { curatedThemes } from '@extension/core'

export const marketingThemes = [
  'tabby',
  'reef',
  'arcade',
  'matcha',
  'rose',
  'graphite',
].map((id) => curatedThemes.find((theme) => theme.id === id)!)
