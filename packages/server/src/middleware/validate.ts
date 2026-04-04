import type { RequestHandler } from 'express';
import { isValidUUID } from '../utils/helpers.js';

/**
 * Validate that required body fields are present and non-empty.
 */
export function requireFields(...fields: string[]): RequestHandler {
  return (req, res, next) => {
    for (const field of fields) {
      if (req.body[field] == null || req.body[field] === '') {
        res.status(400).json({ error: `${field} is required` });
        return;
      }
    }
    next();
  };
}

/**
 * Validate :id param is a valid UUID.
 */
export const validateUUIDParam: RequestHandler = (req, res, next) => {
  const id = req.params.id;
  if (id && !isValidUUID(id)) {
    res.status(400).json({ error: 'Invalid ID format' });
    return;
  }
  next();
};

/**
 * Validate sessionId in body is a valid UUID (if present).
 */
export const validateSessionId: RequestHandler = (req, res, next) => {
  const { sessionId } = req.body;
  if (sessionId && !isValidUUID(sessionId)) {
    res.status(400).json({ error: 'Invalid sessionId format' });
    return;
  }
  next();
};
