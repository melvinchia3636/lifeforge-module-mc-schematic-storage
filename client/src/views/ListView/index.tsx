import type { SchematicEntry } from '@'
import { Stack } from '@lifeforge/ui'

import EntryItem from './components/EntryItem'

function ListView({ entries }: { entries: SchematicEntry[] }) {
  return (
    <Stack>
      {entries.map(entry => (
        <EntryItem key={entry.id} entry={entry} />
      ))}
    </Stack>
  )
}

export default ListView
