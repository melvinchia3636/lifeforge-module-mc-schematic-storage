import type { SchematicEntry } from '@'

import { forgeAPI } from '@/manifest'

const SIZE = 384
const PADDING = 24

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()

    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Failed to decode the render'))
    image.src = src
  })
}

/** Download the stored SVG preview as a 384px themed PNG. */
export async function downloadSchematicRender(
  entry: SchematicEntry,
  {
    background,
    lineColor
  }: {
    background: string
    lineColor: string
  }
): Promise<void> {
  const response = await fetch(forgeAPI.getMedia({ key: entry.preview }))

  if (!response.ok) {
    throw new Error('Failed to load the schematic render')
  }

  const svg = (await response.text()).replace(
    /stroke="#000"/g,
    `stroke="${lineColor}"`
  )
  const svgUrl = URL.createObjectURL(
    new Blob([svg], { type: 'image/svg+xml' })
  )

  try {
    const image = await loadImage(svgUrl)
    const canvas = document.createElement('canvas')

    canvas.width = SIZE
    canvas.height = SIZE

    const context = canvas.getContext('2d')

    if (!context) {
      throw new Error('Failed to create the image canvas')
    }

    context.fillStyle = background
    context.fillRect(0, 0, SIZE, SIZE)

    const available = SIZE - PADDING * 2
    const scale = Math.min(
      available / image.naturalWidth,
      available / image.naturalHeight
    )
    const width = image.naturalWidth * scale
    const height = image.naturalHeight * scale

    context.drawImage(
      image,
      (SIZE - width) / 2,
      (SIZE - height) / 2,
      width,
      height
    )

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        result =>
          result
            ? resolve(result)
            : reject(new Error('Failed to encode the render')),
        'image/png'
      )
    })

    const downloadUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = downloadUrl
    link.download = `${entry.name.replace(/[\\/:*?"<>|]/g, '-')}.png`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(downloadUrl)
  } finally {
    URL.revokeObjectURL(svgUrl)
  }
}
