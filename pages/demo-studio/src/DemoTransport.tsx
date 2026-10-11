import './demo-transport.css'
import { useId, useSyncExternalStore } from 'react'
import type { PlaybackState } from '@extension/demo/player'

export type DemoPlayerControls = {
  getSnapshot: () => PlaybackState
  subscribe: (listener: () => void) => () => void
  play: () => void
  pause: () => void
  seek: (time: number) => void
  rewind: () => void
}
export type DemoStep = { at: number; title: string }

/** Playback controls live outside the inert product surface. */
export const DemoTransport = ({
  player,
  steps,
  name = 'Tutorial',
}: {
  player: DemoPlayerControls
  steps: readonly DemoStep[]
  name?: string
}) => {
  const snapshot = useSyncExternalStore(
    player.subscribe,
    player.getSnapshot,
    player.getSnapshot,
  )
  const titleId = useId()
  const index = Math.max(
    0,
    steps.findLastIndex((step) => step.at <= snapshot.time),
  )
  const formatTime = (time: number) =>
    `${Math.floor(time / 60000)}:${String(Math.floor(time / 1000) % 60).padStart(2, '0')}`
  return (
    <div
      className="demo-transport"
      role="group"
      aria-label={`${name} playback`}
    >
      <div className="demo-transport-heading">
        <button
          type="button"
          className="demo-play"
          aria-label={snapshot.playing ? 'Pause' : 'Play'}
          onClick={snapshot.playing ? player.pause : player.play}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="currentColor"
            aria-hidden="true"
          >
            {snapshot.playing ? (
              <>
                <rect x="4" y="3" width="3" height="12" rx="1" />
                <rect x="11" y="3" width="3" height="12" rx="1" />
              </>
            ) : (
              <path d="M5 2.5v13L15 9Z" />
            )}
          </svg>
        </button>
        <div className="demo-transport-title">
          <span className="demo-step-count">
            {name} · <span>{snapshot.playing ? 'Playing' : 'Paused'}</span> ·
            Step {index + 1} of {steps.length}
          </span>
          <strong id={titleId} aria-live="polite">
            {snapshot.title}
          </strong>
        </div>
        <span className="demo-time">
          {formatTime(snapshot.time)} / {formatTime(snapshot.duration)}
        </span>
      </div>
      <div className="demo-segments" aria-label={`${name} steps`}>
        {steps.map((step, stepIndex) => {
          const end = steps[stepIndex + 1]?.at ?? snapshot.duration
          const progress =
            snapshot.time >= end
              ? 100
              : Math.max(
                  0,
                  ((snapshot.time - step.at) / Math.max(1, end - step.at)) *
                    100,
                )
          return (
            <button
              key={step.at}
              type="button"
              aria-label={`Step ${stepIndex + 1}: ${step.title}`}
              title={step.title}
              aria-current={index === stepIndex ? 'step' : undefined}
              onClick={() => player.seek(step.at)}
              style={{ flexGrow: Math.max(1, end - step.at) }}
            >
              <span
                className="demo-segment-fill"
                style={{ width: `${progress}%` }}
              />
            </button>
          )
        })}
      </div>
      <div className="demo-transport-bottom">
        <div className="demo-skip-buttons">
          <button
            type="button"
            onClick={player.rewind}
            aria-label="Rewind"
            title="Rewind"
          >
            ↶
          </button>
          <button
            type="button"
            onClick={() => player.seek(steps[Math.max(0, index - 1)]!.at)}
            disabled={index === 0}
            aria-label="Previous step"
            title="Previous step"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() =>
              player.seek(steps[Math.min(steps.length - 1, index + 1)]!.at)
            }
            disabled={index === steps.length - 1}
            aria-label="Next step"
            title="Next step"
          >
            →
          </button>
        </div>
        <input
          type="range"
          min={0}
          max={snapshot.duration}
          value={snapshot.time}
          step={1}
          aria-label="Tutorial position"
          aria-describedby={titleId}
          aria-valuetext={`${snapshot.title}, ${formatTime(snapshot.time)}`}
          onChange={(event) => player.seek(Number(event.target.value))}
        />
      </div>
    </div>
  )
}
