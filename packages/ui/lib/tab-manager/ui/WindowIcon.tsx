import {
  getWindowIconKind,
  getWindowIconValue,
} from '@extension/core/windowIconChoice'
import {
  BookOpen,
  Briefcase,
  Code,
  Coffee,
  FlaskConical,
  Globe,
  Heart,
  ImagePlus,
  Monitor,
  Music,
  Palette,
} from 'lucide-react'
import { lazy, Suspense } from 'react'
import { getGroupColorClasses } from '../../tab-group/tabGroupColors'
import { cn } from '../../utils/cn'
import type { BrowserTabGroupColor } from '@extension/core'

const icons = {
  window: Monitor,
  briefcase: Briefcase,
  code: Code,
  book: BookOpen,
  flask: FlaskConical,
  palette: Palette,
  music: Music,
  coffee: Coffee,
  heart: Heart,
  globe: Globe,
}
const LucideWindowIcon = lazy(() => import('./LucideWindowIcon'))

export const WindowIcon = ({
  icon,
  iconUrl,
  size = 20,
  color = 'blue',
}: {
  icon?: string
  iconUrl?: string
  color?: BrowserTabGroupColor
  size?: number
}) => {
  const kind = getWindowIconKind(icon)
  const value = icon ? getWindowIconValue(icon) : ''
  if (kind === 'emoji' || kind === 'monogram')
    return (
      <span
        aria-hidden="true"
        className={cn(
          'flex shrink-0 items-center justify-center leading-none font-semibold',
          kind === 'monogram' && getGroupColorClasses(color).text,
        )}
        style={{
          width: size,
          height: size,
          fontSize: kind === 'monogram' ? size * 0.65 : size,
        }}
      >
        {value}
      </span>
    )
  if (icon === 'upload:empty')
    return (
      <ImagePlus
        size={size}
        aria-hidden="true"
        className="shrink-0 text-muted"
      />
    )
  if (!icon || icon === 'favicon:auto')
    return iconUrl ? (
      <img
        src={iconUrl}
        width={size}
        height={size}
        alt=""
        className="shrink-0 rounded-sm object-contain"
      />
    ) : (
      <Monitor
        size={size}
        aria-hidden="true"
        className={cn('shrink-0', getGroupColorClasses(color).text)}
      />
    )
  if (kind === 'upload' || kind === 'favicon')
    return (
      <img
        src={value}
        width={size}
        height={size}
        alt=""
        className="shrink-0 rounded-sm object-contain"
      />
    )
  const Icon = icons[icon as keyof typeof icons]
  return (
    <Suspense fallback={<Monitor size={size} aria-hidden="true" />}>
      {Icon ? (
        <Icon
          size={size}
          aria-hidden="true"
          className={cn('shrink-0', getGroupColorClasses(color).text)}
        />
      ) : (
        <LucideWindowIcon
          icon={icon ?? 'window'}
          size={size}
          className={cn('shrink-0', getGroupColorClasses(color).text)}
        />
      )}
    </Suspense>
  )
}
