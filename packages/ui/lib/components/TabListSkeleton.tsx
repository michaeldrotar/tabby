import { Skeleton } from './Skeleton'

export type TabListSkeletonProps = {
  /** Number of skeleton rows to display */
  count?: number
}

/**
 * Skeleton loading state for tab lists.
 * Mimics the layout of TabItemRow for a seamless visual transition.
 */
export const TabListSkeleton = ({ count = 8 }: TabListSkeletonProps) => {
  return (
    <div className="flex flex-col gap-0.5 p-1">
      {Array.from({ length: count }).map((_, i) => (
        <TabItemSkeleton key={i} />
      ))}
    </div>
  )
}

const TabItemSkeleton = () => {
  return (
    <div className="flex h-8 items-center gap-2 rounded px-2">
      {/* Favicon placeholder */}
      <Skeleton className="size-4 shrink-0 rounded" />
      {/* Title placeholder - variable width for natural look */}
      <Skeleton className="h-3.5 flex-1" />
      {/* Close button placeholder */}
      <Skeleton className="size-4 shrink-0 rounded" />
    </div>
  )
}
