import { parseAsInteger, parseAsString, useQueryState } from 'nuqs'

export default function useFilter() {
  const [searchQuery, setSearchQuery] = useQueryState(
    'q',
    parseAsString.withDefault('')
  )

  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1))

  const updateSearchQuery = (value: string) => {
    setSearchQuery(value)
    setPage(1)
  }

  return {
    searchQuery,
    updateSearchQuery,
    page,
    setPage
  }
}
