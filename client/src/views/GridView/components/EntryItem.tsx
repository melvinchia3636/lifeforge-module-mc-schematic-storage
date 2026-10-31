import type { SchematicEntry } from '@'

import { useModuleTranslation } from '@lifeforge/localization'
import { Box, Card, Flex, TagChip, Text } from '@lifeforge/ui'

import { SchematicActions } from '@/components/SchematicActions'
import { SchematicEntryButtons } from '@/components/SchematicEntryButtons'
import { SchematicMetadata } from '@/components/SchematicMetadata'
import { SchematicPreview } from '@/components/SchematicPreview'
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
          <Text truncate as="h3" size="xl" weight="semibold">
            {entry.name}
          </Text>
          <SchematicMetadata entry={entry} />
        </Flex>
      </Flex>
      <SchematicEntryButtons entry={entry} type="grid" />
      <Box position="absolute" right="1em" top="1em">
        <SchematicActions entry={entry} />
      </Box>
    </Card>
  )
}

export default EntryItem
