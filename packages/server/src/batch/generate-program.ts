/**
 * Batch : génère le programme citoyen + suggestions
 *
 * Usage : npx tsx src/batch/generate-program.ts
 * Cron  : 0 3 * * * (3h du matin)
 *
 * Stratégie incrémentale :
 * 1. Charge le programme actuel
 * 2. Récupère uniquement les nouvelles propositions (depuis la dernière génération)
 * 3. Le LLM met à jour le programme existant (pas de re-synthèse complète)
 * 4. Génère des suggestions par profil-type
 * 5. Traite les feedbacks
 */

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(import.meta.dirname, '../../../../.env') });

import { db } from '../db/index.js';
import { proposals, programVersions, suggestions, feedback, domains } from '../db/schema.js';
import { desc, eq, inArray, gt, sql } from 'drizzle-orm';
import { extractJSON, extractClaudeText } from '../utils/helpers.js';
import { trackedAiCall } from '../services/tracked-ai.js';
import { loadPrompt, fillTemplate } from '../services/prompt-loader.js';

const MODEL = 'claude-haiku-4-5-20251001';

// ── Fallback prompt (used if no active prompt in DB) ──────────────

const FALLBACK_PROGRAM_PROMPT = `Tu es le rédacteur non partisan du Programme Citoyen de Parti-Prism, une plateforme de démocratie participative française.

MISSION : Mets à jour le programme citoyen en intégrant les nouvelles propositions reçues depuis la dernière version. Tu ne repars pas de zéro — tu enrichis, ajustes ou confirmes le programme existant.

PROGRAMME ACTUEL :
{{CURRENT_PROGRAM_JSON}}

NOUVELLES PROPOSITIONS DEPUIS LA DERNIÈRE MISE À JOUR :
{{NEW_PROPOSALS_ONLY}}

INSTRUCTIONS :
1. Intègre les nouvelles propositions dans le programme existant :
   - Si une nouvelle proposition rejoint une existante → renforcer la formulation, ne pas dupliquer
   - Si une nouvelle proposition contredit une existante → ajouter la position alternative, ajuster le consensusLevel
   - Si une nouvelle proposition ouvre un angle absent → l'ajouter comme nouvelle entrée
   - Si aucune nouvelle proposition pour un domaine → le laisser inchangé
   - Ne jamais supprimer une proposition existante sauf si elle est absorbée par une reformulation plus complète

2. Pour chaque domaine modifié, mettre à jour :
   - summary : refléter la nouvelle tendance et les tensions
   - consensusLevel : "fort" (>70% convergent), "modere" (50-70%), "clive" (<50%)
   - proposals : 3-8 max par domaine, fusionner si nécessaire

3. Pour les domaines sans proposition citoyenne (ni existante ni nouvelle), générer 2-3 propositions d'amorce variées marquées "type": "amorce"

4. Produire un "evolutionSummary" décrivant en 2-3 phrases ce qui a changé dans cette mise à jour

5. Format JSON strict :
{
  "domains": {
    "domainId": {
      "domainId": "...",
      "title": "...",
      "summary": "...",
      "consensusLevel": "fort|modere|clive",
      "proposals": [
        { "text": "...", "type": "citoyenne|amorce" }
      ]
    }
  },
  "evolutionSummary": "..."
}

Réponds UNIQUEMENT avec le JSON. Les domaines non modifiés doivent être retournés tels quels.`;

// ── 1. Générer le programme citoyen (incrémental) ─────────────────

