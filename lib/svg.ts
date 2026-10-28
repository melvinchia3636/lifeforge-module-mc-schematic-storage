// Static vector output: the same hidden-line result as the WebGL renderer, but
// computed on the CPU and emitted as SVG paths.
//
// Pipeline:
//   1. Collect the visible box edges from the scene quads, dropping edges whose
//      neighbouring faces are coplanar (those seams are invisible in the raster
//      render too).
//   2. Rasterise a depth buffer from the scene triangles (orthographic, exactly
//      the camera the WebGL pass uses).
//   3. Walk every edge, sample it, and keep only the runs whose depth matches
//      the buffer — i.e. the parts that are not hidden behind something else.
//   4. Emit the visible runs as one SVG path with round caps.
//
// Because the projection is orthographic, a 3D edge always projects to a
// straight 2D line, so each visible run is a single <path> segment: the output
// is resolution independent and much smaller than tracing a bitmap.

import { basis } from './camera'
import { buildScene } from './scene'
import type { Face, ParsedSchematic, Scene, Vec3 } from './types'

const dot3 = (a: Vec3, b: Vec3): number =>
  a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const keyOf = (n: number): number => Math.round(n * 1000) / 1000

function boundingSphere(
  data: Float32Array,
  stride: number
): { center: Vec3; radius: number } {
  const mn: Vec3 = [Infinity, Infinity, Infinity]
  const mx: Vec3 = [-Infinity, -Infinity, -Infinity]

  for (let i = 0; i < data.length; i += stride) {
    for (let k = 0; k < 3; k++) {
      const v = data[i + k]

      if (v === undefined) {
        continue
      }

      if (v < mn[k]!) mn[k] = v
      if (v > mx[k]!) mx[k] = v
    }
  }

  return {
    center: [
      (mn[0] + mx[0]) / 2,
      (mn[1] + mx[1]) / 2,
      (mn[2] + mx[2]) / 2
    ],
    radius: 0.5 * Math.hypot(mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2])
  }
}

interface Edge {
  a: Vec3
  b: Vec3
  faces: Face[]
}

