// Turns a parsed schematic into a list of materials to gather: one entry per
// obtainable item, with variants merged and multi-block structures (doors,
// beds, tall plants) counted once.

import { isAir } from './parse/litematic'
import type { BlockProps, ParsedSchematic } from './types'

export interface MaterialCount {
  /** Item id without the `minecraft:` namespace. */
  id: string
  /** How many of this item the build needs. */
  count: number
}

/** Block ids that are placed as a different item form. */
const ALIASES: Record<string, string> = {
  farmland: 'dirt',
  dirt_path: 'dirt',
  grass_path: 'dirt',
  wall_torch: 'torch',
  soul_wall_torch: 'soul_torch',
  redstone_wall_torch: 'redstone_torch',
  redstone_wire: 'redstone',
  tripwire: 'string',
  piston_head: 'piston',
  moving_piston: 'piston',
  kelp_plant: 'kelp',
  cave_vines_plant: 'cave_vines',
  weeping_vines_plant: 'weeping_vines',
  twisting_vines_plant: 'twisting_vines',
  big_dripleaf_stem: 'big_dripleaf',
  attached_melon_stem: 'melon_seeds',
  attached_pumpkin_stem: 'pumpkin_seeds',
  melon_stem: 'melon_seeds',
  pumpkin_stem: 'pumpkin_seeds',
  candle_cake: 'cake',
  white_candle_cake: 'cake',
  orange_candle_cake: 'cake',
  magenta_candle_cake: 'cake',
  light_blue_candle_cake: 'cake',
  yellow_candle_cake: 'cake',
  lime_candle_cake: 'cake',
  pink_candle_cake: 'cake',
  gray_candle_cake: 'cake',
  light_gray_candle_cake: 'cake',
  cyan_candle_cake: 'cake',
  purple_candle_cake: 'cake',
  blue_candle_cake: 'cake',
  brown_candle_cake: 'cake',
  green_candle_cake: 'cake',
  red_candle_cake: 'cake',
  black_candle_cake: 'cake'
}

const TALL_PLANTS = new Set([
  'sunflower',
  'lilac',
  'rose_bush',
  'peony',
  'tall_grass',
  'large_fern',
  'tall_seagrass'
])

/** Blocks whose count is stored in a blockstate property. */
const STACKED: Record<string, string> = {
  candle: 'candles',
  white_candle: 'candles',
  orange_candle: 'candles',
  magenta_candle: 'candles',
  light_blue_candle: 'candles',
  yellow_candle: 'candles',
  lime_candle: 'candles',
  pink_candle: 'candles',
  gray_candle: 'candles',
  light_gray_candle: 'candles',
  cyan_candle: 'candles',
  purple_candle: 'candles',
  blue_candle: 'candles',
  brown_candle: 'candles',
  green_candle: 'candles',
  red_candle: 'candles',
  black_candle: 'candles',
  sea_pickle: 'pickles',
  turtle_egg: 'eggs'
}

const stripNamespace = (name: string): string =>
  name.startsWith('minecraft:') ? name.slice('minecraft:'.length) : name

const stripProps = (name: string): string => {
  const bracket = name.indexOf('[')

  return bracket === -1 ? name : name.slice(0, bracket)
}

/**
 * Resolves one placed block to the item that has to be gathered for it, plus
 * how many items it represents. Returns `null` for blocks that are skipped,
 * either because they are air or because they are the second half of a
 * multi-block structure.
 */
function resolveMaterial(
  name: string,
  props: BlockProps
): { id: string; amount: number } | null {
  const base = stripProps(stripNamespace(name))

  if (!base || isAir(base)) {
    return null
  }

  // Doors are two blocks but one item; count the lower half only.
  if (base.endsWith('_door') && props.half === 'upper') {
    return null
  }

  // Beds are two blocks but one item; the head is the one we count.
  if (base.endsWith('_bed') && props.part === 'foot') {
    return null
  }

  if (TALL_PLANTS.has(base) && props.half === 'upper') {
    return null
  }

  // Potted plants aren't obtainable as such; the pot is the material.
  let id = base.startsWith('potted_') ? 'flower_pot' : base

  if (base.endsWith('_wall_sign')) {
    id = base.replace('_wall_sign', '_sign')
  } else if (base.endsWith('_wall_hanging_sign')) {
    id = base.replace('_wall_hanging_sign', '_hanging_sign')
  } else if (base.endsWith('_wall_banner')) {
    id = base.replace('_wall_banner', '_banner')
  }

  id = ALIASES[id] ?? id

  if (id.endsWith('_slab') && props.type === 'double') {
    return { id, amount: 2 }
  }

  const stacked = STACKED[id]

  if (stacked) {
    const value = Number(props[stacked])

    return {
      id,
      amount: Number.isFinite(value) && value > 0 ? value : 1
    }
  }

  return { id, amount: 1 }
}

/**
 * Counts the items needed to build a schematic. Each entry is sorted by count
 * descending, then id ascending.
 */
export function summarizeMaterials(
  parsed: ParsedSchematic
): MaterialCount[] {
  const counts = new Map<string, number>()

  for (const [, , , name, props] of parsed.blocks) {
    const material = resolveMaterial(name, props)

    if (!material) {
      continue
    }

    counts.set(material.id, (counts.get(material.id) ?? 0) + material.amount)
  }

  return [...counts.entries()]
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count || a.id.localeCompare(b.id))
}
