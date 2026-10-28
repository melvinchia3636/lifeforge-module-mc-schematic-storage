export interface FormatMeta {
  label: string
  icon: string
  color: string
}

export const DEFAULT_FORMAT: FormatMeta = {
  label: 'formats.schematic',
  icon: 'tabler:archive',
  color: '#fbbf24'
}

export const FORMAT_META: Record<string, FormatMeta> = {
  litematic: {
    label: 'formats.litematic',
    icon: 'tabler:layers-intersect',
    color: '#60a5fa'
  },
  schem: { label: 'formats.schem', icon: 'tabler:box', color: '#34d399' },
  schematic: DEFAULT_FORMAT
}
