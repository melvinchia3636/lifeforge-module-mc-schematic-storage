// Buttons and levers.
//
// Buttons are baked axis-aligned boxes (face = floor | wall | ceiling).
// Levers need a tilted handle: vanilla rotates the handle element ±45° about
// its base, so the shape carries per-box tilt plus shape-level x/y rotations.

import { TURN_STD, flipX, prop, rotY } from './geometry'
import type { BlockProps, Box, BoxEntry, ResolverOutput } from '../types'

export default function attachable(
  name: string,
  props: BlockProps
): ResolverOutput {
  const n = name.split(':').pop() ?? name
  const button = n.endsWith('_button') || n === 'button'
  const lever = n.endsWith('_lever') || n === 'lever'

  if (!button && !lever) {
    return null
  }

  const face = prop(props, 'face', 'wall')

  let turns = TURN_STD[prop(props, 'facing', 'north')] ?? 0

  if (lever) {
    // handled by the scene builder: element tilt, then blockstate x, then y
    const flip = face === 'wall' ? 90 : face === 'ceiling' ? 180 : 0

    if (face === 'ceiling') {
      turns = (turns + 180) % 360
    }

    const angle = prop(props, 'powered') === 'true' ? 45 : -45
    const boxes: BoxEntry[] = [
      [5 / 16, 0, 4 / 16, 11 / 16, 3 / 16, 12 / 16], // base plate
      {
        box: [7 / 16, 1 / 16, 7 / 16, 9 / 16, 11 / 16, 9 / 16], // handle
        tilt: { axis: 'x', angle, origin: [0.5, 1 / 16, 0.5] }
      }
    ]

    return {
      boxes,
      yaw: turns,
      flipX: flip
    }
  }

  let boxes: Box[] = [
    [
      5 / 16,
      0,
      6 / 16,
      11 / 16,
      prop(props, 'powered') === 'true' ? 1 / 16 : 2 / 16,
      10 / 16
    ]
  ]

  if (face === 'wall') {
    boxes = boxes.map(b => flipX(b, 90))
  } else if (face === 'ceiling') {
    boxes = boxes.map(b => flipX(b, 180))
    turns = (turns + 180) % 360
  }

  return boxes.map(b => rotY(b, turns))
}
