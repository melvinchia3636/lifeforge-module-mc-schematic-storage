import type { BlockProps, ResolverOutput } from '../types'

export default function pressurePlate(
  name: string,
  _props: BlockProps
): ResolverOutput {
  const n = name.split(':').pop() ?? name

  if (n.endsWith('_pressure_plate') || n === 'pressure_plate') {
    return [[0.0625, 0, 0.0625, 0.9375, 0.0625, 0.9375]]
  }

  return null
}
