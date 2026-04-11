import { Router } from 'express';
import { db } from '../db/index.js';
import {
  snapshots, votes, proposals, feedback, questions, prompts, apiCalls,
  suggestions, programVersions, domains, medias, partis, mediaRatings,
} from '../db/schema.js';
import { eq, desc, asc, sql, and, count } from 'drizzle-orm';
import { trackedAiCall } from '../services/tracked-ai.js';
import { invalidatePromptCache } from '../services/prompt-loader.js';
import { extractClaudeText } from '../utils/helpers.js';

export const adminRouter = Router();

// ══════════════════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════════════════

adminRouter.get('/dashboard', async (_req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Count totals
    const [snapshotCount] = await db.select({ count: count() }).from(snapshots);
    const [voteCount] = await db.select({ count: count() }).from(votes);
    const [proposalCount] = await db.select({ count: count() }).from(proposals);
    const [feedbackCount] = await db.select({ count: count() }).from(feedback);
    const [pendingFeedbackCount] = await db.select({ count: count() }).from(feedback).where(eq(feedback.processed, false));
    const [questionCount] = await db.select({ count: count() }).from(questions);

    // API calls stats
    const apiCallsWeek = await db
      .select({
        totalCalls: count(),
        totalCost: sql<number>`COALESCE(SUM(${apiCalls.costEstimate}), 0)`,
        totalInputTokens: sql<number>`COALESCE(SUM(${apiCalls.inputTokens}), 0)`,
        totalOutputTokens: sql<number>`COALESCE(SUM(${apiCalls.outputTokens}), 0)`,
      })
      .from(apiCalls)
      .where(sql`${apiCalls.createdAt} >= ${weekAgo.toISOString()}`);

    const apiCallsToday = await db
      .select({
        totalCalls: count(),
        totalCost: sql<number>`COALESCE(SUM(${apiCalls.costEstimate}), 0)`,
      })
      .from(apiCalls)
      .where(sql`${apiCalls.createdAt} >= ${today.toISOString()}`);

    // Recent API calls (last 20)
    const recentCalls = await db
      .select()
      .from(apiCalls)
      .orderBy(desc(apiCalls.createdAt))
      .limit(20);

    // Snapshots per day (last 7 days)
    const dailySnapshots = await db
      .select({
        date: sql<string>`DATE(${snapshots.createdAt})`,
        count: count(),
      })
      .from(snapshots)
      .where(sql`${snapshots.createdAt} >= ${weekAgo.toISOString()}`)
      .groupBy(sql`DATE(${snapshots.createdAt})`)
      .orderBy(sql`DATE(${snapshots.createdAt})`);

    res.json({
      totals: {
        snapshots: snapshotCount.count,
        votes: voteCount.count,
        proposals: proposalCount.count,
        feedbacks: feedbackCount.count,
        pendingFeedbacks: pendingFeedbackCount.count,
        questions: questionCount.count,
      },
      apiCosts: {
        today: apiCallsToday[0],
        week: apiCallsWeek[0],
      },
      recentCalls,
      dailySnapshots,
    });
  } catch (err: any) {
    console.error('[admin] Dashboard error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════
// PROMPTS
// ══════════════════════════════════════════════════════════════════════

// GET /prompts — all prompts grouped by key
adminRouter.get('/prompts', async (_req, res) => {
  const allPrompts = await db
    .select()
    .from(prompts)
    .orderBy(prompts.key, desc(prompts.version));

  res.json(allPrompts);
});

// POST /prompts — create new prompt version
adminRouter.post('/prompts', async (req, res) => {
  const { key, label, content } = req.body as {
    key: string;
    label: string;
    content: string;
  };

  if (!key || !content) {
    res.status(400).json({ error: 'key and content required' });
    return;
  }

  const adminUsername = (req as any).adminUsername || 'unknown';

  // Get current max version for this key
  const [maxVersion] = await db
    .select({ max: sql<number>`COALESCE(MAX(${prompts.version}), 0)` })
    .from(prompts)
    .where(eq(prompts.key, key));

  const newVersion = (maxVersion?.max ?? 0) + 1;

  // Deactivate all existing prompts for this key
  await db.update(prompts).set({ isActive: false }).where(eq(prompts.key, key));

  // Insert new active version
  const [row] = await db.insert(prompts).values({
    key,
    label: label || key,
    content,
    version: newVersion,
    isActive: true,
    createdBy: adminUsername,
  }).returning();

  invalidatePromptCache(key);
  res.status(201).json(row);
});

// PUT /prompts/:id/activate — activate a specific prompt version
adminRouter.put('/prompts/:id/activate', async (req, res) => {
  const promptId = req.params.id;

  const [prompt] = await db.select().from(prompts).where(eq(prompts.id, promptId));
  if (!prompt) {
    res.status(404).json({ error: 'Prompt not found' });
    return;
  }

  // Deactivate all for this key, activate this one
  await db.update(prompts).set({ isActive: false }).where(eq(prompts.key, prompt.key));
  await db.update(prompts).set({ isActive: true }).where(eq(prompts.id, promptId));

  invalidatePromptCache(prompt.key);
  res.json({ ok: true });
});

// POST /prompts/test — test a prompt with sample data
adminRouter.post('/prompts/test', async (req, res) => {
  const { content, model } = req.body as {
    content: string;
    model?: string;
  };

  if (!content) {
    res.status(400).json({ error: 'content required' });
    return;
  }

  try {
    const response = await trackedAiCall({
      promptKey: 'test',
      model: model || 'claude-sonnet-4-20250514',
      messages: [{ role: 'user', content }],
      maxTokens: 2000,
    });

    const text = extractClaudeText(response);
    res.json({
      output: text,
      usage: response.usage,
      model: response.model,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════
// QUESTIONS
// ══════════════════════════════════════════════════════════════════════

adminRouter.get('/questions', async (_req, res) => {
  const allQuestions = await db.select().from(questions);

  // Get vote stats per question
  const voteStats = await db
    .select({
      questionId: votes.questionId,
      count: count(),
      avg: sql<number>`AVG(${votes.value})`,
    })
    .from(votes)
    .groupBy(votes.questionId);

  const statsMap = new Map(voteStats.map((v) => [v.questionId, v]));

  const enriched = allQuestions.map((q) => ({
    ...q,
    voteCount: statsMap.get(q.id)?.count ?? 0,
    voteAvg: statsMap.get(q.id)?.avg ?? null,
  }));

  res.json(enriched);
});

adminRouter.put('/questions/:id', async (req, res) => {
  const questionId = req.params.id;
  const { text, axis, axes, polarity, phase, weight, domainId, options } = req.body;

  const updates: Record<string, any> = {};
  if (text !== undefined) updates.text = text;
  if (axis !== undefined) updates.axis = axis;
  if (axes !== undefined) updates.axes = axes;
  if (polarity !== undefined) updates.polarity = polarity;
  if (phase !== undefined) updates.phase = phase;
  if (weight !== undefined) updates.weight = weight;
  if (domainId !== undefined) updates.domainId = domainId;
  if (options !== undefined) updates.options = options;

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: 'No fields to update' });
    return;
  }

  await db.update(questions).set(updates).where(eq(questions.id, questionId));
  res.json({ ok: true });
});

// ══════════════════════════════════════════════════════════════════════
// FEEDBACKS
// ══════════════════════════════════════════════════════════════════════

adminRouter.get('/feedbacks', async (req, res) => {
  const showProcessed = req.query.processed === 'true';

  const results = await db
    .select()
    .from(feedback)
    .where(showProcessed ? undefined : eq(feedback.processed, false))
    .orderBy(desc(feedback.createdAt))
    .limit(100);

  res.json(results);
});

adminRouter.put('/feedbacks/:id/process', async (req, res) => {
  await db
    .update(feedback)
    .set({ processed: true, processedAt: new Date() })
    .where(eq(feedback.id, req.params.id));

  res.json({ ok: true });
});

// ══════════════════════════════════════════════════════════════════════
// PROPOSALS
// ══════════════════════════════════════════════════════════════════════

adminRouter.get('/proposals', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);

  const results = await db
    .select()
    .from(proposals)
    .orderBy(desc(proposals.createdAt))
    .limit(limit);

  res.json(results);
});

// ══════════════════════════════════════════════════════════════════════
// BATCH — lancer manuellement
// ══════════════════════════════════════════════════════════════════════

adminRouter.post('/batch/program', async (_req, res) => {
  try {
    const { spawn } = await import('child_process');
    const cwd = new URL('../../', import.meta.url).pathname;
    let stderr = '';
    await new Promise<void>((resolve, reject) => {
      // Use spawn (non-blocking) with a fixed args array — no shell injection possible
      const proc = spawn('node', ['--import=tsx/esm', 'src/batch/generate-program.ts'], {
        cwd,
        timeout: 120_000,
        env: { ...process.env },
        stdio: ['ignore', 'ignore', 'pipe'],
      });
      proc.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });
      proc.on('close', (code) => { code === 0 ? resolve() : reject(new Error(stderr.slice(-500) || `Exit ${code}`)); });
      proc.on('error', reject);
    });
    res.json({ ok: true, message: 'Batch terminé' });
  } catch (err: any) {
    console.error('[admin] Batch error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════
// API CALLS HISTORY
// ══════════════════════════════════════════════════════════════════════

adminRouter.get('/api-calls', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);

  const results = await db
    .select()
    .from(apiCalls)
    .orderBy(desc(apiCalls.createdAt))
    .limit(limit);

  res.json(results);
});

// ══════════════════════════════════════════════════════════════════════
// PARTIS
// ══════════════════════════════════════════════════════════════════════

adminRouter.get('/parties', async (_req, res) => {
  const all = await db.select().from(partis).orderBy(partis.position1d);
  res.json(all);
});

adminRouter.post('/parties', async (req, res) => {
  const { id, label, abbreviation, color, leader, position1d,
    positionSocietal, positionEconomic, positionAuthority, positionEcology, positionSovereignty,
  } = req.body;

  if (!id || !label || !abbreviation || !color) {
    res.status(400).json({ error: 'id, label, abbreviation, color required' });
    return;
  }

  const [row] = await db.insert(partis).values({
    id, label, abbreviation, color,
    leader: leader || null,
    position1d: position1d ?? 0,
    positionSocietal: positionSocietal ?? 0,
    positionEconomic: positionEconomic ?? 0,
    positionAuthority: positionAuthority ?? 0,
    positionEcology: positionEcology ?? 0,
    positionSovereignty: positionSovereignty ?? 0,
  }).returning();

  res.status(201).json(row);
});

adminRouter.put('/parties/:id', async (req, res) => {
  const partyId = req.params.id;
  const fields = ['label', 'abbreviation', 'color', 'leader', 'position1d',
    'positionSocietal', 'positionEconomic', 'positionAuthority', 'positionEcology', 'positionSovereignty',
    'visibleOnCompass'];
  const updates: Record<string, any> = {};
  for (const f of fields) { if (req.body[f] !== undefined) updates[f] = req.body[f]; }
  if (Object.keys(updates).length === 0) { res.status(400).json({ error: 'No fields' }); return; }
  await db.update(partis).set(updates).where(eq(partis.id, partyId));
  res.json({ ok: true });
});

adminRouter.delete('/parties/:id', async (req, res) => {
  await db.delete(partis).where(eq(partis.id, req.params.id));
  res.json({ ok: true });
});

// ══════════════════════════════════════════════════════════════════════
// MÉDIAS
// ══════════════════════════════════════════════════════════════════════

adminRouter.get('/medias', async (_req, res) => {
  const all = await db.select().from(medias).orderBy(medias.type, medias.label);
  const ratingStats = await db
    .select({
      mediaId: mediaRatings.mediaId, count: count(),
      avgSoc: sql<number>`AVG(${mediaRatings.ratedSocietal})`,
      avgEco: sql<number>`AVG(${mediaRatings.ratedEconomic})`,
    })
    .from(mediaRatings).groupBy(mediaRatings.mediaId);
  const statsMap = new Map(ratingStats.map((r) => [r.mediaId, r]));

  const missingMediaFeedbacks = await db.select().from(feedback)
    .where(and(eq(feedback.targetType, 'missing_media'), eq(feedback.processed, false)))
    .orderBy(desc(feedback.createdAt));

  res.json({
    medias: all.map((m) => ({ ...m, citizenStats: statsMap.get(m.id) || null })),
    missingMediaRequests: missingMediaFeedbacks,
  });
});

adminRouter.post('/medias', async (req, res) => {
  const { id, label, type, url, owner, independent, editorialLabel, position1d,
    positionSocietal, positionEconomic, positionAuthority, positionEcology, positionSovereignty,
  } = req.body;
  if (!id || !label || !type) { res.status(400).json({ error: 'id, label, type required' }); return; }

  const [row] = await db.insert(medias).values({
    id, label, type,
    url: url || null, owner: owner || null,
    independent: independent ?? false, editorialLabel: editorialLabel || null,
    position1d: position1d ?? 0,
    positionSocietal: positionSocietal ?? 0, positionEconomic: positionEconomic ?? 0,
    positionAuthority: positionAuthority ?? 0, positionEcology: positionEcology ?? 0,
    positionSovereignty: positionSovereignty ?? 0,
  }).returning();
  res.status(201).json(row);
});

adminRouter.put('/medias/:id', async (req, res) => {
  const mediaId = req.params.id;
  const fields = ['label', 'type', 'url', 'owner', 'independent', 'editorialLabel', 'position1d',
    'positionSocietal', 'positionEconomic', 'positionAuthority', 'positionEcology', 'positionSovereignty',
    'visibleOnCompass'];
  const updates: Record<string, any> = {};
  for (const f of fields) { if (req.body[f] !== undefined) updates[f] = req.body[f]; }
  if (Object.keys(updates).length === 0) { res.status(400).json({ error: 'No fields' }); return; }
  await db.update(medias).set(updates).where(eq(medias.id, mediaId));
  res.json({ ok: true });
});

adminRouter.delete('/medias/:id', async (req, res) => {
  await db.delete(medias).where(eq(medias.id, req.params.id));
  res.json({ ok: true });
});

// ══════════════════════════════════════════════════════════════════════
// SNAPSHOTS (réponses anonymes)
// ══════════════════════════════════════════════════════════════════════

const SNAPSHOT_SORT_COLS: Record<string, any> = {
  createdAt: snapshots.createdAt,
  postalCode: snapshots.postalCode,
  societal: snapshots.positionSocietal,
  economic: snapshots.positionEconomic,
  authority: snapshots.positionAuthority,
  ecology: snapshots.positionEcology,
  sovereignty: snapshots.positionSovereignty,
  infoSource: snapshots.infoSource,
};

adminRouter.get('/snapshots', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, parseInt(req.query.limit as string) || 50);
  const sortBy = (req.query.sort as string) || 'createdAt';
  const sortDir = (req.query.dir as string) === 'asc' ? 'asc' : 'desc';
  const offset = (page - 1) * limit;

  const sortCol = SNAPSHOT_SORT_COLS[sortBy] || snapshots.createdAt;
  const orderFn = sortDir === 'asc' ? asc : desc;

  const [totalResult] = await db.select({ count: count() }).from(snapshots);
  const total = totalResult.count;

  const rows = await db
    .select()
    .from(snapshots)
    .orderBy(orderFn(sortCol))
    .limit(limit)
    .offset(offset);

  res.json({
    rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

// GET /snapshots/export — CSV export
adminRouter.get('/snapshots/export', async (req, res) => {
  const sortBy = (req.query.sort as string) || 'createdAt';
  const sortDir = (req.query.dir as string) === 'asc' ? 'asc' : 'desc';
  const sortCol = SNAPSHOT_SORT_COLS[sortBy] || snapshots.createdAt;
  const orderFn = sortDir === 'asc' ? asc : desc;

  // Optional filters
  const postalCode = req.query.postalCode as string | undefined;
  const infoSource = req.query.infoSource as string | undefined;

  let query = db.select().from(snapshots).orderBy(orderFn(sortCol));

  const rows = await query;

  // Apply filters in JS (simpler than building dynamic where clauses)
  let filtered = rows;
  if (postalCode) filtered = filtered.filter((r) => r.postalCode === postalCode);
  if (infoSource) filtered = filtered.filter((r) => r.infoSource === infoSource);

  // Build CSV
  const header = 'date,code_postal,info_source,biais_percu,societal,economic,authority,ecology,sovereignty';
  const csvRows = filtered.map((r) =>
    [
      r.createdAt.toISOString(),
      r.postalCode || '',
      r.infoSource || '',
      r.perceivedBias || '',
      r.positionSocietal.toFixed(3),
      r.positionEconomic.toFixed(3),
      r.positionAuthority.toFixed(3),
      r.positionEcology.toFixed(3),
      r.positionSovereignty.toFixed(3),
    ].join(','),
  );

  const csv = [header, ...csvRows].join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="partiprism-snapshots-${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send(csv);
});
