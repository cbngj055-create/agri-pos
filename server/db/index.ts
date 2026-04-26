import pg from 'pg';
const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/agri_pos',
});

export async function initDB() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        store_id TEXT,
        role TEXT DEFAULT 'user',
        created_at INTEGER NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::INTEGER),
        updated_at INTEGER NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::INTEGER),
        deleted_at INTEGER NULL,
        sync_status TEXT DEFAULT 'synced'
      );
    `);

    // Stores table
    await client.query(`
      CREATE TABLE IF NOT EXISTS stores (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        owner_id TEXT REFERENCES users(id),
        address TEXT,
        phone TEXT,
        created_at INTEGER NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::INTEGER),
        updated_at INTEGER NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::INTEGER),
        deleted_at INTEGER NULL,
        sync_status TEXT DEFAULT 'synced'
      );
    `);

    // Categories table
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        store_id TEXT REFERENCES stores(id),
        created_at INTEGER NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::INTEGER),
        updated_at INTEGER NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::INTEGER),
        deleted_at INTEGER NULL,
        sync_status TEXT DEFAULT 'synced'
      );
    `);

    // Products table
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        barcode TEXT,
        purchase_price NUMERIC DEFAULT 0,
        sale_price NUMERIC DEFAULT 0,
        stock INTEGER DEFAULT 0,
        category TEXT,
        unit TEXT DEFAULT 'piece',
        expiry_date TEXT,
        store_id TEXT REFERENCES stores(id),
        created_at INTEGER NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::INTEGER),
        updated_at INTEGER NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::INTEGER),
        deleted_at INTEGER NULL,
        sync_status TEXT DEFAULT 'synced'
      );
    `);

    // Customers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT,
        address TEXT,
        balance NUMERIC DEFAULT 0,
        store_id TEXT REFERENCES stores(id),
        created_at INTEGER NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::INTEGER),
        updated_at INTEGER NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::INTEGER),
        deleted_at INTEGER NULL,
        sync_status TEXT DEFAULT 'synced'
      );
    `);

    // Suppliers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT,
        company TEXT,
        balance NUMERIC DEFAULT 0,
        store_id TEXT REFERENCES stores(id),
        created_at INTEGER NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::INTEGER),
        updated_at INTEGER NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::INTEGER),
        deleted_at INTEGER NULL,
        sync_status TEXT DEFAULT 'synced'
      );
    `);

    // Orders table (sales + purchases)
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL CHECK (type IN ('sale', 'purchase')),
        date TEXT NOT NULL,
        total NUMERIC DEFAULT 0,
        entity_id TEXT,
        entity_type TEXT CHECK (entity_type IN ('customer', 'supplier')),
        payment_type TEXT CHECK (payment_type IN ('cash', 'credit')),
        paid_amount NUMERIC DEFAULT 0,
        store_id TEXT REFERENCES stores(id),
        created_at INTEGER NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::INTEGER),
        updated_at INTEGER NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::INTEGER),
        deleted_at INTEGER NULL,
        sync_status TEXT DEFAULT 'synced'
      );
    `);

    // Order items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id TEXT PRIMARY KEY,
        order_id TEXT REFERENCES orders(id),
        product_id TEXT REFERENCES products(id),
        quantity INTEGER DEFAULT 0,
        price NUMERIC DEFAULT 0,
        buy_price NUMERIC DEFAULT 0,
        store_id TEXT REFERENCES stores(id),
        created_at INTEGER NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::INTEGER),
        updated_at INTEGER NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::INTEGER),
        deleted_at INTEGER NULL,
        sync_status TEXT DEFAULT 'synced'
      );
    `);

    // Payments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        entity_type TEXT CHECK (entity_type IN ('customer', 'supplier')),
        amount NUMERIC DEFAULT 0,
        payment_method TEXT CHECK (payment_method IN ('cash', 'check', 'bank_transfer')),
        type TEXT CHECK (type IN ('payment_in', 'payment_out')),
        notes TEXT,
        check_number TEXT,
        check_date TEXT,
        check_status TEXT CHECK (check_status IN ('pending', 'cleared', 'bounced')),
        store_id TEXT REFERENCES stores(id),
        created_at INTEGER NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::INTEGER),
        updated_at INTEGER NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::INTEGER),
        deleted_at INTEGER NULL,
        sync_status TEXT DEFAULT 'synced'
      );
    `);

    // Expenses table
    await client.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        amount NUMERIC DEFAULT 0,
        category TEXT,
        description TEXT,
        store_id TEXT REFERENCES stores(id),
        created_at INTEGER NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::INTEGER),
        updated_at INTEGER NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::INTEGER),
        deleted_at INTEGER NULL,
        sync_status TEXT DEFAULT 'synced'
      );
    `);

    // Employees table
    await client.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        role TEXT,
        phone TEXT,
        salary NUMERIC DEFAULT 0,
        join_date TEXT,
        store_id TEXT REFERENCES stores(id),
        created_at INTEGER NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::INTEGER),
        updated_at INTEGER NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::INTEGER),
        deleted_at INTEGER NULL,
        sync_status TEXT DEFAULT 'synced'
      );
    `);

    // Prescriptions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS prescriptions (
        id TEXT PRIMARY KEY,
        crop_name TEXT NOT NULL,
        title TEXT NOT NULL,
        details TEXT,
        store_id TEXT REFERENCES stores(id),
        created_at INTEGER NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::INTEGER),
        updated_at INTEGER NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::INTEGER),
        deleted_at INTEGER NULL,
        sync_status TEXT DEFAULT 'synced'
      );
    `);

    // Sync log table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sync_log (
        id SERIAL PRIMARY KEY,
        device_id TEXT NOT NULL,
        table_name TEXT NOT NULL,
        row_id TEXT NOT NULL,
        action TEXT NOT NULL CHECK (action IN ('insert', 'update', 'delete')),
        timestamp INTEGER NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::INTEGER),
        store_id TEXT
      );
    `);

    // Indexes for sync performance
    await client.query(`CREATE INDEX IF NOT EXISTS idx_sync_log_timestamp ON sync_log(timestamp);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_sync_log_table_row ON sync_log(table_name, row_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_products_updated_at ON products(updated_at);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_orders_updated_at ON orders(updated_at);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_customers_updated_at ON customers(updated_at);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_suppliers_updated_at ON suppliers(updated_at);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_payments_updated_at ON payments(updated_at);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_expenses_updated_at ON expenses(updated_at);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_employees_updated_at ON employees(updated_at);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_prescriptions_updated_at ON prescriptions(updated_at);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_order_items_updated_at ON order_items(updated_at);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_categories_updated_at ON categories(updated_at);`);

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
