/**
 * Re-seed uniquement les partis (sans toucher aux autres tables).
 * Usage: npx tsx src/scripts/reseed-parties.ts
 */
import { db } from '../db/index.js';
import { partis } from '../db/schema.js';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const DATA_DIR = path.resolve(import.meta.dirname, '../../../../data');

async function main() {
  const raw = fs.readFileSync(path.join(DATA_DIR, 'parties/parties.yaml'), 'utf-8');
  const data = yaml.load(raw) as { partis: any[] };

  console.log(`[reseed-parties] Deleting existing parties...`);
  await db.delete(partis);

  console.log(`[reseed-parties] Inserting ${data.partis.length} parties...`);
  for (const p of data.partis) {
    await db.insert(partis).values({
      id: p.id,
      label: p.label,
      abbreviation: p.abbreviation,
      position1d: p.position_1d,
      positionSocietal: p.position.societal,
      positionEconomic: p.position.economic,
      positionAuthority: p.position.authority,
      positionEcology: p.position.ecology,
      positionSovereignty: p.position.sovereignty,
      color: p.color,
      leader: p.leader ?? null,
    });
  }

  console.log('[reseed-parties] Done!');
  process.exit(0);
}

main().catch((err) => {
  console.error('[reseed-parties] Error:', err);
  process.exit(1);
});
