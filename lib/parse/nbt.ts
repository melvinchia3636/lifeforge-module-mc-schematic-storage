// Minimal big-endian NBT reader (enough for .litematic).
// Returns plain JS values: compounds -> objects, lists -> arrays,
// typed arrays -> BigInt64Array / Int32Array / Int8Array.

export type NbtValue =
  | number
  | bigint
  | string
  | Int8Array
  | Int32Array
  | BigInt64Array
  | NbtValue[]
  | NbtCompound

export type NbtCompound = { [key: string]: NbtValue }

export function readNbt(buffer: ArrayBuffer, offset = 0): NbtCompound {
  const view = new DataView(buffer)

  let pos = offset

  const u8 = (): number => {
    const v = view.getUint8(pos)

    pos += 1

    return v
  }
  const i16 = (): number => {
    const v = view.getInt16(pos)

    pos += 2

    return v
  }
  const i32 = (): number => {
    const v = view.getInt32(pos)

    pos += 4

    return v
  }
  const i64 = (): bigint => {
    const v = view.getBigInt64(pos)

    pos += 8

    return v
  }
  const f32 = (): number => {
    const v = view.getFloat32(pos)

    pos += 4

    return v
  }
  const f64 = (): number => {
    const v = view.getFloat64(pos)

    pos += 8

    return v
  }
  const str = (): string => {
    const len = view.getUint16(pos)

    pos += 2

    const s = new TextDecoder().decode(
      new Uint8Array(buffer, offset + pos, len)
    )

    pos += len

    return s
  }

  function payload(type: number): NbtValue {
    switch (type) {
      case 1:
        return view.getInt8(pos++)
      case 2:
        return i16()
      case 3:
        return i32()
      case 4:
        return i64()
      case 5:
        return f32()
      case 6:
        return f64()

      case 7: {
        const len = i32()
        const out = new Int8Array(
          buffer.slice(offset + pos, offset + pos + len)
        )

        pos += len

        return out
      }
      case 8:
        return str()

      case 9: {
        const item = u8()
        const len = i32()
        const out: NbtValue[] = new Array(len)

        for (let i = 0; i < len; i++) {
          out[i] = payload(item)
        }

        return out
      }

      case 10: {
        const out: NbtCompound = {}

        for (;;) {
          const t = u8()

          if (t === 0) {
            break
          }

          const name = str()

          out[name] = payload(t)
        }

        return out
      }

      case 11: {
        const len = i32()
        const out = new Int32Array(len)

        for (let i = 0; i < len; i++) {
          out[i] = i32()
        }

        return out
      }

      case 12: {
        const len = i32()
        const out = new BigInt64Array(len)

        for (let i = 0; i < len; i++) {
          out[i] = i64()
        }

        return out
      }
      default:
        throw new Error(`unknown NBT tag ${type} at ${pos}`)
    }
  }

  const type = u8()

  if (type === 0) {
    return {}
  }

  str() // root name

  return payload(type) as NbtCompound
}

export async function gunzip(buffer: ArrayBuffer): Promise<ArrayBuffer> {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('Gzip decompression is not supported in this environment')
  }

  const stream = new Blob([buffer])
    .stream()
    .pipeThrough(new DecompressionStream('gzip'))

  return await new Response(stream).arrayBuffer()
}

export async function loadLitematicNbt(
  buffer: ArrayBuffer
): Promise<NbtCompound> {
  const head = new Uint8Array(buffer, 0, 2)
  const gzipped = head[0] === 0x1f && head[1] === 0x8b
  const raw = gzipped ? await gunzip(buffer) : buffer

  return readNbt(raw)
}
