import { useQuery } from '@tanstack/react-query'

import type { InferOutput } from '@lifeforge/api'
import {
  Button,
  EmptyStateScreen,
  FAB,
  Flex,
  ModuleHeader,
  Pagination,
  SearchInput,
  Stack,
  WithQuery,
  useModalStore
} from '@lifeforge/ui'

import { ModifySchematicModal } from '@/components/modals/ModifySchematicModal'
import useFilter from '@/hooks/useFilter'
import { forgeAPI } from '@/manifest'
import Views, { SchematicView } from '@/views'

export type SchematicEntry = InferOutput<
  typeof forgeAPI.schematics.list
>['items'][number]

export default function MCSchematicStorage() {
  const { open } = useModalStore()
  const { searchQuery, updateSearchQuery, page, setPage } = useFilter()

  const schematicsQuery = useQuery(
    forgeAPI.schematics.list
      .input({
        page: page.toString(),
        q: searchQuery.trim() || undefined
      })
      .queryOptions()
  )

  const openUploadModal = () => {
    open(ModifySchematicModal, {})
  }

  return (
    <SchematicView.Root>
      <ModuleHeader
        trailing={
          <Button
            display={{ base: 'none', md: 'flex' }}
            icon="tabler:upload"
            onClick={openUploadModal}
          >
            upload
          </Button>
        }
      />
      <FAB icon="tabler:upload" onClick={openUploadModal} />
      <Stack flex="1" gap="md">
        <Flex align="center" gap="md" width="100%">
          <Flex flex="1" minWidth="0">
            <SearchInput
              debounceMs={300}
              searchTarget="schematic"
              value={searchQuery}
              onChange={updateSearchQuery}
            />
          </Flex>
          <SchematicView.Selector />
        </Flex>
        <WithQuery query={schematicsQuery}>
          {data =>
            data.items.length === 0 ? (
              searchQuery ? (
                <EmptyStateScreen
                  icon="tabler:search"
                  message={{ id: 'result' }}
                />
              ) : (
                <EmptyStateScreen
                  icon="ph:blueprint-bold"
                  message={{ id: 'schematic' }}
                />
              )
            ) : (
              <Stack gap="md">
                <Views entries={data.items} />
                <Pagination
                  mb="lg"
                  page={data.page}
                  totalPages={data.totalPages}
                  onPageChange={setPage}
                />
              </Stack>
            )
          }
        </WithQuery>
      </Stack>
    </SchematicView.Root>
  )
}
