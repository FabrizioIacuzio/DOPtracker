// Run with: npx tsx scripts/migrate-to-products.ts
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { DENOMINATION_CONFIGS } from '../frontend/src/lib/denominationFields.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ROOT = path.resolve(__dirname, '..')
const PRODUCTS_DIR = path.join(ROOT, 'products')
const CONFIGS_DIR = path.join(ROOT, 'backend/src/denominations/configs')
const WORKTREE_DIR = path.join(ROOT, '.worktrees/abm-igp-bootstrap/docs/denominations/csqa')

const CATEGORY_MAP: Record<string, string> = {
  'aceto-balsamico-di-modena': 'Aceto',
  'gorgonzola': 'Formaggi',
  'asiago': 'Formaggi',
  'fontina': 'Formaggi',
  'grana-padano': 'Formaggi',
  'bitto': 'Formaggi',
  'casatella-trevigiana': 'Formaggi',
  'montasio': 'Formaggi',
  'monte-veronese': 'Formaggi',
  'nostrano-valtrompia': 'Formaggi',
  'piave': 'Formaggi',
  'provolone-valpadana': 'Formaggi',
  'spressa-delle-giudicarie': 'Formaggi',
  'valle-daosta-fromadzo': 'Formaggi',
  'valtellina-casera': 'Formaggi',
  'ricotta-di-bufala-campana': 'Formaggi',
  'bresaola-della-valtellina': 'Salumi',
  'sopressa-vicentina': 'Salumi',
  'chianti-classico': 'Vino',
  'garda': 'Vino',
  'miele-delle-dolomiti-bellunesi': 'Altro',
  'salmerino-del-trentino': 'Altro',
  'aglio-bianco-polesano': 'Ortaggi & Frutta',
  'amarene-brusche-di-modena': 'Ortaggi & Frutta',
  'asparago-bianco-di-bassano': 'Ortaggi & Frutta',
  'asparago-bianco-di-cimadolmo': 'Ortaggi & Frutta',
  'asparago-di-badoere': 'Ortaggi & Frutta',
  'ciliegia-di-marostica': 'Ortaggi & Frutta',
  'cipollotto-nocerino': 'Ortaggi & Frutta',
  'fagiolo-di-lamon-della-vallata-bellunese': 'Ortaggi & Frutta',
  'insalata-di-lusia': 'Ortaggi & Frutta',
  'marrone-di-combai': 'Ortaggi & Frutta',
  'marrone-di-san-zeno': 'Ortaggi & Frutta',
  'marroni-del-monfenera': 'Ortaggi & Frutta',
  'mela-di-valtellina': 'Ortaggi & Frutta',
  'mela-val-di-non': 'Ortaggi & Frutta',
  'melanzana-rossa-di-rotonda': 'Ortaggi & Frutta',
  'pera-mantovana': 'Ortaggi & Frutta',
  'pesca-di-verona': 'Ortaggi & Frutta',
  'radicchio-di-chioggia': 'Ortaggi & Frutta',
  'radicchio-di-verona': 'Ortaggi & Frutta',
  'radicchio-rosso-di-treviso': 'Ortaggi & Frutta',
  'radicchio-variegato-di-castelfranco': 'Ortaggi & Frutta',
  'susina-di-dro': 'Ortaggi & Frutta',
  'uva-da-tavola-di-canicatti': 'Ortaggi & Frutta',
}

let count = 0

for (const [id, config] of Object.entries(DENOMINATION_CONFIGS)) {
  const dir = path.join(PRODUCTS_DIR, id)
  const docsDir = path.join(dir, 'docs')
  fs.mkdirSync(docsDir, { recursive: true })

  // 1. fields.json
  fs.writeFileSync(
    path.join(dir, 'fields.json'),
    JSON.stringify(config, null, 2) + '\n',
    'utf-8',
  )

  // 2. submission.json
  const submissionSrc = path.join(CONFIGS_DIR, `${id}.json`)
  if (fs.existsSync(submissionSrc)) {
    fs.copyFileSync(submissionSrc, path.join(dir, 'submission.json'))
  } else {
    console.warn(`  WARNING: no submission config for ${id} — writing empty stub`)
    fs.writeFileSync(path.join(dir, 'submission.json'), JSON.stringify({ id, submission_rules: [] }, null, 2) + '\n', 'utf-8')
  }

  // 3. metadata.json
  const metaSrc = path.join(WORKTREE_DIR, id, 'metadata.json')
  if (fs.existsSync(metaSrc)) {
    const raw = JSON.parse(fs.readFileSync(metaSrc, 'utf-8')) as {
      name: string; type: string; controlBody: string
    }
    if (!raw.name || !raw.type || !raw.controlBody) {
      console.warn(`  WARNING: incomplete metadata for ${id} — skipping metadata.json`)
    } else {
      const meta = {
        id,
        displayName: `${raw.name} ${raw.type}`,
        protectionType: raw.type,
        category: CATEGORY_MAP[id] ?? 'Altro',
        certifyingBody: raw.controlBody,
      }
      fs.writeFileSync(path.join(dir, 'metadata.json'), JSON.stringify(meta, null, 2) + '\n', 'utf-8')
    }
  } else {
    console.warn(`  WARNING: no worktree metadata for ${id}`)
  }

  // 4. docs/piano-di-controllo.zip
  const zipSrc = path.join(WORKTREE_DIR, id, 'piano-di-controllo.zip')
  if (fs.existsSync(zipSrc)) {
    fs.copyFileSync(zipSrc, path.join(docsDir, 'piano-di-controllo.zip'))
  }

  console.log(`  ✓ ${id}`)
  count++
}

console.log(`\nDone — migrated ${count} denominations to products/`)
