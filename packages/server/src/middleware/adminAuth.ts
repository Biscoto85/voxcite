import type { RequestHandler } from 'express';
import { db } from '../db/index.js';
import { adminUsers } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

/**
 * Simple password hashing using scrypt (no external deps).
 * Format: salt:hash (hex encoded)
 */
export function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

export function verifyPassword(password: string, stored: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const [salt, hash] = stored.split(':');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(derivedKey.toString('hex') === hash);
    });
  });
}

/**
 * Basic Auth middleware for admin routes.
 * Checks credentials against the admin_users table.
 */
export const adminAuth: RequestHandler = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="PartiPrism QG"');
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const credentials = Buffer.from(authHeader.slice(6), 'base64').toString();
    const [username, password] = credentials.split(':');

    if (!username || !password) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const [user] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.username, username));

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Attach username for audit
    (req as any).adminUsername = username;
    next();
  } catch {
    res.status(500).json({ error: 'Auth error' });
  }
};