/** Edges to consider, with the faces that meet on them. */
function collectEdges(quads: Face[]): Edge[] {
  const edges = new Map<string, Edge>()

  const add = (a: Vec3, b: Vec3, face: Face) => {
    const ka = `${keyOf(a[0])},${keyOf(a[1])},${keyOf(a[2])}`
    const kb = `${keyOf(b[0])},${keyOf(b[1])},${keyOf(b[2])}`
    const key = ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`
    const hit = edges.get(key)

    if (hit) {
      hit.faces.push(face)
    } else {
      edges.set(key, { a, b, faces: [face] })
    }
  }

  for (const face of quads) {
    const c = face.c

    for (let i = 0; i < 4; i++) {
      const a = c[i]
      const b = c[(i + 1) % 4]

      if (a && b) {
        add(a, b, face)
      }
    }
  }

  // drop seams where every face on the edge shares one plane
  const out: Edge[] = []

  for (const edge of edges.values()) {
    const { faces } = edge
    const first = faces[0]

    let coplanar = true

    if (first) {
      for (let i = 1; i < faces.length && coplanar; i++) {
        const f = first
        const g = faces[i]

        if (
          !g ||
          dot3(f.n, g.n) < 0.9999 ||
          Math.abs(f.d - g.d) > 1e-2
        ) {
          coplanar = false
        }
      }
    }

    if (!coplanar) {
      out.push(edge)
    }
  }

  return out
}

export interface SvgOptions {
  size?: number
  yaw?: number
  pitch?: number
  zoom?: number
  margin?: number
  stroke?: number
  ss?: number
  tol?: number
  background?: boolean
  fit?: 'sphere' | 'bounds'
  tight?: boolean
  tightPadding?: number
}

/** Render a built scene to an SVG string. */
export function sceneToSvg(
  scene: Scene,
  {
    size = 512,
    yaw = Math.PI / 4,
    pitch = 0.615,
    zoom = 1,
    margin = 0.06,
    stroke = 0.5,
    ss = 2, // depth-buffer supersampling
    tol = 0.06, // depth tolerance in blocks
    background = true,
    fit = 'sphere',
    tight = false,
    tightPadding = 0.04
  }: SvgOptions = {}
): string {
  const { d, r, u } = basis(yaw, pitch)

  let cx: number
  let cy: number
  let side: number

  if (fit === 'bounds') {
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity

    for (let i = 0; i < scene.data.length; i += scene.stride) {
      const x = scene.data[i]
      const y = scene.data[i + 1]
      const z = scene.data[i + 2]

      if (x === undefined || y === undefined || z === undefined) {
        continue
      }

      const px = x * r[0] + y * r[1] + z * r[2]
      const py = x * u[0] + y * u[1] + z * u[2]

      if (px < minX) minX = px
      if (px > maxX) maxX = px
      if (py < minY) minY = py
      if (py > maxY) maxY = py
    }

    if (Number.isFinite(minX)) {
      cx = (minX + maxX) / 2
      cy = (minY + maxY) / 2
      side = (Math.max(maxX - minX, maxY - minY) * (1 + 2 * margin)) / zoom
    } else {
      const { center, radius } = boundingSphere(scene.data, scene.stride)

      cx = dot3(center, r)
      cy = dot3(center, u)
      side = (2 * radius * (1 + 2 * margin)) / zoom
    }
  } else {
    const { center, radius } = boundingSphere(scene.data, scene.stride)

    cx = dot3(center, r)
    cy = dot3(center, u)
    side = (2 * radius * (1 + 2 * margin)) / zoom
  }

  const scale = 2 / side

  // world -> [ndcX, ndcY, depth]
  const project = (p: Vec3): [number, number, number] => [
    (dot3(p, r) - cx) * scale,
    (dot3(p, u) - cy) * scale,
    dot3(p, d)
  ]

  const W = Math.max(32, Math.round(size * ss))
  const H = W
  const depth = new Float32Array(W * H).fill(-Infinity)
  const quadOf = new Int32Array(W * H).fill(-1)
  const quads = scene.quads

  // ---- rasterise depth + visible-quad ids --------------------------------
  // Rasterising quads (not raw triangles) gives every pixel the id of the face
  // that won the depth test, which is what decides whether an edge is a real
  // crease or just a seam between two pieces of the same surface.
  const rx = new Float64Array(4)
  const ry = new Float64Array(4)
  const rz = new Float64Array(4)

  const rasterTri = (i0: number, i1: number, i2: number, qi: number) => {
    const rx0 = rx[i0] ?? 0
    const rx1 = rx[i1] ?? 0
    const rx2 = rx[i2] ?? 0
    const ry0 = ry[i0] ?? 0
    const ry1 = ry[i1] ?? 0
    const ry2 = ry[i2] ?? 0
    const rz0 = rz[i0] ?? 0
    const rz1 = rz[i1] ?? 0
    const rz2 = rz[i2] ?? 0
    const minX = Math.max(0, Math.floor(Math.min(rx0, rx1, rx2) - 1))
    const maxX = Math.min(
      W - 1,
      Math.ceil(Math.max(rx0, rx1, rx2) + 1)
    )
    const minY = Math.max(0, Math.floor(Math.min(ry0, ry1, ry2) - 1))
    const maxY = Math.min(
      H - 1,
      Math.ceil(Math.max(ry0, ry1, ry2) + 1)
    )

    if (minX > maxX || minY > maxY) {
      return
    }

    const area =
      (rx1 - rx0) * (ry2 - ry0) - (rx2 - rx0) * (ry1 - ry0)

    if (Math.abs(area) < 1e-9) {
      return
    }

    const inv = 1 / area

    for (let py = minY; py <= maxY; py++) {
      const fy = py + 0.5

      for (let px = minX; px <= maxX; px++) {
        const fx = px + 0.5
        const w0 =
          ((rx1 - fx) * (ry2 - fy) - (rx2 - fx) * (ry1 - fy)) * inv
        const w1 =
          ((rx2 - fx) * (ry0 - fy) - (rx0 - fx) * (ry2 - fy)) * inv
        const w2 = 1 - w0 - w1

        if (w0 < -1e-6 || w1 < -1e-6 || w2 < -1e-6) {
          continue
        }

        const z = w0 * rz0 + w1 * rz1 + w2 * rz2
        const idx = py * W + px

        if (z > (depth[idx] ?? -Infinity)) {
          depth[idx] = z
          quadOf[idx] = qi
        }
      }
    }
  }

  for (let qi = 0; qi < quads.length; qi++) {
    const quad = quads[qi]

    if (!quad) {
      continue
    }

    const c = quad.c

    for (let k = 0; k < 4; k++) {
      const point = c[k]

      if (!point) {
        continue
      }

      const [nx, ny, nz] = project(point)

      rx[k] = (nx * 0.5 + 0.5) * W
      ry[k] = (0.5 - ny * 0.5) * H
      rz[k] = nz
    }

    rasterTri(0, 1, 2, qi)
    rasterTri(0, 2, 3, qi)
  }

  // ---- visible edges ------------------------------------------------------
  const edges = collectEdges(quads)
  const toCanvas = (p: Vec3): [number, number, number] => {
    const [nx, ny, nz] = project(p)

    return [(nx * 0.5 + 0.5) * size, (0.5 - ny * 0.5) * size, nz]
  }

  // Two neighbouring pixels belong to the same surface when they see the same
  // face, or two coplanar faces. Only a real change (different plane, or the
  // background) makes the line visible.
  const sameSurface = (a: number, b: number): boolean => {
    if (a === b) {
      return true
    }

    if (a < 0 || b < 0) {
      return false
    }

    const fa = quads[a]
    const fb = quads[b]

    if (!fa || !fb) {
      return false
    }

    return dot3(fa.n, fb.n) > 0.9999 && Math.abs(fa.d - fb.d) < 1e-2
  }

  // An edge can be a crease along part of its length and a perfectly flat seam
  // along the rest (a stair's tread runs into the wall of the step above it),
  // so the decision is per sample: probe the visible surfaces on both sides of
  // the edge and drop the samples where they are the same plane.
  const probe = 0.7 * ss
  const parts: string[] = []

  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity

  for (const edge of edges) {
    const [ax, ay, az] = toCanvas(edge.a)
    const [bx, by, bz] = toCanvas(edge.b)
    const len = Math.hypot(bx - ax, by - ay)

    if (len < 0.05) {
      continue
    }

    const steps = Math.max(2, Math.ceil(len * ss))
    const nx = -(by - ay) / len
    const ny = (bx - ax) / len

    const creaseAt = (t: number): boolean => {
      const cxp = (ax + (bx - ax) * t) * ss
      const cyp = (ay + (by - ay) * t) * ss
      const i1x = Math.min(
        W - 1,
        Math.max(0, Math.floor(cxp + nx * probe))
      )
      const i1y = Math.min(
        H - 1,
        Math.max(0, Math.floor(cyp + ny * probe))
      )
      const i2x = Math.min(
        W - 1,
        Math.max(0, Math.floor(cxp - nx * probe))
      )
      const i2y = Math.min(
        H - 1,
        Math.max(0, Math.floor(cyp - ny * probe))
      )

      return !sameSurface(quadOf[i1y * W + i1x] ?? -1, quadOf[i2y * W + i2x] ?? -1)
    }

    const vis = new Uint8Array(steps + 1)

    for (let s2 = 0; s2 <= steps; s2++) {
      const t = s2 / steps
      const pz = az + (bz - az) * t
      const ix = Math.min(
        W - 1,
        Math.max(0, Math.floor((ax + (bx - ax) * t) * ss))
      )
      const iy = Math.min(
        H - 1,
        Math.max(0, Math.floor((ay + (by - ay) * t) * ss))
      )
      const front = depth[iy * W + ix] ?? -Infinity
      const onSurface = front === -Infinity || pz >= front - tol

      vis[s2] = onSurface && creaseAt(t) ? 1 : 0
    }

    // fill single-sample holes so a hairline does not turn into a dotted line
    const filled = Uint8Array.from(vis)

    for (let s2 = 1; s2 < steps; s2++) {
      if (vis[s2] === 0 && vis[s2 - 1] === 1 && vis[s2 + 1] === 1) {
        filled[s2] = 1
      }
    }

    let runStart = -1

    for (let s2 = 0; s2 <= steps; s2++) {
      const on = s2 <= steps && filled[s2] === 1

      if (on && runStart < 0) {
        runStart = s2
      }

      if ((!on || s2 === steps) && runStart >= 0) {
        const endS = on && s2 === steps ? s2 : s2 - 1
        const t0 = runStart / steps
        const t1 = endS / steps
        const x0 = ax + (bx - ax) * t0
        const y0 = ay + (by - ay) * t0
        const x1 = ax + (bx - ax) * t1
        const y1 = ay + (by - ay) * t1

        if (Math.hypot(x1 - x0, y1 - y0) > 0.15) {
          parts.push(
            `M${x0.toFixed(2)} ${y0.toFixed(2)}L${x1.toFixed(2)} ${y1.toFixed(2)}`
          )

          if (x0 < minX) minX = x0
          if (x0 > maxX) maxX = x0
          if (x1 < minX) minX = x1
          if (x1 > maxX) maxX = x1
          if (y0 < minY) minY = y0
          if (y0 > maxY) maxY = y0
          if (y1 < minY) minY = y1
          if (y1 > maxY) maxY = y1
        }

        runStart = -1
      }
    }
  }

  const w = (stroke * size) / 512

  let outWidth = size
  let outHeight = size
  let viewBox = `0 0 ${size} ${size}`

  if (tight && Number.isFinite(minX)) {
    const pad = Math.max(w * 1.5, size * tightPadding)
    const left = minX - pad
    const right = maxX + pad
    const top = minY - pad
    const bottom = maxY + pad
    const contentWidth = right - left
    const contentHeight = bottom - top
    const maxDimension = Math.max(contentWidth, contentHeight)
    const scale = size / maxDimension

    outWidth = Math.max(1, Math.round(contentWidth * scale))
    outHeight = Math.max(1, Math.round(contentHeight * scale))
    viewBox = `${left.toFixed(2)} ${top.toFixed(2)} ${contentWidth.toFixed(2)} ${contentHeight.toFixed(2)}`
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${outWidth}" height="${outHeight}" viewBox="${viewBox}">` +
    (background
      ? '<rect width="100%" height="100%" fill="#fff"/>'
      : '') +
    `<path d="${parts.join('')}" fill="none" stroke="#000" stroke-width="${w.toFixed(3)}" ` +
    `stroke-linecap="round" stroke-linejoin="round"/></svg>\n`
  )
}

/** Convenience: parsed blocks -> SVG string. */
export function blocksToSvg(
  parsed: ParsedSchematic,
  options: SvgOptions = {}
): string {
  return sceneToSvg(buildScene(parsed), options)
}
