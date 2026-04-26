import initSqlJs, { Database } from 'sql.js';

let db: Database | null = null;

// Column definitions per table (sync columns included)
const TABLE_SCHEMAS: Record<string, string> = {
  users: `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      store_id TEXT,
      role TEXT DEFAULT 'user',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      deleted_at INTEGER NULL,
      sync_status TEXT DEFAULT 'pending'
    )`,

  stores: `
    CREATE TABLE IF NOT EXISTS stores (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      owner_id TEXT,
      address TEXT,
      phone TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      deleted_at INTEGER NULL,
      sync_status TEXT DEFAULT 'pending'
    )`,

  categories: `
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      store_id TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      deleted_at INTEGER NULL,
      sync_status TEXT DEFAULT 'pending'
    )`,

  products: `
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      barcode TEXT,
      purchase_price REAL DEFAULT 0,
      sale_price REAL DEFAULT 0,
      stock INTEGER DEFAULT 0,
      category TEXT,
      unit TEXT DEFAULT 'piece',
      expiry_date TEXT,
      store_id TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      deleted_at INTEGER NULL,
      sync_status TEXT DEFAULT 'pending'
    )`,

  customers: `
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      balance REAL DEFAULT 0,
      store_id TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      deleted_at INTEGER NULL,
      sync_status TEXT DEFAULT 'pending'
    )`,

  suppliers: `
    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      company TEXT,
      balance REAL DEFAULT 0,
      store_id TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      deleted_at INTEGER NULL,
      sync_status TEXT DEFAULT 'pending'
    )`,

  orders: `
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK(type IN ('sale','purchase')),
      date TEXT NOT NULL,
      total REAL DEFAULT 0,
      entity_id TEXT,
      entity_type TEXT CHECK(entity_type IN ('customer','supplier')),
      payment_type TEXT CHECK(payment_type IN ('cash','credit')),
      paid_amount REAL DEFAULT 0,
      store_id TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      deleted_at INTEGER NULL,
      sync_status TEXT DEFAULT 'pending'
    )`,

  order_items: `
    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT,
      product_id TEXT,
      quantity INTEGER DEFAULT 0,
      price REAL DEFAULT 0,
      buy_price REAL DEFAULT 0,
      store_id TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      deleted_at INTEGER NULL,
      sync_status TEXT DEFAULT 'pending'
    )`,

  payments: `
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      entity_type TEXT CHECK(entity_type IN ('customer','supplier')),
      amount REAL DEFAULT 0,
      payment_method TEXT CHECK(payment_method IN ('cash','check','bank_transfer')),
      type TEXT CHECK(type IN ('payment_in','payment_out')),
      notes TEXT,
      check_number TEXT,
      check_date TEXT,
      check_status TEXT CHECK(check_status IN ('pending','cleared','bounced')),
      store_id TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      deleted_at INTEGER NULL,
      sync_status TEXT DEFAULT 'pending'
    )`,

  expenses: `
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      amount REAL DEFAULT 0,
      category TEXT,
      description TEXT,
      store_id TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      deleted_at INTEGER NULL,
      sync_status TEXT DEFAULT 'pending'
    )`,

  employees: `
    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT,
      phone TEXT,
      salary REAL DEFAULT 0,
      join_date TEXT,
      store_id TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      deleted_at INTEGER NULL,
      sync_status TEXT DEFAULT 'pending'
    )`,

  prescriptions: `
    CREATE TABLE IF NOT EXISTS prescriptions (
      id TEXT PRIMARY KEY,
      crop_name TEXT NOT NULL,
      title TEXT NOT NULL,
      details TEXT,
      store_id TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      deleted_at INTEGER NULL,
      sync_status TEXT DEFAULT 'pending'
    )`,

  sync_log: `
    CREATE TABLE IF NOT EXISTS sync_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT NOT NULL,
      table_name TEXT NOT NULL,
      row_id TEXT NOT NULL,
      action TEXT NOT NULL CHECK(action IN ('insert','update','delete')),
      timestamp INTEGER NOT NULL,
      store_id TEXT
    )`,

  sync_meta: `
    CREATE TABLE IF NOT EXISTS sync_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )`
};

