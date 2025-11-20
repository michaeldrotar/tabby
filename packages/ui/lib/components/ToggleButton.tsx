import { cn } from '@/lib/utils'
import { exampleThemeStorage } from '@extension/storage'
import type { ComponentPropsWithoutRef } from 'react'

type ToggleButtonProps = ComponentPropsWithoutRef<'button'>

export const ToggleButton = ({
  className,
  children,
  ...props
}: ToggleButtonProps) => {
  return (
    <button
      className={cn(
        'mt-4 rounded border-2 px-4 py-1 font-bold shadow hover:scale-105',
        'border-black bg-white text-black',
        'dark:border-white dark:bg-black dark:text-white',
        className,
      )}
      onClick={exampleThemeStorage.toggle}
      {...props}
    >
      {children}
    </button>
  )
}
