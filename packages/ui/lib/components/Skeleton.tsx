import { cn } from '../utils/cn'

export type SkeletonProps = React.HTMLAttributes<HTMLDivElement>

/**
 * A skeleton loading placeholder with animated pulse effect.
 * Use to indicate content is loading.
 */
export const Skeleton = ({ className, ...props }: SkeletonProps) => {
  return (
    <div
      className={cn('bg-muted animate-pulse rounded-md', className)}
      {...props}
    />
  )
}
