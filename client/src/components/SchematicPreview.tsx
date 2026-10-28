import type { SchematicEntry } from '@'

import { Box, Flex, Icon, surface, useModalStore } from '@lifeforge/ui'

import { SchematicViewerModal } from '@/components/modals/SchematicViewerModal'
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
  fallbackIcon,
  fill = false
}: {
  previewUrl: string | null
  label?: string
  fallbackIcon?: string
  fill?: boolean
}) {
  return (
    <Box
      aspectRatio="1"
      bg={surface.light}
      height="100%"
      overflow="hidden"
      r="md"
      width={fill ? 'auto' : '100%'}
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

export function SchematicPreview({
  entry,
  fill = false
}: {
  entry: SchematicEntry
  fill?: boolean
}) {
  const { open } = useModalStore()

  const format = FORMAT_META[entry.format] ?? DEFAULT_FORMAT
  const previewUrl = entry.preview
    ? `${forgeAPI.getMedia({ key: entry.preview })}`
    : null

  const openViewer = () => {
    open(SchematicViewerModal, { entry })
  }

  return (
    <Box
      aria-label={entry.name}
      height={fill ? '100%' : undefined}
      role="button"
      style={{ cursor: 'pointer' }}
      tabIndex={0}
      width={fill ? 'auto' : undefined}
      onClick={openViewer}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          openViewer()
        }
      }}
    >
      <SchematicPreviewFrame
        fallbackIcon={format.icon}
        fill={fill}
        label={entry.name}
        previewUrl={previewUrl}
      />
    </Box>
  )
}
