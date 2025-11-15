import { cn } from '@extension/ui'
import type { BrowserWindow } from '@extension/chrome'

export type WindowThumbnailProps = {
  browserWindow: BrowserWindow
  isLight: boolean
}

export const WindowThumbnail = ({
  browserWindow,
  isLight,
}: WindowThumbnailProps) => {
  console.count('WindowThumbnail.render')

  const screenHeight = screen.height
  const screenWidth = screen.width
  const aspectRatio = screenWidth / screenHeight

  const top = browserWindow.top || 0
  const left = browserWindow.left || 0
  const width = browserWindow.width || screenWidth - left
  const height = browserWindow.height || screenHeight - top

  console.log({ top, left, width, height, screenWidth, screenHeight })

  const positionStyles = {
    top: `${(top / screenHeight) * 100}%`,
    left: `${(left / screenWidth) * 100}%`,
    width: `${(width / screenWidth) * 100}%`,
    height: `${(height / screenHeight) * 100}%`,
  } as React.CSSProperties

  return (
    <div
      className={cn(
        'relative box-border w-full overflow-hidden',
        // isLight ? 'border-gray-200 bg-gray-100' : 'border-gray-700 bg-gray-800',
      )}
      style={{ aspectRatio }}
    >
      <div
        className={cn(
          'absolute inset-0 rounded-md border-2 bg-gradient-to-br',
          isLight
            ? 'border-gray-200 from-gray-50 to-gray-200'
            : 'border-gray-700 from-gray-700 to-gray-900',
        )}
      />
      <div
        className={cn(
          'absolute rounded-md border-2',
          isLight
            ? 'border-blue-500 bg-blue-200/40'
            : 'border-blue-400 bg-blue-500/20',
        )}
        style={positionStyles}
      />
      {/* <div
        className={cn(
          'pointer-events-none absolute inset-0 border-2',
          isLight ? 'border-gray-300/40' : 'border-gray-600/40',
        )}
      /> */}
    </div>
  )
}
