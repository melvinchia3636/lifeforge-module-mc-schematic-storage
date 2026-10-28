import { regionsToBlocks } from './litematic'
import { loadLitematicNbt } from './nbt'
import { isSponge, spongeToBlocks } from './schem'
import type { ParsedSchematic } from './types'

/** Parse a .litematic or .schem ArrayBuffer into { size, blocks }. */
export async function parseSchematic(
  buffer: ArrayBuffer
): Promise<ParsedSchematic> {
  const nbt = await loadLitematicNbt(buffer)

  if (nbt.Regions || nbt.regions) {
    return regionsToBlocks(nbt)
  }

  if (isSponge(nbt)) {
    const parsed = spongeToBlocks(nbt)

    if (parsed) {
      return parsed
    }
  }

  throw new Error(
    'unsupported schematic: no Regions (litematic) or Schematic (schem) tag'
  )
}

/** Alias kept for callers that only deal with litematic files. */
export const parseLitematic = parseSchematic
