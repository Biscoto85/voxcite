import type { RequestHandler } from 'express';
import { db } from '../db/index.js';
import { sql } from 'drizzle-orm';

// ── General rate limiter (all endpoints) ────────────────────────────
// In-memory: coarse-grain DoS protection on all POSTs.
// Not PM2-cluster-safe by design — the 4x headroom is acceptable here.

const GENERAL_WINDOW_MS = 15 * 60 * 1000; // 15 min
const GENERAL_MAX = 500;

const generalHits = new Map<string, { count: number; resetAt: number }>();

export const rateLimit: RequestHandler = (req, res, next) => {
  if (req.method === 'GET') return next();

  const ip = req.ip ?? 'unknown';
  const now = Date.now();
  const entry = generalHits.get(ip);

  if (!entry || now > entry.resetAt) {
    generalHits.set(ip, { count: 1, resetAt: now + GENERAL_WINDOW_MS });
    return next();
  }

  entry.count++;
  if (entry.count > GENERAL_MAX) {
    res.status(429).json({ error: 'Too many requests' });
    return;
  }

  next();
};

// Cleanup stale entries every 30 min to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of generalHits) {
    if (now > val.resetAt) generalHits.delete(key);
  }
}, 30 * 60 * 1000);

// ── PostgreSQL-backed rate limiter ──────────────────────────────────
// Atomic upsert: works correctly across PM2 cluster workers.
// Fails open (allows request) if DB is temporarily unavailable.

async function checkPgRateLimit(
  ip: string,
  limiter: string,
  maxCount: number,
  windowMs: number,
): Promise<boolean> {
  const resetAt = new Date(Date.now() + windowMs);
  try {
    const rows = await db.execute(sql`
      INSERT INTO rate_limits (ip, limiter, count, reset_at)
      VALUES (${ip}, ${limiter}, 1, ${resetAt})
      ON CONFLICT (ip, limiter) DO UPDATE
      SET
        count    = CASE WHEN rate_limits.reset_at <= NOW() THEN 1
                        ELSE rate_limits.count + 1 END,
        reset_at = CASE WHEN rate_limits.reset_at <= NOW() THEN ${resetAt}
                        ELSE rate_limits.reset_at END
      RETURNING count
    `);
    const count = Number((rows as any[])[0]?.count ?? 0);
    return count <= maxCount;
  } catch {
    return true; // fail-open: never block on DB unavailability
  }
}

// ── AI rate limiter — 5 calls/hour/IP ───────────────────────────────

const AI_WINDOW_MS = 60 * 60 * 1000;
const AI_MAX = 5;

export const aiRateLimit: RequestHandler = async (req, res, next) => {
  if (req.method !== 'POST') return next();

  const ip = req.ip ?? 'unknown';
  const allowed = await checkPgRateLimit(ip, 'ai', AI_MAX, AI_WINDOW_MS);
  if (!allowed) {
    console.warn(`[partiprism-api] AI rate limit exceeded: ip=${ip}`);
    res.status(429).json({ error: 'Trop de requêtes. Réessaie dans une heure.' });
    return;
  }
  next();
};

// ── Snapshot rate limiter — 5 snapshots/hour/IP ─────────────────────

const SESSION_WINDOW_MS = 60 * 60 * 1000;
const SESSION_MAX = 5;

export const sessionRateLimit: RequestHandler = async (req, res, next) => {
  if (req.method !== 'POST') return next();

  const ip = req.ip ?? 'unknown';
  const allowed = await checkPgRateLimit(ip, 'session', SESSION_MAX, SESSION_WINDOW_MS);
  if (!allowed) {
    console.warn(`[partiprism-api] Session rate limit exceeded: ip=${ip}`);
    res.status(429).json({ error: 'Trop de sessions créées. Réessaie plus tard.' });
    return;
  }
  next();
};
