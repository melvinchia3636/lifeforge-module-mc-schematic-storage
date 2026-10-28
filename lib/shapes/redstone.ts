// Redstone components: dust, repeaters, comparators, observers' neighbours,
// pistons, tripwire, rails, daylight detectors.
// Blocks that really are full cubes (observer, piston, dispenser, target, lamp,
// note block, redstone block, crafter…) need no entry here — the default applies.

import { TURN_STD, prop, rotY } from '../geometry'
import type { BlockProps, Box, ResolverOutput } from '../types'

const nameOf = (name: string): string => name.split(':').pop() ?? name
const facingTurns = (
  props: BlockProps,
  table: Record<string, number> = TURN_STD
): number => table[prop(props, 'facing', 'north')] ?? 0
// repeaters/comparators/tripwire hooks are authored facing south at y=0
const towardWall = (props: BlockProps): number => (facingTurns(props) + 180) % 360

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

/** Repeater / comparator: 2px stone base with torches on top. */
export function repeater(
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

/** Piston head: 4px plate at the pushing end, rod running back to the body. */
export function pistonHead(
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

/** Daylight detector: 6px slab. */
export function daylightDetector(name: string): ResolverOutput {
  const n = nameOf(name)

  if (n !== 'daylight_detector' && n !== 'daylight_detector_inverted') {
    return null
  }

  return [[0, 0, 0, 1, 6 / 16, 1]]
}

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

/** Rails: flat 1px plate (slopes are not modelled, outline only). */
export function rail(name: string): ResolverOutput {
  const n = nameOf(name)

  if (!(n === 'rail' || n.endsWith('_rail'))) {
    return null
  }

  return [[0, 1 / 16, 0, 1, 2 / 16, 1]]
}