// Indexes for sync performance
const INDEXES: string[] = [
  'CREATE INDEX IF NOT EXISTS idx_sync_log_timestamp ON sync_log(timestamp)',
  'CREATE INDEX IF NOT EXISTS idx_sync_log_table_row ON sync_log(table_name, row_id)',
  'CREATE INDEX IF NOT EXISTS idx_products_updated_at ON products(updated_at)',
  'CREATE INDEX IF NOT EXISTS idx_orders_updated_at ON orders(updated_at)',
  'CREATE INDEX IF NOT EXISTS idx_customers_updated_at ON customers(updated_at)',
  'CREATE INDEX IF NOT EXISTS idx_suppliers_updated_at ON suppliers(updated_at)',
  'CREATE INDEX IF NOT EXISTS idx_payments_updated_at ON payments(updated_at)',
  'CREATE INDEX IF NOT EXISTS idx_expenses_updated_at ON expenses(updated_at)',
  'CREATE INDEX IF NOT EXISTS idx_employees_updated_at ON employees(updated_at)',
  'CREATE INDEX IF NOT EXISTS idx_prescriptions_updated_at ON prescriptions(updated_at)',
  'CREATE INDEX IF NOT EXISTS idx_order_items_updated_at ON order_items(updated_at)',
  'CREATE INDEX IF NOT EXISTS idx_products_sync_status ON products(sync_status)',
  'CREATE INDEX IF NOT EXISTS idx_orders_sync_status ON orders(sync_status)',
  'CREATE INDEX IF NOT EXISTS idx_customers_sync_status ON customers(sync_status)',
  'CREATE INDEX IF NOT EXISTS idx_suppliers_sync_status ON suppliers(sync_status)',
  'CREATE INDEX IF NOT EXISTS idx_payments_sync_status ON payments(sync_status)',
  'CREATE INDEX IF NOT EXISTS idx_expenses_sync_status ON expenses(sync_status)',
  'CREATE INDEX IF NOT EXISTS idx_employees_sync_status ON employees(sync_status)',
  'CREATE INDEX IF NOT EXISTS idx_prescriptions_sync_status ON prescriptions(sync_status)',
  'CREATE INDEX IF NOT EXISTS idx_order_items_sync_status ON order_items(sync_status)',
];

const DB_STORAGE_KEY = 'agri_pos_sqlite_db';

function saveToLocalStorage(database: Database) {
  try {
    const data = database.export();
    const buffer = Array.from<number>(data).map(b => String.fromCharCode(b)).join('');
    const base64 = btoa(buffer);
    localStorage.setItem(DB_STORAGE_KEY, base64);
  } catch (err) {
    console.error('Failed to save DB to localStorage:', err);
  }
}

function loadFromLocalStorage(): Uint8Array | null {
  try {
    const base64 = localStorage.getItem(DB_STORAGE_KEY);
    if (!base64) return null;
    const buffer = atob(base64);
    const data = new Uint8Array(buffer.length);
    for (let i = 0; i < buffer.length; i++) {
      data[i] = buffer.charCodeAt(i);
    }
    return data;
  } catch (err) {
    console.error('Failed to load DB from localStorage:', err);
    return null;
  }
}

export async function initDatabase(): Promise<Database> {
  if (db) return db;

  const SQL = await initSqlJs({
    locateFile: (file: string) => `https://sql.js.org/dist/${file}`
  });

  const savedData = loadFromLocalStorage();
  if (savedData) {
    db = new SQL.Database(savedData);
  } else {
    db = new SQL.Database();
  }

  // Create all tables
  for (const schema of Object.values(TABLE_SCHEMAS)) {
    db.run(schema);
  }

  // Create indexes
  for (const indexSql of INDEXES) {
    db.run(indexSql);
  }

  // Initialize sync_meta if empty
  const metaExists = db.exec("SELECT COUNT(*) FROM sync_meta WHERE key = 'last_sync'");
  if (metaExists.length === 0 || metaExists[0].values[0][0] === 0) {
    db.run("INSERT OR IGNORE INTO sync_meta (key, value) VALUES ('last_sync', '0')");
    db.run("INSERT OR IGNORE INTO sync_meta (key, value) VALUES ('device_id', '')");
    db.run("INSERT OR IGNORE INTO sync_meta (key, value) VALUES ('store_id', '')");
    db.run("INSERT OR IGNORE INTO sync_meta (key, value) VALUES ('user_id', '')");
    db.run("INSERT OR IGNORE INTO sync_meta (key, value) VALUES ('auth_token', '')");
  }

  saveToLocalStorage(db);
  return db;
}

