import { cn } from '@extension/ui'
import type { BrowserWindow } from '@extension/chrome'

export type WindowThumbnailProps = {
  browserWindow: BrowserWindow
}

export const WindowThumbnail = ({ browserWindow }: WindowThumbnailProps) => {
  console.count('WindowThumbnail.render')

  const screenHeight = screen.height
  const screenWidth = screen.width
  const aspectRatio = screenWidth / screenHeight

  const top = browserWindow.top || 0
  const left = browserWindow.left || 0
  const width = browserWindow.width || screenWidth - left
  const height = browserWindow.height || screenHeight - top

  const positionStyles = {
    top: `${(top / screenHeight) * 100}%`,
    left: `${(left / screenWidth) * 100}%`,
    width: `${(width / screenWidth) * 100}%`,
    height: `${(height / screenHeight) * 100}%`,
  } as React.CSSProperties

  return (
    <div
      className={cn('relative box-border w-full overflow-hidden')}
      style={{ aspectRatio }}
    >
      <div
        className={cn(
          'absolute inset-0 rounded-md border-2 bg-gradient-to-br',
          'border-stone-200 from-stone-50 to-stone-200',
          'dark:border-slate-700 dark:from-slate-700 dark:to-slate-900',
        )}
      />
      <div
        className={cn(
          'absolute rounded-md border-2',
          'border-red-500 bg-red-200/40',
          'dark:border-red-400 dark:bg-red-500/20',
        )}
        style={positionStyles}
      />
    </div>
  )
}
