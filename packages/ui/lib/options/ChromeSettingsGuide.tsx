import { ChevronDownIcon } from '../icons'

const GuideArrow = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
    aria-hidden="true"
    className="shrink-0"
  >
    <path
      d="M4 28C20 28 24 20 24 5m-7 7 7-7 5 8"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const ChromeSettingsGuide = ({
  kind,
  isMac = false,
}: {
  kind: 'side-panel' | 'shortcuts'
  isMac?: boolean
}) => {
  const sidePanel = kind === 'side-panel'
  const instruction = sidePanel
    ? 'Choose Left or Right to move Tabby'
    : 'Click the pencil, then press your keys'
  return (
    <figure className="mt-4">
      <div
        role="img"
        aria-label={
          sidePanel
            ? 'Chrome appearance settings: under Side panel position, change the Chrome Panels dropdown to Left or Right to move Tabby.'
            : 'Chrome shortcut settings: find Tabby, click the pencil beside a shortcut, then press your preferred keys.'
        }
        className="
          rounded-lg border border-[#dadce0] bg-[#f8fafd] p-3 text-sm
          text-[#202124]
        "
      >
        <div aria-hidden="true">
          <p className="mb-3 font-medium">
            {sidePanel ? 'Side panel position' : 'Tabby'}
          </p>
          {sidePanel ? (
            <div className="space-y-2">
              {['Google Search AI Mode', 'Gemini', 'Chrome Panels'].map(
                (label) => (
                  <div
                    key={label}
                    className={`
                      flex items-center justify-between gap-2 rounded-md p-2
                      ${
                        label === 'Chrome Panels'
                          ? 'border-2 border-[#1967d2] bg-[#e8f0fe]'
                          : 'border-2 border-transparent text-[#5f6368]'
                      }
                    `}
                  >
                    <span>{label}</span>
                    <span
                      className="
                        flex shrink-0 items-center gap-4 rounded-md border
                        border-[#9aa0a6] px-2 py-1
                      "
                    >
                      {label === 'Chrome Panels' ? 'Left' : 'Right'}
                      <ChevronDownIcon className="size-3" />
                    </span>
                  </div>
                ),
              )}
            </div>
          ) : (
            <div
              className="
                flex flex-wrap items-center justify-between gap-2 rounded-md
                border border-[#dadce0] bg-white p-3
              "
            >
              <span>Open Tabby search</span>
              <span className="ml-auto flex shrink-0 items-center gap-2">
                <span className="text-[#5f6368]">
                  {isMac ? '⌘ E' : 'Alt + E'}
                </span>
                <span
                  className="
                    rounded-md border-2 border-[#1967d2] bg-[#e8f0fe] p-1.5
                    text-[#1967d2]
                  "
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="m15 5 4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15v5Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </span>
            </div>
          )}
          <div
            className="
              mt-1 flex items-end justify-end gap-1 pr-3 font-medium
              text-[#1967d2]
            "
          >
            <span>{instruction}</span>
            <GuideArrow />
          </div>
        </div>
      </div>
      <figcaption className="mt-2 text-sm text-muted">
        {sidePanel
          ? 'Example in Chrome appearance settings'
          : 'Example in Chrome shortcut settings → Tabby'}
      </figcaption>
    </figure>
  )
}
