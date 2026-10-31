import { prop, rotY } from '../geometry'
import type { BlockProps, Box, ResolverOutput } from '../../types'
import { facingTurns, nameOf } from './shared'

/** Tripwire: thin string along each connected side. */
export function tripwire(name: string, props: BlockProps): ResolverOutput {
  if (nameOf(name) !== 'tripwire') {
    return null
  }

  const y = 1.5 / 16
  const t = 1 / 32
  const boxes: Box[] = []
  const arms = {
    north: [7 / 16, y, 0, 9 / 16, y + t, 8 / 16] as Box,
    south: [7 / 16, y, 8 / 16, 9 / 16, y + t, 1] as Box,
    west: [0, y, 7 / 16, 8 / 16, y + t, 9 / 16] as Box,
    east: [8 / 16, y, 7 / 16, 1, y + t, 9 / 16] as Box
  }

  for (const dir of Object.keys(arms) as Array<keyof typeof arms>) {
    if (prop(props, dir) === 'true') {
      boxes.push(arms[dir])
    }
  }

  return boxes.length ? boxes : [arms.north]
}

/** Tripwire hook: wall plate plus the hook body. */
export function tripwireHook(
  name: string,
  props: BlockProps
): ResolverOutput {
  if (nameOf(name) !== 'tripwire_hook') {
    return null
  }

  const turns = facingTurns(props)
  const boxes: Box[] = [
    [6 / 16, 1 / 16, 14 / 16, 10 / 16, 9 / 16, 1],
    [7.4 / 16, 3.8 / 16, 7.9 / 16, 9.8 / 16, 6.8 / 16, 14 / 16]
  ]

  return boxes.map(b => rotY(b, turns))
}
