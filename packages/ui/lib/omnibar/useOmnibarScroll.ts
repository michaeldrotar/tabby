import { useEffect, useRef } from 'react'

export const useOmnibarScroll = (selectedIndex: number) => {
  const selectedItemRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    selectedItemRef.current?.scrollIntoView({
      block: 'nearest',
    })
  }, [selectedIndex])

  return selectedItemRef
}
