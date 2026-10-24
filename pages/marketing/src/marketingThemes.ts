import { curatedThemes } from '@extension/core'

export const marketingThemes = [
  'tabby-brand',
  'reef',
  'arcade',
  'matcha',
  'rose',
  'graphite',
].map((id) => curatedThemes.find((theme) => theme.id === id)!)
