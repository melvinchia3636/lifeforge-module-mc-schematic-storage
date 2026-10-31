import { TURN_STD, boxPx, prop } from './geometry'
import type { BlockProps, ResolverOutput } from '../types'

export default function banner(
  name: string,
  props: BlockProps
): ResolverOutput {
  const n = name.split(':').pop() ?? name

  if (!n.endsWith('_banner')) {
    return null
  }

  if (n.endsWith('_wall_banner')) {
    return {
      boxes: [
        boxPx(1.33333, 12, 14.33333, 14.66667, 13.33333, 15.66667),
        boxPx(1.33333, -13.33333, 13.66667, 14.66667, 13.33333, 14.33333)
      ],
      yaw: TURN_STD[prop(props, 'facing', 'north')] ?? 0
    }
  }

  const rotation = Number.parseInt(prop(props, 'rotation', '0'), 10) || 0

  return {
    boxes: [
      boxPx(1.33333, 28, 7.33333, 14.66667, 29.33333, 8.66667),
      boxPx(7.33333, 0, 7.33333, 8.66667, 28, 8.66667),
      boxPx(1.33333, 2.66667, 6.66667, 14.66667, 29.33333, 7.33333)
    ],
    yaw: 180 + (((rotation % 16) + 16) % 16) * 22.5
  }
}
