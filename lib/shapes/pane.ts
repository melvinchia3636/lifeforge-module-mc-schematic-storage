import { arm, boolDirs } from '../geometry'
import type { BlockProps, Box, ResolverOutput } from '../types'

export default function pane(
  name: string,
  props: BlockProps
): ResolverOutput {
  const n = name.split(':').pop() ?? name

  if (!(n.endsWith('_pane') || n === 'glass_pane' || n === 'iron_bars')) {
    return null
  }

  const boxes: Box[] = [[0.4375, 0, 0.4375, 0.5625, 1, 0.5625]]

  for (const d of boolDirs(props)) {
    boxes.push(arm(d, 0, 1, 0.125, 0.4375, 0.5625))
  }

  return boxes
}
