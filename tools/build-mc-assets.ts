// Builds the trimmed Minecraft resource pack used to render material icons in
// the browser. Run with `pnpm assets` (or `node tools/build-mc-assets.mjs 26.3`).
//
// The pack only contains what item/block model rendering needs: item
// definitions, models, blockstates, textures and atlases. Sounds, language
// files, GUI textures and shaders are left out.

import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const MODULE_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
)
const VERSION = process.argv[2] ?? '26.3'
const CACHE_DIR = path.join(MODULE_ROOT, '.cache', 'mc-assets')
const TARBALL = path.join(CACHE_DIR, `assets-tiny-${VERSION}.tar.gz`)
const EXTRACTED = path.join(CACHE_DIR, `extracted-${VERSION}`)
const STAGE = path.join(CACHE_DIR, `pack-${VERSION}`)
const OUTPUT_DIR = path.join(MODULE_ROOT, 'client', 'src', 'assets')
const OUTPUT_ZIP = path.join(OUTPUT_DIR, `mc-assets-${VERSION}.zip`)
const OUTPUT_NAMES = path.join(OUTPUT_DIR, `item-names-${VERSION}.json`)
const OUTPUT_ITEM_IDS = path.join(OUTPUT_DIR, `item-ids-${VERSION}.json`)
const OUTPUT_MANIFEST = path.join(
  OUTPUT_DIR,
  `mc-assets-${VERSION}.manifest.json`
)

const DIRECTORIES = [
  'items',
  'blockstates',
  'atlases',
  'models/item',
  'models/block',
  'textures/item',
  'textures/block',
  'textures/entity',
  'textures/particle',
  'textures/colormap',
  'textures/environment',
  'textures/map',
  'textures/misc'
]

const TAG = `${VERSION}-assets-tiny`
const URL = `https://codeload.github.com/misode/mcmeta/tar.gz/refs/tags/${TAG}`

const info = message => console.log(`[assets] ${message}`)

async function download() {
  if (fs.existsSync(TARBALL) && fs.statSync(TARBALL).size > 0) {
    info(`using cached ${path.basename(TARBALL)}`)

    return
  }

  info(`downloading ${TAG}`)

  const response = await fetch(URL)

  if (!response.ok) {
    throw new Error(`Failed to download ${URL}: ${response.status}`)
  }

  fs.mkdirSync(CACHE_DIR, { recursive: true })
  fs.writeFileSync(TARBALL, Buffer.from(await response.arrayBuffer()))
}

function extract() {
  fs.rmSync(EXTRACTED, { force: true, recursive: true })
  fs.mkdirSync(EXTRACTED, { recursive: true })

  info('extracting')

  execFileSync('tar', ['-xzf', TARBALL, '-C', EXTRACTED])

  const [root] = fs
    .readdirSync(EXTRACTED)
    .filter(name => name.startsWith('mcmeta-'))

  if (!root) {
    throw new Error('Could not find the extracted mcmeta folder')
  }

  return path.join(EXTRACTED, root, 'assets', 'minecraft')
}

function copyDir(source, destination) {
  if (!fs.existsSync(source)) {
    throw new Error(`Missing assets directory: ${source}`)
  }

  fs.cpSync(source, destination, { recursive: true })
}

function buildPack(assetsRoot) {
  fs.rmSync(STAGE, { force: true, recursive: true })

  const packRoot = path.join(STAGE, 'assets', 'minecraft')

  fs.mkdirSync(packRoot, { recursive: true })

  for (const directory of DIRECTORIES) {
    copyDir(
      path.join(assetsRoot, directory),
      path.join(packRoot, directory)
    )
  }

  const versionJson = path.join(
    path.dirname(path.dirname(assetsRoot)),
    'version.json'
  )
  const packFormat = fs.existsSync(versionJson)
    ? JSON.parse(fs.readFileSync(versionJson, 'utf8')).resource_pack_version
    : 97

  fs.writeFileSync(
    path.join(STAGE, 'pack.mcmeta'),
    JSON.stringify(
      {
        pack: {
          pack_format: packFormat,
          description: `Minecraft ${VERSION} assets for MC Schematic Storage`
        }
      },
      null,
      2
    ) + '\n'
  )
}

function writeItemNames(assetsRoot) {
  const lang = JSON.parse(
    fs.readFileSync(path.join(assetsRoot, 'lang', 'en_us.json'), 'utf8')
  )

  const items = new Set(
    fs
      .readdirSync(path.join(assetsRoot, 'items'))
      .filter(name => name.endsWith('.json'))
      .map(name => name.slice(0, -'.json'.length))
  )
  const blocks = new Set(
    fs
      .readdirSync(path.join(assetsRoot, 'blockstates'))
      .filter(name => name.endsWith('.json'))
      .map(name => name.slice(0, -'.json'.length))
  )

  const names = {}

  for (const id of [...items, ...blocks]) {
    const itemKey = `item.minecraft.${id}`
    const blockKey = `block.minecraft.${id}`

    names[id] = lang[itemKey] ?? lang[blockKey] ?? id
      .split('_')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  fs.writeFileSync(
    OUTPUT_NAMES,
    JSON.stringify(
      Object.fromEntries(Object.entries(names).sort(([a], [b]) => a.localeCompare(b))),
      null,
      null
    ) + '\n'
  )

  fs.writeFileSync(
    OUTPUT_ITEM_IDS,
    JSON.stringify([...items].sort(), null, null) + '\n'
  )

  info(`wrote ${Object.keys(names).length} item names`)
}

function zipPack() {
  fs.rmSync(OUTPUT_ZIP, { force: true })

  info('zipping')

  execFileSync('zip', ['-qr9', OUTPUT_ZIP, '.'], { cwd: STAGE })

  const bytes = fs.readFileSync(OUTPUT_ZIP)

  fs.writeFileSync(
    OUTPUT_MANIFEST,
    JSON.stringify(
      {
        version: VERSION,
        builtAt: new Date().toISOString(),
        size: bytes.length,
        sha256: createHash('sha256').update(bytes).digest('hex')
      },
      null,
      2
    ) + '\n'
  )

  info(
    `wrote ${path.relative(MODULE_ROOT, OUTPUT_ZIP)} (${(
      bytes.length /
      1024 /
      1024
    ).toFixed(2)} MB)`
  )
}

await download()

const assetsRoot = extract()

buildPack(assetsRoot)
writeItemNames(assetsRoot)
zipPack()

info(`done (${VERSION})`)
