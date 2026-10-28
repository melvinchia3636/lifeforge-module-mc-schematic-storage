const SCHEMATIC_FORMATS = ['litematic', 'schem', 'schematic'] as const

export type SchematicFormat = (typeof SCHEMATIC_FORMATS)[number]

export function getSchematicFormat(fileName: string): SchematicFormat | null {
  const extension = fileName.split('.').pop()?.toLowerCase() ?? ''

  return SCHEMATIC_FORMATS.includes(extension as SchematicFormat)
    ? (extension as SchematicFormat)
    : null
}

export default getSchematicFormat
