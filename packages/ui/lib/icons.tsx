import { cn } from './utils/cn'
import type { LucideProps } from 'lucide-react'

export {
  Check as CheckIcon,
  X as CloseIcon,
  Search as SearchIcon,
  Settings as SettingsIcon,
  Moon as MoonIcon,
  Sun as SunIcon,
  Plus as PlusIcon,
  PanelLeftClose as PanelLeftCloseIcon,
  PanelLeftOpen as PanelLeftOpenIcon,
  ExternalLink as ExternalLinkIcon,
  LayoutGrid as LayoutGridIcon,
  TriangleAlert as WarningIcon,
  ChevronDown as ChevronDownIcon,
  ChevronUp as ChevronUpIcon,
} from 'lucide-react'

export const ScrollToActiveIcon = ({ className, ...props }: LucideProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn('lucide lucide-scroll-to-active', className)}
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
  </svg>
)
