import { Router } from 'express';
import { db } from '../db/index.js';
import {
  snapshots, votes, proposals, feedback, questions, prompts, apiCalls,
  suggestions, programVersions, domains, medias,
} from '../db/schema.js';
import { eq, desc, sql, and, count } from 'drizzle-orm';
import { trackedAiCall } from '../services/tracked-ai.js';
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
      model: model || 'claude-haiku-4-5-20251001', // default to Haiku for tests (cheaper)
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
    const { execSync } = await import('child_process');
    const output = execSync('npx tsx src/batch/generate-program.ts', {
      cwd: new URL('../../', import.meta.url).pathname,
      timeout: 120_000,
      encoding: 'utf-8',
    });
    res.json({ ok: true, message: 'Batch terminé', output: output.slice(-500) });
  } catch (err: any) {
    console.error('[admin] Batch error:', err);
    res.status(500).json({ error: err.stderr?.slice(-500) || err.message });
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
