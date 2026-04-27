import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { initDB, pool } from './db/index.js';
import authRoutes from './routes/auth.js';
import syncRoutes from './routes/sync.js';
import dataRoutes from './routes/data.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());

const allowOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser clients (no origin) and allow all when no allowlist configured (dev)
      if (!origin) return callback(null, true);
      if (allowOrigins.length === 0) return callback(null, true);
      if (allowOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

// Routes
app.use('/auth', authLimiter, authRoutes);
app.use('/sync', syncRoutes);
app.use('/api', dataRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Start server
async function start() {
  try {
    await initDB();
    console.log('✅ Database initialized');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await pool.end();
  process.exit(0);
});

start();
