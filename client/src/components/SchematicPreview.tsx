import type { SchematicEntry } from '@'

import { Box, Flex, Icon, surface } from '@lifeforge/ui'

import { forgeAPI } from '@/manifest'
import { DEFAULT_FORMAT, FORMAT_META } from '@/utils/formatMeta'

/**
 * The stored preview is a transparent SVG containing only black strokes.
 * Rendering it as an alpha mask lets the theme decide both the line colour
 * (the mask layer's background) and the surrounding surface, which an <img>
 * pointing at the SVG file cannot do.
 */
export function SchematicPreviewFrame({
  previewUrl,
  label,
  fallbackIcon
}: {
  previewUrl: string | null
  label?: string
  fallbackIcon?: string
}) {
  return (
    <Box
      aspectRatio="1"
      bg={surface.light}
      height="100%"
      overflow="hidden"
      r="md"
      width="100%"
    >
      {previewUrl ? (
        <Box
          aria-label={label}
          bg="primary"
          height="100%"
          role="img"
          style={{
            WebkitMaskImage: `url("${previewUrl}")`,
            WebkitMaskPosition: 'center',
            WebkitMaskRepeat: 'no-repeat',
            WebkitMaskSize: 'contain',
            maskImage: `url("${previewUrl}")`,
            maskMode: 'alpha',
            maskPosition: 'center',
            maskRepeat: 'no-repeat',
            maskSize: 'contain'
          }}
          width="100%"
        />
      ) : (
        <Flex align="center" height="100%" justify="center" width="100%">
          <Icon
            color="primary"
            icon={fallbackIcon ?? 'ph:blueprint-bold'}
            size="2em"
          />
        </Flex>
      )}
    </Box>
  )
}

export function SchematicPreview({ entry }: { entry: SchematicEntry }) {
  const format = FORMAT_META[entry.format] ?? DEFAULT_FORMAT
  const previewUrl = entry.preview
    ? `${forgeAPI.getMedia({ key: entry.preview })}`
    : null

  return (
    <SchematicPreviewFrame
      fallbackIcon={format.icon}
      label={entry.name}
      previewUrl={previewUrl}
    />
  )
}
