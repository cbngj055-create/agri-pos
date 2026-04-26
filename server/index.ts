import express from 'express';
import cors from 'cors';
import { initDB, pool } from './db/index.js';
import authRoutes from './routes/auth.js';
import syncRoutes from './routes/sync.js';
import dataRoutes from './routes/data.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/auth', authRoutes);
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
