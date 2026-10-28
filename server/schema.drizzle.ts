import { type RelationsBuilder } from 'drizzle-orm'
import { integer, text, timestamp, uuid } from 'drizzle-orm/pg-core'

import { createModuleTable } from '@lifeforge/drizzle'

const pgTable = createModuleTable()

export const schematicEntries = pgTable('schematics', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().default(''),
  format: text('format').notNull().default(''),
  file: text('file').notNull().default(''),
  preview: text('preview').notNull().default(''),
  rotation: integer('rotation').notNull().default(0),
  preview_width: integer('preview_width').notNull().default(0),
  preview_height: integer('preview_height').notNull().default(0),
  file_size: integer('file_size').notNull().default(0),
  created: timestamp('created', { mode: 'date' }).defaultNow().notNull()
})

export const tables = {
  schematics: schematicEntries
}

export const relations = (_r: RelationsBuilder<typeof tables>) => ({})
