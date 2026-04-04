import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { API_PREFIX } from '@voxcite/shared';
import { domainsRouter } from './routes/domains.js';
import { partisRouter } from './routes/parties.js';
import { questionsRouter } from './routes/questions.js';
import { sessionsRouter } from './routes/sessions.js';
import { nebulaRouter } from './routes/nebula.js';
import { analysisRouter } from './routes/analysis.js';
import { feedbackRouter } from './routes/feedback.js';
import { proposalsRouter } from './routes/proposals.js';
import { programRouter } from './routes/program.js';
import { critiqueRouter } from './routes/critique.js';
import { rateLimit } from './middleware/rateLimit.js';

// ── Environment validation ─────────────────────────────────────────

const port = parseInt(process.env.PORT || '3001', 10);
if (isNaN(port)) throw new Error('PORT must be a number');
if (!process.env.DATABASE_URL) console.warn('[voxcite-api] WARNING: DATABASE_URL not set');

// ── App setup ──────────────────────────────────────────────────────

const app = express();

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json({ limit: '100kb' }));
app.use(rateLimit);

// ── Routes ─────────────────────────────────────────────────────────

// Données de référence (lecture)
app.use(`${API_PREFIX}/domains`, domainsRouter);
app.use(`${API_PREFIX}/partis`, partisRouter);
app.use(`${API_PREFIX}/questions`, questionsRouter);

// Sessions et réponses
app.use(`${API_PREFIX}/sessions`, sessionsRouter);

// Nébuleuse collective
app.use(`${API_PREFIX}/nebula`, nebulaRouter);

// Analyse IA
app.use(`${API_PREFIX}/analysis`, analysisRouter);

// Programme citoyen et propositions
app.use(`${API_PREFIX}/proposals`, proposalsRouter);
app.use(`${API_PREFIX}/program`, programRouter);
app.use(`${API_PREFIX}/feedback`, feedbackRouter);

// Esprit critique
app.use(`${API_PREFIX}/critique`, critiqueRouter);

// Health check
app.get(`${API_PREFIX}/health`, (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Global error handler ───────────────────────────────────────────

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[voxcite-api] Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`[voxcite-api] Listening on http://localhost:${port}`);
  console.log(`[voxcite-api] API: http://localhost:${port}${API_PREFIX}`);
});
