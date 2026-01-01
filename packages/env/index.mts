import { baseEnv, dynamicEnvValues } from './lib/config.js'
import type { EnvType } from './lib/types.js'

export * from './lib/config.js'
export * from './lib/const.js'

export default {
  ...baseEnv,
  ...dynamicEnvValues,
} as EnvType
