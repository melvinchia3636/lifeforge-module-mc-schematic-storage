import { prop } from './geometry'
import type { BlockProps, BoxEntry, ResolverOutput, Vec3 } from '../types'

export default function lantern(
  name: string,
  props: BlockProps
): ResolverOutput {
  const n = name.split(':').pop() ?? name

  if (
    (n === 'lantern' || n.endsWith('_lantern')) &&
    n !== 'jack_o_lantern' &&
    n !== 'sea_lantern'
  ) {
    const hanging = prop(props, 'hanging', 'false') === 'true'
    const tilt = {
      axis: 'y' as const,
      angle: 45,
      origin: [0.5, 0.5, 0.5] as Vec3
    }

    const boxes: BoxEntry[] = hanging
      ? [
          [5 / 16, 1 / 16, 5 / 16, 11 / 16, 8 / 16, 11 / 16],
          [6 / 16, 8 / 16, 6 / 16, 10 / 16, 10 / 16, 10 / 16],
          {
            box: [6.5 / 16, 11 / 16, 8 / 16, 9.5 / 16, 15 / 16, 8 / 16],
            tilt
          },
          {
            box: [8 / 16, 10 / 16, 6.5 / 16, 8 / 16, 1, 9.5 / 16],
            tilt
          }
        ]
      : [
          [5 / 16, 0, 5 / 16, 11 / 16, 7 / 16, 11 / 16],
          [6 / 16, 7 / 16, 6 / 16, 10 / 16, 9 / 16, 10 / 16],
          {
            box: [6.5 / 16, 9 / 16, 8 / 16, 9.5 / 16, 11 / 16, 8 / 16],
            tilt
          },
          {
            box: [8 / 16, 9 / 16, 6.5 / 16, 8 / 16, 11 / 16, 9.5 / 16],
            tilt
          }
        ]

    return { boxes, yaw: 0 }
  }

  return null
}
