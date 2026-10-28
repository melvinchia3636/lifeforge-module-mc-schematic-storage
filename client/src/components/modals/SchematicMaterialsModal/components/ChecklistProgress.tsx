import { useModuleTranslation } from '@lifeforge/localization'
import { Box, Flex, Text } from '@lifeforge/ui'

export function ChecklistProgress({
  checked,
  total
}: {
  checked: number
  total: number
}) {
  const { t } = useModuleTranslation()

  const percentage = total === 0 ? 0 : (checked / total) * 100

  return (
    <Box mb="md" width="100%">
      <Flex align="center" justify="between" mb="xs">
        <Text color="muted" size="sm" weight="medium">
          {t('materials.gathered')}
        </Text>
        <Text size="sm" weight="medium">
          {t('materials.progress', { checked, total })}
        </Text>
      </Flex>
      <Box
        bg={{ base: 'bg-200', dark: 'bg-800' }}
        height="0.375em"
        overflow="hidden"
        r="full"
        width="100%"
      >
        <Box
          bg="primary"
          height="100%"
          r="full"
          style={{ width: `${percentage}%` }}
        />
      </Box>
    </Box>
  )
}
