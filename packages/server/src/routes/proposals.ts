import { Router } from 'express';
import { db } from '../db/index.js';
import { proposals, suggestions } from '../db/schema.js';
import { eq, and, isNull } from 'drizzle-orm';
import type { CompassPosition, AxisId } from '@voxcite/shared';

export const proposalsRouter = Router();

const ALL_AXES: AxisId[] = ['societal', 'economic', 'authority', 'ecology', 'sovereignty'];

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

  // Get all active suggestions
  const allSuggestions = await db
    .select()
    .from(suggestions)
    .where(eq(suggestions.isActive, true));

  if (allSuggestions.length === 0) {
    res.json([]);
    return;
  }

  // TODO: Filter/sort by proximity to user profile when we have enough data
  // For now, return all shuffled
  const shuffled = allSuggestions
    .sort(() => Math.random() - 0.5)
    .slice(0, 20)
    .map((s) => ({
      id: s.id,
      domainId: s.domainId,
      text: s.text,
    }));

  res.json(shuffled);
});
