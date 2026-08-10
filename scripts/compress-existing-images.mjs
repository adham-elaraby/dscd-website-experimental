/**
 * One-time backfill: shrinks the images that were uploaded before the admin
 * panel started compressing them (see src/lib/utils/compressImage.ts).
 *
 * The originals came straight off phone cameras — 5712x4284, ~3 MB each — and
 * are served unresized, so a 21-photo event gallery weighed 62 MB. This walks
 * every image column, re-encodes each object to WebP at the same budgets the
 * browser now uses, uploads it beside the original as "<name>.min.webp", and
 * repoints the database row at it.
 *
 * Originals are never deleted: restoring the previous gallery_urls/image_url
 * values is enough to roll back. Re-running is safe — rows already pointing at
 * a .min.webp are skipped, and uploads use x-upsert.
 *
 * Usage, from the repo root (reads .env.local for SUPABASE_SERVICE_ROLE_KEY):
 *   node scripts/compress-existing-images.mjs                    # dry run, writes nothing
 *   node scripts/compress-existing-images.mjs --apply            # perform the migration
 *   node scripts/compress-existing-images.mjs --only=events.gallery_urls --apply
 *
 * --only limits the run to one or more comma-separated table.column pairs, so
 * the columns can be migrated in separate passes.
 *
 * Needs sharp, which ships as a Next.js dependency. If it is missing:
 *   npm install --no-save sharp
 */

import { readFileSync } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const APPLY = process.argv.includes('--apply')
const ONLY = (process.argv.find((arg) => arg.startsWith('--only=')) ?? '')
  .slice('--only='.length)
  .split(',')
  .filter(Boolean)
const BUCKET = 'media'
const SUFFIX = '.min.webp'

/** Mirrors PRESETS in src/lib/utils/compressImage.ts — keep the two in step. */
const PRESETS = {
  gallery: { maxEdge: 1600, quality: 82 },
  cover: { maxEdge: 1000, quality: 82 },
  avatar: { maxEdge: 400, quality: 85 },
}

/** Every column holding an uploaded image, and how large it renders. */
const TARGETS = [
  { table: 'events', column: 'gallery_urls', isArray: true, preset: 'gallery' },
  { table: 'events', column: 'image_url', isArray: false, preset: 'cover' },
  { table: 'projects', column: 'image_url', isArray: false, preset: 'cover' },
  { table: 'team_members', column: 'image_url', isArray: false, preset: 'avatar' },
]

function loadEnv() {
  const raw = readFileSync(path.join(process.cwd(), '.env.local'), 'utf8')
  const env = {}
  for (const line of raw.split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/)
    if (match) env[match[1]] = match[2].trim().replace(/^["']|["']$/g, '')
  }
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const key = env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('.env.local needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  }
  return { url, key }
}

const { url: SUPABASE_URL, key: SERVICE_KEY } = loadEnv()
const PUBLIC_PREFIX = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`

const restHeaders = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
}

async function selectRows(table, column) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=id,${column}`, {
    headers: restHeaders,
  })
  if (!res.ok) throw new Error(`select ${table}.${column}: ${res.status} ${await res.text()}`)
  return res.json()
}

async function updateRow(table, id, column, value) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { ...restHeaders, Prefer: 'return=minimal' },
    body: JSON.stringify({ [column]: value }),
  })
  if (!res.ok) throw new Error(`update ${table} ${id}: ${res.status} ${await res.text()}`)
}

async function uploadObject(objectPath, buffer) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${objectPath}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'image/webp',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'x-upsert': 'true',
    },
    body: buffer,
  })
  if (!res.ok) throw new Error(`upload ${objectPath}: ${res.status} ${await res.text()}`)
}

/**
 * Returns the replacement URL for one image, or null to leave it alone —
 * already migrated, hosted elsewhere, or not actually smaller once re-encoded.
 */
async function migrateUrl(url, preset, stats) {
  if (typeof url !== 'string' || !url.startsWith(PUBLIC_PREFIX)) return null // e.g. /images/local.jpg
  if (url.endsWith(SUFFIX)) return null // already done on an earlier run

  const objectPath = decodeURIComponent(url.slice(PUBLIC_PREFIX.length).split('?')[0])

  const download = await fetch(url)
  if (!download.ok) {
    console.warn(`    ! skipped (download ${download.status}): ${objectPath}`)
    return null
  }
  const original = Buffer.from(await download.arrayBuffer())

  const { maxEdge, quality } = PRESETS[preset]
  const compressed = await sharp(original)
    .rotate() // bake in EXIF orientation, which WebP output would otherwise drop
    .resize({ width: maxEdge, height: maxEdge, fit: 'inside', withoutEnlargement: true })
    .webp({ quality })
    .toBuffer()

  if (compressed.length >= original.length) {
    console.log(`    = kept (already small): ${objectPath}`)
    return null
  }

  const newPath = `${objectPath.replace(/\.[^./]+$/, '')}${SUFFIX}`
  if (APPLY) await uploadObject(newPath, compressed)

  stats.before += original.length
  stats.after += compressed.length
  stats.count += 1
  console.log(
    `    ${mb(original.length)} -> ${mb(compressed.length)}  ` +
      `(${(original.length / compressed.length).toFixed(1)}x)  ${path.basename(objectPath)}`
  )

  return PUBLIC_PREFIX + newPath
}

const mb = (bytes) => `${(bytes / 1048576).toFixed(2)} MB`.padStart(8)

async function run() {
  console.log(APPLY ? '=== APPLYING ===\n' : '=== DRY RUN (nothing is written; pass --apply) ===\n')

  const targets = ONLY.length
    ? TARGETS.filter(({ table, column }) => ONLY.includes(`${table}.${column}`))
    : TARGETS
  if (!targets.length) {
    throw new Error(
      `--only matched nothing. Available: ${TARGETS.map((t) => `${t.table}.${t.column}`).join(', ')}`
    )
  }
  if (ONLY.length) console.log(`limited to: ${targets.map((t) => `${t.table}.${t.column}`).join(', ')}\n`)

  const stats = { before: 0, after: 0, count: 0 }

  for (const { table, column, isArray, preset } of targets) {
    console.log(`${table}.${column}  [${preset}]`)
    const rows = await selectRows(table, column)

    for (const row of rows) {
      const current = row[column]
      if (!current || (isArray && current.length === 0)) continue

      if (isArray) {
        const next = []
        let changed = false
        for (const url of current) {
          const replacement = await migrateUrl(url, preset, stats)
          next.push(replacement ?? url)
          if (replacement) changed = true
        }
        if (changed && APPLY) await updateRow(table, row.id, column, next)
      } else {
        const replacement = await migrateUrl(current, preset, stats)
        if (replacement && APPLY) await updateRow(table, row.id, column, replacement)
      }
    }
    console.log()
  }

  console.log('─'.repeat(60))
  console.log(`images rewritten : ${stats.count}`)
  console.log(`before           : ${mb(stats.before)}`)
  console.log(`after            : ${mb(stats.after)}`)
  if (stats.after > 0) {
    console.log(`saved            : ${mb(stats.before - stats.after)} ` +
      `(${(stats.before / stats.after).toFixed(1)}x smaller)`)
  }
  if (!APPLY) console.log('\nDry run only — re-run with --apply to write these changes.')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
