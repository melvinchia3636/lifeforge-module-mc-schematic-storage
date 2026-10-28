import type { SchematicEntry } from '@'
import { Grid } from '@lifeforge/ui'

import EntryItem from './components/EntryItem'

function GridView({ entries }: { entries: SchematicEntry[] }) {
  return (
    <Grid
      align="start"
      gap="sm"
      mb="lg"
      templateCols={{
        base: 'repeat(auto-fill,minmax(12rem,1fr))',
        sm: 'repeat(auto-fill,minmax(16rem,1fr))'
      }}
    >
      {entries.map(entry => (
        <EntryItem key={entry.id} entry={entry} />
      ))}
    </Grid>
  )
}

export default GridView
