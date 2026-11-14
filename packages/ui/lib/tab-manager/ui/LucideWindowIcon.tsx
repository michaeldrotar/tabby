import { WINDOW_ICON_COMPONENTS } from '@extension/core/windowIcons'
import { icons, Monitor } from 'lucide-react'

const LucideWindowIcon = ({
  icon,
  size,
  className,
}: {
  icon: string
  size: number
  className: string
}) => {
  const Icon =
    icons[WINDOW_ICON_COMPONENTS[icon] as keyof typeof icons] ?? Monitor
  return <Icon size={size} className={className} aria-hidden="true" />
}
export default LucideWindowIcon
