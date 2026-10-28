// Litematica region decoding: palette + packed block states -> placed blocks.

import type { BlockProps, ParsedSchematic } from './types'
import type { NbtCompound } from './nbt'

const AIR = /(^|:)(air|cave_air|void_air|structure_void|light)$/

export const isAir = (name: string): boolean =>
  name === 'minecraft:air' || AIR.test(name)

interface PaletteEntry {
  Name?: string
  Properties?: Record<string, string>
}

interface Region {
  BlockStatePalette?: PaletteEntry[]
  Palette?: PaletteEntry[]
  Position?: { x: number; y: number; z: number }
  Size?: { x: number; y: number; z: number }
  BlockStates?: BigInt64Array
}

function decodePadded(
  longs: BigInt64Array,
  bits: number,
  n: number
): Int32Array | null {
  const per = Math.floor(64 / bits)
  const mask = (1n << BigInt(bits)) - 1n
  const out = new Int32Array(n)

  for (let i = 0; i < n; i++) {
    const word = longs[Math.floor(i / per)]

    if (word === undefined) {
      return null
    }

    const shift = BigInt((i % per) * bits)

    out[i] = Number((BigInt.asUintN(64, word) >> shift) & mask)
  }

  return out
}

function decodeSpanning(
  longs: BigInt64Array,
  bits: number,
  n: number
): Int32Array | null {
  const mask = (1n << BigInt(bits)) - 1n
  const out = new Int32Array(n)

  for (let i = 0; i < n; i++) {
    const bit = i * bits
    const li = Math.floor(bit / 64)
    const off = BigInt(bit % 64)
    const current = longs[li]

    if (current === undefined) {
      return null
    }

    let v = (BigInt.asUintN(64, current) >> off) & mask

    if (Number(off) + bits > 64 && li + 1 < longs.length) {
      const next = longs[li + 1]

      if (next !== undefined) {
        v |= (BigInt.asUintN(64, next) << (64n - off)) & mask
      }
    }

    out[i] = Number(v)
  }

  return out
}

export function decodeStates(
  raw: BigInt64Array | undefined,
  paletteLen: number,
  n: number
): Int32Array {
  const out = new Int32Array(n)

  if (paletteLen <= 1 || n === 0 || !raw) {
    return out
  }

  const bits = Math.max(
    2,
    Math.ceil(Math.log2(Math.max(1, paletteLen - 1))) || 0
  )
  const per = Math.floor(64 / bits)

  // Litematica packs entries inside each long; Minecraft 1.16+ spans them.
  // Pick the layout whose expected buffer length matches the file first.
  const needPadded = Math.ceil(n / per)
  const needSpanning = Math.ceil((n * bits) / 64)
  const paddedFirst =
    Math.abs(raw.length - needPadded) <= Math.abs(raw.length - needSpanning)
  const decoders: Array<() => Int32Array | null> = paddedFirst
    ? [() => decodePadded(raw, bits, n), () => decodeSpanning(raw, bits, n)]
    : [() => decodeSpanning(raw, bits, n), () => decodePadded(raw, bits, n)]

  for (const decode of decoders) {
    const arr = decode()

    if (!arr) {
      continue
    }

    let max = 0

    for (let i = 0; i < arr.length; i++) {
      const v = arr[i]

      if (v !== undefined && v > max) {
        max = v
      }
    }

    if (max < paletteLen) {
      return arr
    }
  }

  return new Int32Array(n)
}

/** Regions of a parsed litematic NBT -> { size, blocks: [[x,y,z,name,props]] } */
export function regionsToBlocks(nbt: NbtCompound): ParsedSchematic {
  const regions = (nbt.Regions ?? nbt.regions) as
    | Record<string, Region>
    | undefined

  if (!regions) {
    throw new Error('not a litematic: no Regions')
  }

  const blocks: ParsedSchematic['blocks'] = []

  let minX = Infinity
  let minY = Infinity
  let minZ = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  let maxZ = -Infinity

  for (const reg of Object.values(regions)) {
    const palette = reg.BlockStatePalette || reg.Palette

    if (!palette) {
      continue
    }

    const names = palette.map(e => String(e.Name || ''))
    const props = palette.map(e => {
      const p: BlockProps = {}

      for (const [k, v] of Object.entries(e.Properties || {})) {
        p[k] = String(v)
      }

      return p
    })

    const pos = reg.Position || { x: 0, y: 0, z: 0 }
    const size = reg.Size || { x: 0, y: 0, z: 0 }
    const sx = Number(size.x)
    const sy = Number(size.y)
    const sz = Number(size.z)
    const dx = Math.abs(sx)
    const dy = Math.abs(sy)
    const dz = Math.abs(sz)

    if (!dx || !dy || !dz) {
      continue
    }

    const states = decodeStates(reg.BlockStates, names.length, dx * dy * dz)
    const px = Number(pos.x)
    const py = Number(pos.y)
    const pz = Number(pos.z)

    for (let y = 0; y < dy; y++) {
      for (let z = 0; z < dz; z++) {
        for (let x = 0; x < dx; x++) {
          const stateIndex = states[(y * dz + z) * dx + x]

          if (stateIndex === undefined) {
            continue
          }

          const name = names[stateIndex]

          if (!name || isAir(name)) {
            continue
          }

          const gx = px + (sx >= 0 ? x : -(dx - 1 - x))
          const gy = py + (sy >= 0 ? y : -(dy - 1 - y))
          const gz = pz + (sz >= 0 ? z : -(dz - 1 - z))

          blocks.push([gx, gy, gz, name, props[stateIndex] ?? {}])

          if (gx < minX) minX = gx
          if (gy < minY) minY = gy
          if (gz < minZ) minZ = gz
          if (gx > maxX) maxX = gx
          if (gy > maxY) maxY = gy
          if (gz > maxZ) maxZ = gz
        }
      }
    }
  }

  if (!blocks.length) {
    throw new Error('no solid blocks')
  }

  for (const b of blocks) {
    b[0] -= minX
    b[1] -= minY
    b[2] -= minZ
  }

  return {
    size: [maxX - minX + 1, maxY - minY + 1, maxZ - minZ + 1],
    blocks
  }
}
