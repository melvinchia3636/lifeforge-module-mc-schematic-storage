import {
  createRenderer,
  type CameraOptions,
  type Renderer,
  type RendererOptions,
  renderScene
, buildScene, blocksToSvg, sceneToSvg, type SvgOptions } from './render'
import { parseSchematic } from './parse'
import type { ParsedSchematic } from './types'

export type { ParsedSchematic } from './types'

export type { Scene, Box, Block, BlockProps, Shape, Vec3 } from './types'

export type { CameraOptions, Renderer, RendererOptions } from './render'

export type { SvgOptions } from './render'

/** Alias kept for callers that only deal with litematic files. */
export { parseLitematic, parseSchematic } from './parse'

/** Build a reusable renderer for parsed geometry (drag/zoom by calling draw). */
export function createSchematicRenderer(
  parsed: ParsedSchematic,
  canvas: HTMLCanvasElement,
  options: RendererOptions = {}
): Renderer {
  return createRenderer(canvas, buildScene(parsed), options)
}

/** Render once with the default isometric camera. */
export function renderLitematic(
  parsed: ParsedSchematic,
  canvas: HTMLCanvasElement,
  options: RendererOptions & CameraOptions = {}
): HTMLCanvasElement {
  return renderScene(buildScene(parsed), canvas, options)
}

/** One-shot: buffer in, canvas out. */
export async function draw(
  buffer: ArrayBuffer,
  canvas: HTMLCanvasElement,
  options: RendererOptions & CameraOptions = {}
): Promise<ParsedSchematic> {
  const parsed = await parseSchematic(buffer)

  renderLitematic(parsed, canvas, options)

  return parsed
}

export { createRenderer, sceneToSvg }

/** Vector preview: parsed blocks -> SVG string (no canvas/WebGL needed). */
export function renderSvg(
  parsed: ParsedSchematic,
  options: SvgOptions = {}
): string {
  return blocksToSvg(parsed, options)
}

/** Vector preview straight from a buffer. */
export async function drawSvg(
  buffer: ArrayBuffer,
  options: SvgOptions = {}
): Promise<string> {
  return renderSvg(await parseSchematic(buffer), options)
}
