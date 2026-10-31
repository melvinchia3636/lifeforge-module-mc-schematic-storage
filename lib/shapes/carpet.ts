import type { BlockProps, ResolverOutput } from '../types'

export default function carpet(
  name: string,
  _props: BlockProps
): ResolverOutput {
  const n = name.split(':').pop() ?? name

  if (n.endsWith('_carpet') || n === 'carpet' || n === 'moss_carpet') {
    return [[0, 0, 0, 1, 0.0625, 1]]
  }

  return null
}
