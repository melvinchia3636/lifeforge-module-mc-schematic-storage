import { useModuleTranslation } from '@lifeforge/localization'
import {
  Box,
  Checkbox,
  EmptyStateScreen,
  Flex,
  IconTooltip,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text
} from '@lifeforge/ui'

import { MaterialIcon } from '@/components/modals/SchematicMaterialsModal/components/MaterialIcon'
import formatMaterialCount from '@/utils/formatMaterialCount'
import type { MaterialCount } from '@/utils/materials'
import { getMaterialName } from '@/utils/mcAssets'

export function MaterialsTable({
  checkedMaterials,
  materials,
  pendingMaterial,
  onToggle
}: {
  checkedMaterials: Set<string>
  materials: MaterialCount[]
  pendingMaterial: string | null
  onToggle: (material: string, checked: boolean) => void
}) {
  const { t } = useModuleTranslation()

  if (materials.length === 0) {
    return (
      <EmptyStateScreen
        smaller
        icon="tabler:package-off"
        message={{ id: 'materials' }}
        py="2xl"
      />
    )
  }

  return (
    <Box maxHeight="60vh" overflowY="auto">
      <Table width="100%">
        <TableHeader>
          <TableRow>
            <TableHeaderCell align="left">
              {t('materials.material')}
            </TableHeaderCell>
            <TableHeaderCell align="right">
              {t('materials.count')}
            </TableHeaderCell>
            <TableHeaderCell nowrap align="center" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {materials.map(material => {
            const isChecked = checkedMaterials.has(material.id)

            return (
              <TableRow key={material.id}>
                <TableCell>
                  <Flex align="center" gap="sm" minWidth="0">
                    <MaterialIcon id={material.id} />
                    <Text
                      truncate
                      color={isChecked ? 'muted' : 'inherit'}
                      decoration={isChecked ? 'line-through' : 'none'}
                    >
                      {getMaterialName(material.id)}
                    </Text>
                  </Flex>
                </TableCell>
                <TableCell nowrap align="right">
                  <Flex align="center" gap="sm" justify="end">
                    <Text
                      color={isChecked ? 'muted' : 'inherit'}
                      decoration={isChecked ? 'line-through' : 'none'}
                      weight="medium"
                    >
                      {material.count.toLocaleString()}
                    </Text>
                    <IconTooltip
                      icon="tabler:info-circle"
                      iconProps={{ size: '1em' }}
                      id={`material-${material.id}`}
                    >
                      {formatMaterialCount(material.count)}
                    </IconTooltip>
                  </Flex>
                </TableCell>
                <TableCell nowrap align="center">
                  <Flex justify="center">
                    <Checkbox
                      checked={isChecked}
                      disabled={pendingMaterial !== null}
                      onCheckedChange={checked => {
                        onToggle(material.id, checked)
                      }}
                    />
                  </Flex>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </Box>
  )
}
