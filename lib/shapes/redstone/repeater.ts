import { rotY } from '../geometry'
import type { BlockProps, Box, ResolverOutput } from '../../types'
import { nameOf, towardWall } from './shared'

/** Repeater / comparator: 2px stone base with torches on top. */
export default function repeater(
  name: string,
  props: BlockProps
): ResolverOutput {
  const n = nameOf(name)

  if (n !== 'repeater' && n !== 'comparator') {
    return null
  }

  const boxes: Box[] = [[0, 0, 0, 1, 2 / 16, 1]]

  if (n === 'repeater') {
    boxes.push([7 / 16, 2 / 16, 6 / 16, 9 / 16, 7 / 16, 8 / 16])
    boxes.push([7 / 16, 2 / 16, 2 / 16, 9 / 16, 7 / 16, 4 / 16])
  } else {
    boxes.push([4 / 16, 2 / 16, 11 / 16, 6 / 16, 7 / 16, 13 / 16])
    boxes.push([10 / 16, 2 / 16, 11 / 16, 12 / 16, 7 / 16, 13 / 16])
    boxes.push([7 / 16, 2 / 16, 2 / 16, 9 / 16, 5 / 16, 4 / 16])
  }

  return boxes.map(b => rotY(b, towardWall(props)))
}
