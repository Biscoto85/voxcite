import 'dotenv/config';

/**
 * Script de seed : importe les données de référence depuis data/
 * vers la base de données PostgreSQL.
 *
 * Sources (contenu éditorial, séparé du code) :
 *   - data/domains.yaml       → table domains + themes
 *   - data/parties/parties.yaml → table parties
 *   - data/questions/          → table questions
 *   - data/medias/             → table medias
 *
 * Usage : npm run db:seed
 */
async function main() {
  console.log('[seed] Starting seed...');
  // TODO: parse YAML files from data/ and insert into DB
  console.log('[seed] Done.');
}

main().catch((err) => {
  console.error('[seed] Error:', err);
  process.exit(1);
});
