import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { db } from './index.js';
import { domains, themes, partis, questions } from './schema.js';

const DATA_DIR = path.resolve(import.meta.dirname, '../../../../data');

// ── Parse domains.yaml ─────────────────────────────────────────────

interface RawDomain {
  id: string;
  label: string;
  order: number;
  description: string;
  dimension_societale: Record<string, string>;
  dimension_economique: Record<string, string>;
  themes_permanents: Array<{ id: string; label: string }>;
}

function parseDomains() {
  const raw = fs.readFileSync(path.join(DATA_DIR, 'domains/domains.yaml'), 'utf-8');
  const data = yaml.load(raw) as { domains: RawDomain[] };
  return data.domains;
}

// ── Parse parties.yaml ─────────────────────────────────────────────

interface RawParti {
  id: string;
  label: string;
  abbreviation: string;
  position_1d: number;
  position: { societal: number; economic: number };
  color: string;
  leader?: string;
}

function parsePartis() {
  const raw = fs.readFileSync(path.join(DATA_DIR, 'parties/parties.yaml'), 'utf-8');
  const data = yaml.load(raw) as { partis: RawParti[] };
  return data.partis;
}

// ── Parse questions.md ─────────────────────────────────────────────

interface ParsedQuestion {
  id: string;
  text: string;
  type: string;
  axis: string;
  polarity: number;
  domain: string;
  phase: string;
  weight: number;
  options?: string[];
}

function parseQuestions(): ParsedQuestion[] {
  const raw = fs.readFileSync(path.join(DATA_DIR, 'questions/questions.md'), 'utf-8');
  const result: ParsedQuestion[] = [];

  // Split by ### Q headings
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

    const optionsRaw = match('options');
    if (optionsRaw) {
      try {
        q.options = JSON.parse(optionsRaw);
      } catch {
        // ignore parse errors
      }
    }

    if (q.id && q.text) {
      result.push(q as ParsedQuestion);
    }
  }

  return result;
}

// ── Seed ────────────────────────────────────────────────────────────

async function main() {
  console.log('[seed] Starting seed...');

  // Clear existing data (in reverse dependency order)
  console.log('[seed] Clearing existing data...');
  await db.delete(questions);
  await db.delete(themes);
  await db.delete(partis);
  await db.delete(domains);

  // Seed domains + themes
  const rawDomains = parseDomains();
  console.log(`[seed] Inserting ${rawDomains.length} domains...`);

  for (const d of rawDomains) {
    await db.insert(domains).values({
      id: d.id,
      label: d.label,
      order: d.order,
      description: d.description,
      dimensionSocietale: d.dimension_societale,
      dimensionEconomique: d.dimension_economique,
    });

    for (const t of d.themes_permanents) {
      await db.insert(themes).values({
        id: t.id,
        domainId: d.id,
        label: t.label,
      });
    }
  }

  // Seed partis
  const rawPartis = parsePartis();
  console.log(`[seed] Inserting ${rawPartis.length} partis...`);

  for (const p of rawPartis) {
    await db.insert(partis).values({
      id: p.id,
      label: p.label,
      abbreviation: p.abbreviation,
      position1d: p.position_1d,
      positionSocietal: p.position.societal,
      positionEconomic: p.position.economic,
      color: p.color,
      leader: p.leader ?? null,
    });
  }

  // Seed questions
  const rawQuestions = parseQuestions();
  console.log(`[seed] Inserting ${rawQuestions.length} questions...`);

  for (const q of rawQuestions) {
    await db.insert(questions).values({
      id: q.id,
      text: q.text,
      type: q.type,
      axis: q.axis,
      polarity: q.polarity,
      domainId: q.domain,
      phase: q.phase,
      weight: q.weight,
      options: q.options ?? null,
    });
  }

  console.log('[seed] Done!');
  console.log(`  - ${rawDomains.length} domains`);
  console.log(`  - ${rawDomains.reduce((acc, d) => acc + d.themes_permanents.length, 0)} themes`);
  console.log(`  - ${rawPartis.length} partis`);
  console.log(`  - ${rawQuestions.length} questions`);

  process.exit(0);
}

main().catch((err) => {
  console.error('[seed] Error:', err);
  process.exit(1);
});
