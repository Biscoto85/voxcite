import { Router } from 'express';
import { db } from '../db/index.js';
import { domains, themes } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export const domainsRouter = Router();

// GET / — tous les domaines avec leurs thèmes
domainsRouter.get('/', async (_req, res) => {
  const allDomains = await db.select().from(domains).orderBy(domains.order);
  const allThemes = await db.select().from(themes);

  const result = allDomains.map((d) => ({
    ...d,
    themes: allThemes.filter((t) => t.domainId === d.id),
  }));

  res.json(result);
});

// GET /:id — un domaine par son id
domainsRouter.get('/:id', async (req, res) => {
  const [domain] = await db.select().from(domains).where(eq(domains.id, req.params.id));
  if (!domain) {
    res.status(404).json({ error: 'Domain not found' });
    return;
  }

  const domainThemes = await db.select().from(themes).where(eq(themes.domainId, domain.id));
  res.json({ ...domain, themes: domainThemes });
});
