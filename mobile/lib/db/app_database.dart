import 'package:flutter/foundation.dart';
import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart' as p;
import 'package:uuid/uuid.dart';
import 'dart:convert';

class AppDatabase {
  static Database? _db;
  static const _dbName = 'agri_pos.db';
  static final Map<String, dynamic> _webStorage = {};

  static bool get isWeb => kIsWeb;

  static Future<Database?> get database async {
    if (isWeb) {
      return null; // Web doesn't use SQLite
    } else {
      _db ??= await _initDb();
      return _db!;
    }
  }

  static Future<Database> _initDb() async {
    final dbPath = await getDatabasesPath();
    final path = p.join(dbPath, _dbName);

    return openDatabase(
      path,
      version: 1,
      onCreate: _onCreate,
      onConfigure: (db) async {
        await db.execute('PRAGMA journal_mode = WAL');
        await db.execute('PRAGMA foreign_keys = ON');
      },
    );
  }

  static Future<void> _onCreate(Database db, int version) async {
    final tables = [
      '''CREATE TABLE users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        password_hash TEXT NOT NULL,
        store_id TEXT,
        role TEXT DEFAULT 'owner',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        sync_status TEXT DEFAULT 'pending'
      )''',
      '''CREATE TABLE stores (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        owner_id TEXT NOT NULL,
        phone TEXT,
        address TEXT,
        tax_rate REAL DEFAULT 14.0,
        receipt_footer TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        sync_status TEXT DEFAULT 'pending'
      )''',
      '''CREATE TABLE categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        store_id TEXT NOT NULL,
        parent_id TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        sync_status TEXT DEFAULT 'pending'
      )''',
      '''CREATE TABLE products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        barcode TEXT,
        category_id TEXT,
        store_id TEXT NOT NULL,
        buy_price REAL DEFAULT 0,
        sell_price REAL DEFAULT 0,
        unit TEXT DEFAULT 'piece',
        stock REAL DEFAULT 0,
        min_stock REAL DEFAULT 0,
        description TEXT,
        image_url TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        sync_status TEXT DEFAULT 'pending'
      )''',
      '''CREATE TABLE orders (
        id TEXT PRIMARY KEY,
        store_id TEXT NOT NULL,
        customer_id TEXT,
        employee_id TEXT,
        type TEXT DEFAULT 'sale',
        total REAL DEFAULT 0,
        discount REAL DEFAULT 0,
        tax REAL DEFAULT 0,
        paid REAL DEFAULT 0,
        status TEXT DEFAULT 'completed',
        notes TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        sync_status TEXT DEFAULT 'pending'
      )''',
      '''CREATE TABLE order_items (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        quantity REAL DEFAULT 1,
        price REAL DEFAULT 0,
        total REAL DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        sync_status TEXT DEFAULT 'pending'
      )''',
      '''CREATE TABLE customers (
        id TEXT PRIMARY KEY,
        store_id TEXT NOT NULL,
        name TEXT NOT NULL,
        phone TEXT,
        address TEXT,
        balance REAL DEFAULT 0,
        notes TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        sync_status TEXT DEFAULT 'pending'
      )''',
      '''CREATE TABLE suppliers (
        id TEXT PRIMARY KEY,
        store_id TEXT NOT NULL,
        name TEXT NOT NULL,
        phone TEXT,
        address TEXT,
        balance REAL DEFAULT 0,
        notes TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        sync_status TEXT DEFAULT 'pending'
      )''',
      '''CREATE TABLE payments (
        id TEXT PRIMARY KEY,
        store_id TEXT NOT NULL,
        order_id TEXT,
        customer_id TEXT,
        amount REAL DEFAULT 0,
        method TEXT DEFAULT 'cash',
        type TEXT DEFAULT 'in',
        notes TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        sync_status TEXT DEFAULT 'pending'
      )''',
      '''CREATE TABLE expenses (
        id TEXT PRIMARY KEY,
        store_id TEXT NOT NULL,
        category TEXT,
        amount REAL DEFAULT 0,
        description TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        sync_status TEXT DEFAULT 'pending'
      )''',
      '''CREATE TABLE employees (
        id TEXT PRIMARY KEY,
        store_id TEXT NOT NULL,
        name TEXT NOT NULL,
        phone TEXT,
        role TEXT,
        salary REAL DEFAULT 0,
        notes TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        sync_status TEXT DEFAULT 'pending'
      )''',
      '''CREATE TABLE prescriptions (
        id TEXT PRIMARY KEY,
        store_id TEXT NOT NULL,
        customer_name TEXT,
        customer_phone TEXT,
        items TEXT,
        notes TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        sync_status TEXT DEFAULT 'pending'
      )''',
      '''CREATE TABLE sync_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT NOT NULL,
        record_id TEXT NOT NULL,
        action TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        details TEXT
      )''',
      '''CREATE TABLE sync_meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )''',
    ];

    for (final sql in tables) {
      await db.execute(sql);
    }

    final indexes = [
      'CREATE INDEX idx_products_store ON products(store_id)',
      'CREATE INDEX idx_products_barcode ON products(barcode)',
      'CREATE INDEX idx_orders_store ON orders(store_id)',
      'CREATE INDEX idx_order_items_order ON order_items(order_id)',
      'CREATE INDEX idx_customers_store ON customers(store_id)',
      'CREATE INDEX idx_payments_store ON payments(store_id)',
      'CREATE INDEX idx_products_sync ON products(sync_status)',
      'CREATE INDEX idx_orders_sync ON orders(sync_status)',
      'CREATE INDEX idx_order_items_sync ON order_items(sync_status)',
      'CREATE INDEX idx_customers_sync ON customers(sync_status)',
      'CREATE INDEX idx_categories_sync ON categories(sync_status)',
      'CREATE INDEX idx_payments_sync ON payments(sync_status)',
      'CREATE INDEX idx_expenses_sync ON expenses(sync_status)',
      'CREATE INDEX idx_employees_sync ON employees(sync_status)',
      'CREATE INDEX idx_prescriptions_sync ON prescriptions(sync_status)',
    ];

    for (final sql in indexes) {
      await db.execute(sql);
    }
  }

