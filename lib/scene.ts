// Blocks -> triangles with per-vertex normal + plane offset.
//
// A shape may ask for three extra transforms, applied in vanilla order:
//   1. per-box element tilt (the lever handle's 45°),
//   2. blockstate `x` (wall/ceiling mount),
//   3. blockstate `y` (facing), plus the shape's arbitrary yaw (signs).

import { resolve } from './registry'
import type {
  Box,
  Face,
  ParsedSchematic,
  Scene,
  Vec3
} from './types'

export const W: Vec3 = [
  1 / Math.sqrt(3),
  1 / Math.sqrt(3),
  1 / Math.sqrt(3)
]

const FACES: Array<[number, number, number, number, Vec3]> = [
  [4, 5, 6, 7, [0, 1, 0]],
  [3, 2, 1, 0, [0, -1, 0]],
  [1, 2, 6, 5, [1, 0, 0]],
  [0, 4, 7, 3, [-1, 0, 0]],
  [2, 3, 7, 6, [0, 0, 1]],
  [0, 1, 5, 4, [0, 0, -1]]
]
const TRI: Array<[number, number, number]> = [
  [0, 1, 2],
  [0, 2, 3]
]
const FULL: Box = [0, 0, 0, 1, 1, 1]

const rotX = (p: Vec3, deg: number, cy: number, cz: number): Vec3 => {
  const r = (deg * Math.PI) / 180
  const c = Math.cos(r)
  const s = Math.sin(r)
  const dy = p[1] - cy
  const dz = p[2] - cz

  return [p[0], cy + dy * c - dz * s, cz + dy * s + dz * c]
}

const rotY = (p: Vec3, deg: number, cx: number, cz: number): Vec3 => {
  const r = (deg * Math.PI) / 180
  const c = Math.cos(r)
  const s = Math.sin(r)
  const dx = p[0] - cx
  const dz = p[2] - cz

  return [cx + dx * c - dz * s, p[1], cz + dx * s + dz * c]
}

const rotZ = (p: Vec3, deg: number, cx: number, cy: number): Vec3 => {
  const r = (deg * Math.PI) / 180
  const c = Math.cos(r)
  const s = Math.sin(r)
  const dx = p[0] - cx
  const dy = p[1] - cy

  return [cx + dx * c - dy * s, cy + dx * s + dy * c, p[2]]
}

const rotNY = (n: Vec3, deg: number): Vec3 => {
  const r = (deg * Math.PI) / 180
  const c = Math.cos(r)
  const s = Math.sin(r)

  return [n[0] * c - n[2] * s, n[1], n[0] * s + n[2] * c]
}

const rotNZ = (n: Vec3, deg: number): Vec3 => {
  const r = (deg * Math.PI) / 180
  const c = Math.cos(r)
  const s = Math.sin(r)

  return [n[0] * c - n[1] * s, n[0] * s + n[1] * c, n[2]]
}

const rotNX = (n: Vec3, deg: number): Vec3 => {
  const r = (deg * Math.PI) / 180
  const c = Math.cos(r)
  const s = Math.sin(r)

  return [n[0], n[1] * c - n[2] * s, n[1] * s + n[2] * c]
}

const isFullBox = (b: Box): boolean =>
  b.every((v, i) => v === FULL[i])

