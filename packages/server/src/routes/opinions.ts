import { Router } from 'express';

export const opinionsRouter = Router();

// POST / — enregistrer un avis citoyen sur un sujet
opinionsRouter.post('/', async (_req, res) => {
  // TODO: validate body, insert into opinions table
  res.status(501).json({ error: 'Not implemented' });
});
