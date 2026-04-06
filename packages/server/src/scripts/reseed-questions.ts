/**
 * Re-seed uniquement les questions (sans toucher aux autres tables).
 *
 * Par défaut : upsert (INSERT ... ON CONFLICT DO UPDATE).
 *   - Les questions existantes sont mises à jour (texte, axe, polarité, etc.)
 *   - Les votes existants sont préservés (aucune donnée utilisateur détruite)
 *   - Les questions supprimées du .md restent en base (orphelines, non affichées)
 *
 * Avec --clean :
 *   - Supprime aussi les questions orphelines (plus dans le .md)
 *   - Supprime les votes liés à ces questions au préalable
 *   - À utiliser uniquement si tu es sûr que ces votes sont inutiles
 *
 * Usage:
 *   cd packages/server
 *   npx tsx src/scripts/reseed-questions.ts
 *   npx tsx src/scripts/reseed-questions.ts --clean
 */

import { db } from '../db/index.js';
import { questions, votes } from '../db/schema.js';
import { inArray, notInArray, sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve(import.meta.dirname, '../../../../data');
const CLEAN = process.argv.includes('--clean');

// ── Parser (identique à seed.ts) ──────────────────────────────────────

interface ParsedQuestion {
  id: string;
  text: string;
  type: string;
  axis: string;
  axes?: string[];
  polarity: number;
  domain: string;
  phase: string;
  weight: number;
  options?: string[];
}

function parseQuestions(): ParsedQuestion[] {
  const raw = fs.readFileSync(path.join(DATA_DIR, 'questions/questions.md'), 'utf-8');
  const result: ParsedQuestion[] = [];

  const questionBlocks = raw.split(/^###+ Q\d+/m).slice(1);

  for (const block of questionBlocks) {
    const q: Partial<ParsedQuestion> = {};

    const match = (key: string) => {
      const regex = new RegExp(`\\*\\*${key}\\*\\*\\s*:\\s*(.+)`, 'i');
      const m = block.match(regex);
      return m ? m[1].trim() : null;
    };

    q.id = match('id')?.replace(/`/g, '') ?? '';
    q.text = match('text')?.replace(/^"|"$/g, '') ?? '';
    q.type = match('type') ?? 'affirmation';
    q.axis = match('axis') ?? 'societal';
    q.polarity = parseFloat(match('polarity') ?? '1');
    q.domain = match('domain') ?? '';
    q.phase = match('phase') ?? 'deep';
    q.weight = parseFloat(match('weight') ?? '1.0');

    const axesRaw = match('axes');
    if (axesRaw) {
      try { q.axes = JSON.parse(axesRaw); } catch { /* ignore */ }
    }

    const optionsRaw = match('options');
    if (optionsRaw) {
      try { q.options = JSON.parse(optionsRaw); } catch { /* ignore */ }
    }

    if (q.id && q.text) {
      result.push(q as ParsedQuestion);
    }
  }

  return result;
}

// ── Main ──────────────────────────────────────────────────────────────

async function main() {
  console.log('[reseed-questions] Parsing questions.md...');
  const parsed = parseQuestions();
  console.log(`[reseed-questions] ${parsed.length} questions trouvées dans le .md`);

  if (parsed.length === 0) {
    console.error('[reseed-questions] ⛔ Aucune question parsée — vérifier le format du .md');
    process.exit(1);
  }

  const newIds = parsed.map(q => q.id);

  // ── Upsert all new questions ────────────────────────────────────────
  console.log('[reseed-questions] Upserting questions...');
  let upserted = 0;

  for (const q of parsed) {
    await db.insert(questions)
      .values({
        id: q.id,
        text: q.text,
        type: q.type,
        axis: q.axis,
        polarity: q.polarity,
        domainId: q.domain,
        phase: q.phase,
        weight: q.weight,
        axes: q.axes ?? null,
        options: q.options ?? null,
      })
      .onConflictDoUpdate({
        target: questions.id,
        set: {
          text: q.text,
          type: q.type,
          axis: q.axis,
          polarity: q.polarity,
          domainId: q.domain,
          phase: q.phase,
          weight: q.weight,
          axes: q.axes ?? null,
          options: q.options ?? null,
        },
      });
    upserted++;
  }

  console.log(`[reseed-questions] ✓ ${upserted} questions upsertées`);

  // ── Detect orphans (in DB but not in new MD) ────────────────────────
  const allInDb = await db.select({ id: questions.id }).from(questions);
  const orphanIds = allInDb.map(r => r.id).filter(id => !newIds.includes(id));

  if (orphanIds.length === 0) {
    console.log('[reseed-questions] Aucune question orpheline.');
  } else {
    // Count votes per orphan
    const orphanVotes = await db
      .select({ questionId: votes.questionId, count: sql<number>`count(*)` })
      .from(votes)
      .where(inArray(votes.questionId, orphanIds))
      .groupBy(votes.questionId);

    const voteCounts = Object.fromEntries(orphanVotes.map(r => [r.questionId, Number(r.count)]));
    const totalOrphanVotes = Object.values(voteCounts).reduce((a, b) => a + b, 0);

    console.warn(`[reseed-questions] ⚠️  ${orphanIds.length} question(s) orpheline(s) (plus dans le .md) :`);
    for (const id of orphanIds) {
      console.warn(`  - ${id} (${voteCounts[id] ?? 0} vote(s))`);
    }
    console.warn(`  Total votes orphelins : ${totalOrphanVotes}`);

    if (CLEAN) {
      if (totalOrphanVotes > 0) {
        console.log(`[reseed-questions] --clean : suppression de ${totalOrphanVotes} vote(s) orphelin(s)...`);
        await db.delete(votes).where(inArray(votes.questionId, orphanIds));
      }
      console.log(`[reseed-questions] --clean : suppression de ${orphanIds.length} question(s) orpheline(s)...`);
      await db.delete(questions).where(inArray(questions.id, orphanIds));
      console.log('[reseed-questions] ✓ Nettoyage terminé.');
    } else {
      console.warn('[reseed-questions] Les orphelines sont conservées en base (invisible dans l\'app).');
      console.warn('[reseed-questions] Pour les supprimer : relancer avec --clean');
    }
  }

  console.log('[reseed-questions] Done!');
  process.exit(0);
}

main().catch((err) => {
  console.error('[reseed-questions] Error:', err);
  process.exit(1);
});