async function generateProgram() {
  console.log('[batch] Fetching data...');

  // Get previous program
  const [previousProgram] = await db
    .select()
    .from(programVersions)
    .orderBy(desc(programVersions.generatedAt))
    .limit(1);

  const lastGeneratedAt = previousProgram?.generatedAt ?? new Date(0);
  const currentProgramJson = previousProgram
    ? JSON.stringify(previousProgram.content, null, 2)
    : '{}';

  // Get ONLY new proposals since last generation
  const validSources = ['user', 'ai_accepted', 'ai_amended'];
  const newProposals = await db
    .select()
    .from(proposals)
    .where(
      inArray(proposals.source, validSources),
    )
    .then((all) => all.filter((p) => p.createdAt > lastGeneratedAt));

  console.log(`[batch] ${newProposals.length} new proposals since last generation (${lastGeneratedAt.toISOString()})`);

  // If no new proposals and we already have a program, skip
  if (newProposals.length === 0 && previousProgram) {
    console.log('[batch] No new proposals — skipping program generation.');
    return;
  }

  // Get all domains for reference
  const allDomains = await db.select().from(domains);

  // Build new proposals block grouped by domain
  const byDomain = new Map<string, string[]>();
  for (const p of newProposals) {
    const list = byDomain.get(p.domainId) || [];
    list.push(p.text);
    byDomain.set(p.domainId, list);
  }

  let newProposalsBlock: string;
  if (newProposals.length === 0) {
    newProposalsBlock = '(Aucune nouvelle proposition — version initiale à créer à partir de rien)';
  } else {
    newProposalsBlock = allDomains
      .filter((d) => byDomain.has(d.id))
      .map((d) => {
        const props = byDomain.get(d.id)!;
        return `## ${d.label} (${d.id})\n${props.map((p, i) => `${i + 1}. ${p}`).join('\n')}`;
      })
      .join('\n\n');
  }

  // Load prompt template from DB or use fallback
  const dbTemplate = await loadPrompt('program');
  const template = dbTemplate || FALLBACK_PROGRAM_PROMPT;
  const prompt = fillTemplate(template, {
    CURRENT_PROGRAM_JSON: currentProgramJson,
    NEW_PROPOSALS_ONLY: newProposalsBlock,
  });

  console.log('[batch] Calling Claude for program generation...');
  const response = await trackedAiCall({
    promptKey: 'program',
    model: MODEL,
    maxTokens: 4000,
    messages: [{ role: 'user', content: prompt }],
  });

  const rawText = extractClaudeText(response);
  let parsed: { domains: Record<string, any>; evolutionSummary: string };
  try {
    parsed = JSON.parse(extractJSON(rawText));
  } catch {
    console.error('[batch] Failed to parse program JSON:', rawText.slice(0, 500));
    return;
  }

  // Count total proposals (all time)
  const totalProposals = await db
    .select({ count: sql<number>`count(*)` })
    .from(proposals)
    .where(inArray(proposals.source, validSources));

  // Store new program version
  const isInitial = !previousProgram;
  await db.insert(programVersions).values({
    content: parsed.domains,
    evolutionSummary: parsed.evolutionSummary,
    totalProposals: Number(totalProposals[0]?.count ?? 0),
    totalContributors: newProposals.length, // new contributions in this batch
    isInitial,
  });

  console.log(`[batch] Program generated: ${Object.keys(parsed.domains).length} domains, ${newProposals.length} new proposals integrated`);
}

// ── 2. Générer les suggestions par profil-type ──────────────────────

