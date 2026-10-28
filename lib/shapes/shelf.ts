import { TURN_STD, prop, rotY } from '../geometry'
import type { BlockProps, Box, ResolverOutput } from '../types'

export default function shelf(
  name: string,
  props: BlockProps
): ResolverOutput {
  const n = name.split(':').pop() ?? name

  if (!(n.endsWith('_shelf') && !n.includes('bookshelf'))) {
    return null
  }

  const turns = TURN_STD[prop(props, 'facing', 'north')] ?? 0
  const boxes: Box[] = [
    [0, 0, 0.8125, 1, 1, 1],
    [0, 0, 0.6875, 1, 0.25, 0.8125],
    [0, 0.75, 0.6875, 1, 1, 0.8125]
  ]

  return boxes.map(b => rotY(b, turns))
}
