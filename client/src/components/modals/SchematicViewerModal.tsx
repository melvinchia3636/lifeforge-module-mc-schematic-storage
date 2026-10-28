import { useQuery } from '@tanstack/react-query'

import type { SchematicEntry } from '@'
import {
  Box,
  ModalHeader,
  WithQuery
} from '@lifeforge/ui'

import { SchematicViewer } from '@/components/SchematicViewer'
import { forgeAPI } from '@/manifest'
import { parseSchematicBuffer } from '@/utils/schematicPreview'

export function SchematicViewerModal({
  data: { entry },
  onClose
}: {
  data: { entry: SchematicEntry }
  onClose: () => void
}) {
  const parsedQuery = useQuery({
    queryKey: ['schematic-parsed', entry.id, entry.file],
    queryFn: async () => {
      const response = await fetch(forgeAPI.getMedia({ key: entry.file }))

      if (!response.ok) {
        throw new Error('Failed to load the schematic file')
      }

      return await parseSchematicBuffer(await response.arrayBuffer())
    },
    staleTime: Infinity
  })

  return (
    <Box minWidth="50vw" width="100%">
      <ModalHeader
        icon="tabler:eye"
        subtitle={entry.name}
        title="modals.viewer"
        onClose={onClose}
      />
      <WithQuery query={parsedQuery}>
        {parsed => <SchematicViewer parsed={parsed} />}
      </WithQuery>
    </Box>
  )
}
