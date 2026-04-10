import { Router } from 'express';
import { db } from '../db/index.js';
import { medias, mediaRatings, sharedLinks, mediaProposals } from '../db/schema.js';
import { eq, desc, and, sql } from 'drizzle-orm';
import { clamp, isValidHttpUrl, extractClaudeText } from '../utils/helpers.js';
import { aiRateLimit } from '../middleware/rateLimit.js';
import { trackedAiCall } from '../services/tracked-ai.js';
import { loadPrompt, fillTemplate } from '../services/prompt-loader.js';

export const critiqueRouter = Router();

// ── Whitelist of allowed media domains (loaded from DB at startup) ──
// Rebuilt every hour so newly-added medias are picked up without restart.
let allowedDomains: Set<string> = new Set();
let lastDomainRefresh = 0;
const DOMAIN_REFRESH_INTERVAL_MS = 60 * 60 * 1_000; // 1 hour

async function getAllowedDomains(): Promise<Set<string>> {
  if (Date.now() - lastDomainRefresh < DOMAIN_REFRESH_INTERVAL_MS && allowedDomains.size > 0) {
    return allowedDomains;
  }
  try {
    const rows = await db.select({ url: medias.url }).from(medias);
    const domains = new Set<string>();
    for (const row of rows) {
      if (!row.url) continue;
      try {
        const hostname = new URL(row.url).hostname.replace(/^www\./, '');
        domains.add(hostname);
      } catch { /* ignore invalid URLs */ }
    }
    allowedDomains = domains;
    lastDomainRefresh = Date.now();
  } catch { /* keep existing set on DB failure */ }
  return allowedDomains;
}

