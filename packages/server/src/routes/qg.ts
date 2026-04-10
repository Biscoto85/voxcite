import { Router } from 'express';
import { db } from '../db/index.js';
import { feedback, mediaProposals } from '../db/schema.js';
import { eq, desc, and, sql } from 'drizzle-orm';
import { qgAuth, verifyAndIssueToken, isQGConfigured } from '../middleware/qgAuth.js';

export const qgRouter = Router();

// POST /qg/auth — verify password, issue 24h session token
qgRouter.post('/auth', (req, res) => {
  if (!isQGConfigured()) {
    res.status(503).json({ error: 'QG_PASSWORD non défini dans .env' });
    return;
  }
  const { password } = req.body as { password?: string };
  if (!password) {
    res.status(400).json({ error: 'password requis' });
    return;
  }
  const token = verifyAndIssueToken(password);
  if (!token) {
    res.status(401).json({ error: 'Mot de passe incorrect' });
    return;
  }
  res.json({ token });
});

// All routes below require auth
qgRouter.use(qgAuth);

// GET /qg/stats — dashboard summary
qgRouter.get('/stats', async (_req, res) => {
  const [fbTotal, fbUnprocessed, mpPending] = await Promise.all([
    db.select({ count: sql<number>`cast(count(*) as int)` }).from(feedback),
    db.select({ count: sql<number>`cast(count(*) as int)` }).from(feedback).where(eq(feedback.processed, false)),
    db.select({ count: sql<number>`cast(count(*) as int)` }).from(mediaProposals).where(eq(mediaProposals.status, 'pending')),
  ]);
  res.json({
    feedback: { total: fbTotal[0].count, unprocessed: fbUnprocessed[0].count },
    mediaProposals: { pending: mpPending[0].count },
  });
});

// GET /qg/feedback — paginated, filterable feedback list
qgRouter.get('/feedback', async (req, res) => {
  const { page = '1', processed, screen, type } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page) || 1);
  const pageSize = 30;
  const offset = (pageNum - 1) * pageSize;

  const conditions = [];
  if (processed === 'true') conditions.push(eq(feedback.processed, true));
  if (processed === 'false') conditions.push(eq(feedback.processed, false));
  if (screen) conditions.push(eq(feedback.screen, screen));
  if (type) conditions.push(eq(feedback.feedbackType, type));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, totalResult] = await Promise.all([
    db.select().from(feedback)
      .where(where)
      .orderBy(desc(feedback.createdAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: sql<number>`cast(count(*) as int)` }).from(feedback).where(where),
  ]);

  res.json({ rows, total: totalResult[0].count, page: pageNum, pageSize });
});

// PATCH /qg/feedback/:id — toggle processed state
qgRouter.patch('/feedback/:id', async (req, res) => {
  const { processed } = req.body as { processed: boolean };
  if (typeof processed !== 'boolean') {
    res.status(400).json({ error: 'processed (boolean) requis' });
    return;
  }
  await db.update(feedback)
    .set({ processed, processedAt: processed ? new Date() : null })
    .where(eq(feedback.id, req.params.id));
  res.json({ ok: true });
});

// GET /qg/media-proposals — list proposals by status
qgRouter.get('/media-proposals', async (req, res) => {
  const { status } = req.query as { status?: string };
  const rows = await db.select().from(mediaProposals)
    .where(status ? eq(mediaProposals.status, status) : undefined)
    .orderBy(desc(mediaProposals.createdAt));
  res.json(rows);
});

// PATCH /qg/media-proposals/:id — update status (pending | approved | rejected)
qgRouter.patch('/media-proposals/:id', async (req, res) => {
  const { status } = req.body as { status?: string };
  if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
    res.status(400).json({ error: 'status doit être pending | approved | rejected' });
    return;
  }
  await db.update(mediaProposals)
    .set({ status })
    .where(eq(mediaProposals.id, req.params.id));
  res.json({ ok: true });
});
