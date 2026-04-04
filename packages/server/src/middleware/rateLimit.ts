import type { RequestHandler } from 'express';

// ── General rate limiter (all endpoints) ────────────────────────────

const GENERAL_WINDOW_MS = 15 * 60 * 1000; // 15 min
const GENERAL_MAX = 100;

const generalHits = new Map<string, { count: number; resetAt: number }>();

export const rateLimit: RequestHandler = (req, res, next) => {
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

// ── Strict rate limiter for AI/token-consuming endpoints ────────────
// POST /api/analysis, POST /api/critique/links
// Much tighter: 5 calls per hour per IP

const AI_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const AI_MAX = 5;

const aiHits = new Map<string, { count: number; resetAt: number }>();

export const aiRateLimit: RequestHandler = (req, res, next) => {
  const ip = req.ip ?? 'unknown';
  const now = Date.now();
  const entry = aiHits.get(ip);

  if (!entry || now > entry.resetAt) {
    aiHits.set(ip, { count: 1, resetAt: now + AI_WINDOW_MS });
    return next();
  }

  entry.count++;
  if (entry.count > AI_MAX) {
    console.warn(`[partiprism-api] AI rate limit exceeded: ip=${ip} count=${entry.count}`);
    res.status(429).json({ error: 'Trop de requêtes. Réessaie dans une heure.' });
    return;
  }

  next();
};

// ── Session creation rate limiter ───────────────────────────────────
// 3 sessions per hour per IP (prevents mass bot session creation)

const SESSION_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const SESSION_MAX = 3;

const sessionHits = new Map<string, { count: number; resetAt: number }>();

export const sessionRateLimit: RequestHandler = (req, res, next) => {
  const ip = req.ip ?? 'unknown';
  const now = Date.now();
  const entry = sessionHits.get(ip);

  if (!entry || now > entry.resetAt) {
    sessionHits.set(ip, { count: 1, resetAt: now + SESSION_WINDOW_MS });
    return next();
  }

  entry.count++;
  if (entry.count > SESSION_MAX) {
    console.warn(`[partiprism-api] Session rate limit exceeded: ip=${ip} count=${entry.count}`);
    res.status(429).json({ error: 'Trop de sessions créées. Réessaie plus tard.' });
    return;
  }

  next();
};

// Cleanup stale entries every 30 min to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const map of [generalHits, aiHits, sessionHits]) {
    for (const [key, val] of map) {
      if (now > val.resetAt) map.delete(key);
    }
  }
}, 30 * 60 * 1000);