function extractDomain(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

// ── GET /medias — All media sources with editorial positions ────────

critiqueRouter.get('/medias', async (req, res) => {
  const allMedias = await db.select().from(medias);

  const result = allMedias.map((m) => ({
    id: m.id,
    label: m.label,
    type: m.type,
    url: m.url,
    editorialLabel: m.editorialLabel,
    owner: m.owner,
    position: {
      societal: m.citizenSocietal ?? m.positionSocietal,
      economic: m.citizenEconomic ?? m.positionEconomic,
      authority: m.positionAuthority,
      ecology: m.positionEcology,
      sovereignty: m.positionSovereignty,
    },
    // Raw editorial position for comparison
    editorialPosition: {
      societal: m.positionSocietal,
      economic: m.positionEconomic,
    },
    citizenRatingCount: m.citizenRatingCount,
  }));

  res.json(result);
});

// ── POST /medias/:id/rate — Rate a media (2 axes) ──────────────────

critiqueRouter.post('/medias/:id/rate', async (req, res) => {
  const mediaId = req.params.id;
  const { societal, economic } = req.body as {
    societal: number;
    economic: number;
  };

  if (societal == null || economic == null) {
    res.status(400).json({ error: 'societal and economic required' });
    return;
  }

  // Store the anonymous rating
  await db.insert(mediaRatings).values({
    mediaId,
    ratedSocietal: clamp(societal),
    ratedEconomic: clamp(economic),
  });

  // Recalculate citizen average for this media
  const allRatings = await db
    .select()
    .from(mediaRatings)
    .where(eq(mediaRatings.mediaId, mediaId));

  const n = allRatings.length;
  const avgSoc = allRatings.reduce((s, r) => s + r.ratedSocietal, 0) / n;
  const avgEco = allRatings.reduce((s, r) => s + r.ratedEconomic, 0) / n;

  // Get editorial base
  const [media] = await db.select().from(medias).where(eq(medias.id, mediaId));
  if (!media) { res.status(404).json({ error: 'media not found' }); return; }

  // Blend: 70% editorial + 30% citizen (anti-brigading)
  const blendedSoc = media.positionSocietal * 0.7 + avgSoc * 0.3;
  const blendedEco = media.positionEconomic * 0.7 + avgEco * 0.3;

  await db.update(medias).set({
    citizenSocietal: blendedSoc,
    citizenEconomic: blendedEco,
    citizenRatingCount: n,
  }).where(eq(medias.id, mediaId));

  res.json({ citizenSocietal: blendedSoc, citizenEconomic: blendedEco, ratingCount: n });
});

// ── GET /links — Shared links by domain ────────────────────────────

critiqueRouter.get('/links', async (req, res) => {
  const { domain } = req.query as { domain?: string };

  const where = domain
    ? and(eq(sharedLinks.status, 'approved'), eq(sharedLinks.domainId, domain))
    : eq(sharedLinks.status, 'approved');

  const links = await db
    .select()
    .from(sharedLinks)
    .where(where)
    .orderBy(desc(sharedLinks.createdAt))
    .limit(50);

  res.json(links.map((l) => ({
    id: l.id,
    domainId: l.domainId,
    url: l.url,
    description: l.validatedDescription || l.description,
    createdAt: l.createdAt,
  })));
});

// ── POST /links — Share a link (validated by Haiku) ─────────────────

critiqueRouter.post('/links', aiRateLimit, async (req, res) => {
  const { domainId, url, description } = req.body as {
    domainId: string;
    url: string;
    description: string;
  };

  if (!domainId || !url || !description) {
    res.status(400).json({ error: 'domainId, url and description required' });
    return;
  }

  if (!isValidHttpUrl(url)) {
    res.status(400).json({ error: 'Invalid URL (must be http or https)' });
    return;
  }

  // Check domain whitelist
  const urlDomain = extractDomain(url);
  const domains = await getAllowedDomains();
  if (urlDomain && !domains.has(urlDomain)) {
    res.status(422).json({
      error: 'domain_not_whitelisted',
      domain: urlDomain,
      message: `Le domaine "${urlDomain}" n'est pas dans notre liste de médias référencés. Tu peux proposer ce média via le formulaire "Proposer un média".`,
    });
    return;
  }

  let validatedDescription = description;
  let status = 'approved'; // default if no API key

  // Validate with Haiku if available
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      // Load prompt from DB or use fallback
      const dbTemplate = await loadPrompt('link_validation');
      const fallback = `Tu valides un lien partagé par un citoyen sur PartiPrism (plateforme de démocratie participative).

Thème : {{DOMAIN_ID}}
URL : {{URL}}
Description proposée : "{{DESCRIPTION}}"

Réponds en JSON strict :
{
  "status": "approved" ou "rejected",
  "reason": "raison courte si rejeté (spam, hors sujet, haineux)",
  "correctedDescription": "description corrigée (plus factuelle, plus neutre, 1 phrase max). Si la description originale est OK, reprends-la telle quelle."
}

Critères de rejet : spam, contenu haineux, lien clairement hors thème.
Critères de correction : rendre factuel, retirer les adjectifs partisans.
Sois tolérant : on veut de la diversité d'opinions.

Réponds UNIQUEMENT avec le JSON.`;
      const promptContent = fillTemplate(dbTemplate || fallback, {
        DOMAIN_ID: domainId,
        URL: url,
        DESCRIPTION: description,
      });

      const response = await trackedAiCall({
        promptKey: 'link_validation',
        model: 'claude-haiku-4-5-20251001',
        maxTokens: 300,
        messages: [{ role: 'user', content: promptContent }],
      });

      const rawText = extractClaudeText(response);
      const cleaned = rawText.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
      const parsed = JSON.parse(cleaned);
      status = parsed.status || 'approved';
      validatedDescription = parsed.correctedDescription || description;
    } catch (err) {
      console.error('[critique] Haiku validation failed, auto-approving:', err);
    }
  }

  const [row] = await db.insert(sharedLinks).values({
    domainId,
    url,
    description,
    validatedDescription: validatedDescription !== description ? validatedDescription : null,
    status,
  }).returning();

  res.status(201).json({
    id: row.id,
    status,
    description: validatedDescription,
  });
});

// ── POST /medias/propose — Propose a new media for whitelist review ──

critiqueRouter.post('/medias/propose', async (req, res) => {
  const { url, label, notes } = req.body as { url: string; label: string; notes?: string };

  if (!url || !label) {
    res.status(400).json({ error: 'url and label required' });
    return;
  }

  if (!isValidHttpUrl(url)) {
    res.status(400).json({ error: 'Invalid URL' });
    return;
  }

  if (label.trim().length < 2 || label.trim().length > 100) {
    res.status(400).json({ error: 'label must be 2–100 characters' });
    return;
  }

  try {
    const [row] = await db.insert(mediaProposals).values({
      url: url.trim(),
      label: label.trim(),
      notes: notes?.trim() || null,
    }).returning({ id: mediaProposals.id });

    res.status(201).json({ id: row.id, message: 'Proposition enregistrée — notre équipe la traitera prochainement.' });
  } catch (err) {
    console.error('[critique] Failed to insert media proposal:', err);
    res.status(500).json({ error: 'Failed to save proposal' });
  }
});