async function generateSuggestions() {
  console.log('[batch] Generating suggestions...');

  // Deactivate old suggestions
  await db.update(suggestions).set({ isActive: false }).where(eq(suggestions.isActive, true));

  const allDomains = await db.select().from(domains);

  const archetypes = [
    { label: 'progressiste-interventionniste', societal: 0.6, economic: -0.6, authority: 0.3, ecology: 0.5, sovereignty: 0.2 },
    { label: 'conservateur-libéral', societal: -0.5, economic: 0.5, authority: -0.3, ecology: -0.2, sovereignty: -0.4 },
    { label: 'centriste-écologiste', societal: 0.1, economic: 0, authority: 0.2, ecology: 0.7, sovereignty: 0.1 },
    { label: 'souverainiste-social', societal: -0.3, economic: -0.5, authority: -0.4, ecology: 0, sovereignty: -0.7 },
    { label: 'libertaire-mondialiste', societal: 0.5, economic: 0.3, authority: 0.7, ecology: 0.3, sovereignty: 0.6 },
  ];

  for (const archetype of archetypes) {
    const domainList = allDomains.map((d) => `${d.id} (${d.label})`).join(', ');
    const validIds = allDomains.map((d) => d.id);

    const prompt = `Tu génères des propositions politiques pour un citoyen français avec ce profil :
sociétal=${archetype.societal.toFixed(1)} (${archetype.societal > 0 ? 'progressiste' : 'conservateur'}),
économique=${archetype.economic.toFixed(1)} (${archetype.economic > 0 ? 'libéral' : 'interventionniste'}),
autorité=${archetype.authority.toFixed(1)} (${archetype.authority > 0 ? 'libertaire' : 'autoritaire'}),
écologie=${archetype.ecology.toFixed(1)} (${archetype.ecology > 0 ? 'écologiste' : 'productiviste'}),
souveraineté=${archetype.sovereignty.toFixed(1)} (${archetype.sovereignty > 0 ? 'mondialiste' : 'souverainiste'})

Domaines (utilise EXACTEMENT ces identifiants dans domainId) : ${domainList}

Génère 2 propositions par domaine, adaptées à ce profil. Chaque proposition doit être concrète, actionable (pas de vœux pieux), et formulée de manière positive.

Format JSON :
[{"domainId": "travail", "text": "..."}, ...]

IMPORTANT : domainId doit être EXACTEMENT un de : ${validIds.join(', ')}

Réponds UNIQUEMENT avec le JSON.`;

    try {
      const response = await trackedAiCall({
        promptKey: 'suggestions',
        model: MODEL,
        maxTokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      });

      const rawSugg = extractClaudeText(response);
      const parsed = JSON.parse(extractJSON(rawSugg)) as Array<{ domainId: string; text: string }>;

      for (const s of parsed) {
        if (!validIds.includes(s.domainId)) {
          console.warn(`[batch] Skipping invalid domainId: "${s.domainId}"`);
          continue;
        }
        await db.insert(suggestions).values({
          domainId: s.domainId,
          text: s.text,
          targetSocietal: archetype.societal,
          targetEconomic: archetype.economic,
          targetAuthority: archetype.authority,
          targetEcology: archetype.ecology,
          targetSovereignty: archetype.sovereignty,
          isActive: true,
        });
      }

      console.log(`[batch] Generated ${parsed.length} suggestions for archetype: ${archetype.label}`);
    } catch (err) {
      console.error(`[batch] Failed for archetype ${archetype.label}:`, err);
    }
  }
}

// ── 3. Traiter les feedbacks ────────────────────────────────────────

async function processFeedback() {
  console.log('[batch] Processing feedback...');

  const unprocessed = await db
    .select()
    .from(feedback)
    .where(eq(feedback.processed, false));

  if (unprocessed.length === 0) {
    console.log('[batch] No unprocessed feedback.');
    return;
  }

  const byType = new Map<string, number>();
  for (const f of unprocessed) {
    byType.set(f.feedbackType, (byType.get(f.feedbackType) || 0) + 1);
  }

  console.log('[batch] Feedback summary:');
  for (const [type, count] of byType) {
    console.log(`  - ${type}: ${count}`);
  }

  const ids = unprocessed.map((f) => f.id);
  await db
    .update(feedback)
    .set({ processed: true, processedAt: new Date() })
    .where(inArray(feedback.id, ids));

  console.log(`[batch] Marked ${ids.length} feedback items as processed.`);
}

// ── Main ─────────────────────────────────────────────────────────────

async function main() {
  console.log('[batch] === PartiPrism Daily Batch ===');
  console.log(`[batch] Started at ${new Date().toISOString()}`);

  await generateProgram();
  await generateSuggestions();
  await processFeedback();

  console.log('[batch] Done.');
  process.exit(0);
}

main().catch((err) => {
  console.error('[batch] Fatal error:', err);
  process.exit(1);
});
