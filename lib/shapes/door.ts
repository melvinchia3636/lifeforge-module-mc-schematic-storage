import { TURN_DOOR, TURN_STD, prop, rotY } from '../geometry'
import type { BlockProps, ResolverOutput } from '../types'

export function trapdoor(
  name: string,
  props: BlockProps
): ResolverOutput {
  const n = name.split(':').pop() ?? name

  if (!(n.endsWith('_trapdoor') || n === 'trapdoor')) {
    return null
  }

  if (prop(props, 'open') === 'true') {
    return [
      rotY(
        [0, 0, 0.8125, 1, 1, 1],
        TURN_STD[prop(props, 'facing', 'north')] ?? 0
      )
    ]
  }

  if (prop(props, 'half', 'bottom') === 'top') {
    return [[0, 0.8125, 0, 1, 1, 1]]
  }

  return [[0, 0, 0, 1, 0.1875, 1]]
}

export function door(name: string, props: BlockProps): ResolverOutput {
  const n = name.split(':').pop() ?? name

  if (!(n.endsWith('_door') || n === 'door')) {
    return null
  }

  let turns = TURN_DOOR[prop(props, 'facing', 'east')] ?? 0

  if (prop(props, 'open') === 'true') {
    turns = (turns + 90) % 360
  }

  return [rotY([0, 0, 0, 0.1875, 1, 1], turns)]
}

export function ladder(name: string, props: BlockProps): ResolverOutput {
  const n = name.split(':').pop() ?? name

  if (!(n.endsWith('_ladder') || n === 'ladder')) {
    return null
  }

  return [
    rotY(
      [0, 0, 0.9375, 1, 1, 1],
      TURN_STD[prop(props, 'facing', 'north')] ?? 0
    )
  ]
}
