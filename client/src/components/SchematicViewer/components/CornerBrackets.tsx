import { Box } from '@lifeforge/ui'

const CORNERS = [
  {
    border: 'borderLeft,borderTop',
    bottom: undefined,
    left: '0.75rem',
    right: undefined,
    top: '0.75rem'
  },
  {
    border: 'borderRight,borderTop',
    bottom: undefined,
    left: undefined,
    right: '0.75rem',
    top: '0.75rem'
  },
  {
    border: 'borderBottom,borderLeft',
    bottom: '0.75rem',
    left: '0.75rem',
    right: undefined,
    top: undefined
  },
  {
    border: 'borderBottom,borderRight',
    bottom: '0.75rem',
    left: undefined,
    right: '0.75rem',
    top: undefined
  }
] as const

const BORDER_COLOR =
  '1.5px solid color-mix(in srgb, var(--color-custom-500) 60%, transparent)'

export function CornerBrackets() {
  return (
    <>
      {CORNERS.map(corner => (
        <Box
          key={`${corner.top}-${corner.left}-${corner.bottom}-${corner.right}`}
          bottom={corner.bottom}
          height="0.9rem"
          left={corner.left}
          position="absolute"
          right={corner.right}
          style={{
            borderBottom: corner.border.includes('borderBottom')
              ? BORDER_COLOR
              : undefined,
            borderLeft: corner.border.includes('borderLeft')
              ? BORDER_COLOR
              : undefined,
            borderRight: corner.border.includes('borderRight')
              ? BORDER_COLOR
              : undefined,
            borderTop: corner.border.includes('borderTop')
              ? BORDER_COLOR
              : undefined,
            pointerEvents: 'none'
          }}
          top={corner.top}
          width="0.9rem"
          zIndex="2"
        />
      ))}
    </>
  )
}
