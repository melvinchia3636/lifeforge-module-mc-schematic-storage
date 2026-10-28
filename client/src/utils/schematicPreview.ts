import { parseSchematic } from '../../../lib/parse'
import { blocksToSvg } from '../../../lib/svg'
import type { ParsedSchematic } from '../../../lib/types'

export type { ParsedSchematic }

/** Parse a schematic file entirely in the browser, for the preview. */
export async function parseSchematicFile(
  file: File
): Promise<ParsedSchematic> {
  return await parseSchematic(await file.arrayBuffer())
}

/** Parse an already-fetched schematic buffer, for the preview. */
export async function parseSchematicBuffer(
  buffer: ArrayBuffer
): Promise<ParsedSchematic> {
  return await parseSchematic(buffer)
}

/**
 * Render the transient upload preview. Rotation is measured in 45° steps from
 * the default three-quarter view, so `rotation` is 0–7.
 */
export function generateSchematicPreview(
  parsed: ParsedSchematic,
  rotation: number
): string {
  return blocksToSvg(parsed, {
    size: 512,
    background: false,
    fit: 'bounds',
    margin: 0.02,
    tight: true,
    tightPadding: 0.04,
    yaw: Math.PI / 4 + (rotation * Math.PI) / 4
  })
}
