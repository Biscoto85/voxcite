import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { API_PREFIX } from '@voxcite/shared';
import { domainsRouter } from './routes/domains.js';
import { partisRouter } from './routes/parties.js';
import { questionsRouter } from './routes/questions.js';
import { sessionsRouter } from './routes/sessions.js';
import { opinionsRouter } from './routes/opinions.js';
import { synthesisRouter } from './routes/synthesis.js';
import { subjectsRouter } from './routes/subjects.js';
import { shareRouter } from './routes/share.js';
import { nebulaRouter } from './routes/nebula.js';
import { analysisRouter } from './routes/analysis.js';
import { feedbackRouter } from './routes/feedback.js';
import { proposalsRouter } from './routes/proposals.js';
import { programRouter } from './routes/program.js';
import { critiqueRouter } from './routes/critique.js';
import { rateLimit } from './middleware/rateLimit.js';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(rateLimit);

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

// Avis citoyens et synthèse (v2)
app.use(`${API_PREFIX}/opinions`, opinionsRouter);
app.use(`${API_PREFIX}/synthesis`, synthesisRouter);
app.use(`${API_PREFIX}/subjects`, subjectsRouter);
app.use(`${API_PREFIX}/share`, shareRouter);

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

app.listen(port, () => {
  console.log(`[voxcite-api] Listening on http://localhost:${port}`);
  console.log(`[voxcite-api] API: http://localhost:${port}${API_PREFIX}`);
});
