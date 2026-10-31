import { TURN_STD, arm, boolDirs, boxPx, prop, rotY } from './geometry'
import type { BlockProps, Box, ResolverOutput } from '../types'

const GATES: Record<string, Box[]> = {
  'false,false': [
    [0, 5, 7, 2, 16, 9],
    [14, 5, 7, 16, 16, 9],
    [6, 6, 7, 8, 15, 9],
    [8, 6, 7, 10, 15, 9],
    [2, 6, 7, 6, 9, 9],
    [2, 12, 7, 6, 15, 9],
    [10, 6, 7, 14, 9, 9],
    [10, 12, 7, 14, 15, 9]
  ],
  'false,true': [
    [0, 2, 7, 2, 13, 9],
    [14, 2, 7, 16, 13, 9],
    [6, 3, 7, 8, 12, 9],
    [8, 3, 7, 10, 12, 9],
    [2, 3, 7, 6, 6, 9],
    [2, 9, 7, 6, 12, 9],
    [10, 3, 7, 14, 6, 9],
    [10, 9, 7, 14, 12, 9]
  ],
  'true,false': [
    [0, 5, 7, 2, 16, 9],
    [14, 5, 7, 16, 16, 9],
    [0, 6, 13, 2, 15, 15],
    [14, 6, 13, 16, 15, 15],
    [0, 6, 9, 2, 9, 13],
    [0, 12, 9, 2, 15, 13],
    [14, 6, 9, 16, 9, 13],
    [14, 12, 9, 16, 15, 13]
  ],
  'true,true': [
    [0, 2, 7, 2, 13, 9],
    [14, 2, 7, 16, 13, 9],
    [0, 3, 13, 2, 12, 15],
    [14, 3, 13, 16, 12, 15],
    [0, 3, 9, 2, 6, 13],
    [0, 9, 9, 2, 12, 13],
    [14, 3, 9, 16, 6, 13],
    [14, 9, 9, 16, 12, 13]
  ]
}

export function fenceGate(
  name: string,
  props: BlockProps
): ResolverOutput {
  const n = name.split(':').pop() ?? name

  if (!(n.endsWith('_fence_gate') || n === 'fence_gate')) {
    return null
  }

  const key =
    `${prop(props, 'open') === 'true'},${prop(props, 'in_wall') === 'true'}`
  const turns = ((TURN_STD[prop(props, 'facing', 'south')] ?? 180) + 180) % 360

  return GATES[key]!.map(([x0, y0, z0, x1, y1, z1]) =>
    rotY(boxPx(x0, y0, z0, x1, y1, z1), turns)
  )
}

export function fence(name: string, props: BlockProps): ResolverOutput {
  const n = name.split(':').pop() ?? name

  if (!(n.endsWith('_fence') || n === 'fence')) {
    return null
  }

  const boxes: Box[] = [[0.375, 0, 0.375, 0.625, 1, 0.625]]

  for (const d of boolDirs(props)) {
    boxes.push(arm(d, 0.375, 0.5625, 0.125, 0.375, 0.625))
    boxes.push(arm(d, 0.75, 0.9375, 0.125, 0.375, 0.625))
  }

  return boxes
}
