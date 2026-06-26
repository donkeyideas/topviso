/**
 * Seed the ASO glossary into the `posts` table as type='guide' rows.
 *
 * Idempotent: new terms are inserted (published immediately); existing terms
 * (matched by slug) are updated in place without resetting their published_at.
 *
 * Usage (from repo root or apps/web):
 *   npx tsx apps/web/scripts/seed-glossary.ts
 *   npx tsx apps/web/scripts/seed-glossary.ts --dry   # preview, no writes
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from
 * apps/web/.env.local (or the ambient environment).
 */

import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import { GLOSSARY_TERMS } from './glossary-seed-data'

const __dirname = dirname(fileURLToPath(import.meta.url))

/** Load KEY=VALUE pairs from apps/web/.env.local without adding a dependency. */
function loadEnvLocal() {
  const envPath = resolve(__dirname, '..', '.env.local')
  let raw = ''
  try {
    raw = readFileSync(envPath, 'utf8')
  } catch {
    return // fall back to ambient env
  }
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = value
  }
}

async function main() {
  const dryRun = process.argv.includes('--dry')
  loadEnvLocal()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. ' +
        'Set them in apps/web/.env.local or the environment.',
    )
    process.exit(1)
  }

  const supabase = createClient(url, key)

  console.log(
    `\n=== Seeding ASO glossary (${GLOSSARY_TERMS.length} terms)${dryRun ? ' [DRY RUN]' : ''} ===\n`,
  )

  // Pull existing guide slugs so we can decide insert vs update.
  const { data: existing, error: fetchErr } = await supabase
    .from('posts')
    .select('slug')
    .eq('type', 'guide')
  if (fetchErr) {
    console.error('Failed to read existing posts:', fetchErr.message)
    process.exit(1)
  }
  const existingSlugs = new Set((existing ?? []).map((r) => r.slug as string))

  let inserted = 0
  let updated = 0
  let failed = 0

  for (const term of GLOSSARY_TERMS) {
    const exists = existingSlugs.has(term.slug)
    const label = `${exists ? 'update' : 'insert'}  ${term.slug}`

    if (dryRun) {
      console.log(`  [dry] ${label}`)
      exists ? updated++ : inserted++
      continue
    }

    if (exists) {
      const { error } = await supabase
        .from('posts')
        .update({
          title: term.title,
          excerpt: term.excerpt,
          content: term.content,
          tags: term.tags,
          status: 'published',
          updated_at: new Date().toISOString(),
        })
        .eq('slug', term.slug)
        .eq('type', 'guide')
      if (error) {
        console.error(`  ✗ ${label}: ${error.message}`)
        failed++
      } else {
        console.log(`  ✓ ${label}`)
        updated++
      }
    } else {
      const now = new Date().toISOString()
      const { error } = await supabase.from('posts').insert({
        type: 'guide',
        title: term.title,
        slug: term.slug,
        excerpt: term.excerpt,
        content: term.content,
        author_name: 'Top Viso',
        status: 'published',
        tags: term.tags,
        published_at: now,
      })
      if (error) {
        console.error(`  ✗ ${label}: ${error.message}`)
        failed++
      } else {
        console.log(`  ✓ ${label}`)
        inserted++
      }
    }
  }

  console.log(
    `\nDone. inserted=${inserted} updated=${updated} failed=${failed}\n`,
  )
  process.exit(failed > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
