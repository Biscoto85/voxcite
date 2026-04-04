import { Router } from 'express';
import { db } from '../db/index.js';
import { proposals, suggestions } from '../db/schema.js';
import { eq, sql } from 'drizzle-orm';
import type { CompassPosition } from '@partiprism/shared';

export const proposalsRouter = Router();

// POST / — soumettre une proposition anonyme
proposalsRouter.post('/', async (req, res) => {
  const { domainId, text, source, originalSuggestionId, position } = req.body as {
    domainId: string;
    text: string;
    source: string;
    originalSuggestionId?: string;
    position?: CompassPosition;
  };

  if (!domainId || !text || !source) {
    res.status(400).json({ error: 'domainId, text and source required' });
    return;
  }

  const [row] = await db.insert(proposals).values({
    domainId,
    text,
    source,
    originalProposalId: originalSuggestionId ?? null,
    positionSocietal: position?.societal ?? null,
    positionEconomic: position?.economic ?? null,
    positionAuthority: position?.authority ?? null,
    positionEcology: position?.ecology ?? null,
    positionSovereignty: position?.sovereignty ?? null,
  }).returning();

  res.status(201).json({ id: row.id });
});

// GET /suggestions — suggestions aléatoires
proposalsRouter.get('/suggestions', async (_req, res) => {
  const result = await db
    .select({
      id: suggestions.id,
      domainId: suggestions.domainId,
      text: suggestions.text,
    })
    .from(suggestions)
    .where(eq(suggestions.isActive, true))
    .orderBy(sql`RANDOM()`)
    .limit(20);

  res.json(result);
});
