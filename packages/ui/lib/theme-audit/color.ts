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

const oklab = (color: Color) => {
  const [r, g, b] = color.slice(0, 3).map(linear) as [number, number, number]
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ] as const
}

/** OKLab distance uses its native 0–1 lightness scale. */
export const colorDistance = (first: Color, second: Color) => {
  const a = oklab(first)
  const b = oklab(second)
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
}

export const colorCSS = (color: Color) =>
  `rgb(${color[0]} ${color[1]} ${color[2]} / ${color[3]})`
