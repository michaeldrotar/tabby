import { availableSeasonalHolidays, curatedThemes } from '@extension/core'
import { ThemeCardContent } from '@extension/ui/options/ThemeCard'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { useScrollEntrance } from './MotionReveal'
import { useIdleCue } from './useIdleCue'
import type { CuratedTheme, ThemeAppearance } from '@extension/core'
import type {
  CSSProperties,
  KeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from 'react'

type PieceKind = 'sticker' | 'theme'

type ScenePiece = {
  id: string
  label: string
  kind: PieceKind
  x: number
  y: number
  size: number
  rotation: number
  theme?: CuratedTheme
  mode?: ThemeAppearance
  src?: string
  delay: number
  entryX: number
  entryY: number
  entryRotation: number
  entryScale: number
  impactScale: number
  entryDuration: number
}

type PiecePosition = {
  x: number
  y: number
  rotation: number
  vx: number
  vy: number
  spin: number
}

type ActiveDrag = {
  id: string
  pointerId: number
  grabX: number
  grabY: number
  startX: number
  startY: number
  lastX: number
  lastY: number
  lastAt: number
  startedAt: number
  vx: number
  vy: number
  moved: boolean
}

type PieceStyle = CSSProperties & {
  '--piece-size': string
  '--piece-rotation': string
  '--entry-x': string
  '--entry-y': string
  '--entry-rotation': string
  '--entry-scale': string
  '--entry-impact-scale': string
  '--entry-duration': string
  '--cursor-x': string
  '--cursor-y': string
  '--cursor-rotation': string
  '--idle-duration'?: string
}

const randomBetween = (minimum: number, maximum: number) =>
  minimum + Math.random() * (maximum - minimum)

const playgroundVisibility = 0.38

const shuffled = <T,>(values: readonly T[]) => {
  const result = [...values]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const otherIndex = Math.floor(Math.random() * (index + 1))
    ;[result[index], result[otherIndex]] = [result[otherIndex]!, result[index]!]
  }
  return result
}

const pilePosition = (index: number, count: number, phase: number) => {
  const angle = index * Math.PI * (3 - Math.sqrt(5)) + phase
  const radius = Math.sqrt((index + 0.5) / count)
  return {
    x: 50 + Math.cos(angle) * radius * 28 + randomBetween(-3, 3),
    y: 48 + Math.sin(angle) * radius * 27 + randomBetween(-3, 3),
  }
}

const createPiece = (
  piece: Omit<
    ScenePiece,
    | 'delay'
    | 'entryX'
    | 'entryY'
    | 'entryRotation'
    | 'entryScale'
    | 'impactScale'
    | 'entryDuration'
  >,
): ScenePiece => {
  const entryAngle = randomBetween(0, Math.PI * 2)
  const entryDistance = randomBetween(172.5, 427.5)

  return {
    ...piece,
    delay: randomBetween(0, 125),
    entryX: Math.cos(entryAngle) * entryDistance,
    entryY: Math.sin(entryAngle) * entryDistance,
    entryRotation: randomBetween(-250, 250),
    entryScale: randomBetween(0.36, 0.78),
    impactScale: randomBetween(1.02, 1.2),
    entryDuration: randomBetween(580, 880),
  }
}

const seasonalStickers = availableSeasonalHolidays.flatMap((holiday) =>
  holiday.iconOptions.map((icon) => ({
    id: icon.id,
    label: `${holiday.name} ${icon.name} sticker`,
    src: `/seasonal-icons/${icon.id}-128.png`,
  })),
)

const createScenePieces = (): ScenePiece[] => {
  const stickerPhase = randomBetween(0, Math.PI * 2)
  const themePhase = randomBetween(0, Math.PI * 2)
  const stickers = shuffled(seasonalStickers).map((sticker, index) =>
    createPiece({
      ...sticker,
      id: `sticker-${sticker.id}`,
      kind: 'sticker',
      ...pilePosition(index, seasonalStickers.length, stickerPhase),
      size: randomBetween(54, 72),
      rotation: randomBetween(-35, 35),
    }),
  )

  const themes = shuffled(curatedThemes).map((theme, index) => {
    const mode = index % 2 === 0 ? 'light' : 'dark'
    return createPiece({
      id: `theme-${theme.id}`,
      label: `${theme.name} ${mode} theme card`,
      kind: 'theme',
      ...pilePosition(index, curatedThemes.length, themePhase),
      size: randomBetween(96, 108),
      rotation: randomBetween(-28, 28),
      theme,
      mode,
    })
  })

  return shuffled([...stickers, ...themes])
}

