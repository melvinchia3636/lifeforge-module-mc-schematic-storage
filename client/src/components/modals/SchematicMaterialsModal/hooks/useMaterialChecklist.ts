import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'

import type { SchematicEntry } from '@'
import { useModuleTranslation } from '@lifeforge/localization'
import { toast } from '@lifeforge/ui'

import { forgeAPI } from '@/manifest'

function toCheckedSet(
  materials: SchematicEntry['checked_materials']
): Set<string> {
  if (!Array.isArray(materials)) {
    return new Set()
  }

  return new Set(
    materials.filter((material): material is string => typeof material === 'string')
  )
}

export function useMaterialChecklist(entry: SchematicEntry) {
  const { t } = useModuleTranslation()
  const queryClient = useQueryClient()

  const [checkedMaterials, setCheckedMaterials] = useState(
    () => toCheckedSet(entry.checked_materials)
  )

  const [pendingMaterial, setPendingMaterial] = useState<string | null>(null)

  const { mutateAsync } = useMutation(
    forgeAPI.schematics.setCheckedMaterial
      .input({ id: entry.id })
      .mutationOptions({
        onSuccess: updated => {
          setCheckedMaterials(toCheckedSet(updated.checked_materials))
          void queryClient.invalidateQueries({
            queryKey: forgeAPI.schematics.key
          })
        }
      })
  )

  const toggleMaterial = useCallback(
    async (material: string, checked: boolean) => {
      if (pendingMaterial !== null) {
        return
      }

      const previous = checkedMaterials
      const next = new Set(previous)

      if (checked) {
        next.add(material)
      } else {
        next.delete(material)
      }

      setCheckedMaterials(next)
      setPendingMaterial(material)

      try {
        await mutateAsync({ material, checked })
      } catch {
        setCheckedMaterials(previous)
        toast.error(t('messages.checklistFailed'))
      } finally {
        setPendingMaterial(null)
      }
    },
    [checkedMaterials, mutateAsync, pendingMaterial, t]
  )

  return {
    checkedMaterials,
    pendingMaterial,
    toggleMaterial
  }
}
