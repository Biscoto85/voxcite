import { Router } from 'express';

export const subjectsRouter = Router();

// GET / — liste des sujets d'actualité actifs
subjectsRouter.get('/', async (_req, res) => {
  // TODO: query subjects table, filter active
  res.status(501).json({ error: 'Not implemented' });
});
