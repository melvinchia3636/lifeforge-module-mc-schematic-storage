import { TURN_STD, boxPx, prop, rotY } from './geometry'
import type { BlockProps, Box, ResolverOutput } from '../types'

const STANDING: Box[] = [
  [7.33333, 0, 7.33333, 8.66667, 9.33333, 8.66667],
  [0, 9.33333, 7.33333, 16, 17.33333, 8.66667]
]
const WALL: Box[] = [[0, 4.33333, 0.33333, 16, 12.33333, 1.66667]]
const HANGING: Box[] = [
  [1, 0, 7, 15, 10, 9],
  [2.96447, 10, 4.46447, 5.96447, 16, 4.46447],
  [2.96447, 11, 11.53553, 5.96447, 15, 11.53553],
  [10.03553, 10, 11.53553, 13.03553, 16, 11.53553],
  [10.03553, 11, 4.46447, 13.03553, 15, 4.46447]
]
const WALL_HANGING: Box[] = [
  [1, 0, 7, 15, 10, 9],
  [0, 14, 6, 16, 16, 10],
  [1.5, 10, 8, 4.5, 12, 8],
  [1.5, 11, 8, 4.5, 14, 8],
  [11.5, 10, 8, 14.5, 12, 8],
  [11.5, 11, 8, 14.5, 14, 8]
]

export default function sign(
  name: string,
  props: BlockProps
): ResolverOutput {
  const n = name.split(':').pop() ?? name

  if (!(n.endsWith('_sign') || n.endsWith('_wall_sign'))) {
    return null
  }

  let px: Box[]
  let turns = 0
  let yaw = 0

  if (n.endsWith('_wall_hanging_sign')) {
    px = WALL_HANGING
    turns = ((TURN_STD[prop(props, 'facing', 'south')] ?? 180) + 180) % 360
  } else if (n.endsWith('_hanging_sign')) {
    px = HANGING
    yaw = parseInt(prop(props, 'rotation', '0'), 10) * 22.5
  } else if (n.endsWith('_wall_sign')) {
    px = WALL
    turns = ((TURN_STD[prop(props, 'facing', 'south')] ?? 180) + 180) % 360
  } else {
    px = STANDING
    yaw = parseInt(prop(props, 'rotation', '0'), 10) * 22.5
  }

  const boxes = px.map(([x0, y0, z0, x1, y1, z1]) => {
    let nx0 = x0
    let ny0 = y0
    let nz0 = z0
    let nx1 = x1
    let ny1 = y1
    let nz1 = z1

    if (nx1 - nx0 < 1e-6) {
      nx0 -= 0.5
      nx1 += 0.5
    }

    if (ny1 - ny0 < 1e-6) {
      ny0 -= 0.5
      ny1 += 0.5
    }

    if (nz1 - nz0 < 1e-6) {
      nz0 -= 0.5
      nz1 += 0.5
    }

    return rotY(boxPx(nx0, ny0, nz0, nx1, ny1, nz1), turns)
  })

  return { boxes, yaw }
}
