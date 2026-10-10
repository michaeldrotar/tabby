export const createSystemThemeResource = (
  media: Pick<
    MediaQueryList,
    'matches' | 'addEventListener' | 'removeEventListener'
  >,
) => ({
  getSnapshot: (): 'light' | 'dark' => (media.matches ? 'dark' : 'light'),
  getServerSnapshot: (): 'light' => 'light',
  subscribe: (listener: () => void) => {
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  },
})
