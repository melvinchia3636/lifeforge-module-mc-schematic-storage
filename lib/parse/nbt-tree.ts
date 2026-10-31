// Type-preserving NBT reader/writer.
//
// nbt.ts deliberately flattens tags to plain JS values (enough for reading),
// which is lossy: a 0-byte and a 1000-int cannot be told apart after the fact.
// Editing a file in place needs the original tag types, so this module keeps
// every node tagged with its NBT type id and round-trips it byte-for-byte
// (apart from the values that were deliberately changed).

const TAG_END = 0

export type NbtNodeValue =
  | number
  | bigint
  | string
  | Int8Array
  | Int32Array
  | BigInt64Array
  | NbtNode[]
  | Array<[string, NbtNode]>

export interface NbtNode {
  t: number
  v: NbtNodeValue
  n: number
  elemType?: number
}

export interface NbtTree {
  name: string
  root: NbtNode
}

function readPayload(view: DataView, pos: number, type: number): NbtNode {
  switch (type) {
    case 1:
      return { t: 1, v: view.getInt8(pos), n: 1 }
    case 2:
      return { t: 2, v: view.getInt16(pos), n: 2 }
    case 3:
      return { t: 3, v: view.getInt32(pos), n: 4 }
    case 4:
      return { t: 4, v: view.getBigInt64(pos), n: 8 }
    case 5:
      return { t: 5, v: view.getFloat32(pos), n: 4 }
    case 6:
      return { t: 6, v: view.getFloat64(pos), n: 8 }

    case 7: {
      const len = view.getInt32(pos)
      const bytes = new Uint8Array(
        view.buffer,
        view.byteOffset + pos + 4,
        len
      )

      return { t: 7, v: Int8Array.from(bytes), n: 4 + len }
    }

    case 8: {
      const len = view.getUint16(pos)
      const bytes = new Uint8Array(
        view.buffer,
        view.byteOffset + pos + 2,
        len
      )
      const text = new TextDecoder().decode(bytes)

      return { t: 8, v: text, n: 2 + len }
    }

    case 9: {
      const elemType = view.getUint8(pos)
      const len = view.getInt32(pos + 1)

      let off = 5

      const items: NbtNode[] = new Array(len)

      for (let i = 0; i < len; i++) {
        const item = readPayload(view, pos + off, elemType)

        items[i] = item
        off += item.n
      }

      return { t: 9, elemType, v: items, n: off }
    }

    case 10: {
      let off = 0

      const entries: Array<[string, NbtNode]> = []

      for (;;) {
        const t = view.getUint8(pos + off)

        off += 1

        if (t === TAG_END) {
          break
        }

        const nameLen = view.getUint16(pos + off)
        const name = new TextDecoder().decode(
          new Uint8Array(
            view.buffer,
            view.byteOffset + pos + off + 2,
            nameLen
          )
        )

        off += 2 + nameLen

        const item = readPayload(view, pos + off, t)

        entries.push([name, item])
        off += item.n
      }

      return { t: 10, v: entries, n: off }
    }

    case 11: {
      const len = view.getInt32(pos)
      const v = new Int32Array(len)

      for (let i = 0; i < len; i++) {
        v[i] = view.getInt32(pos + 4 + i * 4)
      }

      return { t: 11, v, n: 4 + len * 4 }
    }

    case 12: {
      const len = view.getInt32(pos)
      const v = new BigInt64Array(len)

      for (let i = 0; i < len; i++) {
        v[i] = view.getBigInt64(pos + 4 + i * 8)
      }

      return { t: 12, v, n: 4 + len * 8 }
    }
    default:
      throw new Error(`unknown NBT tag ${type}`)
  }
}

/** Parse a raw (already decompressed) NBT buffer into typed nodes. */
export function readNbtTree(buffer: ArrayBuffer): NbtTree {
  const view = new DataView(buffer)
  const type = view.getUint8(0)

  if (type === TAG_END) {
    return { name: '', root: { t: 10, v: [], n: 1 } }
  }

  const nameLen = view.getUint16(1)
  const name = new TextDecoder().decode(
    new Uint8Array(buffer, 3, nameLen)
  )
  const root = readPayload(view, 3 + nameLen, type)

  return { name, root }
}

const encoder = new TextEncoder()

