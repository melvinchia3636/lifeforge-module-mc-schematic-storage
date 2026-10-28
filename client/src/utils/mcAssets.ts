import type { PreparedAssets } from 'block-model-renderer'

import itemIds from '../assets/item-ids-26.3.json'
import manifest from '../assets/mc-assets-26.3.manifest.json'
import itemNames from '../assets/item-names-26.3.json'
import overridesUrl from '../assets/block-model-renderer-assets.zip?url'
import packUrl from '../assets/mc-assets-26.3.zip?url'

const ASSETS_VERSION = '26.3'
const ICON_SIZE = 64
const PACK_HASH = manifest.sha256.slice(0, 12)
const ICON_CACHE_VERSION = 2
const MAX_CONCURRENT_RENDERS = 3

type Renderer = typeof import('block-model-renderer')

const ICON_NAMES = itemNames as Record<string, string>
const ITEM_IDS = new Set(itemIds)

let rendererPromise: Promise<Renderer> | null = null
let assetsPromise: Promise<PreparedAssets> | null = null

const iconMemory = new Map<string, string>()
const iconInflight = new Map<string, Promise<string>>()

let activeRenders = 0

const renderQueue: Array<() => void> = []

/** Lazy-loads the renderer only when the materials view needs it. */
function getRenderer(): Promise<Renderer> {
  rendererPromise ??= import('block-model-renderer').then(renderer => {
    // Point at a copy of the library's bundled overrides so the URL survives
    // Vite's dev dependency pre-bundling (which the app's dev server applies).
    renderer.configure({ assetsUrl: overridesUrl })

    return renderer
  })

  return rendererPromise
}

async function withRenderSlot<T>(task: () => Promise<T>): Promise<T> {
  if (activeRenders >= MAX_CONCURRENT_RENDERS) {
    await new Promise<void>(resolve => renderQueue.push(resolve))
  }

  activeRenders += 1

  try {
    return await task()
  } finally {
    activeRenders -= 1
    renderQueue.shift()?.()
  }
}

const assetsCacheKey = () =>
  new URL(
    `/__mc-assets/${ASSETS_VERSION}-${PACK_HASH}.zip`,
    window.location.origin
  ).href

const iconCacheKey = (id: string) =>
  new URL(
    `/__mc-icons/v${ICON_CACHE_VERSION}/${ASSETS_VERSION}-${PACK_HASH}/${ICON_SIZE}/${encodeURIComponent(id)}.png`,
    window.location.origin
  ).href

/** Fetches the trimmed resource pack once and caches it in Cache Storage. */
async function fetchPack(): Promise<ArrayBuffer> {
  if ('caches' in window) {
    const cache = await caches.open('mc-schematic-assets')
    const cached = await cache.match(assetsCacheKey())

    if (cached) {
      return await cached.arrayBuffer()
    }

    const response = await fetch(packUrl)

    if (!response.ok) {
      throw new Error(`Failed to fetch Minecraft assets (${response.status})`)
    }

    await cache.put(assetsCacheKey(), response.clone())

    return await response.arrayBuffer()
  }

  const response = await fetch(packUrl)

  if (!response.ok) {
    throw new Error(`Failed to fetch Minecraft assets (${response.status})`)
  }

  const buffer = await response.arrayBuffer()

  return buffer
}

/** Prepared asset source, shared by every icon render on the page. */
function getAssets(): Promise<PreparedAssets> {
  assetsPromise ??= (async () => {
    const [{ prepareAssets }, pack] = await Promise.all([
      getRenderer(),
      fetchPack()
    ])

    const prepared = await prepareAssets(pack)

    return prepared
  })().catch(error => {
    assetsPromise = null

    throw error
  })

  return assetsPromise
}

function canvasToBlob(canvas: HTMLCanvasElement | OffscreenCanvas): Promise<Blob> {
  if ('convertToBlob' in canvas) {
    return canvas.convertToBlob({ type: 'image/png' })
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) {
        resolve(blob)
      } else {
        reject(new Error('Failed to encode item icon'))
      }
    }, 'image/png')
  })
}

async function renderIcon(id: string): Promise<Blob> {
  const [{ renderItem, renderBlock }, assets] = await Promise.all([
    getRenderer(),
    getAssets()
  ])

  let canvas: HTMLCanvasElement | OffscreenCanvas

  if (ITEM_IDS.has(id)) {
    try {
      canvas = await renderItem({
        id,
        assets,
        width: ICON_SIZE,
        height: ICON_SIZE
      })
    } catch {
      canvas = await renderBlock({
        id,
        assets,
        width: ICON_SIZE,
        height: ICON_SIZE
      })
    }
  } else {
    // Blocks without an item form (water, fire, wall torches, ...) can only be
    // rendered from their block model.
    canvas = await renderBlock({
      id,
      assets,
      width: ICON_SIZE,
      height: ICON_SIZE
    })
  }

  return await canvasToBlob(canvas)
}

async function loadCachedIcon(id: string): Promise<Blob | null> {
  if (!('caches' in window)) {
    return null
  }

  const cache = await caches.open(`mc-schematic-icons-v${ICON_CACHE_VERSION}`)
  const cached = await cache.match(iconCacheKey(id))

  return cached ? await cached.blob() : null
}

async function storeCachedIcon(id: string, blob: Blob): Promise<void> {
  if (!('caches' in window)) {
    return
  }

  const cache = await caches.open(`mc-schematic-icons-v${ICON_CACHE_VERSION}`)

  await cache.put(iconCacheKey(id), new Response(blob))
}

/**
 * Returns an object URL for a 64px icon of the given item id, rendering it on
 * demand and caching the result in memory and Cache Storage.
 */
export function getMaterialIcon(id: string): Promise<string> {
  const known = iconMemory.get(id)

  if (known) {
    return Promise.resolve(known)
  }

  const pending = iconInflight.get(id)

  if (pending) {
    return pending
  }

  const task = withRenderSlot(async () => {
    const cached = await loadCachedIcon(id)
    const blob = cached ?? (await renderIcon(id))

    if (!cached) {
      await storeCachedIcon(id, blob)
    }

    const url = URL.createObjectURL(blob)

    iconMemory.set(id, url)

    return url
  })
    .catch(error => {
      console.error(`Failed to render icon for ${id}:`, error)

      throw error
    })
    .finally(() => {
      iconInflight.delete(id)
    })

  iconInflight.set(id, task)

  return task
}

/** Human-readable name for an item or block id. */
export function getMaterialName(id: string): string {
  return (
    ICON_NAMES[id] ??
    id
      .split('_')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
  )
}
