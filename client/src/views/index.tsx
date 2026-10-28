import type { SchematicEntry } from '@'
import { createViewMode } from '@lifeforge/ui'

import GridView from './GridView'
import ListView from './ListView'

const VIEWS = {
  grid: {
    icon: 'uil:apps',
    component: GridView
  },
  list: {
    icon: 'tabler:list',
    component: ListView
  }
} as const

export const SchematicView = createViewMode({
  modes: (Object.keys(VIEWS) as (keyof typeof VIEWS)[]).map(mode => ({
    value: mode,
    icon: VIEWS[mode].icon
  })),
  selectorProps: {
    display: 'flex'
  }
})

function Views({ entries }: { entries: SchematicEntry[] }) {
  return Object.entries(VIEWS).map(([mode, { component: Component }]) => (
    <SchematicView.When key={mode} mode={mode as keyof typeof VIEWS}>
      <Component entries={entries} />
    </SchematicView.When>
  ))
}

export default Views
