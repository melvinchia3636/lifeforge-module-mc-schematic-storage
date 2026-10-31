import { TURN_STD, prop } from '../geometry'
import type { BlockProps, ResolverOutput } from '../../types'
import { nameOf } from './shared'

/** Piston head: 4px plate at the pushing end, rod running back to the body. */
export default function pistonHead(
  name: string,
  props: BlockProps
): ResolverOutput {
  if (nameOf(name) !== 'piston_head') {
    return null
  }

  const facing = prop(props, 'facing', 'north')
  const short = prop(props, 'short') === 'true'
  // up/down use blockstate x=270/90, the horizontals use the standard y table
  const flip = facing === 'up' ? 270 : facing === 'down' ? 90 : 0

  return {
    boxes: [
      [0, 0, 0, 1, 1, 4 / 16],
      [6 / 16, 6 / 16, 4 / 16, 10 / 16, 10 / 16, (short ? 16 : 20) / 16]
    ],
    yaw: flip ? 0 : (TURN_STD[facing] ?? 0),
    flipX: flip
  }
}
