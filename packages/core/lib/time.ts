export const formatTimeAgo = (
  timestamp: number | undefined,
  now: number,
  minutePrecision = false,
) => {
  if (timestamp === undefined) return undefined
  const seconds = Math.max(
    minutePrecision ? 60 : 0,
    Math.floor((now - timestamp) / 1000),
  )
  if (seconds < 60) return seconds < 1 ? 'just now' : `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d`
  const months = Math.floor(days / 30)
  return months < 12 ? `${months}mo` : `${Math.floor(days / 365)}y`
}
