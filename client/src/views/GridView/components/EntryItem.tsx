import type { SchematicEntry } from '@'
import dayjs from 'dayjs'

import { useModuleTranslation } from '@lifeforge/localization'
import { Card, Flex, Icon, TagChip, Text } from '@lifeforge/ui'

import { SchematicActions } from '@/components/SchematicActions'
import { SchematicPreview } from '@/components/SchematicPreview'
import formatBytes from '@/utils/formatBytes'
import { DEFAULT_FORMAT, FORMAT_META } from '@/utils/formatMeta'

function EntryItem({ entry }: { entry: SchematicEntry }) {
  const { t } = useModuleTranslation()

  const format = FORMAT_META[entry.format] ?? DEFAULT_FORMAT

  return (
    <Card gap="md">
      <SchematicPreview entry={entry} />
      <Flex
        align="center"
        gap="sm"
        justify="between"
        minWidth="0"
        mt="xs"
        width="100%"
      >
        <Flex direction="column" gap="xs" minWidth="0" width="100%">
          <TagChip
            as="span"
            color={format.color}
            label={t(format.label)}
            mb="sm"
            size="sm"
            width="min-content"
          />
          <Text truncate as="h3" size="lg" weight="semibold">
            {entry.name}
          </Text>
          <Flex align="center" gap="xs" minWidth="0" mt="xs" wrap="wrap">
            <Text color="muted" size="sm">
              {formatBytes(entry.file_size)}
            </Text>
            <Icon color="muted" icon="tabler:circle-filled" size="0.25em" />
            <Text color="muted" size="sm">
              {dayjs(entry.created).format('D MMM YYYY')}
            </Text>
          </Flex>
        </Flex>
        <SchematicActions entry={entry} />
      </Flex>
    </Card>
  )
}

export default EntryItem
