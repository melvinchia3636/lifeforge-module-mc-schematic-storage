import { boxPx, prop } from '../geometry'
import type { BlockProps, Box, ResolverOutput, ShapeBox } from '../../types'
import { nameOf } from './shared'

const CURVE_YAW: Record<string, number> = {
  south_east: 0,
  south_west: 90,
  north_west: 180,
  north_east: 270
}

const RAIL_HALF = 1 / 16
const RAIL_Y0 = 1 / 16
const RAIL_Y1 = 2 / 16

/** Two metal strips on four sleepers, running north-south. */
function straightTrack(): Box[] {
  const boxes: Box[] = []

  for (const z0 of [0, 5, 9, 14]) {
    boxes.push(boxPx(0, 0, z0, 16, 1, z0 + 2))
  }

  boxes.push(boxPx(2, 1, 0, 4, 2, 16))
  boxes.push(boxPx(12, 1, 0, 14, 2, 16))

  return boxes
}

/** Chamfered quarter turn from south to east, with two sleepers. */
function curvedTrack(): ShapeBox[] {
  const boxes: ShapeBox[] = []
  const railCenters = [3 / 16, 13 / 16]

  for (const x of railCenters) {
    boxes.push({
      box: [x - RAIL_HALF, RAIL_Y0, 0.5, x + RAIL_HALF, RAIL_Y1, 1]
    })
  }

  for (const z of railCenters) {
    boxes.push({
      box: [0.5, RAIL_Y0, z - RAIL_HALF, 1, RAIL_Y1, z + RAIL_HALF]
    })
  }

  for (const [cx, cz] of [
    [0.34375, 0.34375],
    [0.65625, 0.65625]
  ] as const) {
    boxes.push({
      box: [
        cx - 0.22097,
        RAIL_Y0,
        cz - RAIL_HALF,
        cx + 0.22097,
        RAIL_Y1,
        cz + RAIL_HALF
      ],
      tilt: { axis: 'y', angle: -45, origin: [cx, 0.5, cz] }
    })
  }

  boxes.push({ box: [2 / 16, 0, 14 / 16, 14 / 16, 1 / 16, 1] })
  boxes.push({ box: [14 / 16, 0, 2 / 16, 1, 1 / 16, 14 / 16] })

  return boxes
}

/** Rails: detailed track geometry with curves and slopes. */
export default function rail(name: string, props: BlockProps): ResolverOutput {
  const n = nameOf(name)

  if (!(n === 'rail' || n.endsWith('_rail'))) {
    return null
  }

  const shape = prop(props, 'shape', 'north_south')

  if (shape === 'north_south' || shape === 'east_west') {
    return {
      boxes: straightTrack(),
      yaw: shape === 'east_west' ? 90 : 0
    }
  }

  if (shape.startsWith('ascending_')) {
    const direction = shape.slice('ascending_'.length)
    const sign = direction === 'north' || direction === 'east' ? 1 : -1

    return {
      boxes: straightTrack().map<ShapeBox>(box => ({
        box: [box[0], box[1] + 0.5, box[2], box[3], box[4] + 0.5, box[5]],
        tilt: { axis: 'x', angle: sign * 45, origin: [0.5, 0.5, 0.5] }
      })),
      yaw: direction === 'east' || direction === 'west' ? 90 : 0
    }
  }

  if (shape in CURVE_YAW) {
    return {
      boxes: curvedTrack(),
      yaw: CURVE_YAW[shape] ?? 0
    }
  }

  return {
    boxes: straightTrack(),
    yaw: 0
  }
}
