import type { COLORS } from './const.js'

export type ValueOf<T> = T[keyof T]
export type ColorType =
  | 'success'
  | 'info'
  | 'error'
  | 'warning'
  | keyof typeof COLORS
