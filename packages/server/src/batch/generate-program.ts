/**
 * Batch quotidien : génère le programme citoyen + suggestions
 *
 * Usage : npx tsx src/batch/generate-program.ts
 * Cron  : 0 3 * * * (3h du matin)
 *
 * 1. Récupère toutes les propositions (user + ai_accepted + ai_amended)
 * 2. Récupère le programme précédent (pour l'évolution)
 * 3. Génère le nouveau programme via Claude Haiku
 * 4. Génère des suggestions personnalisées par profil-type
 * 5. Traite les feedbacks pour améliorer les prompts
 */

import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import { db } from '../db/index.js';
import { proposals, programVersions, suggestions, feedback, domains, sessions } from '../db/schema.js';
import { desc, eq, inArray, sql, isNotNull } from 'drizzle-orm';

const MODEL = 'claude-haiku-4-5-20251001';
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

/** Strip markdown code fences from Claude responses */
function extractJSON(raw: string): string {
  return raw.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
}

// ── 1. Générer le programme citoyen ─────────────────────────────────

async function generateProgram() {
  console.log('[batch] Fetching proposals...');

  // All accepted proposals (user-written, ai-accepted, ai-amended)
  const validSources = ['user', 'ai_accepted', 'ai_amended'];
  const allProposals = await db
    .select()
    .from(proposals)
    .where(inArray(proposals.source, validSources));

  console.log(`[batch] ${allProposals.length} valid proposals found`);

  // Group by domain
  const byDomain = new Map<string, string[]>();
  for (const p of allProposals) {
    const list = byDomain.get(p.domainId) || [];
    list.push(p.text);
    byDomain.set(p.domainId, list);
  }

  // Get all domains
  const allDomains = await db.select().from(domains);

  // Get previous program for evolution comparison
  const [previousProgram] = await db
    .select()
    .from(programVersions)
    .orderBy(desc(programVersions.generatedAt))
    .limit(1);

  // Count unique contributors
  const contributorCount = await db
    .select({ count: sql<number>`count(distinct ${proposals.sessionId})` })
    .from(proposals)
    .where(inArray(proposals.source, validSources));

  const totalContributors = Number(contributorCount[0]?.count ?? 0);

  // Build prompt
  const domainBlocks = allDomains.map((d) => {
    const domainProposals = byDomain.get(d.id) || [];
    return `## ${d.label} (${d.id})
Propositions citoyennes (${domainProposals.length}) :
${domainProposals.length > 0 ? domainProposals.map((p, i) => `${i + 1}. ${p}`).join('\n') : '(aucune proposition encore)'}`;
  }).join('\n\n');

  const previousSummary = previousProgram
    ? `\nPROGRAMME PRÉCÉDENT (pour comparer l'évolution) :\n${JSON.stringify(previousProgram.content, null, 2).slice(0, 3000)}`
    : '';

  const prompt = `Tu es le rédacteur du Programme Citoyen de VoxCité, une plateforme de démocratie participative française.

MISSION : Synthétise les propositions des citoyens en un programme cohérent, structuré par domaine thématique.

PROPOSITIONS CITOYENNES PAR DOMAINE :

${domainBlocks}
${previousSummary}

INSTRUCTIONS :
1. Pour chaque domaine, produis :
   - title: le titre du domaine
   - summary: 1 phrase résumant la tendance des propositions citoyennes
   - proposals: 3-8 propositions synthétisées (reformulées pour être claires et actionables)
   - Si aucune proposition citoyenne n'existe pour un domaine, génère 2-3 propositions "neutres" équilibrées (à challenger par les citoyens)

2. Produis aussi un "evolutionSummary" : 2-3 phrases décrivant comment le programme a évolué par rapport à la version précédente (ou "Version initiale du programme" si c'est le premier).

3. Format JSON strict :
{
  "domains": {
    "domainId": {
      "domainId": "...",
      "title": "...",
      "summary": "...",
      "proposals": ["...", "..."]
    }
  },
  "evolutionSummary": "..."
}

Réponds UNIQUEMENT avec le JSON.`;

  console.log('[batch] Calling Claude Haiku for program generation...');
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }],
  });

  const rawText = response.content[0].type === 'text' ? response.content[0].text : '';
  let parsed: { domains: Record<string, any>; evolutionSummary: string };
  try {
    parsed = JSON.parse(extractJSON(rawText));
  } catch {
    console.error('[batch] Failed to parse program JSON:', text.slice(0, 500));
    return;
  }

  // Store new program version
  const isInitial = !previousProgram;
  await db.insert(programVersions).values({
    content: parsed.domains,
    evolutionSummary: parsed.evolutionSummary,
    totalProposals: allProposals.length,
    totalContributors,
    isInitial,
  });

  console.log(`[batch] Program generated: ${Object.keys(parsed.domains).length} domains, ${allProposals.length} proposals from ${totalContributors} contributors`);
}

