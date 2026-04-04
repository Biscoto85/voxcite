import { Router } from 'express';
import { db } from '../db/index.js';
import { programVersions } from '../db/schema.js';
import { desc } from 'drizzle-orm';

export const programRouter = Router();

interface DomainProgram {
  domainId: string;
  title: string;
  summary: string;
  proposals: string[];
}

// GET /latest — dernier programme citoyen généré
programRouter.get('/latest', async (req, res) => {
  const [latest] = await db
    .select()
    .from(programVersions)
    .orderBy(desc(programVersions.generatedAt))
    .limit(1);

  if (!latest) {
    res.status(404).json(null);
    return;
  }

  const content = latest.content as Record<string, DomainProgram>;
  const domains = Object.values(content);

  res.json({
    generatedAt: latest.generatedAt,
    evolutionSummary: latest.evolutionSummary,
    totalProposals: latest.totalProposals,
    totalContributors: latest.totalContributors,
    isInitial: latest.isInitial,
    domains,
  });
});
