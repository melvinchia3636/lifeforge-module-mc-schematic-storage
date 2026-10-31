// Shared helpers for redstone shape resolvers.

import { TURN_STD, prop } from '../geometry'
import type { BlockProps } from '../../types'

export const nameOf = (name: string): string => name.split(':').pop() ?? name

export const facingTurns = (
  props: BlockProps,
  table: Record<string, number> = TURN_STD
): number => table[prop(props, 'facing', 'north')] ?? 0

// repeaters/comparators/tripwire hooks are authored facing south at y=0
export const towardWall = (props: BlockProps): number =>
  (facingTurns(props) + 180) % 360
