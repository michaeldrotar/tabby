import { config } from '@dotenvx/dotenvx'
import type { EnvType } from './types.js'

export const baseEnv =
  config({
    path: `${import.meta.dirname}/../../../../.env`,
  }).parsed ?? {}

export const dynamicEnvValues = {
  CEB_NODE_ENV: baseEnv.CEB_DEV === 'true' ? 'development' : 'production',
} as const

export const env = { ...baseEnv, ...dynamicEnvValues } as EnvType