export function getDatabase(): Database {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.');
  return db;
}

export function saveDatabase(): void {
  if (!db) return;
  saveToLocalStorage(db);
}

// Helper: generate timestamp
export function nowTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

// Helper: generate UUID
export function generateId(): string {
  return crypto.randomUUID();
}

// Generic CRUD operations
export function insertRow(table: string, data: Record<string, any>): void {
  const database = getDatabase();
  const now = nowTimestamp();

  data.created_at = data.created_at || now;
  data.updated_at = data.updated_at || now;
  data.sync_status = data.sync_status || 'pending';
  data.deleted_at = data.deleted_at || null;

  const columns = Object.keys(data);
  const values = Object.values(data);
  const placeholders = columns.map(() => '?').join(', ');

  database.run(
    `INSERT OR REPLACE INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`,
    values
  );

  // Log to sync_log
  logSyncAction(table, data.id, 'insert');
  saveDatabase();
}

export function updateRow(table: string, id: string, data: Record<string, any>): void {
  const database = getDatabase();
  const now = nowTimestamp();

  data.updated_at = now;
  data.sync_status = 'pending';

  const columns = Object.keys(data);
  const values = Object.values(data);
  const setClause = columns.map(c => `${c} = ?`).join(', ');

  database.run(
    `UPDATE ${table} SET ${setClause} WHERE id = ?`,
    [...values, id]
  );

  logSyncAction(table, id, 'update');
  saveDatabase();
}

export function softDeleteRow(table: string, id: string): void {
  const database = getDatabase();
  const now = nowTimestamp();

  database.run(
    `UPDATE ${table} SET deleted_at = ?, updated_at = ?, sync_status = 'pending' WHERE id = ?`,
    [now, now, id]
  );

  logSyncAction(table, id, 'delete');
  saveDatabase();
}

export function getRow<T = any>(table: string, id: string): T | null {
  const database = getDatabase();
  const result = database.exec(`SELECT * FROM ${table} WHERE id = ? AND deleted_at IS NULL`, [id]);
  if (result.length === 0 || result[0].values.length === 0) return null;
  return mapRow<T>(result[0], 0);
}

export function getAllRows<T = any>(table: string): T[] {
  const database = getDatabase();
  const result = database.exec(`SELECT * FROM ${table} WHERE deleted_at IS NULL ORDER BY created_at DESC`);
  if (result.length === 0) return [];
  return result[0].values.map((_, i) => mapRow<T>(result[0], i));
}

export function getPendingRows<T = any>(table: string): T[] {
  const database = getDatabase();
  const result = database.exec(`SELECT * FROM ${table} WHERE sync_status = 'pending' AND deleted_at IS NULL`);
  if (result.length === 0) return [];
  return result[0].values.map((_, i) => mapRow<T>(result[0], i));
}

export function getDeletedRows(table: string, sinceTimestamp: number): any[] {
  const database = getDatabase();
  const result = database.exec(
    `SELECT id, deleted_at, updated_at FROM ${table} WHERE deleted_at IS NOT NULL AND updated_at > ?`,
    [sinceTimestamp]
  );
  if (result.length === 0) return [];
  return result[0].values.map((_, i) => mapRow(result[0], i));
}

