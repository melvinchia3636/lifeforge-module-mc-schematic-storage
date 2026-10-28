import type { RefObject } from 'react'

import { TagChip, Text, usePersonalization } from '@lifeforge/ui'

export function ViewerHud({
  hint,
  yawLabelRef,
  zoomLabelRef
}: {
  hint: string
  yawLabelRef: RefObject<HTMLElement | null>
  zoomLabelRef: RefObject<HTMLElement | null>
}) {
  const { derivedThemeColor } = usePersonalization()

  const chips = [
    {
      icon: 'tabler:cube',
      key: 'rotation',
      label: '360°',
      left: '1.5rem',
      top: '1.5rem'
    },
    {
      icon: 'tabler:compass',
      key: 'angle',
      label: (
        <Text ref={yawLabelRef} size="sm" weight="medium">
          45°
        </Text>
      ),
      right: '1.5rem',
      top: '1.5rem'
    },
    {
      bottom: '1.5rem',
      icon: 'tabler:hand-move',
      key: 'hint',
      label: hint,
      left: '1.5rem'
    },
    {
      bottom: '1.5rem',
      icon: 'tabler:zoom-in',
      key: 'zoom',
      label: (
        <Text ref={zoomLabelRef} size="sm" weight="medium">
          100%
        </Text>
      ),
      right: '1.5rem'
    }
  ]

  return (
    <>
      {chips.map(({ key, ...chip }) => (
        <TagChip
          key={key}
          as="div"
          color={derivedThemeColor}
          position="absolute"
          size="sm"
          style={{
            pointerEvents: 'none'
          }}
          variant="outlined"
          zIndex="3"
          {...chip}
        />
      ))}
    </>
  )
}
