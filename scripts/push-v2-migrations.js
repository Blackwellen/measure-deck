/**
 * push-v2-migrations.js
 * Pushes Phase 03 migration files (004-008) to the live Supabase project
 * using the Supabase Management API v1 (/query endpoint).
 *
 * Usage: node scripts/push-v2-migrations.js
 * Usage (retry only failed): RETRY_ONLY=1 node scripts/push-v2-migrations.js
 */

const https = require('https')
const fs = require('fs')
const path = require('path')

// ── Config ──────────────────────────────────────────────────────────────────
const PROJECT_REF = 'ketzbsaksgibifkecxue'
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN

const MIGRATIONS_DIR = path.join(__dirname, '..', 'supabase', 'migrations')

// Full set — 004-006 already applied; script will push all and skip already-applied tables
const ALL_MIGRATIONS = [
  '004_nec4_workflow.sql',
  '005_hgcra_compliance.sql',
  '006_cis_retention_subcontracts.sql',
  '007_lifecycle_analytics.sql',
  '008_notifications_portal.sql',
]

// Only retry the two that failed
const RETRY_MIGRATIONS = [
  '007_lifecycle_analytics.sql',
  '008_notifications_portal.sql',
]

const MIGRATIONS = process.env.RETRY_ONLY ? RETRY_MIGRATIONS : ALL_MIGRATIONS

// ── Helper: POST to Supabase Management API ─────────────────────────────────
function postQuery(sql) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql })
    const options = {
      hostname: 'api.supabase.com',
      path: `/v1/projects/${PROJECT_REF}/database/query`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
      },
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ ok: true, status: res.statusCode, body: data })
        } else {
          resolve({ ok: false, status: res.statusCode, body: data })
        }
      })
    })

    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  if (!ACCESS_TOKEN) {
    console.error('ERROR: SUPABASE_ACCESS_TOKEN is not set.')
    process.exit(1)
  }

  console.log(`Project: ${PROJECT_REF}`)
  console.log(`Pushing ${MIGRATIONS.length} migrations...\n`)

  const results = []

  for (const filename of MIGRATIONS) {
    const filepath = path.join(MIGRATIONS_DIR, filename)

    if (!fs.existsSync(filepath)) {
      console.error(`  MISSING: ${filename}`)
      results.push({ file: filename, status: 'MISSING' })
      continue
    }

    const sql = fs.readFileSync(filepath, 'utf8')
    process.stdout.write(`  Pushing ${filename} ... `)

    try {
      const result = await postQuery(sql)
      if (result.ok) {
        console.log('OK')
        results.push({ file: filename, status: 'OK' })
      } else {
        let errMsg = result.body
        try {
          const parsed = JSON.parse(result.body)
          errMsg = parsed.message || parsed.error || result.body
        } catch (_) {}
        console.log(`FAILED (HTTP ${result.status})`)
        console.log(`    Error: ${errMsg.slice(0, 400)}`)
        results.push({ file: filename, status: `FAILED`, httpStatus: result.status, error: errMsg.slice(0, 400) })
      }
    } catch (err) {
      console.log(`ERROR`)
      console.log(`    ${err.message}`)
      results.push({ file: filename, status: 'ERROR', error: err.message })
    }

    await new Promise(r => setTimeout(r, 500))
  }

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log('\n── Migration Summary ──────────────────────────────────')
  let allOk = true
  for (const r of results) {
    const icon = r.status === 'OK' ? '✓' : '✗'
    console.log(`  ${icon} ${r.file}: ${r.status}`)
    if (r.status !== 'OK') allOk = false
  }
  console.log('───────────────────────────────────────────────────────')

  // ── Verification spot checks ─────────────────────────────────────────────
  console.log('\nVerifying tables...')
  const spotChecks = [
    { table: 'ce_workflow_states',       migration: '004', col: 'id' },
    { table: 'early_warnings',           migration: '004', col: 'id' },
    { table: 'pay_less_notices',         migration: '005', col: 'id' },
    { table: 'cis_records',             migration: '006', col: 'id' },
    { table: 'subcontract_orders',       migration: '006', col: 'id' },
    { table: 'adjudication_cases',       migration: '007', col: 'id' },
    { table: 'practical_completions',    migration: '007', col: 'id' },
    { table: 'snagging_items',           migration: '007', col: 'id' },
    { table: 'cashflow_forecasts',       migration: '007', col: 'id' },
    { table: 'workspace_feature_flags',  migration: '007', col: 'id' },
    { table: 'portal_access_tokens',     migration: '008', col: 'id' },
    { table: 'portal_audit_log',         migration: '008', col: 'id' },
  ]

  for (const check of spotChecks) {
    const r = await postQuery(`SELECT ${check.col} FROM ${check.table} LIMIT 1`)
    const status = r.ok ? 'ACCESSIBLE' : 'NOT FOUND'
    console.log(`  ${check.table} (migration ${check.migration}): ${status}`)
    await new Promise(res => setTimeout(res, 150))
  }

  console.log('\nDone.')
  process.exit(allOk ? 0 : 1)
}

main().catch((err) => {
  console.error('Fatal:', err.message)
  process.exit(1)
})
