import type { SchematicEntry } from '@'

import { useModuleTranslation } from '@lifeforge/localization'
import { Button, Flex, useModalStore } from '@lifeforge/ui'

import { SchematicMaterialsModal } from '@/components/modals/SchematicMaterialsModal'
import { SchematicViewerModal } from '@/components/modals/SchematicViewerModal'

export function SchematicEntryButtons({
  entry,
  type
}: {
  entry: SchematicEntry
  type: 'grid' | 'list'
}) {
  const { t } = useModuleTranslation()
  const { open } = useModalStore()

  return (
    <Flex
      align={type === 'grid' ? 'stretch' : { base: 'stretch', md: 'center' }}
      direction={type === 'grid' ? 'column' : { base: 'column', md: 'row' }}
      flexShrink="0"
      gap="sm"
      minWidth="0"
      width={type === 'grid' ? '100%' : { base: '100%', md: 'auto' }}
    >
      <Button
        flexShrink="0"
        icon="tabler:eye"
        namespace={false}
        variant="secondary"
        width={{ base: '100%', md: type === 'grid' ? '100%' : 'auto' }}
        onClick={() => {
          open(SchematicViewerModal, { entry })
        }}
      >
        {t('buttons.view')}
      </Button>
      <Button
        flexShrink="0"
        icon="tabler:package"
        namespace={false}
        variant="secondary"
        width={{ base: '100%', md: type === 'grid' ? '100%' : 'auto' }}
        onClick={() => {
          open(SchematicMaterialsModal, { entry })
        }}
      >
        {t('buttons.materials')}
      </Button>
    </Flex>
  )
}
