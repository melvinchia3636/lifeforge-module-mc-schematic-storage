import { FULL, prop } from '../geometry'
import type { BlockProps, ResolverOutput } from '../types'

export default function slab(
  name: string,
  props: BlockProps
): ResolverOutput {
  const n = name.split(':').pop() ?? name

  if (!(n.endsWith('_slab') || n === 'slab')) {
    return null
  }

  const t = prop(props, 'type', 'bottom')

  if (t === 'double') {
    return [FULL]
  }

  if (t === 'top') {
    return [[0, 0.5, 0, 1, 1, 1]]
  }

  return [[0, 0, 0, 1, 0.5, 1]]
}
