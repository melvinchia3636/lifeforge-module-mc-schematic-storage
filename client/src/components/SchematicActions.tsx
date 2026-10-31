import type { SchematicEntry } from '@'
import { useState } from 'react'

import { useForgeMutation } from '@lifeforge/api'
import { useModuleTranslation } from '@lifeforge/localization'
import {
  ConfirmationModal,
  ContextMenu,
  ContextMenuItem,
  toast,
  useModalStore
} from '@lifeforge/ui'

import { ModifySchematicModal } from '@/components/modals/ModifySchematicModal'
import { forgeAPI } from '@/manifest'
import { downloadSchematicRender } from '@/utils/downloadSchematicRender'

export function SchematicActions({ entry }: { entry: SchematicEntry }) {
  const { t } = useModuleTranslation()
  const { open } = useModalStore()
  const [downloadingRender, setDownloadingRender] = useState(false)

  const removeMutation = useForgeMutation(
    forgeAPI.schematics.remove.input({ id: entry.id }),
    {
      action: 'delete',
      queryKey: forgeAPI.schematics.key,
      onSuccess: () => {
        toast.success(t('messages.deleted'))
      }
    }
  )

  const handleDownload = () => {
    window.open(
      forgeAPI.getMedia({ key: entry.file, download: 'true' }),
      '_blank'
    )
  }

  const handleDownloadRender = async () => {
    setDownloadingRender(true)

    try {
      await downloadSchematicRender(entry, {
        background: '#ffffff',
        lineColor: '#000000'
      })
    } catch {
      toast.error(t('messages.renderDownloadFailed'))
    } finally {
      setDownloadingRender(false)
    }
  }

  const handleEdit = () => {
    open(ModifySchematicModal, { initialData: entry })
  }

  const handleDelete = () => {
    open(ConfirmationModal, {
      title: t('deleteConfirmation.title'),
      description: t('deleteConfirmation.description', { name: entry.name }),
      confirmationButton: 'delete',
      onConfirm: async () => {
        await removeMutation.mutateAsync({})
      }
    })
  }

  return (
    <ContextMenu componentProps={{ button: { 'aria-label': 'More actions' } }}>
      <ContextMenuItem
        icon="tabler:download"
        label="Download"
        onClick={handleDownload}
      />
      <ContextMenuItem
        icon="tabler:photo-down"
        label={t('buttons.downloadRender')}
        loading={downloadingRender}
        shouldCloseMenuOnClick={false}
        onClick={handleDownloadRender}
      />
      <ContextMenuItem
        icon="tabler:pencil"
        label="Edit"
        onClick={handleEdit}
      />
      <ContextMenuItem
        dangerous
        icon="tabler:trash"
        label="Delete"
        onClick={handleDelete}
      />
    </ContextMenu>
  )
}
