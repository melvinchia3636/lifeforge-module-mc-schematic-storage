import { count, desc, eq, ilike } from 'drizzle-orm'
import { createSelectSchema } from 'drizzle-orm/zod'
import type { Readable } from 'node:stream'
import z from 'zod'

import { parseSchematic } from '../../lib/parse'
import { summarizeMaterials } from '../../lib/materials'
import { blocksToSvg } from '../../lib/svg'
import forge from '../forge'
import { schematicEntries } from '../schema.drizzle'

const schematicDto = createSelectSchema(schematicEntries)

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = []

  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk))
  }

  return Buffer.concat(chunks)
}

function renderPreview(
  parsed: Awaited<ReturnType<typeof parseSchematic>>,
  rotation: number
): string {
  return blocksToSvg(parsed, {
    size: 1024,
    background: false,
    fit: 'bounds',
    margin: 0.02,
    tight: true,
    yaw: Math.PI / 4 + (rotation * Math.PI) / 4
  })
}

export const list = forge
  .query({
    description: 'Get stored schematics with search and pagination',
    input: {
      query: z.object({
        page: z.string().optional().default('1'),
        q: z.string().optional()
      })
    },
    output: {
      OK: z.object({
        items: z.array(schematicDto),
        page: z.number(),
        perPage: z.number(),
        totalItems: z.number(),
        totalPages: z.number()
      })
    }
  })
  .callback(async ({ db, query: { page, q }, response }) => {
    const parsedPage = Math.max(1, parseInt(page, 10) || 1)

    const where = q ? ilike(schematicEntries.name, `%${q}%`) : undefined

    const items = await db
      .select()
      .from(schematicEntries)
      .where(where)
      .orderBy(desc(schematicEntries.created))
      .limit(20)
      .offset((parsedPage - 1) * 20)

    const [totalRow] = await db
      .select({ value: count() })
      .from(schematicEntries)
      .where(where)

    const totalItems = totalRow?.value ?? 0

    return response.ok({
      items,
      page: parsedPage,
      perPage: 20,
      totalItems,
      totalPages: Math.ceil(totalItems / 20)
    })
  })

export const create = forge
  .mutation({
    description: 'Upload and store a schematic file',
    input: {
      body: z.object({
        name: z.string(),
        rotation: z.number().int().min(0).max(7).optional().default(0)
      })
    },
    media: {
      file: {
        optional: false
      }
    },
    output: {
      CREATED: schematicDto
    }
  })
  .callback(
    async ({ db, body, media: { file }, core: { storage }, response }) => {
      if (typeof file === 'string') {
        return response.badRequest('A schematic file is required')
      }

      const [fileName, extension = ''] = file.originalName.split(/\.(?=[^.]+$)/)

      if (
        !['litematic', 'schem', 'schematic'].includes(extension.toLowerCase())
      ) {
        return response.badRequest(
          'Only .litematic, .schem, and .schematic files are allowed'
        )
      }

      const name = body.name.trim() || fileName || 'Untitled schematic'

      const raw = await file.read()
      const buffer = raw.buffer.slice(
        raw.byteOffset,
        raw.byteOffset + raw.byteLength
      ) as ArrayBuffer

      let preview: string
      let blockCount: number
      let materialTypes: number
      let sizeX: number
      let sizeY: number
      let sizeZ: number

      try {
        const parsed = await parseSchematic(buffer)

        preview = renderPreview(parsed, body.rotation)
        blockCount = parsed.blocks.length
        materialTypes = summarizeMaterials(parsed).length
        sizeX = parsed.size[0]
        sizeY = parsed.size[1]
        sizeZ = parsed.size[2]
      } catch (error) {
        console.error('Failed to generate schematic preview:', error)

        return response.badRequest('Could not read the schematic file')
      }

      const dimensions = preview.match(/width="(\d+)" height="(\d+)"/)
      const previewWidth = Number(dimensions?.[1] ?? 1024)
      const previewHeight = Number(dimensions?.[2] ?? 1024)

      const saved = await storage.save({ file })

      if (!saved) {
        return response.badRequest('Failed to store the schematic file')
      }

      const previewRef = await storage.save({
        file: {
          buffer: Buffer.from(preview),
          originalName: `${name}.svg`,
          mimeType: 'image/svg+xml'
        }
      })

      if (!previewRef) {
        await storage.delete(saved.key)

        return response.badRequest('Failed to store the schematic preview')
      }

      const [entry] = await db
        .insert(schematicEntries)
        .values({
          name,
          format: extension.toLowerCase(),
          rotation: body.rotation,
          file: saved.key,
          preview: previewRef.key,
          preview_width: previewWidth,
          preview_height: previewHeight,
          size_x: sizeX,
          size_y: sizeY,
          size_z: sizeZ,
          block_count: blockCount,
          material_types: materialTypes,
          file_size: file.size
        })
        .returning()

      if (!entry) {
        return response.badRequest('Failed to save the schematic')
      }

      return response.created(entry)
    }
  )

