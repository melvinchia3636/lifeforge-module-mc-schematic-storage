import type { BlockProps, ResolverOutput } from '../../types'
import { nameOf } from './shared'

/** Daylight detector: 6px slab. */
export default function daylightDetector(
  name: string,
  _props: BlockProps
): ResolverOutput {
  const n = nameOf(name)

  if (n !== 'daylight_detector' && n !== 'daylight_detector_inverted') {
    return null
  }

  return [[0, 0, 0, 1, 6 / 16, 1]]
}
