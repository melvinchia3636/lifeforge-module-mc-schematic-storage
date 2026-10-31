import { boxPx, prop, rotY } from './geometry'
import type { BlockProps, Box, ResolverOutput } from '../types'

const SIDES: Record<string, number> = {
  north: 0,
  east: 90,
  south: 180,
  west: 270
}

export default function wall(
  name: string,
  props: BlockProps
): ResolverOutput {
  const n = name.split(':').pop() ?? name

  if (!(n.endsWith('_wall') || n === 'wall')) {
    return null
  }

  const boxes: Box[] = []

  if (prop(props, 'up', 'true') !== 'false') {
    boxes.push(boxPx(4, 0, 4, 12, 16, 12))
  }

  for (const [d, turns] of Object.entries(SIDES)) {
    const state = prop(props, d, 'none')

    if (state === 'none') {
      continue
    }

    boxes.push(
      rotY(boxPx(5, 0, 0, 11, state === 'tall' ? 16 : 14, 8), turns)
    )
  }

  return boxes
}
