// Blocks that really are full cubes (observer, piston, dispenser, target, lamp,
// note block, redstone block, crafter…) need no entry here — the default applies.

import { prop } from '../geometry'
import type { BlockProps, Box, ResolverOutput } from '../../types'
import { nameOf } from './shared'

/** Redstone dust: centre dot + 2px arms along each connection. */
export default function redstoneWire(
  name: string,
  props: BlockProps
): ResolverOutput {
  if (nameOf(name) !== 'redstone_wire') {
    return null
  }

  // dust sits at 1/64 above the floor (vanilla y=0.25/16) - keeping it off the
  // floor plane avoids a coplanar bottom face fighting with the block below
  const y0 = 1 / 64
  const y1 = 2 / 64
  const boxes: Box[] = [[6 / 16, y0, 6 / 16, 10 / 16, y1, 10 / 16]]
  const arms = {
    north: [7 / 16, y0, 0, 9 / 16, y1, 6 / 16] as Box,
    south: [7 / 16, y0, 10 / 16, 9 / 16, y1, 1] as Box,
    west: [0, y0, 7 / 16, 6 / 16, y1, 9 / 16] as Box,
    east: [10 / 16, y0, 7 / 16, 1, y1, 9 / 16] as Box
  }

  for (const dir of Object.keys(arms) as Array<keyof typeof arms>) {
    if (prop(props, dir, 'none') !== 'none') {
      boxes.push(arms[dir])
    }
  }

  return boxes
}
