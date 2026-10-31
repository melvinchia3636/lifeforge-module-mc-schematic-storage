import { TURN_DOOR, prop, rotX180, rotY } from './geometry'
import type { BlockProps, Box, ResolverOutput } from '../types'

export default function stairs(
  name: string,
  props: BlockProps
): ResolverOutput {
  const n = name.split(':').pop() ?? name

  if (!n.endsWith('_stairs')) {
    return null
  }

  let turns = TURN_DOOR[prop(props, 'facing', 'north')] ?? 270

  const shape = prop(props, 'shape', 'straight')

  if (shape.endsWith('left')) {
    turns = (turns - 90 + 360) % 360
  }

  let boxes: Box[] = [[0, 0, 0, 1, 0.5, 1]]

  if (shape.startsWith('inner')) {
    boxes.push([0.5, 0.5, 0, 1, 1, 1], [0, 0.5, 0.5, 0.5, 1, 1])
  } else if (shape.startsWith('outer')) {
    boxes.push([0.5, 0.5, 0.5, 1, 1, 1])
  } else {
    boxes.push([0.5, 0.5, 0, 1, 1, 1])
  }

  if (prop(props, 'half', 'bottom') === 'top') {
    boxes = boxes.map(rotX180)
  }

  return boxes.map(b => rotY(b, turns))
}
