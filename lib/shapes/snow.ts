import { prop } from './geometry'
import type { BlockProps, ResolverOutput } from '../types'

export default function snow(name: string, props: BlockProps): ResolverOutput {
  const n = name.split(':').pop() ?? name

  if (n === 'snow') {
    const layers = parseInt(prop(props, 'layers', '1'), 10)

    return [[0, 0, 0, 1, Math.min(1, layers / 8), 1]]
  }

  return null
}
