import type { SchematicEntry } from '@'
import { useQuery } from '@tanstack/react-query'

import { useModuleTranslation } from '@lifeforge/localization'
import { Box, ModalHeader, WithQuery } from '@lifeforge/ui'

import { forgeAPI } from '@/manifest'
import { summarizeMaterials } from '@/utils/materials'
import { parseSchematicBuffer } from '@/utils/schematicPreview'

import { ChecklistProgress } from './components/ChecklistProgress'
import { MaterialsTable } from './components/MaterialsTable'
import { useMaterialChecklist } from './hooks/useMaterialChecklist'

export function SchematicMaterialsModal({
  data: { entry },
  onClose
}: {
  data: { entry: SchematicEntry }
  onClose: () => void
}) {
  const { t } = useModuleTranslation()

  const { checkedMaterials, pendingMaterial, toggleMaterial } =
    useMaterialChecklist(entry)

  const materialsQuery = useQuery({
    queryKey: ['schematic-materials', entry.id, entry.file],
    queryFn: async () => {
      const response = await fetch(forgeAPI.getMedia({ key: entry.file }))

      if (!response.ok) {
        throw new Error('Failed to load the schematic file')
      }

      const parsed = await parseSchematicBuffer(await response.arrayBuffer())

      return summarizeMaterials(parsed)
    },
    staleTime: Infinity
  })

  const totalItems = (materialsQuery.data ?? []).reduce(
    (sum, material) => sum + material.count,
    0
  )

  return (
    <Box minWidth="50vw" width="100%">
      <ModalHeader
        icon="tabler:package"
        subtitle={
          <>
            {entry.name}
            {materialsQuery.data && materialsQuery.data.length > 0 && (
              <>
                {' · '}
                {t('materials.summary', {
                  types: materialsQuery.data.length,
                  blocks: totalItems.toLocaleString()
                })}
              </>
            )}
          </>
        }
        title="modals.materials"
        onClose={onClose}
      />
      <WithQuery query={materialsQuery}>
        {materials => {
          const gatheredCount = materials.filter(material =>
            checkedMaterials.has(material.id)
          ).length

          return (
            <>
              {materials.length > 0 && (
                <ChecklistProgress
                  checked={gatheredCount}
                  total={materials.length}
                />
              )}
              <MaterialsTable
                checkedMaterials={checkedMaterials}
                materials={materials}
                pendingMaterial={pendingMaterial}
                onToggle={toggleMaterial}
              />
            </>
          )
        }}
      </WithQuery>
    </Box>
  )
}
