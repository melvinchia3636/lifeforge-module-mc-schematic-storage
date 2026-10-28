import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import z from 'zod'

import type { SchematicEntry } from '@'
import { useForgeMutation } from '@lifeforge/api'
import { useModuleTranslation } from '@lifeforge/localization'
import {
  Box,
  FileField,
  type FileValue,
  Flex,
  FormModal,
  Icon,
  SliderInput,
  TextField,
  createDefaultValues,
  fileValueSchema,
  toast
} from '@lifeforge/ui'

import { SchematicPreviewFrame } from '@/components/SchematicPreview'
import { forgeAPI } from '@/manifest'
import readSchematicName from '@/utils/readSchematicName'
import getSchematicFormat from '@/utils/schematicFormat'
import {
  generateSchematicPreview,
  parseSchematicBuffer,
  parseSchematicFile,
  type ParsedSchematic
} from '@/utils/schematicPreview'

const schema = z.object({
  name: z.string().min(1, 'Required'),
  file: fileValueSchema.optional()
})

type SchematicForm = z.infer<typeof schema>

const ROTATION_STEP = 45

export function ModifySchematicModal({
  data: { initialData },
  onClose
}: {
  data: { initialData?: SchematicEntry }
  onClose: () => void
}) {
  const { t } = useModuleTranslation()

  const isUpdate = Boolean(initialData)

  const lastAutoName = useRef('')
  const [parsed, setParsed] = useState<ParsedSchematic | null>(null)
  const [rotation, setRotation] = useState(initialData?.rotation ?? 0)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [fileLoaded, setFileLoaded] = useState(!isUpdate)
  const previewUrlRef = useRef<string | null>(null)

  const form = useForm<SchematicForm>({
    defaultValues: {
      ...createDefaultValues(schema),
      ...(initialData ? { name: initialData.name } : {})
    },
    resolver: zodResolver(schema)
  })

  const createMutation = useForgeMutation(forgeAPI.schematics.create, {
    action: 'create',
    queryKey: forgeAPI.schematics.key,
    onSuccess: () => {
      toast.success(t('messages.uploaded'))
      onClose()
    }
  })

  const updateMutation = useForgeMutation(
    forgeAPI.schematics.update.input({ id: initialData?.id ?? '' }),
    {
      action: 'update',
      queryKey: forgeAPI.schematics.key,
      onSuccess: () => {
        toast.success(t('messages.updated'))
        onClose()
      }
    }
  )

  useEffect(() => {
    if (!initialData) {
      return
    }

    const abortController = new AbortController()

    void (async () => {
      try {
        const response = await fetch(
          forgeAPI.getMedia({ key: initialData.file }),
          { signal: abortController.signal }
        )
        const buffer = await response.arrayBuffer()

        setParsed(await parseSchematicBuffer(buffer))
      } catch {
        // The preview simply stays empty if the stored file cannot be read.
      } finally {
        if (!abortController.signal.aborted) {
          setFileLoaded(true)
        }
      }
    })()

    return () => {
      abortController.abort()
    }
  }, [initialData])

  useEffect(() => {
    if (!parsed) {
      const current = previewUrlRef.current

      previewUrlRef.current = null
      setPreviewUrl(null)
      setPreviewLoading(false)

      if (current) {
        URL.revokeObjectURL(current)
      }

      return
    }

    let cancelled = false

    setPreviewLoading(true)

    const timer = window.setTimeout(() => {
      try {
        const svg = generateSchematicPreview(parsed, rotation)
        const nextUrl = URL.createObjectURL(
          new Blob([svg], { type: 'image/svg+xml' })
        )

        if (cancelled) {
          URL.revokeObjectURL(nextUrl)

          return
        }

        const previousUrl = previewUrlRef.current

        previewUrlRef.current = nextUrl
        setPreviewUrl(nextUrl)

        if (previousUrl) {
          URL.revokeObjectURL(previousUrl)
        }
      } finally {
        if (!cancelled) {
          setPreviewLoading(false)
        }
      }
    }, 0)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [parsed, rotation])

  useEffect(
    () => () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
      }
    },
    []
  )

  const handleFileChange = useCallback(
    async (value: FileValue) => {
      setParsed(null)
      setPreviewUrl(null)
      setRotation(0)

      if (value.type === 'empty') {
        form.setValue('name', '')
      }

      if (value.type !== 'upload') {
        return
      }

      if (!getSchematicFormat(value.file.name)) {
        toast.error(t('messages.unsupportedFormat'))
        form.setValue('file', { type: 'empty' })

        return
      }

      const fallbackName = value.file.name.replace(/\.[^.]+$/, '')

      let suggestedName: string

      try {
        suggestedName = (await readSchematicName(value.file)) ?? fallbackName
      } catch {
        suggestedName = fallbackName
      }

      const currentName = form.getValues('name')

      if (!currentName.trim() || currentName === lastAutoName.current) {
        form.setValue('name', suggestedName, { shouldValidate: true })
        lastAutoName.current = suggestedName
      }

      try {
        setParsed(await parseSchematicFile(value.file))
      } catch {
        setParsed(null)
      }
    },
    [form, t]
  )

  const handleSubmit = async (data: SchematicForm) => {
    const name = data.name.trim()

    if (isUpdate) {
      await updateMutation.mutateAsync({ name, rotation })

      return
    }

    if (!data.file || data.file.type !== 'upload') {
      toast.error(t('messages.fileRequired'))

      return
    }

    await createMutation.mutateAsync({
      name,
      rotation,
      file: data.file.file
    })
  }

  return (
    <FormModal
      form={form}
      submissionConfig={{
        template: isUpdate ? 'update' : 'create',
        handler: handleSubmit
      }}
      uiConfig={{
        icon: isUpdate ? 'tabler:pencil' : 'tabler:upload',
        title: isUpdate ? 'modals.modify' : 'modals.upload',
        onClose
      }}
    >
      {!isUpdate && (
        <FileField
          required
          control={form.control}
          icon="ph:blueprint-bold"
          label="inputs.file"
          mimeTypes={{
            application: ['litematic', 'schem', 'schematic', 'gzip']
          }}
          name="file"
          onChange={handleFileChange}
        />
      )}
      {(parsed || previewLoading || isUpdate) && (
        <Flex direction="column" gap="sm" width="100%">
          <Flex justify="center" width="100%">
            <Box maxWidth="16em" width="100%">
              {!previewUrl && (previewLoading || !fileLoaded) ? (
                <Flex
                  align="center"
                  aspectRatio="1"
                  bg="bg-100"
                  justify="center"
                  r="md"
                  width="100%"
                >
                  <Icon
                    color="muted"
                    icon="svg-spinners:ring-resize"
                    size="1.5em"
                  />
                </Flex>
              ) : (
                <SchematicPreviewFrame
                  label={t('items.schematic')}
                  previewUrl={previewUrl}
                />
              )}
            </Box>
          </Flex>
          <SliderInput
            icon="tabler:rotate"
            label="inputs.rotation"
            max={7}
            min={0}
            renderValue={value => `${value * ROTATION_STEP}°`}
            step={1}
            value={rotation}
            onChange={setRotation}
          />
        </Flex>
      )}
      <TextField
        required
        control={form.control}
        icon="tabler:pencil"
        label="inputs.name"
        name="name"
        placeholder="e.g. Iron Farm"
      />
    </FormModal>
  )
}
