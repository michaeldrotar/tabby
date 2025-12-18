import { cn } from './utils/cn'
import type { LucideProps } from 'lucide-react'

export {
  ArrowBigUp as ShiftIcon,
  Check as CheckIcon,
  ChevronDown as ChevronDownIcon,
  ChevronUp as ChevronUpIcon,
  Command as CmdIcon,
  ExternalLink as ExternalLinkIcon,
  LayoutGrid as LayoutGridIcon,
  Moon as MoonIcon,
  Option as OptionIcon,
  PanelLeftClose as PanelLeftCloseIcon,
  PanelLeftOpen as PanelLeftOpenIcon,
  Plus as PlusIcon,
  Search as SearchIcon,
  Settings as SettingsIcon,
  Sun as SunIcon,
  TriangleAlert as WarningIcon,
  X as CloseIcon,
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
