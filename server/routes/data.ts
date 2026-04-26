import { Router, Response } from 'express';
import { pool } from '../db/index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

// GET /api/products
router.get('/products', async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM products WHERE store_id = $1 AND deleted_at IS NULL ORDER BY name',
      [req.storeId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/customers
router.get('/customers', async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM customers WHERE store_id = $1 AND deleted_at IS NULL ORDER BY name',
      [req.storeId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// GET /api/suppliers
router.get('/suppliers', async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM suppliers WHERE store_id = $1 AND deleted_at IS NULL ORDER BY name',
      [req.storeId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
});

// GET /api/orders?type=sale|purchase
router.get('/orders', async (req: AuthRequest, res: Response) => {
  try {
    const type = req.query.type as string;
    let query = 'SELECT * FROM orders WHERE store_id = $1 AND deleted_at IS NULL';
    const params: any[] = [req.storeId];

    if (type) {
      query += ' AND type = $2';
      params.push(type);
    }

    query += ' ORDER BY date DESC';
    const result = await pool.query(query, params);

    // Get order items for each order
    for (const order of result.rows) {
      const items = await pool.query(
        'SELECT * FROM order_items WHERE order_id = $1 AND deleted_at IS NULL',
        [order.id]
      );
      order.items = items.rows;
    }

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /api/payments
router.get('/payments', async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM payments WHERE store_id = $1 AND deleted_at IS NULL ORDER BY date DESC',
      [req.storeId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// GET /api/expenses
router.get('/expenses', async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM expenses WHERE store_id = $1 AND deleted_at IS NULL ORDER BY date DESC',
      [req.storeId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// GET /api/employees
router.get('/employees', async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM employees WHERE store_id = $1 AND deleted_at IS NULL ORDER BY name',
      [req.storeId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// GET /api/prescriptions
router.get('/prescriptions', async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM prescriptions WHERE store_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC',
      [req.storeId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch prescriptions' });
  }
});

// GET /api/categories
router.get('/categories', async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM categories WHERE store_id = $1 AND deleted_at IS NULL ORDER BY name',
      [req.storeId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET /api/dashboard
router.get('/dashboard', async (req: AuthRequest, res: Response) => {
  try {
    const storeId = req.storeId;

    const [salesCount, productsCount, customersCount, totalRevenue] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM orders WHERE store_id = $1 AND type = $2 AND deleted_at IS NULL', [storeId, 'sale']),
      pool.query('SELECT COUNT(*) as count FROM products WHERE store_id = $1 AND deleted_at IS NULL', [storeId]),
      pool.query('SELECT COUNT(*) as count FROM customers WHERE store_id = $1 AND deleted_at IS NULL', [storeId]),
      pool.query('SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE store_id = $1 AND type = $2 AND deleted_at IS NULL', [storeId, 'sale']),
    ]);

    res.json({
      salesCount: parseInt(salesCount.rows[0].count),
      productsCount: parseInt(productsCount.rows[0].count),
      customersCount: parseInt(customersCount.rows[0].count),
      totalRevenue: parseFloat(totalRevenue.rows[0].total),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

export default router;
