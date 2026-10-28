import { Box } from '@lifeforge/ui'

/**
 * Decorative layers behind the 3D canvas: a fading blueprint grid, a theme
 * glow, and a soft vignette.
 */
export function StageBackdrop() {
  return (
    <>
      <Box
        inset="0"
        position="absolute"
        style={{
          backgroundImage:
            'linear-gradient(color-mix(in srgb, var(--color-custom-500) 9%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--color-custom-500) 9%, transparent) 1px, transparent 1px)',
          backgroundSize: '26px 26px',
          maskImage:
            'radial-gradient(circle at 50% 50%, black 35%, transparent 78%)',
          pointerEvents: 'none',
          WebkitMaskImage:
            'radial-gradient(circle at 50% 50%, black 35%, transparent 78%)'
        }}
      />
      <Box
        inset="0"
        position="absolute"
        style={{
          background:
            'radial-gradient(circle at 50% 45%, color-mix(in srgb, var(--color-custom-500) 18%, transparent) 0%, transparent 62%)',
          pointerEvents: 'none'
        }}
      />
    </>
  )
}
