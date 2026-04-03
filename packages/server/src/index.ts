import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { API_PREFIX } from '@voxcite/shared';
import { opinionsRouter } from './routes/opinions.js';
import { synthesisRouter } from './routes/synthesis.js';
import { subjectsRouter } from './routes/subjects.js';
import { shareRouter } from './routes/share.js';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes API
app.use(`${API_PREFIX}/opinions`, opinionsRouter);
app.use(`${API_PREFIX}/synthesis`, synthesisRouter);
app.use(`${API_PREFIX}/subjects`, subjectsRouter);
app.use(`${API_PREFIX}/share`, shareRouter);

// Health check
app.get(`${API_PREFIX}/health`, (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`[voxcite-api] Listening on http://localhost:${port}`);
});
