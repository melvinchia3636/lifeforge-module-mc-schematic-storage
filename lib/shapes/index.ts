// Resolver order = matching precedence. Add a module here for a new family.
import attachable from './attach'
import banner from './banner'
import barrel from './barrel'
import bed from './bed'
import carpet from './carpet'
import chain from './chain'
import chest from './chest'
import daylightDetector from './redstone/daylightDetector'
import { door, ladder, trapdoor } from './door'
import { fence, fenceGate } from './fence'
import hopper from './hopper'
import lantern from './lantern'
import pane from './pane'
import pistonHead from './redstone/pistonHead'
import pressurePlate from './pressurePlate'
import rail from './redstone/rail'
import redstoneWire from './redstone/redstoneWire'
import repeater from './redstone/repeater'
import shelf from './shelf'
import sign from './sign'
import slab from './slab'
import snow from './snow'
import stairs from './stairs'
import torch from './torch'
import { tripwire, tripwireHook } from './redstone/tripwire'
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
  banner,
  carpet,
  pressurePlate,
  snow,
  barrel,
  chest,
  lantern,
  hopper,
  bed,
  chain,
  shelf,
  sign
]
