import { Router } from 'express';

export const synthesisRouter = Router();

// GET /:subjectId — synthèse collective pour un sujet
synthesisRouter.get('/:subjectId', async (_req, res) => {
  // TODO: aggregate opinions, compute stats, return synthesis
  res.status(501).json({ error: 'Not implemented' });
});
