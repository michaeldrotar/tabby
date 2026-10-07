import { getEnv } from '@extension/env/getEnv'
import { Profiler as ReactProfiler } from 'react'
import { recordDiagnosticRender } from './devDiagnostics.js'
import type { ProfilerOnRenderCallback, ReactNode } from 'react'

const IS_DEV = getEnv()['IS_DEV']

const onRender: ProfilerOnRenderCallback = (
  id,
  phase,
  actualDuration,
  baseDuration,
) => {
  recordDiagnosticRender(id, phase, actualDuration, baseDuration)
}

type ProfilerProps = {
  id: string
  children: ReactNode
}

/**
 * Adds React Profiler boundaries in development. Render data is recorded only
 * during an opt-in diagnostics session, without logging on every render.
 */
export const Profiler = ({ id, children }: ProfilerProps) => {
  if (!IS_DEV) return <>{children}</>
  return (
    <ReactProfiler id={id} onRender={onRender}>
      {children}
    </ReactProfiler>
  )
}