  // ===== CRUD Helpers =====

  static String generateId() => const Uuid().v4();

  static int timestamp() => (DateTime.now().millisecondsSinceEpoch / 1000).round();

  static Future<List<Map<String, dynamic>>> query(
    String table, {
    String? where,
    List<Object?>? whereArgs,
    String? orderBy,
    int? limit,
  }) async {
    if (isWeb) {
      final key = '${table}:list';
      final data = _webStorage[key] ?? [];
      return List<Map<String, dynamic>>.from(data);
    }
    final db = await database;
    return db!.query(table, where: where, whereArgs: whereArgs, orderBy: orderBy, limit: limit);
  }

  static Future<Map<String, dynamic>?> getById(String table, String id) async {
    if (isWeb) {
      final key = '${table}:$id';
      return _webStorage[key] as Map<String, dynamic>?;
    }
    final db = await database;
    final results = await db!.query(table, where: 'id = ?', whereArgs: [id], limit: 1);
    return results.isNotEmpty ? results.first : null;
  }

  static Future<String> insert(String table, Map<String, dynamic> values) async {
    if (isWeb) {
      values['id'] = values['id'] ?? generateId();
      final now = timestamp();
      values['created_at'] = values['created_at'] ?? now;
      values['updated_at'] = values['updated_at'] ?? now;
      values['sync_status'] = values['sync_status'] ?? 'pending';
      final key = '${table}:${values['id']}';
      _webStorage[key] = values;
      final listKey = '${table}:list';
      _webStorage[listKey] = (_webStorage[listKey] ?? [])..add(values);
      return values['id'] as String;
    }
    final db = await database;
    values['id'] = values['id'] ?? generateId();
    final now = timestamp();
    values['created_at'] = values['created_at'] ?? now;
    values['updated_at'] = values['updated_at'] ?? now;
    values['sync_status'] = values['sync_status'] ?? 'pending';
    await db!.insert(table, values);
    await _logSync(table, values['id'], 'insert');
    return values['id'] as String;
  }

