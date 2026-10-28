import { prop } from '../geometry'
import type { BlockProps, ResolverOutput, ShapeBox, Vec3 } from '../types'

export default function decoration(
  name: string,
  props: BlockProps
): ResolverOutput {
  const n = name.split(':').pop() ?? name

  if (n.endsWith('_carpet') || n === 'carpet' || n === 'moss_carpet') {
    return [[0, 0, 0, 1, 0.0625, 1]]
  }

  if (n.endsWith('_pressure_plate') || n === 'pressure_plate') {
    return [[0.0625, 0, 0.0625, 0.9375, 0.0625, 0.9375]]
  }

  if (n === 'snow') {
    const layers = parseInt(prop(props, 'layers', '1'), 10)

    return [[0, 0, 0, 1, Math.min(1, layers / 8), 1]]
  }

  if (['chest', 'trapped_chest', 'ender_chest', 'barrel'].includes(n)) {
    return [[0.0625, 0, 0.0625, 0.9375, 0.875, 0.9375]]
  }

  if (n === 'hopper') {
    return [
      [0, 0.375, 0, 1, 0.6875, 1],
      [0.1875, 0.6875, 0.1875, 0.8125, 1, 0.8125]
    ]
  }

  if (n.endsWith('_bed') || n === 'bed') {
    return [[0, 0, 0, 1, 0.5625, 1]]
  }

  if (n.endsWith('chain')) {
    // chain, iron_chain, copper_chain, waxed_*...
    // vanilla `template_chain`: two zero-thickness 3px planes crossed at 45°
    // about Y, so the column reads as a chain rather than a solid post
    const tilt = {
      axis: 'y' as const,
      angle: 45,
      origin: [0.5, 0.5, 0.5] as Vec3
    }
    const boxes: ShapeBox[] = [
      { box: [6.5 / 16, 0, 8 / 16, 9.5 / 16, 1, 8 / 16], tilt },
      { box: [8 / 16, 0, 6.5 / 16, 8 / 16, 1, 9.5 / 16], tilt }
    ]
    const axis = prop(props, 'axis', 'y')

    if (axis === 'y') {
      return { boxes, yaw: 0, flipX: 0 }
    }

    if (axis === 'z') {
      return { boxes, yaw: 0, flipX: 90 }
    }

    return { boxes, yaw: 90, flipX: 90 } // axis=x (vanilla x=90, y=90)
  }

  return null
}
