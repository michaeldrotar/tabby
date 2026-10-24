import { expect, test } from '@playwright/test'
import type { Locator } from '@playwright/test'

const renderFaces = (faces: Locator, points: [number, number][]) =>
  faces.evaluateAll(async (elements, points) => {
    const image = elements[0]!.querySelector('image')!
    const blob = await (await fetch(image.href.baseVal)).blob()
    const source = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.readAsDataURL(blob)
    })
    const pixels = await Promise.all(
      elements.map(async (element) => {
        const svg = element.cloneNode(true) as SVGSVGElement
        svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
        svg.setAttribute('width', '128')
        svg.setAttribute('height', '128')
        svg.querySelector('image')!.setAttribute('href', source)
        const originals = element.querySelectorAll('*')
        svg.querySelectorAll<SVGElement>('*').forEach((node, index) => {
          const style = getComputedStyle(originals[index]!)
          for (const property of [
            'opacity',
            'transform',
            'transform-origin',
            'transform-box',
            'r',
            'ry',
            'cy',
          ])
            node.style.setProperty(property, style.getPropertyValue(property))
        })
        const rendered = new Image()
        rendered.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(svg))}`
        await rendered.decode()
        const canvas = document.createElement('canvas')
        canvas.width = canvas.height = 128
        const context = canvas.getContext('2d')!
        context.drawImage(rendered, 0, 0)
        return context.getImageData(0, 0, 128, 128).data
      }),
    )
    return {
      differences: pixels
        .slice(1)
        .map(
          (face) =>
            face.filter((value, index) => value !== pixels[0]![index]).length,
        ),
      samples: pixels.map((face) =>
        points.map(([x, y]) => {
          const offset = (y * 128 + x) * 4
          return Array.from(face.slice(offset, offset + 4))
        }),
      ),
    }
  }, points)

test('all four cats share the same resting face with smooth eye surrounds', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('./')
  const faces = page.locator(
    '.brand > svg, .banner-cat > svg, .closing-cat > svg, .footer-cat > svg',
  )
  await expect(faces).toHaveCount(4)
  const artwork = await renderFaces(faces, [
    [40, 58],
    [90, 58],
  ])
  expect(artwork.differences).toEqual([0, 0, 0])
  expect(artwork.samples[0]).toEqual([
    [253, 150, 48, 255],
    [253, 150, 48, 255],
  ])
})

test('surprise eyes cover the resting pupils throughout the transition', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('./')
  const cat = page.locator('.banner-cat')
  await cat.evaluate((element) => {
    const cat = element as HTMLElement
    cat.dataset.surprised = 'true'
    cat.style.setProperty('--cat-wide', '0.5')
  })
  const artwork = await renderFaces(cat.locator('svg'), [
    [28, 75],
    [78, 75],
    [39, 77],
  ])
  expect(artwork.samples[0]).toEqual([
    [255, 245, 228, 255],
    [255, 245, 228, 255],
    [3, 26, 57, 255],
  ])
})
