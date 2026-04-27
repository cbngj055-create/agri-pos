import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db/index.js';
import { generateToken, authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// POST /auth/register
router.post('/register', async (req: Request, res: Response) => {
  const { username, email, password, storeName } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if user exists
    const existing = await client.query('SELECT id FROM users WHERE email = $1 OR username = $2', [email, username]);
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'User already exists' });
    }

    const userId = uuidv4();
    const storeId = uuidv4();
    const passwordHash = await bcrypt.hash(password, 10);
    const now = Math.floor(Date.now() / 1000);

    // Create store first WITHOUT owner_id to avoid FK ordering issues across environments
    await client.query(
      'INSERT INTO stores (id, name, owner_id, created_at, updated_at) VALUES ($1, $2, NULL, $3, $3)',
      [storeId, storeName || `${username}'s Store`, now]
    );

    // Create user
    await client.query(
      'INSERT INTO users (id, username, email, password_hash, store_id, role, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $7)',
      [userId, username, email, passwordHash, storeId, 'owner', now]
    );

    // Link store -> owner
    await client.query('UPDATE stores SET owner_id = $1, updated_at = $2 WHERE id = $3', [userId, now, storeId]);

    await client.query('COMMIT');

    const token = generateToken(userId, storeId);
    res.status(201).json({
      token,
      user: { id: userId, username, email, storeId, role: 'owner' }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  } finally {
    client.release();
  }
});

// POST /auth/login
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Missing email or password' });
  }

  try {
    const result = await pool.query(
      'SELECT id, username, email, password_hash, store_id, role FROM users WHERE email = $1 AND deleted_at IS NULL',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user.id, user.store_id);
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        storeId: user.store_id,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /auth/me
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, store_id, role FROM users WHERE id = $1 AND deleted_at IS NULL',
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      storeId: user.store_id,
      role: user.role
    });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

export default router;
