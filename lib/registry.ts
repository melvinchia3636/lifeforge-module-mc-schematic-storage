import { FULL } from './geometry'
import { resolvers } from './shapes'
import type { BlockProps, Shape } from './types'

const cache = new Map<string, Shape>()

/** Shape for a block state: { boxes, yaw } (full cube fallback). */
export function resolve(name: string, props: BlockProps): Shape {
  const key = name + '|' + JSON.stringify(props)
  const hit = cache.get(key)

  if (hit) {
    return hit
  }

  for (const fn of resolvers) {
    const out = fn(name, props)

    if (out) {
      const shape = Array.isArray(out) ? { boxes: out, yaw: 0 } : out

      cache.set(key, shape)

      return shape
    }
  }

  const shape: Shape = { boxes: [FULL], yaw: 0 }

  cache.set(key, shape)

  return shape
}
