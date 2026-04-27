/**
 * Prints the exact SQL to paste into Supabase Dashboard → SQL Editor → New query → Run.
 * Reads migration files so it never drifts from the canonical migrations folder.
 */
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const migrations = path.join(root, 'supabase', 'migrations');
const files = [
  '20260415190000_add_category_slug_to_deals.sql',
  '20260416120000_deals_category_slug_check.sql',
];

const banner = `-- =============================================================================
-- SUPABASE SQL EDITOR: paste this ENTIRE output (from the next line down), then Run.
-- Do NOT paste a filepath like "supabase/migrations/..." — that is not valid SQL.
-- =============================================================================

`;

let out = banner;
for (const name of files) {
  const full = path.join(migrations, name);
  if (!fs.existsSync(full)) {
    console.error(`Missing migration file: ${full}`);
    process.exit(1);
  }
  out += fs.readFileSync(full, 'utf8').trimEnd();
  out += '\n\n';
}

process.stdout.write(out.trimEnd() + '\n');
