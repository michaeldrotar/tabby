export type Color = readonly [number, number, number, number]

export const composite = (front: Color, back: Color): Color => {
  const alpha = front[3] + back[3] * (1 - front[3])
  if (alpha === 0) return [0, 0, 0, 0]
  const channel = (index: 0 | 1 | 2) =>
    (front[index] * front[3] + back[index] * back[3] * (1 - front[3])) / alpha
  return [channel(0), channel(1), channel(2), alpha]
}

const linear = (channel: number) => {
  const value = channel / 255
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}

const luminance = (color: Color) =>
  0.2126 * linear(color[0]) +
  0.7152 * linear(color[1]) +
  0.0722 * linear(color[2])

export const contrastRatio = (front: Color, background: Color) => {
  const text = luminance(composite(front, background))
  const base = luminance(background)
  return (Math.max(text, base) + 0.05) / (Math.min(text, base) + 0.05)
}
