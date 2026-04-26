import { Router, Response } from 'express';
import { pool } from '../db/index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// All sync routes require auth
router.use(authMiddleware);

// Table mappings: local table name → server table name + columns
const TABLE_CONFIG: Record<string, { table: string; columns: string[]; conflictColumns: string[] }> = {
  products: {
    table: 'products',
    columns: ['id', 'name', 'barcode', 'purchase_price', 'sale_price', 'stock', 'category', 'unit', 'expiry_date', 'store_id', 'created_at', 'updated_at', 'deleted_at'],
    conflictColumns: ['id']
  },
  customers: {
    table: 'customers',
    columns: ['id', 'name', 'phone', 'address', 'balance', 'store_id', 'created_at', 'updated_at', 'deleted_at'],
    conflictColumns: ['id']
  },
  suppliers: {
    table: 'suppliers',
    columns: ['id', 'name', 'phone', 'company', 'balance', 'store_id', 'created_at', 'updated_at', 'deleted_at'],
    conflictColumns: ['id']
  },
  orders: {
    table: 'orders',
    columns: ['id', 'type', 'date', 'total', 'entity_id', 'entity_type', 'payment_type', 'paid_amount', 'store_id', 'created_at', 'updated_at', 'deleted_at'],
    conflictColumns: ['id']
  },
  order_items: {
    table: 'order_items',
    columns: ['id', 'order_id', 'product_id', 'quantity', 'price', 'buy_price', 'store_id', 'created_at', 'updated_at', 'deleted_at'],
    conflictColumns: ['id']
  },
  payments: {
    table: 'payments',
    columns: ['id', 'date', 'entity_id', 'entity_type', 'amount', 'payment_method', 'type', 'notes', 'check_number', 'check_date', 'check_status', 'store_id', 'created_at', 'updated_at', 'deleted_at'],
    conflictColumns: ['id']
  },
  expenses: {
    table: 'expenses',
    columns: ['id', 'date', 'amount', 'category', 'description', 'store_id', 'created_at', 'updated_at', 'deleted_at'],
    conflictColumns: ['id']
  },
  employees: {
    table: 'employees',
    columns: ['id', 'name', 'role', 'phone', 'salary', 'join_date', 'store_id', 'created_at', 'updated_at', 'deleted_at'],
    conflictColumns: ['id']
  },
  prescriptions: {
    table: 'prescriptions',
    columns: ['id', 'crop_name', 'title', 'details', 'store_id', 'created_at', 'updated_at', 'deleted_at'],
    conflictColumns: ['id']
  },
  categories: {
    table: 'categories',
    columns: ['id', 'name', 'store_id', 'created_at', 'updated_at', 'deleted_at'],
    conflictColumns: ['id']
  }
};

