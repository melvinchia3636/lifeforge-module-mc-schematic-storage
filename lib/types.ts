export type Vec3 = [number, number, number]

export type Box = [number, number, number, number, number, number]

export type BlockProps = Record<string, string>

export type Block = [number, number, number, string, BlockProps]

export interface ParsedSchematic {
  size: [number, number, number]
  blocks: Block[]
}

export interface Tilt {
  axis?: 'x' | 'y' | 'z'
  angle: number
  origin?: Vec3
}

export interface ShapeBox {
  box: Box
  tilt?: Tilt
}

export type BoxEntry = Box | ShapeBox

export interface Shape {
  boxes: BoxEntry[]
  yaw?: number
  flipX?: number
}

export type ResolverOutput = Shape | Box[] | null

export type Resolver = (name: string, props: BlockProps) => ResolverOutput

export interface Face {
  c: [Vec3, Vec3, Vec3, Vec3]
  n: Vec3
  d: number
}

export interface Scene {
  data: Float32Array
  faces: number
  stride: number
  quads: Face[]
}