export function markSynced(table: string, ids: string[]): void {
  const database = getDatabase();
  if (ids.length === 0) return;
  const placeholders = ids.map(() => '?').join(', ');
  database.run(
    `UPDATE ${table} SET sync_status = 'synced' WHERE id IN (${placeholders})`,
    ids
  );
  saveDatabase();
}

export function markConflict(table: string, id: string): void {
  const database = getDatabase();
  database.run(`UPDATE ${table} SET sync_status = 'conflict' WHERE id = ?`, [id]);
  saveDatabase();
}

// Apply server row (upsert with conflict resolution)
export function applyServerRow(table: string, row: Record<string, any>): void {
  const database = getDatabase();
  const now = nowTimestamp();

  // Check existing
  const existing = database.exec(`SELECT id, updated_at, sync_status FROM ${table} WHERE id = ?`, [row.id]);

  if (existing.length > 0 && existing[0].values.length > 0) {
    const localUpdatedAt = Number(existing[0].values[0][1]);
    const localSyncStatus = String(existing[0].values[0][2]);
    const serverUpdatedAt = row.updated_at;

    // If local has pending changes and server is newer → conflict
    if (localSyncStatus === 'pending' && serverUpdatedAt > localUpdatedAt) {
      markConflict(table, row.id);
      return;
    }

    // If server is newer or local is synced → apply server data
    if (serverUpdatedAt >= localUpdatedAt || localSyncStatus === 'synced') {
      const columns = Object.keys(row);
      const values = Object.values(row);
      const setClause = columns.map(c => `${c} = ?`).join(', ');
      database.run(`UPDATE ${table} SET ${setClause}, sync_status = 'synced' WHERE id = ?`, [...values, row.id]);
    }
  } else {
    // New row from server
    row.sync_status = 'synced';
    const columns = Object.keys(row);
    const values = Object.values(row);
    const placeholders = columns.map(() => '?').join(', ');
    database.run(`INSERT OR REPLACE INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`, values);
  }

  saveDatabase();
}

// Apply deleted row from server
export function applyServerDelete(table: string, id: string, deletedAt: number | unknown, updatedAt: number | unknown): void {
  const database = getDatabase();
  database.run(
    `UPDATE ${table} SET deleted_at = ?, updated_at = ?, sync_status = 'synced' WHERE id = ?`,
    [deletedAt, updatedAt, id]
  );
  // If row doesn't exist locally, no-op
  saveDatabase();
}

// Sync log
function logSyncAction(table: string, rowId: string, action: 'insert' | 'update' | 'delete'): void {
  const database = getDatabase();
  const now = nowTimestamp();
  const deviceId = getSyncMeta('device_id') || 'unknown';
  const storeId = getSyncMeta('store_id') || '';

  database.run(
    'INSERT INTO sync_log (device_id, table_name, row_id, action, timestamp, store_id) VALUES (?, ?, ?, ?, ?, ?)',
    [deviceId, table, rowId, action, now, storeId]
  );
}

// Sync meta helpers
export function getSyncMeta(key: string): string {
  const database = getDatabase();
  const result = database.exec('SELECT value FROM sync_meta WHERE key = ?', [key]);
  if (result.length === 0 || result[0].values.length === 0) return '';
  return result[0].values[0][0] as string;
}

export function setSyncMeta(key: string, value: string): void {
  const database = getDatabase();
  database.run('INSERT OR REPLACE INTO sync_meta (key, value) VALUES (?, ?)', [key, value]);
  saveDatabase();
}

// Map SQL result row to object
function mapRow<T>(result: { columns: string[]; values: any[][] }, rowIndex: number): T {
  const obj: Record<string, any> = {};
  result.columns.forEach((col, i) => {
    obj[col] = result.values[rowIndex][i];
  });
  return obj as T;
}

// Table names for sync
export const SYNC_TABLES = [
  'products',
  'customers',
  'suppliers',
  'orders',
  'order_items',
  'payments',
  'expenses',
  'employees',
  'prescriptions',
  'categories',
];

// Reset database (for logout)
export function resetDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
  localStorage.removeItem(DB_STORAGE_KEY);
  localStorage.removeItem('agri-pos-storage'); // old zustand storage
}
