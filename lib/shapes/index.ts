// Resolver order = matching precedence. Add a module here for a new family.
import attachable from './attach'
import decoration from './decor'
import { door, ladder, trapdoor } from './door'
import { fence, fenceGate } from './fence'
import pane from './pane'
import redstoneWire, {
  daylightDetector,
  pistonHead,
  rail,
  repeater,
  tripwire,
  tripwireHook
} from './redstone'
import shelf from './shelf'
import sign from './sign'
import slab from './slab'
import stairs from './stairs'
import torch from './torch'
import wall from './wall'
import type { Resolver } from '../types'

export const resolvers: Resolver[] = [
  redstoneWire,
  repeater,
  pistonHead,
  daylightDetector,
  tripwire,
  tripwireHook,
  rail,
  slab,
  stairs,
  fenceGate,
  fence,
  wall,
  pane,
  torch,
  trapdoor,
  door,
  ladder,
  attachable,
  decoration,
  shelf,
  sign
]
