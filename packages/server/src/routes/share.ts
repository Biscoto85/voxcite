import { Router } from 'express';

export const shareRouter = Router();

// GET /:id — image de partage pour Open Graph
shareRouter.get('/:id', async (_req, res) => {
  // TODO: generate share image from session position
  res.status(501).json({ error: 'Not implemented' });
});
