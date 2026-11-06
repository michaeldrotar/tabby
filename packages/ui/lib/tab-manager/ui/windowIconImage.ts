/** Store a local thumbnail so a window icon outlives its source tab or file. */
export const windowIconImage = async (source: File | string) => {
  if (typeof source !== 'string' && source.size > 5 * 1024 * 1024)
    throw new Error('Choose an image smaller than 5 MB.')
  const url = typeof source === 'string' ? source : URL.createObjectURL(source)
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 64
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Could not prepare this image.')
    const ratio = Math.min(64 / image.naturalWidth, 64 / image.naturalHeight)
    const width = image.naturalWidth * ratio
    const height = image.naturalHeight * ratio
    context.drawImage(image, (64 - width) / 2, (64 - height) / 2, width, height)
    return canvas.toDataURL('image/png')
  } finally {
    if (typeof source !== 'string') URL.revokeObjectURL(url)
  }
}
