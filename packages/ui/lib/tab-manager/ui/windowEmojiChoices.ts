import { isWindowIcon } from '@extension/core/windowIconChoice'
import data from 'emojibase-data/en/compact.json'

export const WINDOW_EMOJI_CHOICES = data
  .filter((emoji) => emoji.order !== undefined)
  .flatMap((emoji) =>
    [emoji, ...(emoji.skins ?? [])].map((variant) => ({
      value: `emoji:${variant.unicode}`,
      label: variant.label,
      keywords:
        `${variant.unicode} ${variant.label} ${(emoji.tags ?? []).join(' ')}`.toLowerCase(),
    })),
  )
  .filter((emoji) => isWindowIcon(emoji.value))

export const WINDOW_EMOJI_LABELS = new Map(
  WINDOW_EMOJI_CHOICES.map((emoji) => [emoji.value, emoji.label]),
)
