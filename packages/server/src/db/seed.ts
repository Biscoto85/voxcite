import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

// Load .env from project root
dotenv.config({ path: path.resolve(import.meta.dirname, '../../../../.env') });
import { db } from './index.js';
import { domains, themes, partis, questions, medias, prompts, snapshots, votes, responses, biases, sharedLinks, mediaRatings, proposals, feedback, suggestions, programVersions, opinions, subjects } from './schema.js';
import { and as dbAnd, eq as dbEq } from 'drizzle-orm';

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
  position: { societal: number; economic: number; authority: number; ecology: number; sovereignty: number };
  color: string;
  leader?: string;
}

function parsePartis() {
  const raw = fs.readFileSync(path.join(DATA_DIR, 'parties/parties.yaml'), 'utf-8');
  const data = yaml.load(raw) as { partis: RawParti[] };
  return data.partis;
}

// ── Parse sources.yaml (medias) ────────────────────────────────────

interface RawMedia {
  id: string;
  label: string;
  type: string;
  url?: string;
  position_1d: number;
  position: { societal: number; economic: number; authority: number; ecology: number; sovereignty: number };
  owner?: string;
  independent?: boolean;
  editorial_label?: string;
}

function parseMedias(): RawMedia[] {
  const raw = fs.readFileSync(path.join(DATA_DIR, 'medias/sources.yaml'), 'utf-8');
  const data = yaml.load(raw) as { sources: RawMedia[] };
  return data.sources;
}

// ── Parse questions.md ─────────────────────────────────────────────

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

    const axesRaw = match('axes');
    if (axesRaw) {
      try {
        q.axes = JSON.parse(axesRaw);
      } catch {
        // ignore parse errors
      }
    }

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

  // Clear ALL tables (leaf tables first, then parents)
  console.log('[seed] Clearing existing data...');
  await db.delete(feedback);
  await db.delete(programVersions);
  await db.delete(proposals);
  await db.delete(suggestions);
  await db.delete(mediaRatings);
  await db.delete(sharedLinks);
  await db.delete(biases);
  await db.delete(votes);
  await db.delete(snapshots);
  await db.delete(responses);
  await db.delete(opinions);
  await db.delete(subjects);
  await db.delete(questions);
  await db.delete(themes);
  await db.delete(medias);
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
      positionAuthority: p.position.authority,
      positionEcology: p.position.ecology,
      positionSovereignty: p.position.sovereignty,
      color: p.color,
      leader: p.leader ?? null,
    });
  }

  // Seed medias
  const rawMedias = parseMedias();
  console.log(`[seed] Inserting ${rawMedias.length} medias...`);

  for (const m of rawMedias) {
    await db.insert(medias).values({
      id: m.id,
      label: m.label,
      type: m.type,
      url: m.url ?? null,
      position1d: m.position_1d,
      positionSocietal: m.position.societal,
      positionEconomic: m.position.economic,
      positionAuthority: m.position.authority,
      positionEcology: m.position.ecology,
      positionSovereignty: m.position.sovereignty,
      owner: m.owner ?? null,
      independent: m.independent ?? false,
      editorialLabel: m.description ?? m.editorial_label ?? null,
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
      axes: q.axes ?? null,
      options: q.options ?? null,
    });
  }

  // Seed prompts (from data/prompts/*.txt) — only if no active prompt exists
  const promptFiles = [
    { key: 'analysis', label: 'Analyse politique', file: 'analysis.txt' },
    { key: 'program', label: 'Programme citoyen', file: 'program.txt' },
    { key: 'link_validation', label: 'Validation de lien', file: 'link_validation.txt' },
  ];

  let promptCount = 0;
  for (const pf of promptFiles) {
    try {
      const content = fs.readFileSync(path.join(DATA_DIR, 'prompts', pf.file), 'utf-8');
      // Check if this key already has an active prompt
      const existing = await db.select().from(prompts).where(
        dbAnd(dbEq(prompts.key, pf.key), dbEq(prompts.isActive, true)),
      );
      if (existing.length === 0) {
        await db.insert(prompts).values({
          key: pf.key,
          label: pf.label,
          content,
          version: 1,
          isActive: true,
          createdBy: 'seed',
        });
        promptCount++;
      }
    } catch (err) {
      console.warn(`[seed] Prompt file ${pf.file} not found, skipping`);
    }
  }

  console.log('[seed] Done!');
  console.log(`  - ${rawDomains.length} domains`);
  console.log(`  - ${rawDomains.reduce((acc, d) => acc + d.themes_permanents.length, 0)} themes`);
  console.log(`  - ${rawPartis.length} partis`);
  console.log(`  - ${rawMedias.length} medias`);
  console.log(`  - ${rawQuestions.length} questions`);
  console.log(`  - ${promptCount} prompts (new)`);

  process.exit(0);
}

main().catch((err) => {
  console.error('[seed] Error:', err);
  process.exit(1);
});