  static Future<void> update(String table, Map<String, dynamic> values, String id) async {
    if (isWeb) {
      values['updated_at'] = timestamp();
      values['sync_status'] = 'pending';
      final key = '${table}:$id';
      final existing = _webStorage[key] as Map<String, dynamic>? ?? {};
      final updated = {...existing, ...values};
      _webStorage[key] = updated;
      return;
    }
    final db = await database;
    values['updated_at'] = timestamp();
    values['sync_status'] = 'pending';
    await db!.update(table, values, where: 'id = ?', whereArgs: [id]);
    await _logSync(table, id, 'update');
  }


  static Future<void> softDelete(String table, String id) async {
    if (isWeb) {
      await update(table, {'deleted_at': timestamp()}, id);
      return;
    }
    final db = await database;
    final now = timestamp();
    await db!.update(
      table,
      {'deleted_at': now, 'updated_at': now, 'sync_status': 'pending'},
      where: 'id = ?',
      whereArgs: [id],
    );
    await _logSync(table, id, 'delete');
  }

  static Future<List<Map<String, dynamic>>> getPending(String table) async {
    if (isWeb) {
      final results = await query(table);
      return results.where((r) => r['sync_status'] == 'pending').toList();
    }
    final db = await database;
    return db!.query(table, where: "sync_status = 'pending'");
  }

  static Future<int> getPendingCount(String table) async {
    if (isWeb) {
      final results = await getPending(table);
      return results.length;
    }
    final db = await database;
    final result = await db!.rawQuery(
      "SELECT COUNT(*) as cnt FROM $table WHERE sync_status = 'pending'",
    );
    return result.first['cnt'] as int;
  }

  static Future<void> markSynced(String table, String id) async {
    await update(table, {'sync_status': 'synced'}, id);
  }

  static Future<void> markConflict(String table, String id) async {
    await update(table, {'sync_status': 'conflict'}, id);
  }

  static Future<void> applyServerData(String table, Map<String, dynamic> data) async {
    final existing = await getById(table, data['id'] as String);

    if (existing == null) {
      data['sync_status'] = 'synced';
      if (isWeb) {
        final key = '${table}:${data['id']}';
        _webStorage[key] = data;
        final listKey = '${table}:list';
        _webStorage[listKey] = (_webStorage[listKey] ?? [])..add(data);
      } else {
        final db = await database;
        await db!.insert(table, data);
      }
    } else {
      final serverUpdated = data['updated_at'] as int? ?? 0;
      final localUpdated = existing['updated_at'] as int? ?? 0;
      if (serverUpdated >= localUpdated) {
        data['sync_status'] = 'synced';
        await update(table, data, data['id'] as String);
      } else {
        await markConflict(table, data['id'] as String);
      }
    }
  }

  static Future<void> applyServerDelete(String table, String id, int deletedAt, int updatedAt) async {
    final existing = await getById(table, id);
    if (existing != null) {
      final localUpdated = existing['updated_at'] as int? ?? 0;
      if (updatedAt >= localUpdated) {
        await update(table, {'deleted_at': deletedAt, 'updated_at': updatedAt, 'sync_status': 'synced'}, id);
      } else {
        await markConflict(table, id);
      }
    }
  }

  // ===== Sync Meta =====

  static Future<String?> getSyncMeta(String key) async {
    if (isWeb) {
      return _webStorage['meta:$key'] as String?;
    }
    final db = await database;
    final results = await db!.query('sync_meta', where: 'key = ?', whereArgs: [key]);
    return results.isNotEmpty ? results.first['value'] as String? : null;
  }

