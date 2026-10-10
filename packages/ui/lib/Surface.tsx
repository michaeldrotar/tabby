import {
  createContext,
  useContext,
  useId,
  useLayoutEffect,
  useState,
} from 'react'
import { cn } from './utils/cn'
import type { ThemeAccentPalette, ThemeNeutralPalette } from '@extension/core'
import type { CSSProperties, ReactNode, SyntheticEvent } from 'react'

export type SurfaceInputMode = 'live' | 'scripted' | 'static'
export type SurfaceMotion = 'system' | 'full' | 'reduced'
export type SurfaceProps = {
  children: ReactNode
  instanceId?: string
  theme?: 'light' | 'dark'
  palette?: {
    background: ThemeNeutralPalette
    foreground: ThemeNeutralPalette
    accent: ThemeAccentPalette
    strength: number
  }
  tokens?: Record<string, string | number>
  inputMode?: SurfaceInputMode
  motion?: SurfaceMotion
  className?: string
  style?: CSSProperties
}

const SurfaceContext = createContext<{
  instanceId: string
  inputMode: SurfaceInputMode
  motion: SurfaceMotion
  width: number | null
  root: HTMLDivElement | null
  portalHost: HTMLDivElement | null
} | null>(null)

export const useSurface = () => useContext(SurfaceContext)
export const useSurfaceId = (name: string) => {
  const surface = useSurface()
  const id = useId()
  return `${surface?.instanceId ?? id}-${name}`
}

const palettes = {
  light: {
    background: '#f4f4f5',
    foreground: '#18181b',
    muted: '#71717a',
    highlighted: '#d4d4d8',
    input: '#e4e4e7',
    border: '#d4d4d8',
    accent: '#2563eb',
    card: '#ffffff',
    'card-foreground': '#18181b',
    popover: '#ffffff',
    'popover-foreground': '#18181b',
    tooltip: '#18181b',
    'tooltip-foreground': '#fafafa',
  },
  dark: {
    background: '#18181b',
    foreground: '#fafafa',
    muted: '#a1a1aa',
    highlighted: '#52525b',
    input: '#27272a',
    border: '#3f3f46',
    accent: '#93c5fd',
    card: '#27272a',
    'card-foreground': '#fafafa',
    popover: '#27272a',
    'popover-foreground': '#fafafa',
    tooltip: '#fafafa',
    'tooltip-foreground': '#18181b',
  },
}

/** Owns presentation and input within one mounted product instance. */
export const Surface = ({
  children,
  instanceId,
  theme = 'light',
  palette,
  tokens,
  inputMode = 'live',
  motion = 'system',
  className,
  style,
}: SurfaceProps) => {
  const generatedId = useId()
  const [root, setRoot] = useState<HTMLDivElement | null>(null)
  const [portalHost, setPortalHost] = useState<HTMLDivElement | null>(null)
  const [width, setWidth] = useState<number | null>(null)
  const blocked = inputMode !== 'live'
  useLayoutEffect(() => {
    const element = root
    if (!element) return
    let mounted = true
    queueMicrotask(() => {
      if (mounted) setWidth(element.getBoundingClientRect().width)
    })
    if (typeof ResizeObserver === 'undefined')
      return () => {
        mounted = false
      }
    const observer = new ResizeObserver(
      ([entry]) => entry && setWidth(entry.contentRect.width),
    )
    observer.observe(element)
    return () => {
      mounted = false
      observer.disconnect()
    }
  }, [root])
  useLayoutEffect(() => {
    if (!root || !blocked) return
    const cancelScroll = (event: Event) => {
      event.preventDefault()
      event.stopPropagation()
    }
    root.addEventListener('wheel', cancelScroll, {
      passive: false,
      capture: true,
    })
    root.addEventListener('touchmove', cancelScroll, {
      passive: false,
      capture: true,
    })
    return () => {
      root.removeEventListener('wheel', cancelScroll, true)
      root.removeEventListener('touchmove', cancelScroll, true)
    }
  }, [root, blocked])
  const blockInput = (event: SyntheticEvent) => {
    if (!blocked) return
    event.preventDefault()
    event.stopPropagation()
  }
  const resolvedTokens = {
    ...(palette ? {} : palettes[theme]),
    'accent-strength': palette?.strength ?? 15,
    ...tokens,
  }
  const variables = Object.fromEntries(
    Object.entries(resolvedTokens).map(([key, value]) => [
      key.startsWith('--') ? key : `--${key}`,
      value,
    ]),
  )
  return (
    <SurfaceContext.Provider
      value={{
        instanceId: instanceId ?? generatedId,
        inputMode,
        motion,
        width,
        root,
        portalHost,
      }}
    >
      <div
        ref={setRoot}
        data-surface={instanceId ?? generatedId}
        data-input-mode={inputMode}
        data-theme={theme}
        data-theme-background={palette?.background}
        data-theme-foreground={palette?.foreground}
        data-theme-accent={palette?.accent}
        data-motion={motion}
        data-force-reduced-motion={
          motion === 'system' ? undefined : motion === 'reduced'
        }
        className={cn(
          `
            text-foreground relative isolate h-full min-h-0 w-full min-w-0
            font-sans
          `,
          theme === 'dark' && 'dark',
          className,
        )}
        style={{ ...variables, colorScheme: theme, ...style } as CSSProperties}
        onClickCapture={blockInput}
        onDoubleClickCapture={blockInput}
        onPointerDownCapture={blockInput}
        onMouseDownCapture={blockInput}
        onContextMenuCapture={blockInput}
        onKeyDownCapture={blockInput}
      >
        <style>{`[data-surface] [data-focus="true"] { outline: 2px solid var(--accent); outline-offset: 2px; }
[data-surface][data-motion="reduced"] *, [data-surface][data-input-mode="static"] * { animation: none !important; transition: none !important; }`}</style>
        <div
          inert={blocked ? true : undefined}
          className="h-full min-h-0"
          style={
            blocked ? { pointerEvents: 'none', userSelect: 'none' } : undefined
          }
        >
          {children}
          <div data-surface-portals ref={setPortalHost} />
        </div>
      </div>
    </SurfaceContext.Provider>
  )
}
