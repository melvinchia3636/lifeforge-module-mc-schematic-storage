import { prop } from './geometry'
import type { BlockProps, Box, ResolverOutput } from '../types'

export default function hopper(
  name: string,
  props: BlockProps
): ResolverOutput {
  const n = name.split(':').pop() ?? name

  if (n === 'hopper') {
    const facing = prop(props, 'facing', 'down')
    const bowl: Box[] = [
      // vanilla `block/hopper`: open rim and funnel floor
      [0, 10 / 16, 0, 1, 11 / 16, 1],
      [0, 11 / 16, 0, 2 / 16, 1, 1],
      [14 / 16, 11 / 16, 0, 1, 1, 1],
      [2 / 16, 11 / 16, 0, 14 / 16, 1, 2 / 16],
      [2 / 16, 11 / 16, 14 / 16, 14 / 16, 1, 1],
      [4 / 16, 4 / 16, 4 / 16, 12 / 16, 10 / 16, 12 / 16]
    ]

    if (facing === 'down') {
      return [...bowl, [6 / 16, 0, 6 / 16, 10 / 16, 4 / 16, 10 / 16]]
    }

    // `block/hopper_side` points north; blockstate y rotates it to the facing
    const yawByFacing: Record<string, number> = {
      north: 0,
      east: 90,
      south: 180,
      west: 270
    }
    const yaw = yawByFacing[facing]

    return yaw === undefined
      ? [...bowl, [6 / 16, 0, 6 / 16, 10 / 16, 4 / 16, 10 / 16]]
      : {
          boxes: [...bowl, [6 / 16, 4 / 16, 0, 10 / 16, 8 / 16, 4 / 16]],
          yaw
        }
  }

  return null
}
