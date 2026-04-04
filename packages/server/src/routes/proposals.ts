import { Router } from 'express';
import { db } from '../db/index.js';
import { proposals, suggestions } from '../db/schema.js';
import { eq, sql } from 'drizzle-orm';
import type { CompassPosition } from '@voxcite/shared';
import { validateSessionId } from '../middleware/validate.js';

export const proposalsRouter = Router();

// POST / — soumettre une proposition (user ou réaction à suggestion)
proposalsRouter.post('/', async (req, res) => {
  const { sessionId, domainId, text, source, originalSuggestionId, position } = req.body as {
    sessionId: string;
    domainId: string;
    text: string;
    source: string;
    originalSuggestionId?: string;
    position?: CompassPosition;
  };

  if (!sessionId || !domainId || !text || !source) {
    res.status(400).json({ error: 'sessionId, domainId, text and source required' });
    return;
  }

  const [row] = await db.insert(proposals).values({
    sessionId,
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

// GET /suggestions — suggestions pré-générées adaptées au profil
proposalsRouter.get('/suggestions', async (req, res) => {
  const { sessionId } = req.query as { sessionId?: string };

  // Return shuffled subset (DB-level random for proper distribution)
  const shuffled = await db
    .select({ id: suggestions.id, domainId: suggestions.domainId, text: suggestions.text })
    .from(suggestions)
    .where(eq(suggestions.isActive, true))
    .orderBy(sql`RANDOM()`)
    .limit(20);

  res.json(shuffled);
});
