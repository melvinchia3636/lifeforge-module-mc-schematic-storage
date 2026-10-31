import type { BlockProps, ResolverOutput } from '../types'

export default function bed(
  name: string,
  _props: BlockProps
): ResolverOutput {
  const n = name.split(':').pop() ?? name

  if (n.endsWith('_bed') || n === 'bed') {
    return [[0, 0, 0, 1, 0.5625, 1]]
  }

  return null
}
