import type { RequestHandler } from 'express';
import crypto from 'crypto';

const QG_PASSWORD = process.env.QG_PASSWORD;

// In-memory token store: token → expiry timestamp (24h)
const tokens = new Map<string, number>();

// Cleanup expired tokens hourly
setInterval(() => {
  const now = Date.now();
  for (const [tok, exp] of tokens) {
    if (now > exp) tokens.delete(tok);
  }
}, 60 * 60 * 1000);

export function isQGConfigured(): boolean {
  return Boolean(QG_PASSWORD);
}

export function verifyAndIssueToken(password: string): string | null {
  if (!QG_PASSWORD || password !== QG_PASSWORD) return null;
  const token = crypto.randomUUID();
  tokens.set(token, Date.now() + 24 * 60 * 60 * 1000); // 24h
  return token;
}

export const qgAuth: RequestHandler = (req, res, next) => {
  if (!QG_PASSWORD) {
    res.status(503).json({ error: 'QG non configuré (QG_PASSWORD manquant dans .env)' });
    return;
  }
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentification requise' });
    return;
  }
  const token = auth.slice(7);
  const expiry = tokens.get(token);
  if (!expiry || Date.now() > expiry) {
    res.status(401).json({ error: 'Token expiré ou invalide' });
    return;
  }
  next();
};