// POST /sync/push - Receive data from devices
router.post('/push', async (req: AuthRequest, res: Response) => {
  const { device_id, data } = req.body;
  const storeId = req.storeId;

  if (!device_id || !data) {
    return res.status(400).json({ error: 'Missing device_id or data' });
  }

  const results: Record<string, { pushed: number; conflicts: any[] }> = {};
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const [tableName, rows] of Object.entries(data)) {
      if (!TABLE_CONFIG[tableName]) continue;

      const config = TABLE_CONFIG[tableName];
      let pushed = 0;
      const conflicts: any[] = [];

      for (const row of rows as any[]) {
        // Ensure store_id matches
        row.store_id = storeId;

        // Check if row exists on server
        const existing = await client.query(
          `SELECT id, updated_at FROM ${config.table} WHERE id = $1 AND store_id = $2`,
          [row.id, storeId]
        );

        if (existing.rows.length > 0) {
          // Conflict resolution: Last Write Wins
          const serverUpdatedAt = existing.rows[0].updated_at;
          const clientUpdatedAt = row.updated_at;

          if (clientUpdatedAt > serverUpdatedAt) {
            // Client wins - update server
            const setClause = config.columns
              .filter(c => c !== 'id' && c !== 'store_id')
              .map((c, i) => `${c} = $${i + 1}`)
              .join(', ');

            const values = config.columns
              .filter(c => c !== 'id' && c !== 'store_id')
              .map(c => row[c] ?? null);

            await client.query(
              `UPDATE ${config.table} SET ${setClause}, sync_status = 'synced' WHERE id = $${values.length + 1} AND store_id = $${values.length + 2}`,
              [...values, row.id, storeId]
            );
            pushed++;
          } else {
            // Server wins - send back as conflict
            const serverRow = await client.query(
              `SELECT * FROM ${config.table} WHERE id = $1 AND store_id = $2`,
              [row.id, storeId]
            );
            conflicts.push(serverRow.rows[0]);
          }
        } else {
          // New row - insert
          const cols = config.columns.join(', ');
          const placeholders = config.columns.map((_, i) => `$${i + 1}`).join(', ');
          const values = config.columns.map(c => row[c] ?? null);

          await client.query(
            `INSERT INTO ${config.table} (${cols}) VALUES (${placeholders}) ON CONFLICT (id) DO UPDATE SET ${config.columns.filter(c => c !== 'id').map((c, i) => `${c} = $${i + 2}`).join(', ')}`,
            values
          );
          pushed++;
        }

        // Log sync action
        const action = row.deleted_at ? 'delete' : (existing.rows.length > 0 ? 'update' : 'insert');
        await client.query(
          'INSERT INTO sync_log (device_id, table_name, row_id, action, timestamp, store_id) VALUES ($1, $2, $3, $4, $5, $6)',
          [device_id, tableName, row.id, action, Math.floor(Date.now() / 1000), storeId]
        );
      }

      results[tableName] = { pushed, conflicts };
    }

    await client.query('COMMIT');
    res.json({ success: true, results });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Push error:', err);
    res.status(500).json({ error: 'Push failed' });
  } finally {
    client.release();
  }
});

// GET /sync/pull - Send updated data to devices
router.get('/pull', async (req: AuthRequest, res: Response) => {
  const lastSync = parseInt(req.query.last_sync as string) || 0;
  const storeId = req.storeId;

  const data: Record<string, any[]> = {};

  try {
    for (const [tableName, config] of Object.entries(TABLE_CONFIG)) {
      const result = await pool.query(
        `SELECT * FROM ${config.table} WHERE store_id = $1 AND updated_at > $2 AND deleted_at IS NULL ORDER BY updated_at ASC`,
        [storeId, lastSync]
      );
      data[tableName] = result.rows;
    }

    // Also get deleted records
    for (const [tableName, config] of Object.entries(TABLE_CONFIG)) {
      const deleted = await pool.query(
        `SELECT id, deleted_at, updated_at FROM ${config.table} WHERE store_id = $1 AND deleted_at IS NOT NULL AND updated_at > $2`,
        [storeId, lastSync]
      );
      if (deleted.rows.length > 0) {
        if (!data[`_deleted_${tableName}`]) {
          data[`_deleted_${tableName}`] = [];
        }
        data[`_deleted_${tableName}`] = deleted.rows;
      }
    }

    const newSyncTime = Math.floor(Date.now() / 1000);
    res.json({ data, last_sync: newSyncTime });
  } catch (err) {
    console.error('Pull error:', err);
    res.status(500).json({ error: 'Pull failed' });
  }
});

// GET /sync/status - Get sync status for device
router.get('/status', async (req: AuthRequest, res: Response) => {
  const storeId = req.storeId;

  try {
    const counts: Record<string, number> = {};
    for (const [tableName, config] of Object.entries(TABLE_CONFIG)) {
      const result = await pool.query(
        `SELECT COUNT(*) as count FROM ${config.table} WHERE store_id = $1`,
        [storeId]
      );
      counts[tableName] = parseInt(result.rows[0].count);
    }

    const lastLog = await pool.query(
      'SELECT MAX(timestamp) as last_sync FROM sync_log WHERE store_id = $1',
      [storeId]
    );

    res.json({
      counts,
      last_sync: lastLog.rows[0]?.last_sync || 0
    });
  } catch (err) {
    console.error('Status error:', err);
    res.status(500).json({ error: 'Status check failed' });
  }
});

export default router;