// ── 2. Générer les suggestions par profil-type ──────────────────────

async function generateSuggestions() {
  console.log('[batch] Generating suggestions...');

  // Deactivate old suggestions
  await db.update(suggestions).set({ isActive: false }).where(eq(suggestions.isActive, true));

  // Get all domains
  const allDomains = await db.select().from(domains);

  // Define profile archetypes for diverse suggestions
  const archetypes = [
    { label: 'progressiste-interventionniste', societal: 0.6, economic: -0.6, authority: 0.3, ecology: 0.5, sovereignty: 0.2 },
    { label: 'conservateur-libéral', societal: -0.5, economic: 0.5, authority: -0.3, ecology: -0.2, sovereignty: -0.4 },
    { label: 'centriste-écologiste', societal: 0.1, economic: 0, authority: 0.2, ecology: 0.7, sovereignty: 0.1 },
    { label: 'souverainiste-social', societal: -0.3, economic: -0.5, authority: -0.4, ecology: 0, sovereignty: -0.7 },
    { label: 'libertaire-mondialiste', societal: 0.5, economic: 0.3, authority: 0.7, ecology: 0.3, sovereignty: 0.6 },
  ];

  for (const archetype of archetypes) {
    const domainList = allDomains.map((d) => d.label).join(', ');

    const prompt = `Tu génères des propositions politiques pour un citoyen français avec ce profil :
sociétal=${archetype.societal.toFixed(1)} (${archetype.societal > 0 ? 'progressiste' : 'conservateur'}),
économique=${archetype.economic.toFixed(1)} (${archetype.economic > 0 ? 'libéral' : 'interventionniste'}),
autorité=${archetype.authority.toFixed(1)} (${archetype.authority > 0 ? 'libertaire' : 'autoritaire'}),
écologie=${archetype.ecology.toFixed(1)} (${archetype.ecology > 0 ? 'écologiste' : 'productiviste'}),
souveraineté=${archetype.sovereignty.toFixed(1)} (${archetype.sovereignty > 0 ? 'mondialiste' : 'souverainiste'})

Domaines : ${domainList}

Génère 2 propositions par domaine, adaptées à ce profil. Chaque proposition doit être concrète, actionable (pas de vœux pieux), et formulée de manière positive.

Format JSON :
[{"domainId": "travail", "text": "..."}, ...]

Réponds UNIQUEMENT avec le JSON.`;

    try {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      });

      const rawSugg = response.content[0].type === 'text' ? response.content[0].text : '';
      const parsed = JSON.parse(extractJSON(rawSugg)) as Array<{ domainId: string; text: string }>;

      for (const s of parsed) {
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

  // Group by type for logging/future processing
  const byType = new Map<string, number>();
  for (const f of unprocessed) {
    byType.set(f.feedbackType, (byType.get(f.feedbackType) || 0) + 1);
  }

  console.log('[batch] Feedback summary:');
  for (const [type, count] of byType) {
    console.log(`  - ${type}: ${count}`);
  }

  // Mark as processed
  const ids = unprocessed.map((f) => f.id);
  await db
    .update(feedback)
    .set({ processed: true, processedAt: new Date() })
    .where(inArray(feedback.id, ids));

  // TODO: Use Claude to analyze feedback and suggest question improvements
  // For now, just log and mark processed
  console.log(`[batch] Marked ${ids.length} feedback items as processed.`);
}

// ── Main ─────────────────────────────────────────────────────────────

async function main() {
  console.log('[batch] === VoxCité Daily Batch ===');
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
