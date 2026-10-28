// Geometry primitives: boxes, transforms, blockstate helpers.
// A box is [x0, y0, z0, x1, y1, z1] in block units, model's y=0 orientation.

import type { BlockProps, Box } from './types'

export const FULL: Box = [0, 0, 0, 1, 1, 1]

export const PX = 1 / 16

export const TURN_STD: Record<string, number> = {
  north: 0,
  east: 90,
  south: 180,
  west: 270
}

export const TURN_DOOR: Record<string, number> = {
  east: 0,
  south: 90,
  west: 180,
  north: 270
}

export const prop = (
  props: BlockProps | undefined,
  key: string,
  def = ''
): string => (props && props[key] !== undefined ? String(props[key]) : def)

export const boxPx = (
  x0: number,
  y0: number,
  z0: number,
  x1: number,
  y1: number,
  z1: number
): Box => [x0 * PX, y0 * PX, z0 * PX, x1 * PX, y1 * PX, z1 * PX]

const rot2 = (x: number, z: number, turns: number): [number, number] => {
  switch (((turns % 360) + 360) % 360) {
    case 90:
      return [1 - z, x]
    case 180:
      return [1 - x, 1 - z]
    case 270:
      return [z, 1 - x]
    default:
      return [x, z]
  }
}

/** Rotate a box about the cell centre by turns*90 (blockstate `y`). */
export function rotY(b: Box, turns: number): Box {
  const [x0, y0, z0, x1, y1, z1] = b
  const [ax, az] = rot2(x0, z0, turns)
  const [bx, bz] = rot2(x1, z1, turns)

  return [
    Math.min(ax, bx),
    y0,
    Math.min(az, bz),
    Math.max(ax, bx),
    y1,
    Math.max(az, bz)
  ]
}

/** Vanilla blockstate `x` rotation: 90 = wall mount, 180 = ceiling mount. */
export function flipX(b: Box, deg: number): Box {
  const [x0, y0, z0, x1, y1, z1] = b

  if (deg === 90) {
    return [x0, z0, 1 - y1, x1, z1, 1 - y0]
  }

  if (deg === 180) {
    return [x0, 1 - y1, 1 - z1, x1, 1 - y0, 1 - z0]
  }

  return b
}

/** Vanilla `x: 180` (upside-down stairs). */
export const rotX180 = (b: Box): Box => {
  const [x0, y0, z0, x1, y1, z1] = b

  return [x0, 1 - y1, 1 - z1, x1, 1 - y0, 1 - z0]
}

/** Rail/arm reaching from a post edge to the cell boundary. */
export function arm(
  dir: string,
  y0: number,
  y1: number,
  thick: number,
  inner: number,
  outer: number
): Box {
  const t0 = 0.5 - thick / 2
  const t1 = 0.5 + thick / 2

  if (dir === 'north') {
    return [t0, y0, 0, t1, y1, inner]
  }

  if (dir === 'south') {
    return [t0, y0, outer, t1, y1, 1]
  }

  if (dir === 'west') {
    return [0, y0, t0, inner, y1, t1]
  }

  return [outer, y0, t0, 1, y1, t1]
}

export const boolDirs = (props: BlockProps): string[] =>
  ['north', 'south', 'east', 'west'].filter(d => prop(props, d) === 'true')
