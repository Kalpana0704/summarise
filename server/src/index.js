import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { errorHandler } from './middleware/errorHandler.js';
import quizRoutes from './routes/quizzes.js';
import userRoutes from './routes/users.js';

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }
      // Local dev (any Vite port)
      if (/^http:\/\/localhost:\d+$/.test(origin)) {
        callback(null, true);
        return;
      }
      // Vercel production + preview deployments (e.g. summarise-delta.vercel.app)
      if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) {
        callback(null, true);
        return;
      }
      const allowed = process.env.CLIENT_URL ?? 'http://localhost:5173';
      callback(null, origin === allowed);
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'story-quiz-api' });
});

app.get('/', (_req, res) => {
  res.redirect(process.env.CLIENT_URL ?? 'http://localhost:5173');
});

app.use('/api/users', userRoutes);
app.use('/api/quizzes', quizRoutes);

app.use(errorHandler);

const server = app.listen(PORT, () => {
  const aiProvider = process.env.GROQ_API_KEY
    ? 'Groq'
    : process.env.GEMINI_API_KEY
      ? 'Gemini'
      : process.env.OLLAMA_ENABLED === 'true'
        ? 'Ollama'
        : 'none';
  console.log(`Story Quiz API running on http://localhost:${PORT}`);
  console.log(`AI provider: ${aiProvider}`);
  console.log(`Firebase project: ${process.env.FIREBASE_PROJECT_ID ?? 'NOT SET'}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\nPort ${PORT} is already in use.`);
    console.error('Stop the old server (Ctrl+C in its terminal), or run:');
    console.error(`  netstat -ano | findstr :${PORT}`);
    console.error('  taskkill /PID <PID> /F\n');
    process.exit(1);
  }
  throw err;
});
