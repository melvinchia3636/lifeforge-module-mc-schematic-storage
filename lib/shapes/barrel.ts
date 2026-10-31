import type { BlockProps, ResolverOutput } from '../types'

export default function barrel(
  name: string,
  _props: BlockProps
): ResolverOutput {
  const n = name.split(':').pop() ?? name

  if (n === 'barrel') {
    return [[0.0625, 0, 0.0625, 0.9375, 0.875, 0.9375]]
  }

  return null
}
