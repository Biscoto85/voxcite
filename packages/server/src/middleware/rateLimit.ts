import type { RequestHandler } from 'express';

const windowMs = 15 * 60 * 1000; // 15 minutes
const maxRequests = 100;

const hits = new Map<string, { count: number; resetAt: number }>();

/**
 * Rate limiter simple en mémoire.
 * À remplacer par Redis en production.
 */
export const rateLimit: RequestHandler = (req, res, next) => {
  const ip = req.ip ?? 'unknown';
  const now = Date.now();
  const entry = hits.get(ip);

  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + windowMs });
    return next();
  }

  entry.count++;
  if (entry.count > maxRequests) {
    res.status(429).json({ error: 'Too many requests' });
    return;
  }

  next();
};
