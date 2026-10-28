const TAG_BYTE = 1
const TAG_SHORT = 2
const TAG_INT = 3
const TAG_LONG = 4
const TAG_FLOAT = 5
const TAG_DOUBLE = 6
const TAG_BYTE_ARRAY = 7
const TAG_STRING = 8
const TAG_LIST = 9
const TAG_COMPOUND = 10
const TAG_INT_ARRAY = 11
const TAG_LONG_ARRAY = 12

const decoder = new TextDecoder('utf-8')

class NbtReader {
  private readonly view: DataView
  private offset = 0

  constructor(buffer: ArrayBuffer) {
    this.view = new DataView(buffer)
  }

  private ensure(length: number) {
    if (length < 0 || this.offset + length > this.view.byteLength) {
      throw new Error('Unexpected end of NBT data')
    }
  }

  u8() {
    this.ensure(1)

    const value = this.view.getUint8(this.offset)

    this.offset += 1

    return value
  }

  u16() {
    this.ensure(2)

    const value = this.view.getUint16(this.offset)

    this.offset += 2

    return value
  }

  i32() {
    this.ensure(4)

    const value = this.view.getInt32(this.offset)

    this.offset += 4

    return value
  }

  string() {
    const length = this.u16()

    this.ensure(length)

    const bytes = new Uint8Array(
      this.view.buffer,
      this.view.byteOffset + this.offset,
      length
    )

    this.offset += length

    return decoder.decode(bytes)
  }

  skip(length: number) {
    this.ensure(length)

    this.offset += length
  }

  skipTag(type: number) {
    switch (type) {
      case TAG_BYTE:
        this.skip(1)
        break
      case TAG_SHORT:
        this.skip(2)
        break
      case TAG_INT:
        this.skip(4)
        break
      case TAG_LONG:
        this.skip(8)
        break
      case TAG_FLOAT:
        this.skip(4)
        break
      case TAG_DOUBLE:
        this.skip(8)
        break
      case TAG_BYTE_ARRAY:
        this.skip(this.i32())
        break
      case TAG_STRING:
        this.skip(this.u16())
        break

      case TAG_LIST: {
        const elementType = this.u8()
        const length = this.i32()

        for (let i = 0; i < length; i++) {
          this.skipTag(elementType)
        }

        break
      }
      case TAG_COMPOUND:
        for (;;) {
          const childType = this.u8()

          if (childType === 0) {
            break
          }

          this.string()
          this.skipTag(childType)
        }

        break
      case TAG_INT_ARRAY:
        this.skip(this.i32() * 4)
        break
      case TAG_LONG_ARRAY:
        this.skip(this.i32() * 8)
        break
      default:
        throw new Error(`Unknown NBT tag type: ${type}`)
    }
  }
}

function readNameFromCompound(reader: NbtReader): string | null {
  for (;;) {
    const type = reader.u8()

    if (type === 0) {
      return null
    }

    const name = reader.string()

    if (name === 'Name' && type === TAG_STRING) {
      return reader.string()
    }

    reader.skipTag(type)
  }
}

function readRootName(reader: NbtReader): string | null {
  for (;;) {
    const type = reader.u8()

    if (type === 0) {
      return null
    }

    const name = reader.string()

    if (name === 'Metadata' && type === TAG_COMPOUND) {
      const metadataName = readNameFromCompound(reader)

      if (metadataName) {
        return metadataName
      }

      continue
    }

    if (name === 'Name' && type === TAG_STRING) {
      return reader.string()
    }

    reader.skipTag(type)
  }
}

async function readSchematicName(file: File): Promise<string | null> {
  const raw = await file.arrayBuffer()

  const header = new Uint8Array(raw, 0, Math.min(raw.byteLength, 2))

  const isGzip = header[0] === 0x1f && header[1] === 0x8b

  let data = raw

  if (isGzip) {
    if (typeof DecompressionStream === 'undefined') {
      throw new Error('Gzip decompression is not supported')
    }

    const stream = new Blob([raw])
      .stream()
      .pipeThrough(new DecompressionStream('gzip'))

    data = await new Response(stream).arrayBuffer()
  }

  const reader = new NbtReader(data)

  if (reader.u8() !== TAG_COMPOUND) {
    return null
  }

  reader.string()

  return readRootName(reader)?.trim() || null
}

export default readSchematicName
