import type { RequestHandler } from 'express';

/**
 * Middleware anti-manipulation basique.
 * Extrait un fingerprint depuis les headers pour limiter les votes multiples.
 * À affiner en v2 avec un vrai device fingerprinting côté client.
 */
export const fingerprint: RequestHandler = (req, _res, next) => {
  const ua = req.headers['user-agent'] ?? '';
  const lang = req.headers['accept-language'] ?? '';
  const ip = req.ip ?? '';

  // Hash simple pour le MVP
  const raw = `${ua}|${lang}|${ip}`;
  req.deviceFingerprint = raw;
  next();
};

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      deviceFingerprint?: string;
    }
  }
}