const positionsForScene = (scenePieces: ScenePiece[]) =>
  new Map<string, PiecePosition>(
    scenePieces.map((piece) => [
      piece.id,
      {
        x: piece.x,
        y: piece.y,
        rotation: piece.rotation,
        vx: 0,
        vy: 0,
        spin: 0,
      },
    ]),
  )

const pieceRadii = (
  element: HTMLButtonElement,
  rotation: number,
  area: DOMRect,
) => {
  const radians = ((rotation % 360) * Math.PI) / 180
  const cosine = Math.abs(Math.cos(radians))
  const sine = Math.abs(Math.sin(radians))
  const insetX =
    (element.offsetWidth * cosine + element.offsetHeight * sine) / 2 + 8
  const insetY =
    (element.offsetWidth * sine + element.offsetHeight * cosine) / 2 + 8

  return {
    x: Math.min(49, (insetX / area.width) * 100),
    y: Math.min(49, (insetY / area.height) * 100),
  }
}

const clampPosition = (value: number, radius: number) =>
  Math.max(radius, Math.min(100 - radius, value))

export const SeasonalStylePlayground = () => {
  const [scenePieces] = useState(createScenePieces)
  const containerRef = useRef<HTMLDivElement>(null)
  const hasEntered = useScrollEntrance(containerRef, playgroundVisibility)
  const [arrived, setArrived] = useState(false)
  const lastArrival = scenePieces.reduce((last, piece) =>
    piece.delay + piece.entryDuration > last.delay + last.entryDuration
      ? piece
      : last,
  )
  const pieceElements = useRef(new Map<string, HTMLButtonElement>())
  const positions = useRef(positionsForScene(scenePieces))
  const topZIndex = useRef(scenePieces.length)
  const activeDrag = useRef<ActiveDrag | null>(null)
  const animationFrame = useRef<number | null>(null)
  const lastPhysicsAt = useRef<number | null>(null)
  const reducedMotion = useRef(false)
  const [idlePieces, setIdlePieces] = useState<
    {
      id: string
      motion: 'bounce' | 'shake' | 'spin' | 'whirl'
      duration: number
    }[]
  >([])
  const nextMotion = useRef(0)
  const burstRemaining = useRef(0)
  const nextIdleDelay = useCallback(
    () =>
      burstRemaining.current
        ? randomBetween(650, 1050)
        : randomBetween(2600, 3800),
    [],
  )
  useIdleCue(containerRef, {
    enabled: arrived,
    delay: 1000,
    threshold: playgroundVisibility,
    interval: nextIdleDelay,
    onCue: () => {
      if (activeDrag.current || animationFrame.current !== null) return
      const piece = shuffled(scenePieces).find(
        (piece) => !idlePieces.some((idle) => idle.id === piece.id),
      )
      if (!piece) return
      if (!burstRemaining.current)
        burstRemaining.current = Math.floor(randomBetween(3, 6))
      burstRemaining.current -= 1
      const motions = ['bounce', 'shake', 'spin', 'whirl'] as const
      const motion = motions[nextMotion.current++ % motions.length]!
      const duration =
        motion === 'whirl' ? randomBetween(600, 800) : randomBetween(850, 1250)
      setIdlePieces((current) => [
        ...current,
        { id: piece.id, motion, duration },
      ])
    },
    onCancel: () => {
      burstRemaining.current = 0
      setIdlePieces((current) => (current.length ? [] : current))
    },
  })

  const bringToFront = useCallback((pieceId: string) => {
    const element = pieceElements.current.get(pieceId)
    if (!element) return
    topZIndex.current += 1
    element.style.zIndex = String(topZIndex.current)
  }, [])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => {
      reducedMotion.current = mediaQuery.matches
    }
    updatePreference()
    mediaQuery.addEventListener('change', updatePreference)
    return () => mediaQuery.removeEventListener('change', updatePreference)
  }, [])

  const writePosition = useCallback((pieceId: string) => {
    const element = pieceElements.current.get(pieceId)
    const position = positions.current.get(pieceId)
    if (!element || !position) return
    element.style.left = `${position.x}%`
    element.style.top = `${position.y}%`
    element.style.setProperty('--piece-rotation', `${position.rotation}deg`)
  }, [])

  const keepPiecesInBounds = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    const area = container.getBoundingClientRect()
    if (!area.width || !area.height) return

    for (const piece of scenePieces) {
      const element = pieceElements.current.get(piece.id)
      const position = positions.current.get(piece.id)
      if (!element || !position) continue
      const radius = pieceRadii(element, position.rotation, area)
      position.x = clampPosition(position.x, radius.x)
      position.y = clampPosition(position.y, radius.y)
      writePosition(piece.id)
    }
  }, [scenePieces, writePosition])

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return
    keepPiecesInBounds()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(keepPiecesInBounds)
    observer.observe(container)
    return () => observer.disconnect()
  }, [keepPiecesInBounds])

  const runPhysics = useCallback(
    (timestamp: number) => {
      const container = containerRef.current
      if (!container) {
        animationFrame.current = null
        return
      }
      const rect = container.getBoundingClientRect()
      const previousTimestamp = lastPhysicsAt.current
      const frameScale =
        previousTimestamp === null
          ? 1
          : Math.min(
              2.5,
              Math.max(0.5, (timestamp - previousTimestamp) / 16.67),
            )
      lastPhysicsAt.current = timestamp
      let stillMoving = false

      for (const piece of scenePieces) {
        const element = pieceElements.current.get(piece.id)
        const position = positions.current.get(piece.id)
        if (!element || !position || activeDrag.current?.id === piece.id)
          continue
        if (
          Math.abs(position.vx) < 0.025 &&
          Math.abs(position.vy) < 0.025 &&
          Math.abs(position.spin) < 0.04
        ) {
          position.vx = 0
          position.vy = 0
          position.spin = 0
          element.dataset.moving = 'false'
          continue
        }

        stillMoving = true
        position.x += position.vx * frameScale
        position.y += position.vy * frameScale
        position.rotation += position.spin * frameScale
        position.vx *= Math.pow(0.9, frameScale)
        position.vy *= Math.pow(0.9, frameScale)
        position.spin *= Math.pow(0.9, frameScale)

        const radius = pieceRadii(element, position.rotation, rect)
        if (position.x < radius.x || position.x > 100 - radius.x) {
          position.x = clampPosition(position.x, radius.x)
          position.vx *= -0.48
        }
        if (position.y < radius.y || position.y > 100 - radius.y) {
          position.y = clampPosition(position.y, radius.y)
          position.vy *= -0.48
        }
        writePosition(piece.id)
      }

      if (stillMoving) {
        animationFrame.current = requestAnimationFrame(runPhysics)
      } else {
        animationFrame.current = null
        lastPhysicsAt.current = null
      }
    },
    [scenePieces, writePosition],
  )

  const startPhysics = useCallback(() => {
    if (animationFrame.current === null) {
      lastPhysicsAt.current = null
      animationFrame.current = requestAnimationFrame(runPhysics)
    }
  }, [runPhysics])

  const tossPiece = useCallback(
    (piece: ScenePiece, charge = 1) => {
      const element = pieceElements.current.get(piece.id)
      const position = positions.current.get(piece.id)
      if (!element) return
      bringToFront(piece.id)
      if (
        !position ||
        reducedMotion.current ||
        element.dataset.moving === 'true'
      )
        return

      const angle = randomBetween(0, Math.PI * 2)
      const strength = randomBetween(1.8, 3.9) * charge
      position.vx = Math.cos(angle) * strength
      position.vy = Math.sin(angle) * strength
      position.spin = randomBetween(-2.7, 2.7) * charge
      element.dataset.moving = 'true'
      startPhysics()
    },
    [bringToFront, startPhysics],
  )

  useEffect(
    () => () => {
      if (animationFrame.current !== null)
        cancelAnimationFrame(animationFrame.current)
    },
    [],
  )

  const resetCursorReaction = useCallback(() => {
    for (const element of pieceElements.current.values()) {
      element.style.setProperty('--cursor-x', '0px')
      element.style.setProperty('--cursor-y', '0px')
      element.style.setProperty('--cursor-rotation', '0deg')
    }
  }, [])

  const reactToCursor = useCallback(
    (clientX: number, clientY: number) => {
      const container = containerRef.current
      if (!container || activeDrag.current) return
      if (reducedMotion.current) {
        resetCursorReaction()
        return
      }
      const rect = container.getBoundingClientRect()
      const x = clientX - rect.left
      const y = clientY - rect.top
      const reach = Math.min(175, rect.width * 0.28)

      for (const piece of scenePieces) {
        const element = pieceElements.current.get(piece.id)
        const position = positions.current.get(piece.id)
        if (!element || !position) continue
        const dx = (position.x / 100) * rect.width - x
        const dy = (position.y / 100) * rect.height - y
        const distance = Math.hypot(dx, dy)
        const influence = Math.max(0, 1 - distance / reach)
        const strength = influence * influence
        const direction = distance > 0 ? 1 / distance : 0
        element.style.setProperty(
          '--cursor-x',
          `${dx * direction * 8 * strength}px`,
        )
        element.style.setProperty(
          '--cursor-y',
          `${dy * direction * 8 * strength}px`,
        )
        element.style.setProperty(
          '--cursor-rotation',
          `${(dx * direction * 3.5 * strength).toFixed(2)}deg`,
        )
      }
    },
    [scenePieces, resetCursorReaction],
  )

  const movePiece = useCallback(
    (piece: ScenePiece, x: number, y: number) => {
      const container = containerRef.current
      const element = pieceElements.current.get(piece.id)
      const position = positions.current.get(piece.id)
      if (!container || !element || !position) return
      const rect = container.getBoundingClientRect()
      const radius = pieceRadii(element, position.rotation, rect)
      position.x = clampPosition(x, radius.x)
      position.y = clampPosition(y, radius.y)
      writePosition(piece.id)
    },
    [writePosition],
  )

  const beginDrag = useCallback(
    (piece: ScenePiece, event: ReactPointerEvent<HTMLButtonElement>) => {
      if (event.button !== 0) return
      const container = containerRef.current
      const position = positions.current.get(piece.id)
      const element = event.currentTarget
      if (!container || !position) return
      bringToFront(piece.id)
      const rect = container.getBoundingClientRect()
      const centerX = rect.left + (position.x / 100) * rect.width
      const centerY = rect.top + (position.y / 100) * rect.height
      const now = performance.now()
      activeDrag.current = {
        id: piece.id,
        pointerId: event.pointerId,
        grabX: event.clientX - centerX,
        grabY: event.clientY - centerY,
        startX: event.clientX,
        startY: event.clientY,
        lastX: event.clientX,
        lastY: event.clientY,
        lastAt: now,
        startedAt: now,
        vx: 0,
        vy: 0,
        moved: false,
      }
      position.vx = 0
      position.vy = 0
      position.spin = 0
      element.dataset.grabbed = 'true'
      element.dataset.moving = 'false'
      resetCursorReaction()
      element.setPointerCapture(event.pointerId)
    },
    [bringToFront, resetCursorReaction],
  )

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const drag = activeDrag.current
      const container = containerRef.current
      if (drag && drag.pointerId === event.pointerId && container) {
        const rect = container.getBoundingClientRect()
        const x = ((event.clientX - drag.grabX - rect.left) / rect.width) * 100
        const y = ((event.clientY - drag.grabY - rect.top) / rect.height) * 100
        const now = performance.now()
        const elapsed = Math.max(8, now - drag.lastAt)
        const deltaX = ((event.clientX - drag.lastX) / rect.width) * 100
        const deltaY = ((event.clientY - drag.lastY) / rect.height) * 100
        drag.vx = Math.max(-2, Math.min(2, (deltaX / elapsed) * 16.67))
        drag.vy = Math.max(-2, Math.min(2, (deltaY / elapsed) * 16.67))
        drag.moved ||=
          Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) >
          5
        drag.lastX = event.clientX
        drag.lastY = event.clientY
        drag.lastAt = now
        const piece = scenePieces.find((item) => item.id === drag.id)
        if (piece) movePiece(piece, x, y)
        return
      }
      if (event.pointerType !== 'touch')
        reactToCursor(event.clientX, event.clientY)
    },
    [movePiece, reactToCursor, scenePieces],
  )

  const endDrag = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>, cancelled = false) => {
      const drag = activeDrag.current
      if (!drag || drag.pointerId !== event.pointerId) return
      const element = event.currentTarget
      const position = positions.current.get(drag.id)
      if (element.hasPointerCapture(event.pointerId))
        element.releasePointerCapture(event.pointerId)
      delete element.dataset.grabbed
      const charge =
        1 + Math.min(1, (performance.now() - drag.startedAt) / 1000)
      if (position && drag.moved && !cancelled && !reducedMotion.current) {
        position.vx = drag.vx * 1.5 * charge
        position.vy = drag.vy * 1.5 * charge
        position.spin =
          Math.max(-3.5, Math.min(3.5, drag.vx * 0.72)) * 1.5 * charge
        element.dataset.moving = 'true'
        startPhysics()
      } else if (position) {
        position.vx = 0
        position.vy = 0
        position.spin = 0
        element.dataset.moving = 'false'
      }
      activeDrag.current = null
      if (!drag.moved && !cancelled) {
        const piece = scenePieces.find((item) => item.id === drag.id)
        if (piece) tossPiece(piece, charge)
      }
    },
    [startPhysics, scenePieces, tossPiece],
  )

  const handleKeyDown = useCallback(
    (piece: ScenePiece, event: KeyboardEvent<HTMLButtonElement>) => {
      const step = event.shiftKey ? 4 : 1.5
      const position = positions.current.get(piece.id)
      if (!position) return
      let { x, y } = position
      switch (event.key) {
        case 'ArrowLeft':
          x -= step
          break
        case 'ArrowRight':
          x += step
          break
        case 'ArrowUp':
          y -= step
          break
        case 'ArrowDown':
          y += step
          break
        default:
          return
      }
      event.preventDefault()
      bringToFront(piece.id)
      position.vx = 0
      position.vy = 0
      position.spin = 0
      event.currentTarget.dataset.moving = 'false'
      movePiece(piece, x, y)
    },
    [bringToFront, movePiece],
  )

  const handlePointerLeave = useCallback(() => {
    if (!activeDrag.current) resetCursorReaction()
  }, [resetCursorReaction])

  return (
    <div
      ref={containerRef}
      className="feature-art feature-art--customize seasonal-playground"
      role="group"
      aria-label="Tabby themes and seasonal icons"
      aria-describedby="seasonal-playground-help"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <p id="seasonal-playground-help" className="playground-sr-only">
        Drag a piece to move it, or click it for a little toss. Hold up to a
        second for a stronger throw. Focus a piece and use the arrow keys to
        nudge it.
      </p>
      <p className="playground-hint" aria-hidden="true">
        Drag or tap pieces to move them
      </p>
      {scenePieces.map((piece, index) => {
        const idle = idlePieces.find((idle) => idle.id === piece.id)
        const pieceStyle: PieceStyle = {
          left: `${piece.x}%`,
          top: `${piece.y}%`,
          zIndex: index + 1,
          '--piece-size': `${piece.size}px`,
          '--piece-rotation': `${piece.rotation}deg`,
          '--entry-x': `${piece.entryX}px`,
          '--entry-y': `${piece.entryY}px`,
          '--entry-rotation': `${piece.entryRotation}deg`,
          '--entry-scale': String(piece.entryScale),
          '--entry-impact-scale': String(piece.impactScale),
          '--entry-duration': `${piece.entryDuration}ms`,
          '--cursor-x': '0px',
          '--cursor-y': '0px',
          '--cursor-rotation': '0deg',
          ...(idle ? { '--idle-duration': `${idle.duration}ms` } : {}),
        }
        return (
          <button
            key={piece.id}
            ref={(element) => {
              if (element) pieceElements.current.set(piece.id, element)
              else pieceElements.current.delete(piece.id)
            }}
            type="button"
            className={`
              playground-piece
              playground-piece--${piece.kind}
            `}
            style={pieceStyle}
            aria-label={`Move or toss ${piece.label}`}
            aria-describedby="seasonal-playground-help"
            aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight"
            data-idle-motion={idle?.motion}
            onAnimationEnd={(event) => {
              if (
                event.animationName === 'playground-toss' &&
                piece.id === lastArrival.id
              )
                setArrived(true)
              if (event.animationName.startsWith('playground-idle-'))
                setIdlePieces((current) =>
                  current.filter((idle) => idle.id !== piece.id),
                )
            }}
            onPointerEnter={() => bringToFront(piece.id)}
            onFocus={() => bringToFront(piece.id)}
            onPointerDown={(event) => beginDrag(piece, event)}
            onPointerUp={(event) => endDrag(event)}
            onPointerCancel={(event) => endDrag(event, true)}
            onClick={(event) => {
              if (event.detail === 0) tossPiece(piece)
            }}
            onKeyDown={(event) => handleKeyDown(piece, event)}
          >
            <span
              className={
                hasEntered
                  ? 'playground-piece__arrival is-entered'
                  : 'playground-piece__arrival'
              }
              style={{ animationDelay: `${piece.delay}ms` }}
            >
              {piece.kind === 'sticker' ? (
                <span className="playground-sticker">
                  <img src={piece.src} width="128" height="128" alt="" />
                </span>
              ) : piece.theme && piece.mode ? (
                <span
                  className="playground-theme-card"
                  style={{
                    backgroundColor: piece.theme[piece.mode].surface,
                    color: piece.theme[piece.mode].text,
                  }}
                  aria-hidden="true"
                >
                  <ThemeCardContent
                    theme={piece.theme}
                    mode={piece.mode}
                    size="compact"
                  />
                </span>
              ) : null}
            </span>
          </button>
        )
      })}
    </div>
  )
}
