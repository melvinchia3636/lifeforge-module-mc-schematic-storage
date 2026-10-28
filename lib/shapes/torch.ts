// Torches. Standing: 2x10px stick. Wall: same stick, moved to the wall face and
// tilted 22.5° about Z, then rotated by facing (vanilla `y` values: east 0,
// south 90, west 180, north 270).

import { TURN_DOOR, prop } from '../geometry'
import type { BlockProps, ResolverOutput } from '../types'

export default function torch(
  name: string,
  props: BlockProps
): ResolverOutput {
  const n = name.split(':').pop() ?? name

  if (!n.endsWith('torch')) {
    return null
  }

  if (n.includes('wall')) {
    return {
      boxes: [
        {
          box: [-1 / 16, 3.5 / 16, 7 / 16, 1 / 16, 13.5 / 16, 9 / 16],
          tilt: { axis: 'z', angle: -22.5, origin: [0, 3.5 / 16, 8 / 16] }
        }
      ],
      yaw: TURN_DOOR[prop(props, 'facing', 'east')] ?? 0
    }
  }

  return [[7 / 16, 0, 7 / 16, 9 / 16, 10 / 16, 9 / 16]]
}