export const update = forge
  .mutation({
    description: 'Rename a schematic and regenerate its preview',
    input: {
      query: z.object({
        id: forge.existsIn(z.string(), schematicEntries, { select: true })
      }),
      body: z.object({
        name: z.string(),
        rotation: z.number().int().min(0).max(7)
      })
    },
    output: {
      OK: schematicDto
    }
  })
  .callback(
    async ({
      db,
      existing,
      query: { id },
      body,
      core: { storage },
      response
    }) => {
      const entry = existing.one(schematicEntries, id)
      const name = body.name.trim() || entry.name

      const file = await storage.get(entry.file)

      if (!file) {
        return response.badRequest('Stored schematic file not found')
      }

      let preview: string

      try {
        const raw = await streamToBuffer(file.stream)
        const buffer = raw.buffer.slice(
          raw.byteOffset,
          raw.byteOffset + raw.byteLength
        ) as ArrayBuffer

        preview = renderPreview(await parseSchematic(buffer), body.rotation)
      } catch (error) {
        console.error('Failed to generate schematic preview:', error)

        return response.badRequest('Could not read the schematic file')
      }

      const dimensions = preview.match(/width="(\d+)" height="(\d+)"/)

      const previewRef = await storage.save({
        file: {
          buffer: Buffer.from(preview),
          originalName: `${name}.svg`,
          mimeType: 'image/svg+xml'
        }
      })

      if (!previewRef) {
        return response.badRequest('Failed to store the schematic preview')
      }

      const [updated] = await db
        .update(schematicEntries)
        .set({
          name,
          rotation: body.rotation,
          preview: previewRef.key,
          preview_width: Number(dimensions?.[1] ?? 1024),
          preview_height: Number(dimensions?.[2] ?? 1024)
        })
        .where(eq(schematicEntries.id, id))
        .returning()

      if (!updated) {
        await storage.delete(previewRef.key)

        return response.badRequest('Failed to update the schematic')
      }

      if (entry.preview) {
        await storage.delete(entry.preview)
      }

      return response.ok(updated)
    }
  )

export const setCheckedMaterial = forge
  .mutation({
    description: 'Toggle a material in a schematic checklist',
    input: {
      query: z.object({
        id: forge.existsIn(z.string(), schematicEntries, { select: true })
      }),
      body: z.object({
        material: z.string().trim().min(1),
        checked: z.boolean()
      })
    },
    output: {
      OK: schematicDto
    }
  })
  .callback(async ({ db, existing, query: { id }, body, response }) => {
    const entry = existing.one(schematicEntries, id)
    const checked = new Set(entry.checked_materials)

    if (body.checked) {
      checked.add(body.material)
    } else {
      checked.delete(body.material)
    }

    const [updated] = await db
      .update(schematicEntries)
      .set({ checked_materials: [...checked].sort() })
      .where(eq(schematicEntries.id, id))
      .returning()

    if (!updated) {
      return response.badRequest('Failed to update the checklist')
    }

    return response.ok(updated)
  })

export const remove = forge
  .mutation({
    description: 'Delete a stored schematic',
    input: {
      query: z.object({
        id: forge.existsIn(z.string(), schematicEntries, { select: true })
      }),
      body: z.object({})
    },
    output: {
      NO_CONTENT: true
    }
  })
  .callback(async ({ existing, db, query: { id }, core, response }) => {
    const entry = existing.one(schematicEntries, id)

    for (const key of [entry.file, entry.preview]) {
      if (key) {
        await core.storage.delete(key)
      }
    }

    await db.delete(schematicEntries).where(eq(schematicEntries.id, id))

    return response.noContent()
  })
