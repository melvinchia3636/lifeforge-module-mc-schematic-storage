// Sponge schematic (.schem) support: v3 (`Schematic.Blocks`) and v2
// (`Schematic.Palette` + `BlockData`). Both store varint-packed palette indices
// in X-fastest order.

import type { NbtCompound } from './nbt'
import type { BlockProps, ParsedSchematic } from './types'

interface SpongePaletteEntry {
  name: string
  props: BlockProps
}

interface SpongeSchematic {
  Width?: number
  Height?: number
  Length?: number
  BlockData?: Int8Array
  Palette?: Record<string, number>
  Blocks?: {
    Palette?: Record<string, number>
    Data?: Int8Array
  }
}

const VARINT = (bytes: Int8Array): number[] => {
  const out: number[] = []

  let value = 0
  let shift = 0

  for (let i = 0; i < bytes.length; i++) {
    const b = (bytes[i] ?? 0) & 0xff

    value |= (b & 0x7f) << shift

    if (b & 0x80) {
      shift += 7
    } else {
      out.push(value >>> 0)
      value = 0
      shift = 0
    }
  }

  return out
}

/** "minecraft:oak_stairs[facing=east,half=bottom]" -> { name, props } */
function parseKey(key: string): SpongePaletteEntry {
  const start = key.indexOf('[')

  if (start < 0) {
    return { name: key, props: {} }
  }

  const end = key.lastIndexOf(']')
  const name = key.slice(0, start)
  const props: BlockProps = {}

  for (const part of key
    .slice(start + 1, end < 0 ? undefined : end)
    .split(',')) {
    const eq = part.indexOf('=')

    if (eq > 0) {
      props[part.slice(0, eq).trim()] = part.slice(eq + 1).trim()
    }
  }

  return { name, props }
}

const nameOf = (name: string): string => name.split(':').pop() ?? name
const AIR = new Set(['air', 'cave_air', 'void_air', 'structure_void'])

export function isSponge(nbt: NbtCompound): boolean {
  return !!nbt.Schematic
}

/** Parse a Sponge schematic NBT root into { size, blocks }. */
export function spongeToBlocks(nbt: NbtCompound): ParsedSchematic | null {
  const s = nbt.Schematic as SpongeSchematic | undefined

  if (!s) {
    return null
  }

  const width = Number(s.Width)
  const height = Number(s.Height)
  const length = Number(s.Length)

  let paletteRaw: Record<string, number> | undefined
  let dataRaw: Int8Array | undefined

  if (s.Blocks && s.Blocks.Palette) {
    paletteRaw = s.Blocks.Palette // v3
    dataRaw = s.Blocks.Data
  } else if (s.Palette) {
    paletteRaw = s.Palette // v2
    dataRaw = s.BlockData
  } else {
    throw new Error('schematic has no palette')
  }

  if (!dataRaw) {
    throw new Error('schematic has no block data')
  }

  // palette is a map id -> index
  const entries = Object.entries(paletteRaw).map(
    ([key, idx]) => [Number(idx), parseKey(key)] as const
  )
  const maxIdx = entries.reduce((m, [i]) => Math.max(m, i), 0)
  const palette: Array<SpongePaletteEntry | undefined> = new Array(maxIdx + 1)

  for (const [i, parsed] of entries) {
    palette[i] = parsed
  }

  const indices = VARINT(dataRaw)
  const volume = width * height * length
  const blocks: ParsedSchematic['blocks'] = []

  let minX = Infinity
  let minY = Infinity
  let minZ = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  let maxZ = -Infinity

  for (let i = 0; i < Math.min(indices.length, volume); i++) {
    const index = indices[i]

    if (index === undefined) {
      continue
    }

    const entry = palette[index]

    if (!entry || AIR.has(nameOf(entry.name))) {
      continue
    }

    const x = i % width
    const z = Math.floor(i / width) % length
    const y = Math.floor(i / (width * length))

    blocks.push([x, y, z, entry.name, entry.props])

    if (x < minX) minX = x
    if (y < minY) minY = y
    if (z < minZ) minZ = z
    if (x > maxX) maxX = x
    if (y > maxY) maxY = y
    if (z > maxZ) maxZ = z
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
