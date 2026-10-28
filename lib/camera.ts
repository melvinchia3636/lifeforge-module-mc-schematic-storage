import type { Vec3 } from './types'

export interface CameraBasis {
  d: Vec3
  r: Vec3
  u: Vec3
}

/** Camera basis for a yaw (around Y) and pitch (elevation), both radians. */
export function basis(yaw: number, pitch: number): CameraBasis {
  const cy = Math.cos(yaw)
  const sy = Math.sin(yaw)
  const cp = Math.cos(pitch)
  const sp = Math.sin(pitch)
  const d: Vec3 = [cp * sy, sp, cp * cy] // eye direction (from scene to camera)

  let r: Vec3 = [d[2], 0, -d[0]] // right = up × d, flattened

  const len = Math.hypot(r[0], r[2]) || 1

  r = [r[0] / len, 0, r[2] / len]

  const u: Vec3 = [
    d[1] * r[2] - d[2] * r[1],
    d[2] * r[0] - d[0] * r[2],
    d[0] * r[1] - d[1] * r[0]
  ]

  return { d, r, u }
}
