/**
 * Re-seed uniquement les médias (sans toucher aux autres tables).
 * Supprime aussi les mediaRatings citoyennes (liées aux anciens IDs).
 * Usage: npx tsx src/scripts/reseed-medias.ts
 */
import { db } from '../db/index.js';
import { medias, mediaRatings } from '../db/schema.js';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const DATA_DIR = path.resolve(import.meta.dirname, '../../../../data');

async function main() {
  const raw = fs.readFileSync(path.join(DATA_DIR, 'medias/sources.yaml'), 'utf-8');
  const data = yaml.load(raw) as { sources: any[] };

  console.log(`[reseed-medias] Deleting existing media ratings...`);
  await db.delete(mediaRatings);

  console.log(`[reseed-medias] Deleting existing medias...`);
  await db.delete(medias);

  console.log(`[reseed-medias] Inserting ${data.sources.length} medias...`);
  for (const m of data.sources) {
    await db.insert(medias).values({
      id: m.id,
      label: m.label,
      type: m.type,
      url: m.url ?? null,
      position1d: m.position_1d ?? 0,
      positionSocietal: m.position.societal,
      positionEconomic: m.position.economic,
      positionAuthority: m.position.authority,
      positionEcology: m.position.ecology,
      positionSovereignty: m.position.sovereignty,
      owner: m.owner ?? null,
      independent: m.independent ?? false,
      editorialLabel: m.editorial_label ?? null,
    });
  }

  console.log('[reseed-medias] Done!');
  process.exit(0);
}

main().catch((err) => {
  console.error('[reseed-medias] Error:', err);
  process.exit(1);
});