  static Future<void> setSyncMeta(String key, String value) async {
    if (isWeb) {
      _webStorage['meta:$key'] = value;
      return;
    }
    final db = await database;
    await db!.insert(
      'sync_meta',
      {'key': key, 'value': value},
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  // ===== Sync Log =====

  static Future<void> _logSync(String table, String recordId, String action) async {
    if (isWeb) {
      return;
    }
    final db = await database;
    await db!.insert('sync_log', {
      'table_name': table,
      'record_id': recordId,
      'action': action,
      'timestamp': timestamp(),
    });
  }

  static Future<List<Map<String, dynamic>>> getSyncLog({int? limit}) async {
    if (isWeb) {
      return [];
    }
    final db = await database;
    return db!.query(
      'sync_log',
      orderBy: 'timestamp DESC',
      limit: limit,
    );
  }

  // ===== Auth Storage =====

  static Future<void> saveAuthData({
    required String token,
    required String userId,
    required String storeId,
    required String username,
  }) async {
    await setSyncMeta('auth_token', token);
    await setSyncMeta('auth_user_id', userId);
    await setSyncMeta('auth_store_id', storeId);
    await setSyncMeta('auth_username', username);
  }

  static Future<String?> get authToken => getSyncMeta('auth_token');
  static Future<String?> get authUserId => getSyncMeta('auth_user_id');
  static Future<String?> get authStoreId => getSyncMeta('auth_store_id');
  static Future<String?> get authUsername => getSyncMeta('auth_username');

  static Future<void> clearAuthData() async {
    if (isWeb) return;
    final db = await database;
    await db!.delete('sync_meta', where: "key LIKE 'auth_%'");
  }

  // ===== Dashboard Stats =====

  static Future<Map<String, dynamic>> getDashboardStats(String storeId) async {
    if (isWeb) {
      // Return mock data for web
      return {
        'todaySales': 0.0,
        'todayOrders': 0,
        'totalProducts': 0,
        'lowStock': 0,
        'totalCustomers': 0,
        'totalDebt': 0.0,
      };
    }

    final db = await database;
    final todayStart = _todayStart();

    final salesResult = await db!.rawQuery(
      "SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE store_id = ? AND type = 'sale' AND created_at >= ? AND deleted_at IS NULL",
      [storeId, todayStart],
    );

    final ordersResult = await db.rawQuery(
      "SELECT COUNT(*) as cnt FROM orders WHERE store_id = ? AND type = 'sale' AND created_at >= ? AND deleted_at IS NULL",
      [storeId, todayStart],
    );

    final productsResult = await db.rawQuery(
      "SELECT COUNT(*) as cnt FROM products WHERE store_id = ? AND deleted_at IS NULL",
      [storeId],
    );

    final lowStockResult = await db.rawQuery(
      "SELECT COUNT(*) as cnt FROM products WHERE store_id = ? AND stock <= min_stock AND deleted_at IS NULL",
      [storeId],
    );

    final customersResult = await db.rawQuery(
      "SELECT COUNT(*) as cnt FROM customers WHERE store_id = ? AND deleted_at IS NULL",
      [storeId],
    );

    final debtResult = await db.rawQuery(
      "SELECT COALESCE(SUM(balance), 0) as total FROM customers WHERE store_id = ? AND balance > 0 AND deleted_at IS NULL",
      [storeId],
    );

    return {
      'todaySales': salesResult.first['total'],
      'todayOrders': ordersResult.first['cnt'],
      'totalProducts': productsResult.first['cnt'],
      'lowStock': lowStockResult.first['cnt'],
      'totalCustomers': customersResult.first['cnt'],
      'totalDebt': debtResult.first['total'],
    };
  }

  static int _todayStart() {
    final now = DateTime.now();
    final start = DateTime(now.year, now.month, now.day);
    return (start.millisecondsSinceEpoch / 1000).round();
  }
}
