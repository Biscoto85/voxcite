import { Router } from 'express';
import { db } from '../db/index.js';
import { feedback, mediaProposals, civicEvents, eventProposals, newsletterSubscriptions } from '../db/schema.js';
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

// ── Événements citoyens ──────────────────────────────────────────────

// GET /qg/event-proposals — liste des propositions (filtrables par status)
qgRouter.get('/event-proposals', async (req, res) => {
  const { status } = req.query as { status?: string };
  const rows = await db.select().from(eventProposals)
    .where(status ? eq(eventProposals.status, status) : undefined)
    .orderBy(desc(eventProposals.createdAt));
  res.json(rows);
});

// PATCH /qg/event-proposals/:id — approuver / rejeter
qgRouter.patch('/event-proposals/:id', async (req, res) => {
  const { status, rejectionReason } = req.body as { status?: string; rejectionReason?: string };
  if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
    res.status(400).json({ error: 'status doit être approved | rejected | pending' });
    return;
  }
  await db.update(eventProposals)
    .set({ status, rejectionReason: rejectionReason ?? null })
    .where(eq(eventProposals.id, req.params.id));
  res.json({ ok: true });
});

// GET /qg/events — liste tous les événements (y compris inactifs)
qgRouter.get('/events', async (_req, res) => {
  const rows = await db.select().from(civicEvents).orderBy(desc(civicEvents.createdAt));
  res.json(rows);
});

// POST /qg/events — créer un événement directement (admin)
qgRouter.post('/events', async (req, res) => {
  const { title, description, url, eventDate, location, organizer, category, isActive } = req.body as Record<string, unknown>;
  if (!title || !description || !organizer || !category) {
    res.status(400).json({ error: 'title, description, organizer, category requis' });
    return;
  }
  await db.insert(civicEvents).values({
    title: String(title).slice(0, 120),
    description: String(description).slice(0, 1000),
    url: url ? String(url).slice(0, 500) : null,
    eventDate: eventDate ? new Date(String(eventDate)) : null,
    location: location ? String(location).slice(0, 200) : null,
    organizer: String(organizer).slice(0, 200),
    category: String(category).slice(0, 30),
    isActive: isActive !== false,
  });
  res.status(201).json({ ok: true });
});

// PATCH /qg/events/:id — modifier / activer / désactiver
qgRouter.patch('/events/:id', async (req, res) => {
  const { isActive, title, description, url, eventDate, location, organizer, category } = req.body as Record<string, unknown>;
  const updates: Record<string, unknown> = {};
  if (typeof isActive === 'boolean') updates.isActive = isActive;
  if (title)       updates.title       = String(title).slice(0, 120);
  if (description) updates.description = String(description).slice(0, 1000);
  if (url !== undefined)       updates.url      = url ? String(url).slice(0, 500) : null;
  if (location !== undefined)  updates.location = location ? String(location).slice(0, 200) : null;
  if (organizer)   updates.organizer   = String(organizer).slice(0, 200);
  if (category)    updates.category    = String(category).slice(0, 30);
  if (eventDate !== undefined) updates.eventDate = eventDate ? new Date(String(eventDate)) : null;

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: 'Aucun champ à mettre à jour' }); return;
  }
  await db.update(civicEvents).set(updates as any).where(eq(civicEvents.id, req.params.id));
  res.json({ ok: true });
});

// ── Newsletter (stats + export) ──────────────────────────────────────

// GET /qg/newsletter/stats
qgRouter.get('/newsletter/stats', async (_req, res) => {
  const [active, total] = await Promise.all([
    db.select({ count: sql<number>`cast(count(*) as int)` }).from(newsletterSubscriptions).where(eq(newsletterSubscriptions.isActive, true)),
    db.select({ count: sql<number>`cast(count(*) as int)` }).from(newsletterSubscriptions),
  ]);
  res.json({ active: active[0].count, total: total[0].count });
});

// GET /qg/newsletter/export — CSV des abonnés actifs (emails uniquement)
qgRouter.get('/newsletter/export', async (_req, res) => {
  const rows = await db
    .select({ email: newsletterSubscriptions.email, domains: newsletterSubscriptions.domains, createdAt: newsletterSubscriptions.createdAt })
    .from(newsletterSubscriptions)
    .where(eq(newsletterSubscriptions.isActive, true))
    .orderBy(desc(newsletterSubscriptions.createdAt));

  const csv = ['email,domains,created_at',
    ...rows.map((r) => `${r.email},"${(r.domains as string[] | null)?.join(';') ?? ''}",${r.createdAt.toISOString()}`)
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="newsletter-${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send(csv);
});