export function buildScene({ blocks }: ParsedSchematic): Scene {
  const faces: Face[] = []
  const quads: Face[] = [] // same faces, kept for vector output

  const push = (corners: [Vec3, Vec3, Vec3, Vec3], n: Vec3) => {
    const d =
      n[0] * corners[0][0] +
      n[1] * corners[0][1] +
      n[2] * corners[0][2]
    const face: Face = { c: corners, n, d }

    faces.push(face)
    quads.push(face)
  }

  // plain full cubes, used to cull buried faces
  const solid = new Set<string>()

  for (const [x, y, z, name, props] of blocks) {
    const shape = resolve(name, props)
    const first = shape.boxes[0]

    if (
      (shape.yaw ?? 0) === 0 &&
      !shape.flipX &&
      shape.boxes.length === 1 &&
      first !== undefined &&
      Array.isArray(first) &&
      isFullBox(first)
    ) {
      solid.add(`${x},${y},${z}`)
    }
  }

  const filled = (x: number, y: number, z: number): boolean =>
    solid.has(`${x},${y},${z}`)

  for (const [x, y, z, name, props] of blocks) {
    const shape = resolve(name, props)
    const { boxes } = shape

    if (!boxes.length) {
      continue
    }

    const yaw = shape.yaw ?? 0
    const flip = shape.flipX ?? 0
    const plain = yaw === 0 && !flip
    const first = boxes[0]
    const isFull =
      plain &&
      boxes.length === 1 &&
      first !== undefined &&
      Array.isArray(first) &&
      isFullBox(first)

    for (const entry of boxes) {
      const box: Box = Array.isArray(entry) ? entry : entry.box
      const tilt = Array.isArray(entry) ? undefined : entry.tilt
      const [bx0, by0, bz0, bx1, by1, bz1] = box
      const x0 = x + bx0
      const x1 = x + bx1
      const y0 = y + by0
      const y1 = y + by1
      const z0 = z + bz0
      const z1 = z + bz1

      const transformed = Boolean(tilt || flip || yaw)

      if (!transformed) {
        // axis-aligned: six faces, skipping ones buried in a neighbouring cube
        if (!(isFull && filled(x + 1, y, z))) {
          push(
            [
              [x1, y0, z0],
              [x1, y1, z0],
              [x1, y1, z1],
              [x1, y0, z1]
            ],
            [1, 0, 0]
          )
        }

        if (!(isFull && filled(x - 1, y, z))) {
          push(
            [
              [x0, y0, z0],
              [x0, y0, z1],
              [x0, y1, z1],
              [x0, y1, z0]
            ],
            [-1, 0, 0]
          )
        }

        if (!(isFull && filled(x, y + 1, z))) {
          push(
            [
              [x0, y1, z0],
              [x0, y1, z1],
              [x1, y1, z1],
              [x1, y1, z0]
            ],
            [0, 1, 0]
          )
        }

        if (!(isFull && filled(x, y - 1, z))) {
          push(
            [
              [x0, y0, z0],
              [x1, y0, z0],
              [x1, y0, z1],
              [x0, y0, z1]
            ],
            [0, -1, 0]
          )
        }

        if (!(isFull && filled(x, y, z + 1))) {
          push(
            [
              [x0, y0, z1],
              [x1, y0, z1],
              [x1, y1, z1],
              [x0, y1, z1]
            ],
            [0, 0, 1]
          )
        }

        if (!(isFull && filled(x, y, z - 1))) {
          push(
            [
              [x0, y0, z0],
              [x0, y1, z0],
              [x1, y1, z0],
              [x1, y0, z0]
            ],
            [0, 0, -1]
          )
        }

        continue
      }

      const cx = x + 0.5
      const cy = y + 0.5
      const cz = z + 0.5

      let C: Vec3[] = [
        [x0, y0, z0],
        [x1, y0, z0],
        [x1, y0, z1],
        [x0, y0, z1],
        [x0, y1, z0],
        [x1, y1, z0],
        [x1, y1, z1],
        [x0, y1, z1]
      ]

      const normals: Vec3[] = FACES.map(f => [...f[4]] as Vec3)

      const apply = (
        fnPoint: (p: Vec3) => Vec3,
        fnNormal: (n: Vec3) => Vec3
      ) => {
        C = C.map(fnPoint)

        for (let i = 0; i < normals.length; i++) {
          const normal = normals[i]

          if (normal) {
            normals[i] = fnNormal(normal)
          }
        }
      }

      if (tilt) {
        const ox = x + (tilt.origin?.[0] ?? 0.5)
        const oy = y + (tilt.origin?.[1] ?? 0.5)
        const oz = z + (tilt.origin?.[2] ?? 0.5)
        const axis = tilt.axis ?? 'x'
        const deg = tilt.angle

        if (axis === 'x') {
          apply(
            p => rotX(p, deg, oy, oz),
            n => rotNX(n, deg)
          )
        } else if (axis === 'z') {
          apply(
            p => rotZ(p, deg, ox, oy),
            n => rotNZ(n, deg)
          )
        } else {
          apply(
            p => rotY(p, deg, ox, oz),
            n => rotNY(n, deg)
          )
        }
      }

      if (flip) {
        apply(
          p => rotX(p, -flip, cy, cz),
          n => rotNX(n, -flip)
        )
      }

      if (yaw) {
        apply(
          p => rotY(p, yaw, cx, cz),
          n => rotNY(n, yaw)
        )
      }

      for (let i = 0; i < FACES.length; i++) {
        const face = FACES[i]

        if (!face) {
          continue
        }

        const [a, b, c, d] = face
        const ca = C[a]
        const cb = C[b]
        const cc = C[c]
        const cd = C[d]

        if (!ca || !cb || !cc || !cd) {
          continue
        }

        push([ca, cb, cc, cd], normals[i] ?? face[4])
      }
    }
  }

  const stride = 7
  const data = new Float32Array(faces.length * 6 * stride)

  let o = 0

  for (const f of faces) {
    for (const tri of TRI) {
      for (const i of tri) {
        const p = f.c[i]

        if (!p) {
          continue
        }

        data[o++] = p[0]
        data[o++] = p[1]
        data[o++] = p[2]
        data[o++] = f.n[0]
        data[o++] = f.n[1]
        data[o++] = f.n[2]
        data[o++] = f.d
      }
    }
  }

  return { data, faces: faces.length, stride, quads }
}
