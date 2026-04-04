import { Router } from 'express';
import { db } from '../db/index.js';
import { medias, mediaRatings, sharedLinks } from '../db/schema.js';
import { eq, desc, and, sql } from 'drizzle-orm';
import Anthropic from '@anthropic-ai/sdk';
import { clamp, isValidHttpUrl, parseClaudeJSON, extractClaudeText, extractJSON } from '../utils/helpers.js';

export const critiqueRouter = Router();

// ── GET /medias — All media sources with editorial positions ────────

critiqueRouter.get('/medias', async (req, res) => {
  const allMedias = await db.select().from(medias);

  const result = allMedias.map((m) => ({
    id: m.id,
    label: m.label,
    type: m.type,
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
  const { sessionId, societal, economic } = req.body as {
    sessionId: string;
    societal: number;  // -1 to +1
    economic: number;  // -1 to +1
  };

  if (!sessionId || societal == null || economic == null) {
    res.status(400).json({ error: 'sessionId, societal and economic required' });
    return;
  }

  // Store the rating
  await db.insert(mediaRatings).values({
    sessionId,
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

critiqueRouter.post('/links', async (req, res) => {
  const { sessionId, domainId, url, description } = req.body as {
    sessionId?: string;
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

  let validatedDescription = description;
  let status = 'approved'; // default if no API key

  // Validate with Haiku if available
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: `Tu valides un lien partagé par un citoyen sur VoxCité (plateforme de démocratie participative).

Thème : ${domainId}
URL : ${url}
Description proposée : "${description}"

Réponds en JSON strict :
{
  "status": "approved" ou "rejected",
  "reason": "raison courte si rejeté (spam, hors sujet, haineux)",
  "correctedDescription": "description corrigée (plus factuelle, plus neutre, 1 phrase max). Si la description originale est OK, reprends-la telle quelle."
}

Critères de rejet : spam, contenu haineux, lien clairement hors thème.
Critères de correction : rendre factuel, retirer les adjectifs partisans.
Sois tolérant : on veut de la diversité d'opinions.

Réponds UNIQUEMENT avec le JSON.`,
        }],
      });

      const rawText = response.content[0].type === 'text' ? response.content[0].text : '';
      const cleaned = rawText.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
      const parsed = JSON.parse(cleaned);
      status = parsed.status || 'approved';
      validatedDescription = parsed.correctedDescription || description;
    } catch (err) {
      console.error('[critique] Haiku validation failed, auto-approving:', err);
    }
  }

  const [row] = await db.insert(sharedLinks).values({
    sessionId: sessionId ?? null,
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
