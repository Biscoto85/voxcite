import { Router } from 'express';
import { db } from '../db/index.js';
import { feedback } from '../db/schema.js';

export const feedbackRouter = Router();

// POST / — envoyer un feedback
feedbackRouter.post('/', async (req, res) => {
  const { sessionId, targetType, targetId, feedbackType, description, screen } = req.body as {
    sessionId?: string;
    targetType: string;
    targetId?: string;
    feedbackType: string;
    description: string;
    screen?: string;
  };

  if (!targetType || !feedbackType || !description) {
    res.status(400).json({ error: 'targetType, feedbackType and description required' });
    return;
  }

  const [row] = await db.insert(feedback).values({
    sessionId: sessionId ?? null,
    targetType,
    targetId: targetId ?? null,
    feedbackType,
    description,
    screen: screen ?? null,
  }).returning();

  res.status(201).json({ id: row.id });
});
