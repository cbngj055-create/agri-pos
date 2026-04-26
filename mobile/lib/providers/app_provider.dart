import 'package:flutter/material.dart';
import '../db/app_database.dart';
import '../services/sync_service.dart';

class AppProvider extends ChangeNotifier {
  bool _isLoading = false;
  String? _error;
  String? _username;
  String? _storeId;

  bool get isLoading => _isLoading;
  String? get error => _error;
  String? get username => _username;
  String? get storeId => _storeId;

  Future<void> init() async {
    _isLoading = true;
    notifyListeners();

    try {
      final loggedIn = await SyncService.isLoggedIn();
      if (loggedIn) {
        _username = await AppDatabase.authUsername;
        _storeId = await AppDatabase.authStoreId;
        await SyncService.initSyncSystem();
      }
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await SyncService.login(email, password);
      _username = await AppDatabase.authUsername;
      _storeId = await AppDatabase.authStoreId;
      await SyncService.initSyncSystem();
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> register(String username, String email, String password, String storeName) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await SyncService.register(username, email, password, storeName);
      _username = await AppDatabase.authUsername;
      _storeId = await AppDatabase.authStoreId;
      await SyncService.initSyncSystem();
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> logout() async {
    await SyncService.logout();
    _username = null;
    _storeId = null;
    notifyListeners();
  }

  // ===== Product CRUD =====

  Future<String> addProduct(Map<String, dynamic> data) async {
    if (_storeId != null) data['store_id'] = _storeId;
    final id = await AppDatabase.insert('products', data);
    return id;
  }

  Future<void> updateProduct(String id, Map<String, dynamic> data) async {
    await AppDatabase.update('products', data, id);
  }

  Future<void> deleteProduct(String id) async {
    await AppDatabase.softDelete('products', id);
  }

  Future<List<Map<String, dynamic>>> getProducts({String? search}) async {
    if (_storeId == null) return [];
    if (search != null && search.isNotEmpty) {
      return AppDatabase.query(
        'products',
        where: 'store_id = ? AND deleted_at IS NULL AND (name LIKE ? OR barcode LIKE ?)',
        whereArgs: [_storeId!, '%$search%', '%$search%'],
        orderBy: 'name ASC',
      );
    }
    return AppDatabase.query(
      'products',
      where: 'store_id = ? AND deleted_at IS NULL',
      whereArgs: [_storeId!],
      orderBy: 'name ASC',
    );
  }

  // ===== Customer CRUD =====

  Future<String> addCustomer(Map<String, dynamic> data) async {
    if (_storeId != null) data['store_id'] = _storeId;
    final id = await AppDatabase.insert('customers', data);
    return id;
  }

  Future<List<Map<String, dynamic>>> getCustomers({String? search}) async {
    if (_storeId == null) return [];
    if (search != null && search.isNotEmpty) {
      return AppDatabase.query(
        'customers',
        where: 'store_id = ? AND deleted_at IS NULL AND (name LIKE ? OR phone LIKE ?)',
        whereArgs: [_storeId!, '%$search%', '%$search%'],
        orderBy: 'name ASC',
      );
    }
    return AppDatabase.query(
      'customers',
      where: 'store_id = ? AND deleted_at IS NULL',
      whereArgs: [_storeId!],
      orderBy: 'name ASC',
    );
  }

  // ===== Order CRUD =====

  Future<String> addOrder(Map<String, dynamic> data) async {
    if (_storeId != null) data['store_id'] = _storeId;
    final id = await AppDatabase.insert('orders', data);
    return id;
  }

  Future<String> addOrderItem(Map<String, dynamic> data) async {
    final id = await AppDatabase.insert('order_items', data);
    return id;
  }

  Future<List<Map<String, dynamic>>> getOrders({int? limit}) async {
    if (_storeId == null) return [];
    return AppDatabase.query(
      'orders',
      where: 'store_id = ? AND deleted_at IS NULL',
      whereArgs: [_storeId!],
      orderBy: 'created_at DESC',
      limit: limit,
    );
  }

  // ===== Dashboard =====

  Future<Map<String, dynamic>> getDashboardStats() async {
    if (_storeId == null) return {};
    return AppDatabase.getDashboardStats(_storeId!);
  }
}
