import type { SchematicEntry } from '@'
import dayjs from 'dayjs'

import { useModuleTranslation } from '@lifeforge/localization'
import { Box, Flex, Icon, Text } from '@lifeforge/ui'

import formatBytes from '@/utils/formatBytes'

export function SchematicMetadata({ entry }: { entry: SchematicEntry }) {
  const { t } = useModuleTranslation()

  const items = [
    {
      icon: 'tabler:cube',
      key: 'blocks',
      value: entry.block_count.toLocaleString()
    },
    {
      icon: 'tabler:package',
      key: 'materialTypes',
      value: entry.material_types.toLocaleString()
    },
    {
      icon: 'tabler:database',
      key: 'fileSize',
      value: formatBytes(entry.file_size)
    },
    {
      icon: 'tabler:calendar',
      key: 'created',
      value: dayjs(entry.created).format('D MMM YYYY')
    }
  ]

  return (
    <Flex gap="md" mt="md" wrap="wrap">
      {items.map(item => (
        <Box key={item.key}>
          <Flex align="center" gap="xs" mb="xs">
            <Icon color="muted" icon={item.icon} />
            <Text color="muted" weight="medium">
              {t(`metadata.${item.key}`)}
            </Text>
          </Flex>
          <Text>{item.value}</Text>
        </Box>
      ))}
    </Flex>
  )
}