function writeString(name: string): Uint8Array {
  const bytes = encoder.encode(name)
  const out = new Uint8Array(2 + bytes.length)

  new DataView(out.buffer).setUint16(0, bytes.length)
  out.set(bytes, 2)

  return out
}

function writePayload(node: NbtNode): Uint8Array {
  switch (node.t) {
    case 1: {
      const b = new Uint8Array(1)

      new DataView(b.buffer).setInt8(0, node.v as number)

      return b
    }

    case 2: {
      const b = new Uint8Array(2)

      new DataView(b.buffer).setInt16(0, node.v as number)

      return b
    }

    case 3: {
      const b = new Uint8Array(4)

      new DataView(b.buffer).setInt32(0, node.v as number)

      return b
    }

    case 4: {
      const b = new Uint8Array(8)

      new DataView(b.buffer).setBigInt64(0, node.v as bigint)

      return b
    }

    case 5: {
      const b = new Uint8Array(4)

      new DataView(b.buffer).setFloat32(0, node.v as number)

      return b
    }

    case 6: {
      const b = new Uint8Array(8)

      new DataView(b.buffer).setFloat64(0, node.v as number)

      return b
    }

    case 7: {
      const v = node.v as Int8Array
      const b = new Uint8Array(4 + v.length)

      new DataView(b.buffer).setInt32(0, v.length)
      b.set(v, 4)

      return b
    }
    case 8:
      return writeString(node.v as string)

    case 9: {
      const v = node.v as NbtNode[]
      const head = new Uint8Array(5)
      const hv = new DataView(head.buffer)

      hv.setUint8(0, node.elemType ?? 0)
      hv.setInt32(1, v.length)

      return concat([head, ...v.map(writePayload)])
    }

    case 10: {
      const v = node.v as Array<[string, NbtNode]>
      const parts: Uint8Array[] = []

      for (const [name, item] of v) {
        parts.push(
          Uint8Array.of(item.t),
          writeString(name),
          writePayload(item)
        )
      }

      parts.push(Uint8Array.of(TAG_END))

      return concat(parts)
    }

    case 11: {
      const v = node.v as Int32Array
      const b = new Uint8Array(4 + v.length * 4)
      const dv = new DataView(b.buffer)

      dv.setInt32(0, v.length)

      for (let i = 0; i < v.length; i++) {
        dv.setInt32(4 + i * 4, v[i] ?? 0)
      }

      return b
    }

    case 12: {
      const v = node.v as BigInt64Array
      const b = new Uint8Array(4 + v.length * 8)
      const dv = new DataView(b.buffer)

      dv.setInt32(0, v.length)

      for (let i = 0; i < v.length; i++) {
        dv.setBigInt64(4 + i * 8, v[i] ?? 0n)
      }

      return b
    }
    default:
      throw new Error(`cannot write NBT tag ${node.t}`)
  }
}

function concat(parts: Uint8Array[]): Uint8Array {
  let len = 0

  for (const p of parts) {
    len += p.length
  }

  const out = new Uint8Array(len)

  let off = 0

  for (const p of parts) {
    out.set(p, off)
    off += p.length
  }

  return out
}

/** Serialise typed nodes back to a raw NBT buffer. */
export function writeNbtTree({ name, root }: NbtTree): Uint8Array {
  return concat([
    Uint8Array.of(root.t),
    writeString(name),
    writePayload(root)
  ])
}

/** Compound helpers for typed nodes. */
export const get = (
  node: NbtNode | undefined,
  key: string
): NbtNode | undefined => {
  if (!node || node.t !== 10) {
    return undefined
  }

  const entries = node.v as Array<[string, NbtNode]>
  const hit = entries.find(([k]) => k === key)

  return hit ? hit[1] : undefined
}

export const set = (node: NbtNode, key: string, child: NbtNode): void => {
  if (node.t !== 10) {
    throw new Error('cannot set a key on a non-compound NBT node')
  }

  const entries = node.v as Array<[string, NbtNode]>
  const hit = entries.find(([k]) => k === key)

  if (hit) {
    hit[1] = child
  } else {
    entries.push([key, child])
  }
}

export const setInt = (node: NbtNode, key: string, value: number): void =>
  set(node, key, { t: 3, v: value, n: 4 })
