import type { SchematicEntry } from '@'

import { useModuleTranslation } from '@lifeforge/localization'
import { Box, Card, Flex, Grid, TagChip, Text } from '@lifeforge/ui'

import { SchematicActions } from '@/components/SchematicActions'
import { SchematicEntryButtons } from '@/components/SchematicEntryButtons'
import { SchematicMetadata } from '@/components/SchematicMetadata'
import { SchematicPreview } from '@/components/SchematicPreview'
import { DEFAULT_FORMAT, FORMAT_META } from '@/utils/formatMeta'

function EntryItem({ entry }: { entry: SchematicEntry }) {
  const { t } = useModuleTranslation()

  const format = FORMAT_META[entry.format] ?? DEFAULT_FORMAT

  return (
    <Card
      align="center"
      direction="row"
      gap="md"
      minWidth="0"
      p="md"
      width="100%"
    >
      <Grid
        gap="md"
        templateCols={{
          base: '8em 1fr',
          md: '8em 1fr max-content'
        }}
        width="100%"
      >
        <Box gridArea={{ base: '1 / 1 / 2 / 2', md: '1 / 1 / 3 / 2' }}>
          <SchematicPreview entry={entry} />
        </Box>
        <Flex
          align="start"
          display={{ base: 'flex', md: 'none' }}
          gridArea="1 / 2 / 2 / 3"
          justify="end"
        >
          <SchematicActions entry={entry} />
        </Flex>
        <Flex
          direction="column"
          gridArea={{ base: '2 / 1 / 3 / 3', md: '1 / 2 / 3 / 3' }}
          justify="center"
          minWidth="0"
        >
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
        <Flex
          align="center"
          gap="sm"
          gridArea={{ base: '3 / 1 / 4 / 3', md: '1 / 3 / 3 / 4' }}
          justify="end"
          mt={{ base: 'lg', md: 'none' }}
          width="100%"
        >
          <Box flex="1" minWidth="0">
            <SchematicEntryButtons entry={entry} type="list" />
          </Box>
          <Box display={{ base: 'none', md: 'block' }}>
            <SchematicActions entry={entry} />
          </Box>
        </Flex>
      </Grid>
    </Card>
  )
}

export default EntryItem
