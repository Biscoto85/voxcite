/**
 * Background worker — processes pending analysis jobs from the queue.
 * Runs every 3 seconds, handles up to 3 jobs per tick.
 * Uses PostgreSQL as the job queue (no Redis dependency).
 */
import { eq, and, lt, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { analysisJobs, questions } from '../db/schema.js';
import { runAiAnalysis, type AnalysisInput } from './ai-analysis.js';
import { getPopulationStats, getUserPercentiles } from './population.js';
import { extractResponseSignals } from './response-signals.js';
import { resolveMediaPosition } from './media-position.js';
import type { CompassPosition } from '@partiprism/shared';

const WORKER_INTERVAL_MS = 3_000;   // poll every 3 seconds
const MAX_JOBS_PER_TICK = 10;        // process up to 10 jobs per tick (burst-friendly)
const JOB_TIMEOUT_MS = 60_000;       // mark stuck "processing" jobs as failed after 60s
const JOB_TTL_MS = 7 * 24 * 60 * 60 * 1_000; // delete done/failed jobs after 7 days

interface PartyInput {
  id: string;
  label: string;
  abbreviation: string;
  position: CompassPosition;
}

interface AnalysisJobRequest {
  position: CompassPosition;
  parties: PartyInput[];
  infoSource?: string;
  perceivedBias?: string;
  infoFormats?: string[];
  mediaSources?: string[];
  infoDiversity?: string;
  mediaRelationship?: string;
  responses?: Array<{ questionId: string; value: number }>;
  deepAnalysis?: boolean;
}

async function processJob(jobId: string, requestData: AnalysisJobRequest): Promise<void> {
  const {
    position, parties, infoSource, perceivedBias,
    infoFormats, mediaSources, infoDiversity, mediaRelationship,
    responses: clientResponses, deepAnalysis,
  } = requestData;

  // Resolve media position from declared sources (same logic as sync route)
  let mediaPosition: CompassPosition | undefined;
  let declaredMediaLabels: string[] = [];

  if (mediaSources && mediaSources.length > 0) {
    const resolved = await resolveMediaPosition(mediaSources);
    declaredMediaLabels = resolved.labels;
    if (resolved.position) mediaPosition = resolved.position;
  }

  // Extract response signals for contradiction detection
  let responseSignals: AnalysisInput['responseSignals'];
  if (clientResponses && clientResponses.length > 0) {
    try {
      const allQuestions = await db.select().from(questions);
      const mappedQuestions = allQuestions.map((q) => ({
        id: q.id,
        text: q.text,
        axis: q.axis,
        axes: (q.axes as string[] | null),
        polarity: q.polarity,
        domainId: q.domainId,
        phase: q.phase,
        weight: q.weight,
      }));
      responseSignals = extractResponseSignals(clientResponses, mappedQuestions);
    } catch { /* best-effort */ }
  }

  const [populationStats, percentiles] = await Promise.all([
    getPopulationStats().catch(() => ({ totalRespondents: 0, axes: {} as any })),
    getUserPercentiles(position).catch(() => ({ axes: {} as any })),
  ]);

  const result = await runAiAnalysis({
    position,
    parties,
    populationStats,
    percentiles,
    infoSource,
    perceivedBias,
    infoFormats,
    mediaSources: declaredMediaLabels,
    infoDiversity,
    mediaRelationship,
    mediaPosition,
    responseSignals,
  }, deepAnalysis === true);

  await db.update(analysisJobs).set({
    status: 'done',
    resultData: result as any,
    completedAt: new Date(),
  }).where(eq(analysisJobs.id, jobId));
}

async function tick(): Promise<void> {
  // 1. Mark stuck "processing" jobs as failed (timeout)
  try {
    const stuckCutoff = new Date(Date.now() - JOB_TIMEOUT_MS);
    await db.update(analysisJobs).set({
      status: 'failed',
      errorMessage: 'Timeout — job took too long',
      completedAt: new Date(),
    }).where(
      and(
        eq(analysisJobs.status, 'processing'),
        lt(analysisJobs.createdAt, stuckCutoff),
      ),
    );
  } catch { /* non-critical */ }

  // 2. Claim up to MAX_JOBS_PER_TICK pending jobs atomically
  let pendingJobs: Array<{ id: string; requestData: unknown }> = [];
  try {
    // SELECT … LIMIT N FOR UPDATE SKIP LOCKED — prevents double-processing
    const rows = await db.execute(sql`
      UPDATE analysis_jobs
      SET status = 'processing'
      WHERE id IN (
        SELECT id FROM analysis_jobs
        WHERE status = 'pending'
        ORDER BY created_at ASC
        LIMIT ${MAX_JOBS_PER_TICK}
        FOR UPDATE SKIP LOCKED
      )
      RETURNING id, request_data
    `);
    pendingJobs = (rows as any[]).map((r: any) => ({ id: r.id, requestData: r.request_data }));
  } catch { /* DB unavailable — skip tick */ return; }

  // 3. Process each job
  for (const job of pendingJobs) {
    try {
      await processJob(job.id, job.requestData as AnalysisJobRequest);
    } catch (err: any) {
      console.error(`[analysis-worker] Job ${job.id} failed:`, err.message);
      try {
        await db.update(analysisJobs).set({
          status: 'failed',
          errorMessage: err.message || 'Unknown error',
          completedAt: new Date(),
        }).where(eq(analysisJobs.id, job.id));
      } catch { /* best-effort */ }
    }
  }

  // 4. Cleanup old done/failed jobs + expired rate_limits (run occasionally — every ~100 ticks)
  if (Math.random() < 0.01) {
    const cutoff = new Date(Date.now() - JOB_TTL_MS);
    db.delete(analysisJobs).where(lt(analysisJobs.createdAt, cutoff)).catch(() => {});
    db.execute(sql`DELETE FROM rate_limits WHERE reset_at < NOW()`).catch(() => {});
  }
}

export function startAnalysisWorker(): void {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('[analysis-worker] No API key — worker disabled');
    return;
  }

  console.log(`[analysis-worker] Started (interval=${WORKER_INTERVAL_MS}ms, max=${MAX_JOBS_PER_TICK}/tick)`);
  setInterval(() => {
    tick().catch((err) => console.error('[analysis-worker] Tick error:', err));
  }, WORKER_INTERVAL_MS);
}
