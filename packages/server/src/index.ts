import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root (works from packages/server/ and from root)
dotenv.config({ path: path.resolve(import.meta.dirname, '../../../.env') });
dotenv.config(); // fallback: current working directory

import express from 'express';
import cors from 'cors';
import { API_PREFIX } from '@partiprism/shared';
import { domainsRouter } from './routes/domains.js';
import { partisRouter } from './routes/parties.js';
import { questionsRouter } from './routes/questions.js';
import { mediasRouter } from './routes/medias.js';
import { sessionsRouter } from './routes/sessions.js';
import { nebulaRouter } from './routes/nebula.js';
import { analysisRouter } from './routes/analysis.js';
import { feedbackRouter } from './routes/feedback.js';
import { proposalsRouter } from './routes/proposals.js';
import { programRouter } from './routes/program.js';
import { critiqueRouter } from './routes/critique.js';
import { adminRouter } from './routes/admin.js';
import { qgRouter } from './routes/qg.js';
import { rateLimit, aiRateLimit, sessionRateLimit } from './middleware/rateLimit.js';
import { adminAuth } from './middleware/adminAuth.js';
import { startAnalysisWorker } from './services/analysis-worker.js';

// ── Environment validation ─────────────────────────────────────────

const port = parseInt(process.env.PORT || '3001', 10);
if (isNaN(port)) throw new Error('PORT must be a number');
if (!process.env.DATABASE_URL) console.warn('[partiprism-api] WARNING: DATABASE_URL not set');

// ── App setup ──────────────────────────────────────────────────────

const app = express();

app.set('trust proxy', true);

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '100kb' }));
app.use(rateLimit);

// ── Routes ─────────────────────────────────────────────────────────

// Données de référence (lecture)
app.use(`${API_PREFIX}/domains`, domainsRouter);
app.use(`${API_PREFIX}/partis`, partisRouter);
app.use(`${API_PREFIX}/questions`, questionsRouter);
app.use(`${API_PREFIX}/medias`, mediasRouter);

// Snapshots et votes anonymes (rate limited)
app.post(`${API_PREFIX}/sessions/snapshot`, sessionRateLimit);
app.use(`${API_PREFIX}/sessions`, sessionsRouter);

// Nébuleuse collective
app.use(`${API_PREFIX}/nebula`, nebulaRouter);

// Analyse IA (rate limited: 5 calls/h/IP — consomme des tokens)
app.use(`${API_PREFIX}/analysis`, aiRateLimit, analysisRouter);

// Programme citoyen et propositions
app.use(`${API_PREFIX}/proposals`, proposalsRouter);
app.use(`${API_PREFIX}/program`, programRouter);
app.use(`${API_PREFIX}/feedback`, feedbackRouter);

// Esprit critique
app.use(`${API_PREFIX}/critique`, critiqueRouter);

// Admin QG legacy (protégé par Basic Auth)
app.use(`${API_PREFIX}/admin`, adminAuth, adminRouter);

// Board QG (token-based auth, pour le board éditorial)
app.use(`${API_PREFIX}/qg`, qgRouter);

// Health check
app.get(`${API_PREFIX}/health`, (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Global error handler ───────────────────────────────────────────

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[partiprism-api] Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`[partiprism-api] Listening on http://localhost:${port}`);
  console.log(`[partiprism-api] API: http://localhost:${port}${API_PREFIX}`);

  // Start background worker for async analysis jobs
  startAnalysisWorker();
});
